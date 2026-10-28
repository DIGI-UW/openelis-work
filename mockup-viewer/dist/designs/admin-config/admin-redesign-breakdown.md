# Admin Redesign: Suggested Slicing Guide (v1.0)

**FRS:** `admin-redesign-frs.md` v1.0
**Preview:** `admin-redesign-preview.html` (admin home, Configuration, Menu Configuration, Report Management, Provider Titles as the reference list, and the register entry for every other page)
**Mockup:** `admin-redesign-mockup.jsx`, built at handoff after the FRS and preview are approved
**Jira:** one Epic for this guide's slices 1 to 9. Report Management is delivered by slices 5 to 8 of the existing Epic **OGC-1111** (see below); this Epic links to it.

This is a suggestion, not a contract; the developer slices the work. Each slice is one branch and one pull request a reviewer can read in one sitting, shippable on its own, in dependency order. Localization (Reuse/New keys, §15) and the Admin-role gate sit inside each slice. Acceptance criteria are in FRS §19.

---

## Handoff ticket

- **Title:** Admin redesign: one sidebar, one page standard, and Configuration
- **Type:** Epic (many screens, new settings metadata)
- **Summary:** Group the Admin sidebar under five sections, make every admin page follow one standard, and put every setting on one searchable Configuration page; Menu Configuration becomes one tree editor.
- **Linked:** OGC-1111 (Report Management, "is part of" the same programme); OGC-529 (closed PR #3546, data-driven admin sidebar; not required); OGC-1151 (menu role filtering, in review).
- **Labels:** `global`, `admin`, `ux-consistency`, `iso-15189` (audit history, no hard delete)

---

## v1: The frame and the standard (4 PRs)

| # | Slice (what a user can do after it merges) | FRS | Closes | Pts |
|---|---|---|---|---|
| 1 | **An administrator finds every admin page under five headings, from the sidebar or the admin home.** Admin sidebar regrouped per §3.1 (Config, Organization, Resources, Automation, Compliance) from one definition that also renders the admin home; unique icons; Environmental Compliance Standards and Notification Triggers added as single entries to their existing routes (slice 4 splits them into children); "Merging" tags on transitional entries; generated admin home with page search and "Search settings for" (links to Configuration once slice 5 merges; until then hidden); breadcrumb fixes on Language, Translation, Site Branding, Sample Acceptance and the vector pages; dashboard misroutes gone; "Reflex Tests  Management" double space. No existing route changes. | AF-1 to AF-19 | AF-AC-2 to AF-AC-4, AF-AC-6 (AF-AC-1 closes once slices 4, 8, 9 and OGC-1111 slice 5 have merged) | 8 |
| 2 | **Every list starts to behave the same way, beginning with Provider Titles and Providers.** Shared admin components (N-5): page header, list toolbar with search, Status filter and Add, row Active switch and Edit, open-row footer with sticky Save and Cancel, unsaved guard, read-back toast, conflict message, in-use deactivation confirmation, Undo toast, History panel from the audit trail. Applied to Provider Titles (modal edit and create removed) and Providers (legacy action bar removed). | AS-1 to AS-38 (components), O-09, O-10 | AS-AC-1 to AS-AC-7 | 8 |
| 3 | **Nothing in Admin can be deleted any more.** Language Management, Calendar holidays, Environmental Compliance parameter groups and thresholds, Test Catalog alert rules and accreditation enrollments switch off instead of deleting, using the slice 2 components (in-use counts N-15, History N-14); deactivated rows hidden behind the Status filter. | AS-21, AS-22, C-16, C-17, R-01, R-11 (deletes) | L-01, L-12 | 5 |
| 4 | **Every view inside a page has its own sidebar entry; no tabs.** Microbiology Reference tabs removed (the sidebar already holds the six sections); Environmental Compliance Standards and Notification Triggers views move to sub-routes (N-7) and sidebar children; vector pages get the shared header; Programs' Visual / JSON switch resolved (R-12). | AS-4, R-09, R-10, R-11, R-12, A-05, N-7 | AS-AC-8, L-03, L-06 | 5 |

**Order.** 1 first. 2 before 3 (3 reuses its components). 4 any time after 1.

---

## v2: Configuration (3 PRs this release, 1 next release)

**Before slice 5:** run `admin-redesign-findability-test.html` with three or four administrators and adjust the area assignment (FRS Q-1). Author settings metadata N-1 for area, lifecycle, control type and allowed values (Appendix B is the draft; control types are harvested from the existing editors and `site_information.value_type`).

| # | Slice | FRS | Closes | Pts |
|---|---|---|---|---|
| 5 | **An administrator finds and changes any setting from one page.** `/MasterListsPage/configuration`: one list of the 164 settings (N-2 read), areas filter with "n of N", Routine / Setup / All with Routine default and "Showing n of N", search over label, description and key across every lifecycle with the outside-view notice, typed inline editing with read-back (including `int` and per-language values), default shown beside a changed value, "Was on", History, deep links, secrets write-only (N-3), server-file properties read-only with Copy key, area link rows. Admin home's "Search settings for" link switched on. | CF-1 to CF-13 (with CF-3a, CF-5a), CF-19, CF-21 to CF-27 (with CF-23a), CF-31 to CF-35, CF-38, CF-41, CF-42 | CF-AC-1, CF-AC-2, CF-AC-4, CF-AC-5, CF-AC-7 to CF-AC-10 | 13 |
| 6 | **Settings that belong together, and settings that are dangerous, say so.** Blocks with governing switches and "Saved n of N"; the danger marking and typed confirmation; Module switches only filter; Setup "Default" tags; guidance prose where written and the internal completeness report. Metadata N-1 for blocks, marking, module switch and guidance. French for every marking sentence. | CF-14 to CF-18, CF-20, CF-28 to CF-30, CF-36, CF-37 | CF-AC-3, CF-AC-6, CF-AC-11, CF-AC-12 | 8 |
| 7 | **Administrators on the old pages are pointed to Configuration.** Cross-link notification on the six Workflow Settings pages, Application Properties and Site Information; transitional "merging" marks in the sidebar. | CF-39 | CF-AC-13 (first half) | 2 |
| 8 | **(Next release) The old settings pages are gone.** Remove (D-066): entries removed from the sidebar, routes redirect to `configuration?was=<editorKey>` with the moved notification, Workflow Settings group removed, page code and keys for the property tables deleted where nothing else uses them (Constitution X). Gate: the automated check that every setting each old page edits appears in Configuration and saves. | CF-40, AF-16, X-08 | CF-AC-13 (second half), AF-AC-5 for X-08 | 3 |

Slice 7 can fold into slice 5 if the reviewer prefers.

---

## v3: Menu Configuration (1 PR)

| # | Slice | FRS | Closes | Pts |
|---|---|---|---|---|
| 9 | **An administrator switches menu entries on and off safely.** One tree editor for Main, Non-Conform and Patient Menu: section headings, "n of N on", search with parents, Expand all / Collapse all, Show filter, changed marks, sticky footer, review-and-save modal with full paths, one save request (N-11), discard guard, History per entry; Billing Menu as a form with the address rule; Study Menu and MenuStatement removed with redirects; Admin and Home entries locked on. | MC-1 to MC-12 (with MC-3a), X-02, X-03 | MC-AC-1 to MC-AC-6, AF-AC-5 for X-02 and X-03 | 8 |

---

## Report Management (delivered under OGC-1111)

Report Management is specified in FRS §13 and built by slices 5 and 6 (V1) and 7 and 8 (V2) of `patient-report-and-report-management-breakdown.md`. Two additions from this FRS ride on those slices: the sidebar placement Config › Report Management (top level, not inside Workflow Settings) in slice 5, and RM-2a (page numbers on other reports) in slice 5. Coordinate slice 1 of this guide with OGC-1111 slice 5 so the Report Management entry lands in its final place once.

---

## Consistency passes (when each page is next touched)

Not scheduled as their own project. Each row of FRS §9 marked *Consistency pass* lists its gaps; a developer working on that page applies them with the slice 2 components in the same PR. The largest are: Users (O-03, redesign to `user-management.md`), Label Presets (C-15), Dictionary (R-13), External Connections (A-01), Test Notifications (A-04), Programs (R-12), Lab Number Format and Database Cleaning (marking and typed confirmation).

---

## Coverage check

- Every FRS requirement is in a slice: AF-1 to AF-19 (1, 8); AS-1 to AS-38 (2, applied in 3 and 4); N-14 to N-16 (2, 3); CF-1 to CF-42 (5 to 8); MC-1 to MC-12 (9); RM-1 to RM-21 (OGC-1111 slices 5 to 8). Yes.
- Every element in the preview is built by a slice: admin home and sidebar (1), Provider Titles (2), Configuration (5, 6), the cross-link notice on register pages (7), Menu Configuration and Billing (9), Report Management (OGC-1111). Yes.
- Every slice is titled around what a user can do: yes.
- Localization ships with the slice that shows the string; the Admin-role gate is unchanged and verified in slice 1.
- Pages in the register marked *Consistency pass* are not sliced here by design; they follow the page.
