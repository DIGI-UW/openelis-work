# Test Catalog Management v2.5 — Epic Restructure Plan

**Date:** 2026-05-14
**Driver:** Casey — new sprint rules: 1 mockup = 1 epic, each epic fits in a 2-week sprint.
**Status:** Proposal for sign-off before executing in Jira.

## What's wrong with the current shape

The current state has 2 large umbrella epics (OGC-746 v1 + OGC-759 v2) with 19 child "stories," several of which are XL — they don't fit in a 2-week sprint. Three of the v1 "stories" are essentially epics in size:

- **OGC-747** (XL) — scaffold + list view + permissions + states + 10 schema migrations + legacy decommission = ~3-4 sprints of work
- **OGC-749** (XL) — Sample & Results with multi-component + accordion + Result Interpretations + Copy from Test + inline-add Unit = ~2 sprints
- **OGC-751** (XL) — Ranges Structured + Coverage Validation + Activation Acknowledgment modal = ~2 sprints

That violates both new rules (an "epic" is a sprint-sized container, not a multi-month container; and each existing story bundles multiple distinct mockups).

## Proposed new shape

Each **mockup / UI surface** becomes its own epic. Sprint-sized epics have 2-4 child stories that are the actual sprint work. Backend-only foundation work (no mockup, but real work) gets its own epic labeled `backend-foundation`.

Roughly **22 epics total** (15 for v1-equivalent scope, 7 for v2-equivalent scope), down from 2 super-epics.

### Mapping: existing tickets → new epic structure

| New epic (proposed) | Sprint estimate | Existing ticket(s) to repurpose | New child stories needed |
|---|---|---|---|
| **F1. Schema Migrations + Backend Foundation** | 1 sprint | Split from OGC-747 | Migration scripts, deprecation flags on legacy columns, smoke test |
| **F2. Editor Scaffold + Permissions + States** | 1 sprint | Split from OGC-747 | SideNav routing, Carbon shell, 4 state patterns, breadcrumb, Save/Cancel/SaveAsNew header buttons |
| **F3. Test List View + Filters + Pagination** | 1 sprint | Split from OGC-747 | List table, filter bar (default collapsed), URL state, click-to-open, AMR badge + Domain Tag |
| **F4. Legacy Admin Decommission** | 0.5 sprint | Split from OGC-747 | Remove legacy Test/Section/Panel/Method entries from Admin SideNav, redirect old routes |
| **B1. Basic Info section** | 1 sprint | Repurpose OGC-748 | Form layout, Domain radio + validation, AMR reveal + WHONET typeahead, status flags, Activation gate hook, Domain switch modal |
| **S1. Sample & Results — Components + Sample Types** | 1 sprint | Split from OGC-749 | Sample Types FilterableMultiSelect, Default ComboBox, Result Components table, inline-add Unit |
| **S2. Sample & Results — Interpretations + Copy from Test** | 1 sprint | Split from OGC-749 | Select List Options sub-table, Result Interpretations table, adaptive value-field modal, Copy from Test modal, per-component accordion |
| **M1. Methods section** | 1 sprint | Repurpose OGC-750 | Link existing method modal, inline create form, shortcodes, default method, effective date, Copy from Test |
| **R1. Ranges — Structured view + Coverage Validation** | 1 sprint | Split from OGC-751 | Structured view (accordion per type), Add/Edit modal, Fill Gap, Copy-to-other-sex, Coverage panel |
| **R2. Ranges — Activation Acknowledgment + Audit** | 1 sprint | Split from OGC-751 | Activation modal, `test_activation_acknowledgment` writes, "Coverage incomplete" list-view Tag, list-view tagging on existing tests |
| **R3. Ranges — Table view + Visual view** | 1 sprint | Repurpose OGC-758 | View selector, Table view with sort + bulk actions, Visual view with demographic-selector + stacked bars |
| **SS1. Sample Storage section** | 1 sprint | Repurpose OGC-752 | Form layout, special handling checkboxes (no emojis), Override Restricted, in-progress order behavior, Quick Reference card |
| **D1. Display Order section** | 1 sprint | Repurpose OGC-756 | Sample Type selector ComboBox, drag-drop list, keyboard reorder, auto-save on drop |
| **P1. Panels section** | 1 sprint | Repurpose OGC-753 | Typeahead picker, separate +Create button + inline form, expandable rows, drag-drop position with preview |
| **T1. Terminology section** | 0.5 sprint | Repurpose OGC-754 | Mapping table, +Add Mapping inline form, Edit/Remove |
| **A1. Analyzers (read-only)** | 0.5 sprint | Repurpose OGC-755 | Read-only table, link to analyzer's Master Lists record, info card, empty state |
| **L1. Labels section** (v2) | 1 sprint | Repurpose OGC-761 | Per-test linked presets table, +Add picker scoped to 4 presets, qty config, Order Entry preview |
| **RG1. Test-Reagent linkage backend** (v2) | 0.5 sprint | Repurpose OGC-760 | New table, 4 REST endpoints, permission gating, schema migration |
| **RG2. Reagents section** (v2) | 1 sprint | Repurpose OGC-762 | Linked reagents table, link modal, inline edit usage/qty, stock display, unlink with confirmation |
| **AL1. Alerts section** (v2) | 1.5 sprints | Repurpose OGC-763 | Rules DataTable, inline-expansion add/edit, trigger conditions (5), channel selection from Notification system, recipients, ack toggle |
| **RC1. Reflex & Calc cross-links** (v2) | 0.5 sprint | Repurpose OGC-764 | Read-only sub-sections, Master Lists deep-links, badges |
| **C1. Compliance section** (v2) | 1.5 sprints | Repurpose OGC-765 | DataTable, Group By toggle, inline expansion add/edit, ComboBox standard selector, conditional fields per type, threshold count badge — blocked by OGC-528 |
| **SS2. Sample Storage audit history** (v2) | 0.5 sprint | Repurpose OGC-766 | Audit-write triggers, change-log modal with diff display |
| **LO1. Localization Hardening** (v2) | 1 sprint | Repurpose OGC-767 | `get_localized_test_field()` function, API contract change, UI fallback indicators, bulk export |
| **OGC-757** (sibling, untouched) | 1.5 sprints | Stays as-is | Sample Storage display propagation in Order Entry / Results / Validation — separate feature |

### Total: 24 epics (was 2)

- **v1 wave (15 epics, ~12-13 sprints):** F1-F4, B1, S1-S2, M1, R1-R3, SS1, D1, P1, T1, A1
- **v2 wave (7 epics + 1 sibling, ~7-8 sprints):** L1, RG1-RG2, AL1, RC1, C1, SS2, LO1 + OGC-757

### Cross-cutting umbrella

OGC-746 (v1) and OGC-759 (v2) become **archived umbrella epics** — closed/superseded — but the Confluence page already published links to them as historical record. New epics will link to each other via labels (`test-catalog-v1`, `test-catalog-v2`) and `Relates` links between dependent pairs.

## Execution plan

If you sign off on the structure:

### Phase 1 — Convert existing stories to epics (in place)

Use `editJiraIssue` to change issuetype from "Story" to "Epic" on each existing ticket that maps 1:1 (everything except the XLs). Update descriptions to refer to the new sprint-sized scope.

Stories that map 1:1 (~14 conversions):
- OGC-748 → B1
- OGC-750 → M1
- OGC-752 → SS1
- OGC-753 → P1
- OGC-754 → T1
- OGC-755 → A1
- OGC-756 → D1
- OGC-758 → R3
- OGC-760 → RG1
- OGC-761 → L1
- OGC-762 → RG2
- OGC-763 → AL1
- OGC-764 → RC1
- OGC-765 → C1
- OGC-766 → SS2
- OGC-767 → LO1

### Phase 2 — Split the XLs into multiple epics

- OGC-747 → split into F1 (Schema Migrations), F2 (Scaffold), F3 (List View), F4 (Legacy Decommission). OGC-747 gets converted to F1 (or F2, whichever) and 3 new epics created.
- OGC-749 → split into S1 (Components) and S2 (Interpretations). OGC-749 becomes S1 and 1 new epic for S2.
- OGC-751 → split into R1 (Structured + Coverage) and R2 (Activation Ack + Audit). OGC-751 becomes R1 and 1 new epic for R2.

Net new epics from splits: 5 (F2, F3, F4, S2, R2).

### Phase 3 — Add child stories under each new epic

For each epic, create 2-4 child stories that break the work into sprint-fittable chunks. Estimated ~60-80 new child stories total. Examples for one epic:

**B1 (Basic Info) child stories:**
1. Form layout + Test Name / Reporting Name / Code / Description fields + i18n keys (~1 day)
2. Domain radio group + required validation + Domain switch modal (~1.5 days)
3. AMR flag + conditional WHONET fields + WHONET typeahead + retention behavior (~2 days)
4. Status flags + Activation gate stub + Internal QA tooltip (~1 day)

That's ~5.5 days = fits in a 1-week sprint plus polish.

### Phase 4 — Close the old umbrella epics

OGC-746 and OGC-759 → transition to Done with closing comment: "Superseded by per-mockup epic structure (see labels `test-catalog-v1` and `test-catalog-v2`). Confluence page [link] reflects the new shape."

### Phase 5 — Update cross-links

- Relink dependency chains: RG2 blocked by RG1, C1 blocked by OGC-528
- Re-link supersedes: closed predecessors (OGC-173 etc.) re-point at the most specific new epic (e.g., OGC-174 → F2 Scaffold, not the dead OGC-747)

### Phase 6 — Update the Confluence page

Rewrite the delivery plan page to reflect the new structure: 22 epics in two waves, with sprint estimates for each.

## Risks / decisions worth flagging

1. **Existing comments on the converted tickets stay attached.** Good for history but may confuse readers who see "Story 1" in the comments referring to a ticket now labeled as an Epic. Mitigation: add a closing comment to each converted ticket explaining the transition.
2. **Child stories don't exist yet.** Will need ~60-80 new tickets created. That's a lot. Suggest doing this in batches per epic so you can sanity-check the breakdown for a few epics before I keep going.
3. **Sprint estimates are guesses.** "1 sprint" assumes 1 engineer * 10 days. Adjust per actual team capacity. Some epics may need 0.5 sprints (and could be paired) or 1.5 sprints (with a couple of small overflow stories carried to the next sprint).
4. **The Confluence page is now slightly stale.** I should update it after Jira is reorganized.
5. **OGC-757 stays untouched** unless you want it split (e.g., one epic per consuming screen). My read: keep as one story since the snapshot pattern is shared across all three screens.

## What I need from you to execute

1. **Sign off on the 22-epic shape** (or adjust — too many? not enough? wrong splits?)
2. **Sign off on the conversion approach** — convert existing tickets in place vs. close-and-refile fresh
3. **Sign off on the child-story batching** — do all 22 epics' children at once, or one wave at a time for review

If you say go, I'll start Phase 1.
