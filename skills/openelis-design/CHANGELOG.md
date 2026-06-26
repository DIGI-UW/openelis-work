# openelis-design — Changelog

## 2026-06-26 (v3.3) — Specs stay implementation-free; tickets scoped to user value

- Removed all implementation direction from the spec path. `/analyze` Passes K (Audit Trail)
  and L (Envers) deleted; remaining passes relabeled so A–M stay contiguous (Breakdown→K,
  Lab Context→L, Cross-Feature→M; "Pass O" references updated).
- `/specify` Stage 2 "Permissions & Audit" brief item is now "Access" — who can use the
  feature and do what, in terms of existing roles; no audit_trail/Envers/permission-key/
  Spring Security/Roles Builder mechanics.
- `/breakdown` now slices and titles strictly by user value: principle 2 forbids splitting a
  version *or a story* by technical layer; new anti-patterns for layer-split stories and
  technical-layer titles; story-point rubric, examples, and coverage check reworded to
  user-facing capabilities; cross-cutting = localization + access only.
- references/permissions-and-audit.md rewritten as "Access & Roles" (no audit/Envers).
- references/frs-template.md: "Data Model" → "Information & Data" (domain terms, traces to
  real data); "Permissions & Audit" → "Access"; URL pattern corrected to /MasterListsPage/
  <editorKey>; Dependencies reworded off "services/entities".
- references/jira-template.md: title-format and rules require user-scoped stories (no
  backend/API vs frontend/UI split); cross-cutting lines drop audit_trail/Envers; route fixed.
- Repackaged the root bundle from the current tree (now includes ogc-workflow.md, previously
  missing).


- 2026-06-23 — Added references/ogc-workflow.md and updated jira-conventions.md for the now-LIVE OGC Lean workflow (Acceptance gate, Reject Count, Contract field, per-Epic Feature Doc).

## 2026-06-18 (round 4) — First /crosscheck run folded back in

- Ran /crosscheck on the Analyzer Types & Mapping FRS (vs Analyzer Maintenance FRS).
- spec-registry.md: added the **Analyzer Maintenance & Service** row; enriched the
  **Analyzer Types & Mapping** row (routes, shared concepts, up/downstream deps); added
  Alerts-model and Analyzers-IA hotspots.
- decision-log.md: added **D-027** (Analyzers is a top-level SideNav group; per-analyzer
  detail uses `/analyzers/{id}/<subpage>`) to resolve the two specs' IA disagreement.
- SKILL.md /crosscheck output format tuned: Verdict now leads with a clear/⚠/blocked call;
  Contradictions section sits above Overlaps; "You may be forgetting" scoped to build-once
  items not already tabled; added a Registry-upkeep section to the template.


## 2026-06-18 (round 3) — Portfolio awareness: /crosscheck + decision log + spec registry

- New command **/crosscheck**: scans a feature (early at brief time, and as /analyze Pass O)
  for (1) overlap with other specs, (2) contradiction of prior decisions, (3) up/downstream
  dependency gaps. Commands table is now Seven; chain is /clarify → /crosscheck → /specify
  → /analyze → /checklist → /breakdown.
- `references/decision-log.md` — ADR-lite ledger seeded with 26 decisions from memory
  (GLOBAL + FEATURE scope, active/superseded/provisional). /crosscheck cites these by ID.
- `references/spec-registry.md` — overlap/dependency index, one row per feature (entities,
  routes, shared concepts, up/downstream deps). Seeded from known specs; many cells TODO.
- /analyze gains Pass O (cross-feature overlap & contradiction).
- /specify and /breakdown now have a closing "registry upkeep" step so the index stays fed.
- Reference Files table lists all 10 references.


## 2026-06-18 (round 2) — Memory promoted into references + verified IA

- Added `references/verified-data-models.md` — field-verified data models (App/Common
  Properties, Site Info, Validation, WorkPlan, Order/Patient Entry, Menu Config, Test
  Notification, Test Catalog Alerts) so /specify reuses real fields (design-addendum MUST A).
- Promoted `references/module-inventory.md` and `references/current-state-gotchas.md` from
  draft stubs to populated (Jira anchors OGC-527/899/1031/556, referral URL, EQA V2,
  reagent linkage, label presets, known-broken routes from QA).
- Added `references/jira-conventions.md` — clickable links, Done≠shipped, PR-sized slicing
  for Claude Code, labels, no-emoji-in-funder-docs, reorg proposal (unapplied).
- Added `references/admin-ia-inventory.md` — self-contained verified admin route snapshot
  (no longer depends on the openelis-test-catalog-qa skill being loaded).
- **Corrected the admin URL pattern** in SKILL.md: live app uses path-segment
  `/MasterListsPage/<editorKey>` (e.g. `/MasterListsPage/commonproperties`), NOT the old
  `?type=` query form. Updated IA section, examples, and JSX route comment.
- Updated the Reference Files table to list all 8 references.


## 2026-06-18 — Reference docs added + governance consolidation
- Added the support files SKILL.md referenced but that weren't shipped in the bundle:
  - `references/carbon-anti-patterns.md` (full catalog)
  - `references/frs-template.md`, `references/jira-template.md` (complete templates)
  - `references/permissions-and-audit.md`, `references/current-state-gotchas.md`,
    `references/module-inventory.md` (DRAFT — populated from known facts, marked for verify)
  - `memory/constitution.md` (pointer to upstream + design-relevant summary)
  - `memory/design-addendum.md` (consolidated)
- Constitution wired in as a pointer to
  `DIGI-UW/OpenELIS-Global-2/.specify/memory/constitution.md` (synced v1.10.0, 2026-04-06),
  with a re-sync trigger so it can't silently drift.
- Removed the "Constitution Amendment (proposed)" block that was pasted into the middle of
  the `/analyze` section; its two principles (No-Hard-Delete, Design-for-Large-Catalogs)
  now live in `memory/design-addendum.md`, referenced from `/analyze` Pass D.
- Updated the top governance-load block and Reference Files table to match.

> DRAFT reference files (`permissions-and-audit`, `current-state-gotchas`,
> `module-inventory`) contain TODO markers — verify against the live app/codebase and
> replace with confirmed content.
