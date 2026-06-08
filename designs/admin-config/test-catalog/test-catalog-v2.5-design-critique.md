# Test Catalog Management — Design Critique (v2.4 + v2.5 staging)

**Date:** 2026-05-14
**Status:** All items triaged with Casey. Resolutions captured per-item below; substantive changes applied to FRS v2.5, v1 preview, and v1 Jira stories.
**Scope:** The unified Test Catalog Management editor as specified across `test-catalog-requirements-v2.4.md` (full vision), `test-catalog-requirements-v2.5.md` (v1/v2 staging + fixes), the v1 HTML preview, and the v1 Jira epic + stories. Critique covers IA, interaction patterns, Carbon fidelity, accessibility, and clinical workflow correctness across both v1 and v2.

---

## Resolution Summary (Casey, 2026-05-14)

| ID | Decision | Notes |
|---|---|---|
| **H-01** | ✅ Applied | `Save as new test…` CTA added to editor header |
| **H-02** | ✅ Applied — **modified** | Feature flag **deleted**. v1 directly replaces legacy admin pages; legacy pages are decommissioned at v1 release. Casey: "MVP has parity with the existing system — why would we need to roll it back?" |
| **H-03** | ✅ Applied — **modified per R-01 discussion** | Warn on save (never block save). On Activate: explicit acknowledgment modal listing the gaps; admin can proceed by acknowledging. Acknowledgment is logged. Pragmatic accommodation for clinics that don't need every demographic (e.g., senior center → no infant ranges). |
| **H-04** | ✅ Applied | AMR retention: historical results frozen at result-time export status; new results respect current flag; WHONET config persists on disable. |
| **H-05** | ❌ Declined | Migration sweep dropped. "Heavy lift for a corner case." |
| **M-01** | ✅ Applied — **modified** | v2 SideNav entries **hidden entirely** in v1 (not "Coming Soon" stubs). Casey: "I prefer to leave out clear indications of missing features." SideNav shows 8 entries in v1, grows to 14 in v2. |
| **M-02** | ✅ Applied | Keyboard reorder (Arrow Up/Down) added on every drag-drop surface. |
| **M-03** | ✅ Applied | Per-component accordion in Sample & Results when test has 2+ components. |
| **M-04 / M-07 / M-09** | ✅ Applied | All three doc clarifications fixed in FRS + preview. |
| **M-05 / M-06 / M-08** | ✅ Applied | Small FRS clarifications, applied silently. |
| **R-01** | ✅ Applied — **modified** | Activation Checklist concept dropped. Coverage is the only gate, with warn-and-acknowledge pattern (not hard block). Casey: "There will always be a manual method as default" + "warn and allow override so we don't block someone who doesn't need infant ranges." |
| **L-01 through L-07** | ✅ Applied | Color collision fixed (v2 badge is grey now, but only relevant in v2 since v1 hides v2 entries); production Carbon component reminder added; modal focus management note added; pagination jump-to-page input enabled; sub-table keyboard reorder covered by M-02; common Coming Soon key dropped (no longer needed per M-01); Sample Storage emojis removed. |

Items below retain their original analysis; status tags are added inline.

---

**Method:** structured walk through every screen/section, cross-referenced against the OpenELIS design constitution principles (i18n, Carbon fidelity, interaction patterns, permissions, FHIR/IHE compliance, data-element reuse, design brief discipline) and the active memory notes (admin permissions binary, sidenav-not-tabs, no multitenancy, reuse data elements, verify JTBD, preview completeness).

## Top-line read

The overall design is **structurally strong**. The flat 14-section SideNav, click-to-open list view, inline-row form patterns, and clean separation of authoring (Test Catalog) from delivery (Notification system) all reflect mature pattern choices. The v1/v2 staging makes a heavy spec implementable in two reviewable chunks. The dependency calls are mostly honest (test-reagent linkage flagged, Compliance gated on S-01, Critical Acknowledgment toggle no-ops until that workflow exists).

What it needs: roughly **18 punch-list items**, none CRITICAL, but **5 HIGH** that should be resolved before v1 kickoff because they affect engineering's contract and 3 of them affect partner-visible behavior. The rest are clarifications, accessibility polish, and one v2 design-conversation worth having now.

---

## Punch list

### HIGH severity

#### H-01 — Add a Duplicate / "Save as new test" affordance

**Where:** Test List View, Test Editor header
**Issue:** v2.3 deliberately dropped the per-row Duplicate action ("redundant — every operation lives inside the editor"), but no in-editor equivalent was specified. Duplicating a test is a real admin workflow — a lab adding 30 antibiotic susceptibility tests differs by ~5 fields across the set. Without Duplicate, admins copy-paste fields manually or work in tabs.
**Recommended fix:** add a secondary CTA in the editor header `Save as new test…` next to the primary `Save Test` button. Opens a small modal asking for new Name + Code; clones the rest. Add the Acceptance Criterion to Story 1 (scaffold/editor header).
**Effort:** S

#### H-02 — Decide what `useTestCatalogV2` OFF means in production

**Where:** Feature flag spec (FRS v2.5 §0.5, D-10)
**Issue:** The flag is ON by default with rollback OFF. But mid-use rollback is dangerous — a deployment that's already authored tests with Domain, AMR, Result Components, etc. will hit a legacy admin that doesn't know about those fields. Are they silently dropped on edit? Hidden? Errors? Not specified.
**Recommended fix:** declare OFF as an **emergency kill-switch only**, not an ongoing per-deployment opt-out. The flag exists to revert if a release goes sideways, but partners do not toggle it for normal use. Document this clearly in the FRS and add a startup warning in the legacy admin when the flag is OFF and v2.5 schema artifacts (Domain values, multi-component tests) are present.
**Effort:** S (doc + small startup-check)

#### H-03 — Define Coverage Validation save behavior (warn vs block)

**Where:** Ranges section, Story 5
**Issue:** v2.4 says coverage validation runs on save and "displays clear error messages for any gaps" — ambiguous whether incomplete coverage blocks save or just warns. Both have failure modes:
- Block: admins making partial edits across multiple sessions get stuck
- Warn-only: a test ships to production with neonatal critical gaps and a patient gets harmed
**Recommended fix:** **warn on save, never block on save** — but add a separate "Activate test" gate that blocks if Coverage Validation has any GAP for the test's domain. Tests stay in `Inactive` status (cannot be ordered) until coverage is complete. This separates the editing workflow from the safety gate.
**Effort:** M (introduces an activation gate alongside the current Active flag)

#### H-04 — AMR flag retention behavior

**Where:** Basic Info AMR flag, Story 2
**Issue:** Spec doesn't address: if an admin disables AMR on a test that already has results in WHONET-exported batches, are those results retroactively excluded? Are new results blocked from WHONET? Are existing WHONET configs preserved as orphaned data?
**Recommended fix:** **Existing results retain their export status** (frozen at result-time). **New results respect the current flag** (off → not exported). **WHONET config persists** when AMR is disabled so re-enabling later is one click. Acceptance Criterion to Story 2.
**Effort:** S (doc + persistence behavior)

#### H-05 — Migration sweep report for free-text tests that look multi-component

**Where:** Result Components migration, Story 1 / Story 3
**Issue:** Existing tests with FREE_TEXT result types that already encode multi-value data (e.g., a test named "Blood Pressure" with free-text "120/80") get migrated to a single PRIMARY component. The migration won't detect or auto-convert. Admins won't know to re-model them.
**Recommended fix:** post-migration, generate a one-time **admin sweep report** listing tests where (`result_type = 'FREE_TEXT'`) AND (`name` matches a heuristic — contains "BP", "pressure", "panel", "spirometry", etc.) for manual review. Surface in the Test List View as a banner: "12 tests may benefit from being re-modeled as multi-component. [Review →]." Acceptance Criterion to Story 1.
**Effort:** M

---

### MEDIUM severity

#### M-01 — Six "Coming Soon" sections in v1 SideNav creates dead-end fatigue

**Where:** Editor SideNav in v1
**Issue:** Admins exploring v1 click into Display Order, Labels, Reagents, Alerts, Reflex & Calc, Compliance — all six show identical "Coming Soon" empty states. After two of these, admins stop exploring; they may also stop trusting that the SideNav reflects real functionality.
**Recommended fix:** keep the SideNav entries (IA stability is correct), but:
- Visually distinguish v2 entries: dimmed text + a lock-icon affordance + a clear "v2" badge that doesn't share the VECTOR Domain Tag color (purple)
- Each "Coming Soon" page should explain **what will be there in v2** (the section purpose) AND **what to do today** (link to wherever the legacy functionality lives — e.g., "Manage reagent records in Master Lists → Reagents").
The current preview's "Coming Soon" empty state is too thin.
**Effort:** S (copy + visual treatment)

#### M-02 — Add keyboard reorder for drag-drop tables (WCAG)

**Where:** Result Components table (Story 3), Display Order (v2), Select List Options (Story 3), Panel preview (v2)
**Issue:** WCAG 2.1 AA requires keyboard accessibility for reorder operations. v2.4 mentions arrow controls for Display Order but not for the other drag-drop surfaces. Drag-drop is mouse-only by default.
**Recommended fix:** every drag-drop reorder gets an Arrow Up / Arrow Down button pair on each row (focusable, Enter activates). Document in the FRS as a cross-section standard. Add as an AC to Stories 3 and 7.
**Effort:** S per surface

#### M-03 — Sample & Results section gets too tall for multi-component tests

**Where:** Sample & Results section (Story 3)
**Issue:** A test with 3 components × Select List Options sub-table per component × 5 Result Interpretations per component = a 1500+ pixel page. Vertical scroll fatigue is real for admin daily work.
**Recommended fix:** within the Sample & Results section, render each component as a Carbon `<Accordion>` item once a test has 2+ components. The "Result Components" table at the top stays flat (the index); each component's per-component config (Select List Options + Interpretations) lives in an expandable accordion below the table. Single-component tests skip the accordion entirely.
**Counter-argument:** flat layout lets admins compare across components without expand/collapse. Open question.
**Effort:** M

#### M-04 — Domain switch confirmation modal is hollow in v1

**Where:** Domain switch on existing test, Story 2
**Issue:** In v1, Compliance is "Coming Soon" for everyone, so toggling Domain doesn't change which sections are visible — the modal's "section visibility may change" copy is a lie until v2.
**Recommended fix:** v1 modal copy focuses only on "historical results were evaluated against the prior domain's rules." Skip the "section visibility may change" line. Update the modal copy in v2 when Compliance lights up.
**Effort:** XS

#### M-05 — Specify what happens to in-progress orders when Override Restricted is enabled mid-flight

**Where:** Sample Storage section, Story 6
**Issue:** Admin enables Override Restricted on a test that has orders in progress. Do those orders get their storage settings locked retroactively, or do they keep what the order-entry user set?
**Recommended fix:** **in-progress orders keep their existing storage settings** (locked-but-unchanged). New orders created after the flag is enabled use the locked version. Document in FRS.
**Effort:** XS

#### M-06 — Inline panel creation needs a "more settings live elsewhere" note

**Where:** Panels section, Story 7
**Issue:** "Create New Panel" expands an inline form with just Name. Admins won't know they can edit panel description / code / default specimens — those settings live in Master Lists → Panels. They'll either look for the missing fields (frustrating) or assume panels can only have a name (wrong mental model).
**Recommended fix:** after panel creation, show a temporary `<InlineNotification>` for ~5 seconds: "Panel '{name}' created and selected. Configure additional panel settings in [Master Lists → Panels]." Link is in-app navigation.
**Effort:** XS

#### M-07 — Ranges view selector in v1 should drop the v2 placeholders

**Where:** Ranges section, Story 5
**Issue:** Preview shows "View: Structured | Table v2 | Visual v2" — greyed labels visible in production would confuse admins (why are these greyed? are they coming? when?).
**Recommended fix:** in v1, render just the section header "Reference Ranges (Structured view)" without a view-mode dropdown. Add the dropdown back in v2 when there are multiple views to switch between.
**Effort:** XS

#### M-08 — "All" sex ranges interaction with Coverage Validation panel

**Where:** Ranges Coverage Validation, Story 5
**Issue:** Tests with only "All" sex ranges still display two cards (Male and Female) in the Coverage Validation panel. Is that right? Or should there be one combined card?
**Recommended fix:** **two cards is correct** — they both indicate coverage via "All" ranges. This preserves the mental model that admins can always add Male-only or Female-only ranges later. Document explicitly in the FRS to prevent engineering ambiguity.
**Effort:** XS (clarification only)

#### M-09 — Empty filter bar default state is inconsistent between FRS and preview

**Where:** Test List View filter bar
**Issue:** FRS says filter bar defaults collapsed; the v1 preview shows it expanded.
**Recommended fix:** **default collapsed**. Most admins search by name, not by filter; expanding when needed costs one click. Update the preview to match.
**Effort:** XS

---

### LOW severity

#### L-01 — Visual color collision: VECTOR Domain Tag is purple; v2 "Coming Soon" badge is also purple

**Where:** SideNav v2 badge + Domain Tag mapping
**Issue:** Two semantically different concepts share a color. A user viewing a VECTOR test's editor sees purple on the Domain badge AND purple on v2 SideNav entries.
**Recommended fix:** v2 badge should use a neutral grey (or a distinct color like Carbon's `gray` Tag). Reserve purple for VECTOR Domain only.
**Effort:** XS

#### L-02 — Production code must use Carbon `<Tag>`, `<DataTable>`, `<TableToolbar>`, not handwritten CSS

**Where:** All v1 sections (note about the preview file)
**Issue:** The v1 preview uses handwritten CSS (.pill, .data-table, .filter-bar) for visual approximation. The production React code must consume `@carbon/react` components directly per Constitution Principle 2 (Carbon Fidelity).
**Recommended fix:** add a non-functional reminder to Story 1: "All production JSX uses `@carbon/react` components; CSS in the v1 preview is for visual approximation only." Already implied by the constitution, worth restating since the preview is the only visual artifact engineering sees.
**Effort:** XS (doc)

#### L-03 — Modal focus management — Carbon handles it, document the expectation

**Where:** all modal patterns (Result Interpretation, Add/Edit Range, Copy from Test, Domain switch)
**Issue:** Focus should move to the modal's first interactive element on open and return to the trigger on close. Carbon's `<Modal>` does this. Worth documenting so engineering doesn't reinvent.
**Recommended fix:** one-line note in the FRS — "all modals MUST use Carbon `<Modal>` and inherit its focus-trap behavior; do not implement custom modal containers."
**Effort:** XS

#### L-04 — Test List View pagination should include a "jump to page" input

**Where:** Test List View pagination
**Issue:** For 200+ test catalogs, clicking Previous/Next is tedious. Carbon `<Pagination>` includes a page-number input — make sure it's enabled.
**Recommended fix:** ensure the Carbon `<Pagination>` config exposes the page-number jump input. AC for Story 1.
**Effort:** XS

#### L-05 — Sub-table reorder inside the Result Components row should also be keyboard-accessible

**Where:** Select List Options + Result Interpretations sub-tables (Story 3)
**Issue:** Same as M-02 but for the inner sub-tables — these are nested inside the Result Components context and might be forgotten.
**Recommended fix:** explicit AC on Story 3: "All sub-table reorders use keyboard arrows + drag-drop both."
**Effort:** XS (covered by M-02 if M-02 is added cross-section)

#### L-06 — i18n key for "Coming Soon" empty states

**Where:** v2 Coming Soon sections in v1
**Issue:** Six v2 sections each render a "Coming Soon" empty state. Six near-duplicate keys would be wasteful. Use a common key.
**Recommended fix:** add `admin.testCatalog.common.empty.comingSoon.title` and `admin.testCatalog.common.empty.comingSoon.helper` with `{sectionName}` substitution.
**Effort:** XS

#### L-07 — Sample Storage special-handling labels currently include emojis in v2.4

**Where:** Sample Storage section, Story 6
**Issue:** v2.4 §Sample Storage Tab special-handling checkbox labels include emojis ("🔒 Protect from light", "❄️ Do not freeze"). These don't render consistently across browsers, screen readers vocalize them awkwardly, and the constitution discourages emoji use. The v1 preview already drops the emojis.
**Recommended fix:** confirm the preview's emoji-free approach is the production behavior. Update the FRS string table to remove emojis. Use Carbon icons instead if a visual marker is desired.
**Effort:** XS

---

## Recommendations not in the punch list

### R-01 — Consider an "Activation Gate" pattern beyond Coverage Validation

Coverage Validation (H-03) is one of several gates a test should pass before it can be Active. Other natural gates:
- At least one Method linked
- At least one Sample Type selected
- At least one Analyzer linked (or explicit "no analyzer" affirmation)
- For AMR tests: WHONET Antibiotic Code is non-empty

Today, none of these block Active. Consider a small "Activation Checklist" widget on the editor header that shows green checks for each gate, with the Activate toggle disabled until all gates pass. Better than scattering individual save-time blocks across sections.

### R-02 — Drag-drop everywhere creates an accessibility-spec maintenance burden

Result Components, Select List Options, Result Interpretations, Display Order, Panel preview, Range bulk-edit — every one of these involves drag-drop. M-02 / L-05 address keyboard alternatives, but in aggregate this design relies heavily on drag-drop UX. Worth confirming that lab admins on Madagascar (often using older keyboards and modest monitors) actually use drag-drop in practice, or whether numeric inputs are more reliable. Probably do both, but if practice favors one, default to it visually.

### R-03 — v2 Alerts tab: integration with the Critical Acknowledgment workflow

The per-rule `acknowledgment_required` toggle is in v2.5 (D-05) and routes to a workflow that doesn't exist yet. When the Critical Acknowledgment workflow is built, the toggle's link should deep-link to the acknowledgment settings (e.g., who's on the acknowledgment queue, escalation policy, SLA timeout). Today the link is a placeholder. Make sure the Critical Acknowledgment workflow's spec authors know this hook exists.

### R-04 — Test ID stability across the migration

The migration creates one `test_result_component` row per existing test, plus backfills `component_id` on three referencing tables. The legacy per-test fields are kept for one release. **Verify:** every internal and external reference to a test's result_type / unit / sig_digits / default_result either reads from the deprecated field (one release of compatibility) or transparently reads from the PRIMARY component. Audit all callers — analyzer interfaces, FHIR sync, reports — before turning off the deprecated fields.

### R-05 — Reagent linkage v2 prerequisite is a load-bearing sub-deliverable

The Reagents tab depends on building the test-reagent linkage in v2. Right now it's mentioned as a v2 scope item but doesn't have its own story. When v2 is planned, carve "Build test-reagent linkage" as a separate v2 sub-story before "Reagents tab UI" — same engineer/team or not, the linkage is a one-PR foundation and the tab is the UI on top.

---

## Cross-cutting things that hold up well

- **No multitenancy assumptions anywhere.** Aligned with the "single-tenant per deployment" memory.
- **Permissions are binary** (`admin.testCatalog.manage` + `compliance.threshold.view`). No invented role matrix.
- **Domain attribute is forward-looking but pays off in v1** via the list filter and the Ranges info banner — admins setting Domain see immediate value.
- **Schema migrations are front-loaded in v1.** v2 is purely additive on the data side.
- **FHIR mapping is committed** (one Observation per component, per D-02) — no ambiguity for engineering.
- **Test Notification system is consumed, not duplicated** in Alerts (per D-03). Strong separation of authoring vs delivery.
- **Compliance is in v2, aligned with Sprint 7 SILNAS work.** Good cross-team sequencing.

---

## Recommended action order

Before v1 kickoff, resolve **H-01 through H-05** — these are partner-visible behaviors that engineering needs locked.

Resolve **M-04, M-07, M-09** with FRS doc updates (XS effort each, but matters for the v1 preview/story accuracy).

Defer **M-01, M-02, M-03** to a brief design follow-up — these are bigger conversations (v2 visual treatment, accessibility cross-section pattern, accordion vs flat layout for multi-component tests).

The **LOW** items can mostly be resolved during engineering implementation (one-line spec additions, small visual fixes).
