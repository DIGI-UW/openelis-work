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
| chore/ledger-reconcile-2026-06-22 | https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-06-22?expand=1 | 2026-06-22 | **MERGED** (PR #181, auto-merged on green — test+build checks SUCCESS; opened on push by the auto-opener, not the connector) | Doc-only: syncs the stale origin ledger (was frozen at 06-15) up to current reality + adds the 2026-06-22 reconciliation entry. Auto-merge + required `test` check will land it on green. **Verified MERGED on main 2026-06-23** (06-22 reconciliation entry present on origin's ledger; remote branch deleted). Doc-only → nothing to drain. |
| design/minion-tbprofiler | https://github.com/DIGI-UW/openelis-work/pull/183 | 2026-06-22 | **MERGED** (PR #183, verified on main 2026-06-23 — remote branch deleted/squash-merged; both spec files present on `origin/main`, App.jsx registry lines ~596–619, MANIFEST ~431–458, and INDEX rows all carry the entries) | MinION + TB-Profiler field-mapping spec v2.2 (re-anchored on flat-file plugin + M-14 import channel) + companion setup guide registered as two spec-only analyzer-integration entries. Source had been mis-staged in the retired `OpenELIS Feature Design/upload/` folder; relocated + registered last session, already drained to `upload/processed/noncanon-retired-2026-06-22/`. GitHub discussion #182; linked OGC-318 (supersedes v1.0). designs/analyzer-integration/minion-tbprofiler-{field-mapping-v2.2,setup-guide-v1.0}.md + App.jsx registry + MANIFEST + INDEX. Tests 230/230. Slug unchanged → no new Jira permalink. |
| design/narrative-figures (interactive) | https://github.com/DIGI-UW/openelis-work/compare/main...design/narrative-figures?expand=1 | 2026-07-01 | **MERGED** (content byte-identical on `origin/main`, verified 2026-07-02) | Test Catalog Editor — Completion & Correction (OGC-1112, Epic; umbrella OGC-949). Landed via an interactive session, not this scheduled run. 3 gallery files md5-match origin/main: `designs/admin-config/test-catalog-editor-completion.{md,jsx,html}`; App.jsx MOCKUP_REGISTRY entry present (added 2026-07-01, status draft, jira OGC-1112). The `-breakdown.md` slicing guide is a planning doc, not part of the gallery changeset (precedent: analyze/breakdown docs). All 4 source files drained from canonical `upload/` → `upload/processed/` this run. Gallery permalink comment already posted to OGC-1112 by Casey 2026-07-01 16:49 (all 4 links) → slug unchanged, no new Jira comment. NOTE: remote branch `design/narrative-figures` still open/undeleted (interactive work) — Casey to delete/close if fully landed. |
| design/report-print-queue-r3 | https://github.com/DIGI-UW/openelis-work/pull/203 | 2026-07-06 | **MERGED** (PR #203, verified 2026-07-08 — merge commit `e36bd6d` is origin/main HEAD; `designs/reports/report-print-queue.{md,jsx,html}` v1.3 present on main) | Report Print Queue **r3 (v1.3)** update-in-place, Epic OGC-1031 (dev not started). Per the upload REGISTER file, r3 REPLACES r2 at the unchanged slug `#/reports/report-print-queue` — overwrote `designs/reports/report-print-queue.{md,jsx,html}` + `mockup-viewer/public/` mirror; r2 archived to `designs/_archive/2026-07-06/`. Filter-bar redesign: Facility/Ward/Requestor `FilterableMultiSelect` server-side typeahead, Ward gated on Facility, Lab No first-class toolbar lookup, inline Search by Patient, targeted-search exclusivity (FR-2-005), no preliminary-print confirm (FR-4-007), inline guidance (FR-1-008). Gallery jsx stubs the two reused OpenELIS components (`SearchPatientForm`, `CustomLabNumberInput`, were `../` imports) to stay self-contained — same pattern r2 used. MANIFEST + App.jsx desc bumped v1.2→v1.3 (`updated: 2026-07-06`). Tests 250/250, build clean. Slug unchanged → no new Jira permalink. Verify MERGED next run. |
| design/results-entry-multicomponent-v1 | https://github.com/DIGI-UW/openelis-work/compare/main...design/results-entry-multicomponent-v1?expand=1 | 2026-07-08 | **MERGED** (PR #204, verified 2026-07-09 — merge commit `62d6ab8` is origin/main HEAD; all 3 files present on main, md5-identical to the upload trio → drained to `processed/`) | Multi-Component Result Entry **v1** — genuinely-new `results-validation` entry. Epic OGC-949 (Test Catalog Mgmt v2.5), consumes the M1 `test_result_component` model; replaces PR #3831 scalar-column approach. jsx mockup + preview html + FRS at `designs/results-validation/results-entry-multicomponent-v1.{jsx,md}` + `-preview.html` (+public mirror); App.jsx MOCKUP_REGISTRY + MANIFEST + INDEX updated. New slug `#/results-validation/multi-component-result-entry-v1`. Tests 251/251, build clean. This branch also carries this ledger sync. Verify MERGED next run. |
| design/results-validation-multicomponent | https://github.com/DIGI-UW/openelis-work/pull/205 | 2026-07-09 | **MERGED** (PR #205, verified 2026-07-09 — both integrated FRSs present on origin/main; App.jsx v4 entries marked SUPERSEDED + OGC-811/OGC-817 repointed onto the new files; MANIFEST+INDEX carry the entries) | Multi-component **integrated** FRSs (epic OGC-1131, program OGC-949): two new full FRSs superseding the v4 specs — `results-entry-multicomponent.md` (supersedes results-entry-v4; OGC-811, OGC-1130, OGC-1131) + `validation-multicomponent.md` (supersedes validation-page-v4; OGC-817, OGC-1130, OGC-1131). v4 gallery entries marked SUPERSEDED (kept for history); OGC-811/OGC-817 repointed to the new files in App.jsx + MANIFEST. Also commits the in-place `designs/reports/patient-report-redesign.md` edit (PR-13 one-row-per-component + §7.5; data-contract stays OGC-1126). No JSX/HTML change (v4 previews stand). App.jsx + MANIFEST + INDEX + dist. Tests 251/251, build clean. New slugs `#/results-validation/results-entry-multi-component-integrated` + `#/results-validation/validation-page-multi-component-integrated`. Verify MERGED next run. |

| design/multicomponent-corrections-analyzer-ingestion | https://github.com/DIGI-UW/openelis-work/compare/main...design/multicomponent-corrections-analyzer-ingestion?expand=1 | 2026-07-09 | **MERGED** (verified on origin/main 2026-07-16 — round-3 new file `designs/results-validation/analyzer-multicomponent-ingestion.md` present; both round-2 corrected FRSs carry `component_id` + OGC-1124; App.jsx registry carries the `analyzer-ingestion-multi-component-results` slug) | Multi-component round 2 + round 3 (epic OGC-1131 / program OGC-949). Round 2 update-in-place (slugs unchanged): overwrote the two PR-#205 integrated FRSs `designs/results-validation/{results-entry-multicomponent,validation-multicomponent}.md` with corrected copies — per-component-notes open question resolved (per-analysis, OGC-1124) + runtime dep now names nullable `RESULT.component_id` FK. Round 3 genuinely-new spec-only entry: `designs/results-validation/analyzer-multicomponent-ingestion.md` (Analyzer Ingestion of Multi-Component Results; jira OGC-1129 +OGC-1131; new slug `#/results-validation/analyzer-ingestion-multi-component-results`) — App.jsx MOCKUP_REGISTRY + MANIFEST + INDEX + dist. Tests 251/251, build clean. Corrected copies + analyzer FRS + STAGING note left in `upload/` pending merge; stale ROUND1 `*-frs.md` copies (md5-match main) drained to processed/. Verify MERGED next run. |

| design/custom-data-export-v1.1 | https://github.com/DIGI-UW/openelis-work/pull/225 | 2026-07-15 | **MERGED** (PR #225, verified on origin/main 2026-07-16 — `designs/reports/custom-data-export.md` carries v1.1/grain-families; MANIFEST description reads "v1.1 (2026-07-15)". Ledger-tracking PR #226 also merged — is origin HEAD 776fe30) | Update-in-place: Custom Data Export & My Report Queue gallery entry (issue #70) v1.0 -> v1.1. Grain families + color legend, QC domain removed, single PII tag, overwrite-confirm saved configs, thresholds -> Printed Reports Config, 90-day cap; data model -> BaseObject<String>+Liquibase, /rest/ paths, ownership 404s, CSV format, async worker/restart recovery, corrected StatusService mappings, FR renumber, Testing Requirements section. All 3 artifacts refreshed (FRS .md, HTML preview, JSX mockup). Built clean off origin/main via isolated worktree (dist rebuilt, no asset conflicts); 238 registry entries preserved. Slug unchanged (#/reports/custom-data-export) -> no new Jira permalink. OGC-479/481/483; companion release 479+481. |

## Reconciliation — 2026-07-20 (scheduled run)
- **Step 0 — no OPEN or stranded PRs.** `git ls-remote` shows origin has **only `refs/heads/main`**
  (HEAD `9ba7a98`, PR #232, 2026-07-19) — every prior ledger branch merged and deleted. Nothing OPEN,
  nothing past the 7-day stranded threshold.
- **Merged interactively since the 07-16 ledger (#228)** and verified present on `origin/main`: **#230**
  Require Requesting Provider / Order Entry (OGC-1143, issue #229), **#227** wire shared HTML preview to
  Test Catalog Completion v2, **#231** Programs Management gallery entry v2 (OGC-781), **#232** Additional
  Information Builder contexts (OGC-781); plus routine `docs-manual` freshness auto-commits direct to main.
  None were scheduled-run work — recorded here for the trail.
- **upload/ ↔ gallery reconcile (content md5 vs full designs/ + public/designs/ tree, 598 files).**
  - **Canonical local staging** (`openelis-work/upload/` on the mount): only two STAGING checklist notes
    (`analyzer-import-bench-experience-STAGING.md`, `multicomponent-analyzer-ui-STAGING.md`) + the GxAlert
    gap-analysis `.docx`. Both STAGING notes' actions are already **done & registered on main**
    (`analyzer-import-redesign-v2.{md,jsx,html}` + `analyzer-multicomponent-mapping-preview.html` present
    and in App.jsx) → nothing to register.
  - **Repo-committed `upload/` on main** (checked per Step 1b): 4 files **IDENTICAL** to already-registered
    gallery files → **drained to `processed/` this run**: `V04-fhir-considerations-for-review.md`
    (→ `designs/vector-surveillance/vector-surveillance-reporting-fhir-considerations.md`),
    `preview-fhir-publication-settings.jsx` (→ `designs/system/fhir-publication-settings.jsx`),
    `inventory-techdebt/inventory-item-type-management-{preview.html,mockup.jsx}`
    (→ `designs/inventory/inventory-item-type-management.{html,jsx}`).
  - **Gallery-newer (stale upload copies; do-not-push, LEFT in place):**
    `order-entry-FRS-v3-three-workflows.md` (main's `designs/sample-collection/order-entry-frs-v3-three-workflows.md`
    is larger/newer), `V04-vector-surveillance-reporting-preview.html` (main's `vector-surveillance-reporting.html`
    updated 2026-07-19 via #232, far newer).
  - **Non-design working docs LEFT in place for Casey:** GxAlert gap-analysis `.docx`,
    `clinical-order-entry-GATES.md`, `order-entry-mockup-vs-delivered-UX-drift.md`,
    `order-entry-three-domain-crosswalk.md`, `s06-lhu-domain-variants-jira-comment-draft.md`,
    `v04-v1.5-ida-brief.md`, `v04-v1.5-jira-comment-draft.md`, `openelis-design-SKILL-updated.md`
    (skill draft, not a gallery entry), `inventory-techdebt/*-jira-story.md`.
- **Genuinely new design artifacts: NONE. Nothing upload-newer → no design push, no PR, no build.**
- **Jira (Step 11):** no new/changed slugs from this run → **no gallery permalinks posted** (noise-avoidance).
  The Atlassian connector was also unauthenticated in this non-interactive session. Residual per the two
  STAGING notes (OGC-288 / OGC-1136 / OGC-1137 post-merge permalinks) was already posted in the 2026-07-15
  interactive run.
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-07-20`) with the 4 IDENTICAL
  drains + this entry; the auto-opener + required `test` check land it on green.

## Reconciliation — 2026-07-16 (scheduled run)
- **Both previously-OPEN PRs are now MERGED. No OPEN or stranded PRs remain.** Verified against a
  fresh `origin/main` clone (HEAD `776fe30`, PR #226):
  - `design/multicomponent-corrections-analyzer-ingestion` (compare-URL row, pushed 2026-07-09 → was
    7 days old, on the stranded threshold) → **MERGED**. Round-3 new spec-only file
    `designs/results-validation/analyzer-multicomponent-ingestion.md` present on main; both round-2
    corrected integrated FRSs (`results-entry-multicomponent.md`, `validation-multicomponent.md`)
    carry the nullable `RESULT.component_id` FK + per-analysis OGC-1124 resolution; App.jsx registry
    carries the new `#/results-validation/analyzer-ingestion-multi-component-results` slug.
  - `design/custom-data-export-v1.1` (PR #225, pushed 2026-07-15 → 1 day old) → **MERGED**.
    `designs/reports/custom-data-export.md` carries v1.1 grain-families content; MANIFEST description
    reads "v1.1 (2026-07-15)". The doc-only ledger-tracking PR **#226** also merged (origin HEAD).
- **Canonical `upload/` reconcile (content md5 vs full `designs/` + `public/designs/` tree, 480 files).**
  Five design-like files all IDENTICAL to files already on `origin/main` **and** already registered in
  App.jsx + MANIFEST (landed via interactive sessions since the 07-15 run) → **drained to `processed/`**:
  | Upload file | Class | Landed as |
  |---|---|---|
  | results-entry-multicomponent.md | IDENTICAL | designs/results-validation/results-entry-multicomponent.md |
  | analyzer-import-redesign-v2-mockup.jsx | IDENTICAL (registered) | designs/system/analyzer-import-redesign-v2.jsx |
  | analyzer-import-redesign-v2-preview.html | IDENTICAL (registered) | designs/system/analyzer-import-redesign-v2-preview.html |
  | analyzer-import-redesign-v2-frs.md | IDENTICAL (registered) | designs/system/analyzer-import-redesign-v2.md |
  | analyzer-multicomponent-mapping-preview.html | IDENTICAL (registered) | designs/analyzer-integration/analyzer-multicomponent-mapping-preview.html |
- **Genuinely new design artifacts: NONE.** Everything design-like in canonical `upload/` is already on
  `main` and registered → **no design push, no PR, no build.**
- **Non-design working docs LEFT in `upload/` for Casey** (no gallery counterpart; not FRS/mockups):
  `test-catalog-data-model-handoff.md` (Test Catalog data-model reference for the Panel/Sample-Type/Lab-Unit
  threads), `analyzer-import-bench-experience-STAGING.md` and `multicomponent-analyzer-ui-STAGING.md`
  (gallery-thread staging notes whose "register/commit" actions are already done — the v2 redesign +
  multicomponent-mapping preview are landed & registered on main; their "after-merge" Jira permalink
  steps for OGC-288 / OGC-1136 / OGC-1137 are the only residual — see below).
- **Jira (Step 11):** this run registered nothing new (no new/changed slugs from this run) → **no gallery
  permalinks posted, to avoid noise.** The analyzer-import-redesign-v2 (OGC-288) and
  analyzer-multicomponent-mapping (OGC-1136), plus OGC-1137 (Pending Imports inbox), landed via
  interactive sessions; per the two STAGING notes their post-merge permalink comments are still a
  residual action — **flagged for Casey to confirm/post** rather than posted here.
- **ANOMALY — mount on a dirty feature branch.** The workspace mount's git HEAD is
  `0d2ff21` on branch `design/narrative-figures` (NOT main), with a dirty working tree (mods to
  `designs/analyzer-integration/analyzer-profile-mapping.md`, `designs/reports/patient-report-redesign.md`,
  `designs/system/analyzer-import.md`, `.gitignore`, `analyzer-mapping-spec.skill`, package-lock, plus a
  batch of staged upload/ deletions). Interactive-session work-in-progress. **origin/main was used as the
  source of truth for all verification; the mount was not touched for git.** → Casey: land/clean the
  `design/narrative-figures` branch and the in-place `analyzer-profile-mapping.md` / `analyzer-import.md`
  edits (referenced by the two STAGING notes) if intended.
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-07-16`) so origin's ledger
  reflects the two newly-MERGED rows + this entry; auto-opener + required `test` check land it on green.

## Reconciliation — 2026-07-15 (interactive run — workbench cleanup)

- **Five PRs opened and merged this session; remote is now `main` only.** #216 `design/fix-auto-open-trigger` (CI: auto-open PRs for chore/**, skill/**, feat/** — root-cause fix for branches not auto-opening); #217 `design/analyzer-import-v2-mc-mapping` (Analyzer Results Import v2, OGC-288 + multi-component mapping, OGC-1136 — merged main up, viewer rebuilt, 253 tests); #218 `design/results-entry-multicomponent-concurrency` (Results Entry section O Concurrency, OGC-811); #219 `design/refresh-qa-versioning-styleguide` (style-guide v2 + qa-menu versioning doc refresh — note: the table row above claimed this merged 2026-06-12, which was wrong; it actually landed today via #219); #220 `design/retire-analyzer-import-v1` (archive the superseded Analyzer Import v1). All verified MERGED on origin/main.
- **Stale ledger branches pruned unmerged.** `chore/ledger-reconcile-2026-07-{03,06,10,13,14,15}` were superseded snapshots of THIS file (PR #211 for 07-10 closed); `-06-24`/`-06-25` also removed. Nothing lost — the ledger is regenerable and this section is the regeneration.
- **11 dead branches pruned earlier** (merged/closed PRs left lingering): narrative-figures, v2-mockups-uncertainty-and-trap-details, analyzer-bruker-bd-epicenter, skills/ogc-lean-workflow-2026-06, micro-sync6, validation-page-v3, caseyi-patch-1, feat/png-project-view-archive, plus skill/analyzer-mapping-spec-round3 (confirmed superseded by main — merging it would have regressed the skill ~40 lines).
- **Jira permalinks posted:** OGC-288, OGC-1136, OGC-1137 (analyzer import v2 + MC mapping cards); OGC-811 (section-O-landed note; card permalink already present); OGC-1054 already carried its Analyzer Types & Mapping permalink.
- **upload/ to gallery reconcile (Step 1b).** Drained to processed/: `report-management.{md,jsx,html}` (md5-identical to designs/admin-config on main) and `order-entry-developer-reference.md` (landed on main via #187; upload copy stale). STILL PENDING registration: `csv-bulk-order-intake-{frs.md,mockup.jsx,preview.html}` (OGC-1138) — PR #212 staged these into upload/ but the process-design registration into designs/ + MANIFEST + viewer was never run, so they have no gallery counterpart yet; needs a full process-design pass. Other upload/ files are working drafts / superseded copies left in place (jira-comment drafts, ida-brief, order-entry FRS drafts, crosswalks, gap analysis).
- **No stranded PRs; no OPEN rows older than 7 days.** Remote branch list = `main` only.

## 2026-07-15 (interactive run) — Test Catalog Management shell surfaces
- **Three genuinely-new changesets registered** on branch `design/test-catalog-shell-surfaces` (tests 252/252, build green):
  1. **Lab Units Management v2.0** (OGC-189) — supersede-in-place of the 2026-03 `lab-units.{md,jsx}` stub (slug `#/admin-config/lab-units` unchanged). Rebased on TEST_SECTION; no code field; Description required; domain a declared dependency (unbuilt on develop despite OGC-361).
  2. **Panel Management Domain Upgrade v2.2** (OGC-224) — supersede-in-place of the 2026-03 `panel.{md,jsx}` stub (slug `#/admin-config/panel` unchanged). Single required domain (Clinical at launch); no code/lab-unit; sample types derived from member tests.
  3. **Test Catalog Completion v2** (OGC-1112, FR-46–86) — NEW entry `test-catalog-completion-v2.{md,jsx}`; consolidated single-handoff FRS (Part A delivered-gap corrections + Part B Manageability). Marks `test-catalog-editor-completion` `superseded_by`.
  Superseded v1 stubs archived to `designs/_archive/2026-07-15/` (+ local `OpenELIS Feature Design/_archive/2026-07-15/`).
- **dist/ intentionally NOT committed** — `deploy-gallery.yml` rebuilds dist from source on push to main, and the sample-type PR (still OPEN) also touches dist with hashed filenames; committing dist here would create a guaranteed merge conflict that blocks squash auto-merge. Source-only commit avoids it.
- **PR:** connector `create_pull_request` returned 403 (app lacks `pull_requests:write`). Branch pushed with the PAT. One-click compare URL:
  https://github.com/DIGI-UW/openelis-work/compare/main...design/test-catalog-shell-surfaces?expand=1
  Auto-merge + required `test` check land it on green. This branch carries this ledger row too. **Status: OPEN** — verify MERGED next run.
- **NOTE:** `design/sample-type-management` (OGC-296 v2.1, from the 2026-07-14 scheduled run) is **still OPEN/unmerged** on origin (HEAD `0ec76b4`). Two design PRs now open concurrently; they touch disjoint MANIFEST/App.jsx/INDEX regions and neither commits dist, so both should squash-merge cleanly.
- **Jira (Step 11):** gallery permalinks posted to OGC-189, OGC-224, OGC-1112 this run.
- **Source files** left in `upload/` (drain-on-merge): lab-units-management-{v2.0.md,mockup.jsx}, panel-management-{v2.1.md,mockup.jsx}, test-catalog-completion-v2-{frs.md,mockup.jsx}.

## Reconciliation — 2026-07-14 (scheduled run, scoped: Sample Types only)
- **Step 0:** No OPEN or stranded PRs coming in — every prior ledger row verified MERGED on origin/main
  (HEAD `0ec76b4`, PR #213). The two most-recently-OPEN rows both landed: `design/report-mgmt-and-catalog-editor-20260701`
  (report-management + test-catalog-editor-completion present on main) and `design/report-print-queue-r3`
  (report-print-queue v1.3 on main).
- **One genuinely-new change registered this run: Sample Type Management v2.1 (OGC-296).** Scoped per Casey's
  2026-07-14 handoff — only the two Sample Type files were processed; everything else in `upload/` is mid-iteration
  and was left untouched. Update-in-place / supersede at the unchanged slug `#/admin-config/sample-type-management`:
  overwrote `designs/admin-config/sample-type-management.{md,jsx}` with the v2.1 spec (was v1.0, 634→130 ln) and the
  OGC-296 developer-handoff Carbon mockup (was 711→346 ln, self-contained). Both were genuinely new content
  (md5 no-match anywhere in `designs/`). MANIFEST + App.jsx bumped (`updated: 2026-07-14`, v2.1 description, tags).
  INDEX row unchanged (same filenames). Superseded v1.0 archived to `designs/_archive/2026-07-14/` (+ local
  `OpenELIS Feature Design/_archive/2026-07-14/`). Tests 251/251, `npm run build` clean.
- **PR:** connector `create_pull_request` returned 403 ("Resource not accessible by integration" — GitHub App still
  lacks `pull_requests:write`). Branch `design/sample-type-management` pushed with the PAT. CI auto-opener should open
  it on push; one-click fallback compare URL:
  https://github.com/DIGI-UW/openelis-work/compare/main...design/sample-type-management?expand=1
  Auto-merge + required `test` check land it on green. This branch also carries this ledger row, so merging the one PR
  syncs the ledger. **Status: OPEN** — verify MERGED next run.
- **Jira (Step 11):** gallery permalinks (spec + mockup) to be posted on OGC-296. Slug is unchanged from v1.0 but the
  content is a material v1.0→v2.1 supersede, so a refreshed comment is warranted. Related context tickets OGC-538 /
  OGC-949 / OGC-985 intentionally NOT attached (per handoff). NOTE: OGC-538 domain enum is NOT built despite its Done
  status — the spec's caveat.
- **Explicitly left in `upload/` (not this run, per handoff):** panel-management-v2.1.md (content v2.2, not green-lit),
  test-catalog-panels-sampletypes-preview.html (would leak un-analyzed Test Catalog Manageability changeset),
  test-catalog-data-model-handoff.md (thread-internal, superseded), and the analyzer-import / multicomponent files
  (different effort). sample-type-domain-classification.md + sample-type-multi-domain-addendum.md kept as-is (historical).

## Reconciliation — 2026-07-09 (scheduled run, r2)
- **Second scheduled run of the day.** Coming in, origin/main HEAD was `965a82f` (PR #206 ledger sync
  from the earlier 07-09 run). The earlier run left `design/results-validation-multicomponent` recorded
  **OPEN**; verified this run it **MERGED as PR #205** — both integrated FRSs are on `origin/main`, the
  v4 gallery entries are marked SUPERSEDED, and OGC-811/OGC-817 are repointed onto the new files. Ledger
  row flipped MERGED.
- **`multicomponent-coordination-STAGING.md` drove two new actions this run** (ROUND 2 + ROUND 3, both
  dated 2026-07-09, staged after the earlier run):
  - **ROUND 2 (update-in-place, slugs unchanged):** the corrected `upload/{results-entry-multicomponent,
    validation-multicomponent}.md` differ from the PR-#205 on-main copies by exactly the two intended
    fixes (diff-confirmed) — the per-component-notes open question is resolved (decided per-analysis,
    OGC-1124) and the runtime-storage dependency now names the nullable `RESULT.component_id` FK shape.
    Overwrote the two on-main files. No registry/description change (same-day content correction).
  - **ROUND 3 (genuinely new, spec-only):** registered **Analyzer Ingestion of Multi-Component Results**
    (`designs/results-validation/analyzer-multicomponent-ingestion.md`; jira OGC-1129 +OGC-1131). Category
    choice: `results-validation` (keeps the OGC-1131 multi-component family together; the note listed it
    first, `analyzer-integration` was the alternative). App.jsx MOCKUP_REGISTRY + MANIFEST.yaml + INDEX.md.
  - Pushed together on branch `design/multicomponent-corrections-analyzer-ingestion`. **Tests 251/251,
    `npm run build` clean.** Connector `create_pull_request` returned **403** (app still lacks
    `pull_requests:write`) → ledger row **OPEN** with the one-click compare URL; CI auto-opener +
    required `test` check land it on green.
  - **Compare URL:** https://github.com/DIGI-UW/openelis-work/compare/main...design/multicomponent-corrections-analyzer-ingestion?expand=1
- **Source drain:** the two stale ROUND1 `*-frs.md` copies (`results-entry-multicomponent-frs.md`,
  `validation-multicomponent-frs.md`) were byte-identical (md5) to the PR-#205 on-main files → drained
  from canonical `upload/` → `upload/processed/` (superseded by the registered-name copies, per the
  STAGING note). The corrected copies + `analyzer-multicomponent-ingestion-frs.md` + the STAGING note
  are **left in `upload/` pending this PR's merge** — drain next run after verifying MERGED.
- **Jira (Step 11) — DEFERRED.** The new analyzer slug (`#/results-validation/
  analyzer-ingestion-multi-component-results` → OGC-1129) is not live until this PR merges + Pages
  deploys, so posting now would be a dead link (07-01/07-08/earlier-07-09 precedent). Post to OGC-1129
  next run once MERGED. The two ROUND-2 corrected FRSs are update-in-place with unchanged slugs (OGC-811/
  OGC-817 already carry those permalinks from PR #205) → no new Jira permalink.
- **Anomaly:** the workspace **mount** git remains stale/dirty (HEAD `7816ef6`) — origin/main was used
  as source of truth via a fresh clone; the mount git was not touched.


## Reconciliation — 2026-07-09 (scheduled run)
- **Both recent PRs verified MERGED. No OPEN/stranded PRs coming in.**
  - `design/results-entry-multicomponent-v1` (was OPEN, pushed 2026-07-08 → 1 day old, not stranded) →
    **MERGED as PR #204**; origin/main HEAD is the #204 merge commit `62d6ab8`. All three v1 files present
    on main and md5-identical to the upload trio → **drained**
    `results-entry-multicomponent-v1-{mockup.jsx,preview.html,frs.md}` from canonical `upload/` → `upload/processed/`.
  - `design/report-print-queue-r3` → already MERGED (PR #203, recorded 2026-07-08).
- **One genuinely-new changeset registered this run: multi-component INTEGRATED FRSs** (branch
  `design/results-validation-multicomponent`, epic OGC-1131 / program OGC-949), per the
  `multicomponent-coordination-STAGING.md` note. Two new full FRSs that carry forward all v4 scope:
  `results-entry-multicomponent.md` (supersedes `results-entry-v4.md`; OGC-811, OGC-1130, OGC-1131) and
  `validation-multicomponent.md` (supersedes `validation-page-v4.md`; OGC-817, OGC-1130, OGC-1131), both
  registered **spec-only** (no JSX/HTML — the v4 previews still stand). Marked the two v4 gallery entries
  **SUPERSEDED** (kept for history) and **repointed OGC-811/OGC-817** off v4 onto the new files in both
  App.jsx and MANIFEST. Also committed the in-place `designs/reports/patient-report-redesign.md` working
  edit (new PR-13 "one row per component" reusing the PR-06 panel indent + §7.5 note; data-contract change
  stays owned by OGC-1126, so the redesign's visual-only scope is preserved). **Tests 251/251, `npm run build` clean.**
  Connector `create_pull_request` returned 403 (app still lacks `pull_requests:write`) → ledger row **OPEN**
  with the one-click compare URL; CI auto-opener + required `test` check land it on green.
- **Compare URL (open with one click):** https://github.com/DIGI-UW/openelis-work/compare/main...design/results-validation-multicomponent?expand=1
- **Jira (Step 11) — DEFERRED (Casey's staging note says "after merge" + dead-link avoidance).** Permalinks
  for the two new slugs (`#/results-validation/results-entry-multi-component-integrated`,
  `#/results-validation/validation-page-multi-component-integrated`) go to OGC-811 / OGC-817; the report edit
  references OGC-1126. The gallery routes are not live until this PR merges + Pages deploys, so posting now
  would be dead links (07-01/07-08 precedent). Post next run once MERGED.
- **Canonical `upload/` reconcile (md5 vs full designs/ tree):** after draining the v1 trio, the only
  design-relevant staged files were the two new FRSs (registered above) + `multicomponent-coordination-STAGING.md`
  (a staging/instruction note, not a gallery artifact — left for Casey). Everything else in the mount `upload/`
  is prior-classified non-design working docs/assets (UW/DIGI logos, OGC-1066 order-entry research,
  `gallery-registration.md`, `openelis-design-SKILL-updated.md`, the Aspect GxAlert docx, `inventory-techdebt/`
  Jira stories, `test-catalog-qa-20260706/`, and the three carried-over V-04/S06 comment drafts). Left in place.
- **NOTES / anomalies:** (1) the workspace **mount** git is stale/dirty (HEAD `7816ef6`, an old
  "Test Catalog completion" commit, well behind origin) with local working edits incl. the patient-report
  edit and prior drains — **origin/main was used as source of truth** via a fresh clone; the mount git was
  not touched. The patient-report edit was carried into the PR by copying the mount working copy.
  (2) Stale un-deleted remote design branches remain prunable.

## Reconciliation — 2026-07-08 (scheduled run)
- **The one previously-OPEN PR is now MERGED. No OPEN or stranded PRs remained coming in.**
  `design/report-print-queue-r3` (pushed 2026-07-06 → 2 days old, not stranded) → **MERGED as PR #203**;
  its merge commit `e36bd6d` is origin/main HEAD and the r3 v1.3 artifacts are live on main.
- **One genuinely-new design registered this run: Multi-Component Result Entry v1** (branch
  `design/results-entry-multicomponent-v1`). New `results-validation` entry; Epic OGC-949, consumes the
  OGC-949 M1 `test_result_component` model, replaces the PR #3831 scalar-column approach. Copied the
  upload trio → `designs/results-validation/results-entry-multicomponent-v1.{jsx,md}` + `-preview.html`
  (+ `mockup-viewer/public/` mirror); added App.jsx MOCKUP_REGISTRY + MANIFEST.yaml + INDEX.md entries.
  Self-contained jsx (React + @carbon/react only, default export). **Tests 251/251, `npm run build` clean.**
  Connector `create_pull_request` returned 403 (app still lacks `pull_requests:write`) → ledger row **OPEN**
  with the one-click compare URL; CI auto-opener + required `test` check land it on green. New slug
  `#/results-validation/multi-component-result-entry-v1`.
- **Compare URL (open with one click):** https://github.com/DIGI-UW/openelis-work/compare/main...design/results-entry-multicomponent-v1?expand=1
- **Jira (Step 11) — DEFERRED (dead-link + noise avoidance).** The only linked ticket is the umbrella
  Epic **OGC-949** (Test Catalog Mgmt v2.5, heavily-managed; no dedicated V1 story). The new gallery page
  is not live until this PR merges + Pages deploys, so posting now would be a dead link (07-01 precedent).
  Post the `#/results-validation/multi-component-result-entry-v1` permalink to OGC-949 next run once merged,
  if a permalink on the umbrella epic is wanted.
- **Canonical `upload/` reconcile (md5 vs full designs/ + public tree, 455 gallery files):** the
  `results-entry-multicomponent-v1-{frs.md,mockup.jsx,preview.html}` trio is the ONLY genuinely-new design
  artifact. Everything else in the mount `upload/` is prior-classified non-design working docs/assets —
  UW/DIGI logo images, `PENDING-PRS.md`, `README.md`, OGC-1066 order-entry research docs, `gallery-registration.md`,
  `openelis-design-SKILL-updated.md`, `Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx`, the `inventory-techdebt/`
  Jira stories, the `test-catalog-qa-20260706/` QA-output dir, and the three carried-over non-design drafts
  (`s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md`, `v04-v1.5-jira-comment-draft.md`).
  Left in place for Casey. **Source trio NOT drained** — it stays in `upload/` until the PR is verified MERGED
  next run (drain-on-merge convention), and the mount is a dirty non-canonical branch anyway (git untouched).
- **NOTES / anomalies:** (1) the workspace **mount** is on a dirty `design/narrative-figures` branch with
  the ledger frozen at 06-26 — **origin/main was used as source of truth**; the mount was not touched for git.
  (2) `report-management.{jsx,md,html}` (OGC-1111) still sit in origin's committed `upload/` though the entry
  landed on main 07-01 — stale leftovers, safe for Casey to drain to `processed/`. (3) Stale un-deleted remote
  branches remain prunable (per 07-02 list) incl. `design/narrative-figures`.

## Reconciliation — 2026-07-06 (scheduled run)
- **No tracked PR was OPEN or stranded coming in.** origin/main HEAD was PR #202 (`chore/ledger-reconcile-2026-07-02`); every prior ledger row is MERGED. The two superseded doc-only branches `chore/ledger-reconcile-2026-06-24`/`-06-25` (flagged 07-02, >7d) remain deletable by Casey; `design/narrative-figures` remote branch is still open/undeleted (interactive work, content landed).
- **One genuinely-new change registered this run: Report Print Queue r3 (v1.3).** Update-in-place per the upload REGISTER file (r3 REPLACES r2; Epic OGC-1031, dev not started). main was v1.2, upload r3 is v1.3 → upload-newer. Swapped the 3 gallery artifacts + public mirror at the unchanged slug `#/reports/report-print-queue`, archived r2 to `designs/_archive/2026-07-06/`, bumped MANIFEST + App.jsx to v1.3 (`updated: 2026-07-06`). Made the gallery jsx self-contained by stubbing two external OpenELIS component imports (`SearchPatientForm`, `CustomLabNumberInput`) — the r2 precedent. Tests 250/250, `npm run build` clean. Branch `design/report-print-queue-r3` pushed; connector PR returned 403 → compare URL below; ledger row **OPEN**.
- **Jira (Step 11):** skipped — slug `#/reports/report-print-queue` unchanged, so no new/changed gallery permalink to post (noise-avoidance). **NOTE for Casey:** the upload REGISTER file requests a manual follow-up on Epic **OGC-1031** — refresh the Epic's attachment to `report-print-queue-carbon-r3.jsx` and note the r3 revision in a comment. Left for Casey (attachment upload isn't available to this scheduled run).
- **Canonical `upload/` reconcile:** the r3 source trio (frs/carbon/preview) + the REGISTER file are the only genuinely-new design artifacts. Everything else in the mount `upload/` is stale/non-design — UW/DIGI logo images, `PENDING-PRS.md`, `README.md`, OGC-1066 order-entry research docs, `gallery-registration.md`, `openelis-design-SKILL-updated.md`, `Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx`, the three carried-over non-design drafts, plus the already-landed `test-catalog-editor-completion` set and a `test-catalog-qa-20260706` QA-output dir. **NOTE:** the mount's own `upload/PENDING-PRS.md` is stale (frozen at 06-26) and the mount is on a dirty `design/narrative-figures` branch — origin/main was used as source of truth; the mount was not touched for git.
- **Compare URL (open with one click):** https://github.com/DIGI-UW/openelis-work/compare/main...design/report-print-queue-r3?expand=1

## Reconciliation — 2026-07-01 (scheduled + interactive run)
- **Two genuinely-new admin-config entries registered this run** (branch
  `design/report-mgmt-and-catalog-editor-20260701`, tests 250/250, build green):
  1. **report-management** — admin registry to choose/version/override report templates
     (shipped-default vs custom-override + revert). Epic **OGC-1111**. Staged by Casey in
     canonical `upload/` on main (commit e8689a2). jsx + preview html + FRS.
     Slug `#/admin-config/report-management`.
  2. **test-catalog-editor-completion** — completes the unified Test Catalog editor
     (create-in-place, edit-shared-settings-together, result-type-first Sample & Results,
     LOINC integrity, Ranges fixes, i18n fallback). **OGC-748/749/751/753/754/767/928**.
     Was staged only on the mount's `design/narrative-figures` branch `upload/` (NOT on
     origin `upload/`), so the scheduled scan missed it — Casey flagged it interactively.
     jsx + preview html + FRS. Slug `#/admin-config/test-catalog-editor-completion`.
     The `-breakdown.md` (non-binding dev slicing guide) was left in `upload/`, not registered.
- **PR:** connector `create_pull_request` again returned 403 ("Resource not accessible by
  integration" — GitHub App still lacks `pull_requests:write`). Branch pushed successfully with
  the refreshed PAT. The CI auto-opener is not opening PRs (0 open PRs in the repo), so → **Casey:
  open the PR with one click:** https://github.com/DIGI-UW/openelis-work/compare/main...design/report-mgmt-and-catalog-editor-20260701?expand=1 . Auto-merge + required `test` check land it on green.
  This branch also carries this ledger update, so merging the one PR syncs the ledger too.
- **PAT refreshed & verified working for push** (the prior token had gone read-only/expired;
  06-30 run could not push). Write-probe (temp branch create+delete) succeeded this run.
- **Catch-up resolved:** origin/main's ledger (was frozen at 06-23 on 06-30) is now current through
  **06-26** — the big re-stage commit e8689a2 re-committed `upload/PENDING-PRS.md`. The three
  stranded doc-only branches `chore/ledger-reconcile-2026-06-24/25/26` are now **moot** (their
  content is on main); → Casey may delete them.
- **Jira (Step 11) — DEFERRED:** gallery permalinks for OGC-1111 and the seven test-catalog stories
  are **not posted yet** because the gallery pages aren't live until this PR merges + Pages deploys.
  Post permalinks next run once merged (avoids dead links).
- **upload/ reconcile (md5 vs full designs/+public tree):** aside from the two new ref sets above,
  everything else in `upload/` is already-classified non-design working files (V04-*, order-entry-*,
  drafts, inventory-techdebt stories, GxAlert docx) — nothing else new to register.


## Reconciliation — 2026-07-02 (scheduled run)
- **No tracked PR is OPEN or stranded.** Every row in the ledger table is MERGED. The prior run's
  own doc-only ledger PR (`chore/ledger-reconcile-2026-06-26`) is confirmed **MERGED** — its
  reconciliation entry is present on `origin/main`'s ledger.
- **One genuinely-new design set landed since last run — already on main (NOT pushed by this run).**
  `test-catalog-editor-completion` (OGC-1112 Epic) appeared in canonical `upload/` (4 files, dated
  2026-07-01) but all 3 gallery files are **byte-identical (md5)** to their `origin/main`
  counterparts — `designs/admin-config/test-catalog-editor-completion.{md,jsx,html}` — and the
  App.jsx registry + MANIFEST already carry the entry (added 2026-07-01, status draft, jira
  OGC-1112). It was processed & pushed by an interactive session (branch `design/narrative-figures`).
  This run only **drained the 4 source files** (3 IDENTICAL gallery files + the `-breakdown.md`
  planning/slicing doc, which is not part of the gallery changeset) from `upload/` → `upload/processed/`.
  **No design push, no PR, no build** — nothing new to register.
- **Jira (Step 11):** skipped. OGC-1112 already carries the full gallery-permalink comment (posted
  by Casey 2026-07-01 16:49 — interactive mockup, HTML preview, FRS, slicing guide). Slug unchanged
  → no new/duplicate comment.
- **Canonical `upload/` reconcile (md5 vs full designs/ + public tree, 561 files):** after the drain,
  the only files left in `upload/` are non-design working docs / assets left for Casey — the two UW/DIGI
  logo images, `PENDING-PRS.md`, `README.md`, the OGC-1066 order-entry research docs
  (`clinical-order-entry-GATES.md`, `order-entry-three-domain-crosswalk.md`,
  `order-entry-mockup-vs-delivered-UX-drift.md`), `gallery-registration.md`,
  `openelis-design-SKILL-updated.md` (skill-file update, not a gallery design),
  `Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx`, and the three carried-over non-design drafts
  (`s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md`,
  `v04-v1.5-jira-comment-draft.md`). Nothing upload-newer, nothing genuinely new → nothing to push.
- **ANOMALY — stranded doc-only ledger branches.** Two prior scheduled-run ledger-sync branches never
  merged and are **> 7 days old**: `chore/ledger-reconcile-2026-06-24` and
  `chore/ledger-reconcile-2026-06-25` (tips NOT ancestors of main; their 06-24/06-25 reconciliation
  entries are absent from main's ledger). They are **doc-only and superseded** — the 06-26 entry (with
  everything they would have recorded) is on main — so no content is lost. → Casey: safe to delete both
  stale remote branches (and close their PRs if opened).
- **Other stale un-deleted remote branches** (content already on main via squash-merge, safe to prune):
  `design/analyzer-bruker-bd-epicenter` (#164), `design/refresh-qa-versioning-styleguide`,
  `design/micro-sync6`, `design/validation-page-v3`, `design/v2-mockups-uncertainty-and-trap-details`.
  Plus `design/narrative-figures` (this run's landed set — still open/undeleted).
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-07-02`) recording the
  test-catalog-editor-completion MERGED row + this entry; auto-opener + required `test` check land it.


## Reconciliation — 2026-06-26 (scheduled run)
- **No OPEN or stranded PRs.** Every row in the ledger above is MERGED. Nothing was pending coming
  into this run; no new PR opened (nothing genuinely new to register — see reconcile below).
- **ANOMALY — unpushed local commit on the workspace mount.** The mount's git HEAD is `5f97a34`
  ("chore(gallery): archive superseded micro FRS-v1 docs + old single-screen mocks"), **1 commit
  ahead of `origin/main` (`c4e94d3`) and not pushed.** It archives ~20 superseded microbiology
  `*-frs-v1.md` + old single-screen mock files into `designs/_archive/2026-06-26/` and trims
  MANIFEST.yaml (−191) + App.jsx (−204). Looks like legitimate cleanup from an interactive session
  earlier today, left uncommitted-to-origin. **Not pushed by this run** (provenance is an interactive
  session, not this upload run; archive intent not independently verified). → Casey: push it from the
  Mac if intended (`git push origin main` from the mount, or open it as a PR).
- **Canonical `upload/` reconcile (content md5 vs full `designs/` + `public/` tree, 546 files):**
  | Upload file | Class | Action |
  |---|---|---|
  | V04-fhir-considerations-for-review.md | IDENTICAL → designs/vector-surveillance/vector-surveillance-reporting-fhir-considerations.md | drained to processed/ |
  | amr-micro-workflow-flow.html | IDENTICAL → designs/microbiology/amr-micro-workflow-flow.html | drained |
  | m-00/m-01/m-02/m-09/m-10/m-12 (6 micro FRS) | IDENTICAL → designs/microbiology/ | drained |
  | preview-fhir-publication-settings.jsx | IDENTICAL → designs/system/fhir-outbound-push.jsx | drained |
  | inventory-techdebt/inventory-item-type-management-mockup.jsx | IDENTICAL → designs/inventory/inventory-item-type-management.jsx (renamed slug) | drained |
  | inventory-techdebt/inventory-item-type-management-preview.html | IDENTICAL → designs/inventory/inventory-item-type-management.html (+public mirror) | drained |
  | order-entry-FRS-v3-three-workflows.md | gallery-NEWER (gallery 134 ln > upload 123; registered on main as order-entry-frs-v3-three-workflows.md) | drained (stale; do-not-push) |
  | order-entry-developer-reference.md | gallery-NEWER (gallery 89 ln > upload 79; registered on main) | drained (stale) |
  | V04-vector-surveillance-reporting-preview.html | gallery-NEWER (gallery vector-surveillance-reporting.html 1603 ln > upload 707) | drained (stale) |
  | Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx | DUPLICATE of upload/processed/ copy (byte-identical) | could not remove ("operation not permitted") — left in place, harmless |
- **Genuinely new design artifacts: NONE.** Everything design-like in `upload/` is already on `main`
  (IDENTICAL) or superseded by a newer gallery version (stale). **→ no design push, no PR, no build.**
- **Supporting / non-design files LEFT in `upload/` for Casey** (no gallery counterpart; not FRS/mockups):
  OGC-1066 order-entry analysis docs (`clinical-order-entry-GATES.md`,
  `order-entry-three-domain-crosswalk.md`, `order-entry-mockup-vs-delivered-UX-drift.md`) — these are
  research/companion artifacts to the already-registered order-entry FRS v3 + dev-reference, not
  standalone gallery entries (same precedent as analyze.md/breakdown.md in prior runs); the two
  `inventory-techdebt/*-jira-story.md` Jira stories; `gallery-registration.md` (registration
  instructions for the micro walkthrough — already executed; the HTML is landed);
  `openelis-design-SKILL-updated.md` (a skill-file update, not a gallery design); and the three
  carried-over non-design drafts (`s06-lhu-domain-variants-jira-comment-draft.md`,
  `v04-v1.5-ida-brief.md`, `v04-v1.5-jira-comment-draft.md`) left for Casey to post manually.
- **Jira (Step 11):** nothing changed — no new or changed slugs → no gallery permalinks to post.

## Reconciliation — 2026-06-23 (scheduled run)
- **Both previously-open ledger items are now MERGED. No OPEN or stranded PRs remain.**
  - `design/minion-tbprofiler` (PR #183, was OPEN, pushed 2026-06-22 → 1 day old, not stranded) →
    **MERGED**. Verified on `origin/main` (HEAD `f0328d7`): remote branch deleted (squash-merge);
    both spec files present — `designs/analyzer-integration/minion-tbprofiler-field-mapping-v2.2.md`
    + `minion-tbprofiler-setup-guide-v1.0.md`; App.jsx MOCKUP_REGISTRY (lines ~596–619), MANIFEST
    (~431–458), and INDEX rows all carry the two entries.
  - `chore/ledger-reconcile-2026-06-22` (PR #181) → **MERGED** confirmed. Origin's `PENDING-PRS.md`
    carries the 2026-06-22 reconciliation entry; remote branch deleted. Doc-only → nothing to drain.
- **Source drain:** none needed. The MinION sources were drained last session to
  `upload/processed/noncanon-retired-2026-06-22/`; the ledger-reconcile PR was doc-only.
- **Canonical `upload/` reconcile (md5 vs full designs/ + public tree, 535 files):** no design
  artifacts staged. Only `PENDING-PRS.md`, `README.md`, `.gitkeep`, and the same three carried-over
  non-design working drafts — `v04-v1.5-jira-comment-draft.md`,
  `s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md` (two "what shipped"
  changelog drafts + an unsent brief to Ida, no gallery counterpart). Left in place for Casey to
  post manually. **Nothing upload-newer, nothing genuinely new → no design push.**
- **Anomaly cleared.** The retired non-canonical `OpenELIS Feature Design/upload/` folder (flagged
  last run with 9 stale microbiology files) now holds only its `README.md` pointer — cleaned up.
- **Jira (Step 11):** nothing changed (no new/changed slugs) → no new or changed gallery permalinks
  to post. MinION slug unchanged since its OGC-318 permalink last session.
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-06-23`) so origin's
  ledger reflects the MinION MERGED status + this entry; auto-opener + required `test` check land it.

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

- **Late add (post-run, interactive):** Casey flagged a TB-Profiler spec that had been mis-staged in
  the **retired** `OpenELIS Feature Design/upload/` folder (so the scheduled scan correctly missed it —
  it only reads canonical `upload/`). Registered this session: MinION + TB-Profiler field-mapping spec
  v2.2 + companion setup guide → two spec-only `analyzer-integration` entries (branch
  `design/minion-tbprofiler`, PR #183, GitHub discussion #182, OGC-318). Tests 230/230. Source drained
  to `upload/processed/noncanon-retired-2026-06-22/`.

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
