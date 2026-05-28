# Results Entry — Expanded Uncertainty (U) Capture

**Source ticket:** [OGC-775](https://uwdigi.atlassian.net/browse/OGC-775) — S-15a Result Expanded Uncertainty Capture — MVP (ISO 17025 §7.8.3.1(c))
**Parent epic:** [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527)
**Consumed by:** [OGC-552](https://uwdigi.atlassian.net/browse/OGC-552) — S-06 LHU v2.0 conditional U column on the result table
**Distinct from:** OGC-603 (S-03b — per-sample sampling uncertainty %, ISO 17025 §7.6)

---

## Overview

A small, MVP-scoped extension to the existing **Results Entry** screen: each result row gains an optional numeric input for **expanded measurement uncertainty (U)** with a fixed coverage factor `k=2` (95% coverage interval). The field is purely additive — labs that don't track U leave the cell blank and nothing changes for them. KAN-accredited labs (Indonesian Labkesmas BBLKM, EU/US environmental labs) start populating U immediately.

The Vector / Environmental LHU v2.0 has a conditional U column on its result table that renders only when *any* result on the report has `expanded_uncertainty` populated, and auto-hides when none do. This mockup shows the upstream capture surface that feeds that LHU column.

## Scope (MVP)

* **In scope:** inline `U (k=2)` column on the existing Results Entry table; numeric input; backward-compatible NULL handling.
* **Out of scope** (deferred to S-15a v2 if pursued):
  * Tooltip / inline help text explaining U and k
  * Admin toggle `results.uncertainty.enabled` to hide the field from non-accredited deployments
  * Method-level prefill from `Method.validated_uncertainty` (depends on OGC-750 capturing validated_uncertainty first)
  * "Don't know? Leave blank" placeholder text + explicit no-validation-error-on-blank affordance
  * Field label refinement (compact vs. expanded label by context)
  * Per-row coverage-factor override (always k=2 in MVP)

## Why this is intentionally thin

The MVP gives KAN-accredited labs an immediate place to enter the U value they've already computed via method validation. Non-accredited labs leave it blank and see no change in behaviour. UX scaffolding for non-accredited users (tooltips, admin gating, prefill) lands as a v2 only when we have evidence of how the field is actually used in practice — not now on speculation.

---

## Layout

Single change to the existing Results Entry results table: insert a new column **U (k=2)** immediately after the **Result** column. All other columns unchanged.

```
| Test               | Result   | U (k=2)  | Unit   | Reference Range | Status   | Actions      |
| ------------------ | -------- | -------- | ------ | --------------- | -------- | ------------ |
| BOD5               | 11.2     | ±1.8     | mg/L   | ≤ 60            | Released | Edit | ⋯     |
| COD                | 21.5     | ±3.2     | mg/L   | ≤ 150           | Released | Edit | ⋯     |
| pH                 | 6.7      | ±0.1     | —      | 6.0–9.0         | Released | Edit | ⋯     |
| Amonia Total       | 0.255    | ±0.038   | mg/L   | ≤ 8.0           | Released | Edit | ⋯     |
| Fenol Total        | <0.0033  |          | mg/L   | ≤ 0.5           | Released | Edit | ⋯     |
| TSS                | 14       |          | mg/L   | ≤ 50            | Released | Edit | ⋯     |
```

Notes on rendering:

* `±` prefix on the U value is a display convention — the stored value is a positive decimal; the prefix is added at render time
* **Empty cell = either backward-compatible default (lab did not enter U) or U does not apply to this row.** The system does not infer whether U applies — the lab decides by entering a value or leaving it blank. No `—` em dash or `N/A` sentinel in Results Entry; that's an LHU rendering concern.
* For below-LOD results (e.g., `<0.0033`) and qualitative results, the lab simply leaves U blank. The Test Catalog doesn't know which results are below-LOD (that's analyzer/method-dependent), so the entry form doesn't auto-detect or display anything special — it just stays empty.
* The LHU template (OGC-552) renders `—` on the report face when it detects a `<`-prefixed result value with a blank U; that's a presentation-layer choice and lives entirely in the LHU rendering, not in the entry surface.
* No tooltip in MVP. Field label is `U (k=2)` — labs that know what it means recognize it immediately; labs that don't leave it blank without ambiguity

## Field spec

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `expanded_uncertainty` | DECIMAL (precision matches result) | No | Stored as positive decimal; render with `±` prefix |
| `coverage_factor` | DECIMAL | No (default `2.0`) | Hidden in MVP — always k=2. Visible per-row override is v2. |

Input UX:

* Numeric input field; same width as the Result column input
* Accepts decimal values; rejects negatives and non-numeric input via standard Carbon NumberInput validation
* No placeholder text (per MVP scope decision)
* No tooltip (per MVP scope decision)
* Tab order: after Result, before Reference Range (Reference Range is usually read-only display, so tab order may skip directly to the Status / Actions cell depending on the row's edit state)

## Data model

Per [OGC-775](https://uwdigi.atlassian.net/browse/OGC-775) AC:

* `result.expanded_uncertainty` — `DECIMAL`, nullable
* `result.coverage_factor` — `DECIMAL`, default `2.0`

API serializes both fields on `Result` GET / POST / PATCH. Backward compatible: existing results without U continue to render and behave normally.

## Validation rules

* If `expanded_uncertainty` is provided, it must be `≥ 0` (no negative uncertainty)
* If `expanded_uncertainty` is provided and the result is qualitative or `<LOD`, the system does NOT block on save — the lab may have a valid reason to enter a value (e.g., LOD as the uncertainty). The UI doesn't second-guess.
* `coverage_factor` is hidden in MVP; the default `2.0` is applied at save time
* No cross-field validation between result value and U in MVP — the LHU rendering layer decides whether to use the uncertainty in compliance evaluation (per the decision rule on the report; see OGC-552 AC-552-B for the hardcoded BINARY_ACCEPTANCE statement)

## i18n keys (new for this story)

Keys live under `results.uncertainty.*`:

| Key | EN |
| --- | --- |
| `results.uncertainty.column.label` | U (k=2) |
| `results.uncertainty.column.header.tooltip` | (omitted in MVP — added in v2 if needed) |
| `results.uncertainty.value.prefix` | ± |
| `results.uncertainty.empty.placeholder` | (none — blank cell) |
| `results.uncertainty.validation.negative` | Uncertainty must be a non-negative number. |

Backwards: no existing i18n keys are repurposed; this is a clean additive set.

## States (mockup illustrates the first only per MVP scope)

1. **Default / populated row** (in scope) — result + U both filled, k=2 implicit. Most common KAN-accredited-lab case.
2. **U left blank** (in scope as a row variant) — result filled, U cell empty. Backward-compatible default, AND also the convention for below-LOD / qualitative results (lab just leaves it blank; no special marker).
3. **Validation error** (deferred) — U entered as negative or non-numeric. Standard Carbon NumberInput error state.

## Acceptance Criteria check (mockup → OGC-775)

| OGC-775 AC | Mockup demonstrates |
| --- | --- |
| Schema: `result.expanded_uncertainty` + `result.coverage_factor` | Documented in §"Data model" |
| Results Entry UI: optional U (k=2) field next to result | Shown in the layout table |
| API serializes both fields | Documented |
| Backward compat: existing results without U render normally | Shown via the TSS row + the below-LOD rows (Fenol Total, Krom Total) — all empty U cells |
| i18n keys under `results.uncertainty.*` | Documented in §"i18n keys" |

### Out of Results Entry — kept on the LHU rendering side

Things that are NOT in the Results Entry mockup but are still part of the broader v2.0 work:

* **KAN accreditation indicators on Results Entry** — explicitly not surfaced. Accreditation is an LHU-rendering concern (asterisk on parameter name, `/R` suffix on report number). The analyst entering a result doesn't need to see it; the LHU template renders it from `ComplianceThreshold.parameter_kan_accredited` at report-assembly time.
* **`—` em dash for "uncertainty not applicable"** — not in entry. The LHU template can render `—` based on detecting a `<`-prefixed result value with a null U at report-generation time. Live in the LHU template, not on the entry surface.

## Out of scope reminders (NOT in this mockup)

These are documented in OGC-775's "Out of scope" section and are NOT depicted here:

* Tooltip / inline help
* Admin enabled-toggle
* Method-level prefill
* Placeholder text or "Don't know?" affordance
* Field label refinement by context
* Per-row coverage-factor override

If any of these turn out to matter once labs start using the MVP, file an S-15a v2 follow-up story.

## References

* [OGC-775](https://uwdigi.atlassian.net/browse/OGC-775) — this story's parent ticket
* [OGC-552](https://uwdigi.atlassian.net/browse/OGC-552) — consumes the field via the LHU v2.0 conditional U column
* `environmental-lhu.md` v2.0 §6.1 / §6.5 — LHU U column rendering rules
* ISO/IEC 17025:2017 §7.8.3.1(c) — uncertainty reporting requirement
* JCGM 100:2008 (GUM) — Guide to the Expression of Uncertainty in Measurement, foundational reference
* LHU v2.0 upstream gap analysis (2026-05-26) — `lhu-v2-upstream-gap-analysis-2026-05-26.md`
