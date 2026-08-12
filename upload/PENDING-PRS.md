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

| design/inventory-module-redesign | https://github.com/DIGI-UW/openelis-work/pull/236 | 2026-07-23 | **MERGED (PR #236) — then DEDUPED** | Genuinely-new gallery entry: **Inventory Module Redesign** (FRS v1.9, **OGC-438**). Paired FRS + HTML preview at `designs/inventory/inventory-module-redesign.{md,html}` (+ `mockup-viewer/public/` mirror), slug `#/inventory/inventory-module-redesign`. App.jsx MOCKUP_REGISTRY (`component:null`, htmlUrl+specPath) + MANIFEST + INDEX updated. FRS **supersedes** `reagent-forecasting-facility` (existing entry left untouched; supersession flag left for Casey). Local vitest + full vite build both hung (pre-existing sandbox worker-pool hang); App.jsx bundles clean via esbuild + change is additive (`component:null` + static HTML) so required `test` CI check gates auto-merge. dist NOT committed (deploy rebuilds; avoids squash conflict). No `githubIssue` wired (api.github.com blocked + connector read-only) — flag for Casey. Jira permalink to OGC-438 DEFERRED until merged+deployed. Verify MERGED next run. |
| design/results-portal-c3-track-r | https://github.com/DIGI-UW/openelis-work/pull/242 | 2026-07-27 | **MERGED** (PR #242, verified on origin/main 2026-07-28 — merge commit 6ba48b0; portal branch deleted; all 5 designs/portal/* files on main, fully registered. Re-confirmed on main 2026-07-29.) | Genuinely-new gallery family: **Results Portal** (new `portal` category, "Results Portal"). Three draft entries — **Facility Results Portal (C3)** (`designs/portal/facility-results-portal.{md,-preview.html}` + public mirror, HTML entry, slug `#/portal/facility-results-portal`), **Patient Self-Registration (Track R)** (`designs/portal/patient-self-registration.{md,-preview.html}` + public mirror, slug `#/portal/patient-self-registration`), and **Results Portal — C0 Discovery Brief** (spec-only, `designs/portal/results-portal-c0-discovery-brief.md`, slug `#/portal/results-portal-c0-discovery-brief`). App.jsx MOCKUP_REGISTRY + categories/categoryLabels, MANIFEST, INDEX. Tests 259/259, build clean; dist NOT committed. No `githubIssue` wired (api.github.com blocked + connector read-only) — flag for Casey. No dedicated OGC ticket on the entries (FRSs loosely reference the OGC-949 family) → no Jira permalink to post. This branch also carries the ledger row + 2026-07-27 reconciliation entry. Connector `create_pull_request` returned 403 (app lacks `pull_requests:write`); CI auto-opener + required `test` check land it on green. Verify MERGED next run. |
| chore/ledger-reconcile-2026-07-28 | https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-07-28?expand=1 | 2026-07-28 | **MERGED** (verified on origin/main 2026-07-29 — the 2026-07-28 reconciliation entry is present on origin's ledger; remote branch deleted; main HEAD advanced to `4c0e1a2`. Doc-only → nothing to drain.) | Doc-only ledger sync recording the #242 MERGED flip + the 5 Results Portal drains + the 2026-07-28 reconciliation entry. Auto-opener + required `test` check landed it on green. |
| chore/ledger-reconcile-2026-07-29 | https://github.com/DIGI-UW/openelis-work/pull/246 | 2026-07-29 | **MERGED** (PR #246, verified on origin/main 2026-07-29 — HEAD is the #246 merge commit `bb7e500` "chore(ledger): reconcile 2026-07-29 …"; remote branch deleted; the run-1 2026-07-29 reconciliation entry is present on origin's ledger. Doc-only → nothing to drain.) | Doc-only ledger sync recording the #242 portal + 07-28 ledger-sync MERGED flips; no new design artifacts. Auto-opener + required `test` check landed it on green. |
| chore/ledger-reconcile-2026-07-30 | https://github.com/DIGI-UW/openelis-work/pull/248 | 2026-07-30 | **MERGED** (PR #248, verified on origin/main 2026-07-31 — origin HEAD is the #248 merge commit `0de7d96` "chore(ledger): reconcile 2026-07-30 …"; remote branch deleted; `git ls-remote` shows origin = `main` only. Doc-only → nothing to drain.) | Doc-only ledger sync recording the 07-30 reconciliation (no new gallery artifacts; decision-log D-035…D-042 conflict flagged, not appended). |
| chore/ledger-reconcile-2026-07-31 | https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-07-31?expand=1 | 2026-07-31 | **MERGED** (verified on origin/main 2026-08-03 — the 2026-07-31 reconciliation entry is present on origin's ledger; `git ls-remote` shows origin = `main` only; branch deleted. main has since advanced to the #250 constitution resync. Doc-only → nothing to drain.) | Doc-only ledger sync: flipped the 07-30 sync (#248) to MERGED and recorded the 2026-07-31 reconciliation. |
| chore/ledger-reconcile-2026-08-03 | https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-08-03?expand=1 | 2026-08-03 | **MERGED** (PR #251, verified on origin/main 2026-08-04 — origin HEAD is the #251 merge commit `9d76aa9` "chore(ledger): reconcile 2026-08-03 …"; `git ls-remote` shows origin = `main` only; branch deleted. Doc-only → nothing to drain.) | Doc-only ledger sync: flipped the 07-31 sync to MERGED, recorded the 2026-08-03 reconciliation, and noted the decision-log-additions.md block fully landed (08-01 consolidation) + drained. No new gallery artifacts; no Jira permalinks. |
| chore/ledger-reconcile-2026-08-04 | https://github.com/DIGI-UW/openelis-work/pull/252 | 2026-08-04 | **MERGED** (PR #252, verified on origin/main 2026-08-05 — commit `e2c5067` "chore(ledger): reconcile 2026-08-04 — flip 08-03 sync (#251) to MERGED …" is on main; `git ls-remote` shows origin = `main` only; branch deleted. Doc-only → nothing to drain.) | Doc-only ledger sync: flips the 08-03 sync (#251) to MERGED and records the 2026-08-04 reconciliation. No new gallery artifacts; no Jira permalinks. |
| design/programs-additional-info-fr28-29-pmtct-appendix | https://github.com/DIGI-UW/openelis-work/pull/253 | 2026-08-05 | **MERGED** (PR #253, verified on origin/main 2026-08-05 — squash commit `a1f720d`; all 4 new `patient-additional-info-surveillance-pmtct.*` files + public mirror present on main; `programs-management.md` on main now contains FR-28/FR-29. Nothing to drain — sources live in `OpenELIS Feature Design/`, not `upload/`.) | Closes two OGC-781 gallery gaps found in the 2026-08-05 audit. (1) `designs/admin-config/programs-management.md` was missing the FR-28/FR-29 hunk (31 lines) — FR-28 one builder w/ per-context SideNav submenu (Programs / per-domain Order form fields / Patient form fields), FR-29 shipped-field rules (badge + Visible toggle, hide-not-delete, not deletable, excluded from JSON view, Site-Information fields locked, hidden rows collapse). The `additional-info-builder` entry already pointed its specPath here, so the mockup was live without its spec text. (2) Registered the PMTCT field-catalog appendix `patient-additional-info-surveillance-pmtct` (.md 33.8KB + .jsx 20KB + .html 24.6KB + public mirror) — Section G/A/B field catalog, per-field patient-vs-order levels, 6 Dictionary categories, FHIR mapping; description marks its standalone admin surface as SUPERSEDED by OGC-781's builder. Also added the missing `gallery:` link on the additional-info-builder MANIFEST entry. Verified the v2 programs mockup/preview + additional-info-builder mockup/preview already on main are byte-identical to the working-folder sources (no mockup change needed). Tests 260/260. Base e2c5067, tip d8859c1. Sandbox git proxy refused the repo (not in session's authorized set) and device_bash has no network, so the push ran on Casey's Mac via the Control-your-Mac connector using the PAT; the CI auto-opener created PR #253 (connector `create_pull_request` 403 — app still lacks `pull_requests:write`). `test` + `enable` checks green, `build` in progress at hand-off. Verify MERGED next run, then drain nothing (sources live in `OpenELIS Feature Design/`, not `upload/`) and post the gallery permalinks to OGC-781. |
| design/m-03-admission-date | https://github.com/DIGI-UW/openelis-work/pull/254 | 2026-08-05 | **MERGED** (PR #254, verified on origin/main 2026-08-05 — commit `d92c9f8` "feat(microbiology): M-03 v2.1 …" is origin HEAD; remote branch deleted; `git ls-remote` shows origin = `main` only. M-03 v2.1 FRS + mockup present on main; the two upload sources drained to `processed/` this run.) | Update-in-place, slug unchanged (`#/microbiology/m-03-order-entry-micro-hook`). **M-03 Order Entry Micro Hook FRS v2.0 → v2.1** (OGC-789) adds a seventh conditional Step 1 field, **Date of Admission**, beside Patient Origin. Rationale: it is the missing input for the WHO GLASS `ORIGIN` (hospital- vs community-acquired) derivation — the >2-calendar-day rule needs admission date + collection date + admitted/not, and OpenELIS has only the latter two (verified 2026-08-05: repo-wide search for "admission" on `develop` returns zero hits, so every OpenELIS surveillance record is currently `ORIGIN=UNK`). Patient Origin (`INP/OUT/ICU/EME/LTC`) does **not** cover it — that is *where* the patient is, not *when they arrived*; the two are routinely conflated, so §2.3a states the distinction explicitly. Spec changes: §1.1 purpose, §2.2 ASCII sketch, §2.3 field table row, **new §2.3a** (purpose / conditional behaviour / degradation table), §2.5 validation (not-future, not-after-collection, Date-locale round-trip), 5 new ACs (AC-M03-19…23), 6 i18n keys, §10 new-data-element declaration (design-addendum MUST A / D-009) + open storage question, §11 M-09 + WHO GLASS 2023 refs. **Derivation stays with M-09** — M-03 must not compute or persist `INFECTION_ORIGIN`; the on-form origin line is a recomputed-on-render hint only. Mockup `m-03-order-entry-step1.html` v1.0 → v1.1: Date of Admission field + origin hint + disabled Step-2 Collection Date for context; example patient switched Emergency → Inpatient so the scenario is coherent (ward "ER · Adult" → "Medical Ward A"); stale banner ref `m-03-order-entry-micro-hook-frs-v1.md` corrected to the live filename. Rendering verified in Chrome (3 rows, no overflow, 41/41 divs). App.jsx + MANIFEST descriptions bumped six→seven fields, `updated: 2026-08-05`, tags +glass +surveillance. Tests 260/260 pass, npm install clean. dist NOT committed (deploy rebuilds). **No Jira comment posted — Casey explicitly scoped this run to the FRS + repo only.** This branch also carries the ledger row + the 2026-08-05 reconciliation entry. |
| chore/ledger-reconcile-2026-08-05 | https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-08-05?expand=1 | 2026-08-05 | **MERGED** (verified on origin/main 2026-08-07 — the 2026-08-05 reconciliation entry is present on origin's ledger; `git ls-remote` shows origin heads = `main` + the open `design/m-03-v22-derived-protocol` only; the ledger-reconcile branch is deleted. Doc-only → nothing to drain.) | Doc-only ledger sync: flipped the #254 m-03 v2.1 row to MERGED, back-filled the #253 Programs/PMTCT MERGED row, and recorded the 2026-08-05 reconciliation. |
| design/m-03-v22-derived-protocol | https://github.com/DIGI-UW/openelis-work/pull/256 | 2026-08-06 | **MERGED** (PR #256, verified on origin/main 2026-08-10 — origin HEAD is the #256 merge commit `955c3d5`; `git ls-remote` shows origin = `main` only; branch deleted. The branch bundled more than M-03 v2.2: it also introduced three new GLASS gallery entries + the M-04 §4.9a hunk — all on main + registered. The six canonical `upload/` sources drained to `processed/` this run.) | Update-in-place, slug unchanged (`#/microbiology/m-03-order-entry-micro-hook`). **M-03 Order Entry Micro Hook FRS v2.1 → v2.2** (OGC-789): Culture Protocol becomes derived/read-only (override moves to the bench, M-04) and Critical Value Notify is removed (it duplicated the Test Catalog notify flag / Alerts section + TestNotificationConfig) — five editable micro fields plus a read-only derived Culture Protocol; Date of Admission retained. Changed files: `designs/microbiology/m-03-order-entry-micro-hook.md` (v2.2, +65/-21), `designs/microbiology/m-03-order-entry-step1.html`, MANIFEST.yaml, App.jsx, public mirror. The two canonical `upload/` sources (`m-03-order-entry-micro-hook.md` md5 b8ef1667…, `m-03-order-entry-step1.html` md5 6e332c1…) are **byte-identical to the PR #256 branch tip** and differ from origin/main (v2.1) → drained to `processed/` this run (overwrote the v2.1 copies). **Scope beyond M-03:** `git show --stat 955c3d5` confirms #256 also added new files `designs/microbiology/glass-submission-console.html` (+237), `glass-on-aspect-parity.md` (+165), `glass-amr-dashboard-indicators.md` (+140) (+ public mirror) registering three new draft entries — **GLASS Submission Console** (OGC-918, OGC-794; `#/microbiology/glass-submission-console`), **GLASS on Aspect Parity — scoping** (OGC-918; `#/microbiology/glass-on-aspect-parity-scoping`), **AMR Dashboard Indicators** (OGC-918; `#/microbiology/amr-dashboard-indicators`) — plus the **M-04 §4.9a** Set-or-change bench protocol picker (`m-04-case-workbench-core.md` +51, AC-M04-20…25). MANIFEST + App.jsx updated. All six canonical `upload/` sources (m-03 ×2, glass ×3, m-04 ×1) md5-match origin/main → drained to `processed/` this run. |
| chore/ledger-reconcile-2026-08-07 | https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-08-07?expand=1 | 2026-08-07 | **MERGED** (verified on origin/main 2026-08-10 — the 2026-08-07 reconciliation entry is present on origin's ledger; `git ls-remote` shows origin = `main` only; branch deleted. Doc-only → nothing to drain.) | Doc-only ledger sync: flipped the 08-05 sync to MERGED and recorded the 2026-08-07 reconciliation (added PR #256 as an OPEN row that run). Its prose reached origin but it never got its own table row — added here. |
| design/multi-sample-order-entry | https://github.com/DIGI-UW/openelis-work/compare/main...design/multi-sample-order-entry?expand=1 | 2026-08-11 | **OPEN** (pushed this run; connector `create_pull_request` 403 → CI auto-opener + required `test` check expected to open + merge on green) | Genuinely-new **sample-collection** entry: **Multiple Samples per Test at Order Entry** (FRS v1.0 + HTML preview), OGC-285. Add a 2nd/3rd specimen of the same sample type at Add Order without re-entering shared fields, per-specimen distinguishing labels carried through worklist/labels/result entry/patient report (TB smear, stool O&P, timed urine, GTT, blood cultures). HTML-type (`component:null` + `htmlUrl` + `specPath`), slug `#/sample-collection/multiple-samples-per-test-at-order-entry`. Files: `designs/sample-collection/multi-sample-order-entry.{md,-preview.html}` + public mirror; App.jsx + MANIFEST + INDEX. Tests 260/260, dist not committed. No `githubIssue` wired (api.github.com blocked) — flag for Casey. Jira permalink to OGC-285 DEFERRED until merged+deployed. Verify MERGED next run. |
| design/analyzer-results-lab-unit-access | https://github.com/DIGI-UW/openelis-work/compare/main...design/analyzer-results-lab-unit-access?expand=1 | 2026-08-11 | **OPEN** (pushed this run; connector `create_pull_request` 403 → CI auto-opener + required `test` check expected to open + merge on green) | Genuinely-new **analyzer-integration** entry: **Analyzer Results — Lab Unit Access Control** (FRS + interactive HTML preview; JSX drop-in components shipped as a reference asset), OGC-1057 (+OGC-288/337/1137/1151). Gates Analyzer Results Import by per-lab-unit Results rights, filtered analyzer menu, access-denied page naming the bench, per-row filtering + hidden-count, closes the unauthenticated `/rest/AnalyzerResults` gap (ISO 15189), first consumer of `analyzer.test_unit_ids` (dormant since OGC-337), one-time upgrade backfill. Registered **HTML-type** (`component:null` + preview) rather than `React.lazy` because the JSX default export requires props (`analyzers.find(...)`) and would crash rendered propless; the self-contained preview is the live surface. slug `#/analyzer-integration/analyzer-results-lab-unit-access-control`. Files: `designs/analyzer-integration/analyzer-results-lab-unit-access.{md,jsx,-preview.html}` + public mirror; App.jsx + MANIFEST + INDEX. Tests 260/260, dist not committed. No `githubIssue` wired — flag for Casey. Jira permalink DEFERRED until merged+deployed. Verify MERGED next run. |

## Reconciliation — 2026-08-10 (scheduled run)

- **Step 0 — the one prior OPEN design PR and the prior OPEN ledger-sync are both now MERGED; nothing OPEN, nothing stranded.** `git ls-remote` shows origin has **only `refs/heads/main`** (HEAD `955c3d5`, the **PR #256** merge "M-03 v2.2 — Culture Protocol derived/read-only, Critical Value Notify removed (OGC-789)"). PR #256 (`design/m-03-v22-derived-protocol`, recorded **OPEN** last run) is confirmed **MERGED** — commit `955c3d5` is origin HEAD and the branch is deleted — and flipped this run. The 08-07 doc-only branch `chore/ledger-reconcile-2026-08-07` (its reconciliation prose reached origin but never got its own table row) is confirmed **MERGED** and given a MERGED row this run. No branch is past the 7-day stranded threshold.
- **PR #256 carried more than the M-03 v2.2 update.** `git show --stat 955c3d5` confirms the branch also added three **new** microbiology gallery entries (`glass-submission-console.html`, `glass-on-aspect-parity.md`, `glass-amr-dashboard-indicators.md`, + public mirror) and the **M-04 §4.9a** hunk (`m-04-case-workbench-core.md`). All are on origin/main and fully registered in App.jsx MOCKUP_REGISTRY + MANIFEST (verified). The mount ledger's local "Addendum — 2026-08-05/08" documented only the m-03/m-04 half; the GLASS entries are recorded here for completeness.
- **Canonical `upload/` ↔ gallery reconcile (content md5 vs the full 629-file `designs/` + `public/designs/` tree on origin/main). Genuinely-new artifacts requiring a push this run: NONE.** Six `upload/` files are now **byte-identical** to their origin/main gallery blobs — all landed via #256 — and were **drained to `processed/`** this run (mount-local staging cleanup; none were tracked in origin's `upload/`): `m-03-order-entry-micro-hook.md`, `m-03-order-entry-step1.html`, `glass-submission-console.html`, `glass-on-aspect-parity.md`, `glass-amr-dashboard-indicators.md`, `m-04-case-workbench-core.md`. Every other non-`processed/` upload file is a pre-classified non-design working doc / staging note / comment draft or a gallery-newer stale copy — all **LEFT in place** (unchanged from the 08-07 classification): `Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx`, `NOTE-test-catalog-mn.md`, `README.md`, `analyzer-import-bench-experience-STAGING.md`, `multicomponent-analyzer-ui-STAGING.md`, `clinical-order-entry-GATES.md`, `openelis-design-SKILL-updated.md`, `order-entry-mockup-vs-delivered-UX-drift.md`, `order-entry-three-domain-crosswalk.md`, `s06-lhu-domain-variants-jira-comment-draft.md`, `test-catalog-mn-crosscheck.md`, `test-catalog-specimen-model-reassessment.md`, `v04-v1.5-ida-brief.md`, `v04-v1.5-jira-comment-draft.md`. **Gallery-newer (do-not-push, LEFT):** `order-entry-FRS-v3-three-workflows.md` and `V04-vector-surveillance-reporting-preview.html`.
- **`upload/inventory-techdebt/` (unchanged, LEFT + flagged):** `inventory-catalog-cleanup-jira-story.md` (OGC-658) and `inventory-storage-integration-jira-story.md` (OGC-657) — developer implementation stories, not gallery artifacts → not registered. Still flagged for Casey to confirm on OGC then drain.
- **Decision-log (Step 6): nothing to append; one standing CONFLICT re-flagged.** No `decision-log-additions.md`, REGISTER file, or ready-to-append D-0xx block in `upload/`. The `test-catalog-*` briefs (`NOTE-test-catalog-mn.md`, `test-catalog-mn-crosscheck.md`, `test-catalog-specimen-model-reassessment.md`) still **recommend** minting a `D-035` for the m:n specimen model (supersede D-028) — but canonical `skills/openelis-design/references/decision-log.md` already assigns **D-035** to "Inventory storage reuses the shared sample Storage model (OGC-657)" (log now extends to D-048). Appending would collide → **NOT appended**; the specimen-model decision needs a fresh D-number and Casey's call. Consistent with every prior run; no D-0xx minted autonomously.
- **Jira (Step 11): none posted; 3 new GLASS slugs flagged.** PR #256's three new entries carry OGC-918 (+ OGC-794 on the Submission Console) and would normally get gallery permalinks — but they landed via the interactive #256 session (which owns its own permalink posting) and the Atlassian connector is **unauthenticated** in this non-interactive session, so nothing was posted or verified. Flagged for Casey / a future authenticated run: post `#/microbiology/glass-submission-console`, `#/microbiology/glass-on-aspect-parity-scoping`, `#/microbiology/amr-dashboard-indicators` to OGC-918 (and the Submission Console to OGC-794) if not already done. The m-03 v2.2 slug is unchanged (`#/microbiology/m-03-order-entry-micro-hook`) → no permalink goes stale.
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-08-10`) recording the #256 + 08-07 MERGED flips, the six-file drain, the GLASS registration, and this entry (it also carries the mount-local "Addendum — 2026-08-05/08" block up to origin). Only `upload/PENDING-PRS.md` changes → local vitest not run (out of scope; the required `test` CI check gates the auto-merge regardless). Connector `create_pull_request` attempted first; on 403 the branch is pushed with the PAT and the CI auto-opener + required `test` check land it on green. Compare URL: https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-08-10?expand=1 — **Status: OPEN**, verify MERGED next run.

## Reconciliation — 2026-08-07 (scheduled run)

- **Step 0 — prior OPEN ledger-sync now MERGED; one incoming design PR OPEN (fresh, not stranded).** `git ls-remote` shows origin heads = `refs/heads/main` (HEAD `88203fa`) + `refs/heads/design/m-03-v22-derived-protocol` (the open PR #256). The 08-05 doc-only branch `chore/ledger-reconcile-2026-08-05` (recorded **OPEN** last run) is confirmed **MERGED** — its 2026-08-05 reconciliation entry is on origin's ledger and the branch is deleted — and given a MERGED table row this run. **PR #256** (`design/m-03-v22-derived-protocol`, M-03 v2.2, created 2026-08-06) is genuinely OPEN with the required `test` check green; it is 1 day old, well inside the 7-day stranded threshold, and was opened by an interactive session so it was not yet on this ledger — added as an **OPEN** row this run.
- **Canonical `upload/` ↔ gallery reconcile (content md5 vs full `designs/` tree). Genuinely-new gallery artifacts requiring a push this run: NONE.** The only upload-newer design files are the two M-03 **v2.2** sources `m-03-order-entry-micro-hook.md` (md5 `b8ef1667…`) and `m-03-order-entry-step1.html` (md5 `6e332c1…`); both are **byte-identical to the PR #256 branch tip** and **differ from `origin/main`** (which carries v2.1, md5 `7567db58…` / `beab0df…`, matching the v2.1 copies already in `upload/processed/`). They are the source for the already-open PR #256 → **LEFT in `upload/` pending merge** (do not re-push; drain to `processed/` after #256 lands). Every other non-`processed/` upload file is a pre-classified non-design working doc / staging note / comment draft / Jira story draft or a gallery-newer stale copy — all **LEFT in place** (unchanged from the 08-05 classification).
- **`upload/inventory-techdebt/` (unchanged, LEFT + flagged):** `inventory-catalog-cleanup-jira-story.md` (OGC-658) and `inventory-storage-integration-jira-story.md` (OGC-657) — developer implementation stories, not gallery mockups/FRS → not registered. Still flagged for Casey to confirm on OGC then drain.
- **Decision-log (Step 6): nothing to append.** No `decision-log-additions.md`, REGISTER file, or staged decision block found in `upload/` (the last block landed 08-01 and was drained). No conflicts.
- **Jira (Step 11): none posted.** PR #256 is an update-in-place with the slug unchanged (`#/microbiology/m-03-order-entry-micro-hook`) and is not yet merged/deployed, so no permalink goes stale or needs (re)posting. The Atlassian connector is also unauthenticated in this non-interactive session.
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-08-07`) recording the 08-05 sync MERGED flip + the new PR #256 OPEN row + this entry. Only `upload/PENDING-PRS.md` changes → local vitest not run (out of scope; the required `test` CI check gates the auto-merge regardless). Connector `create_pull_request` attempted first; on 403 the branch is pushed with the PAT and the CI auto-opener + required `test` check land it on green. Compare URL: https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-08-07?expand=1 — **Status: OPEN**, verify MERGED next run.

## Reconciliation — 2026-08-05 (scheduled run)

- **Step 0 — one incoming OPEN row, now MERGED. No stranded PRs.** Fresh `git ls-remote` shows origin has **only `refs/heads/main`** (HEAD `d92c9f8`, **PR #254** "feat(microbiology): M-03 v2.1 — add Date of Admission to Order Entry Step 1"). The `design/m-03-admission-date` row (recorded **OPEN** by the 08-05 interactive run) is confirmed **MERGED** — commit `d92c9f8` is origin HEAD and the branch is deleted — and flipped this run. Nothing OPEN, nothing past the 7-day stranded threshold.
- **Ledger back-fill.** Origin's committed ledger was missing a table row for **PR #253** (Programs FR-28/FR-29 + PMTCT appendix, commit `a1f720d`) — it landed via the interactive Mac-push path, whose reconciliation prose reached origin but whose table row only ever existed as a hand-edit in the mount working copy. Lifted that MERGED row verbatim into origin's ledger this run so the table matches reality.
- **Drain-on-merge (m-03 v2.1).** The two M-03 sources in the mount's canonical `upload/` — `m-03-order-entry-micro-hook.md` and `m-03-order-entry-step1.html` — are byte-identical (md5) to their `origin/main` gallery blobs (`designs/microbiology/m-03-order-entry-micro-hook.md`, `designs/microbiology/m-03-order-entry-step1.html`; diff vs `origin/main` empty). They were registered straight into `designs/` by #254 (never committed to origin's `upload/`), so the drain to `upload/processed/` is mount-local staging cleanup. (The mount working tree still shows the v2.0 copies because it has not pulled #254 — the comparison was against `origin/main`, not the stale local tree.)
- **Canonical `upload/` ↔ gallery reconcile (content md5 vs full `designs/` + `public/designs/` tree, 624 files). Genuinely-new design artifacts: NONE.** After the m-03 drain, every remaining top-level `upload/` file is a pre-classified non-design working doc / staging note / comment draft or a gallery-newer stale copy — all LEFT in place (unchanged from prior reconciliations): `Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx`, `NOTE-test-catalog-mn.md`, `README.md`, `analyzer-import-bench-experience-STAGING.md`, `multicomponent-analyzer-ui-STAGING.md`, `clinical-order-entry-GATES.md`, `openelis-design-SKILL-updated.md`, `order-entry-mockup-vs-delivered-UX-drift.md`, `order-entry-three-domain-crosswalk.md`, `s06-lhu-domain-variants-jira-comment-draft.md`, `test-catalog-mn-crosscheck.md`, `test-catalog-specimen-model-reassessment.md`, `v04-v1.5-ida-brief.md`, `v04-v1.5-jira-comment-draft.md`. **Gallery-newer (do-not-push, LEFT):** `order-entry-FRS-v3-three-workflows.md` and `V04-vector-surveillance-reporting-preview.html`.
- **`upload/inventory-techdebt/` — LEFT + flagged (unchanged).** Two Jira dev-story drafts — `inventory-catalog-cleanup-jira-story.md` (**OGC-658**) and `inventory-storage-integration-jira-story.md` (**OGC-657**). Implementation stories, not gallery mockups/FRS → not registered; flagged for Casey to confirm they exist on OGC, then drain to `processed/`.
- **Decision-log (Step 6): nothing to append.** No staged decision block in `upload/`; `decision-log-additions.md` already sits in `upload/processed/` (drained earlier). The 08-05 interactive run noted a candidate precedent (surveillance-input capture belongs to the module owning the surrounding conditional fields; the derivation belongs to the export) pending Casey — no D-0xx row minted autonomously.
- **Jira (Step 11): none posted.** #254 was an update-in-place with the slug unchanged (`#/microbiology/m-03-order-entry-micro-hook`), so no permalink goes stale; #253 (OGC-781) permalinks were flagged for Casey on the interactive run. No new/changed gallery slugs this run. The Atlassian connector was also unauthenticated in this non-interactive session.
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-08-05`) that (a) flips the #254 m-03 row to MERGED, (b) back-fills the #253 Programs/PMTCT MERGED table row, and (c) records this entry. Only `upload/PENDING-PRS.md` changes → local vitest not run (out of scope; the required `test` CI check gates the auto-merge regardless). Connector `create_pull_request` attempted first; on 403 the branch is pushed with the PAT and the CI auto-opener + required `test` check land it on green. Compare URL: https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-08-05?expand=1 — **Status: OPEN**, verify MERGED next run.

## Reconciliation — 2026-08-05 (interactive run)

- **Step 0 — one incoming OPEN row, now MERGED. No stranded PRs.** Fresh `git ls-remote` shows origin has **only `refs/heads/main`** (HEAD `a1f720d`, PR #253 "feat(admin-config): land Programs FR-28/FR-29 + register PMTCT field-catalog appendix"). The 08-04 doc-only branch `chore/ledger-reconcile-2026-08-04` (recorded OPEN last run) is confirmed **MERGED** as **PR #252** — commit `e2c5067` is on main and the branch is deleted — and flipped this run. Nothing OPEN, nothing past the 7-day stranded threshold.
- **Genuinely-new design artifacts: NONE. One update-in-place.** `m-03-order-entry-micro-hook.md` + `m-03-order-entry-step1.html` were staged in canonical `upload/` this run and both md5-matched their `origin/main` gallery blobs *before* patching — i.e. the edits were applied to current content, not to a stale copy. Registered as an update in place (slug unchanged); see the `design/m-03-admission-date` row.
- **Local clone was 9 commits behind origin.** `/Users/casey/Documents/openelis-work` sat at `4c0e1a2` while origin had advanced to `a1f720d`. `designs/microbiology/` was untouched upstream, so the patch base was still valid — but `App.jsx` and `MANIFEST.yaml` *had* moved (#253 Programs/PMTCT), so all registry edits were made in a fresh temp clone off `origin/main` rather than in the working folder. Worth flagging: editing registry files in the working clone would have silently reverted #253.
- **Gallery-newer (do-not-push, LEFT, unchanged):** `order-entry-FRS-v3-three-workflows.md` and `V04-vector-surveillance-reporting-preview.html` — both still stale against main, unchanged since the 2026-08-04 run. Note: a draft revision of the former (adding the same admission-date field to the *base* order-entry FRS) was written this session and then **deliberately discarded** — OGC-789/M-03 is the correct owner, since it already carries the conditional Step 1 fields and Patient Origin. Nothing staged.
- **Decision-log (Step 6): nothing to append.** No staged decision block in `upload/`. A candidate precedent did surface and is recorded here rather than in the log, pending Casey: *capture of a surveillance input belongs to the module that owns the surrounding conditional fields; the derivation belongs to the export.* If that recurs it is worth a D-0xx row.
- **PR #254 opened by the CI auto-opener.** Connector `create_pull_request` returned **403 Resource not accessible by integration** — the GitHub App still lacks `pull_requests: write` on the org (Settings -> Third-party Access -> the app -> Configure). This is the same 403 recorded on 2026-07-28 and 2026-07-29, so it is a standing gap rather than a transient failure; worth fixing once so future runs stop depending on the push hook. The push-triggered auto-opener opened the PR instead, and auto-merge plus the required `test` check land it on green.
- **Jira: intentionally skipped.** Step 11 (permalink comment on OGC-789) was **not** performed — Casey scoped this run to "only the updates to the FRS and the openelis-work repo". The slug is unchanged, so no existing permalink goes stale.

## Reconciliation — 2026-08-04 (scheduled run)
- **Step 0 — no OPEN or stranded PRs.** Fresh `git ls-remote` shows origin has **only `refs/heads/main`** (HEAD `9d76aa9`, the **PR #251** merge commit "chore(ledger): reconcile 2026-08-03 …"). The prior run's doc-only branch `chore/ledger-reconcile-2026-08-03` (recorded OPEN last run) is confirmed **MERGED** as PR #251 — it *is* the current origin HEAD, its 2026-08-03 reconciliation entry is on origin's ledger, and the branch is deleted — and given a MERGED table row this run. Every ledger row is MERGED; nothing OPEN, nothing past the 7-day stranded threshold.
- **Canonical `upload/` ↔ gallery reconcile (content md5 vs full `designs/` + `public/designs/` tree, 613 files). Genuinely-new design artifacts: NONE.** No upload file's md5 matches a gallery blob, and no non-`processed/` upload file is a new FRS/mockup lacking a gallery counterpart. The upload fileset is unchanged since the last run (nothing dropped; all mtimes ≤ 2026-07-23) — every file is a pre-classified non-design working doc, a jira-story draft, or a gallery-newer stale copy — all LEFT in place.
- **Gallery-newer (do-not-push, LEFT, unchanged):** `order-entry-FRS-v3-three-workflows.md` (main's `designs/sample-collection/order-entry-frs-v3-three-workflows.md`, 18427 B, newer than the 13504 B upload copy) and `V04-vector-surveillance-reporting-preview.html` (main's `designs/vector-surveillance/vector-surveillance-reporting.html`, 83685 B, newer).
- **Decision-log (Step 6): nothing to append.** No staged decision block in `upload/` — the D-035…D-042 additions landed in the 2026-08-01 consolidation and the canonical `skills/openelis-design/references/decision-log.md` carries D-035…D-048. The two `upload/` files that reference the decision-log (`test-catalog-mn-crosscheck.md`, `NOTE-test-catalog-mn.md`) are crosscheck/changeset notes, not append blocks. No decision-log PR; no conflicts.
- **Two jira-story drafts in `upload/inventory-techdebt/` (NOT gallery artifacts → LEFT + flagged, unchanged):** `inventory-catalog-cleanup-jira-story.md` (**OGC-658**; D-038 records it closed as superseded — Casey may drain) and `inventory-storage-integration-jira-story.md` (**OGC-657**). Developer implementation stories → not registered.
- **Jira (Step 11):** no new/changed gallery slugs this run → **no gallery permalinks posted** (noise + dead-link avoidance). Atlassian connector unauthenticated in this non-interactive session.
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-08-04`) recording the #251 MERGED flip + this entry. Doc-only change (only `upload/PENDING-PRS.md`) → local vitest not run (out of test scope; sandbox worker-pool hang is a known issue); the required `test` CI check gates the auto-merge regardless. Connector `create_pull_request` attempted first; on 403 the branch is pushed with the PAT and the CI auto-opener + required `test` check land it on green. Compare URL: https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-08-04?expand=1 — **Status: OPEN**, verify MERGED next run.

## Reconciliation — 2026-08-03 (scheduled run)
- **Step 0 — no OPEN or stranded PRs.** Fresh `git ls-remote` shows origin has **only `refs/heads/main`** (HEAD `9bbea65`, the **PR #250** merge commit "openelis-design: resync constitution pointer 1.10.0 → 1.11.0"). The prior run's doc-only branch `chore/ledger-reconcile-2026-07-31` (recorded OPEN last run) is confirmed **MERGED** — its 2026-07-31 reconciliation entry is on origin's ledger and the branch is deleted — and given a MERGED table row this run. Every ledger row is MERGED; nothing OPEN, nothing past the 7-day stranded threshold.
- **Canonical `upload/` ↔ gallery reconcile (content md5 vs full `designs/` + `public/designs/` tree, 613 files). Genuinely-new design artifacts: NONE.** No upload file's md5 matches a gallery blob, and no upload file is a new FRS/mockup lacking a gallery counterpart. Every non-`processed/` upload file has mtime ≤ 2026-07-23 (nothing dropped since the last run) and is a pre-classified non-design working doc, a jira-story draft, or a gallery-newer stale copy — all LEFT in place.
- **Gallery-newer (do-not-push, LEFT, unchanged):** `order-entry-FRS-v3-three-workflows.md` (main's `designs/sample-collection/order-entry-frs-v3-three-workflows.md`, 18427 B, is newer than the 13504 B upload copy) and `V04-vector-surveillance-reporting-preview.html` (main's `designs/vector-surveillance/vector-surveillance-reporting.html`, 83685 B, is newer).
- **`decision-log-additions.md` — CONFLICT RESOLVED; block fully landed; DRAINED.** The 07-30/07-31 runs flagged D-035…D-042 as a conflict (the canonical decision-log then ended at D-027, and D-035 was earmarked for a different test-catalog specimen decision). The **2026-08-01 monthly consolidation** reconciled the canonical skill references: `skills/openelis-design/references/decision-log.md` now carries **D-035…D-042 verbatim-matching** the staged block (the canonical table extends to D-048), the `spec-registry.md` **"Inventory redesign"** row is present, and `carbon-anti-patterns.md` carries the **acknowledge-to-quiet (refines P-16)** + **managed-lookup-vs-free-tag** guidance. Nothing left to append → **no decision-log PR**. The now-fully-landed `upload/decision-log-additions.md` residue was **drained to `upload/processed/` (mount-local staging cleanup)** this run.
- **Two jira-story drafts in `upload/inventory-techdebt/` (NOT gallery artifacts → LEFT + flagged, unchanged):** `inventory-catalog-cleanup-jira-story.md` (**OGC-658**) and `inventory-storage-integration-jira-story.md` (**OGC-657**), both assignee Herman Muhereza. Developer implementation stories (no `.jsx`/`.html`, no gallery FRS) → not registered. Note: D-038 records **OGC-658 closed as superseded** by type-as-tag — Casey may drain the catalog-cleanup draft. Flagged for Casey.
- **Other pre-classified non-design working docs LEFT in `upload/`** (unchanged): `Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx`, `NOTE-test-catalog-mn.md`, `test-catalog-mn-crosscheck.md`, `test-catalog-specimen-model-reassessment.md`, `analyzer-import-bench-experience-STAGING.md`, `multicomponent-analyzer-ui-STAGING.md`, `clinical-order-entry-GATES.md`, `order-entry-mockup-vs-delivered-UX-drift.md`, `order-entry-three-domain-crosswalk.md`, `s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md`, `v04-v1.5-jira-comment-draft.md`, `openelis-design-SKILL-updated.md`.
- **Jira (Step 11):** no new/changed gallery slugs this run → **no gallery permalinks posted** (noise + dead-link avoidance). Atlassian connector unauthenticated in this non-interactive session.
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-08-03`) recording the 07-31 MERGED flip + the decision-log drain + this entry. Doc-only change (only `upload/PENDING-PRS.md`) → local vitest not run (out of test scope; sandbox worker-pool hang is a known issue); the required `test` CI check gates the auto-merge regardless. Connector `create_pull_request` attempted first; on 403 the branch is pushed with the PAT and the CI auto-opener + required `test` check land it on green. Compare URL: https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-08-03?expand=1 — **Status: OPEN**, verify MERGED next run.

## Reconciliation — 2026-07-31 (scheduled run)
- **Step 0 — no OPEN or stranded PRs.** Fresh `git ls-remote` shows origin has **only `refs/heads/main`** (HEAD `0de7d96`, the **PR #248** merge commit "chore(ledger): reconcile 2026-07-30 …"). The prior run's doc-only branch `chore/ledger-reconcile-2026-07-30` (recorded OPEN in prose last run) is confirmed **MERGED** (PR #248 = origin HEAD; remote branch deleted) and given a MERGED table row this run. Every ledger row is MERGED; nothing OPEN, nothing past the 7-day stranded threshold.
- **Canonical `upload/` ↔ gallery reconcile (content md5 vs full `designs/` + `public/designs/` tree, 621 files). Genuinely-new design artifacts: NONE.** No upload file's md5 matches a gallery blob, and no upload file is a new FRS/mockup lacking a gallery counterpart (only `.html` in `upload/` is the gallery-newer `V04-vector-surveillance-reporting-preview.html`; no `.jsx`). Every non-`processed/` upload file is a pre-classified non-design working doc, a comment/jira-story draft, or a gallery-newer stale copy — all LEFT in place.
- **Gallery-newer (do-not-push, LEFT, unchanged):** `order-entry-FRS-v3-three-workflows.md` (main's `designs/sample-collection/order-entry-frs-v3-three-workflows.md`, 18427 B, is newer than the upload copy) and `V04-vector-surveillance-reporting-preview.html` (main's `designs/vector-surveillance/vector-surveillance-reporting.html` is newer).
- **Two jira-story drafts in `upload/inventory-techdebt/` (NOT gallery artifacts → LEFT + flagged, unchanged):** `inventory-catalog-cleanup-jira-story.md` (**OGC-658**) and `inventory-storage-integration-jira-story.md` (**OGC-657**), both assignee Herman Muhereza. Developer implementation stories (no `.jsx`/`.html`, no gallery FRS) → not registered. Flagged for Casey: confirm the OGC stories exist, then drain to `processed/`.
- **`decision-log-additions.md` — CONFLICT, NOT appended (reported for Casey; unchanged from 07-30).** The canonical tracked `skills/openelis-design/references/decision-log.md` table ends at **D-027** on origin/main; the staged block claims to "continue from D-034" and defines **D-035…D-042**, so D-028…D-034 are absent from the canonical log. The full D-001…D-042 (incl. D-028…D-034, plus D-018/D-019 status → superseded) exists only in the **untracked** local working copy `OpenELIS Feature Design/openelis-design-skill-src/references/decision-log.md`, so the canonical log is a whole monthly-consolidation behind — not a clean tail-append. Also (per the 07-22 entry) **D-035 was already earmarked for a different decision** (test-catalog specimen m:n / per-specimen override), colliding with this block's inventory D-035. Per the Step-6 conflict rule ("same D-number or contradicting entry → do NOT append, report"), the block is **left in `upload/` unappended.** Casey to (a) reconcile the canonical log's D-028…D-034 gap + D-018/D-019 supersession from the skill-src copy, and (b) resolve the D-035 collision, before these land.
- **Other pre-classified non-design working docs LEFT in `upload/`** (unchanged): `Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx`, `NOTE-test-catalog-mn.md`, `test-catalog-mn-crosscheck.md`, `test-catalog-specimen-model-reassessment.md`, `analyzer-import-bench-experience-STAGING.md`, `multicomponent-analyzer-ui-STAGING.md`, `clinical-order-entry-GATES.md`, `order-entry-mockup-vs-delivered-UX-drift.md`, `order-entry-three-domain-crosswalk.md`, `s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md`, `v04-v1.5-jira-comment-draft.md`, `openelis-design-SKILL-updated.md`.
- **Jira (Step 11):** no new/changed gallery slugs this run → **no gallery permalinks posted** (noise + dead-link avoidance). Atlassian connector unauthenticated in this non-interactive session.
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-07-31`) recording the #248 MERGED flip + this entry. Doc-only change (only `upload/PENDING-PRS.md`) → local vitest not run (out of test scope); the required `test` CI check gates the auto-merge regardless. Connector `create_pull_request` attempted first; on 403 the branch is pushed with the PAT and the CI auto-opener + required `test` check land it on green. Compare URL: https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-07-31?expand=1 — **Status: OPEN**, verify MERGED next run.

## Reconciliation — 2026-07-30 (scheduled run)
- **Step 0 — no OPEN or stranded PRs.** Fresh `git ls-remote` shows origin has **only `refs/heads/main`** (HEAD `b701ff3`). The prior run's doc-only branch `chore/ledger-reconcile-2026-07-29` is confirmed **MERGED** (PR #246; main has since advanced past it via routine `docs-manual` auto-commits). Every ledger row is MERGED; nothing OPEN, nothing past the 7-day stranded threshold.
- **Canonical `upload/` ↔ gallery reconcile (content md5 vs full `designs/` + `public/designs/` tree, 624 files). Genuinely-new design artifacts: NONE.** No upload file's md5 matches a gallery blob AND no upload file is a new FRS/mockup lacking a gallery counterpart. Every non-`processed/` upload file is a pre-classified non-design working doc, a comment/jira-story draft, or a gallery-newer stale copy — all LEFT in place.
- **Gallery-newer (do-not-push, LEFT):** `order-entry-FRS-v3-three-workflows.md` (main's `designs/sample-collection/order-entry-frs-v3-three-workflows.md`, 18427 B, is newer/more elaborated than the 13504 B upload copy).
- **Two jira-story drafts in `upload/inventory-techdebt/` (NOT gallery artifacts → LEFT + flagged, unchanged from 07-29):** `inventory-catalog-cleanup-jira-story.md` (**OGC-658**) and `inventory-storage-integration-jira-story.md` (**OGC-657**), both assignee Herman Muhereza. Developer implementation stories (no `.jsx`/`.html`, no gallery FRS) → not registered. Flagged for Casey: confirm the OGC stories exist, then drain to `processed/`.
- **`decision-log-additions.md` — CONFLICT, NOT appended (reported for Casey).** Step 6 now authorizes appending staged decision blocks to the canonical `skills/openelis-design/references/decision-log.md`. But that file's table ends at **D-027**; the additions block claims to "continue from D-034" and defines **D-035…D-042**, so D-028…D-034 are absent from the canonical log. Worse, the 2026-07-22 reconciliation already earmarked **D-035 for a different decision** (test-catalog specimen m:n / per-specimen override), whereas this block defines D-035 as "Inventory storage reuses the shared sample Storage model." Appending would create a broken/duplicated sequence and a contradictory D-035. Per the step-6 conflict rule ("same D-number or contradicting entry → do NOT append, report the conflict"), the block was **left in `upload/` unappended** — Casey to reconcile the canonical decision-log's D-028…D-034 gap and resolve the D-035 collision before these land.
- **Other pre-classified non-design working docs LEFT in `upload/`** (unchanged): `Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx`, `NOTE-test-catalog-mn.md`, `test-catalog-mn-crosscheck.md`, `test-catalog-specimen-model-reassessment.md`, `analyzer-import-bench-experience-STAGING.md`, `multicomponent-analyzer-ui-STAGING.md`, `clinical-order-entry-GATES.md`, `order-entry-mockup-vs-delivered-UX-drift.md`, `order-entry-three-domain-crosswalk.md`, `s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md`, `v04-v1.5-jira-comment-draft.md`, `openelis-design-SKILL-updated.md`, `V04-vector-surveillance-reporting-preview.html`.
- **Jira (Step 11):** no new/changed gallery slugs this run → **no gallery permalinks posted** (noise + dead-link avoidance). Atlassian connector unauthenticated in this non-interactive session.
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-07-30`) recording this entry. Doc-only change (only `upload/PENDING-PRS.md`) → local vitest not run (out of test scope); the required `test` CI check gates the auto-merge regardless. Connector `create_pull_request` attempted first; on 403 the branch is pushed with the PAT and the CI auto-opener + required `test` check land it on green. Compare URL: https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-07-30?expand=1 — **Status: OPEN**, verify MERGED next run.


## Reconciliation — 2026-07-29 (scheduled run)
- **Step 0 — no OPEN or stranded PRs.** Fresh `git ls-remote` shows origin has **only `refs/heads/main`** (HEAD `4c0e1a2`). The prior run's doc-only branch `chore/ledger-reconcile-2026-07-28` (was **OPEN**) is **MERGED** — its 2026-07-28 reconciliation entry is on origin's ledger and the branch is deleted. The 2026-07-27 `design/results-portal-c3-track-r` row (table cell still read OPEN) is confirmed **MERGED** (PR #242, merge commit 6ba48b0) and flipped this run. Nothing OPEN, nothing past the 7-day stranded threshold.
- **Canonical `upload/` ↔ gallery reconcile (content md5 vs full `designs/` + `public/designs/` tree, 614 files). Genuinely-new design artifacts: NONE.** Every non-`processed/` upload file is either md5-identical to / already landed in the gallery, a pre-classified non-design staging note, or a gallery-newer stale copy — all LEFT in place.
- **NEW this run — two Jira story drafts in `upload/inventory-techdebt/` (not gallery design artifacts → LEFT + flagged):** `inventory-catalog-cleanup-jira-story.md` (**OGC-658** — Item Type CRUD + code-based item primary key; assignee Herman Muhereza) and `inventory-storage-integration-jira-story.md` (**OGC-657** — wire inventory lots into Storage Management, lift the Order Entry storage modal; assignee Herman Muhereza). These are developer implementation stories, not gallery mockups/FRS (no `.jsx`/`.html`, no gallery-entry FRS), so — per the jira-comment-draft / ida-brief precedent — they are NOT registered into the gallery. Flagged for Casey: confirm the two stories exist on OGC, then drain these drafts to `processed/`.
- **Gallery-newer (do-not-push, LEFT):** `order-entry-FRS-v3-three-workflows.md` (main's `designs/sample-collection/order-entry-frs-v3-three-workflows.md` is newer) and `V04-vector-surveillance-reporting-preview.html` (main's `vector-surveillance-reporting.html` newer, via #232).
- **`decision-log-additions.md` — STILL LEFT for Casey (skill-governance, not gallery mechanics).** Unchanged residual: append D-035…D-042 to the openelis-design skill `references/decision-log.md` + a spec-registry row + a carbon-anti-patterns note (skill files are read-only in Cowork).
- **Other pre-classified non-design working docs LEFT in `upload/`** (unchanged): `Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx`, `NOTE-test-catalog-mn.md`, `test-catalog-mn-crosscheck.md`, `test-catalog-specimen-model-reassessment.md`, `analyzer-import-bench-experience-STAGING.md`, `multicomponent-analyzer-ui-STAGING.md`, `clinical-order-entry-GATES.md`, `order-entry-mockup-vs-delivered-UX-drift.md`, `order-entry-three-domain-crosswalk.md`, `s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md`, `v04-v1.5-jira-comment-draft.md`, `openelis-design-SKILL-updated.md`.
- **Jira (Step 11):** no new/changed gallery slugs this run → **no gallery permalinks posted** (noise + dead-link avoidance).
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-07-29`) recording the two MERGED flips + this entry. Doc-only change (only `upload/PENDING-PRS.md`) → local vitest not run (out of test scope; sandbox worker-pool hang is a known issue); the required `test` CI check gates the auto-merge regardless. Connector `create_pull_request` attempted first; on 403 (app lacks `pull_requests:write`) the branch is pushed with the PAT and the CI auto-opener + required `test` check land it on green. Compare URL: https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-07-29?expand=1 — **Status: OPEN**, verify MERGED next run.

## Reconciliation — 2026-07-28 (scheduled run)
- **Step 0 — one incoming OPEN row, now MERGED. No stranded PRs.** Fresh `git ls-remote` shows origin has **only `refs/heads/main`** (HEAD `6ba48b0`, the **PR #242** merge commit "Add Results Portal gallery entries…"). The 07-27 row `design/results-portal-c3-track-r` (was **OPEN**) is **MERGED** — all 5 `designs/portal/*` files are on `origin/main` and fully registered (App.jsx MOCKUP_REGISTRY 5 entries, MANIFEST, INDEX). Nothing OPEN, nothing past the 7-day stranded threshold.
- **Drain-on-merge:** the 5 Results Portal source files in the mount's canonical `upload/` are byte-identical (md5) to the registered gallery files → **drained to `upload/processed/`** this run:
  | Upload file | Landed as |
  |---|---|
  | facility-results-portal-frs.md | designs/portal/facility-results-portal.md |
  | facility-results-portal-preview.html | designs/portal/facility-results-portal-preview.html (+public mirror) |
  | patient-self-registration-frs.md | designs/portal/patient-self-registration.md |
  | patient-self-registration-preview.html | designs/portal/patient-self-registration-preview.html (+public mirror) |
  | results-portal-c0-discovery-brief.md | designs/portal/results-portal-c0-discovery-brief.md |
  These were never committed to origin's `upload/` (the 07-27 run registered them straight into `designs/`), so the drain is mount-local staging cleanup.
- **Canonical `upload/` ↔ gallery reconcile (content md5 vs full `designs/` + `public/designs/` tree, 611 files). Genuinely-new design artifacts: NONE.** After the portal drain, everything left in the mount `upload/` is pre-classified non-design working docs / staging notes / comment drafts, or gallery-newer stale copies — all LEFT in place (unchanged from the 07-27 reconciliation): `Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx`, `NOTE-test-catalog-mn.md`, `test-catalog-mn-crosscheck.md`, `test-catalog-specimen-model-reassessment.md`, `analyzer-import-bench-experience-STAGING.md`, `multicomponent-analyzer-ui-STAGING.md`, `clinical-order-entry-GATES.md`, `order-entry-mockup-vs-delivered-UX-drift.md`, `order-entry-three-domain-crosswalk.md`, `s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md`, `v04-v1.5-jira-comment-draft.md`, `openelis-design-SKILL-updated.md`. **Gallery-newer (do-not-push, LEFT):** `order-entry-FRS-v3-three-workflows.md` (main's `designs/sample-collection/order-entry-frs-v3-three-workflows.md` newer) and `V04-vector-surveillance-reporting-preview.html` (main's `vector-surveillance-reporting.html` newer, via #232).
- **`decision-log-additions.md` — STILL LEFT for Casey (skill-governance, not gallery mechanics).** Unchanged residual from 07-27: append D-035…D-042 to the openelis-design skill `references/decision-log.md` + a spec-registry row + a carbon-anti-patterns note (skill files are read-only in Cowork). Flagged, not done autonomously.
- **Jira (Step 11):** no new/changed gallery slugs from THIS run (the portal entries were registered in the 07-27 run and carry no dedicated OGC ticket key) → **no gallery permalinks posted** (noise + dead-link avoidance; the portal FRSs reference only the OGC-949 family loosely). The Atlassian connector was also unauthenticated in this non-interactive session.
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-07-28`) recording the #242 MERGED flip + the 5 portal drains + this entry. Connector `create_pull_request` returned **403** ("Resource not accessible by integration" — app still lacks `pull_requests:write`); branch pushed with the PAT. CI auto-opener should open the PR on push (api.github.com blocked in-sandbox → PR number unverifiable here). One-click compare URL: https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-07-28?expand=1 — auto-merge + required `test` check land it on green. **Status: OPEN** — verify MERGED next run.

## Reconciliation — 2026-07-27 (scheduled run)
- **Step 0 — no OPEN or stranded PRs coming in.** Fresh `git ls-remote` shows origin has **only `refs/heads/main`** (HEAD `c30f9f3`, docs-manual freshness refresh, 2026-07-27) — every prior ledger branch merged and deleted, incl. `design/inventory-module-redesign` (PR #236) and its 07-23 dedup follow-up. Nothing OPEN, nothing past the 7-day stranded threshold.
- **Canonical `upload/` ↔ gallery reconcile (content md5 vs full `designs/` + `public/designs/` tree, 612 files).** One genuinely-new design family found: the **Results Portal** (staged 2026-07-25). Registered this run on branch `design/results-portal-c3-track-r` under a new `portal` category:
  | Upload file | Class | Registered as |
  |---|---|---|
  | facility-results-portal-frs.md | NEW (registered) | designs/portal/facility-results-portal.md |
  | facility-results-portal-preview.html | NEW (registered, +public mirror) | designs/portal/facility-results-portal-preview.html |
  | patient-self-registration-frs.md | NEW (registered) | designs/portal/patient-self-registration.md |
  | patient-self-registration-preview.html | NEW (registered, +public mirror) | designs/portal/patient-self-registration-preview.html |
  | results-portal-c0-discovery-brief.md | NEW (registered, spec-only) | designs/portal/results-portal-c0-discovery-brief.md |
  Tests 259/259, build clean. dist NOT committed (deploy rebuilds; avoids squash conflict). Source files LEFT in `upload/` pending merge (drain-on-merge convention).
- **`decision-log-additions.md` — LEFT for Casey (skill-governance, NOT gallery mechanics).** Requests appending D-035…D-042 to the openelis-design skill `references/decision-log.md` + a spec-registry row + carbon-anti-patterns note (skill files are read-only in Cowork). Same class as the 2026-07-22 residual — flagged, not done autonomously.
- **Pre-classified non-design working docs LEFT in `upload/`** (unchanged from prior reconciliations; no gallery counterpart): `Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx`, `NOTE-test-catalog-mn.md`, `test-catalog-mn-crosscheck.md`, `test-catalog-specimen-model-reassessment.md`, `analyzer-import-bench-experience-STAGING.md`, `multicomponent-analyzer-ui-STAGING.md`, `clinical-order-entry-GATES.md`, `order-entry-mockup-vs-delivered-UX-drift.md`, `order-entry-three-domain-crosswalk.md`, `s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md`, `v04-v1.5-jira-comment-draft.md`, `openelis-design-SKILL-updated.md`. **Gallery-newer (do-not-push, LEFT):** `order-entry-FRS-v3-three-workflows.md` (main's `designs/sample-collection/order-entry-frs-v3-three-workflows.md` newer) and `V04-vector-surveillance-reporting-preview.html` (main's `vector-surveillance-reporting.html` newer, via #232).
- **Jira (Step 11):** the three new entries carry no dedicated OGC ticket key (FRSs loosely reference the OGC-949 family only), and gallery routes aren't live until merge+deploy → **no gallery permalinks posted** (dead-link + noise avoidance). The Atlassian connector was also unauthenticated in this non-interactive session.
- **PR:** connector `create_pull_request` returned **403** ("Resource not accessible by integration" — app still lacks `pull_requests:write`). Branch pushed with the PAT. One-click compare URL: https://github.com/DIGI-UW/openelis-work/compare/main...design/results-portal-c3-track-r?expand=1 — CI auto-opener opened **PR #242** on push (verified open, not draft, head `9f6defa`); required `test` check + auto-merge landed it on green. This branch carried this ledger entry too. **Status: MERGED** (PR #242, verified on origin/main 2026-07-28 — merge commit `6ba48b0` is HEAD; portal branch deleted). Source files drained to `processed/` on the 2026-07-28 run.

## Dedup + facility supersession — 2026-07-23 (interactive follow-up)
- **Duplicate discovered & resolved.** The scheduled run (PR #236, `inventory-module-redesign.{md,html}`, no issue) raced an unpushed interactive commit (`25c8b6e`, `inventory-redesign.{md,html}`, **GitHub issue #237**) that registered the *same* OGC-438 feature (byte-identical FRS+HTML). Both landed on origin; the merge resolved App.jsx/MANIFEST/INDEX to the **interactive version** (specPath `inventory-redesign.md`, `githubIssue: 237`), leaving my `inventory-module-redesign.*` files **orphaned** (unreferenced) on disk + in the public mirror.
- **This PR:** removes the 3 orphaned files (`designs/inventory/inventory-module-redesign.{md,html}` + public mirror); the canonical entry stays `inventory-redesign.*` / issue #237. Registry now has a single Inventory Module Redesign entry.
- **Facility supersession (Casey-confirmed):** marked `reagent-forecasting-facility` (mockup) + `reagent-forecasting-facility-spec` `superseded_by` the redesign in MANIFEST; App.jsx facility description prefixed ⚠️ SUPERSEDED. Reagent Forecasting Workbench left as-is.
- **Drained** the upload sources (`FRS_Inventory_Redesign.md`, `preview-inventory-redesign.html`) → `upload/processed/` (feature landed & registered).
- **Jira (OGC-438):** gallery permalink `#/inventory/inventory-module-redesign` postable once this deploys; DEFERRED here (Atlassian connector unauth in session).

## Reconciliation — 2026-07-22 (scheduled run)
- **Step 0 — no OPEN or stranded PRs.** Fresh `git ls-remote` shows origin has **only `refs/heads/main`**
  (HEAD `92e61a0`, "analyzer-import: add multi-component import-review section (MC-1..5, OGC-1131)",
  2026-07-21) — every prior ledger branch merged and deleted. Nothing OPEN, nothing past the 7-day
  stranded threshold. Committed origin ledger was already current through the 2026-07-20 entry.
- **Landed interactively on `origin/main` since the 07-20 ledger (recorded for the trail, not scheduled-run work):**
  the **Test↔Sample-Type Many-to-Many** gallery entry — `designs/admin-config/test-catalog-specimen-mn.{md,jsx}`
  + `-preview.html` (+ `mockup-viewer/public/` mirror); App.jsx MOCKUP_REGISTRY "Test Catalog — Specimen
  Many-to-Many", MANIFEST id `test-catalog-specimen-mn`, INDEX row; jira **OGC-1145**, GitHub issue **#234**.
  Plus the analyzer-import multi-component import-review section (MC-1..5, OGC-1131 — the HEAD commit).
- **Canonical `upload/` ↔ gallery reconcile (content md5 vs full `designs/` + `public/designs/` tree, 594 files).**
  A new `test-catalog-mn` set (epic **OGC-1145**, per `NOTE-test-catalog-mn.md`, staged 2026-07-20 for Mozzy)
  was found in the mount's `upload/`. Content md5 shows the 3 gallery artifacts already landed on
  `origin/main` under the renamed `test-catalog-specimen-mn` slug:
  | Upload file | Class | Landed as |
  |---|---|---|
  | test-catalog-mn-phase1-frs.md | IDENTICAL (registered) | designs/admin-config/test-catalog-specimen-mn.md |
  | test-catalog-mn-editor-mockup.jsx | IDENTICAL (registered) | designs/admin-config/test-catalog-specimen-mn.jsx |
  | test-catalog-mn-phase1-preview.html | IDENTICAL (registered, +public mirror) | designs/admin-config/test-catalog-specimen-mn-preview.html |
  → all 3 **drained to `processed/`** this run.
- **Genuinely new design artifacts: NONE.** The m:n gallery entry is already on `main` + fully registered
  (issue #234) → **no design push, no PR, no build.**
- **Left in `upload/` for Casey (companion / working docs, no gallery counterpart):**
  `test-catalog-specimen-model-reassessment.md` (D-028 → D-035 decision brief) and
  `test-catalog-mn-crosscheck.md` (/crosscheck QA report) — companion/research artifacts referenced by the
  FRS front-matter, not standalone gallery entries (precedent: analyze/breakdown/crosscheck docs);
  `NOTE-test-catalog-mn.md` (staging note); the two analyzer STAGING notes
  (`analyzer-import-bench-experience-STAGING.md`, `multicomponent-analyzer-ui-STAGING.md`) whose actions are
  already done & registered on main (analyzer-import v2 MC import-review section is the HEAD commit);
  and `Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx` (duplicate of the `processed/` copy, harmless).
- **RESIDUAL — flagged for Casey, NOT done autonomously (skill-governance edits, outside gallery-mechanics scope):**
  per `NOTE-test-catalog-mn.md`, the openelis-design skill's `skills/openelis-design/references/decision-log.md`
  still needs **D-035** added (full m:n + per-specimen override, GLOBAL) with **D-028 marked superseded**, and
  `references/spec-registry.md` needs a row for `test-catalog-specimen-mn` (OGC-1145) annotating Sample Type
  Mgmt v2.1 + Completion v2 as affected — neither present on origin. The gallery entry itself is fully landed;
  only this design-log bookkeeping is outstanding.
- **Jira (Step 11):** no new/changed slugs from THIS run → **no gallery permalinks posted** (noise-avoidance);
  the Atlassian connector was also unauthenticated in this non-interactive session. The OGC-1145 gallery
  permalink (from the interactive registration behind issue #234) should be verified/posted by Casey if not
  already on the ticket.
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-07-22`) recording the 3 IDENTICAL
  drains + this entry; the auto-opener + required `test` check land it on green.

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

## Reconciliation — 2026-07-29 (scheduled run 2)
- **Step 0 — one incoming OPEN row, now MERGED. No stranded PRs.** Fresh `git ls-remote` shows origin has **only `refs/heads/main`** (HEAD `bb7e500`, the **PR #246** merge commit "chore(ledger): reconcile 2026-07-29 … no new design artifacts"). The run-1 07-29 doc-only branch `chore/ledger-reconcile-2026-07-29` (its own last bullet still read **OPEN**) is confirmed **MERGED** as PR #246 and flipped this run. Nothing OPEN, nothing past the 7-day stranded threshold.
- **Canonical `upload/` ↔ gallery reconcile (content md5 vs full `designs/` + `public/designs/` tree). Genuinely-new design artifacts: NONE.** The mount `upload/` fileset is byte-identical to the run-1 07-29 classification — no new files landed since. Every non-`processed/` upload file is a pre-classified non-design working doc / staging note / comment draft, a Jira story draft, or a gallery-newer stale copy — all LEFT in place. The two design-type candidates re-checked by md5 this run remain **gallery-newer (do-not-push, LEFT):** `order-entry-FRS-v3-three-workflows.md` (main's `designs/sample-collection/order-entry-frs-v3-three-workflows.md` newer) and `V04-vector-surveillance-reporting-preview.html` (main's `designs/vector-surveillance/vector-surveillance-reporting.html` newer, via #232).
- **`upload/inventory-techdebt/` (unchanged, LEFT + flagged):** `inventory-catalog-cleanup-jira-story.md` (OGC-658) and `inventory-storage-integration-jira-story.md` (OGC-657) — developer implementation stories, not gallery mockups/FRS → not registered. Flagged for Casey: confirm the stories exist on OGC, then drain these drafts to `processed/`.
- **`decision-log-additions.md` — STILL LEFT for Casey (skill-governance, not gallery mechanics).** Append D-035…D-042 to the openelis-design skill `references/decision-log.md` + spec-registry row + carbon-anti-patterns note (skill files are read-only in Cowork).
- **Other pre-classified non-design working docs LEFT in `upload/`** (unchanged): `Aspect_GxAlert_to_OpenELIS_Gap_Analysis.docx`, `NOTE-test-catalog-mn.md`, `test-catalog-mn-crosscheck.md`, `test-catalog-specimen-model-reassessment.md`, `analyzer-import-bench-experience-STAGING.md`, `multicomponent-analyzer-ui-STAGING.md`, `clinical-order-entry-GATES.md`, `order-entry-mockup-vs-delivered-UX-drift.md`, `order-entry-three-domain-crosswalk.md`, `s06-lhu-domain-variants-jira-comment-draft.md`, `v04-v1.5-ida-brief.md`, `v04-v1.5-jira-comment-draft.md`, `openelis-design-SKILL-updated.md`.
- **Jira (Step 11):** no new/changed gallery slugs this run → **no gallery permalinks posted** (noise + dead-link avoidance).
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-07-29b`) recording the #246 MERGED flip + this entry. Doc-only change (only `upload/PENDING-PRS.md`); required `test` CI check gates the auto-merge. Connector `create_pull_request` attempted first; on 403 (app lacks `pull_requests:write`) the branch is pushed with the PAT and the CI auto-opener + required `test` check land it on green. Compare URL: https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-07-29b?expand=1 — **Status: OPEN**, verify MERGED next run.

## Reconciliation — 2026-08-11 (scheduled run)

- **Step 0 — nothing OPEN, nothing stranded coming in.** `git ls-remote` shows origin has **only `refs/heads/main`** (HEAD `969299c9`), i.e. no open remote branches. The prior run's 08-10 doc-only ledger sync (`chore/ledger-reconcile-2026-08-10`) is confirmed **MERGED** (its reconciliation prose is on origin's ledger and HEAD advanced past #256's `955c3d5` to `969299c9`; branch deleted). No branch is past the 7-day stranded threshold.
- **Canonical `upload/` ↔ gallery reconcile (content md5 vs the full 613-file `designs/` + `public/designs/` tree on origin/main). Genuinely-new artifacts this run: TWO designs, both pushed.** Two new file sets dropped in the mount `upload/` on 2026-08-11, no md5 match anywhere in the gallery tree:
  1. **Multiple Samples per Test at Order Entry** — `multi-sample-order-entry-frs-v1.md` + `multi-sample-order-entry-preview.html` → registered as a new **sample-collection** HTML entry (OGC-285). Branch `design/multi-sample-order-entry` pushed.
  2. **Analyzer Results — Lab Unit Access Control** — `analyzer-results-lab-unit-access-frs.md` + `-mockup.jsx` + `-preview.html` (+ `-breakdown.md` planning doc, NOT registered per the analyze/breakdown precedent) → registered as a new **analyzer-integration** HTML entry (OGC-1057 +288/337/1137/1151). The `.jsx` ships in `designs/` as a reference asset but the registry uses `component:null` + the self-contained preview because the JSX default export needs props and would crash rendered propless. Branch `design/analyzer-results-lab-unit-access` pushed.
- **PR creation — connector 403 (permission regression persists).** `create_pull_request` (DIGI-UW/openelis-work) returned **403 "Resource not accessible by integration"** for both branches — same regression flagged since 2026-07-27; the app still lacks `pull_requests:write` at the OAuth-broker layer (api.github.com is also blocked in the scheduled sandbox). Both branches were pushed with the PAT; the **CI auto-opener + required `test` check** are expected to open and auto-merge each on green. Compare URLs recorded as **OPEN** above.
- **Decision-log (Step 6): nothing to append.** No staged `decision-log-additions.md` block is present in `upload/` (the 07-29-era D-035…D-042 block is no longer there). The two new FRSs only **cite** existing decisions (D-001/002/005/007/008/009/026/028) as compliance references — they do not propose new log entries. No append, no conflict.
- **Jira (Step 11): deferred, no comments posted.** Both entries are new and not yet merged/deployed; per precedent (dead-link avoidance) the gallery permalinks to **OGC-285** and **OGC-1057** are DEFERRED until the PRs merge and the gallery redeploys — post next run.
- **Mount-local staging cleanup:** the two new source sets (5 files) are drained from the mount `upload/` → `upload/processed/` this run so the next reconcile doesn't re-flag them; they were never tracked in origin's `upload/`. All previously-classified non-design working docs / gallery-newer stale copies remain **LEFT in place** (unchanged from the 08-10 classification), including the `upload/inventory-techdebt/` OGC-657/658 developer stories still flagged for Casey.
- **This run pushes a doc-only ledger sync** (`chore/ledger-reconcile-2026-08-11`) recording the two new OPEN design rows + this entry. Doc-only change; required `test` CI check gates the auto-merge; connector PR 403 → CI auto-opener lands it. Compare URL: https://github.com/DIGI-UW/openelis-work/compare/main...chore/ledger-reconcile-2026-08-11?expand=1 — **Status: OPEN**, verify MERGED next run.

