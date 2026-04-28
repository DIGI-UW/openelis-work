# S-05a — Reusable Categorical Result Vocabulary
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-26
**Status:** Draft for Review (spike-first)
**Jira:** TBD (under epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527) for tracking convenience; conceptually domain-neutral)
**Origin:** Split out from S-05 v1.0 (the "Descriptive Tag Library" piece). Split rationale: descriptive/categorical observations don't share infrastructure with S-05 v2.0's reference-range extension, and the use cases extend well beyond env compliance (clinical morphology observations, specimen quality flags, vector physiological state, etc.).

---

## ⚠️ Spike Required Before Implementation

**Before starting work on this ticket, do a 30-minute spike on the existing OpenELIS Dictionary infrastructure.** OE already supports:

- `Dictionary` entries for selectable result values
- `TestResult` join that ties tests to their allowed dictionary values
- A "select from list" result type pattern

The spike question: **does adding a `category` column (or similar grouping mechanism) to the existing `Dictionary` table cover the use case?**

- **If yes (Option X — likely):** the spec collapses to ~1 page — column addition + admin UX tweak (group dictionary entries by category) + multi-select rendering on result entry for tests assigned a multi-select category. ~3 SP.
- **If no (Option Y — requires new entity):** small standalone TagLibrary entity that bundles dictionary entries into reusable libraries. ~5 SP.

Either way, this is small. The spike just decides which path.

---

## 1. Overview

OpenELIS supports categorical result values via the existing `Dictionary` mechanism — each test can have a list of allowed values (e.g., a "Visual Water Clarity" test might have dictionary entries for "Clear / Cloudy / Turbid"). Today, those dictionary entries are scoped per test or per result type — there's no reusable library mechanism.

S-05a adds **reusable categorical vocabularies**: define a set of allowed values once (e.g., "scum present", "filamentous algae", "oily sheen", "sediment") and reference that library from any test that needs the same vocabulary. Multiple tests share one vocabulary; vocabulary changes in one place propagate to all.

Use cases:

- **Environmental visual observations** — water clarity, sediment characterization, air-quality observations, bio-indicator presence/absence
- **Clinical morphology** — "budding yeast", "branching hyphae", "Gram-positive cocci in clusters"
- **Specimen quality flags** — "lipemic", "hemolyzed", "icteric"
- **Vector physiological state** — already addressed via V-03's hardcoded enum, but could migrate to this if it ships first

## 2. Scope

**In scope:**
- Reusable categorical vocabulary admin (CRUD): create a vocabulary, add/edit/remove allowed values, deactivate values without deleting (audit-safe)
- Test catalog admin gains a "Vocabulary" link option for tests with `resultType = MULTI_SELECT_DICTIONARY` (or whatever the existing OE result type is named)
- Result entry renders a Carbon `MultiSelect` for tests assigned a vocabulary (vs. existing single-select dictionary)
- Selected values persist as a result with multi-value semantics (the existing OE result store may need extension here — see spike)

**Out of scope:**
- Any compliance evaluation against vocabulary values (e.g., "if 'scum present' is selected, fail the order"). v1 is informational/descriptive only. Compliance pass/fail on vocabulary values would be a future S-05b scope item.
- Free-text fallback for "Other" values — v1 is closed-vocabulary. (May add free-text "Other" with optional comment in v2 if labs request.)
- i18n of vocabulary entries — v1 stores values as displayed strings; i18n handled at admin-time when entries are created.

## 3. Functional Requirements

### 3.1 Vocabulary Admin (post-spike)

**FR-01.** Admin → Reference Data gains a **Vocabularies** page (or extends the existing Dictionary admin per spike outcome). Each vocabulary has:

- Name (e.g., "Visual Water Quality Observations")
- Code (machine identifier, e.g., `VIS_WATER_QUAL`)
- Active flag
- Description (optional)
- A list of **values** — each value has: display string, code, sort order, active flag

### 3.2 Test Assignment

**FR-02.** The test catalog admin form gains a **Vocabulary** Select field, visible only when the test's result type is the multi-select categorical type. Empty = use existing per-test dictionary; non-empty = use the assigned vocabulary's value list.

### 3.3 Result Entry

**FR-03.** When entering a result for a test assigned a vocabulary, the result entry UI renders a Carbon `MultiSelect` with type-ahead, sourced from the vocabulary's active values. The user can select 0-N values. Display order: by `sortOrder`, then alphabetic.

**FR-04.** The result is persisted as the chosen value set. Display on validation, reporting, and downstream views renders the selected values as comma-separated tags.

## 4. Data Model (post-spike — Option X assumed)

```sql
-- Option X: extend existing Dictionary table
ALTER TABLE dictionary ADD COLUMN vocabulary_code VARCHAR(50);
CREATE INDEX idx_dictionary_vocabulary ON dictionary(vocabulary_code) WHERE vocabulary_code IS NOT NULL;

-- Test → vocabulary assignment
ALTER TABLE test ADD COLUMN vocabulary_code VARCHAR(50);

-- (If existing OE result table doesn't already support multi-value, add a join:)
-- CREATE TABLE result_vocabulary_value (
--   result_id BIGINT NOT NULL REFERENCES result(id),
--   dictionary_id BIGINT NOT NULL REFERENCES dictionary(id),
--   PRIMARY KEY (result_id, dictionary_id)
-- );
```

If Option Y, a new `vocabulary` entity bundles `dictionary` entries explicitly. Spike will decide.

## 5. API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/vocabularies` | List active vocabularies for admin pickers |
| GET | `/api/v1/vocabularies/{code}/values` | Active values for a vocabulary (used by result entry MultiSelect) |
| POST | `/api/v1/vocabularies` | Admin: create |
| PUT | `/api/v1/vocabularies/{code}` | Admin: update |
| POST | `/api/v1/vocabularies/{code}/values` | Admin: add value |

All gated by an admin permission (existing `dictionary.edit` or new `vocabulary.edit` per spike).

## 6. Acceptance Criteria

- [ ] Spike documented: Option X (extend Dictionary) vs Option Y (new entity) decision recorded
- [ ] Vocabulary admin page (or extended Dictionary admin) supports CRUD on vocabularies + values
- [ ] Tests can be assigned a vocabulary via the test catalog admin
- [ ] Result entry renders a multi-select for vocabulary-assigned tests
- [ ] Selected values persist and render in validation, reporting, downstream views
- [ ] Active flag on vocabulary values respected (deactivated values don't appear in result entry)
- [ ] Existing single-select dictionary tests continue to work unchanged

## 7. Sprint Placement

**Estimated:** 3-5 SP depending on spike outcome. Could fit any sprint with capacity. No dependency on S-05 v2.0 (range extension) — independent track.

**Suggested target:** Sprint 4 or Sprint 5 — earliest reasonable slot since SILNAS env labs need vocabulary entries (visual water quality, sediment characterization) for results entry on regulation-driven orders.

## 8. Notes

- Domain-neutral framing intentional. v1 use case is env (visual observations on water samples), but the same infrastructure serves clinical morphology and other observational result types. Don't bake env-specific naming into the entity / admin UI.
- **Compliance evaluation against vocabulary values is explicitly out of scope.** If env labs need "scum present" to drive a Pass/Marginal/Fail compliance flag, that's a future addendum (S-05c?) that would extend S-05 v2.0's range-extension model with a categorical match clause. Not in v1.
