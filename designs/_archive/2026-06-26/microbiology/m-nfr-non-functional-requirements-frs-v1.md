# M-NFR Microbiology Module — Non-Functional Requirements

**Version:** 1.0
**Date:** 2026-05-15
**Status:** Cross-cutting spec. Every M-* module references these requirements in its acceptance criteria.
**Owner:** M-00 Module Parent

This spec captures the non-functional constraints all Micro Module surfaces must honor. It's deliberately short — each requirement is a single testable criterion, not a design.

---

## NFR-01 Offline / intermittent connectivity

**Requirement:** The Micro Module degrades gracefully under network loss, not catastrophically.

**Specifics:**

- Worklist views render the last-loaded data from browser cache when network is unavailable. A clear `cds--inline-notification--warning` banner reads: "Working offline; refresh when network returns."
- Data-entry surfaces (Isolate modal, AST Entry modal, Timeline event modal, Final Report modal) queue saves locally on network loss. The queue replays on reconnection. If a conflict is detected (the server-side row was modified between the local save and the replay), the user sees a conflict-resolution dialog: keep local, keep server, or merge field-by-field.
- Analyzer event ingestion buffers in the analyzer-side service. When OE reconnects, queued events stream in chronological order and update the affected Cases.
- The visual offline indicator is an `InlineNotification` (kind=warning, lowContrast) in the page header, never a blocking modal.

**Out of scope for Phase 1:** Full offline-first / CRDT-based sync. We're talking about graceful degradation, not true offline operation. Users can still read the worklist and queue saves; they cannot perform new work that requires a fresh server query (e.g., load a new Case they haven't visited yet).

**Acceptance:**

- AC-NFR-01-01: Disconnect network mid-session; worklist remains readable; banner appears.
- AC-NFR-01-02: Make an edit while offline; verify the change persists locally; reconnect; verify replay.
- AC-NFR-01-03: Make conflicting edits offline and on server; verify conflict-resolution dialog.
- AC-NFR-01-04: Reconnect analyzer service after a 10-minute outage; verify queued events flush in order.

---

## NFR-02 Scale ceiling

**Requirement:** The Micro Module supports a small-to-medium clinical lab's daily volume without UI degradation.

**Specifics:**

- Pending Cultures worklist renders ≤ 200 active Case rows in < 2 seconds on a baseline laptop (8GB RAM, modern Chrome).
- AST Worklist renders ≤ 200 active AST Run rows in < 2 seconds.
- Microbiology Dashboard renders summary cards + recent-cases list in < 1.5 seconds.
- Case Detail view renders a Case with up to 5 Isolates, up to 100 AST Result rows total, and 30 timeline events in < 1 second.
- Search results return ≤ 500 ms for queries on indexed columns (lab number, patient name).
- Filter operations on rendered worklists complete in < 300 ms.
- Auto-refresh polling on worklists defaults to 30 seconds, configurable per deployment (10s to 120s).

**Acceptance:**

- AC-NFR-02-01: Load Pending Cultures with seeded 200-row dataset; measure < 2s.
- AC-NFR-02-02: Open a Case with 5 Isolates × 16 AST Results × 30 timeline events; measure < 1s.
- AC-NFR-02-03: Filter operations sub-300ms across worklist views.

---

## NFR-03 Audit granularity

**Requirement:** Every state-changing action in the Micro Module is auditable and the audit is immutable.

**Specifics:**

- Every Case stage transition writes a record: `case_id`, `from_stage`, `to_stage`, `user_id`, `timestamp`, `reason_code` (optional), `reason_text` (optional, macro-enabled).
- Every AST result override writes a `micro_ast_override` row preserving the original value, the new value, the rule (if expert-rule-driven) or NULL (if manual), the rule version snapshotted at override time, the justification text, and `user_id`/`timestamp`.
- Every report release writes a `report_release_event` row: `case_id`, `report_version`, `released_by`, `released_at`, `report_type`, distribution channels attempted, and per-channel delivery status.
- Every Expert Review decision writes a `micro_timeline_event` of type `EXPERT_RULE_DECISION` with the flag, the decision, the justification, and the user.
- Every critical-result notification writes a `micro_critical_notification` row per M-11.
- Every reidentification writes a new `micro_isolate` version row preserving the old `organism_id` and the FK chain to the previous version.
- Audit rows are never updated and never deleted. Corrections are new rows with a `corrects_id` FK to the row being corrected.

**Reuse vs. build:** Use the existing OE audit infrastructure if a generic `audit_event` table exists. If not, M-NFR creates a polymorphic `audit_event` table similar to M-11's pattern (`target_type`, `target_id`, plus event-specific columns).

**Verification needed:** Confirm whether OE has an existing generic audit pattern.

**Acceptance:**

- AC-NFR-03-01: Transition a Case stage; verify audit row written and immutable.
- AC-NFR-03-02: Override an AST value; verify original preserved alongside override.
- AC-NFR-03-03: Release a report; verify release event with all distribution attempts logged.
- AC-NFR-03-04: Attempt to delete an audit row via the API; verify rejection.

---

## NFR-04 Accessibility (WCAG 2.1 AA)

**Requirement:** All Micro Module surfaces meet WCAG 2.1 AA. Non-negotiable.

**Specifics:**

- All worklist actions are keyboard-reachable (Tab order, Enter to activate, Escape to cancel). No mouse-only paths.
- Stage badges, flag indicators, and override markers carry both color and text. Color alone is never the carrier of information.
- All form fields have proper `<label>` associations and ARIA descriptions where helper text exists.
- Focus is managed on modal open (focus moves into the modal, trapped within) and close (focus returns to the trigger element).
- Color contrast meets 4.5:1 minimum for body text and 3:1 for large text and UI elements.
- The macro dropdown specifically: keyboard navigation via arrow keys, Enter or Tab to select, Escape to close. An `aria-live` region announces the expansion when selected.
- All Carbon DataTable instances have proper `<caption>` or `aria-label`.
- All interactive elements have a visible focus state.

**Tooling:** Run `@axe-core/react` audits in CI on every M-* module's main routes.

**Acceptance:**

- AC-NFR-04-01: Run axe-core on Pending Cultures, AST Worklist, Case Detail, AST Entry modal, Reference Data admin pages; zero AA violations.
- AC-NFR-04-02: Keyboard-only navigation through the full Case workflow (open Case, add Isolate, set up AST, enter results, release prelim) completes without mouse use.
- AC-NFR-04-03: Macro dropdown announces selection via aria-live.

---

## NFR-05 Performance budget

**Requirement:** User-facing latencies meet defined budgets for the bench-level workflow rhythm.

**Specifics:**

| Surface | Target | Rationale |
|---------|--------|-----------|
| Worklist initial load | < 2s | Morning rounds expect at-a-glance |
| Case Detail render | < 1s | High-frequency surface |
| Save Isolate | < 500ms | Bench-level rhythm |
| Save AST result | < 500ms | Bench-level rhythm |
| Save Timeline event | < 500ms | Bench-level rhythm |
| WHONET export preview (1000 isolates) | < 5s | Background acceptable |
| WHONET export generation (5000 isolates) | < 30s | Background acceptable |
| Macro expansion | < 50ms | Has to feel instant |
| Search (indexed) | < 500ms | Quick lookup |
| Filter applied to worklist | < 300ms | Snappy UI |

**Acceptance:** Performance test suite validates each surface against budget with realistic data volumes.

---

## NFR-06 Data retention

**Requirement:** Micro data persists for the durations required by regulation and lab practice.

**Specifics:**

- Cases, Isolates, AST Runs, AST Results: **retained indefinitely** in Phase 1. No archival mechanism. Future Phase X may add.
- Critical-result notifications: **retained ≥ 5 years** per ISO 15189 §7.4. Immutable.
- Audit log: **retained indefinitely**. Immutable.
- Analyzer events: **12 months active**, then archived to a cold-storage table that's queryable but slow. (Active table has indexes optimized for recent events; archive table is append-only.)
- WHONET export files + parameters: **retained ≥ 5 years** for surveillance audit.
- Soft-deleted master records (organisms, antibiotics, panels): retained indefinitely (deactivation hides from future selection but preserves history).

**Acceptance:**

- AC-NFR-06-01: Confirm no DELETE cascade reaches `micro_case`, `micro_isolate`, `micro_ast_run`, `micro_critical_notification` from any application path.
- AC-NFR-06-02: Deactivate an organism master row; verify existing isolates still reference it; verify it disappears from selection dropdowns.

---

## NFR-07 Internationalization

**Requirement:** All user-visible strings are externalized to i18n keys following the `module.surface.element` pattern.

**Specifics:**

- Every Carbon component label, helper text, button text, table column header, error message, success message, confirmation prompt has a key.
- Date and number formatting uses the user's locale.
- Right-to-left language support is **out of Phase 1** unless an existing OE deployment already requires it.
- The narrative names roughly 200 strings across the bundle. The actual count will be larger after FRS detail.
- Keys are organized:
  - `micro.*` — Case Workbench surfaces (M-04, M-05, M-07)
  - `admin.micro.*` — admin surfaces (M-01, M-02, M-08, M-10)
  - `admin.whonet.*` — WHONET admin (M-09)
  - `report.micro.*` — Jasper template strings (M-04 §Reports)
  - `error.micro.*` — error messages
  - `event.micro.*` — Timeline event types

**Acceptance:**

- AC-NFR-07-01: No hardcoded English strings in any rendered Micro Module component. Lint rule enforces.
- AC-NFR-07-02: Switching locale changes all labels.

---

## NFR-08 Security and access control

**Requirement:** Micro respects existing OE auth and adds per-action permission codes per M-00 §4.

**Specifics:**

- All API endpoints honor existing OE session-based auth.
- Permission checks happen server-side; client-side hiding is a UX convenience, not a security boundary.
- Sensitive findings (organisms associated with HIV opportunistic infections, TB, STIs, MDR phenotypes) inherit the same access control as the underlying Sample. No additional layer in Phase 1.
- Audit log access requires `audit.read` (existing OE permission).
- WHONET export requires both `micro.surveillance.export` and `audit.read` (operators of surveillance exports must be able to see audit trail of what was exported).

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
- Mobile browsers are **non-goals** for Phase 1. Mobile bottle barcode scanning is Phase 3+ and will be its own surface.

**Verification needed:** Confirm exact existing OE browser support matrix.

**Acceptance:**

- AC-NFR-09-01: Smoke test (open Pending Cultures, open a Case, add an Isolate, save AST result, release Final) on each supported browser × OS combination.

---

## NFR-10 Database and replication

**Requirement:** Schema changes are forward-compatible with existing OE database operations.

**Specifics:**

- All new tables use the same naming and column conventions as existing OE tables.
- All new tables have appropriate audit columns: `created_at`, `created_by`, `last_updated_at`, `last_updated_by`.
- Indexes designed for the worklist query shapes (Case stage + assigned tech + date range; Isolate by Case; AST Run by Case; result by AST Run).
- No long-running transactions that could lock chemistry workflows.
- Migrations are reversible where possible.
- Existing replication patterns continue to work (verify with deployment team — some OE sites use database replication for disaster recovery).

**Verification needed:** Confirm exact replication setup at representative OE deployment.

**Acceptance:**

- AC-NFR-10-01: Migration tested on a copy of a production-scale dataset.
- AC-NFR-10-02: Worklist query execution plans use the expected indexes.

---

## Summary table

| NFR | Title | Non-negotiable? |
|-----|-------|-----------------|
| NFR-01 | Offline / intermittent connectivity | Yes (graceful degradation) |
| NFR-02 | Scale ceiling | Yes |
| NFR-03 | Audit granularity | Yes |
| NFR-04 | Accessibility (WCAG 2.1 AA) | Yes |
| NFR-05 | Performance budget | Yes |
| NFR-06 | Data retention | Yes |
| NFR-07 | Internationalization | Yes |
| NFR-08 | Security and access control | Yes |
| NFR-09 | Browser support | Yes |
| NFR-10 | Database and replication | Yes |

All 10 NFRs are non-negotiable for Phase 1 release. Loosening any requires a documented exception approved by the lab manager + system administrator at the affected deployment.

---

## References

- M-00 Microbiology Module Parent Specification
- `amr-pre-frs-planning-v1.md` §3 (drafted NFRs before formalization here)
- OpenELIS Style Guide foundations
- WCAG 2.1 AA criteria
- ISO 15189:2022 §7.4 (Pre-examination), §7.7 (Examination), §8 (Management system)
