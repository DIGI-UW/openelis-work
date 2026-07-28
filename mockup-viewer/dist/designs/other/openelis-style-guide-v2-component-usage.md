# OpenELIS Global — Style Guide v2 Component Usage

> **Status:** Published v2.3 (2026-07-28) · **Owner:** Casey Iiams-Hauser · **Audience:** Developers + designers contributing to OpenELIS Global
> **Companion to:** [v1 Foundations](openelis-style-guide-v1-foundations.md) (tokens, typography, color, forms, voice & tone).
> **Derived from:** the Stage 2A patterns-inventory walkthrough (2026-04-23/24, 214 drift findings) — [v2 Patterns Inventory](openelis-style-guide-v2-patterns-inventory.md) — plus two codebase evidence passes (2026-07-28, see [Evidence appendix](#evidence-appendix)).
> **Scope note:** Governs the React UI (`@carbon/react`, `cds--` prefix) only. The legacy JSP UI is not governed by this guide (§C5).

## The one rule

**Follow [Carbon](https://carbondesignsystem.com/) upstream by default.** If a component or behavior is not on this page, do exactly what the Carbon documentation says — component choice, props, sizes, copy, keyboard behavior, all of it. Start from Carbon's [component docs](https://carbondesignsystem.com/components/overview/) and [pattern library](https://carbondesignsystem.com/patterns/overview/); this page documents **only where OpenELIS diverges from, extends, or pins down Carbon**. Re-documenting Carbon here is a defect: it drifts as Carbon evolves and doubles the maintenance surface.

**Version pin:** the shipped stack is `@carbon/react ^1.15.0` (= Carbon Design System **v11** — current v11 docs apply, but we're ~65 minor releases behind latest 1.x), `@carbon/themes 11.10.0`, `@carbon/icons-react ^11.17.0`, `@carbon/charts ^1.27.2`, on **React 17** — with legacy `carbon-components` v10 still installed for older pages. Before using a component or prop from the live docs, confirm it exists in the pinned version. Carbon upgrades are a roadmap item, not something this page can wish into place.

So, explicitly: [modals](https://carbondesignsystem.com/components/modal/usage/), [notifications](https://carbondesignsystem.com/components/notification/usage/), [loading states](https://carbondesignsystem.com/patterns/loading-pattern/), [skeletons](https://carbondesignsystem.com/components/skeleton/usage/), [combo boxes](https://carbondesignsystem.com/components/dropdown/usage/), [date pickers](https://carbondesignsystem.com/components/date-picker/usage/), [forms](https://carbondesignsystem.com/patterns/forms-pattern/), [dialogs](https://carbondesignsystem.com/patterns/dialog-pattern/), [charts](https://carbondesignsystem.com/data-visualization/getting-started/) — all Carbon defaults, no OpenELIS section needed.

Three kinds of entry: **A — Divergences** (we deliberately differ from Carbon), **B — Extensions** (patterns Carbon has no equivalent for, built from Carbon primitives), **C — Pins** (Carbon leaves the choice open; we pin one answer). Decisions awaiting ratification are badged 🔶 and consolidated in the [Ratification register](#ratification-register). Everything else is binding.

Cross-cutting rules live in v1 and are not repeated here: sentence case + keep-list (v1 §8.4), punctuation (§8.5), i18n + `common.*` reuse (§8.6), message archetypes (§8.3), field anatomy and required-marker (§7), WCAG 2.1 AA floor (§10).

### Where do I look?

| You need… | Go to |
|---|---|
| Table of records | [Carbon DataTable](https://carbondesignsystem.com/components/data-table/usage/) + §C1 |
| Pagination | [Carbon Pagination](https://carbondesignsystem.com/components/pagination/usage/) + §C2 |
| Blocking dialog / confirmation | [Carbon Modal](https://carbondesignsystem.com/components/modal/usage/) + [dialog pattern](https://carbondesignsystem.com/patterns/dialog-pattern/) (no local delta) |
| Detail panel beside a list | §B1 slide-over |
| Switching views of a module | §A1 (sidenav, not Tabs) |
| Multi-step create flow | [Carbon ProgressIndicator](https://carbondesignsystem.com/components/progress-indicator/usage/) + §C6 |
| Dates & times | [Carbon DatePicker](https://carbondesignsystem.com/components/date-picker/usage/) + §A2 |
| Search / filters over a list | [Carbon Search](https://carbondesignsystem.com/components/search/usage/) + §C3 |
| Empty / loading states | [Carbon patterns](https://carbondesignsystem.com/patterns/loading-pattern/) + §C4 |
| Status display | [Carbon Tag](https://carbondesignsystem.com/components/tag/usage/) + §C9 |
| Forms | [Carbon forms pattern](https://carbondesignsystem.com/patterns/forms-pattern/) + v1 §7 + §C7 |
| Dashboard KPI tiles | §B5 |
| Reports | §C8 |
| Anything else | Carbon docs, full stop |

---

## A. Divergences from Carbon

### A1. Sidenav submenus instead of Tabs for view navigation

Where Carbon UIs commonly use [Tabs](https://carbondesignsystem.com/components/tabs/usage/) to switch views, OpenELIS does not: **navigating between screens/views of a module uses [UI shell sidenav](https://carbondesignsystem.com/components/UI-shell-left-panel/usage/) submenus**, never in-page tabs.

Two sanctioned exceptions, where the Carbon components are used exactly as Carbon intends:
- [Tabs](https://carbondesignsystem.com/components/tabs/usage/) as an **intra-page filter** over one dataset (Validation's test-section tabs — D50).
- [ContentSwitcher](https://carbondesignsystem.com/components/content-switcher/usage/) for **sub-modes of a single task** (Search for patient / New patient). Use the real component, not two styled buttons (D54).

Sidenav rules: no duplicate labels in a subtree (D14); group by domain; labels match the vocabulary of the page they open (D40).

### A2. 🔶 R2 — Date handling: ISO on the wire, unambiguous display

Today the locale-formatted string (`dd/MM/yyyy` vs `MM/dd/yyyy` per a `DEFAULT_DATE_LOCALE` ternary) **is the wire format** between frontend and backend — and the ternaries are inconsistent across files (frontend tests `== "fr-FR"`, `ObservationProvider.java` tests `"en-US"` and inverts, `DBSearchResultsDAOImpl` swaps branches vs `PatientSearchResults`). Any third locale falls into an unintended else-branch.

The rest of the stack is already unambiguous: the DB stores typed dates (`java.sql.Date`/`Timestamp` via Hibernate mappings), the FHIR layer serializes ISO 8601 per the R4 spec (`DateTimeType` in `FhirTransformServiceImpl`), and several REST DTOs already declare `@JsonFormat(pattern = "yyyy-MM-dd")`. The frontend↔backend JSON hop is the **only** ambiguous link.

**Pin:** ISO 8601 `yyyy-MM-dd` on the wire (extends the existing `@JsonFormat` pattern). **Display:** unambiguous by construction — default clinician-facing display `dd-MMM-yyyy` (e.g. `12-Mar-2026`) per NHS Common User Interface guidance, with all-numeric locale formats available only as deployment config. *Proposed — evidence strong; changes user-visible behavior; needs product + implementer ratification.*

### A3. Dashboard tiles: single visual treatment

Tiles have exactly one treatment — no value-based, position-based, or any other emphasis variant. (Evidence: no such logic exists in `Dashboard.tsx`; the dark tile observed in April (D29) was Carbon `ClickableTile` hover/expanded state. D29 reclassified as a misobservation.) If threshold-based emphasis is ever wanted, it's a feature proposal, not a style default.

### A4. Tile radius

Dashboard tiles use 5px radius — a deliberate exception to Carbon's sharp-corner default, already ratified in v1 §6. Do not extend it to other components. (Note: the evidence pass found the slide-over panel shipping an unsanctioned `border-radius: 10px` — logged as new drift, see §B1.)

---

## B. OpenELIS extensions (no Carbon equivalent)

### B1. Slide-over panels 🟡 *(demoted to provisional — see evidence)*

The v1 §11 utilities (`.slide-over-root`, `.oeui-slideover-x/y`, `.backdrop-blur`) are real but currently serve **exactly one feature**: the header notifications drawer (`notifications/SlideOver.jsx`, consumed only by `layout/Header.jsx`). Shipped geometry: width 90% mobile / **25% desktop** (CSS media query), top offset 53px, right-anchored, close button + centered title header, no footer — and an unsanctioned `border-radius: 10px` (violates v1 §6; new drift item, fix or ratify).

Provisional rule until a second consumer exists and dimensions are ratified: reuse `SlideOver.jsx` for detail/browsing panels beside a list; **boundary with Carbon [Modal](https://carbondesignsystem.com/components/modal/usage/)** stands — blocking decisions and must-complete tasks use `Modal` per Carbon's [dialog pattern](https://carbondesignsystem.com/patterns/dialog-pattern/); browsing/editing context uses the slide-over. Read-only values inside a panel render as Carbon [structured list](https://carbondesignsystem.com/components/structured-list/usage/) or `FormItem` read-only states, not bare `label: value` text (D83). Width/header/footer specs get ratified when the second consumer is built — do not invent them per-feature.

### B2. Workplan grids 🟡 *(provisional — needs a deep-walk before hardening)*

Batch result entry across samples × tests: Carbon [DataTable](https://carbondesignsystem.com/components/data-table/usage/) shell, inline-editable cells (Carbon inputs), sticky header, one Save action per grid, disabled until dirty (D39). Keyboard order row-major.

### B3. Referral queues

Standard tables plus: aliquot numbering displayed as `LABNO.X-Y`; detail opens the B1 slide-over. No bespoke queue UI.

### B4. Barcode-scanning inputs 🟡 *(provisional)*

Dedicated scan-target [TextInput](https://carbondesignsystem.com/components/text-input/usage/), autofocused, accepts scanner-terminated input (Enter suffix), visible manual-entry fallback, feedback via [InlineNotification](https://carbondesignsystem.com/components/notification/usage/).

### B5. Dashboard KPI tiles — `MetricTile`

Carbon [Tile](https://carbondesignsystem.com/components/tile/usage/) with pinned slots: title (sentence case, `heading-compact-02`), subtitle (`label-01`; adds context, never restates the title — D31/D32/D92), value (`display-heading-02`, tabular-nums), optional action icon with tooltip (D33). 3–4 column responsive [grid](https://carbondesignsystem.com/elements/2x-grid/overview/), uniform height, reflows when sidenav opens (D47). States: skeleton loading / inline "No data" + retry on error / plain value — so "0" always means a real zero (D13). Tile click expands in place to the full-width detail view (the shipped `ClickableTile` → `selectedTile` behavior); the expand icon carries a tooltip.

### B6. Page shell composition

Every page renders: [breadcrumb](https://carbondesignsystem.com/components/breadcrumb/usage/) → one `h1` page title (`productive-heading-06`, v1 §4) → optional action cluster top-right (D27 — page-level primary actions live here, not inline with forms). Breadcrumbs: human-readable labels, never route slugs (D43), no trailing separator (D26), no version numbers (D46). Dashboard gets a title too (D28). Header brand slot is deployment-configurable (D65).

**Sidenav visibility is a global user preference** (pin state in `localStorage`, plus viewport breakpoint) — not a per-page layout variant. There is no "focus mode" shell; former proposal R7 was withdrawn after the evidence pass showed the April observation (D48) was the unpinned-drawer preference. Pages must render correctly with the sidenav in either state.

---

## C. Pins (Carbon leaves it open; we don't)

### C1. 🔶 R1 — Table library

Carbon [DataTable](https://carbondesignsystem.com/components/data-table/usage/) exclusively. `react-data-table-component` is deprecated for new code and migrates out — only **4 importing files** (SearchResultForm, Validation, AnalyserResults, GenericSampleResults), none load-bearing: all use Carbon inputs in cells and Carbon `Pagination` outside; the one distinctive feature (expandable rows) has Carbon equivalents in production (`EOrder.jsx`). Retiring it also deletes a Vite CJS-interop hack. **Sequencing:** GSoC TypeScript migration [#3885](https://github.com/DIGI-UW/OpenELIS-Global-2/issues/3885) is actively converting these exact folders — coordinate the table swap with that work to avoid double churn (prior community ask: [#3091](https://github.com/DIGI-UW/OpenELIS-Global-2/issues/3091), closed not-planned). *Proposed — evidence complete, risk low; ready to ratify.* Also pinned: booleans render as [Tag](https://carbondesignsystem.com/components/tag/usage/) or status text, never `Y`/`N` (D68); long headers get width hints or tooltip truncation, never 3-line wraps (D03).

### C2. 🔶 R5 — Pagination mechanism (revised)

[Pagination](https://carbondesignsystem.com/components/pagination/usage/) per Carbon, in the table footer, hidden/disabled when empty (D11). Evidence: the page-size dropdown is a **pure display preference** — every audited view fetches via the backend's own API paging (`&page=`/`startingRecNo`) and slices client-side, so the dropdown never changes network or DB load. Current state: ~50 files hardcode six different defaults (100/30/25/20/10/5) with ~16 distinct option arrays and no shared constant.

**Pin (the mechanism, not a magic number):** one shared frontend `PAGE_SIZES` options constant (`[10, 20, 50, 100]`) and per-view-type defaults declared in one place — work queues (Workplan, Validation, results) keep a high default (100, matching current bench practice); browse/admin lists default 20. Wire the unused backend `page.defaultPageSize` config only if deployments need to vary it. *Proposed — ratify the mechanism now; confirm the queue default with bench users rather than by fiat.*

### C3. Single filter bar

One filter bar above the results area — Carbon [Search](https://carbondesignsystem.com/components/search/usage/) for free text, [Dropdown](https://carbondesignsystem.com/components/dropdown/usage/)/MultiSelect for enums — one Search button, one Clear/Reset. Never two panels with two Search buttons (D08). Scope helper text is its own paragraph, not concatenated into the heading (D09).

### C4. Empty-state tiers

Carbon's [empty-state pattern](https://carbondesignsystem.com/patterns/empty-states-pattern/) applies; our pins: 1. No query yet → headers + one-line prompt. 2. Zero matches → v1 §8.3 archetype (`No <items> found. <Recovery hint>.`) centered in the table body — never a header-only table (D12/D52). 3. Module-level → icon + heading + subtitle + optional CTA.

### C5. Legacy JSP boundary (reworded)

React pages follow this guide. JSP pages (D75) receive **no restyling investment** — this guide does not govern them, and label fixes apply only where strings are shared with React. Whether JSP pages are feature-frozen is a **product roadmap decision outside this guide's authority**; until that's decided, treat JSP surfaces as legacy for styling purposes only. Routes that bounce users into JSP unexpectedly (D212/D213 genus) are defects, not patterns.

### C6. Wizard pins

≥3 dependent steps → wizard with [ProgressIndicator](https://carbondesignsystem.com/components/progress-indicator/usage/), per Carbon. Our pins: final step is `Review`/`Confirm`, never the wizard's own name (D20); step labels short enough not to truncate at default viewport (D19); Back never destroys entered data; Cancel is ghost/tertiary per Carbon's [button hierarchy](https://carbondesignsystem.com/components/button/usage/) — never inverted (D35).

### C7. Forms layout pins

Carbon's [form pattern](https://carbondesignsystem.com/patterns/forms-pattern/) applies; our pins: [Grid](https://carbondesignsystem.com/elements/2x-grid/overview/) 2 columns desktop (single below `md`), 8px between fields, 16px between rows. Section card: white on `$layer-01`, 24px padding, `heading-03` sentence-case heading (never ALL CAPS — D04).

### C8. 🔶 R8 — Report archetypes

The original "one template for all reports" proposal failed the evidence pass: ~30 report types (not 11) across 7 routes; ~26 are parameter forms whose output is a backend Jasper PDF in a new tab (no in-page output to template); filter forms have genuinely different interaction shapes (accordion multi-search, checkbox matrices, accession lookup). Revised pin, grounded in the scaffolding that already exists (`reports/common/`):

1. **Archetype A — Print-report form** (~26 reports): page header → parameter form from shared components (`ReportByDate`, `ReportByLabNo`, `ReportByID`, `PatientStatusReport`) and primitives (`CustomDatePicker`, `CustomLabNumberInput`, site `AutoComplete`, `SearchPatientForm`) → one terse Generate action → opens `ReportPrint`.
2. **Archetype B — Interactive report** (TAT, Audit Trail): filter bar + active-filter tags + in-page tabs/tables + export menu. TAT's structure is canonical.
3. **Archetype C — One config-driven report registry**: consolidate the three duplicated dispatchers into a single registry (report ID → form component + endpoint). Prevents real bugs — the evidence pass found `indicatorCDILNSPHIV` wired to the wrong report in `routine/Index.jsx`. **Sequencing:** the reports folder is in GSoC TS-migration scope ([#3885](https://github.com/DIGI-UW/OpenELIS-Global-2/issues/3885)) — land the registry consolidation with or after it, not against it.

Report URLs use neutral IDs; deployment variants live in config (D60). *Proposed — ratify the three-archetype split.*

### C9. Status → Tag mapping

One status → one Carbon [Tag](https://carbondesignsystem.com/components/tag/usage/) kind everywhere it appears, using the v1 §9.3 kind table and the v1 §8.2 status vocabulary. Never color-only. This mapping table grows here as modules are audited.

### C10. Icon semantics

[Carbon icons](https://carbondesignsystem.com/elements/icons/library/) only; our pin: one icon per semantic role app-wide (edit, delete, view, expand, print, download…). Role→icon inventory is a v2.1 follow-up. No decorative one-off icons per row (D71).

---

## Ratification register

| # | Decision | Recommendation | Evidence | Status |
|---|---|---|---|---|
| R1 | Table library | Carbon `DataTable` only; retire `react-data-table-component` | 4 files, nothing load-bearing; Carbon expandable-rows precedent in-repo; deletes a Vite hack; GSoC #3885 touching the same files now | 🔶 Ready to ratify — sequence with #3885 |
| R2 | Date handling | ISO 8601 wire; `dd-MMM-yyyy` clinician display default | FHIR layer + DB already unambiguous; wire is the lone locale-string hop; ternaries provably inconsistent across 4 files; NHS CUI display guidance | 🔶 Ready for review — behavior change, needs implementers |
| R3 | Tile emphasis | *(resolved)* Single treatment — no emphasis variant exists | No conditional styling in `Dashboard.tsx` (current + April refs); D29 was hover/expanded state | ✅ Ratified by evidence — no code change |
| R5 | Pagination | Shared `PAGE_SIZES` constant + per-view-type defaults (queues stay 100; browse/admin 20) | Page size is display-only (client-side slice; separate backend API paging); ~50 files, six defaults, no constant | 🔶 Ratify mechanism; confirm queue default with bench users |
| R7 | Focus-mode shell | **Withdrawn** | No focus mode exists; sidenav is a global pin preference (`localStorage` + breakpoint) | ❌ Withdrawn — D48 reclassified |
| R8 | Report archetypes | 3 archetypes (print form / interactive / registry) + shared primitives | ~30 types; ~26 output Jasper PDFs; TAT + AuditTrail genuinely interactive; dispatcher copy-paste caused a live wrong-report bug | 🔶 Ratify archetype split — sequence registry with #3885 |
| — | Slide-over geometry (B1) | Ratify dimensions when a second consumer is built; fix or sanction the 10px radius | Utilities serve one feature (notifications drawer); 90%/25% width via CSS; `border-radius:10px` violates v1 §6 | 🟡 Provisional |

Ratification path: raise in design review → decision recorded here → Jira cleanup stories reference the section anchor.

## Evidence appendix

**Pass 1 (2026-07-28) and Pass 2 (2026-07-28), against `DIGI-UW/OpenELIS-Global-2` develop:**

- **Versions:** `frontend/package.json`: `@carbon/react ^1.15.0` (Carbon v11; latest 1.x is ~1.80+), `@carbon/themes 11.10.0`, `@carbon/icons-react ^11.17.0`, `@carbon/charts ^1.27.2`, `carbon-components ^10.58.12` (legacy v10 still installed), `react ^17.0.2`.
- **R1:** RDT imported in exactly 4 files (`resultPage/SearchResultForm.jsx`, `validation/Validation.jsx`, `analyserResults/AnalyserResults.jsx`, `genericSample/GenericSampleResults.jsx`) vs 122 files matching Carbon `DataTable`. All four slice data manually and render Carbon `Pagination`; none use RDT pagination, `selectableRows`, or `conditionalRowStyles`; expandable rows has Carbon precedent (`EOrder.jsx`, `FreezerMonitoringDashboard.jsx`). `vite.config.ts` carries a CJS alias solely for RDT. Prior art: #3091 (closed not-planned); overlap: GSoC #3885 (Week 9 TS migration of resultPage/analyserResults/workplan/validation/reports) and #3821.
- **R2:** wire = locale string (`CustomDatePicker.jsx` `DEFAULT_DATE_LOCALE == "fr-FR" ? "d/m/Y" : "m/d/Y"`, formatted string into form state/payloads; backend re-parses via `CustomDateValidator`). Ternaries inconsistent: `ObservationProvider.java` tests `"en-US"` (inverted); `DBSearchResultsDAOImpl` vs `PatientSearchResults` swap branches. Storage already typed (`Sample.hbm.xml`: `enteredDate` `java.sql.Date`, `receivedTimestamp` `Timestamp`). FHIR already ISO (`FhirTransformServiceImpl`: `setCollected(new DateTimeType(collectionDate))`; FHIR R4 date = ISO 8601 subset). ISO REST precedent: `PathologyDisplayItem`/`CytologyDisplayItem`/`ImmunohistochemistryDisplayItem` `@JsonFormat(pattern = "yyyy-MM-dd")`; `SystemRestController` emits `ISO_LOCAL_DATE`; `PatientSearchRestController` parses `ISO_DATE`. Display standards: NHS CUI (ISB 1500-1508) specifies `dd-MMM-yyyy` for clinician display; FDA 21 CFR 801.18 / ISO 15223-1 mandate ISO 8601 on device labels; ~13 components hardcode `dd/mm/yyyy` ignoring config.
- **R3:** `home/Dashboard.tsx` renders every tile as `<ClickableTile className="dashboard-tile">`, single CSS rule `#f4f4f4`; no conditional styling in current code or pre-redesign April ref (`1a1e293d`, pre-#3511/#3516); click swaps grid for one full-width detail `Tile` (`selectedTile`).
- **R5:** page-size dropdown is display-only — Workplan/Results fetch via `getFromOpenElisServer(url + "&page=" + n)` (backend-chunked) then `slice((page-1)*pageSize, …)` client-side; Validation slices an already-loaded list; UserManagement uses `startingRecNo` server windowing plus a client slice. Defaults: 100 ×13 files (queues/dashboards), 25, 20, 10, 30, 5; only `OrderDashboard.jsx` has a local `PAGE_SIZES`; backend `page.defaultPageSize` (`DisplayListController.java`) has no frontend consumer.
- **R7:** `App.jsx` wraps every authenticated route in `<Layout>`; `Layout.jsx`: `navPersistent = isDesktop && navPinned`, `navPinned` from `localStorage("sideNavPinned")`. "Ready For Validation" is `handleMaximizeClick` state inside Home, not a route.
- **R8:** 7 routes fan into ~30 report types via `?type=…&report=…` mapped to ~10 components; ~26 submit `window.open(serverBaseUrl + "/ReportPrint?report=…")` (Jasper PDF); shared archetypes already in `reports/common/` (`ReportByDate` ~12, `ReportByLabNo` ~10, `ReportByID`, `ReportByDateCSV`, `PatientStatusReport`); `PatientStatusReport.jsx` (accordion multi-search), `StatisticsReport.jsx` (checkbox matrix), `TATReport.jsx` (tabbed dashboard) break the single-bar model; `routine/Index.jsx` wires `indicatorCDILNSPHIV` → `indicatorHaitiLNSPAllTests` (live bug).
- **B1:** `.slide-over-panel` in `index.css`: `width: 90%; border-radius: 10px; top: 53px` with `@media (min-width: 768px) { width: 25%; }`; `.oeui-slideover-x/y` just fill the panel. Sole consumer chain: `notifications/SlideOver.jsx` → `layout/Header.jsx` (notifications drawer). 10px radius is unsanctioned per v1 §6.
- **Governance gap:** `CONTRIBUTING.md` links the constitution, PR tips, and AGENTS.md but has **no pointer to either style guide** — contributors can't find these rules from the repo.

## Changelog

- **2026-07-28 (v2.3)** — Second evidence pass + critique fixes. Carbon version pin added to the one rule; "Where do I look?" routing table restored; B1 demoted to provisional (single consumer; shipped geometry documented; 10px radius flagged as new drift); R5 revised to mechanism-pin with per-view-type defaults (page size proven display-only); C5 reworded (restyling freeze only — feature freeze is a roadmap call); R1/R8 sequenced against GSoC #3885; R2 strengthened (FHIR/DB/DTO ISO precedent, inconsistent ternaries, NHS CUI display guidance → `dd-MMM-yyyy` clinician display default). Noted missing style-guide pointer in CONTRIBUTING.md.
- **2026-07-28 (v2.2)** — First evidence pass. R1/R2/R5 confirmed; R3 resolved; R7 withdrawn; R8 rewritten as three archetypes. Evidence appendix added.
- **2026-07-28 (v2.1)** — Restructured to delta-only with Carbon links throughout.
- **2026-07-28 (v2.0)** — Initial publication from the Stage 2A patterns inventory.

---

_Questions or proposed changes: file a Jira story in `OG` and link the section anchor. If you find the app diverging from Carbon in a way this page doesn't sanction, that's drift — file it._
