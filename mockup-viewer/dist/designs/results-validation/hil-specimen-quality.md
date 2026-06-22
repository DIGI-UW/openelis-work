# FRS — HIL Specimen Quality (Hemolysis / Icterus / Lipemia)

**Feature:** End-to-end capture, surfacing, and audit of specimen interference (Hemolysis / Icterus / Lipemia) — analyzer ingestion → validator UI → patient report. Includes a new admin page for severity-action thresholds, extends the Generic ASTM 1.2 profile with a `specimen_quality_field_mapping` slot, and lights up the dormant HIL chip already designed in `patient-report-redesign-spec.md` §18.
**Owner:** Casey (caseyi@uw.edu)
**Date:** 2026-04-27
**Status:** Draft v1 — awaiting review.
**Supersedes:** None — first draft.
**Related patterns:** P-01 (Admin Table), P-02 (Inline row-expand edit), P-03 (Create modal), P-04 (Confirm-delete modal), P-05 (Form validation), P-06 (Empty state), P-09 (Breadcrumb + header), P-13 (Permission gate). Validator override modal mirrors the round-4 critical-value notification modal pattern from the patient-report redesign.
**Related work:** `patient-report-redesign-spec.md` §18 (HIL backend epic placeholder + dormant chip slot); spec 012 Generic ASTM 1.2 profile (extended here).

---

## 1. Overview

A marginally-hemolyzed potassium reads as a real critical hyperkalemia. Without an interference flag, the clinician treats a fake number; with one, the clinician knows to wait for a recollect. Same problem class for icterus (interferes with bilirubin and several optical-density assays) and lipemia (interferes with most photometric assays). OpenELIS has no model for these flags today — eight searches across the codebase confirmed nothing is captured anywhere, no free-text catch-all, no flag column, no profile slot.

This feature introduces the data path end-to-end:

1. **Schema** — three nullable severity columns (`hemolysis_index`, `icterus_index`, `lipemia_index`) on `result`, each `0 – 3` (absent / mild / moderate / severe), plus a free-text `specimen_quality_note` and provenance fields.
2. **Generic ASTM 1.2 profile slot** — new `specimen_quality_field_mapping` block in the per-analyzer profile YAML so deployments map their analyzer's HIL emission to the new severity scale without touching Java code. Two reference profiles ship with v1 (Roche cobas, Sysmex XN) so other deployments have a copy-paste starting point.
3. **Validator UI** — HIL chip appears next to the result value at validation time; if any interference index meets or exceeds the threshold for that test, a warn-modal at validate-time captures a typed reason for releasing the result anyway, audit-logged in a new `specimen_quality_override` table. The same row exposes a manual-entry control for analyzers whose profile hasn't been extended yet (or for analyzers that don't emit HIL natively).
4. **Admin page** — HIL Thresholds, a new Carbon `SideNav` submenu item under Test Catalog Management. Lab-wide defaults (default: warn at severity ≥ 2, chip at severity ≥ 1) plus per-test overrides for the small set of sensitive analytes (potassium, LDH, AST, free hemoglobin → warn at ≥ 1).
5. **Patient report** — the dormant HIL chip slot from the round-4 patient-report redesign (`patient-report-redesign-spec.md` §18, position `250 15 60 8`) is parameterized on `$F{specimenQualityFlags}`. When the populator surfaces a non-null value (a derived rendering of `H{x}I{y}L{z}` from the three index columns), the chip lights up across every deployment with no template change.

The behavior is inert on existing deployments until either an analyzer profile is extended or a tech enters HIL manually. No data migration required; legacy results stay null and render the chip blank — the same as today.

## 2. User Stories

- As a **lab tech at validation**, I want the HIL chip on a result row so I can see at a glance whether the specimen had interference, without hunting through the analyzer log.
- As a **lab tech at validation**, I want a warn-and-confirm modal when I try to release a result whose interference exceeds the threshold for that test, so that releasing a clinically-suspect potassium requires me to type a reason and creates an audit record.
- As a **lab tech at validation**, I want to flag interference manually on a result whose analyzer didn't emit HIL, so that older instruments and POC devices aren't a blind spot in our specimen-quality program.
- As a **lab QA lead**, I want a single admin page to set lab-wide HIL severity thresholds and override the few sensitive tests, so that "warn at ≥ 1" applies to potassium and LDH while routine chemistry stays at the default ≥ 2.
- As a **lab QA lead**, I want to know who released a result over an HIL warning, when, and why, so that audits and CAP inspections have a defensible audit trail.
- As a **deployment engineer**, I want to map my Roche cobas's OBX-8 hemolysis index to the new severity scale by editing the analyzer profile YAML, so that I don't need a code change to enable HIL on my site.
- As a **clinician reading the report**, I want a small `H+ I− L−` chip next to a flagged result so I know whether to trust an out-of-range potassium, without digging into the lab's audit trail.

## 3. Functional Requirements

### 3.1 Data model

**Columns added to `result`** (existing table):

```
hemolysis_index               SMALLINT NULL CHECK (hemolysis_index IS NULL OR hemolysis_index BETWEEN 0 AND 3)
icterus_index                 SMALLINT NULL CHECK (icterus_index IS NULL OR icterus_index BETWEEN 0 AND 3)
lipemia_index                 SMALLINT NULL CHECK (lipemia_index IS NULL OR lipemia_index BETWEEN 0 AND 3)
specimen_quality_note         TEXT     NULL                       -- free-text observation (any source)
specimen_quality_source       VARCHAR(10) NULL                    -- enum: 'ANALYZER' | 'MANUAL' | NULL when no HIL data
specimen_quality_entered_by   BIGINT NULL  REFERENCES systemuser(id)
specimen_quality_entered_at   TIMESTAMP NULL
```

Severity scale (consistent across all three indices):

| Value | Meaning | Chip rendering |
|---|---|---|
| `NULL` | not measured / not assessed | (no chip) |
| `0` | absent | `H−` (only renders if any of the three is ≥ 1; otherwise no chip at all) |
| `1` | mild | `H+` |
| `2` | moderate | `H++` |
| `3` | severe | `H+++` |

Null values mean "no data" — distinct from `0` which means "actively measured and confirmed absent." The chip shows `H− I− L−` only when at least one of the three is ≥ 1; if all three are 0 or null, the row renders no chip.

**Table: `specimen_quality_threshold`** (new) — controls when the validator warns and when the report chip renders.

```
id                  (pk)
scope               VARCHAR(10) NOT NULL          -- enum: 'GLOBAL' | 'TEST'
test_id             BIGINT NULL  REFERENCES test(id) ON DELETE CASCADE
                                                      -- NULL when scope = 'GLOBAL'; required when 'TEST'
hemolysis_warn_at   SMALLINT NOT NULL DEFAULT 2   CHECK (hemolysis_warn_at BETWEEN 1 AND 3)
icterus_warn_at     SMALLINT NOT NULL DEFAULT 2   CHECK (icterus_warn_at BETWEEN 1 AND 3)
lipemia_warn_at     SMALLINT NOT NULL DEFAULT 2   CHECK (lipemia_warn_at BETWEEN 1 AND 3)
hemolysis_chip_at   SMALLINT NOT NULL DEFAULT 1   CHECK (hemolysis_chip_at BETWEEN 1 AND 3)
icterus_chip_at     SMALLINT NOT NULL DEFAULT 1   CHECK (icterus_chip_at BETWEEN 1 AND 3)
lipemia_chip_at     SMALLINT NOT NULL DEFAULT 1   CHECK (lipemia_chip_at BETWEEN 1 AND 3)
created_on / updated_on
UNIQUE (scope, test_id)
CHECK ((scope = 'GLOBAL' AND test_id IS NULL) OR (scope = 'TEST' AND test_id IS NOT NULL))
```

A single `GLOBAL` row is seeded on install with `warn_at = 2` and `chip_at = 1` for all three indices. `TEST`-scoped rows override the global only for the indices the admin explicitly sets — see FR-15 for resolution semantics.

**Table: `specimen_quality_override`** (new) — audit log for the warn-and-confirm release flow.

```
id                              (pk)
result_id                       BIGINT NOT NULL REFERENCES result(id) ON DELETE CASCADE
override_reason                 TEXT NOT NULL
overridden_by_id                BIGINT NOT NULL REFERENCES systemuser(id)
overridden_at                   TIMESTAMP NOT NULL DEFAULT now()
hemolysis_index_at_override     SMALLINT NULL    -- snapshot of result.* at modal time
icterus_index_at_override       SMALLINT NULL
lipemia_index_at_override       SMALLINT NULL
threshold_snapshot              JSONB NULL       -- snapshot of the thresholds that were breached
INDEX (result_id), INDEX (overridden_at)
```

The snapshot fields are populated at modal-confirm time so a later threshold change doesn't retroactively change the audit's interpretation.

### 3.2 Generic ASTM 1.2 profile extension (FR-1 → FR-7)

Spec 012 (Generic ASTM 1.2 profile) gains a new top-level mapping slot. Profiles ship without it (status quo); deployments add it when their analyzer emits HIL.

| # | Requirement |
|---|---|
| FR-1 | The Generic ASTM 1.2 profile schema gains an optional top-level block named `specimen_quality_field_mapping`. The block is null/absent on existing profiles and behavior is unchanged. |
| FR-2 | The block contains up to three sub-blocks named `hemolysis`, `icterus`, `lipemia`. Each sub-block is independently optional (an analyzer that emits H but not I/L populates only `hemolysis`). |
| FR-3 | Each sub-block has the shape: `source` (enum: `OBX` \| `NTE` \| `OBR`), `field_position` (integer, 1-indexed), optional `pattern` (regex with one capture group when the value is embedded in a free-text segment), `transform` (enum: `numeric_to_severity` \| `code_to_severity` \| `passthrough`), and optional `transform_config` (transform-specific parameters). |
| FR-4 | The `numeric_to_severity` transform takes a `thresholds: [t1, t2, t3]` config and maps an input value `v` to severity `0` if `v < t1`, `1` if `t1 ≤ v < t2`, `2` if `t2 ≤ v < t3`, `3` if `v ≥ t3`. Used for analyzers that emit a numeric interference index (Roche cobas H-index 0..1000+, Sysmex XN). |
| FR-5 | The `code_to_severity` transform takes a `mapping` config (`{"absent": 0, "mild": 1, "moderate": 2, "severe": 3}` or vendor-specific codes like `{"-": 0, "+": 1, "++": 2, "+++": 3}`). Used for analyzers that emit categorical codes. |
| FR-6 | The `passthrough` transform requires the analyzer to emit `0..3` directly. Used when a deployment maps its ingest at the analyzer middleware layer. |
| FR-7 | The generic ASTM/HL7 parser reads the slot at parse time, applies the transform per the profile, and writes the resulting severity (or null if the field is absent or the transform fails) to `result.hemolysis_index` / `icterus_index` / `lipemia_index` and sets `specimen_quality_source = 'ANALYZER'`. Transform failures are logged at WARN level and the column stays null — they do not block the result from being parsed. |

**Two reference profiles ship with v1:**

- **Roche cobas c311** — `cobas-c311-profile.yaml` extended with `numeric_to_severity` against OBX-8 for hemolysis (thresholds `[50, 100, 200]`), icterus (thresholds `[10, 30, 60]`), and lipemia (thresholds `[50, 150, 300]`). Threshold values sourced from the Roche EP07 interference reference.
- **Sysmex XN-1000** — `sysmex-xn-profile.yaml` extended with `code_to_severity` against NTE segments carrying interference codes (`{"H-": 0, "H+": 1, "H++": 2, "H+++": 3}` etc).

These are starting-point references. Deployments using either analyzer SHOULD validate the thresholds against their own assay verification data; the generic threshold values are conservative defaults.

### 3.3 Validator UI: chip + warn-modal + manual entry (FR-8 → FR-14)

| # | Requirement |
|---|---|
| FR-8 | On every result row in the validator (Result Review / Validation page), a Carbon `Tag` chip renders in the row immediately after the result value when at least one of `hemolysis_index`, `icterus_index`, `lipemia_index` is `≥ 1`. Format: `H{glyph} I{glyph} L{glyph}` where each glyph is `+` / `++` / `+++` for severity 1 / 2 / 3 and `−` for 0; null indices render as `−`. Tag `kind`: `warm-gray` for max severity 1, `purple` for max severity 2, `red` for max severity 3. |
| FR-9 | Clicking the HIL chip opens a popover (Carbon `Tooltip`-style) showing each interference type, its severity in plain language ("Mild hemolysis", "Severe lipemia"), the source (`From analyzer` / `Entered manually by [name] at [time]`), and the optional note. |
| FR-10 | At validate-time, when a tech clicks "Validate" on a result whose any-of-three indices meets or exceeds the threshold (`≥ warn_at` per the resolved threshold from FR-15), a Carbon `Modal` opens with: result identification, a summary of the offending interference(s) and their threshold(s), a required `TextArea` for the release reason (min 8 characters), and two buttons — primary `Override and release`, secondary `Cancel — return to validator`. The modal is non-dismissable via Esc or backdrop click; the tech must explicitly Cancel or Override. |
| FR-11 | When the tech submits the modal, the release proceeds and a `specimen_quality_override` row is written with the typed reason, the user, the timestamp, and the index + threshold snapshot. The result then completes validation as normal. The override does not modify the index columns — only records that the threshold was breached and accepted. |
| FR-12 | When the tech cancels, the modal closes and the result remains in unvalidated state. No audit row is written (the cancel is a no-op). |
| FR-13 | A row whose analyzer didn't populate any HIL index (`specimen_quality_source IS NULL`) shows a small ghost-style "Add HIL" button next to the result value (visible only to users with `RESULT_VALIDATE`). Clicking opens an inline row-expand panel with: three `NumberInput`s (label `Hemolysis` / `Icterus` / `Lipemia`, range `0–3`, default empty), an optional `TextArea` for note, and `Apply` / `Cancel`. On Apply, the three indices are written, `specimen_quality_source = 'MANUAL'`, `specimen_quality_entered_by` and `_at` are set. |
| FR-14 | Manual-entry data is treated identically to analyzer-emitted data downstream — same chip, same threshold evaluation at validate-time, same warn-modal trigger, same report rendering. The only difference is the `specimen_quality_source` value (visible in the chip's popover, FR-9). |

### 3.4 Admin: HIL Thresholds page (FR-15 → FR-21)

Lives at `/admin/test-catalog/hil-thresholds` as a SideNav submenu item under **Test Catalog Management**, alongside the existing test-accreditation pages. Permission: `TEST_CATALOG_MANAGE` (existing — no new scope).

| # | Requirement |
|---|---|
| FR-15 | Threshold resolution at validate-time and report-render-time: for a given `(test, interference_type)`, look up the `TEST`-scoped row for that test; if any of its `hemolysis_warn_at` / `icterus_warn_at` / `lipemia_warn_at` (and `chip_at` siblings) is non-null, use it; otherwise fall through to the `GLOBAL` row's value. The `GLOBAL` row is guaranteed to exist (seeded on install) so resolution always returns a value. |
| FR-16 | The HIL Thresholds page renders a single P-01 Admin Table. The first row is always the `GLOBAL` defaults (highlighted with a subtle background and an "(applies to all tests not overridden below)" caption). Subsequent rows are `TEST` overrides, sortable by Test code. |
| FR-17 | The `GLOBAL` row is editable inline (P-02 row-expand) but cannot be deleted. Editing exposes six `NumberInput`s (warn-at and chip-at for each of H/I/L, range 1–3) with helper text "Warn-at must be ≥ chip-at." Validation (FR-19) enforces this. |
| FR-18 | A toolbar primary action **"Add per-test override"** opens a P-03 Create modal: select Test (`ComboBox`, search by code/name), then six `NumberInput`s with the global defaults pre-filled. The admin only edits the inputs they want to override; the form persists with all six values (the per-test row stores all six even if only one was changed — simpler resolution semantics per FR-15). The modal validates uniqueness on `test_id`; if a row already exists for that test, an inline error links to the existing row. |
| FR-19 | Validation enforced both client-side and server-side: each `chip_at` ∈ `{1,2,3}`; each `warn_at` ∈ `{1,2,3}`; `warn_at ≥ chip_at` for each interference type. Violations show inline errors (P-05) under the relevant `NumberInput`. |
| FR-20 | Per-test rows are editable inline (P-02 row-expand) and deletable (P-04 confirm-delete). Deletion removes only the override; the test reverts to the `GLOBAL` defaults at next validate or render. |
| FR-21 | Empty state: when no per-test overrides exist, the page shows the `GLOBAL` row only and a P-06 prompt: "Most labs need overrides for tests sensitive to interference (potassium, LDH, AST, free hemoglobin). Add an override above to fine-tune thresholds for a specific test." |

### 3.5 Patient report rendering (FR-22 → FR-25)

| # | Requirement |
|---|---|
| FR-22 | The `PatientReportBean` populator renders `specimenQualityFlags` per result as a single string of the form `H{g}I{g}L{g}` where each `g` is `+`, `++`, `+++`, or `−`. Returns `null` (not an empty string) when all three indices are `0` or `NULL` so the existing JRXML `printWhenExpression` from `patient-report-redesign-spec.md` §7.5 suppresses the chip cleanly. |
| FR-23 | The chip is rendered iff the resolved `chip_at` threshold for that test is met or exceeded by at least one of the three indices. Rows with all interferences below their `chip_at` thresholds render no chip (per FR-22's null return). |
| FR-24 | The chip's appearance on the report is governed by the existing patient-report redesign spec §7.5 (position `250 15 60 8`, HilChip style, 7pt mono on yellow `#fff8c5`). This FRS does not modify the JRXML. |
| FR-25 | When a result row also displays a critical-value chip (HH/LL per `patient-report-redesign-spec.md` §7.5 round 3), both chips render on the same row — the CRITICAL chip from the result-value cell and the HIL chip from the method-sub-line cell. They do not collide; the HIL chip occupies the previously-empty right side of the method-sub-line band. |

### 3.6 What spec 012 changes

The Generic ASTM 1.2 profile spec (spec 012) gains:

- A new `### 4.X Specimen quality field mapping` section documenting the `specimen_quality_field_mapping` block and its three transforms (`numeric_to_severity`, `code_to_severity`, `passthrough`).
- An update to the parser's "field extraction loop" diagram showing the new branch.
- Two new appendix entries: `Appendix B-1` (Roche cobas reference profile excerpt) and `Appendix B-2` (Sysmex XN reference profile excerpt).

This FRS is the source for those changes; spec 012 is updated in the same PR.

## 4. API Surface (sketch)

| Method | Path | Purpose | Permission |
|---|---|---|---|
| `GET` | `/api/admin/hil-thresholds` | List `GLOBAL` row + all `TEST` overrides | `TEST_CATALOG_MANAGE` |
| `PATCH` | `/api/admin/hil-thresholds/global` | Update the `GLOBAL` row's six values | `TEST_CATALOG_MANAGE` |
| `POST` | `/api/admin/hil-thresholds` | Create a `TEST` override | `TEST_CATALOG_MANAGE` |
| `PATCH` | `/api/admin/hil-thresholds/{id}` | Update a `TEST` override | `TEST_CATALOG_MANAGE` |
| `DELETE` | `/api/admin/hil-thresholds/{id}` | Delete a `TEST` override | `TEST_CATALOG_MANAGE` |
| `GET` | `/api/results/{resultId}/specimen-quality` | Fetch HIL data + resolved thresholds for a single result (used by the validator chip popover) | `RESULT_VALIDATE` |
| `PUT` | `/api/results/{resultId}/specimen-quality` | Manual-entry write — body: `{hemolysis_index, icterus_index, lipemia_index, note}` | `RESULT_VALIDATE` |
| `POST` | `/api/results/{resultId}/specimen-quality/override` | Record a warn-modal override; body: `{override_reason}`; server snapshots indices and thresholds | `RESULT_VALIDATE` |

The patient-report rendering service reads the result columns and the threshold table directly — no new endpoint on the render path.

## 5. Validation Rules

- Each severity index: integer `0–3` or null. Null and `0` are semantically distinct.
- `specimen_quality_source` ∈ `{'ANALYZER', 'MANUAL', NULL}`. Cannot be `MANUAL` if no entered_by/at provided.
- Threshold values: integer `1–3` only (you can't warn at "absent"). `warn_at ≥ chip_at` enforced both client and server.
- Threshold scope: exactly one `GLOBAL` row exists; deletion of the `GLOBAL` row is rejected with HTTP 409.
- Override reason: non-empty, ≥ 8 characters, ≤ 1000 characters.
- Manual-entry validation: at least one of the three indices must be non-null on submit (otherwise the user clicked Apply with nothing entered).
- Profile slot validation (at profile-load time): if `transform = numeric_to_severity`, `transform_config.thresholds` must be a 3-element ascending integer array. If `transform = code_to_severity`, `transform_config.mapping` must be an object with values `0..3`. Invalid profile config logs at ERROR and the analyzer ingest continues without the HIL slot.

## 6. Edge Cases

| Case | Expected behavior |
|---|---|
| Analyzer profile has `specimen_quality_field_mapping` but the OBX-8 field is empty for a given result | All three indices stay null; `specimen_quality_source` stays null. No chip, no warn modal. (Field absence ≠ severity 0.) |
| Profile transform fails (e.g. non-numeric value where `numeric_to_severity` expects a number) | Index column stays null; WARN log with profile path + raw value. Result completes parsing normally. |
| Tech enters HIL manually on a result that later receives a delayed analyzer-emitted HIL value | Manual entry wins (LWW) until the next manual update; analyzer overwrite blocked when `specimen_quality_source = 'MANUAL'`. Profile parser checks source before writing and skips manually-entered rows. |
| Tech clicks "Validate" on a row with no HIL data and no warning required | Standard validate flow; no modal, no audit. |
| Threshold resolution: `TEST` row exists but only the `hemolysis_warn_at` is set (others null) | Per FR-18 the per-test row stores all six values; "null" isn't possible at storage level. The admin UI surfaces the per-test row with the global defaults pre-filled, so a row that "only changes hemolysis" still has the global I and L values copied in. |
| `GLOBAL` thresholds changed after a result was validated | The validator and report use thresholds at the moment of evaluation. A previously-overridden result keeps its `specimen_quality_override` audit (with snapshot) intact. |
| Result has hemolysis 3 but the test is glucose with `hemolysis_warn_at = 3` (loose for glucose) | Modal triggers (3 ≥ 3). The threshold can be set to absurd values to suppress; setting `warn_at = 3` means "only warn on severe." There's no "never warn" — the lab must use `RESULT_VALIDATE` permission policy if they want a no-warn route for some users. |
| Profile defines `transform: passthrough` but the value is `7` | Out-of-range; parse fails per FR-7; index stays null. |
| Sample produces 12 results, only 3 are interference-sensitive tests | Each result row independently resolves its own threshold per FR-15. The 3 sensitive tests warn at lower thresholds; the 9 routine tests use `GLOBAL`. Per-result granularity (Stage-1 answer) makes this Just Work. |
| User without `RESULT_VALIDATE` views the validator | Chip is visible (read-only); manual-entry "Add HIL" button is hidden; warn-modal is unreachable because they can't validate at all. |
| Two techs simultaneously open the warn-modal on the same result | Optimistic concurrency: the second tech's submit returns 409 if the first already validated; the modal shows "This result was just validated by [first user]." No double audit row. |
| Bulk-validate flow (when present in OpenELIS) hits multiple HIL-warned results | Each warned row triggers its own modal in sequence; no bulk-skip option. Acceptable for v1; bulk-skip with bulk-reason would be a follow-up. |

## 7. Out of Scope

- **Auto-rejection of severe interference.** v1 uses warn-and-confirm; auto-reject is deferred. If a deployment wants auto-reject, the validator can be configured at the access-control level to deny `RESULT_VALIDATE` for severe-interference results — but this is policy, not feature.
- **Block-on-severe permission gate.** No new permission like `RESULT_VALIDATE_OVERRIDE_INTERFERENCE` is introduced. `RESULT_VALIDATE` covers both the normal and the override paths — same role.
- **Backfilling legacy results with HIL data.** Existing rows stay null. No Liquibase data migration.
- **HIL on referred-out results.** When a test is sent to a receiving lab, the home lab does not own the receiving lab's interference assessment. Out of scope (same rationale as receiving-lab accreditation in `patient-report-redesign-spec.md` §14(c)).
- **Per-method threshold storage.** The threshold table keys on `(scope, test_id)`, not method. If a test runs on two methods with different interference profiles, the lab picks the more conservative threshold for the test. Per-method thresholds depend on the in-flight Reporting Ranges by Method epic and would extend this feature post-launch.
- **CSV import / export of thresholds.** UI-only.
- **Email / in-app notification when many overrides cluster on a single test.** Useful for QC trending but out of v1; the audit table supports a follow-up reporting feature.
- **Bulk-skip with bulk-reason on the warn modal.** v1 forces one-at-a-time confirmation. Bulk-skip is a follow-up if real-world usage shows excessive friction.

## 8. Acceptance Criteria (traced to requirements)

1. [FR-1, FR-7] **Given** a Roche cobas profile extended with `specimen_quality_field_mapping.hemolysis = {source: OBX, field_position: 8, transform: numeric_to_severity, transform_config: {thresholds: [50, 100, 200]}}`, **when** the analyzer emits an OBX-8 value of `145`, **then** `result.hemolysis_index = 2` and `result.specimen_quality_source = 'ANALYZER'`.
2. [FR-7] **Given** a profile transform that fails (non-numeric input to `numeric_to_severity`), **when** the parser processes the result, **then** the result row is created with all three indices null, the source null, and a single WARN log entry is emitted naming the profile path and raw value.
3. [FR-8, FR-9] **Given** a result with `hemolysis_index = 2`, `icterus_index = 0`, `lipemia_index = NULL`, **when** the validator screen renders, **then** the chip displays `H++ I− L−` with Carbon `Tag kind="purple"`. Hovering the chip reveals "Moderate hemolysis. Icterus absent. Lipemia not measured. From analyzer."
4. [FR-10, FR-11] **Given** a potassium result with `hemolysis_index = 2` and a per-test override of `hemolysis_warn_at = 1`, **when** the tech clicks Validate, **then** a modal opens asking for a release reason. After the tech types "Sample recollection refused by patient — releasing with note." and clicks Override, the result validates and a `specimen_quality_override` row is written with reason, user, timestamp, and snapshot of `hemolysis_index = 2` + `threshold_snapshot.hemolysis_warn_at = 1`.
5. [FR-12] **Given** the warn modal is open, **when** the tech clicks Cancel, **then** the modal closes, no audit row is written, and the result remains unvalidated.
6. [FR-13, FR-14] **Given** a result with `specimen_quality_source IS NULL` (no analyzer-emitted HIL), **when** the tech clicks "Add HIL", types `hemolysis_index = 1`, leaves `icterus` and `lipemia` blank, and clicks Apply, **then** the result row is updated to `hemolysis_index = 1, icterus_index = NULL, lipemia_index = NULL, specimen_quality_source = 'MANUAL', specimen_quality_entered_by = current_user.id`. The chip now renders `H+ I− L−` with kind `warm-gray`. (Treating `−` rendering for null as identical to `−` for 0 is a deliberate UI choice — only the popover distinguishes the two.)
7. [FR-15] **Given** the GLOBAL row has `hemolysis_warn_at = 2` and a TEST override for potassium has `hemolysis_warn_at = 1`, **when** a hemolysis-1 potassium result is validated, **then** the per-test threshold applies and the warn modal triggers. **And when** a hemolysis-1 glucose result is validated, **then** the global threshold applies and no modal triggers.
8. [FR-17, FR-19] **Given** the HIL Thresholds admin page, **when** the QA lead expands the GLOBAL row and sets `hemolysis_chip_at = 2` while `hemolysis_warn_at = 1`, **then** an inline error appears under the warn-at input: "Warn-at must be ≥ chip-at." Save is disabled.
9. [FR-18] **Given** the HIL Thresholds page, **when** the QA lead clicks "Add per-test override", picks "Potassium (POT)", changes only `hemolysis_warn_at` to 1, and saves, **then** a new row appears with potassium showing all six threshold values (the five unchanged ones equal the global's current values).
10. [FR-20] **Given** a per-test override for potassium, **when** the QA lead deletes it via the row-expand panel, **then** the row disappears from the table; subsequent potassium results resolve thresholds from GLOBAL.
11. [FR-22, FR-23, FR-24, FR-25] **Given** a patient report row for potassium with `hemolysis_index = 2` and a critical HH alert, **when** the report renders, **then** the row shows: critical visual treatment per `patient-report-redesign-spec.md` §7.5 round 3 (6pt rule, ⇈ glyph, CRITICAL chip in the result cell), AND a separate `H++ I− L−` chip in the method-sub-line cell (yellow `#fff8c5` background, mono 7pt). Both render on the same row without collision.
12. [FR-3 — permission] **Given** a user without `TEST_CATALOG_MANAGE`, **when** they navigate to `/admin/test-catalog/hil-thresholds`, **then** access is refused (consistent with other `TEST_CATALOG_MANAGE`-gated admin pages).
13. **Profile null-safety:** Given a deployment whose analyzer profile lacks `specimen_quality_field_mapping`, **when** any result is parsed, **then** all three indices stay null, the validator chip does not render, and the patient report chip does not render. Behavior is identical to pre-feature deployment.

## 9. Localization Keys

| Key | English fallback |
|---|---|
| `admin.testCatalog.hil.nav.thresholds` | "HIL thresholds" (SideNav submenu item label) |
| `admin.testCatalog.hil.thresholds.heading` | "HIL specimen-quality thresholds" (page H2) |
| `admin.testCatalog.hil.thresholds.desc` | "Set lab-wide and per-test thresholds for hemolysis, icterus, and lipemia. Thresholds determine when a result row shows the HIL chip and when releasing the result requires a typed reason." |
| `admin.testCatalog.hil.thresholds.globalRow` | "GLOBAL — applies to all tests not overridden below" |
| `admin.testCatalog.hil.thresholds.addOverride` | "Add per-test override" |
| `admin.testCatalog.hil.thresholds.col.test` | "Test" |
| `admin.testCatalog.hil.thresholds.col.hChip` | "H chip ≥" |
| `admin.testCatalog.hil.thresholds.col.hWarn` | "H warn ≥" |
| `admin.testCatalog.hil.thresholds.col.iChip` | "I chip ≥" |
| `admin.testCatalog.hil.thresholds.col.iWarn` | "I warn ≥" |
| `admin.testCatalog.hil.thresholds.col.lChip` | "L chip ≥" |
| `admin.testCatalog.hil.thresholds.col.lWarn` | "L warn ≥" |
| `admin.testCatalog.hil.thresholds.field.warnGteChip` | "Warn-at must be ≥ chip-at." |
| `admin.testCatalog.hil.thresholds.empty.title` | "Most labs need overrides for sensitive tests" |
| `admin.testCatalog.hil.thresholds.empty.body` | "Tests sensitive to interference (potassium, LDH, AST, free hemoglobin) typically use stricter thresholds. Add a per-test override above to fine-tune." |
| `validator.hil.chipAria` | "Specimen quality: hemolysis [hSeverity], icterus [iSeverity], lipemia [lSeverity]." |
| `validator.hil.severity.absent` | "absent" |
| `validator.hil.severity.mild` | "mild" |
| `validator.hil.severity.moderate` | "moderate" |
| `validator.hil.severity.severe` | "severe" |
| `validator.hil.severity.notMeasured` | "not measured" |
| `validator.hil.popover.fromAnalyzer` | "From analyzer" |
| `validator.hil.popover.fromManual` | "Entered manually by [name] at [time]" |
| `validator.hil.addHilCta` | "Add HIL" |
| `validator.hil.manual.heading` | "Add specimen-quality flags" |
| `validator.hil.manual.hLabel` | "Hemolysis" |
| `validator.hil.manual.iLabel` | "Icterus" |
| `validator.hil.manual.lLabel` | "Lipemia" |
| `validator.hil.manual.severityHelp` | "0 = absent, 1 = mild, 2 = moderate, 3 = severe. Leave blank for 'not measured'." |
| `validator.hil.manual.note` | "Note (optional)" |
| `validator.hil.manual.apply` | "Apply" |
| `validator.hil.manual.cancel` | "Cancel" |
| `validator.hil.warnModal.title` | "Specimen quality threshold exceeded" |
| `validator.hil.warnModal.body` | "This result has [interference summary] which exceeds the threshold for [test name]. Releasing the result requires a typed reason for the audit log." |
| `validator.hil.warnModal.reason` | "Release reason (required)" |
| `validator.hil.warnModal.reasonPlaceholder` | "e.g. Sample recollection refused by patient; result released with clinical note." |
| `validator.hil.warnModal.override` | "Override and release" |
| `validator.hil.warnModal.cancel` | "Cancel — return to validator" |
| `report.hil.chipAria` | "Specimen quality flags." |

## 10. Dependencies

- Existing admin layout shell (Carbon `SideNav`, breadcrumb, page header) for the new HIL Thresholds route. Adds one `SideNavMenuItem` under the existing Test Catalog Management `SideNavMenu`.
- Existing audit log mechanism for admin CRUD on threshold rows.
- Existing Validator (Result Review) screen for the chip + warn modal + manual-entry expansion.
- Existing `RESULT_VALIDATE` permission scope (no new scope for the validator override).
- Existing `TEST_CATALOG_MANAGE` permission scope (no new scope for the admin page).
- Generic ASTM 1.2 profile framework (spec 012). This FRS extends spec 012; both ship together.
- Patient report bean populator (`patient-report-redesign-spec.md` §18) lights up via FR-22.

## 11. Rollout

- On deploy: Liquibase changesets add the three index columns (nullable, defaulted null) and the new threshold + override tables. The `GLOBAL` threshold row is seeded by the changeset with `warn_at = 2, chip_at = 1` for all three interferences.
- Existing analyzer profiles do not have `specimen_quality_field_mapping`; behavior identical to pre-feature.
- A deployment activates HIL by either (a) editing the analyzer profile YAML to add the slot or (b) using the manual-entry path on the validator. No code change, no restart.
- No feature flag — the feature is inert until threshold-relevant data exists.
- Two reference profiles (Roche cobas, Sysmex XN) ship with the v1 PR for deployments to copy.

## 12. Follow-ups (deliberately deferred)

- **Auto-reject on severe interference** with admin-configurable per-test toggle.
- **Bulk-skip / bulk-override** on the warn modal for batch-validate workflows.
- **Per-method thresholds** once Reporting Ranges by Method ships.
- **HIL trending dashboard** — aggregate `specimen_quality_override` by test / week / shift to spot QC drift.
- **Email / Slack notification** when overrides exceed a configured rate (e.g. > 5% of potassium results in 24 h).
- **CSV import / export of thresholds** for sites that maintain accreditation-package-level threshold definitions.
- **Reagent-substitution disclosure** combined with HIL into a unified specimen-quality view.
- **Receiving-lab interference assessment** for referred-out results (depends on a broader external-lab data model — out of this and the patient-report redesign).
