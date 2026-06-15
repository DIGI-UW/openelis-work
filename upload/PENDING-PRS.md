# Pending PRs ledger

Tracks gallery PRs that are pushed but not yet confirmed merged to `origin/main`.
At the start of each `process-design` session, reconcile this list (Step 0): mark MERGED and
drain source files to `processed/`; flag anything OPEN > 7 days.

| Branch | PR (compare URL) | Pushed | Status | Notes |
|---|---|---|---|---|
| design/test-catalog-micro-workflow-attribute | https://github.com/DIGI-UW/openelis-work/compare/main...design/test-catalog-micro-workflow-attribute?expand=1 | 2026-06-12 | **MERGED** (PR #157, verified on main 2026-06-12) | OGC-925 registered; admin-config; tags microbiology+png; permalink comment added to OGC-925. Source files drained to _archive. |
| design/micro-sync6-v2 | https://github.com/DIGI-UW/openelis-work/compare/main...design/micro-sync6-v2?expand=1 | 2026-06-12 | **MERGED** (PR #156, verified on main 2026-06-12) | Sync 6 — M-00/M-04/M-14 aliquoting-reuse overwrites. Source files drained to _archive. |
| design/micro-m10-m12-prototypes | https://github.com/DIGI-UW/openelis-work/pull/158 | 2026-06-11 | **MERGED** (PR #158, verified on main 2026-06-12) | m-10 + m-12 prototype HTMLs confirmed on main. Source files drained. |
| design/refresh-qa-versioning-styleguide | https://github.com/DIGI-UW/openelis-work/compare/main...design/refresh-qa-versioning-styleguide?expand=1 | 2026-06-12 | **MERGED** (verified on main 2026-06-12) | qa-menu-versioning-plan.md + style-guide-v2-patterns-inventory.md confirmed on main. |
| design/register-m10-hub-subscription | https://github.com/DIGI-UW/openelis-work/compare/main...design/register-m10-hub-subscription?expand=1 | 2026-06-12 | **MERGED/SUPERSEDED** (m-10 on main via #158) | m-10 hub-subscription content present on main; redundant with #158. Branch can be deleted. |
| design/management-dashboard-refresh | https://github.com/DIGI-UW/openelis-work/pull/161 | 2026-06-12 | **MERGED** (PR #161, verified on main 2026-06-15) | lab-management-dashboard refresh confirmed on main (designs/system + public mirror). Previously stranded; PR was opened & auto-merged since last run. OGC-485 already carries the gallery permalink in its description. |
| design/admin-rewrite-batch | https://github.com/DIGI-UW/openelis-work/pull/160 | 2026-06-12 | **MERGED** (PR #160, verified on main 2026-06-15) | admin-mvp-scope + 8 config surface HTMLs confirmed on main (designs/admin-config). Previously stranded; opened & auto-merged since last run. Registry entries have no jira link (no permalink to post). |
| design/inventory-item-type-management | https://github.com/DIGI-UW/openelis-work/pull/162 | 2026-06-12 | **MERGED** (PR #162, verified on main 2026-06-15) | Inventory Item-Type Management confirmed on main (designs/inventory). Registry entry has no jira link. |
| chore/auto-open-design-prs | https://github.com/DIGI-UW/openelis-work/pull/165 | 2026-06-12 | **MERGED** (PRs #163 & #165, verified on main 2026-06-15) | open-pr-on-push CI auto-opener landed on main. |
| design/amr-micro-narrative-v21 | https://github.com/DIGI-UW/openelis-work/pull/159 | 2026-06-12 | **MERGED** (PR #159, verified on main 2026-06-15) | AMR narrative v2.1 refresh (OGC-782). On main via merge-base check. OGC-782 already carries module gallery permalinks (heavily-managed epic) — skipped to avoid noise. |
| design/analyzer-bruker-bd-epicenter | https://github.com/DIGI-UW/openelis-work/pull/164 | 2026-06-12 | **MERGED/SUPERSEDED** (content on main via PR #164, verified 2026-06-15) | All 3 files (Bruker spec v1.1 + companion v1.0, BD EpiCenter spec v1.0) byte-identical on main; App.jsx + MANIFEST entries present. Branch tip not an ancestor (squash-merge) but content fully landed. Gallery permalink comments posted to OGC-323 + OGC-434 (verified rendered `<a>` anchors). |
| design/v04-v1.5-and-s06-lhu-domain-variants | https://github.com/DIGI-UW/openelis-work/compare/main...design/v04-v1.5-and-s06-lhu-domain-variants?expand=1 | 2026-06-15 | **PENDING** (pushed) | Bundled PR covering both OGC-585 (V-04 v1.5) and OGC-552 (S06 LHU domain variants). V-04 v1.5 — Manual Entry Helper pivot: FRS bumped v1.4 → v1.5 with new §6.6 (FR-V04-MEH-001…012, AC-MEH-01…19, US-V04-09), §17.4 reframed to deferred Automated Submission, vectorReport.manualEntryHelper permission, vectorReport.manualEntry.* i18n namespace. HTML + JSX mockups gained Manual Entry Helper tab + Admin field-map tab. @TBD-Ida flags throughout for portal field list / cadence / sporozoite gate / i18n strings — pending Ida (APHL Indonesia) confirmation. S06 LHU — chassis gets two domain-variant siblings: S06c Environmental LHU (canonical Indonesian preview + bilingual annotated sibling) and S06d Vector LHU (3 result-table modes: Species ID / Surveillance Indices / Larval Population). Renamed gallery S06 base files to align with S06X naming convention. Adds §7a 'Domain Variants' cross-reference section to S06 base FRS. MANIFEST + App.jsx registry + INDEX + public/ mirror refreshed. |

## Reconciliation — 2026-06-15 (scheduled run)
- **All previously-OPEN/STRANDED branches are now MERGED.** The two stranded branches
  (management-dashboard-refresh, admin-rewrite-batch) were opened as PRs #161/#160 and auto-merged
  between 2026-06-12 and this run; #162, #159, #163/#165 also landed; #164 carried the
  analyzer-bruker/bd-epicenter content onto main. **No stranded PRs remain.**
- **Jira permalinks posted this run:** OGC-323 (Bruker MALDI Biotyper integration spec + companion
  guide) and OGC-434 (BD EpiCenter integration spec) — comments with clickable gallery + FRS links,
  verified rendered as `<a>` anchors. OGC-485 + OGC-782 already carried current permalinks → skipped.
- **upload/ ↔ gallery reconcile:** zero exact-content matches, but every design-like file in the
  canonical `upload/` folder already has a gallery counterpart that is **equal or newer**
  (e.g. Barcode Labels gallery v2.5 vs upload v1.0; AMR work landed as v2.1). Nothing is upload-newer
  or genuinely new → **nothing to push.** Remaining upload/ files are stale design copies
  (gallery-newer; do-not-push) plus non-design working docs (handoffs, prompts, CSV/XLSX templates,
  transcripts, backlogs). Left in place; recommend Casey drain them to processed/ when convenient.

## Jira — done 2026-06-12
- **OGC-925**: already carried `microbiology` + `PNG` labels and was already linked (Relates) to the
  Microbiology epic **OGC-782** — no change needed there. Parent remains OGC-746 (Test Catalog v2.5),
  per link-not-reparent convention. Added a comment with **clickable** gallery + FRS permalinks
  (verified rendered as `<a>` anchors). Permalink:
  `https://digi-uw.github.io/openelis-work/#/admin-config/test-catalog-microbiology-workflow-attribute`
