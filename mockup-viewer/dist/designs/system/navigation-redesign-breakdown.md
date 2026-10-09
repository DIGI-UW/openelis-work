# Navigation Redesign: Story Breakdown (suggested slicing guide)

**FRS:** `navigation-redesign-frs.md` v0.1 (approved 2026-09-24)
**Preview:** `navigation-redesign-preview.html`
**Mockup:** `navigation-redesign-mockup.jsx` (target `MENU` and `ADMIN` trees, icon registry)
**Inventory data:** `navigation-redesign-data/` (current.json, target.json, admin.json, menu-dev-2026-09-24.csv) (every row and its disposition)
**Slices:** 6 PR-sized vertical slices; slice 6 is gated on other work and slice 5 is best after OGC-529
**Non-binding.** The developer owns the final slicing. Sizing is per reviewable PR, not story points.

## Handoff ticket

**Type:** Epic. It spans a data migration over every menu row, frontend renderer changes, code removal across several modules, and the Admin sidebar; that is more than one screen and more than one PR.
**Title:** Navigation redesign: workflow-sectioned main menu, menu retirement, grouped Admin sidebar
**Description summary:** Reorganize the 220-entry main menu into six workflow sections (max 3 levels, one entry per page), retire Study and other dead entries under the Keep/Merge/Hide/Remove rule, and group the Admin sidebar into five buckets.
**Linked epics (is part of / relates to):** OGC-305 OpenELIS UI and Navigation Improvements; relates to OGC-682 (QA menu), OGC-529 (admin sidenav framework), OGC-353 (hide Study menus, completed by slice 3)
**Labels:** `global`, `navigation`, `ux`, `legacy-removal`

## Slices

| # | Slice (what a user gets) | FRs | Size | Depends on | Notes |
|---|---|---|---|---|---|
| 1 | **Lab staff see the new sectioned main menu.** One Liquibase changeset set keyed on `element_id`: insert 4 section rows + Referrals + Case Workbenches groups, restyle `menu_qa` and `menu_reports` as sections, re-parent and re-order per `target.json`, relabel with new keys, set icons, drop URLs from parents; extend `navigationIcons.js`; hide empty sections/groups; update breadcrumbs of moved pages | FR-1 to FR-8, FR-13, FR-15 to FR-18, FR-27 | L (one migration + small renderer change + i18n) | #4315 (built); OGC-1151 for per-role pruning to be visible | Rows are only moved and relabelled here; nothing is deleted yet, so the slice is safe to ship alone. Migration must not flip `is_active` (FR-13) |
| 2 | **A stock install shows every finished feature.** Replace the includes list in `volume/menu/menu_config.json` with the target tree; turn its four JSON-only entries into DB rows; hide Billing unless a billing URL is set; Main Menu configuration shows headings and the new hierarchy | FR-19 to FR-21 | M | Slice 1 | Tell the `projects/reporting-uat` owner (Piotr) to re-point that profile |
| 3 | **Study and dead entries are gone.** Remove tier: delete the 52 Study rows, their routes, JSP and React pages that exist only for them, and their i18n keys; delete Help › Process Documentation and its PDFs; delete already-off duplicate and generic-workflow rows; redirect every removed URL. Hide tier: ship Generic Sample entries and the two Côte d'Ivoire routine reports switched off. Remove Study Menu and MenuStatement Configuration admin pages with redirects | FR-9, FR-10, FR-12, FR-24 | L (mostly deletions) | Slice 1 | Completes OGC-353 and D-021. Large diff but low risk; reviewer checks the redirect table against Appendix A.2 |
| 4 | **Every page has exactly one door.** Merge tier: delete the 22 merged rows (duplicates, single-child folders, intermediate EQA folders, Routine report children), keep their URLs redirecting to the survivor; WHONET legacy report redirects to `/Microbiology/whonet` | FR-5, FR-11 | M | Slice 1 | Can merge in either order with slice 3 |
| 5 | **Admins find pages by bucket.** Regroup the Admin sidebar under Config / Organization / Resources / Automation / Compliance; add Barcode Configuration, Environmental Compliance Standards (in Resources) and Notification Triggers; move Reflex and Calculated Values into Test Catalog; shorten labels | FR-22, FR-23, FR-23a, FR-25, FR-26 | M | Best after OGC-529 (admin sidebar on the shared renderer); can ship on the current component if OGC-529 slips | Page routes and titles unchanged |
| 6 | **Gated removals.** Remove the legacy "Add Order" (`/SamplePatientEntry`, hidden until then) once the three domain workflows are live on the release; remove the runtime Results › Analyzer entries once Runs supplies `/Results?run=` | FR-14, FR-10 (those two rows) | S | Domain workflows live (OGC-1070); Runs OGC-1200 | Two small PRs if the gates open at different times |

## Order

1 → 2 → (3, 4 in either order) → 5 → 6 as gates open. Slice 1 is the only one users notice immediately; 2 to 4 are cleanup that shrink Menu Configuration and the codebase.

## Coverage check

- Every FR (FR-1 to FR-27, FR-23a) is in at least one slice: yes.
- Every row in Appendix A.2 is handled: Keep and Merge-free moves in slice 1, Merge in slice 4, Hide and Remove in slice 3, gated Remove in slice 6: yes (220 of 220).
- Every slice is titled by what a user gets, not by layer: yes. Migration, frontend and i18n travel together in each slice.
- Cross-cutting work folded in: localization (every new or changed label ships with its key in all language files, in the slice that introduces it); access (no new rules; role and domain filtering are existing behavior, slice 1 only relies on them).
- Open questions: Q-2 (rehome QA) and Q-3 (Microbiology WHONET is canonical) resolved by Casey 2026-09-24; let Samuel know about the QA rehome before slice 1 merges. Q-1, Q-4, Q-5 do not block.

## Documentation

A Feature Doc child is expected when the Epic reaches In Review. The user manual pages that show the side menu (every "how to find X" step) will drift; re-capture them after slice 1 ships.
