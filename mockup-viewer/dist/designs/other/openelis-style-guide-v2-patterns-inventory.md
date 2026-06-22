# OpenELIS Style Guide v2 — Patterns Inventory (discovery pass)

> **Purpose:** Phase 2A discovery notes. As I walk through the shipped app, I catalog each distinct pattern instance I find and flag drift against any documented v1 rule. This is a working document — not a style guide yet. After the walkthrough, we review this file, pick which patterns deserve a v2 page, and migrate the canonical version into Confluence.
>
> **Owner:** Casey · **Driver:** Claude (via Claude in Chrome on `testing.openelis-global.org`)
> **Source of truth:** Live shipped app + `DIGI-UW/OpenELIS-Global-2` repo.
> **Started:** 2026-04-23 · **Status:** Discovery in progress.
>
> **Related files:**
> - [v1 Foundations style guide](openelis-style-guide-v1-foundations.md)
> - [Cleanup staging](openelis-style-guide-cleanup-staging.md) — drift found during this walkthrough lands in the watch-list there

---

## How this file is structured

Each pattern category has:

- **Where observed** — list of pages/screens where this pattern appears, with screenshot references.
- **Instances** — distinct visual/behavioral variants found, described briefly.
- **Drift noted** — inconsistencies worth a cleanup ticket (copied to the staging watch-list).
- **Candidate canonical** — tentative "best-in-class" variant to propose for v2.
- **Open questions** — anything needing product / design input.

Empty sections are expected at the start. They fill in as the walkthrough progresses.

---

## Walkthrough progress tracker

| Area | Status | Screenshots | Notes |
|---|---|---|---|
| Dashboard | ✅ Deep pass 2026-04-23 | ss_0943v27g2 | Tile grid, all Title Case, inconsistent tile subtitle copy |
| Orders (add, view, modify) | ✅ Deep pass 2026-04-23 | ss_6716ziibf (Add), ss_3208cbzbr (Modify), ss_45089933r (Incoming), ss_7274j7pru (Batch) | 4-step wizard, two "Add Order" sidenav entries, misspelling found |
| Results entry | Not started | — | — |
| Results review | Not started | — | — |
| Validation | Not started | — | — |
| Patient management | Not started | — | — |
| Reports (11 shells) | Not started | — | — |
| Admin (28+ pages) | Not started | — | — |
| Referrals | Not started | — | — |
| Workplan | Not started | — | — |
| Pathology | Not started | — | — |
| Analyzers admin | Not started | — | — |
| EQA | Not started | — | — |
| Alerts | Not started | — | — |
| Storage | Not started | — | — |
| Batch entry | ✅ Covered via Batch Order Entry | ss_7274j7pru | ALL CAPS "ORDER" section heading — outlier typography |
| Barcode | Not started | — | — |

---

## Pattern categories

### 1. Data tables

Carbon `DataTable` vs `react-data-table-component` — both are installed. v1 §12 flagged this as a v2 Patterns decision.

**Where observed:**
- Add Order → Patient search results ("Patient Results" table)

**Instances:**
- **Patient Results table (Add Order, SamplePatientEntry).** Columns: Last Name, First Name, Gender, Date of Birth, Unique Health ID number, National ID. Columns wrap to multi-line when the header is long ("Unique Health ID number" wraps to 3 lines). Supports sort (broken — see drift), supports page size selector (10/20/30/50/100), Carbon-style prev/next pagination with `"n-m of k items"` count. Heading "Patient Results" sits in a separate shaded bar above the table. No explicit empty-state UI — just "0-0 of 0 items".

**Drift noted:**
- D01 — Sort header aria-labels broken: `"Click to sort rows by [object Object] header in ascending order"` — column-name interpolation missing on every sortable header. Likely pass-through of an object where a string was expected.
- D02 — Table column header casing is Title Case (`Last Name`, `First Name`, `Date of Birth`, `Unique Health ID number`, `National ID`). v1 sentence-case rule applies: should be `Last name`, `First name`, `Date of birth`, `Unique health ID number`, `National ID` (keep `ID` per keep-list).
- D03 — Long-header column wraps to 3 lines, crushing the narrow column. No width-hint or truncation strategy applied.

**Candidate canonical:** TBD — pick one library. v2 rules will cover: header style (sentence case + keep-list), sort affordance, page-size selector, empty state, dense vs. regular rows, selection pattern.

**Open questions:** Is the `react-data-table-component` usage load-bearing anywhere (specific features Carbon doesn't do well)?

---

### 2. Workplan grids

Specialty: the workplan views (by test section, by panel, etc.) render large grids of samples × tests with result entry inline.

**Where observed:** _(fill as we walk)_

**Instances:**

**Drift noted:**

**Candidate canonical:**

**Open questions:** How much of this is unique to OpenELIS vs. generalized table patterns?

---

### 3. Referral queues

Outgoing referrals, incoming referral results — pool-aware (aliquot numbering `LABNO.X-Y` per memory).

**Where observed:**

**Instances:**

**Drift noted:**

**Candidate canonical:**

---

### 4. Report shells

11 reports documented in the app. Each has its own filter bar + render shell.

**Where observed:**

**Instances:**

**Drift noted:**

**Candidate canonical:**

**Open questions:** Do reports share a template component or is each one independent?

---

### 5. Modals / dialogs

Carbon `Modal` usage, sizes, action buttons, destructive confirmation shape.

**Where observed:**

**Instances:**

**Drift noted:**

**Candidate canonical:**

---

### 6. Slide-over panels

`.slide-over-root`, `.oeui-slideover-x`, `.oeui-slideover-y` — v1 §11 calls these out as non-Carbon utilities for detail / editor panels.

**Where observed:**

**Instances:**

**Drift noted:**

**Candidate canonical:** Already scoped in v1 §11. v2 extends with layout rules (width, header, footer, scroll behavior).

---

### 7. Forms (grid layout + field groups)

v1 §7 covered field anatomy. v2 covers multi-field layout — column grids, field groups, section dividers, inline help.

**Where observed:**
- Add Order (Test Request — patient search + demographics, step 1 of wizard)
- Modify Order (Edit Order, dual-panel: "Search By Accesion Number" + "Search By Patient")
- Batch Order Entry Setup (two panels: "ORDER" + "Configure Barcode Entry")
- Incoming Orders (Search Incoming Test Requests — two search panels)

**Instances:**
- **2-column field grid (Add Order patient search, Modify Order patient search).** Two fields per row on desktop (Patient Id + Previous Lab Number; Last Name + First Name; Date of Birth + Gender). Below that, "Search" + "External Search" as a pair of secondary-styled buttons.
- **Field-group cards (Batch Order Entry).** Two white cards separated by whitespace: "ORDER" (date/time + Form select) and "Configure Barcode Entry" (Methods + Optional Fields checkbox row). Section headings use ALL CAPS (!) for "ORDER" and Title Case for "Configure Barcode Entry" — inconsistent within the same page.
- **Colon-suffixed labels vs bare labels.** "Form:*" (colon + required asterisk) on Batch Order Entry — but "Methods", "Site Name", "Ward/Dept/Unit", "Patient Id" (and most other labels app-wide) are bare. Inconsistent required-field indicator placement too.

**Drift noted:**
- D04 — "ORDER" section heading is ALL CAPS. Violates v1 §3 typography (no ALL CAPS headings). Only instance seen so far — isolated outlier or systemic?
- D05 — Required-field indicator inconsistent: `Form:*` uses colon + asterisk; most other required fields app-wide don't appear to have any visible required indicator (need to verify). Carbon standard is asterisk *after* the label (no colon).
- D06 — Placeholder text duplicates label in Title Case (e.g. `Patient Id` → `Enter Patient Id`, `Previous Lab Number` → `Enter Previous Lab Number`). v1 §7 rule: placeholders should be lowercase example text, not a retyped label. Also inherits Title Case.
- D07 — "Patient Id" should be "Patient ID" per keep-list. This is a label drift parallel to A3 ("Ok" → "OK") — add ID to the sentence-case keep-list and fix.

**Candidate canonical:** Carbon Grid 2-column with 8px gap between fields and 16px gap between rows. Section card = white background on `$layer-01`, 24px padding, section heading Carbon `heading-03` in sentence case. Required-field indicator: asterisk immediately after label text, no colon. Placeholder = lowercase example, not label echo.

---

### 8. Search / filter bars

Top-of-page filter strips. Carbon `MultiSelect`, `DatePicker`, `Search` components.

**Where observed:**
- Modify Order — two separate panels ("Search By Accesion Number" + "Search By Patient")
- Incoming Orders — two separate panels (free-text search + date-range + status)

**Instances:**
- **Dual-panel search (Modify Order).** Stacked panels, each with its own "Submit"/"Search" button. No "Reset" affordance. Each panel can independently query.
- **Free-text + filtered search (Incoming Orders).** Single search field → Search button for text queries. Below that, Start Date + End Date + Status select + "All Info" checkbox → Search button for structured queries. Two separate Search buttons on one page.
- **Common helper text.** Incoming Orders explains the free-text scope inline: `"Search by family name, national ID number, lab number from referring lab, or passport number"` — nice voice/tone example, matches v1.

**Drift noted:**
- D08 — Two separate Search buttons on Incoming Orders (one per panel) is confusing. User has to know which panel's button corresponds to their filters. Consider unified "Search" with OR semantics, or a single button that applies all non-empty filters.
- D09 — Section heading "Search by Date, and Status Enter the date range for test requests. This will search by the date referral, or the order date of the electronic request" runs heading + helper text together without punctuation separation. Comma after "Date" is also odd ("Search by Date, and Status"). Rewrite: heading = "Search by date and status" (sentence case); helper text = separate paragraph below.
- D10 — Abbreviation "Lab No" in placeholder `"Enter Lab No"`. v1 voice rules prefer full words ("lab number") unless the keep-list abbreviation is well-known. "Lab No" is not in the keep-list.

**Candidate canonical:** Single filter bar above the results area, Carbon layout, labels and placeholders in sentence case. One Search button; one Clear/Reset affordance. Helper text as a separate paragraph, not concatenated with the heading.

---

### 9. Pagination

Carbon `Pagination` vs custom pagination in react-data-table-component vs simple next/prev.

**Where observed:**
- Add Order → Patient Results table

**Instances:**
- **Carbon-style pagination (Patient Results).** Bottom of table: "Items per page" select (10/20/30/50/100), "0-0 of 0 items" count at bottom-left, "Page of 1 page" on right with prev/next arrows. Shape matches Carbon `Pagination`.

**Drift noted:**
- D11 — Page count label reads `"Page of 1 page"` (no page number between "Page" and "of") when data is empty. Should read something like `"Page 1 of 1"` or hide pagination entirely on empty state.

**Candidate canonical:** Carbon `Pagination` in all tables. Hide or disable pagination in empty state rather than render a malformed label.

---

### 10. Empty states

v1 §8.3 covered empty-state message archetypes. v2 covers visual shape — icon, heading, subtitle, CTA placement.

**Where observed:**
- Patient Results (Add Order) — empty
- Dashboard — tiles render with `0` value but no explicit "no data" treatment

**Instances:**
- **Empty table, header-only.** Patient Results renders the column headers with no body rows and "0-0 of 0 items" in the pagination footer. No icon, no explanatory text.
- **Zero-value tile (Dashboard).** Tiles with `0` just show the number — no visual hint that "0 is good" vs "0 is because no data loaded". Indistinguishable states.

**Drift noted:**
- D12 — No empty-state UI on tables. Visually a header-only table is ambiguous — did no results match, or did the query not run yet? v1 §8.3 archetype: `"No <items> found. <Next step>."`
- D13 — Dashboard tile zero values don't differentiate "0 today" (healthy baseline) from "data not loaded" (error state). Consider a subtle skeleton during load, explicit "No data" text on error.

**Candidate canonical:** Empty table = icon + sentence-case heading + subtitle + optional CTA. Follow Carbon's `EmptyState` pattern. For tiles: loading skeleton during fetch, inline error with retry icon on failure, plain number on success.

---

### 11. Loading / progress states

Skeleton loaders, Carbon `InlineLoading`, full-page spinners, per-row spinners.

**Where observed:**

**Instances:**

**Drift noted:**

**Candidate canonical:**

---

### 12. Tabs vs sidenav submenus

Per memory (`openelis_sidenav_submenus`): use sidenav submenus, not in-page Carbon Tabs for multi-view screens. Check drift during walkthrough.

**Where observed:**
- Sidenav (global) — Order, Generic Sample, Patient, Storage, Analyzers, Non-Conform, EQA Tests, EQA Management, Workplan, Results, Validation, Reports all have submenus (chevron indicator)
- Add Order — "Search for Patient" / "New Patient" Carbon `ContentSwitcher` within step 1

**Instances:**
- **Sidenav submenus (preferred pattern).** Top-level items with chevron expand to reveal children. Active child highlights in navy with white text. Good: matches the memory-documented rule.
- **In-page ContentSwitcher (Add Order step 1).** The "Search for Patient" / "New Patient" toggle lives inside a wizard step. This is a *sub-mode* of the step, not a whole-screen switch — acceptable by the "tightly-coupled views inside a single screen" exception.

**Drift noted:**
- D14 — Two "Add Order" sidenav entries under the Order parent (see screenshot ss_6716ziibf). One is a direct link, the other is an expandable subgroup. Duplicate label confuses navigation.
- D15 — "Study" appears as a child under Order. Unclear semantic relationship (is a Study a kind of Order?). Consider whether Study should live under its own top-level entry or under Admin.
- D16 — "Sample Shipment" is a standalone top-level item while "Generic Sample" is a parent with submenu. Inconsistent — should Sample Shipment live under Generic Sample (or a Samples parent), or should they be flat siblings?
- D17 — "Non-Conform" is truncated English. The full term is "Non-Conforming Event" (NCE per keep-list). Label should read "Non-conforming" or "NCE".

**Candidate canonical:** Sidenav submenus with no duplicate labels in a single subtree. Top-level items grouped by domain ("Samples", "Orders", "Results", etc.). Abbreviations from the keep-list allowed in labels.

---

### 13. Wizards / steppers (multi-step flows)

Env/Vector memory confirms a 4-step order entry wizard pattern. Look for other wizards and consistency.

**Where observed:**
- Add Order (Test Request) — 4 steps: Patient Info / Program Selection / Add Sample / Add Order

**Instances:**
- **4-step Carbon `ProgressIndicator` (Add Order).** Horizontal stepper at top of page. Step labels all Title Case ("Patient Info", "Program Selection", "Add Sample", "Add Order"). Second step label truncates to "Program Sel…" at standard viewport width. States: Complete (filled checkmark) / Incomplete (outline). Only the currently-reachable step is labeled "Complete"; later steps are "Incomplete" until the user progresses.

**Drift noted:**
- D18 — Stepper labels in Title Case. Should be sentence case per v1 §6.
- D19 — "Program Sel…" truncation at a common width. Either shorten the label ("Program") or give the stepper more room / wrap to two lines.
- D20 — The fourth step shares the same label ("Add Order") as the overall wizard name. Consider renaming the final step ("Confirm" or "Review") so the user doesn't see "Add Order > Add Order".

**Candidate canonical:** Carbon `ProgressIndicator`. Sentence-case step labels, short enough to fit at default viewport. Distinguish wizard title from step labels. Last step is a review/confirm step.

---

### 14. Date / time pickers

Carbon `DatePicker`, date ranges, time-of-day entry.

**Where observed:**
- Add Order — Date of Birth (DatePicker, placeholder `dd/mm/yyyy`)
- Incoming Orders — Start Date / End Date (range; placeholders `dd/mm/yyyy`)
- Batch Order Entry — Current Date + Current Time (hh:mm) / Received Date + Reception Time (hh:mm)

**Instances:**
- **Carbon DatePicker with DD/MM/YYYY format.** Consistent placeholder `dd/mm/yyyy` across screens. Calendar icon inside the input (right side). Date filled value shown as `23/04/2026` (ISO-ish but DMY order).
- **Separate Time (hh:mm) input (Batch Order Entry).** Time is a separate text input next to the date, not integrated with the DatePicker. Format hint in the label itself: `Current Time (hh:mm)`.
- **Date range pair (Incoming Orders).** Start Date + End Date rendered as two independent DatePickers side-by-side, not a Carbon `DatePicker` with `datePickerType="range"`.

**Drift noted:**
- D21 — Date format `dd/mm/yyyy` is locale-specific (ambiguous with American `mm/dd/yyyy`). No locale-aware formatting. Consider ISO 8601 (`yyyy-mm-dd`) as canonical, or at minimum honor user locale.
- D22 — Time input is not a Carbon time picker — just a free-form text field. No validation, no dropdown. User could type anything.
- D23 — Date range not using `datePickerType="range"` — loses the linked behavior (end ≥ start, visual range on calendar).
- D24 — Format hint in label text (`Current Time (hh:mm)`) rather than Carbon `TextInput` `helperText` prop. Consider moving to helperText for cleaner label presentation.

**Candidate canonical:** Carbon `DatePicker` with `datePickerType="range"` for date ranges. Time as a formatted `TextInput` with `type="time"` and helperText. Default to ISO 8601 or locale-aware format; never ambiguous DMY/MDY.

---

### 15. Autocomplete / type-ahead

Patient search, test search, provider search.

**Where observed:**

**Instances:**

**Drift noted:**

**Candidate canonical:**

---

### 16. Detail panels / inspector views

Right-aligned or slide-over detail views over a list.

**Where observed:**

**Instances:**

**Drift noted:**

**Candidate canonical:**

---

### 17. Confirmation dialogs (destructive)

v1 §8.3 covered the copy archetype. v2 covers the visual shape — destructive button style, enumeration of cascade effects.

**Where observed:**

**Instances:**

**Drift noted:**

**Candidate canonical:**

---

### 18. Barcode-scanning inputs

Specialty input: barcode scan target, fallback manual entry, scan feedback.

**Where observed:**

**Instances:**

**Drift noted:**

**Candidate canonical:**

---

### 19. Iconography catalog

`@carbon/icons-react` usage. Which icons are used where, with what semantics.

**Where observed:**

**Instances:**

**Drift noted:**

**Candidate canonical:** An inventory of icons-in-use per semantic role.

---

### 20. Data visualization (charts)

`@carbon/charts` usage — TAT dashboards, QC trends, volume charts.

**Where observed:**

**Instances:**

**Drift noted:**

**Candidate canonical:**

---

### 21. Page shells / header + breadcrumb patterns

Page title, breadcrumb, action buttons in the header row.

**Where observed:**
- Dashboard (breadcrumb `Home /` only, no page title)
- Add Order (breadcrumb `Home / Add Order /` + page title "Test Request")
- Modify Order (breadcrumb `Home /` + page title "Modify Order")
- Batch Order Entry (breadcrumb `Home /` + page title "Batch Order Entry Setup")
- Incoming Orders (breadcrumb `Home /` + page title "Search Incoming Test Requests")

**Instances:**
- **Breadcrumb-only header (Dashboard).** Top strip shows `Home /` as a muted breadcrumb with no page title and no page-level actions. Dashboard is the landing view so no title is arguably fine, but it's inconsistent with every other page.
- **Breadcrumb + page title, no actions (all other pages).** Light-gray backdrop strip contains breadcrumb above a large display-sized page title. No action buttons live in this header strip; every CTA lives inside the content cards below.
- **Breadcrumb + page title WHERE breadcrumb redundantly repeats sidenav entry (Add Order).** The active sidenav item is "Add Order"; the page title is "Test Request"; the breadcrumb is `Home / Add Order /`. Three separate representations of where the user is, each phrased differently.

**Drift noted:**
- D25 — Page titles are Title Case (`Test Request`, `Modify Order`, `Batch Order Entry Setup`, `Search Incoming Test Requests`). Violates v1 §6 — should be sentence case (`Test request`, `Modify order`, `Batch order entry setup`, `Search incoming test requests`).
- D26 — Breadcrumb trailing slash on every page (`Home / Add Order /`). The final `/` serves no purpose; the current page should either terminate the breadcrumb (no trailing slash) or be the final non-link segment.
- D27 — No action bar pattern. Pages with primary actions (Submit, Search) place them inline with the form rather than in a pinned header. Inconsistent with most Carbon-based LIMS patterns where page-level primary actions live top-right.
- D28 — The Dashboard has no page title, while every other page does. Either give the Dashboard a title ("Dashboard" or "Home") or document the Dashboard as a deliberate exception.

**Candidate canonical:** Page shell with: breadcrumb (sentence case, no trailing slash) + page title (sentence case, Carbon productive-heading-05) + optional action cluster (top-right, primary button + any kebab menu). Action cluster fixed to page-header row, not inline with form.

---

### 22. Status tags / chips (extended beyond v1)

v1 §9.3 documented Carbon tag kinds. v2 extends with which tag kind maps to which OpenELIS status in which context.

**Where observed:**

**Instances:**

**Drift noted:**

**Candidate canonical:**

---

### 23. Dashboard tiles (KPI cards) — new category

Dashboard landing view is a grid of KPI tiles, each showing: tile title, subtitle, large numeric value, and an expand icon (top-right diagonal arrows). This doesn't cleanly map to Carbon's standard components — it's a bespoke OpenELIS pattern.

**Where observed:**
- Dashboard (Home) — 10 tiles in a 4-column grid

**Instances observed:**

| # | Tile title | Subtitle | Value |
|---|---|---|---|
| 1 | In Progress | Awaiting Result Entry | 15 |
| 2 | Ready For Validation | Awaiting Review | 0 |
| 3 | Orders Completed Today | Total Orders Completed Today | 0 |
| 4 | Partially Completed Today | Total Orders Completed Today | 0 |
| 5 | Orders Entered By Users | Entered by users Today | 0 |
| 6 | Orders Rejected | Rejected By Lab Today | 0 |
| 7 | UnPrinted Results | UnPrinted Results Today | 0 |
| 8 | Electronic Orders | Electronic Orders | 0 |
| 9 | Average Turn Around time | Reception to Validation | 0 |
| 10 | Delayed Turn Around | More Than 96 hours | 0 |

**Drift noted:**
- D29 — The first tile ("In Progress") renders with a *darker fill background + white text* while all other tiles are white cards with dark text. Best-guess hypothesis: tiles render darker when their value > 0. If so, this "value-based emphasis" behavior is undocumented and surprising.
- D30 — Tile title + subtitle casing is wildly inconsistent. Title Case dominates (`In Progress`, `Ready For Validation`, `Orders Completed Today`) but tile #5 mixes cases (`Orders Entered By Users` / `Entered by users Today`). Tile #7 has invalid internal caps (`UnPrinted` — should be `Unprinted`). Tile #9 mixes Title + sentence within the title (`Average Turn Around time`).
- D31 — Tiles #3 and #4 share the *same subtitle* (`Total Orders Completed Today`) but have different titles (`Orders Completed Today` vs `Partially Completed Today`). Subtitle doesn't distinguish them — likely copy-paste bug in i18n.
- D32 — Tile #8 duplicates title as subtitle (`Electronic Orders` / `Electronic Orders`). Either subtitle isn't providing information or the copy wasn't filled in.
- D33 — Expand icon in top-right corner of every tile has no apparent affordance explaining what clicking does (no tooltip visible on load). Unclear if it opens a detail view, a fullscreen view, or navigates to the list.

**Candidate canonical:** KPI tile = Carbon `Tile` (or a dedicated `MetricTile` subclass) with slots: title (sentence case, Carbon `heading-compact-02`), optional subtitle (label-01, sentence case, provides context not restatement), value (display-heading-02), optional action icon with tooltip. Single visual treatment (no value-dependent color flip). Tiles align to a 3- or 4-column responsive grid with consistent height.

**Open questions:**
- Should tiles be clickable as a whole (navigate to the underlying list), with the expand icon only for a detail chart?
- Do we need a loading skeleton variant?
- Should some tiles be reorderable or dismissible per-user?

---

## Drift discovered during walkthrough

As new drift is found beyond what's already in v1 §12 / OGC-606, log it here. Items worth acting on get copied to the cleanup staging watch-list.

| # | Area | Drift | Severity | Notes |
|---|---|---|---|---|
| D01 | Data tables | Sort header aria-label shows `"[object Object]"` instead of column name | High (a11y) | Real code bug — interpolation broken on every sortable column |
| D02 | Data tables | Table column headers in Title Case | Low | Covered by OGC-606 A1 when header strings live in `en.json` |
| D03 | Data tables | Long column headers wrap to 3 lines, no width hint | Medium | Affects readability of "Unique Health ID number" etc. |
| D04 | Forms | ALL CAPS section heading "ORDER" on Batch Order Entry | Medium | Typography outlier — violates v1 §3 |
| D05 | Forms | Required-field indicator inconsistent (`Form:*` vs bare labels elsewhere) | Medium | Standardize on asterisk-after-label, no colon |
| D06 | Forms | Placeholders echo labels in Title Case (`Enter Patient Id`) | Low | Mixed with OGC-606 A1 — but adds placeholder casing rule |
| D07 | Forms | "Patient Id" should be "Patient ID" per keep-list | Low | Add to A1 keep-list |
| D08 | Search | Two separate Search buttons on one page (Incoming Orders) | Medium | UX confusion — consolidate or add Reset |
| D09 | Search | Heading + helper run together without punctuation on Incoming Orders | Medium | Split into heading and paragraph |
| D10 | Search | "Lab No" abbreviation in placeholder (not in keep-list) | Low | → "lab number" |
| D11 | Pagination | Malformed label `"Page of 1 page"` on empty table | Medium | Hide pagination when empty |
| D12 | Empty states | No empty-state UI on Patient Results table | Medium | v1 §8.3 archetype exists — implement |
| D13 | Empty states | Dashboard tile `0` values can't distinguish "no data" from "error" | Low | Add loading/error states |
| D14 | Sidenav | Duplicate "Add Order" entries under Order parent | High | Definite bug — remove one |
| D15 | Sidenav | "Study" nested under Order — unclear semantics | Low | Re-categorize or document |
| D16 | Sidenav | "Sample Shipment" top-level vs "Generic Sample" has submenu | Low | Group samples together |
| D17 | Sidenav | "Non-Conform" is truncated English | Medium | → "Non-conforming" or "NCE" |
| D18 | Wizards | Stepper labels in Title Case | Low | Covered by OGC-606 A1 if strings live in en.json |
| D19 | Wizards | Stepper "Program Selection" truncates to "Program Sel…" | Medium | Shorten label or widen step |
| D20 | Wizards | Final step "Add Order" duplicates wizard name | Low | Rename to "Review" or "Confirm" |
| D21 | Date pickers | DMY format `dd/mm/yyyy` ambiguous with MDY | Medium | Prefer ISO 8601 or locale-aware |
| D22 | Date pickers | Time input is free-form text, no validation | Medium | Use Carbon TimePicker / HTML `type="time"` |
| D23 | Date pickers | Date range = two independent pickers, not linked | Medium | Use Carbon `datePickerType="range"` |
| D24 | Date pickers | Format hint baked into label (`(hh:mm)`) | Low | Move to helperText |
| D25 | Page shells | All page titles in Title Case | Low | Covered by OGC-606 A1 if these are i18n keys |
| D26 | Page shells | Trailing slash on every breadcrumb | Low | Remove trailing separator |
| D27 | Page shells | No page-level action cluster — CTAs inline with forms | Medium | Document canonical action-bar pattern |
| D28 | Page shells | Dashboard has no page title, everywhere else does | Low | Decide on title or deliberate omission |
| D29 | Dashboard tiles | First tile has dark fill + white text; others white + dark | Medium | Undocumented value-based emphasis — remove or document |
| D30 | Dashboard tiles | Tile casing inconsistent (Title/sentence mixed, `UnPrinted` invalid) | Medium | Covered by OGC-606 A1 if strings live in en.json |
| D31 | Dashboard tiles | Tiles #3/#4 share same subtitle, different titles | High | Copy-paste bug in i18n |
| D32 | Dashboard tiles | Tile #8 duplicates title as subtitle | Medium | Real copy missing |
| D33 | Dashboard tiles | Expand icon has no tooltip/affordance label | Medium | A11y + discoverability |
| D34 | Page content | Typo: "Search By Accesion Number" (Modify Order) | High | Should be "Accession" |
| D35 | Button hierarchy | Batch Order Entry: `Next` (disabled/gray) vs `Cancel` (dark filled) — hierarchy inverted | Medium | Cancel should be secondary/tertiary, not emphasized |
| D36 | Empty states | Results pages show bare centered text "There are no records to display" — no illustration, no CTA | Medium | Document v1 §8.3 archetype or simpler canonical |
| D37 | Pagination | Results By Unit / Results By Test Date/Status default page size = 100; Patient Results defaults to 10 | Medium | Standardize default page size across modules |
| D38 | Pagination | "1 of 1 pages" uses plural "pages" when zero results | Low | Prefer "Page 1 of 1" singular, or hide when 0 results |
| D39 | Button states | Save button shown enabled with no records (Results By Unit, Results By Test/Date/Status) | Medium | Disable save until there's something to save |
| D40 | Sidenav labels | "By Order" link routes to `/AccessionResults` — label says "Order", URL + field says "Accession" | Medium | Pick one vocabulary (Order vs Accession vs Lab Number) and standardize |
| D41 | Sidenav labels | "By Range of Order numbers" — lowercase "numbers" mid-label while siblings are Title Case | Low | Normalize casing (sentence case per v1 §6) |
| D42 | Field labels | "From Accesion Number" / "To Accesion Number" — same "Accesion" typo as D34 | High | Fix spelling; scope expands beyond Modify Order |
| D43 | Breadcrumbs | "Referrals" page breadcrumb: `Home / ReferredOutTests /` — URL slug used as breadcrumb label | Medium | Use human-readable title ("Referrals"), not route slug |
| D44 | Section headings | "Search Referrals By Patient" (Title Case with "By" capitalized) | Low | Sentence case per v1 §6 |
| D45 | Empty states | `/ResultValidation` (direct nav) renders blank white page — no 404, no redirect, no error | High | Should show a clear error or redirect to dashboard |
| D46 | Breadcrumbs | Dashboard breadcrumb shows `Home / 1.2.1.6` — app version number leaked into breadcrumb trail | Medium | Remove version from breadcrumb; keep in footer or About dialog |
| D47 | Dashboard tiles | Tile count > visible: "Partially Completed Today", "Electronic Orders" hidden behind sidenav on first view | Low | Ensure responsive grid reflows when sidenav open; or collapse sidenav by default on dashboard |
| D48 | Validation layout | "Ready For Validation" drill-through page has no sidenav (focus mode) but breadcrumb still shows | Medium | Document focus-mode vs standard shell as a pattern choice |
| D49 | Page titles | "Ready For Validation" capitalizes "For" — Title Case violation | Low | Sentence case per v1 §6 ("Ready for validation") |
| D50 | Tabs | Validation uses Carbon Tabs horizontal inside focus-mode page: All / Hematology / Biochemistry / Immunology / Molecular Biology / Serology-Immunology / Cytology / +more | Medium | Valid use of tabs (intra-page filter), but note — overrides v1 sidenav-over-tabs default |
| D51 | Pagination copy | Validation: "of 1 page" (singular) vs Results: "of 1 pages" (plural) | Low | Pick one; same component shouldn't disagree across modules |
| D52 | Empty states | Validation table shows header row only — no row-zero text at all | Medium | Always render "There are no records to display" or an illustrated empty state |
| D53 | Page titles | "Add Or Modify Patient" capitalizes "Or" — Title Case violation | Low | Sentence case per v1 §6 ("Add or modify patient") |
| D54 | Toggle/paired buttons | `Search for Patient` / `New Patient` toggle uses two buttons (primary-filled vs outlined) instead of Carbon ContentSwitcher | Medium | Adopt ContentSwitcher to get a11y + consistent visual treatment |
| D55 | Field labels | "Primary phone:xxxxxx" — placeholder example (xxxxxx) baked into the label after a colon | High | Move `xxxxxx` into `helperText` or `placeholder` prop |
| D56 | Field labels | "Unique Health ID number" (sentence case) mixed with "National ID", "Last Name", "First Name" (Title Case) in the same form | Medium | Choose sentence case per v1 §6 and normalize |
| D57 | Gender input | Only Male / Female radio buttons — no "Prefer not to say" / "Unknown" / intersex option | Medium | Add inclusive third option or convert to free-text for regulatory flexibility |
| D58 | Sidenav labels | "NoteBook" uses camelCase | Low | Sentence case per v1 §6 ("Notebook") |
| D59 | Avatar uploader | Dashed-border "Add Photo" 120×120 square — good candidate canonical pattern | — | Document as file-upload pattern in v2 |
| D60 | URL params | Report URL `/Report?type=patient&report=patientCILNSP_vreduit` — deployment-specific codes (CILNSP = Côte d'Ivoire) + French abbreviation (`_vreduit` = reduced) leaked into public URL | High | Use neutral report IDs; move deployment variants to config |
| D61 | Report section headings | Same page: "Generate All Reports for a Client" (mixed case), "Generate a report or range of reports by Order Number / Lab Number" (sentence-ish), "Generate Reports By Site" (Title Case with "By") | Medium | Normalize all to sentence case |
| D62 | Report form pattern | Three independent dropdowns each with its own section heading stacked vertically — unusual grouping pattern for a single page | Low | Consider ContentSwitcher or radio group to reduce visual noise |
| D63 | Button copy | "Generate Printable Version" — verb + adjective phrase; doesn't match terser Carbon conventions | Low | Consider "Generate" or "Print report" |
| D64 | Loading state | Full-page gray overlay + blue spinner appears between some navigations (seen on sidenav Patient click) — uncharacterized | Medium | Document app-level loading overlay as a pattern, or replace with Carbon `Loading` component |
| D65 | Header branding | Title in header reads "Test LIMS" — deployment-specific branding (this is testing instance) but would be configurable in prod | — | Document as configurable brand slot in page-shell pattern |
| D66 | UX copy grammar | User Management subheading has "Modify or to Deactivate ." (space before period, extra "to") and "Filter ,Search" (space before comma, capitalized next word) | High | Rewrite; add to i18n QA pass |
| D67 | Column header redundancy | User Management columns are all prefixed "System User" — "System User First Name / System User Last Name / System User Login Name" — eats horizontal space | Medium | Use "First name / Last name / Login" |
| D68 | Boolean cell rendering | Account Locked / Account Disabled / Is Active columns use plain "Y"/"N" strings; elsewhere booleans appear as checkboxes, Tags, or text | Medium | Standardize on Carbon `Tag` or status dot + label |
| D69 | Colon spacing | User Management filter label reads "Filters :" (space before colon) — same bug genus as D29 | Low | Add to bulk find-replace in cleanup |
| D70 | Pagination + action cluster | User Management puts "Showing 1 - 2 of 2" inline with action buttons (Modify / Deactivate / Add) on one top bar, while other tables put pagination in the table footer | Medium | Pick one convention and document; favor Carbon footer pagination |
| D71 | Admin IA layout | Admin landing (`/MasterListsPage`) renders as a single vertical list with one decorative icon per row — diverges from Carbon tile/grid used on Dashboard | Note | Candidate for restyle to tile grid; or document as "admin index" variant |
| D72 | Spelling (en-US) | Admin row "Batch test reassignment and cancelation" uses "cancelation" (single 'l') — en-US standard is "cancellation" | Low | Fix string |
| D73 | Singular/plural consistency | "General Configurations" is plural, siblings are singular ("Test Management", "Menu Configuration", "Test Catalog Management") | Low | Pick one and apply; candidate: singular throughout |
| D74 | Truncation | "Reflex Tests Configurat..." truncated mid-word with no ellipsis character or tooltip — same genus as D26 | Medium | Add to bulk truncation cleanup |
| D75 | **Legacy JSP UI still reachable** | Reloading `/MasterListsPage` sometimes lands on `https://testing.openelis-global.org/api/OpenELIS-Global/Home` — full pre-React JSP interface with navy header + orange/tan horizontal tabs (Visit OE 3x \| Order \| Patient \| Sample Shipping \| Non-Conforming Events \| Workplan \| Results \| Validation \| Reports \| Admin \| Help). Version displayed in header = `3.2.1.6` (different from React breadcrumb's `1.2.1.6`). Admin page is a plain bullet list of ~20 items (Analyzer Test Names, Barcode Configuration, Batch test reassignment and cancelation, Dictionary, External Connections, Field Validation Configuration, List Plugins, Menu Configuration, Order Entry Configuration, Organization, Patient Entry Configuration, Printed Reports Configuration, Provider, Result Entry Configuration, Result Reporting Configuration, Site Information, Test Management, Test Notification Configuration, User Management, Workplan Configuration). | **High (architectural)** | Document this as a dual-UI reality. v2 scope must state: (a) which pages are React-only, (b) which pages still hit JSP, (c) which pages hybrid-render. Also note /MasterListsPage is served by JSP but the React shell sometimes overlays it — this is the hydration fragility observed in prior Admin walks. |
| D76 | **Raw i18n key leaked in legacy JSP** | Order dropdown in legacy UI contains an entry literally titled `sidenav.label.addorder` (the i18n key, not a translated string). Visible to every user in the default locale. | **High** | File as bug — add the missing translation OR remove the entry. Same genus as D31 in React. Systemic: legacy and React both have untranslated-key leakage; unified i18n QA needed. |
| D77 | Version mismatch | Legacy JSP header shows "Version: 3.2.1.6". React breadcrumb earlier leaked "Home / 1.2.1.6". Two different version numbers — may reflect frontend bundle vs backend release, or stale const. | Medium | Confirm with dev team whether this is intentional; if not, align version sources. |
| D78 | Two-path naming | Legacy JSP uses "Non-Conforming Events" (hyphenated, Title Case). React sidenav uses "Non-Conforming Events" for the module but earlier walks showed "Non Conformity" in various places, plus `NCE` abbreviation in submit forms. | Medium | Pick one canonical phrasing (suggest: "Non-conformance" sentence case + keep NCE as abbreviation); document legacy label as deprecated. |
| D79 | Legacy style tokens | Legacy JSP header uses a different navy (lighter, more slate) than React header; nav tabs are orange/tan gradient chips — no tokens in common with Carbon theme. Microscope+globe logo differs from React header logo. | Note | Legacy UI is out of scope for v2 tokens; call out clearly as "legacy JSP — not governed by style guide". |
| D80 | Page title obscured by sidenav | On `/MasterListsPage/labNumber`, the page `<h1>` "Lab Number Management" is positioned behind the admin sub-sidenav; visible text is "ab Number Management" / "te Information". Same issue recurs on `/SiteInformationMenu`. | **High** | Fix layout — page title z-index / left-margin must respect sidenav width. |
| D81 | Breadcrumb trailing slash | Multiple admin pages end breadcrumb with "Site Information /" or "Lab Number Management /" — a trailing slash with nothing after it | Low | Remove trailing delimiter; same genus as D22/D23 |
| D82 | Deployment code in value | Lab Number Management shows "Current Format: DEV01260000000000003" and "New Format: DEV01260000000000003" — the "DEV0126" deployment prefix is hard-coded as part of the lab number format template | Medium | Should be inputtable/configurable, not a hard-coded display string. Same genus as D60. |
| D83 | Inline `label: value` pattern | Lab Number Management uses "Current Format: DEV..." and "New Format: DEV..." rendered as plain text lines rather than Carbon form field components. Unique pattern in admin. | Note | Document as "inline read-only value" pattern, or replace with `FormItem` with read-only state. |
| D84 | CamelCase admin submenu labels | Under "General Configurations": "NonConformity Configuration", "MenuStatement Configuration", "WorkPlan Configuration" — CamelCase where every other sidenav uses space-separated Title Case | **High** | Rewrite to "Non-conformity configuration" / "Menu statement configuration" / "Workplan configuration" (sentence case) |
| D85 | Singular vs plural inconsistency | "Printed Report Configuration" (singular) under General Configurations while admin landing shows plural "Printed Reports Configuration" — same page, two labels | Medium | Pick one and apply |
| D86 | General Configurations submenu scope | 10 sub-items: NonConformity Configuration, MenuStatement Configuration, WorkPlan Configuration, Site Information, Site Branding, Result Entry Configuration, Patient Entry Configuration, Printed Report Configuration, Order Entry Configuration, Validation Configuration. Extremely long vertical menu with no grouping. | Medium | Consider grouping by domain (Site, Entry, Output) or flattening into tiles |
| D87 | Key/value config table pattern | Site Information admin page uses table `[Select \| Name \| Description \| Value]` with a radio per row and a single "Modify" button at top — one-at-a-time edit pattern. Unusual compared to inline edit conventions. | Note | Document as "admin key/value list" pattern; propose Carbon in-place edit or side-panel edit as alternate |
| D88 | Raw config key leaked as Name | Site Information row: Name = "allowLanguageChange" (camelCase raw key) while peers are human-readable ("24 hour clock", "Address line 1 label"). Some rows are human, some are key strings. | **High** | Consistent human labels with optional key as secondary metadata |
| D89 | Description column casing mix | Descriptions mix lowercase fragments ("label name for a place") with sentence-case complete sentences ("Allows the user to change the language at login") | Medium | Normalize to sentence-case complete sentences |
| D90 | Value rendering type-naked | Value column shows "true" / "Street" / "Camp/Commune" / "Town" with no indication of boolean vs string. No `<Tag>`, no switch, no pill. | Medium | Render booleans as Carbon Toggle or Tag; render enumerated values as Tag |
| D91 | Misleading sidenav collapse behavior | Clicking hamburger opens sidenav; clicking hamburger again closes sidenav. But when sidenav is open on admin pages, it overlays the admin sub-sidenav causing both sidenavs to stack visually. Two-layer nav pattern not documented. | Medium | Decide: should global sidenav be disabled inside admin? Or admin sub-nav collapse to top tabs? |
| D92 | Dashboard tile subtitle duplicates Today | "Orders Completed Today" (title) / "Total Orders Completed Today" (subtitle) — "Today" appears twice | Low | Remove from subtitle |
| D93 | Dashboard tile subtitle casing mix | "Orders Entered By Users" (Title Case) but subtitle "Entered by users Today" (mixed, Today capitalized) | Low | Sentence case throughout |
| D94 | Dashboard UnPrinted CamelCase | Tile "UnPrinted Results" and subtitle "UnPrinted Results Today" — CamelCase word "UnPrinted" | Medium | Rewrite to "Unprinted results" |
| D95 | Dashboard "More Than 96 hours" | Tile subtitle mixes Title Case ("More Than") with lowercase ("hours") | Low | Sentence case |
| D96 | **NEW PATTERN: numbered step sections** | Report Non-Conformity Event form uses large circled blue "01" and "02" glyphs next to section headings ("Reporter & Event Context", "Classification"). Vertically stacked, full-width sections. First occurrence of this pattern in the app. | — (pattern, not drift) | **Canonical candidate.** Document as "numbered-section form" pattern; promote for long, multi-part admin forms. Contrast with the Add Order wizard's horizontal ProgressIndicator. |
| D97 | Tri-phrase terminology drift (Non-Conformity) | Page title says "Report Non-Conformity Event" (hyphenated + "ity"), URL route is `/ReportNonConformingEvent` (CamelCase + "ing"), sidenav label is "Report Non-Conforming Event" (hyphenated + "ing"). Same action, three phrasings. Abbreviation elsewhere is "NCE" (Non-Conforming Events). | **High** | Pick one. Per user memory, "Non-Conformance" sentence case + "NCE" abbreviation is canonical. Rewrite title, sidenav, and route to align. |
| D98 | Severity tile picker pattern | Report Non-Conformity form offers 3 severity options as clickable tiles with colored circles (red / orange / green) + label ("Critical / Major / Minor"). Unique component not seen elsewhere. | — (pattern) | Document as "severity picker" pattern. Consider Carbon `Tile` with coloured accent bar instead of raw circle. |
| D99 | NCE Dashboard severity tile palette | `/NceDashboard` shows 4 stat tiles: CRITICAL (pink/red), MAJOR (pink/red), MINOR (yellow/amber), **OVERDUE (green)**. Green = "positive / success" in Carbon semantic tokens; using green for OVERDUE is a semantic mismatch. | **High** | Repaint OVERDUE to neutral/blue or a high-contrast warning; reserve green for success states. |
| D100 | NCE severity palette vs Report form palette | NCE Dashboard uses pink/pink/yellow/green; Report Non-Conformity form uses red/orange/green circles for the same severity concept. Two different palettes for one semantic domain. | **High** | Pick one severity palette and apply app-wide. Propose: Critical=red, Major=orange, Minor=yellow, Overdue=magenta/neutral. |
| D101 | Dual breadcrumb on NCE Dashboard | Top of page shows Carbon breadcrumb "Home /" then a second breadcrumb line "NCE > All NCEs" using a ">" separator. Two breadcrumb components rendered on one page, different glyphs. | Medium | One breadcrumb pattern per page. Remove the second OR merge into the Carbon breadcrumb. |
| D102 | NCE Dashboard empty state copy | Shows "No NCEs found matching your criteria." — uses NCE abbreviation but doesn't spell out on first use; screen has no tooltip defining NCE. | Low | Acceptable if NCE is in keep-list; add explain-on-hover tooltip for new users. |
| D103 | Pathology Dashboard tile with embedded date range | Tile reads "Complete(Week 16/04/2026 - 23/04/2026 )" — date range crammed into tile title with no space before open-paren, weird space before close-paren, and DD/MM/YYYY format that may localize incorrectly. | **High** | Move the date range into tile subtitle; use Intl.DateTimeFormat with locale-aware formatting; standardize spacing. |
| D104 | Pathology Dashboard search placeholder casing | Search box placeholder: "Search by LabNo or Family Name" — "LabNo" is CamelCase (raw key leak), "Family Name" is Title Case, "Search by" is sentence case. Three casings in one string. | Medium | Rewrite to sentence case: "Search by lab number or family name". Same genus as D88. |
| D105 | Pathology Dashboard page size default | Pathology Dashboard defaults to 100 items per page where other tables default to 25. Makes a long scroll on load. | Medium | Default to 25 and let users opt-in to 100; or document 100 as intentional for pathology. |
| D106 | Workplan By Test title casing | `/WorkPlanByTest?type=test` renders title "Workplan By Test" — "By" is Title Case where v1 §6 sentence case rule requires lowercase for non-keywords. | Medium | Rewrite to "Workplan by test". Same genus as D61. |
| D107 | Workplan By Test filter label | Filter reads "Search By Test Type" — "By" and "Test Type" Title Case. | Medium | Rewrite to "Search by test type". |
| D108 | Workplan route CamelCase in URL | Route `/WorkPlanByTest` — "WorkPlan" CamelCase mid-path. Same module also reached via `/WorkplanByTest` (lowercase-plan) in some places. Potential dead code branch if route resolution is case-sensitive. | Medium | Confirm canonical route casing; redirect alternates. |
| D109 | EQA Orders — **GOOD PATTERN baseline** | `/EQAOrders` has a clean modern pattern: sentence-case subtitle ("Proficiency testing orders for this laboratory"), 4 stat tiles, 3-filter row, search + primary CTA ("Enter New EQA Test"), Carbon Tags for Status/Priority, kebab Action column. One of the cleanest pages in the app. | — (reference) | Canonical baseline for "list with filters + new-item" admin pattern. |
| D110 | EQA Orders trailing breadcrumb slash | Breadcrumb "Home / EQA Tests / EQA Orders /" — same trailing slash as D81 | Low | Batch-fix |
| D111 | **NEW PATTERN: icon-prefixed tile** | EQA Management / Program Administration uses stat tiles with an **icon left of the title** inline with the heading ("📗 Active Programs", "👥 Enrolled Participants", "📗 Total Participants") + blue left border on the first tile (selected state). Unique in the app — every other stat tile is text-only. | — (pattern) | Canonical candidate: "stat tile with icon + selected-state border". |
| D112 | Sidenav vs page-title vs breadcrumb drift (3-way) | EQA Management Programs: sidenav label says "Programs", page `<h1>` says "Program Administration", breadcrumb says "EQA Programs". Three different strings for one page. | Medium | Align: suggest sidenav "EQA programs", title "EQA programs", breadcrumb "EQA programs". |
| D113 | **Inline tabs inside a page** | EQA Management / Program Administration uses Carbon-style in-page tabs ("EQA Programs | Participants | System Settings") each with trailing icon. Conflicts with user memory that OpenELIS should use sidenav submenus, not tabs. | **High** (architectural) | Per user preference: move these three views to sidenav submenu entries; retire in-page tabs. OR document the exception if tabs are the better pattern here and update the memory. |
| D114 | Settings Toggle pattern — **GOOD** | System Settings tab shows clean Carbon Toggle + label + secondary-text description rows ("EQA Deadline Alerts / Receive alerts when EQA submission deadlines are approaching"). Much better than the Site Information key/value table (D87). | — (reference) | Canonical candidate for v2 "settings panel" pattern. |
| D115 | Empty-state illustration | EQA Management > Participants (no program selected) shows a centered illustration + short hint "Select a program to view enrollments." | — (pattern) | Document as canonical empty-state pattern; roll out to other tables that currently show blank rows. |
| D116 | **OUTLIER: ">" in page title** | Analyzers List and Error Dashboard render the page title as `"Analyzers > Analyzer List"` / `"Analyzers > Error Dashboard"` — a ">" delimiter is baked into the `<h1>` instead of using the Carbon Breadcrumb component. No other page does this. | **High** | Replace with Carbon Breadcrumb + plain page title. |
| D117 | **OUTLIER: ALL CAPS tile labels** | Analyzers List tiles read "TOTAL ANALYZERS / ACTIVE / INACTIVE" — all caps. Error Dashboard tiles "TOTAL ERRORS / UNACKNOWLEDGED / CRITICAL / LAST 24 HOU..." — all caps. Every other module uses Title Case or sentence case. | **High** | Convert to sentence case to match the rest of the app. |
| D118 | Inconsistent action-column pattern | EQA Orders uses a kebab `⋮` menu in the Actions column. EQA Programs uses inline pencil + trash icons. Two different affordances for "row actions" within the same module group. | Medium | Pick one — inline icons for ≤3 actions, kebab for ≥4; document in a new "Row actions" pattern page. |
| D119 | Type-naked uppercase value in table | Analyzer List "Type" column renders "MOLECULAR" as plain uppercase text, not a Carbon `Tag` or pill. Contrast with Status column's "Active" green Tag on the same row. | Medium | Convert to Tag with theme-mapped colour. |
| D120 | Filter row wraps to two rows | Analyzer List renders Search full-width on row 1, then "Status" dropdown alone on row 2. Most other list pages put Search + filters on one row. | Medium | Collapse to single row, or justify the two-row variant in the pattern doc. |
| D121 | Stale-session error modal copy | After token timeout, a modal titled "System Error" appears with body "Error : Failed to fetch" (space before colon, technical JS error surfaced to user, "Error :" prefix duplicates the title) and a centered "OK" button. Appears over the login page. | **High** | Rewrite: title "Your session has ended", body "Please log in again to continue." Remove technical error string. Use Carbon Modal footer primary action. |
| D122 | Login page "Notice:" preamble | Login page shows a long disclaimer paragraph ("Notice: Access to this service is for authorized personnel only...") flowing as body text before the password field. No styling. | Low | Convert to Carbon `Accordion` or collapsed "Terms" link; keep short headline above fields. |
| D123 | Session timeout dialog title casing | Session-idle modal title is "Still There?" — Title Case + question mark. Copy inside: "User session is about to time out. Click anywhere to stay logged in." | Low | Sentence case: "Still there?" |
| D124 | Sidenav "Non-Conform" abbreviated | Collapsed sidenav label is "Non-Conform" (no "ing", no "ity", no "ance"). Expanded route goes to `/NceDashboard`. Fourth distinct spelling in this terminology cluster, joining D97's trio. | **High** | Fold into D97 remediation — pick one canonical term app-wide. |
| D125 | Locale combobox endonym/exonym mixing | Language picker mixes endonyms (native names) with English exonyms: "Français" (endonym), "Indonesia" (English — should be "Bahasa Indonesia"), "Swahili" (English — should be "Kiswahili"), "Amharic" (English — should be "አማርኛ"). Rule for locale menus is "each language labeled in that language." | **High** (i18n hygiene) | Replace each exonym with its endonym. Keep "English" in English per convention. |
| D126 | Locale combobox contains "English (Sri Lanka)" | Locale list includes a region-specific English variant ("English (Sri Lanka)") alongside plain "English", but no other language has a regional variant. Inconsistent granularity — either all regional variants or none. | Medium | Decide on regional-variant policy and apply uniformly; likely drop "English (Sri Lanka)" unless Sri Lanka deployments require it. |
| D127 | Login page `<h1>` duplicates button label | Login page `<h1>` is "Login" (Title Case), and the submit button below is also labeled "Login". Title duplicates the button and provides no additional context. | Low | Change title to "Sign in to OpenELIS" or similar; keep button "Login" (or "Sign in"). |
| D128 | Login page button hierarchy flat | "Login" button and "Change Password" button share identical primary-blue Carbon Button styling — no primary/secondary distinction. User has no visual cue which is the default action. | Medium | "Login" = primary (blue), "Change Password" = ghost or tertiary (text-only link-style). |
| D129 | Header "Version:: 3.2.1.6" double colon | User-menu header panel has label "Version:: 3.2.1.6" — two consecutive colons. Likely i18n key interpolation (`label: "Version:"` + template `"{label}: {value}"` producing `"Version:: 3.2.1.6"`). Same string also renders visually over the breadcrumb on the Home page. | Medium | Fix i18n template; strip one colon. Also audit overlap with breadcrumb region. |
| D130 | Header version label overlaps breadcrumb | On Home page, the "Version: 3.2.1.6" header-panel label renders in the same horizontal band as the breadcrumb ("Home / …") so the two strings visually collide. | Medium | Reposition version indicator into the user dropdown or footer; keep breadcrumb band clean. |
| D131 | Sidenav label "NoteBook" CamelCase outlier | Sidenav label for the electronic lab notebook module is "NoteBook" (intercaps). Should be "Notebook" (single word, sentence case) per v1 §6 casing rules. | Low | Relabel "Notebook". |
| D132 | Route casing inconsistency | Routes mix PascalCase (`/SamplePatientEntry`, `/PatientManagement`, `/NceDashboard`), lowercase (`/analyzers`, `/analyzers/errors`, `/analyzers/types`, `/inventory`), and camelCase (`/genericProgram`). Single app, three naming regimes. | Medium | Pick one (recommend lowercase-kebab) and redirect legacy URLs. |
| D133 | Sidenav "Order" singular (everywhere else plural) | Top-level sidenav item is "Order" (singular) while its submenu covers all order-related screens. "Patient" is also singular while submenu lists management screens. Everything else (Results, Reports, Alerts, Analyzers) is plural. | Low | Use "Orders" and "Patients" for top-level nav. |
| D134 | Alerts Dashboard — no breadcrumb | Alerts page (`/Alerts`) lacks any Carbon Breadcrumb — just a bare `<h1>` "Alerts Dashboard". Dashboard (Home) also lacks a breadcrumb. Inconsistent with every other list page. | Medium | Add Carbon Breadcrumb universally; even root-level pages show just "Home". |
| D135 | Alerts stat-tile pattern differs from Dashboard | Alerts page uses a lightweight stat-row ("Critical Alerts / EQA Deadlines / Overdue STAT Orders / Samples Expiring" — just `{label, value}` stacked) without the Dashboard's framed boxes or expand icon. A third tile pattern on top of D25 (Dashboard) and D111 (icon-prefixed EQA). | Medium | Consolidate into one stat-tile pattern family (sizes: compact / default / icon). |
| D136 | Filter dropdown label↔value inversion | Alerts > Alert Type dropdown shows "Unacknowledged Critical" for the value whose code is `CRITICAL_UNACKNOWLEDGED`. Display order is flipped relative to the data contract; compare with adjacent "Critical Alerts" stat tile — inconsistent word order to describe the same concept. | Low | Pick canonical order ("Critical unacknowledged") and use it in both tile and dropdown. |
| D137 | Dropdown value mixed casing | Alerts filters mix "EQA Deadline", "Sample Expiration", "STAT Overdue", "Unacknowledged Critical" (Title Case) in one dropdown while Severity shows "Warning" / "Critical" (single word Title Case) and Status shows "Open / Acknowledged / Resolved". Status pattern is closest to sentence case — mixed conventions across three adjacent combobox. | Low | Sentence case across all dropdowns; keep-list applies (EQA, STAT). |
| D138 | Empty table has no empty-state | Alerts Dashboard with no alerts shows only column headers followed by blank whitespace. D115's illustration pattern from EQA Management is not applied here. | Medium | Add centered empty-state: "No alerts right now. Alerts appear here when thresholds are crossed." |
| D139 | Storage breadcrumb skips intermediate level | `/Storage/sample-items` breadcrumb: "Storage / Sample Items" — skips "Storage Management" (the intermediate sidenav expand node) and also skips "Home". Breadcrumbs should reflect IA hierarchy. | Medium | "Home / Storage / Storage management / Sample items". |
| D140 | Column header CamelCase "SampleItem ID" | Storage > Sample Items renders table header "SampleItem ID" — intercaps in a column header. Should be "Sample item ID" (sentence case, keep "ID"). | Medium | Rewrite header. |
| D141 | Mixed casing in sibling column headers | In same table: "SampleItem ID" (CamelCase), "Sample Accession" (Title Case), "Type" (Title Case), "Status" (Title Case), "Storage location" (sentence case). One table, three casings. | **High** | Apply sentence-case rule consistently. |
| D142 | Location path uses ">" delimiter inside cell | Storage location values read "Main Laboratory > Freezer Unit 1 > Shelf-A > Rack R1 > A1". ">" is D116's outlier character appearing again, this time as a value-level separator. Inconsistent with `/` used in breadcrumbs. | Medium | Either adopt "→" unicode arrow (Carbon convention for hierarchical text) or use "›". Never reuse ">" since it reads as HTML tag. |
| D143 | Sample type values inconsistent plurals | Sample Items column "Type" shows values "Urines" (plural) mixed with "Plasma" and "Serum" (singular). | Low | Normalize to singular: "Urine". |
| D144 | List page "Add +" button pattern — **NEW PATTERN** | Storage > Rooms / Devices / Shelves / Racks / Boxes all use a primary-blue "Add +" button with trailing plus-icon right-aligned after the label. Consistent inside Storage, but differs from other modules' "Add new X" patterns (e.g. NCE uses a separate route, Orders uses "Select Tests"). | — (pattern) | Candidate canonical for v2 "new item" affordance. |
| D145 | Storage list pagination uses singular "page" | Pagination UI reads "1 of 1 page" — should be "1 of 1 pages" for English grammar or better: "Page 1 of 1". | Low | Change to "Page 1 of 1". |
| D146 | Cold Storage Dashboard — double navigation | `/FreezerMonitoring` renders in-page tabs ("Dashboard | Corrective Actions | Historical Trends | Reports | Settings") AND the sidenav shows the same five items as submenu entries under Cold Storage Monitoring. Clicking a sidenav submenu item changes `?tab=N`; clicking an in-page tab does the same. Two parallel nav affordances for the same routes. | **High** (architectural) | Per user memory "sidenav submenus, not tabs": remove in-page tabs; keep sidenav submenu. |
| D147 | Amp-uppercase subtitle "&" vs "and" | Cold Storage Dashboard subtitle "Real-time temperature monitoring & compliance" uses `&` ampersand in running prose. v1 §6 prose rule says spell out "and" in UI text; reserve `&` for brand/logo cases. | Low | Change to "Real-time temperature monitoring and compliance". |
| D148 | Notification banner pattern — **NEW** | Cold Storage Dashboard shows a green full-width success banner ("System Status: Online · Last update: 4/24/2026, 8:53:49 AM") with leading checkmark icon. First instance of a page-level status banner. | — (pattern) | Codify as "page status banner" variant of Carbon InlineNotification. |
| D149 | Locale-dependent date format leaks into UI | "Last update: 4/24/2026, 8:53:49 AM" — US `M/D/YYYY, h:mm:ss A` format hard-coded in a multi-locale app (FR/SW/AR/PT/ES all supported). Users in other locales will see the wrong format. | **High** (i18n) | Use `Intl.DateTimeFormat(locale)` or ISO 8601 (`2026-04-24 08:53:49`). |
| D150 | "All Status" dropdown English | Cold Storage filter dropdown placeholder "All Status" — should be "All statuses". Also "All Device Types" is valid but inconsistent style with "All Status". | Low | Fix pluralization: "All statuses". |
| D151 | Triple-nested tabs | Cold Storage Monitoring > Settings > Device Management: sidenav submenu (level 1) → in-page tabs Dashboard/Corrective Actions/.../Settings (level 2) → nested in-page tabs Device Management/Temperature Thresholds/Alert Settings/System Settings (level 3). Same information architecture, three different navigation affordances. Users lose track of where they are. | **High** (architectural) | Flatten. Per user memory, use sidenav submenus at all levels; retire in-page tabs. |
| D152 | Page title doesn't update with inner tab | Cold Storage Dashboard — when user clicks "Corrective Actions" inner tab, the page `<h1>` still reads "Cold Storage Dashboard" and subtitle still says "Real-time temperature monitoring & compliance" though the body content is unrelated. | Medium | Update title/subtitle on tab switch, OR commit to sidenav submenu pattern so each page has its own h1. |
| D153 | Form-label casing mixed in same form | Cold Storage > Reports: "Report Type" (Title Case) / "Freezer" / "Export Format" (Title Case) but "Start date" / "End date" (sentence case). Same form, two casings. | **High** | Sentence case everywhere: "Report type", "Freezer", "Export format". |
| D154 | Date input placeholder US-locale hard-coded | Date input shows placeholder "mm/dd/yyyy" regardless of the selected app locale. Same issue as D149. | **High** (i18n) | Use locale-aware placeholder or switch to ISO "yyyy-mm-dd". |
| D155 | Icon-prefixed heading pattern | Cold Storage Settings section heading "⚙ System Configuration" renders with a gear icon to the left of the heading text. First heading-level icon; tile-level icons are D111. | — (pattern) | Document as canonical "iconified section heading" pattern — decide if it's reserved for settings. |
| D156 | Add-button label drift across Storage module | Variants observed in the Storage + Sample Shipment modules: "Add +" (Storage list pages), "Add New Device" (Cold Storage Settings), "Add New Action" (Cold Storage > Corrective Actions), "Create New Box" (Sample Shipment), "+ Create Box" (Sample Shipment tab label). Five copy patterns for the same affordance in one area. | Medium | Pick one: recommend "Add [noun]" (no "new") + primary blue + leading `+` icon. |
| D157 | Sample Shipment tab icons | Sample Shipment in-page tabs have icon prefixes ("📊 Dashboard / ➕ Create Box / ⬇ Receive Box / 📄 Reports / ⚙ Settings") while Cold Storage tabs are text-only ("Dashboard / Corrective Actions / …"). Two in-page tab styles in the same sidenav cluster. | Medium | Pick one — recommend text-only to match Carbon's default. |
| D158 | Shipment stat-tile 5th variant — left-border + ALL CAPS | Shipment Dashboard tiles use a thin left color border + ALL CAPS label ("IN TRANSIT / DELIVERED / RECONCILED / TOTAL SAMPLES") with value above label (value-first layout). Every other stat-tile family is label-first. | **High** | Consolidate into one stat-tile family. Likely a 5-variant problem now (Dashboard, Alerts, EQA, Cold Storage, Shipment). |
| D159 | Nested Carbon Tabs inside in-page tabs | Sample Shipment > Dashboard tab has ANOTHER level of in-page tabs: "Shipment Boxes | Unassigned Samples 0". That's sidenav submenu → tab row → tab row. Same pattern concern as D151 but with a count badge. | **High** | Same architectural flatten. |
| D160 | Count-badge on tab label | "Unassigned Samples 0" tab has an inline pill showing "0". Good pattern when it's `>0`; showing "0" is visual noise. | Low | Hide badge when count is zero. |
| D161 | Filter label casing "Filter by State" etc. | Sample Shipment filter labels "Filter by State", "Filter by Facility", "From Date", "To Date" — Title Case. Elsewhere (Alerts, Cold Storage) filter labels are one word in Title Case ("Status / Severity / Freezer / Time Range"). No consistent label pattern. | Medium | Sentence case: "State", "Facility", "From date", "To date". |
| D162 | Breadcrumb trailing slash (again) | `/SampleShipment/boxes` breadcrumb "Home / Sample Shipment /" — trailing slash before the sub-level. Same D81 pattern. | Low | Batch-fix. |
| D163 | Workplan subview titles Title Case | Workplan > By Panel / By Unit / By Priority render titles "Workplan By Panel", "Workplan By Unit", "Workplan By Priority" — Title Case instead of sentence case. | Medium | Sentence case: "Workplan by panel". |
| D164 | URL-path ↔ label mismatch (Workplan) | Sidenav label "By Unit" but URL path `/WorkPlanByTestSection?type=`; sidenav label "By Test Type" but URL path uses `test` query string. Path name "TestSection" never appears in UI. | Medium | Pick one term. Route and label should match the domain concept. |
| D165 | Label-fragment pattern on Workplan subview headers | Subview search header renders two labels on one baseline separated by whitespace: "Search By  Panel Type", "Search By  Unit Type", "Search By  Priority". Reads like an inline micro-title but is two labels stuck together. | Medium | Either "Search by panel type" (one label) or split into a section title + field label. |
| D166 | Redundant dropdown labels (Workplan) | Workplan subviews show "Select Panel Type" placeholder, AND "Panel Type" helper label under the dropdown, AND "Search By  Panel Type" heading above — three restatements of the same field identity. | Medium | Keep one: field label "Panel type" with placeholder "Select a panel type". |
| D167 | Notifications bell missing on Workplan subviews | Dashboard + most pages show the notifications bell at top-right. Workplan By Priority screenshot has only the search icon, no bell. Inconsistent header chrome. | Medium | Standardize header chrome — bell + search always present when authenticated. |
| D168 | Breadcrumb shows version number as sole crumb | On Workplan subviews the breadcrumb is "Home / 3.2.1.6" — the version string appears where a page crumb should be. Users see "Home / 3.2.1.6" instead of "Home / Workplan / By panel". Same root cause as D130 but reinforced across Workplan. | **High** | Breadcrumb must show real hierarchy; version belongs in footer or About. |
| D169 | Sidenav label ↔ page title mismatch (Generic Sample > Create Order) | Sidenav says "Create Order"; page title says "Receive Sample"; URL path is `/GenericSample/Order`. Three different names for the same screen. | **High** | Pick one — recommend "Receive sample" everywhere (sidenav, title, route alias). |
| D170 | Within-form label casing mix (Create Order) | On the same form: "Sample Type", "Quantity", "Sample Unit Of Measure", "Collector", "Collection Date", "Collection Time" are Title Case, but "Order labels" and "Specimen labels sample 1" are sentence case. Strongest evidence yet that label casing is not enforced. | **High** | Sentence case everything per v1; one label rendered twice in the form. |
| D171 | Incorrect Title Case: "Sample Unit Of Measure" | Prepositions should be lowercase in Title Case. Reads as "Sample Unit Of Measure" with capitalized "Of". | Medium | If keeping Title Case, fix to "Sample Unit of Measure"; per v1 convert all to sentence case: "Sample unit of measure". |
| D172 | Ambiguous field label "From" | Label is literally "From" with no clarifier. Could mean "From date", "From location", "From organization". No placeholder, no helper text. | Medium | Disambiguate ("From organization" or similar). |
| D173 | Self-referential placeholder ("Click 'Generate Lab Number' to create") | Lab Number placeholder text says `Click 'Generate Lab Number' to create`. Uses single quotes to reference a literal button copy; if button text changes the placeholder silently goes stale. | Medium | Replace with a generic hint ("Auto-generated") or auto-populate on load. |
| D174 | EU date placeholder `dd/mm/yyyy` on Create Order | Collection Date uses DD/MM/YYYY placeholder while other dashboards leak US MM/DD/YYYY (D147). Two locale conventions are coexisting. | **High** | Lock to ISO 8601 or to active-locale format everywhere. |
| D175 | Split time input: two dropdowns labeled "hh" and "mm" | Collection Time rendered as two side-by-side dropdowns with placeholders `hh` and `mm`. Lowercase placeholders, no real time-picker. | Medium | Use a single time picker; placeholder should be `HH:MM` or real digits. |
| D176 | "Running total: 2" — informal meta copy | Below the dynamic label-quantity fields, the app shows "Running total: 2" as small body text. Informal and unique to this page. | Low | Promote to an inline totals pattern (bold number + label). |
| D177 | Multiple H2 peers, no H1 for page | DOM audit: `H5` for the "Test LIMS" logo area, no `H1` for the page at all, page title "Receive Sample" and every section heading ("Notebook Selection (Optional)", "Sample Information", "Label quantities", "Additional Information") are all `H2`. Accessibility + semantics: no document outline. | **High** | Page title becomes `H1`, section headings become `H2`. |
| D178 | "Notebook" collocated label casing | Section heading "Notebook Selection (Optional)" — Title Case with inline "(Optional)". Meanwhile field label is "Select Notebook" (Title Case). Not aligned with v1 sentence-case convention and the (Optional) convention isn't defined. | Medium | "Notebook selection — optional" or a "Optional" tag element next to heading. |
| D179 | Idle timeout dialog heading "Still There?" | Dialog H2 is "Still There?" — Title Case interrogative. Chat-like voice in a security-timeout dialog. | Low | Align with other system dialogs: "Session about to expire" or similar. |
| D180 | Import Samples: title ≠ sidenav label | Sidenav "Import Samples"; page title "Import" (one word). Breadcrumb "Home / Generic Sample / Import /". | Medium | Title "Import samples" to match sidenav. |
| D181 | Disabled action buttons appear as ghost pills | On Import page, "Validate" and "Import" buttons when disabled render as flat light-gray fills with gray text and no border — read as placeholders rather than disabled primaries. | Medium | Use Carbon disabled primary styling (reduced opacity retained primary shape) so state is clear. |
| D182 | Import helper text uses comma-separated extensions | "Upload CSV or Excel file (.csv, .xlsx, .xls)" — inline parens with 3 comma-separated extensions. Other upload patterns in app aren't standardized. | Low | One "Allowed file types" label + pill list, or helper "Allowed: CSV, Excel (.xlsx, .xls)". |
| D183 | Sample Management search empty state missing | The only content on Sample Management is a search input. No illustration, no "Start by searching…" hint, no recent searches. Empty state gap. | Medium | Standard empty state with icon + one-line hint (same pattern gap flagged in Alerts D138). |
| D184 | Sample Management search placeholder ends with ellipsis | `Enter accession number to search...` — uses three dots instead of Unicode `…`. Inconsistent with other placeholders. | Low | Prefer `…` and sentence case without trailing period/ellipsis where possible. |
| D185 | Analyzer instances rendered directly as sidenav items + translation IDs | Sidenav contains concrete instrument names as items: "Cepheid GeneXpert (ASTM Mode)", "Mindray BC-5380", "QuantStudio 5", "QuantStudio 7". Each name is also used as a `FormattedMessage` id and fires `MISSING_TRANSLATION` in console ("using id as fallback"). Analyzer instances shouldn't be navigation items and their names shouldn't be i18n keys. | **High** | Promote "Analyzer instances" as a page; generate nav entries from data with stable numeric ids, not display strings. |
| D186 | Duplicate instrument entries in Analyzers sidenav | Same 4 instrument names appear twice consecutively under Analyzers. | **High** | De-duplicate — same root cause as D185. |
| D187 | Non-Conform submenu casing inconsistency | "All NCEs", "Report Non-Conforming Event", "View New Non-Conforming Events" — Title Case; "Corrective actions" — sentence case. Same level, same sub-menu, three styles. | **High** | Sentence case, pick one: "All non-conforming events / Report event / View new events / Corrective actions". |
| D188 | "Non-Conform" vs "Non Conformity" vs "Non-conformity" (three spellings) | Main sidenav group "Non-Conform" (no "-ity"); Reports item "Non Conformity Reports" (no hyphen); another item "Non-conformity notification" (hyphen, sentence case). Three different spellings of the same domain word in one nav. | **High** | Pick one canonical term ("Non-conformity" is WHO-aligned); apply globally including URL paths. |
| D189 | Results submenu: "By Range of Order numbers" vs "By Range of Order Numbers" | The exact same concept is listed twice under different Results groups with different casings on "Numbers/numbers". | **High** | Consolidate; single label with sentence case "By range of order numbers". |
| D190 | Results submenu exposes site-specific labels | Items include "EID Version 1", "EID Version 2", "VL", "VL Version Nationale" (French phrase in English UI!), "Indicator", "Section Performance", "Delayed Validation", "Collected ARV Patient Report", "Associated Patient Report". These look like country-specific reports hard-coded into the global nav. | **High** | Country-specific items should be feature-flagged or moved to a "Country reports" subgroup. |
| D191 | French leaked in English UI | Item labeled "VL Version Nationale" renders as-is regardless of locale. Confirms French strings are being concatenated into English labels. | **High** | All strings through i18n; "Nationale" gets its own message id. |
| D192 | "Labno" compressed term | Sidenav item "By Labno" — compressed form of "Lab number". | Medium | Use "By lab number" consistently (URL can retain `labno`). |
| D193 | Ampersand usage in sidenav ("Results & Analysis", "Label & Store") | Two sidenav items use "&" instead of "and" — consistent with Cold Storage D143 drift. | Medium | Spell "and" in all sidenav labels unless the brand requires the ampersand. |
| D194 | Dashboard tile subtitle duplicate "Total Orders Completed Today" | Dashboard tile "Partially Completed Today" has subtitle "Total Orders Completed Today" — identical to the subtitle of the "Orders Completed Today" tile. Copy-paste bug. | **High** | Subtitle for Partially Completed should read "Orders partially completed today". |
| D195 | Dashboard tile label / subtitle verb tense + casing drift | Tile "Orders Entered By Users" (Title Case with "By") subtitle "Entered by users Today" (sentence case, "Today" capitalized). Same tile flips casing conventions. | **High** | One rule: sentence case throughout, active verb phrase. |
| D196 | Dashboard tile label "Average Turn Around time" (partial casing) | Label has Title Case for "Turn Around" but lowercase "time". Same tile's subtitle "Reception to Validation" uses Title Case throughout. | Medium | Fix to "Average turnaround time" (one word preferred per Oxford); subtitle "Reception to validation". |
| D197 | "UnPrinted Results" medial capital | Tile label and subtitle both use the nonstandard medial capital "UnPrinted". Style rule: no medial caps in domain terms. | Medium | "Unprinted results". |
| D198 | Analyzers submenu two-level with nested "Quality Control" | Analyzers submenu renders two flat children (Analyzers List, Error Dashboard, Analyzer Types) THEN a nested "Quality Control" group with (QC Dashboard, Rule Configuration, Control Lots). Mixed flat + nested pattern within one submenu. | Medium | Flatten or fully group. |
| D199 | Help submenu mixes navigation + forms | Help submenu has "User Manual", "Process Documentation", "VL Form", "DBS Form". "VL Form" and "DBS Form" are probably PDFs, not help pages — mixes doc navigation with downloadable forms. | Medium | Split: Help resources vs Downloadable forms. |
| D200 | Long sidenav without search or collapse-all | Dashboard body text enumeration shows ~30 top-level entries + ~3–5 children each = 100+ nav items. No search, no collapse-all, no persistent section state. | **High** | Add nav search + remember expanded groups per session. |

---

## Change log

- **2026-04-23** — Inventory skeleton created. 22 pattern categories seeded. Walkthrough not yet started.
- **2026-04-23** — Stage 2A depth pass: Dashboard + Orders (Add Order wizard step 1, Modify Order, Batch Order Entry, Incoming Orders). 10 pattern categories filled. New category #23 added (Dashboard tiles). 35 drift items logged (D01–D35). 3 High-severity items: D01 (broken sort a11y), D14 (duplicate nav entry), D31 (i18n copy bug), D34 (typo).
