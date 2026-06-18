# openelis-design — Changelog

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
