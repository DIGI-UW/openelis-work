# S-05 â Regulation-Scoped Reference Ranges
## Functional Requirements Specification â v2.0

**Version:** 2.0 (significant rewrite of v1.0)
**Date:** 2026-04-26
**Status:** Draft for Review
**Jira:** [OGC-547](https://uwdigi.atlassian.net/browse/OGC-547) (under epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Related:** S-01 Compliance Standards Admin (OGC-528), S-03 v2.0 Order Entry (OGC-537), S-06 Laporan Hasil (OGC-552), S-05a Reusable Categorical Result Vocabulary (split out from v1.0)
**Supersedes:** v1.0 â original framed compliance evaluation as a parallel engine with new `ComplianceEvaluation` entity, dedicated evaluator, and regulation banner on the results screen. Per the 2026-04-26 design review, that framing was overdesigned. v2.0 reframes compliance evaluation as a reference-range scope dimension (like age/sex), not a new engine.

---

## 1. Overview

OpenELIS already has a reference-range mechanism that drives the per-result green/yellow/red indicator on the results entry page. The existing `evaluateResult()` function compares numeric values against a `referenceRange` row scoped by test (and optionally sample type, age, sex). Result entry shows the indicator inline next to each result; validation displays the same indicator at sign-off.

**S-05 v2.0 adds two new scope dimensions to that existing mechanism: compliance standard and component.** When a regulation-driven order is in scope, the evaluator looks for reference range rows matching each of the order's selected `complianceStandardIds`. If the test is multi-component (e.g., noise pollution = headingÂ° + dB level), the evaluator looks up a range per component independently. The existing fallback chain (regulation-specific â demographic â generic â no flag) holds.

This means **no new entity, no new evaluator, no new audit trail, no new UI banner, no parallel evaluation pattern**. Just two nullable scope columns on `referenceRange` and a slightly extended lookup query.

> **â ï¸ 2026-04-28 amendment â multi-regulation + multi-component.**
> - **Multi-regulation:** S-03 v2.0 was amended same day to support â¥1 compliance standard per order via the `order_compliance_standard` join. The S-05 evaluator now runs the range lookup **once per selected standard**, returning N flags per result (one per regulation). The result entry inline indicator shows them **side-by-side** when more than one applies. Threshold-source annotation in expanded result detail becomes a list (one line per regulation that returned a flag).
> - **Multi-component:** Tests may produce N labelled values per result instance (e.g., headingÂ° + dB level). Component definitions live on the test catalog (Casey's parallel thread); S-05 just consumes them. `referenceRange` gains a nullable `component_id` so the same regulation can have different ranges for the heading vs the dB level. Result entry renders one input row per component; each evaluates independently.
> - **Repeated readings:** A test instance may produce multiple tuples of components (e.g., a noise survey takes N readings around a building, each producing headingÂ° + dB). These ride OE's existing `result` row pattern (Option Î± from the design call) â multiple result rows tied by a `reading_group_id`, each row carrying a component reference. S-05's evaluator runs per (reading, component, regulation) â same lookup chain, just iterated.

## 2. What Changed from v1.0

| v1.0 element | v2.0 disposition |
|---|---|
| `ComplianceEvaluation` entity (new) | â Dropped â existing `Result.normalFlag` + result-eval audit trail covers it |
| `evaluateCompliance()` function (new, parallel to `evaluateResult()`) | â Dropped â `evaluateResult()` becomes regulation-aware via scope |
| 3-tier Pass/Marginal/Fail classification | ð Mapped to existing `Normal/Abnormal/Critical` flags â no new visual language |
| Configurable marginal zone (% per threshold) | â Kept â implemented as a column on `referenceRange` (existing or new) |
| Unit conversion engine | â Kept â same hardcoded conversion table approach as v1.0 |
| Regulation banner on results entry screen | â Dropped â per-result inline indicator only |
| Compliance summary section in expanded result detail | â Kept (lighter form) â shows the threshold source ("PP No. 22/2021 â â¤ 25 NTU") in the expanded view |
| Descriptive tag library | ð Split out to **S-05a Reusable Categorical Result Vocabulary** |
| Version-lock semantics (eval uses standard version stored at order time) | â Kept â `referenceRange` lookup uses the order's stored `complianceStandardVersion` |
| API endpoints | ð Reduced â no separate evaluation endpoint; threshold lookup folded into existing result entry endpoints |

## 3. Scope

**In scope:**
- Add `compliance_standard_id` (nullable FK to `compliance_standard.id`) to existing `referenceRange` table
- Add `compliance_standard_version` (nullable string) to lock to the standard version snapshot at order time
- Update `evaluateResult()` to prefer regulation-scoped ranges when the order has a `complianceStandardId` set
- Fall-back chain: regulation-scoped range â demographic-scoped range â generic test range â no flag
- Reference range admin UI gains a "Compliance Standard" filter dropdown (NULL = generic, otherwise pick a standard)
- Expanded result detail shows the threshold source line ("PP No. 22/2021 â â¤ 25 NTU")
- Marginal zone per range row (existing approach, just stored on the new column variant)

**Out of scope:**
- Descriptive / categorical observations (qualitative tags) â **S-05a**
- Compliance dashboards and reporting â S-07 / S-06 (consume the same flag the existing pattern already produces)
- Override workflow with audit trail â existing OE override on results entry already provides this
- New permission keys â `referenceRange.edit` already exists

## 4. Functional Requirements

### 4.1 Data Model Sources (rewritten 2026-04-29)

> **2026-04-29 reconciliation.** Earlier S-05 v2.0 drafts proposed extending `referenceRange` with a `compliance_standard_id` column. That conflicted with S-01 v1.1, which already defines a separate `ComplianceThreshold` entity for regulation-scoped thresholds. We resolved this in favor of S-01: regulation-scoped thresholds live on `ComplianceThreshold`; standalone (non-regulation) ranges live on `referenceRange`. S-05's evaluator consumes both â it does **not** propose a schema change.

**FR-01 (rewritten 2026-04-29).** S-05 v2.0 introduces **no schema changes**. It depends on two existing entities, owned by other specs:

| Source table | Owner spec | Used for | Notes |
|--------------|-----------|----------|-------|
| `ComplianceThreshold` | S-01 v1.1 Â§4.3, Â§5 | Regulation-scoped thresholds (per test, per standard, per parameter group) | Threshold types: Maximum, Minimum, Range, Descriptive. Borderline values added in S-01 v1.2 â see S-01 Â§4.3 (Â§FR-3-011 to Â§FR-3-013). |
| `referenceRange` | Existing OE | Standalone (non-regulation) reference ranges | Unchanged. Single range per (test, sample_type, demographic). |

The two paths (regulation vs. standalone) are mutually exclusive at evaluation time â the evaluator picks one based on whether the order has compliance standards selected (see Â§4.2).

### 4.2 Evaluator Lookup Order (rewritten 2026-04-29)

> **2026-04-29 reconciliation.** Path A consumes `ComplianceThreshold` rows (S-01); Path B consumes `referenceRange` rows (existing OE). The two pools are mutually exclusive â regulation supersedes standalone.

**FR-02.** `evaluateResult(test, sample, value, component, order)` SHALL evaluate the result against the applicable threshold pool.

**Path A â Regulation-scoped (when `order_compliance_standard` is non-empty):**

For each selected compliance standard on the order (read from `order_compliance_standard` join):

1. Look up `ComplianceThreshold` rows matching `(test_id, compliance_standard_id, compliance_standard_version)` where `compliance_standard_version` is that standard's snapshotted version (taken at order creation per S-03 v2.0 Â§5.1.5).
2. For each matching threshold, evaluate the result against the threshold's type:
   - **Maximum:** PASS if `value â¤ thresholdValue`; FAIL if `value > thresholdValue`. BORDERLINE if `value` is in the standard's borderline window for this threshold.
   - **Minimum:** PASS if `value â¥ thresholdValue`; FAIL if `value < thresholdValue`. BORDERLINE within the borderline window.
   - **Range:** PASS if `lowerValue â¤ value â¤ upperValue`; FAIL otherwise. BORDERLINE within the borderline window of either edge.
   - **Descriptive:** match `value` against `thresholdValue` (categorical comparison). If `value` is in `borderlineValues`, emit BORDERLINE. Otherwise PASS or FAIL per match.
3. Emit one tuple `(status, regName)` per ComplianceThreshold matched.
4. If no ComplianceThreshold rows match for a given standard for this test/component: emit `(INFO, regName)` â informational, no threshold applies.

The `referenceRange` pool is **not** consulted in Path A.

**Path B â Standalone (when `order_compliance_standard` is empty, e.g., ad-hoc branch or non-env order):**

5. Demographic-scoped `referenceRange` matching `(test_id, component_id, sample_type_id, age_range, sex)` â existing OE clinical flag (Normal / Abnormal / Critical).
6. Generic `referenceRange` matching `(test_id, component_id)` â existing OE clinical flag.
7. If nothing matched: return no flag.

`component_id` is NULL for single-component tests (existing OE behavior). For multi-component tests, the evaluator runs the applicable path once per component.

**The function returns a list of `(status, source)` tuples** â Path A emits one tuple per matched ComplianceThreshold (typically one per selected regulation); Path B emits zero or one tuple from the `referenceRange` pool. The two paths never mix on the same evaluation.

### 4.3 Reference Range Admin â Standalone Only (rewritten 2026-04-29)

> **2026-04-29 split.** The existing OE Reference Range Admin page only manages **standalone** (compliance_standard_id IS NULL) reference ranges. **Regulation-scoped reference ranges are managed in the regulation admin (S-01 Compliance Standard Admin)** as part of editing a compliance standard. This split keeps the existing admin clean for clinical use, and gives standard editors one screen to manage everything regulation-related (metadata + version + ranges + borderline proximity + linked tests).

**FR-03 (rewritten 2026-04-29).** The existing OE Reference Range Admin page SHALL be unchanged in scope: it lists, edits, and creates **standalone** reference ranges only (rows where `compliance_standard_id IS NULL`). No new column, no new filter for compliance standard. Each test displays a single range row (or sample-type-scoped + demographic-scoped variants per existing OE behavior).

A small banner at the top of the page SHALL explain: *"To manage reference ranges scoped to a regulation, use Compliance Standard Admin â Edit Standard â Ranges (see S-01)."* with a link.

Adding regulation-scoped ranges through the existing admin is not supported â those rows are owned by S-01's Compliance Standard editor.

**FR-03a (new 2026-04-29).** Reference range rows on `referenceRange` MAY have `compliance_standard_id IS NOT NULL` populated by S-01's Compliance Standard editor. Those rows are read-only from the existing Reference Range Admin's perspective (filtered out of its list view). They participate in evaluator Path A only.

### 4.4 Expanded Result Detail â Threshold Source List (amended 2026-04-28)

**FR-04.** When an evaluated result is expanded on the results entry page or validation page, the panel SHALL include a "Threshold sources" annotation. **One line per regulation that emitted a flag**, plus optionally a demographic / generic line if those were the only matches.

Examples:

- Single-regulation order: `Threshold source Â· PP No. 22/2021 â â¤ 25 NTU`
- Multi-regulation order with shared threshold: two lines:
  - `PP No. 22/2021 â â¤ 25 NTU`
  - `WHO-DWG-4 â â¤ 5 NTU`
- Multi-regulation order with one match + one miss (one regulation has no threshold for this test):
  - `PP No. 22/2021 â â¤ 25 NTU`
  - `WHO-DWG-4 â no applicable threshold` (tagged in muted color so the miss is visible but quiet)
- Generic-only fallback: `Generic reference range â â¤ 25 NTU`
- Multi-component: one section header per component, each with its own threshold sources list

This replaces the v1.0 "Compliance Detail Tile" â same information, simpler render, no new component.

### 4.5 Result Entry Inline Indicator (amended 2026-04-28; rewritten 2026-04-29)

> **2026-04-29 simplification.** Per-regulation chip pattern simplified after Casey review. One chip per applicable regulation, format `STATUS â RegName`. Drop the side-by-side reg-tag + flag-tag pattern. Drop the threshold-source list in expanded detail. Reading-group headers stay but become dynamic (see FR-04b). Categorical observations remain S-05a.

**FR-04a (rewritten 2026-04-29).** The per-result inline indicator on the **Results Entry page AND the Validation page** SHALL render **one Tag per applicable regulation**, sized to fit on the result row beside the value. Tag format: `STATUS â RegName` (e.g., `PASS â PP No. 22/2021`, `BORDERLINE â WHO-DWG-4`, `FAIL â Permenkes 32/2017`). Same component, same data source, same colors â Validation simply renders the chips read-side after the result has been entered.

**Cross-reference:** S-08 (Validation) inherits this chip pattern verbatim â no separate UX is designed for validation. The validation reviewer sees the same per-regulation chip set the entry tech sees, and decides whether to validate based on the chip colors alongside the existing OE Validation tooling.

**Status values + colors:**

| Status | Color | Meaning |
|-------|-------|---------|
| `PASS` | green (`tag-green`) | Result is within the regulation's reference range |
| `FAIL` | red (`tag-red`) | Result is outside the regulation's reference range (above max OR below min) |
| `BORDERLINE` | yellow (`tag-yellow`) | Env-specific intermediate state â result is within the standard's configured borderline proximity to a limit. Borderline proximity is **configured on the compliance standard record** during standard creation (managed in S-01 Compliance Standard Admin), not hardcoded. Per-standard configuration lets one regulation use "within 5% of the limit," another use an absolute offset, etc. |
| `INFO` | warm-gray (`tag-warm-gray`) | Test/component is recorded but no compliance threshold applies (informational only) |

**Why no Critical tier for env:** environmental compliance evaluation has no critical-life-threshold concept (unlike clinical Normal/Abnormal/Critical). The chip pattern reuses the existing OE Tag component but with env-specific status values and a different evaluation function.

**Multi-component tests:** each component result row gets its own chip set. Example for a noise test: row "Sound Pressure (dB) = 72 dB" shows `[FAIL â PP No. 41/1999] [FAIL â WHO Env Noise]`; row "Heading (Â°) = 90Â°" shows `[INFO â (No threshold)]`.

**FR-04b. Dynamic reading-group "+ Add reading" affordance (new 2026-04-29).** Multi-component tests where the test catalog flags `allowsMultipleReadings = true` SHALL render reading groups as collapsible row clusters with a header label (e.g., `â³ Reading 1 â North face`). After the last reading group, a `+ Add reading` button appears on the test header row; clicking appends a new reading group with the same component shape but empty values, ready for entry. Existing reading groups can be removed (provided â¥1 remains).

**FR-04c (deprecated 2026-04-29).** The earlier "expanded detail" UI with the threshold-source list is removed. Threshold-source visibility (which range row drove the chip's color, including its standard + version + min/max + unit) is moved to a tooltip on the chip itself; no separate expand/collapse panel is needed for typical entry. The existing OE result-detail panel (override / comment / audit-trail) is unchanged.

### 4.5 Version Lock

**FR-05.** Range lookup uses the order's stored `complianceStandardVersion` (snapshot taken at order creation per S-03 v2.0 Â§5.1.5). If the standard is superseded after order entry, the order continues to use the original version's ranges. Same semantics as v1.0; just enforced by the version column on the lookup rather than a separate evaluation entity.

## 5. Data Model (rewritten 2026-04-29)

> **2026-04-29 reconciliation.** S-05 v2.0 introduces **no schema changes** of its own. It depends on entities owned by other specs.

**Owned by S-01 (Compliance Standards Admin):**

- `ComplianceStandard` â the regulation entity (regulation number, version, issuing body, status).
- `ComplianceThreshold` â per-test, per-standard, per-parameter-group threshold rows. Threshold types: Maximum, Minimum, Range, Descriptive. **Borderline fields** (`borderlineMin`, `borderlineMax`, `borderlineValues`) added in S-01 v1.2 â see S-01 Â§4.3.
- `ParameterGroup` â logical grouping of thresholds within a standard.

**Owned by existing OE:**

- `referenceRange` â clinical / standalone reference ranges (unchanged). Used only when the order has no compliance standard selected.

**Owned by test catalog spec (Casey's parallel thread):**

- `test_component` â defines components for multi-component tests (e.g., a noise-pollution test's Heading + Sound Pressure components).
- `result.component_id` â joins result rows to a component (required for multi-component tests).
- `result.reading_group_id` â groups multiple readings of a multi-component test (Option Î± from the design call).

S-05 consumes all of the above; it does not own any of them. Any schema migration required for borderline fields is owned by S-01 v1.2.

## 6. API Endpoints

No new endpoints. The evaluator is internal â exposed indirectly through the existing results entry / validation result-load endpoints, which now return the chip array per result row.

## 7. Permissions

No new keys. `referenceRange.edit` is unchanged in scope (still gates standalone ranges only). `compliance.threshold.modify` (S-01 Â§3) gates regulation-scoped thresholds â unchanged.

## 8. UI Mockup Notes

- Results entry + Validation pages are **unchanged structurally**. Per-row chip pattern (FR-04a) renders one chip per applicable regulation alongside the existing OE result row chrome.
- Multi-component tests render reading groups with header labels and a `+ Add reading` button when `allowsMultipleReadings` is true (FR-04b).
- Reference Range Admin (existing OE) is unchanged (no new column, no new filter â see Â§4.3). Regulation-scoped thresholds are managed in S-01's Compliance Standards Admin.
- No regulation banner anywhere â order's regulation set is implicit from `order_compliance_standard`; users don't need a screen-level reminder.

## 9. Acceptance Criteria

- [ ] `evaluateResult()` follows Path A (regulation-scoped, against `ComplianceThreshold`) when the order has standards; Path B (standalone, against `referenceRange`) otherwise
- [ ] Path A returns one `(status, regName)` tuple per matching ComplianceThreshold, including INFO when no threshold applies for a selected regulation
- [ ] Path B returns zero or one tuple from the standalone `referenceRange` pool
- [ ] BORDERLINE status fires when the result is in the threshold's borderline window (numeric range or categorical values, configured per-standard in S-01)
- [ ] Per-result inline chip pattern renders on both Results Entry and Validation pages â one chip per regulation, format `STATUS oâ RegName`
- [ ] Multi-component tests render reading-group headers and support `+ Add reading` when `allowsMultipleReadings` is true
- [ ] No schema changes introduced by S-05 (all changes belong to S-01 or test catalog spec)
- [ ] No regulation banner added to results entry or validation pages
- [ ] No new entity, no new evaluator, no new permission key
- [ ] Existing demographic-scoped (age/sex) ranges continue to work unchanged
- [ ] Version lock holds â superseding a standard after order entry doesn't change the order's evaluation

## 10. Notes

- ~40% smaller than v1.0 because the engine framing dissolved into "one extra scope dimension on an existing mechanism."
- The descriptive tag library (qualitative observations like "scum present", "filamentous algae") didn't fit the numeric-range pattern and was the only piece in v1.0 that genuinely needed new infrastructure. It moves to S-05a â a small standalone spec that's domain-neutral (useful for clinical morphology observations as well, not just env compliance).
- S-06 (Laporan Hasil) and S-07 (Env Dashboard) consume the existing `Result.normalFlag` field, same as the v1.0 design â they don't depend on the engine being a separate entity. No spec changes downstream.
- S-09 v2.0 (Eligibility Gate) doesn't depend on S-05 at all â independent.
