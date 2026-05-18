# Quality-gate Checklist — Reagent Usage Capture v1 (interim)

**FRS:** `results-page-reagent-usage-v1-frs.md`
**Companion mockup:** `results-page-reagent-usage-v1-mockup.jsx`
**Companion preview:** `results-page-reagent-usage-v1-preview.html`
**Generated:** 2026-05-01
**Scope:** Pre-implementation requirements-quality gate. Validates that the FRS is well-written, complete, and unambiguous. NOT a QA test plan.

> "Unit tests for English." Each item asks whether the requirement is **clear, complete, and consistent** — not whether the implementation works.

---

## i18n / Localization

- [ ] Every visible UI string in the FRS layout examples and mockup appears in the Localization table with an i18n key
- [ ] All i18n keys follow the `[category].[feature].[identifier]` pattern (`label.results.reagentUsage.*`, `error.results.reagentUsage.*`, etc.)
- [ ] Error messages, button labels, placeholders, headings, low-stock messaging, and validation errors are all covered
- [ ] Parameterized messages use positional placeholders (`{0}`, `{1}`) not English-grammar interpolation, so French and Bahasa Indonesia translations don't read awkwardly
- [ ] No reagent name, lot number, or numeric value is hardcoded in a string template — all are passed as parameters

## Permissions & Security

- [ ] A permission key is named for every write action: `inventory.consumption.record`, `inventory.consumption.credit`
- [ ] UI-layer enforcement is specified (Reagent row hidden vs. read-only based on `results.modify`)
- [ ] API-layer enforcement is specified (HTTP 403 on `POST /api/v1/inventory/reagent-consumption-events` without `inventory.consumption.record`)
- [ ] Auto-grant rules are explicit: `results.modify` ⇒ `inventory.consumption.record`; (`results.modify` OR `inventory.adjust`) ⇒ `inventory.consumption.credit`

## Carbon Design System

- [ ] All status indicators map to Carbon `Tag` kinds (FIFO Suggested = `teal`, Expiring = `warm-gray`, Expired = `red`)
- [ ] No `Accordion` is used inside the Result Entry expanded panel — the Reagent row is inline, matching the Methods and Storage rows above and below it
- [ ] No hardcoded colors or magic spacing values; all use Carbon spacing tokens (`var(--cds-spacing-*)`)
- [ ] Inline validation uses Carbon's built-in `invalid` / `invalidText` props, not custom error divs
- [ ] Low-stock warning uses `InlineNotification kind="warning"` with `lowContrast`, consistent with Reagent Forecasting FRS messaging

## Acceptance Criteria Quality

- [ ] Every acceptance criterion is observable, specific, and falsifiable (no "looks good", "intuitive", "fast")
- [ ] Performance criteria are quantified ("Search returns within 1 s p95 for 500 reagents and 5000 lots")
- [ ] Each criterion traces back to a numbered FR or BR
- [ ] Edge cases and error paths are covered, not just happy path (expired lot, exceeds remaining, decrement failure, void/edit credit chain)
- [ ] Migration to v2.1 has its own dedicated acceptance criteria so the interim doesn't trap downstream work

## FRS — Mockup Alignment

- [ ] Every functional requirement has a corresponding visual element in the mockup or preview
- [ ] Every visual element in the preview traces to a functional requirement
- [ ] All data model fields (`ReagentUsageRow`, `ReagentSearchResult`) are surfaced or referenced in the mockup props

## Domain-specific (Reagent / Inventory)

- [ ] Capture is correctly described as **always optional** in v1 (no `reagentCaptureMode` field — that is v2.1 scope)
- [ ] FIFO ordering is specified by source — reuse existing `ReagentLot` ordering primitive if present, fall back to `ORDER BY received_date ASC` server-side; this question is flagged for engineering verification, not silently assumed
- [ ] Save event payload (`ReagentConsumptionEvent`) shape is **identical** to the one specced in `FRS_Reagent_Forecasting.md` FR-1-001 — same `sourceType`, `sourceResultId`, `sourceTestId`, `performedBy`, `performedAt` fields
- [ ] Auto-credit on void or downward edit issues a compensating event with `voidedEventIds` populated; no consumption event is ever deleted

---

## Findings

| Pass | Notes |
|---|---|
| **i18n** | All 18 keys in FRS §9 are present; placeholders are positional. No hardcoded values in mockup. ✅ |
| **Permissions** | All four permissions named with auto-grant rules and API enforcement clauses. ✅ |
| **Carbon** | Inline placement confirmed (no Accordion). Tags mapped correctly. Built-in validation props used. ✅ |
| **AC Quality** | All criteria observable. Search performance quantified. Migration to v2.1 has dedicated criteria. ✅ |
| **FRS↔Mockup** | Every FR maps to a UI element in the preview; every preview element traces to a FR. ✅ |
| **Domain** | Optional capture confirmed. FIFO source flagged for engineering verification. Event payload matches Forecasting FRS exactly. ✅ |

**Result:** All 25 items pass. Spec is ready for Github issue creation.

**Open follow-ups (not blocking):**

1. Engineer to confirm whether `ReagentLot` already exposes a FIFO ordering primitive before implementing the search endpoint sort.
2. Engineer to confirm whether `Reagent` schema models multiple allowed units per reagent today; if not, the Unit field renders as static label always (no Select) in v1.
3. Recall workflow query path — confirm whether the current recall report already filters by `consumption_event.reagent_lot_id` or whether a small reporting query needs to be added later.
