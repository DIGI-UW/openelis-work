# Pending PRs ledger

Tracks gallery PRs that are pushed but not yet confirmed merged to `origin/main`.
At the start of each `process-design` session, reconcile this list (Step 0): mark MERGED and
drain source files to `processed/`; flag anything OPEN > 7 days.

| Branch | PR (compare URL) | Pushed | Status | Notes |
|---|---|---|---|---|
| design/biorad-cfx-opus-v1.2 | https://github.com/DIGI-UW/openelis-work/compare/main...design/biorad-cfx-opus-v1.2?expand=1 | 2026-06-18 | **MERGED** (verified on main 2026-06-19 — content byte-identical; git blob SHA `ae2ea628bc1e5e6ca4017e2c786d8c71d23382c9` matches origin/main exactly) | Update-in-place: BioRad CFX Opus connection spec v1.1→v1.2 (real-sample validated, CFX Maestro 5.2 XLSX, Indonesia). Registry: updated:2026-06-18 + description; added/githubIssue#11 preserved. Content+metadata only. Source file drained to processed/ 2026-06-19. Slug unchanged (`#/analyzer-integration/biorad-cfx-opus-analyzer-connection-spec`) → no new Jira permalink needed. |
| design/analyzer-profile-mapping | https://github.com/DIGI-UW/openelis-work/compare/main...design/analyzer-profile-mapping?expand=1 | 2026-06-18 | **MERGED** (verified on main 2026-06-18 — remote branch deleted, squash/auto-merge; content byte-identical on main) | Analyzer Types & Mapping (draft), OGC-1054. analyzer-integration; HTML prototype + FRS + gap-analysis companion. Tests 230/230. Permalink comment already posted to OGC-1054 (prior run); slug unchanged → no new comment. 3 gallery files md5-match origin/main (analyzer-profile-mapping.{md,html}+gap-analysis.md, +public mirror); App.jsx + MANIFEST entries present. Source set drained to processed/ (incl. analyze.md + breakdown.md planning docs, not part of changeset). |
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
| design/v04-v1.5-manual-entry-helper | https://github.com/DIGI-UW/openelis-work/pull/166 | 2026-06-15 | **MERGED** (PR #166, verified on main 2026-06-16) | Landed on main via combined PR #166 (head commit 37325f6, merged 2026-06-15 23:19 UTC) alongside the S06 LHU variants. vector-surveillance-reporting registry entry carries v1.5 Manual Entry Helper content. Gallery permalink (interactive prototype) comment posted to OGC-585 this run. V-04 v1.5 Manual Entry Helper pivot landed (OGC-585). FRS bumped v1.4 → v1.5 with new §6.6 (FR-V04-MEH-001…012, AC-MEH-01…19, US-V04-09), §17.4 reframed to deferred Automated Submission, vectorReport.manualEntryHelper permission, vectorReport.manualEntry.* i18n namespace. HTML + JSX mockups gained Manual Entry Helper tab + Admin field-map tab. @TBD-Ida flags throughout for portal field list / cadence / sporozoite gate / i18n strings — pending Ida (APHL Indonesia) confirmation. MANIFEST + App.jsx registry + public/ mirror refreshed. |
| design/s06-lhu-domain-variants | https://github.com/DIGI-UW/openelis-work/pull/166 | 2026-06-15 | **MERGED** (PR #166, verified on main 2026-06-16) | Landed on main via combined PR #166 (head commit 37325f6, merged 2026-06-15 23:19 UTC). S06c-environmental-lhu + S06d-vector-lhu registry entries + designs/reports/ files confirmed on main; base S06 route slug unchanged (`#/vector-surveillance/laporan-hasil-compliance-report`). Gallery permalink comment for the two new sibling specs posted to OGC-552 this run. S06 Laporan Hasil chassis gets two domain-variant siblings — S06c Environmental LHU (canonical Indonesian preview + bilingual annotated sibling) and S06d Vector LHU (3 result-table modes: Species ID / Surveillance Indices / Larval Population). Also renamed gallery S06 base files to align with S06X naming convention (`laporan-hasil-compliance-report.{md,jsx,html}` → `S06-laporan-hasil-compliance-report-{frs-v1.0.md,mockup.jsx,preview.html}`). Adds §7a "Domain Variants" cross-reference to S06 base FRS, including the bilingual annotated previews. Each variant has its own FRS, mockup, and annotated preview wiring. Files: S06c-environmental-lhu-{frs-v1.0.md,mockup.jsx,preview.html,preview-annotated.html} + S06d-vector-lhu-{frs-v1.0.md,mockup.jsx,preview.html,preview-annotated.html} + S06-lhu-crosswalk-raw.md (research artifact). MANIFEST + App.jsx registry + INDEX + public/ mirror refreshed. |
| chore/fix-pages-deploy-trigger | https://github.com/DIGI-UW/openelis-work/pull/169 | 2026-06-17 | **MERGED** (PR #169, verified on main 2026-06-17 — HEAD is the #169 merge commit 2494648; remote branch deleted) | **Fixes the stuck Pages deploy.** Root cause: auto-merge.yml merged via GITHUB_TOKEN, which does NOT trigger deploy-gallery.yml — so the published gallery froze at the last human merge (8764f85, 2026-06-12). #166/#167/#168 all auto-merged via the bot token → never deployed. Fix: auto-merge uses PR_BOT_TOKEN fallback so the merge push cascades to the deploy; deploy-gallery deploy+upload steps also run on workflow_dispatch (manual escape hatch). Commit a1ce292. To publish the backlog now: merge this PR manually (human merge triggers deploy) OR push an empty commit to main OR run the deploy workflow manually after this lands. Current main verified clean (both VectorLHU render fine; no undefined @carbon imports anywhere). |
| design/s09-eligibility-gate-v3 | https://github.com/DIGI-UW/openelis-work/compare/main...design/s09-eligibility-gate-v3?expand=1 | 2026-06-16 | **MERGED** (content byte-identical on main, verified 2026-06-17; remote branch deleted — squash-merge so tip is not an ancestor. All 5 files md5-match: FRS/jsx/html + analysis + breakdown docs; App.jsx registry shows v3.0. Source files drained to processed/.) | S-09 Pre-Analytical Eligibility Gate **v2.0 → v3.0** simplification rewrite (OGC-580; epic OGC-527). Update-in-place: overwrote canonical `designs/sample-collection/pre-analytical-eligibility-gate.{md,jsx,html}` (slug/route unchanged → `#/sample-collection/pre-analytical-eligibility-gate`) + public/ mirror; added supporting docs `S09-eligibility-gate-{analysis,breakdown}-v3.md`. v3 drops the auto-evaluating per-SampleType criteria engine for a generic manual acceptance checklist at Step 3 + Resample-spawns-draft-order; config is a lightweight master list decoupled from the Test Catalog editor (OGC-746 removed the SampleType tab v2.0 relied on). No new status enum / permission keys. App.jsx + MANIFEST descriptions bumped + `updated: 2026-06-16`. Commit 5b83a7d. Local vitest could not complete (sandbox worker-pool hang, S-09-unrelated); new jsx + App.jsx Babel-parse clean and mockup is self-contained — required `test` CI check gates the auto-merge. **PLAN-ONLY breakdown: no Jira epic/story restructuring performed.** Gallery permalink comment posted to OGC-580 this run. |

## Reconciliation — 2026-06-22 (scheduled run)
- **No OPEN or stranded PRs.** Every row in the ledger is MERGED; all content verified live on
  `origin/main` (HEAD `90f834a…`, ahead of the last human merge — the #169 Pages-deploy fix is
  working). Spot-verified this run via the GitHub connector: `designs/microbiology/` (m-00…m-15 +
  `*-frs-v1` siblings all present) and `designs/reports/` (S06 base + S06c + S06d FRS/jsx/html all
  present).
- **origin/main ledger was STALE — fixed this run.** The committed `upload/PENDING-PRS.md` on
  `origin/main` was frozen at the 2026-06-15 state: it still listed
  `design/v04-v1.5-and-s06-lhu-domain-variants` as **PENDING** and was missing the 06-16…06-19
  reconciliation entries. Those four runs updated only the local working copy and never pushed the
  doc-only ledger change. This run pushes the fully-reconciled ledger to bring origin in line.
  Verified PR #166 content (V-04 v1.5 Manual Entry Helper + S06c Environmental LHU + S06d Vector LHU)
  is present on main → that bundled branch is correctly MERGED (now split into its two component
  MERGED rows in the table above).
- **Canonical `upload/` reconcile:** no design artifacts staged. Only `PENDING-PRS.md`, `README.md`,
  `.gitkeep`, and the three carried-over non-design drafts
  (`s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md`,
  `v04-v1.5-jira-comment-draft.md`) — changelog/brief drafts left for Casey to post manually.
  **Nothing upload-newer, nothing genuinely new → no design push.**
- **Anomaly — non-canonical upload folder still populated.** `OpenELIS Feature Design/upload/`
  (retired 2026-06-12; should hold only a README pointer per CLAUDE.md) still contains 9 stale files:
  `gallery-registration.md`, `m-00-micro-module-parent.md`, `m-01-amr-reference-data.md`,
  `m-02-breakpoint-catalog.md`, `m-04-case-workbench-core.md`, `m-09-whonet-export.md`,
  `m-10-hub-subscription.md`, `m-12-test-reagent-linkage.md`, `m-14-mycobacteriology-tb.md`. All
  correspond to microbiology content already landed on main (module fully populated). Stale
  leftovers, not new work — recommend draining to `processed/` or deleting. Not processed (not in
  canonical `upload/`; content already on main).
- **Jira (Step 11):** nothing changed → no new or changed gallery permalinks to post.

## Reconciliation — 2026-06-19 (scheduled run)
- **The one previously-OPEN PR is now MERGED. No stranded PRs remain; nothing OPEN.**
  - `design/biorad-cfx-opus-v1.2` (pushed 2026-06-18) → **MERGED** to main. Verified by content:
    the upload source `biorad-cfx-opus-analyzer-connection-spec.md` has git blob SHA
    `ae2ea628bc1e5e6ca4017e2c786d8c71d23382c9`, **byte-identical** to
    `designs/analyzer-integration/biorad-cfx-opus-analyzer-connection-spec.md` on `origin/main`
    (same blob SHA returned by the GitHub connector). The v1.2 update-in-place content (CFX Maestro
    5.2 multi-sheet XLSX path, `.pcrd`/`.prcl`/`.pltd` extensions, `Sample`=lab-number rule, Run
    Information metadata sheet) is live on main. Was 1 day old → not stranded.
- **Source files drained:** `biorad-cfx-opus-analyzer-connection-spec.md` moved from `upload/` →
  `upload/processed/`.
- **upload/ ↔ gallery reconcile (git blob SHA / md5):** after the drain, the only remaining files in
  canonical `upload/` are `PENDING-PRS.md`, `README.md`, and the same three non-design working drafts
  carried since 2026-06-16 (`s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md`,
  `v04-v1.5-jira-comment-draft.md`). These are changelog/brief drafts left in place for Casey to post
  manually, not design artifacts (no `.jsx`/`.html`/FRS, no gallery counterpart).
  **Nothing upload-newer, nothing genuinely new → nothing to push.**
- **Jira (Step 11):** skipped — the BioRad v1.2 change was an update-in-place with an unchanged slug
  (`#/analyzer-integration/biorad-cfx-opus-analyzer-connection-spec`); no new or changed gallery
  permalink to post. (The spec carries no linked OGC ticket in its body; tracking is via GitHub
  issue #11.)
- **Note:** the local workspace mount's git HEAD is stale (an old Sync-6 commit `0833b17`); origin/main
  was queried directly via the GitHub connector for all verification, which is authoritative.

## Reconciliation — 2026-06-18 (scheduled run)
- **The one previously-OPEN PR is now MERGED. No stranded PRs remain; nothing OPEN.**
  - `design/analyzer-profile-mapping` (pushed 2026-06-18) → **MERGED** to main (remote branch
    deleted; auto-merge/squash so tip is not an ancestor). Verified by content: the 3 gallery
    source files are byte-identical (md5) to their `origin/main` counterparts —
    `designs/analyzer-integration/analyzer-profile-mapping.md` (from `*-frs.md`),
    `analyzer-profile-mapping.html` (from `*-prototype.html`, + public mirror), and
    `analyzer-profile-mapping-gap-analysis.md`. App.jsx registry + MANIFEST carry the entries and
    the gallery permalink `#/analyzer-integration/analyzer-profile-mapping`.
- **Source files drained:** all 5 `analyzer-profile-mapping-*` artifacts moved from `upload/` →
  `upload/processed/`. This includes `analyze.md` + `breakdown.md`, which were skill planning
  outputs never part of the gallery changeset (NO content match on main; ledger changeset was
  "HTML prototype + FRS + gap-analysis companion" only).
- **upload/ ↔ gallery reconcile (md5, full designs/ + public tree, 533 files):** after the drain,
  the only remaining files in canonical `upload/` are `PENDING-PRS.md`, `README.md`, and three
  non-design working drafts (`s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md`,
  `v04-v1.5-jira-comment-draft.md`). These three are changelog/brief drafts left in place for Casey
  to post manually (carried over from the 2026-06-16 reconciliation), not design artifacts.
  **Nothing upload-newer, nothing genuinely new → nothing to push.**
- **Jira (Step 11):** skipped — the analyzer permalink was already posted to OGC-1054 in the prior
  run and the slug/route is unchanged. No new or changed permalinks to post.

## Reconciliation — 2026-06-17 (scheduled run)
- **Both previously-OPEN PRs are now MERGED. No stranded PRs remain; nothing OPEN.**
  - `chore/fix-pages-deploy-trigger` → **PR #169**, merged to main (origin/main HEAD is the #169
    merge commit `2494648`; remote branch auto-deleted). The stuck-Pages-deploy fix has landed, so
    the auto-merge → deploy cascade should now publish future merges.
  - `design/s09-eligibility-gate-v3` → **MERGED** (squash-merge, remote branch deleted). Verified by
    content: all 5 source files are byte-identical (md5) to their `origin/main` counterparts —
    `designs/sample-collection/pre-analytical-eligibility-gate.{md,jsx,html}` + supporting
    `S09-eligibility-gate-{analysis,breakdown}-v3.md`; App.jsx registry + MANIFEST carry v3.0.
- **Source files drained:** the 5 S-09 v3 artifacts moved from `upload/` → `upload/processed/`.
- **upload/ ↔ gallery reconcile:** after the drain, the only remaining files in canonical `upload/`
  are `PENDING-PRS.md`, `README.md`, and three non-design working drafts
  (`s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md`,
  `v04-v1.5-jira-comment-draft.md`). All three are byte-identical to the copies committed in the
  repo's `upload/` on main — they are changelog/brief drafts left in place for Casey to post
  manually, not design artifacts. **Nothing upload-newer, nothing genuinely new → nothing to push.**
- **Jira (Step 11):** skipped — both merged changesets already had their gallery permalink comments
  posted in prior runs (S-09 → OGC-580; slug/route `#/sample-collection/pre-analytical-eligibility-gate`
  unchanged), and the Pages-fix PR is infra (no linked OGC ticket). No new or changed permalinks to post.

## Reconciliation — 2026-06-16 (scheduled run)
- **Both previously-PENDING changesets are now MERGED via combined PR #166.** `design/v04-v1.5-manual-entry-helper`
  and `design/s06-lhu-domain-variants` were pushed and squash-merged together as **PR #166** (head
  commit `37325f6`, merged 2026-06-15 23:19 UTC). Verified on `origin/main`: vector-surveillance-reporting
  carries v1.5 Manual Entry Helper content; S06c-environmental-lhu + S06d-vector-lhu registry entries
  and `designs/reports/S06[cd]-*` files present. **No stranded PRs remain** (nothing OPEN > 7 days).
- **Jira permalinks posted this run:** OGC-552 (new S06c + S06d interactive gallery + FRS permalinks —
  these two sibling slugs were missing from the ticket) and OGC-585 (V-04 interactive gallery prototype
  permalink — ticket previously had only the HTML-preview URL + FRS blob links, not the `#/` route). Both
  verified rendered as `<a>` anchors. Shared epic OGC-527 skipped to avoid noise (heavily-managed,
  many linked entries). Base S06 route slug unchanged → its existing OGC-552 permalink left as-is.
- **upload/ ↔ gallery reconcile:** the only files in canonical `upload/` are working docs
  (PENDING-PRS.md, README.md, and three V-04/S06 drafts: `s06-lhu-domain-variants-jira-comment-draft.md`,
  `v04-v1.5-ida-brief.md`, `v04-v1.5-jira-comment-draft.md`). **No design artifacts (.jsx/.html/FRS)
  are staged in upload/** — the #166 design files were processed directly in a clone in a prior session.
  Nothing upload-newer or genuinely new → **nothing to push.** The two jira-comment drafts are richer
  "what shipped" changelogs left in place for Casey to post manually if he wants the detailed version;
  the concise Step-11 permalink comments were posted instead. The ida-brief is an unsent draft to Ida.

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
