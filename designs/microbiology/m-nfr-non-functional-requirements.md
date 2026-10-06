# M-NFR Microbiology Module — Non-Functional Requirements

> Functional authority: the V2 baseline owns case behavior; this document owns its scoped laboratory outcomes. Technical examples are non-normative. Engineering decisions and verification belong to specs/amr.


**Version:** 2.0 (consolidated — folds review edits inline; no separate addendum)
**Date:** 2026-06-05
**Status:** Cross-cutting spec. Every M-* module references these requirements in its acceptance criteria.
**Owner:** [V2 baseline](amr-micro-v2-amendments.md) Module Parent

> This is the shared V2 nonfunctional baseline: blocked offline writes, retained history, accessibility and performance. Engineering implementation and verification belong to specs/amr.

This spec captures the non-functional constraints all Micro Module surfaces must honor. It's deliberately short — each requirement is a single testable criterion, not a design.

---

## 0. Per-module NFR applicability map (I1)

This map states which NFR governs which surface, so each module's ACs can **cite the NFR they satisfy** rather than re-deriving the constraint. Every M-* module **MUST** reference the applicable NFR IDs in its acceptance criteria (e.g. "AC-M07-… (NFR-02, NFR-04)"). A blank cell means the NFR is not a primary driver for that surface (it still applies globally where relevant, e.g. audit on any write, i18n on any string).

| Module / surface | NFR-01 Offline | NFR-02 Scale | NFR-03 Audit | NFR-04 a11y (WCAG 2.1 AA) | NFR-05 Perf budget | NFR-06 Retention | NFR-07 i18n | NFR-08 Security | NFR-09 Browser | NFR-10 Continuity |
|---|---|---|---|---|---|---|---|---|---|---|
| M-01 Reference Data (admin) | — | • | • | • | • | • | • | • | • | • |
| M-02 Breakpoint Catalog | — | • | • | • | • | • | • | • | • | • |
| [V2 reception](amr-micro-v2-amendments.md#fr-02.3) Order Entry hook | read cache | — | • | • | • | — | • | • | • | • |
| [V2 case](amr-micro-v2-amendments.md#fr-17.6) Case Workbench | **• (blocked writes)** | • | • | • | • | • | • | • | • | • |
| [V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b) AST Entry | **• (blocked writes)** | • | • | • | • | • | • | • | • | • |
| M-06 Expert Rules (1B) | — | • | • | • | • | • | • | • | • | • |
| [V2 Worklist](amr-micro-v2-amendments.md#fr-12.1) Worklist | **• (read last-loaded)** | • | — | • | • | — | • | • | • | • |
| M-08 Macro Library | — | • | • | • | **• (≤50ms expand)** | • | • | • | • | • |
| M-09 WHONET Export (1B) | **• (explicit — §NFR-01)** | • | • | • | **• (preview/gen budgets)** | • | • | • | • | • |
| [V2 callbacks](amr-micro-v2-amendments.md#fr-18.1) Critical-Result Ack | • (blocked writes) | • | • | • | • | **• (≥5y)** | • | • | • | • |
| M-12 Test→Reagent Linkage | — | • | • | • | • | • | • | • | • | • |


---

## NFR-01 Offline / intermittent connectivity

**Requirement:** The Micro Module degrades gracefully under network loss, not catastrophically.

**Specifics:**

- Worklist views ([V2 Worklist](amr-micro-v2-amendments.md#fr-12.1)) render the last-loaded data from browser cache when network is unavailable. A clear `cds--inline-notification--warning` banner reads: "Working offline; refresh when network returns."
- All case and worklist writes are blocked while offline, with an explanation. Previously loaded data remain readable; there is no local save queue or replay on reconnect. Reconnect and refresh before trying the action again.
- Analyzer event ingestion buffers in the analyzer-side service. When OE reconnects, queued events stream in chronological order and update the affected Cases.
- The visual offline indicator is an `InlineNotification` (kind=warning, lowContrast) in the page header, never a blocking modal.

**M-09 WHONET Export — offline behavior (I1, explicit).** Export is a server-side batch operation initiated from a browser. Under network loss:
- The export **configuration/preview surface** is read-mostly; if the network drops while configuring, the page shows the standard offline banner and the operator may continue reading the last-loaded preview but **cannot initiate a new export** (it requires a fresh server query) — the "Generate export" action is disabled with the reason "Offline — reconnect to generate." No partial file is produced client-side.
- An export already running server-side is **unaffected** by the client losing connectivity; on reconnect the operator sees its completion status. Generated files + parameters persist per NFR-06.
- No export work is queued client-side (exports are not bench-rhythm saves); only reads degrade gracefully.

**Offline boundary:** previously loaded information is readable; no offline writes, save queues or automatic replay. A new export requires a connection.

**Acceptance:**

- AC-NFR-01-01: Disconnect network mid-session; worklist remains readable; banner appears. *([V2 Worklist](amr-micro-v2-amendments.md#fr-12.1))*
- AC-NFR-01-02: Disconnect, attempt a case/worklist edit, and verify the action is disabled and no success or saved change is shown.
- AC-NFR-01-03: Reconnect after another user changed the row; refresh and verify there is no queued overwrite or automatic replay.
- AC-NFR-01-04: Reconnect analyzer service after a 10-minute outage; verify queued events flush in order. *([V2 case](amr-micro-v2-amendments.md#fr-17.6))*
- AC-NFR-01-05: Go offline on the WHONET export page; verify "Generate export" disabled with reason; verify a server-side export started before disconnect still completes. *(M-09)*

---

## NFR-02 Scale ceiling

**Requirement:** The Micro Module supports a small-to-medium clinical lab's daily volume without UI degradation.

**Specifics:**

- The Worklist renders ≤ 200 active Case rows (Cultures grain) in < 2 seconds on a baseline laptop (8GB RAM, modern Chrome).
- The Worklist AST grain renders ≤ 200 active AST Run rows in < 2 seconds.
- Worklist folded-in panels (resistance strip + recent-activity) render with the page (no separate dashboard surface; see [V2 Worklist](amr-micro-v2-amendments.md#fr-12.1)).
- Case Detail view renders a Case with up to 5 Isolates, up to 100 AST Result rows total, and 30 timeline events in < 1 second.
- Search results return ≤ 500 ms for queries on indexed columns (lab number, patient name).
- Filter operations on rendered worklists complete in < 300 ms.
- Auto-refresh polling on the worklist defaults to 30 seconds, configurable per deployment (10s to 120s).

**Acceptance:**

- AC-NFR-02-01: Load the Worklist with seeded 200-row dataset; measure < 2s. *([V2 Worklist](amr-micro-v2-amendments.md#fr-12.1))*
- AC-NFR-02-02: Open a Case with 5 Isolates × 16 AST Results × 30 timeline events; measure < 1s. *([V2 case](amr-micro-v2-amendments.md#fr-17.6))*
- AC-NFR-02-03: Filter operations sub-300ms across the worklist grains. *([V2 Worklist](amr-micro-v2-amendments.md#fr-12.1))*

---

## NFR-03 Audit granularity

**Requirement:** Every state-changing action in the Micro Module is auditable and the audit is immutable.

**Specifics:**

- Every Case stage transition writes a record: `case_id`, `from_stage`, `to_stage`, `user_id`, `timestamp`, `reason_code` (optional), `reason_text` (optional, macro-enabled).
- Every AST result override writes a `micro_ast_override` row preserving the original value, the new value, the rule (if expert-rule-driven) or NULL (if manual), the rule version snapshotted at override time, the justification text, and `user_id`/`timestamp`.
- Every report release writes a `report_release_event` row: `case_id`, `report_version`, `released_by`, `released_at`, `report_type`, distribution channels attempted, and per-channel delivery status.
- Every Expert Review decision writes a `micro_timeline_event` of type `EXPERT_RULE_DECISION` with the flag, the decision, the justification, and the user.
- Every critical call is attributable and appears once in the shared callback log (V2 A-18).
- Every reidentification writes a new `micro_isolate` version row preserving the old `organism_id` and the FK chain to the previous version.
- The **Case Timeline reuses the existing OE History/Note infrastructure** (per [V2 baseline](amr-micro-v2-amendments.md) cross-cutting principles); auto-generated timeline events are the audit projection of section saves and are not separately hand-entered.
- Audit rows are never updated and never deleted. Corrections are new rows with a `corrects_id` FK to the row being corrected.

**Audit outcome:** attributable, immutable history records each action and its original values. Engineering owns persistence.

**Verification needed:** Confirm whether OE has an existing generic audit pattern.

**Acceptance:**

- AC-NFR-03-01: Transition a Case stage; verify audit row written and immutable. *([V2 case](amr-micro-v2-amendments.md#fr-17.6))*
- AC-NFR-03-02: Override an AST value; verify original preserved alongside override. *([V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b))*
- AC-NFR-03-03: Release a report; verify release event with all distribution attempts logged. *([V2 case](amr-micro-v2-amendments.md#fr-17.6))*
- AC-NFR-03-04: Attempt to delete an audit row via the API; verify rejection.

---

## NFR-04 Accessibility (WCAG 2.1 AA)

**Requirement:** All Micro Module surfaces meet **WCAG 2.1 AA**. Non-negotiable. Every M-* module's a11y ACs cite NFR-04 (per the §0 map).

**Specifics:**

- All worklist and case actions are keyboard-reachable (Tab order, Enter to activate, Escape to cancel). No mouse-only paths.
- Inline interactions (per [V2 baseline](amr-micro-v2-amendments.md) Principle 3 — inline, not modals, for the primary workflow) keep focus order logical: expanding an inline section moves focus into it and announces the expansion via `aria-live`.
- Stage badges, flag indicators, AUTO-event badges, and override markers carry both color and text. Color alone is never the carrier of information.
- All form fields have proper `<label>` associations and ARIA descriptions where helper text exists.
- Focus is managed on modal open (focus moves into the modal, trapped within) and close (focus returns to the trigger element); the same return-focus rule applies to inline expand/collapse triggers.
- Color contrast meets 4.5:1 minimum for body text and 3:1 for large text and UI elements.
- The macro dropdown specifically: keyboard navigation via arrow keys, Enter or Tab to select, Escape to close. An `aria-live` region announces the expansion when selected.
- All Carbon DataTable instances have proper `<caption>` or `aria-label`.
- All interactive elements have a visible focus state.

**Tooling:** Run `@axe-core/react` audits in CI on every M-* module's main routes.

**Acceptance:**

- AC-NFR-04-01: Run axe-core on Worklist, Case Detail, AST Entry modal, Reference Data admin pages; zero WCAG 2.1 AA violations. *(M-01, [V2 case](amr-micro-v2-amendments.md#fr-17.6), [V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b), [V2 Worklist](amr-micro-v2-amendments.md#fr-12.1))*
- AC-NFR-04-02: Keyboard-only navigation through the full Case workflow (open Case, add Isolate, set up AST, enter results, release prelim) completes without mouse use. *([V2 case](amr-micro-v2-amendments.md#fr-17.6), [V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b))*
- AC-NFR-04-03: Macro dropdown announces selection via aria-live. *(M-08)*
- AC-NFR-04-04: Inline section expand/collapse manages focus and announces via aria-live ([V2 baseline](amr-micro-v2-amendments.md) Principle 3). *([V2 case](amr-micro-v2-amendments.md#fr-17.6))*

---

## NFR-05 Performance budget

**Requirement:** User-facing latencies meet defined budgets for the bench-level workflow rhythm. Module ACs cite NFR-05 for their primary surfaces (per §0 — notably M-08 macro expansion, M-09 export budgets).

**Specifics:**

| Surface | Target | Rationale | Owning module |
|---------|--------|-----------|---------------|
| Worklist initial load | < 2s | Morning rounds expect at-a-glance | [V2 Worklist](amr-micro-v2-amendments.md#fr-12.1) |
| Case Detail render | < 1s | High-frequency surface | [V2 case](amr-micro-v2-amendments.md#fr-17.6) |
| Save Isolate | < 500ms | Bench-level rhythm | [V2 case](amr-micro-v2-amendments.md#fr-17.6) |
| Save AST result | < 500ms | Bench-level rhythm | [V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b) |
| Save Timeline event / note | < 500ms | Bench-level rhythm | [V2 case](amr-micro-v2-amendments.md#fr-17.6) |
| WHONET export preview (1000 isolates) | < 5s | Background acceptable | M-09 |
| WHONET export generation (5000 isolates) | < 30s | Background acceptable | M-09 |
| Macro expansion | < 50ms | Has to feel instant | M-08 |
| Search (indexed) | < 500ms | Quick lookup | [V2 Worklist](amr-micro-v2-amendments.md#fr-12.1) |
| Filter applied to worklist | < 300ms | Snappy UI | [V2 Worklist](amr-micro-v2-amendments.md#fr-12.1) |

**Acceptance:** Performance test suite validates each surface against budget with realistic data volumes; each owning module's perf AC cites NFR-05 and the relevant row.

---

## NFR-06 Data retention

**Requirement:** Micro data persists for the durations required by regulation and lab practice.

**Specifics:**

- Cases, Isolates, AST Runs, AST Results: **retained indefinitely** in Phase 1. No archival mechanism. Future Phase X may add.
- Critical-result notifications: **retained ≥ 5 years** per ISO 15189 §7.4. Immutable. *([V2 callbacks](amr-micro-v2-amendments.md#fr-18.1))*
- Audit log: **retained indefinitely**. Immutable.
- Analyzer events: **12 months active**, then archived to a cold-storage table that's queryable but slow. (Active table has indexes optimized for recent events; archive table is append-only.)
- WHONET export files + parameters: **retained ≥ 5 years** for surveillance audit. *(M-09)*
- Soft-deleted master records (organisms, antibiotics, panels): retained indefinitely (deactivation hides from future selection but preserves history).

**Acceptance:**

- AC-NFR-06-01: No supported action deletes a case, isolate, original measurement, issued report or callback history.
- AC-NFR-06-02: Deactivate an organism master row; verify existing isolates still reference it; verify it disappears from selection dropdowns.

---

## NFR-07 Internationalization

**Requirement:** All user-visible strings are externalized to i18n keys following the `module.surface.element` pattern.

**Specifics:**

- Every Carbon component label, helper text, button text, table column header, error message, success message, confirmation prompt has a key.
- Date and number formatting uses the user's locale.
- Right-to-left language support is **out of Phase 1** unless an existing OE deployment already requires it.
- Every visible string in the V2 and shared surfaces must be localizable.
- Keys are organized:
  - `micro.*` — Case Workbench surfaces ([V2 case](amr-micro-v2-amendments.md#fr-17.6), [V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b), [V2 Worklist](amr-micro-v2-amendments.md#fr-12.1))
  - `admin.micro.*` — admin surfaces (M-01, M-02, M-08)
  - `admin.whonet.*` — WHONET admin (M-09)
  - `report.micro.*` — Jasper template strings ([V2 case](amr-micro-v2-amendments.md#fr-17.6) §Reports)
  - `error.micro.*` — error messages
  - `event.micro.*` — Timeline event types

**Acceptance:**

- AC-NFR-07-01: No hardcoded English strings in any rendered Micro Module component. Lint rule enforces.
- AC-NFR-07-02: Switching locale changes all labels.

---

## NFR-08 Security and access control

**Requirement:** Micro respects existing OpenELIS authentication and the access rules in [V2 baseline](amr-micro-v2-amendments.md)

**Specifics:**

- Every read and write honors the existing OpenELIS authentication and the V2 case-unit access rules.
- Permission checks happen server-side; client-side hiding is a UX convenience, not a security boundary.
- Sensitive findings (organisms associated with HIV opportunistic infections, TB, STIs, MDR phenotypes) inherit the same access control as the underlying Sample. No additional layer in Phase 1.
- Audit history uses the existing audit access rights.
- WHONET export uses the shared export access rights; operators can inspect the audit trail of what they exported.

**Acceptance:**

- AC-NFR-08-01: Attempt every state-changing API endpoint without the corresponding permission; verify 403.
- AC-NFR-08-02: Attempt audit-log read without permission; verify 403.

---

## NFR-09 Browser support

**Requirement:** Micro supports the same browsers OE supports.

**Specifics:**

- Latest two stable versions of: Chrome, Firefox, Edge, Safari.
- Windows 10/11, macOS 12+, recent Linux distributions.
- No IE11 (per existing OE support matrix — verify).
- V2 keyboard and mobile layouts meet its acceptance criteria; future dedicated barcode-scanning surfaces are separate scope.

**Verification needed:** Confirm exact existing OE browser support matrix.

**Acceptance:**

- AC-NFR-09-01: Smoke test (open the Worklist, open a Case, add an Isolate, save AST result, release Final) on each supported browser × OS combination.

---

## NFR-10 Cutover and operational continuity

Required clinical records and attributable history survive the cutover. Ordinary
orders, results and other laboratory work keep their behavior and performance.
Existing backup and recovery workflows continue to preserve this information.
Engineering owns the transformation, final storage decisions and verification.

**Acceptance:**

- AC-NFR-10-01: Rehearse the cutover on a production-scale copy and demonstrate retained clinical meaning and audit history.
- AC-NFR-10-02: Meet the existing worklist performance budgets while ordinary laboratory work continues.

---

## Summary table

| NFR | Title | Non-negotiable? |
|-----|-------|-----------------|
| NFR-01 | Offline / intermittent connectivity (incl. explicit M-09 export) | Yes (graceful degradation) |
| NFR-02 | Scale ceiling | Yes |
| NFR-03 | Audit granularity | Yes |
| NFR-04 | Accessibility (WCAG 2.1 AA) | Yes |
| NFR-05 | Performance budget | Yes |
| NFR-06 | Data retention | Yes |
| NFR-07 | Internationalization | Yes |
| NFR-08 | Security and access control | Yes |
| NFR-09 | Browser support | Yes |
| NFR-10 | Cutover and operational continuity | Yes |

All 10 NFRs are non-negotiable for Phase 1 release. Per the §0 applicability map, **each M-* module's acceptance criteria must cite the NFR(s) it satisfies**. Loosening any requirement requires a documented exception approved by the lab manager + system administrator at the affected deployment.

---

## References

- [V2 baseline](amr-micro-v2-amendments.md) Microbiology functional baseline (cross-cutting principles: shared queue, OE reuse, inline interactions, optimistic locking)
- `amr-pre-frs-planning-v1.md` §3 (drafted NFRs before formalization here)
- OpenELIS Style Guide foundations
- WCAG 2.1 AA criteria
- ISO 15189:2022 §7.4 (Pre-examination), §7.7 (Examination), §8 (Management system)
