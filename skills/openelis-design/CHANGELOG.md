# openelis-design — Changelog

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
