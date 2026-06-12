# OpenELIS Dashboards & Home Redesign — Functional Requirements Specification

**Version:** 1.1 (Draft — post-/analyze)
**Date:** 2026-06-05
**Status:** Draft for review; /analyze findings F-01 through F-21 applied
**Author:** Casey Iiams-Hauser
**Module:** Home page + new Dashboards group (Management Overview)
**Epic shape:** One epic, two surfaces (Home + Management Dashboard), shared data foundation
**Mockups:** `home-page-redesign-preview.html`, `management-dashboard-preview.html`
**Ideas backlog dependency:** Equipment Maintenance & Service Tracking (separate epic, downstream consumer relationship)

---

## 1. Lab Context

### 1.1 Current State

A bench tech logs in to OpenELIS and lands on a home page with ten KPI tiles arranged in a fixed grid: `In Progress`, `Ready for Validation`, `Orders Completed Today`, `Partially Completed Today`, `Orders Entered by Users`, `Orders Rejected`, `Unprinted Results`, `Electronic Orders`, `Average Turn Around time`, `Delayed Turn Around (>96h)`. On a quiet morning, most read "0." Two tiles share the same caption ("Total Orders Completed Today") with different headings, which appears to be a copy bug. The tiles are clickable via a small expand arrow but most users don't notice and instead navigate to specific pages via the side menu.

To find what they actually need to work on, a tech opens the Workplan or the validation queue and filters manually. A validator does the same. There is no concept on the home page of "what is waiting on you" — every tile is a global count.

Lab directors do not have a single screen that summarizes how the lab is performing. To prepare a monthly stakeholder briefing or a Ministry of Health (MoH) report, the director compiles data from the Reports module (canned reports for **TAT** — Turnaround Time, the elapsed time from sample receipt to result release — plus rejection rate and workload), the QI Dashboard under Quality Assurance (**QI** — Quality Indicators, OpenELIS's umbrella term for the KPIs the lab tracks: rejection rate, amendment rate, TAT compliance, and the NCE Pulse, where **NCE** — Non-Conforming Event — is OpenELIS's catalog of quality deviations that records sample rejections, retest requests, and other non-conformities), occasional direct database queries, and outside-OpenELIS spreadsheets. For public health surveillance (TB / HIV / Malaria / AMR — Antimicrobial Resistance), the data sits in OpenELIS but the *aggregated view* — positivity rates over time, antibiogram-style resistance tables — does not exist as a screen. It's an Excel pivot table off a CSV export, then a paper or DHIS2 submission. (DHIS2 — District Health Information Software, the platform most Ministries of Health use for surveillance reporting.)

Equipment status is invisible. The analyzer integration receives results from instruments like the Sysmex XN-550 or the GeneXpert IV via **HL7** (Health Level 7, the clinical messaging standard for lab results) or **ASTM** (American Society for Testing and Materials, the message format used by many older lab analyzers) messages or shared file watchers, but the only signal a tech gets that an analyzer is offline is the absence of results — which they typically notice 30–60 minutes after the fact. Maintenance and calibration are tracked on paper or in side spreadsheets, not in OpenELIS.

Reagent stock lives in the Inventory module, separately from the operational pages. Lab managers check stock manually, or notice depletion when reagents run out mid-shift.

The lab's internal quality streams are tracked in OpenELIS but don't surface on the home page: **QC** (Quality Control — internal verification using known-value control samples, with violations evaluated against Westgard rules like 1₂ₛ, 1₃ₛ, 2₂ₛ, R₄ₛ), **EQA** (External Quality Assessment — blinded panels labs run to verify their results against peer labs), and NCE all roll up into the QI rollup the QI Dashboard surfaces, but a tech glancing at the home page has no signal of QC failures or pending EQA rounds.

### 1.2 Pain

The home page is the most-visited screen in OpenELIS and it does not answer the question every user opens it to ask: *what should I do next?* Ten counters do not surface action items, do not show trends, do not call out exceptions, and do not personalize. A validator with twelve results waiting for technical acceptance sees no signal of that on the home page and has to remember to navigate elsewhere. A critical lab result — a potassium of 7.4 mmol/L (life-threatening) on a sample completed an hour ago — is not surfaced. The lab finds out about it when the requesting clinician calls.

Lab directors lose hours each month preparing stakeholder briefings because the data is not aggregated in any one place. A recurring story from CPHL Port Moresby and similar public health labs: monthly MoH reports take 4–6 hours of manual compilation, of which 1–2 hours are just pulling TB / HIV / Malaria / AMR positivity figures from raw exports. AMR antibiograms — the standard table of "% of organism X resistant to antibiotic Y" that infection control committees and prescribers rely on — are not surfaced anywhere in OpenELIS today; they are reconstructed manually from culture results.

The 96-hour "delayed" threshold on the current home page is a single lab-wide constant. A hemoglobin result at 95 hours is reported as on-time; a microbiology culture at 97 hours is reported as delayed; the threshold has no relationship to the type of test. Techs and validators learn to ignore the indicator.

Equipment failures surface late. When the Roche cobas 4800 goes offline at 14:00 on a Tuesday, the first signal is a tech noticing the HIV viral load queue stopped moving — usually after the day's results were supposed to be released. Storage temperature breaches (freezer dropping out of range overnight) are not surfaced on the home page even though freezer monitoring exists in OpenELIS and persists threshold violations as `Alert` records. A breached freezer sample can be silently degrading for hours.

Referrals out to reference labs are sent and then forgotten. The `ReferralStatus` enum on the `Referral` entity has five values (`CREATED, SENT, RECEIVED, FINISHED, CANCELED`) but only three are written by code today; `SENT` and `FINISHED` are dead values. A sample sent to Mwanza Reference Lab eight days ago has no visible "still out there" indicator. A validator notices when the clinician calls asking for the result.

### 1.3 What Changes

A bench tech logs in. The home page greets them by name: *"Good morning, Sarah. 4 results to enter in Hematology, lab tracking on TAT (median 14h)."* Below the greeting, a single row card called *My Queue* lists the 3–5 things waiting on Sarah: *Results to enter — 4 · Results to validate — All caught up · Orders I started today — 2 · Referrals from my sections — none open*. Each row is one click to the relevant worklist. Below My Queue, a *Lab Pulse* section shows two or three small charts (throughput today vs. weekly average, median TAT trend over 14 days). Below that, an *Attention* feed lists exceptions in plain rows: *2 critical results today, awaiting · Freezer FRZ-02 out of range 28 min · 12 rejections today (reception · lab · validator counts) · ORD-1087 delayed >96h, awaiting referral return.* Below that, six *Quick Actions* tiles for high-frequency tasks. Below that, a collapsed *Lab Snapshot* for shift handover.

If Sarah works at a small district clinic that has no referrals out, no freezer monitoring, no EQA program (EQA — External Quality Assessment, the system labs use to verify their results against blinded panels), then the corresponding rows and cards quietly disappear. The home page stays calm and honest about what the lab uses.

A lab director — Dr. Joseph K at CPHL — opens the Management Dashboard from a new top-level `Dashboards` group in the sidenav. Five KPI tiles span the top: total samples last 30 days (4,247, ↑ 8.4% vs. prior), median TAT (26h, ↓ 5h), on-time completion (91.2%, target 90%), rejection rate (1.8%, target <2%), QC pass rate (96.4%). Below them, a *Disease Surveillance* grid with four cards — one each for TB, HIV, Malaria, and AMR — plus a full antibiogram heatmap rendering percent resistance for the five most-isolated organisms across nine common antibiotics, computed from real Antimicrobial Susceptibility Testing (AST) data entered through the AMR module shipping in OpenELIS 2.4. Below that, workload-by-section as a 30-day stacked-area chart paired with TAT-by-section as a sortable table. Below that, a composite quality score (92) with the four contributing components — QC (Quality Control) pass rate, EQA performance, NCE inverse, amendment rate inverse — and their configurable weights. Below that, an equipment-activity grid showing which analyzers are *Active*, *Quiet*, or *No activity* based on when each last produced a result, plus sample counts in the current period. Below that, current reagent stock with reorder alerts. At the bottom, an Export bar: PDF for board materials, CSV for ad-hoc analysis.

Dr. Joseph's monthly stakeholder briefing prep drops from 4–6 hours to about 20 minutes — most of which is reading and writing narrative, not compiling numbers.

The same Carbon design tokens, the same data foundation, two surfaces tailored to who's looking at them. As new modules and features come online (equipment maintenance tracking, scheduled report send, DHIS2 export), they slot into the existing layout without redesign.

---

## 2. User Stories

- **US-1.** As a **bench technician**, I want my home page to show what work is queued for me by my assigned section, so I can start the shift on the right tasks without hunting through global queues.
- **US-2.** As a **validator**, I want to see results awaiting my technical acceptance plus any critical results needing review, so I sequence my day around the most consequential work first.
- **US-3.** As a **lab director**, I want a single Management Dashboard showing workload, TAT, quality, equipment activity, stock, and disease surveillance (TB / HIV / Malaria / AMR), so I can read the lab's state and prepare stakeholder reports without compiling data from five modules.
- **US-4.** As a **section head**, I want to see TAT and workload by section in one place, so I can spot bottlenecks before they become formal complaints.
- **US-5.** As a **lab manager**, I want to monitor reagent stock and approaching reorder points, so we don't run out of critical reagents mid-shift.
- **US-6.** As a **deployment with only a single lab section**, I want the home page to hide rows, cards, and sections that don't apply to my lab, so the page stays calm and honest rather than showing a wall of "0" counters and missing-feature placeholders.

---

## 3. Overview

This feature redesigns the OpenELIS home page (`/`) and introduces a sibling Management Dashboard (`/dashboards/management`) under a new top-level **Dashboards** SideNav group. Both surfaces are dashboards with section-based vertical scroll. They share a common data foundation, severity vocabulary, refresh model, and visual language, but target different audiences and time frames.

The **Home page** is operational, per-user, and frames data in *today / this week / this month*. It is the default landing page for every authenticated OpenELIS user. Its job is to answer *"what is waiting on you?"* and *"what needs attention?"* The home page is freely available — no role gate — but adaptive rules hide content that doesn't apply to the current user or the current deployment.

The **Management Dashboard** is strategic, lab-wide, and frames data in *30 days / 90 days / quarter / year-to-date / year*. Its job is to answer *"how is the lab tracking?"* and *"what does the lab look like for stakeholders?"* Access is gated by a new Roles Builder module-level grant identified by `MANAGEMENT_DASHBOARD` (display label "View Management Dashboard"), which defaults to the existing Admin and EQA Provider role bundles on upgrade and can be granted to non-admin roles (e.g., a deployment-defined "Lab Manager" role) at each deployment's discretion.

Both surfaces are conditional-render-aware. Seven adaptive rules govern visibility of rows, cards, and sections based on feature flags, role permissions, and lab profile (number of sections, modules enabled). This keeps the design useful for everything from a two-person district clinic to a national reference lab.

---

## 4. Functional Requirements

### 4.1 Cross-cutting (apply to both surfaces)

**FR-X-001 — Carbon Design System.** Both surfaces MUST be implemented using components from `@carbon/react`. No hardcoded colors. No Bootstrap, Tailwind, or external CSS. All visible strings MUST be wrapped with the i18n helper `t(key, fallback)`; keys MUST appear in the Localization table (§7). Tabular data MUST use `<DataTable>` (per Carbon convention); inline styles MUST use Carbon `--cds-spacing-*` and `--cds-color-*` tokens, not raw pixel or hex values.

**FR-X-002 — Time scope toggle.** Both surfaces MUST include a time-scope toggle in the header band. The toggle changes the temporal scope of all metrics on the page.

- Home page scope options: `Today` (default) / `This week` / `This month`
- Management Dashboard scope options: `Last 7 days` / `Last 30 days` (default) / `Last 90 days` / `Quarter` / `Year-to-date` / `Year`

User's last-used scope MUST persist per user across logouts.

**FR-X-003 — Refresh model.** Both surfaces soft-refresh every 5 minutes from data load. A manual `Refresh now` button MUST be present in the header band. A *"Updated Xm ago"* timestamp MUST be visible adjacent to the refresh button.

**FR-X-004 — Severity vocabulary.** Severity is communicated via Carbon `Tag` chip color (single source of truth), not via separate dots or icons:

| Severity | Tag kind / color | Meaning |
|---|---|---|
| Critical / blocking | `red` | Drop everything — patient safety or lab-blocking |
| Needs attention soon | Custom orange chip (Carbon palette doesn't include orange natively; design system extension declared in §11 Open questions) | Today's work — not blocking but should not slide |
| Informational | `warm-gray` or `yellow` (TBD per §11) | If you have time — visibility but not action-required |

Chip *label* communicates category (Critical, Freezer, Rejection, QC, EQA, etc.); chip *color* communicates severity. No additional severity icons or dots.

**FR-X-005 — Empty state copy.** Counter-style rows and cards MUST NOT render bare "0". Empty states use explicit positive messages:

- *"All caught up"* (My Queue rows)
- *"No items need attention"* (Attention feed when empty)
- *"Nothing rejected today"* / *"No criticals today"* (category-specific)

Empty rows render in green or a calming neutral, never in alarming color.

**FR-X-006 — Adaptive rendering rules.** Both surfaces MUST honor seven conditional-render rules:

1. **Feature-flag hiding.** Row types and cards hide entirely when their underlying feature is not enabled (e.g., no EQA program → no EQA Attention row; no inventory module operational → no Stock section; no analyzer integration → no Analyzer Connections cell).
2. **Single-section collapse.** My Queue sub-text breakdown collapses to a single number for labs with one `TestSection`.
3. **Open-Orders-by-Status replaces Volume-by-Department.** The Lab Pulse third card uses an open-orders-by-status stacked bar; omitted entirely for single-section labs.
4. **Lab Pulse degradation.** Lab Pulse renders 2 cards instead of 3 when no section comparison story is available.
5. **Lab Snapshot trim.** Lab Snapshot defaults to 4 cells maximum, with cells hidden when their feature is off (e.g., no analyzer integration → no Analyzer connections cell).
6. **Severity by chip color only.** No separate severity dot.
7. **Role-conditional rows.** Rows visible only to users with the relevant permission (e.g., *Orders I started today* visible only to users with order-entry permission).

The skill's Pass I (Stubbed Preview Sections) does not apply because no section is stubbed — sections are either populated or hidden.

**FR-X-007 — Personalized header.** Both surfaces' header bands MUST include a personalized greeting (*"Good morning, {firstName}."*) and an attention summary derived from My Queue / Attention feed counts.

### 4.2 Home page (route `/`)

**FR-HOME-001 — Header strip.** Composed of greeting + attention summary + lab pulse one-liner (e.g., *"Lab tracking on TAT (median 28h)"*) + time-scope toggle + Refresh button + last-refreshed timestamp.

**FR-HOME-002 — My Queue card.** Single card with stacked rows. Up to five row types, each with icon + label + optional sub-text + filter tag + count + chevron. Click → filtered worklist.

| Row type | Visibility | Sub-text breakdown | Filter applied |
|---|---|---|---|
| Results to enter | Always for users with order-entry or section-assigned roles | By section if user has >1 section | `Analysis.status` IN (`NotStarted`, `InProgress`) AND `Analysis.testSection.id` IN user's assigned section IDs |
| Results to validate | Users with validator role on any section | None | `Analysis.status = TechnicalAcceptance` AND `Analysis.testSection.id` IN user's validator-scoped sections |
| Critical results to review | All users with results access | None (count only in v1; per-item ack arrives when the [Critical Acknowledgment Workflow] ships) | `Result.flag` IN (HH, LL, Critical) for results completed in the current scope |
| Orders I started today | Users with order-entry permission only | None | `Sample.sysUserId = currentUser.id` AND DATE(`Sample.enteredDate`) = today AND `Sample.status != 'Finalized'` |
| Referrals from my sections | When referrals feature is enabled at deployment | "{n} overdue back from {refLab}" if any overdue | `Referral.status` IN (`SENT`, `RECEIVED`) AND source `Analysis.testSection.id` IN user's sections |

**FR-HOME-003 — Lab Pulse.** 2 or 3 cards (Adaptive rule 4):

- **Throughput.** Today's received vs. completed sample count, plus a 7-day mini-bar-chart with today highlighted. Source: `Sample.receivedTimestamp` for received; for "completed" today, count Samples where all child `Analysis.releasedDate` falls on today (or use `Sample.releasedDate` if populated).
- **Average TAT (median).** Median TAT for samples finalized in the time scope, with a 14-day sparkline. TAT = `Analysis.releasedDate - Sample.receivedTimestamp` (median across samples in scope). Source: `/rest/reports/tat/compliance` aggregate endpoint introduced in QA Dashboard v1. No threshold line in v1 — per-test targets are deferred to QA Dashboard v8.
- **Open Orders by Status.** Stacked bar showing counts in each `Analysis.status` (`Entered`, `InProgress`, `TechnicalAcceptance`, plus a "Pending Print" bucket derived from `Analysis.releasedDate IS NOT NULL AND printedDate IS NULL`). Omitted for single-section labs (Adaptive rule 3).

**FR-HOME-004 — Attention feed.** List of up to 8 row types. Each row is severity-tagged with chip + descriptive text + age stamp + chevron. Click → relevant detail page. Categories:

| Chip label | Severity | Source | Visibility rule |
|---|---|---|---|
| Critical | red | `Result.flag` IN (HH, LL, Critical) for results completed today | Always |
| Freezer | red | `Alert` records where `entityType = 'Freezer'` (created from `FreezerTemperatureThresholdViolatedEvent`) | Freezer cold-storage feature enabled (i.e., at least one `Freezer` record exists) |
| Rejection | orange | `SampleQaEvent` + `AnalysisQaEvent` records dated today, grouped for breakdown chip | Always |
| Delayed | orange | `Sample.receivedTimestamp` < `now() - {threshold}` AND sample not finalized | Always (v1 uses lab-wide 96h threshold; QA Dashboard v8 introduces per-test) |
| Shipment | orange | `Referral.status = CREATED` AND `Referral.createdDate < now() - 24h` (pre-shipment state in the activated ReferralStatus enum) | Referrals feature enabled |
| QC | yellow | Latest `WestgardRuleEvaluationService` evaluation results with `severity = REJECTION`, scoped to the current period | QC module operational (i.e., at least one `WestgardRuleConfig` row exists for an active analyzer/control lot) |
| EQA | yellow | EQA round records with pending results | EQA module operational (currently EQA V2 in development per separate roadmap — see §6.2) |
| Unprinted | yellow | `Analysis.printedDate IS NULL` AND `Analysis.releasedDate IS NOT NULL` AND date > today | Always |

Rejection chip breakdown ("X reception · Y lab · Z validator") is derived from:
- Reception-stage = count of `SampleQaEvent` records today
- Lab-stage / Validator-stage = count of `AnalysisQaEvent` records today, further split by the `QaEvent.type` Dictionary discriminator (Dictionary values for laboratory-rejection vs. validator-rejection are deployment-configurable; v1 ships with a sensible default mapping documented in the seed migration)

Rows MUST link to the underlying record (or filtered list when multiple records share a row, e.g., the rejection rollup). Feed paginates if >5 rows; full list opens on `Show all (n)` link.

**FR-HOME-005 — Quick Actions.** 4 or 6 tiles (Adaptive rule 1 may trim some). Default tiles: `New Order`, `Patient Search`, `Workplan`, `Validate Results`, `Print Labels`, `Reports`. Each tile is a deep link. v1.1 may make these per-user configurable.

**FR-HOME-006 — Lab Snapshot.** Collapsible card (defaults closed in v1; open in preview for review). Up to 4 cells:

| Cell | Source | Visibility |
|---|---|---|
| Specimens at reference lab | `Referral.status` IN (`SENT`, `RECEIVED`) count | Referrals feature enabled |
| Analyzer connections | "X of Y analyzers active in last hour" derived from `MAX(Analysis.completedDate)` per `Analysis.analyzerId` | Analyzer integration enabled (at least 1 analyzer configured) |
| Today so far | Aggregate counts: received (`Sample.receivedTimestamp` today), completed (Analysis released today), rejected (today's `SampleQaEvent` + `AnalysisQaEvent` count), critical (today's `Result.flag` in HH/LL) | Always |
| Active users now | Spring HTTP session inspection — count of authenticated sessions with `lastAccessedTime > now() - 5 min` (read from `HttpSessionListener` registry, NOT a database entity) | Always; may be deferred to v1.x if exposing the session layer to the dashboard endpoint is non-trivial |

### 4.3 Management Dashboard (route `/dashboards/management`)

**FR-MGMT-001 — Header strip.** Page title ("Management Overview"), site context line (e.g., *"CPHL Port Moresby · Last 30 days · 4,247 samples processed"*), time-scope toggle with six ranges, Refresh button, last-refreshed timestamp.

**FR-MGMT-002 — KPI strip.** Five large KPI tiles spanning the page width, each with sparkline:

| KPI | Source | Target if present |
|---|---|---|
| Total samples | `COUNT(Sample) WHERE receivedTimestamp` IN scope | None — descriptive |
| Median TAT | Same source as home Lab Pulse | None in v1 (target band is illustrative until QA Dashboard v8) |
| On-time completion % | `COUNT(Sample finalized within target TAT) / COUNT(Sample finalized)` | Default ≥ 90% (configurable in QI Configuration) |
| Rejection rate | `(COUNT(SampleQaEvent) + COUNT(AnalysisQaEvent)) / COUNT(Sample received)` | Default < 2% (configurable in QI Configuration) |
| QC pass rate | `(QCResults with no Westgard rejection violation) / (total QCResults)` for the current scope | Default ≥ 95% |

Each tile's sparkline shows the trend over the current scope. Tiles tint green / amber / red based on whether the current value is on / approaching / past target.

**FR-MGMT-003 — Disease Surveillance grid.** Four program cards arranged horizontally (TB, HIV, Malaria, AMR). Each card shows 3 key metrics for that program with mini progress bar visualization plus the test count and a trend note. Programs map to tests via the new `TestSurveillanceMapping` lookup (see §5).

Below the four cards, the AMR card promotes a full **antibiogram heatmap**: a CSS-grid table of organisms (rows) × antibiotics (columns), each cell showing percent resistance. Cells color-coded green / amber / orange / red against CLSI breakpoint resistance thresholds. Rendered only for n ≥ 10 isolates per organism × antibiotic combination to avoid noisy cells. Source: `SusceptibilityResult` records from the AMR module (introduced in OpenELIS 2.4); falls back to organism count summary only when AST entry is not enabled.

A card hides if no tests are mapped to its program in `TestSurveillanceMapping`.

**FR-MGMT-004 — Workload & TAT detail.** Two cards side-by-side:

- **Workload by section (stacked area chart).** Daily sample counts per section over the current scope (e.g., 30 days). Each day's stack is `COUNT(Sample)` joined to `SampleItem` joined to `Analysis` grouped by `Analysis.testSection`. Legend includes all sections with samples in the scope.
- **TAT by section (table — Carbon `<DataTable>`).** One row per `TestSection`. Columns: Section name, Sample count, Median TAT, P90 TAT, On-time %. Sortable. Hovering a section row to highlight the corresponding stack in the workload chart is **out of scope for v1** (see §10).

**FR-MGMT-005 — Quality rollup.** Two cards:

- **Composite quality score** (left card, prominent). Single large number 0–100, computed as a weighted average of four components. Default weights: QC × 0.30, EQA × 0.25, NCE inverse × 0.25, Amendment inverse × 0.20. The weights MUST come from `QIWeights` configuration (see §5); the dashboard reads whatever weights are configured for the lab.
- **Components breakdown** (right card). One row per component: label, mini meter visualization, current value, weight. Last row is the composite score for reference. Footer link to `QI Configuration` for editing weights.

**FR-MGMT-006 — Equipment activity grid.** Per-analyzer cards in a 3-column grid. Each card shows:

- Analyzer name + activity tag (`Active` / `Quiet` / `No activity` — derived from `now() - MAX(Analysis.completedDate WHERE analyzerId = X)`)
- Primary number: sample count in current scope with explicit time frame (e.g., *"1,247 samples · 30d"*, *"0 samples · last 48h"*)
- Department / use context (`Analysis.testSection.name` for the most-frequent section served)
- "Last activity: 2m ago" / "4h ago" / "2d ago"

Activity thresholds (configurable in v1.x):
- `Active` — last activity < 1 hour
- `Quiet` — last activity 1–24 hours
- `No activity` — last activity > 24 hours

Cards have NO maintenance, calibration, or uptime fields in v1. Those land when the separate **Equipment Maintenance & Service Tracking** epic ships and exposes the maintenance log; at that point the cards extend to show last service, next calibration, and overdue flags.

**FR-MGMT-007 — Stock & inventory.** Three side-by-side cards:

- **Critical reagents on hand.** List of high-priority reagents with current quantity, percent of reorder threshold, expiration date, lot number. Driven by `Inventory` module data. v1 ships with a default heuristic flagging reagents used by tests with `TestSurveillanceMapping` rows or high-volume sections; per-lab customization of the "critical" filter is out of scope for v1 (see §10).
- **Expiring in 30 days.** Alert list showing items with expiration date within 30 days.
- **Reorder alerts.** Alert list showing items at or below reorder point, plus items approaching reorder.

If the Inventory module is enabled but has zero stock data, the section renders with empty-state copy: *"Inventory is being set up at this deployment. Stock alerts will appear as reagent receipts are recorded."* Inventory module disabled → section hidden entirely.

**FR-MGMT-008 — Export bar.** Strip at the bottom of the page with three controls:

- `Export PDF` — generates a PDF snapshot of the current view (all sections in current scope). Triggers `MANAGEMENT_DASHBOARD_EXPORTED` audit event.
- `Download CSV` — opens a section picker; downloads the selected section(s) as CSV. Triggers `MANAGEMENT_DASHBOARD_CSV_DOWNLOADED` audit event per section selected.
- `Schedule report` — placeholder button in v1 with tooltip *"Available in v2"*. Disabled state. Live in v2 when scheduled-send infrastructure ships.

**FR-MGMT-009 — Access control.** The route `/dashboards/management` MUST be gated by the new Roles Builder module-level grant `MANAGEMENT_DASHBOARD`. Users without the grant attempting to access the URL receive HTTP 403 from the API and a friendly "Access denied" Carbon `<InlineNotification kind="error">` on the UI side. The SideNav item is hidden for users without the grant.

---

## 5. Data Model

### 5.1 Reused entities — verified against `OpenELIS-Global-2/develop` 2026-06-05

Field names confirmed against actual source. No invented fields below; missing data appears in §6 as named dependencies.

| Entity (Java path) | Fields touched | Used by |
|---|---|---|
| `Sample` (`org.openelisglobal.sample.valueholder.Sample`) | `id`, `receivedTimestamp`, `enteredDate`, `releasedDate`, `status`, `statusId`, `sysUserId`, `systemUser` (ValueHolder→SystemUser), `priority` (OrderPriority), `referredCultureFlag` | Both surfaces — throughput, TAT, queue counts, "Orders I started today" |
| `SampleItem` (`org.openelisglobal.sampleitem.valueholder.SampleItem`) | `id`, `sample` (FK), `typeOfSample` | Bridge between `Sample` and `Analysis` (Sample → SampleItem → Analysis is the actual relationship path) |
| `Analysis` (`org.openelisglobal.analysis.valueholder.Analysis`) | `id`, `status`, `statusId`, `testSection` (ValueHolder→TestSection), `test`, `startedDate`, `completedDate`, `releasedDate`, `printedDate`, `analyzerId`, `referredOut`, `correctedSincePatientReport` | Home My Queue (Results to enter, Results to validate); Lab Pulse Open Orders by Status; Management workload-by-section; equipment activity (via `analyzerId`); unprinted detection (via `printedDate IS NULL` AND `releasedDate IS NOT NULL`) |
| `Result` (`org.openelisglobal.result.valueholder.Result`) | `value`, `unitOfMeasure`, `referenceRange`, `flag` (critical / abnormal indicators), `completedDate` | Critical results detection on both surfaces |
| `QaEvent` (`org.openelisglobal.qaevent.valueholder.QaEvent`) + `SampleQaEvent` + `AnalysisQaEvent` | `QaEvent`: `qaEventName`, `description`, `type` (Dictionary), `category` (Dictionary), `test` reference. `SampleQaEvent` / `AnalysisQaEvent`: join records linking a QaEvent occurrence to a Sample (reception-stage) or Analysis (lab/validator-stage), with `recordTimestamp` | Rejection rollup on both surfaces. Stage discrimination ("reception / lab / validator") is derived from join-table (`SampleQaEvent` = reception-stage; `AnalysisQaEvent` = analysis-stage) plus `QaEvent.type` Dictionary value for lab vs. validator split |
| `Referral` (`org.openelisglobal.referral.valueholder.Referral`) | `status` (`CREATED → SENT → RECEIVED → FINISHED → CANCELED` — the referral redesign activates SENT and FINISHED), `createdDate`, `referenceLab`, `sourceAnalysis`, plus the unwired `assignedBox`, `lostStatus`, `priority` fields documented in `referral-redesign-frs.md` | Home referral queue + Lab Snapshot referral counts |
| `Test` (`org.openelisglobal.test.valueholder.Test`) | `id`, `name`, `testSection` (future `tatTargetHours` field belongs to QA Dashboard v8) | TAT-by-section table, surveillance program mapping |
| `TestSection` (`org.openelisglobal.test.valueholder.TestSection`) | `id`, `name` | Workload-by-section, queue filtering |
| `QCResult` (`org.openelisglobal.qc.valueholder.QCResult`) + `WestgardRuleEvaluationService` + `WestgardRuleConfig` | `QCResult`: control values per run with `runDateTime`, `controlLot` reference. Violations evaluated by `WestgardRuleEvaluationService` orchestrating 8 rule evaluators (`Rule1_2sEvaluator`, `Rule1_3sEvaluator`, `Rule2_2sEvaluator`, `RuleR_4sEvaluator`, `Rule4_1sEvaluator`, `Rule10_xEvaluator`, `Rule3_1sEvaluator`, `Rule7_tEvaluator`); each returns severity `WARNING` or `REJECTION` | QC out-of-range row on home (queries latest evaluation results per analyzer/control lot with `severity = REJECTION`); QC pass rate KPI on management |
| `Freezer` (`org.openelisglobal.coldstorage.valueholder.Freezer`) + `Alert` (polymorphic) | `Freezer`: cold-storage unit configuration with thresholds. `Alert` records persist threshold violations (polymorphic `entityType = 'Freezer'`, `entityId = freezerId`, plus timestamp and message). Violations are emitted as `FreezerTemperatureThresholdViolatedEvent` and persisted by `FreezerAlertService`. | Freezer Attention row on home (queries `Alert` where `entityType = 'Freezer'` AND not acknowledged) |
| `Inventory` items (`org.openelisglobal.inventory.*`) | Item record, `name`, `lotNumber`, `quantityOnHand`, `reorderPoint`, `expirationDate` | Stock section |
| `SusceptibilityResult` (AMR module, OpenELIS 2.4) | `organismId`, `antibioticId`, `interpretation` (S/I/R per CLSI breakpoints) | Antibiogram heatmap |
| Active users count | Spring HTTP session inspection (`HttpSessionListener` or Spring Session repository) — NOT a domain entity. No `UserSession` table in OpenELIS. | Lab Snapshot "Active users now" cell |
| EQA module | EQA V2 entities partially specced; pending result count derived from EQA round records joined to result-entry status. See `eqa-v2-*` design docs. | EQA pending row on home; EQA component of composite quality. **Dependency:** see §6.2 |

### 5.2 New entities

Three new entities, all configuration-grade with `@Audited` Envers coverage.

**`SurveillanceProgram`** — small reference table.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `code` | varchar(32) | e.g., `TB`, `HIV`, `MALARIA`, `AMR` |
| `displayName` | varchar(128) | i18n-friendly key reference |
| `displayOrder` | int | Card ordering on surveillance grid |
| `isActive` | boolean | Soft-disable from dashboard without removing data |

Seeded with TB / HIV / Malaria / AMR on initial migration. Admins can add programs (e.g., COVID, Hep-B) in a future admin UI; v1 ships with the four hardcoded seed rows + admin add/edit is a future enhancement.

**`TestSurveillanceMapping`** — many-to-many join.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `testId` | UUID | FK → `Test.id` |
| `programId` | UUID | FK → `SurveillanceProgram.id` |
| `roleInProgram` | varchar(64) | Optional discriminator (e.g., `MTB_DETECTION`, `MTB_RESISTANCE`, `VL_QUANTITATIVE`, `EID`); used for per-card metric grouping |

Many tests per program; multiple programs per test possible (rare). Admin UI: future enhancement; v1 ships with a seed migration covering common WHO-recommended tests and a CSV-based admin import.

**`QIWeights`** — single-row (or lab-scoped) configuration.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `qcWeight` | numeric(3,2) | Default 0.30 |
| `eqaWeight` | numeric(3,2) | Default 0.25 |
| `nceInverseWeight` | numeric(3,2) | Default 0.25 |
| `amendmentInverseWeight` | numeric(3,2) | Default 0.20 |
| `modifiedAt` | timestamp | |
| `modifiedBy` | varchar | |

Validation: weights MUST sum to 1.00 ± 0.01; the admin edit form normalizes on save with a confirmation. May extend with additional components in future (Critical Callback Compliance is queued for QA Dashboard v8).

---

## 6. Dependencies and adjacent epics

### 6.1 Dependencies (in scope for this epic)

- **`SurveillanceProgram` + `TestSurveillanceMapping`** lookup tables. Prerequisite for the entire Surveillance grid. Small, contained schema add.
- **`QIWeights`** configuration. Prerequisite for the configurable composite quality score. Lives behind the existing QI Configuration admin page.
- **Adaptive rule plumbing.** Backend service must expose feature-flag and module-availability state per deployment so the frontend can render conditionally.
- **`MANAGEMENT_DASHBOARD` Roles Builder grant.** New module-level role grant with default assignments and Roles Builder UI placement.
- **QaEvent type/category Dictionary mapping seed.** v1 ships a seed migration mapping existing `QaEvent.type` and `QaEvent.category` Dictionary entries to the reception / lab / validator stage discriminator the Attention feed uses. Deployments can override the mapping per their conventions.

### 6.2 Adjacent epics and gated features

- **Equipment Maintenance & Service Tracking (separate epic, on roadmap).** When that epic ships, Management Dashboard equipment cards extend to render last-service, next-calibration, and overdue states. Until then, equipment cards render last-activity only.
- **Critical Result Acknowledgment Workflow (separate global TODO).** When it ships, the Home page Critical Results row promotes from count-fallback to per-item rows ("Critical result on ORD-1034 — not acknowledged 3h"). The Attention feed Critical row similarly evolves.
- **QA Dashboard v8 (per-test TAT targets and configurable thresholds).** Until v8 ships, Average TAT cards on both surfaces show median only — no per-test target lines, no compliance %.
- **AMR module / AST entry (OpenELIS 2.4).** Antibiogram heatmap depends on AST data being captured. Pre-2.4 deployments render the AMR card with organism counts only.
- **EQA V2 module (specced, build in progress — see `eqa-v2-*` design docs).** EQA pending row on home and EQA component of composite quality both depend on EQA V2 entities and APIs. Deployments without EQA V2 see the EQA row hidden (per Adaptive Rule 1) and the EQA component drops out of the composite (the composite reweights remaining components proportionally, with a note on the card).
- **DHIS2 export integration (v2+).** Scheduled report send and DHIS2-format exports defer to v2.
- **Multi-site aggregation.** Lives in Apache Superset on aggregated FHIR (out of OpenELIS scope per platform decision).

---

## 7. Permissions, Audit, and Localization

### 7.1 Role attachment

| Surface | Role required | Notes |
|---|---|---|
| Home page (`/`) | None | Available to all authenticated users; row visibility adapts per individual permissions |
| Management Dashboard (`/dashboards/management`) | New Roles Builder grant `MANAGEMENT_DASHBOARD` (display: "View Management Dashboard") | Default-on for existing Admin and EQA Provider role bundles on upgrade |

`MANAGEMENT_DASHBOARD` is a Roles Builder module-level grant — a new entry in the `system_role_module` allow-list table, following the existing module-grant naming convention (UPPER_SNAKE_CASE module identifier). It is NOT a free-form per-action permission key (per the binary-admin + role-bundles convention; see [feedback_openelis_admin_permissions]). It appears in Roles Builder under a new section header **Dashboards**.

UI enforcement: SideNav item `Management Overview` is hidden for users without the grant. Direct URL navigation results in a Carbon `<InlineNotification kind="error">` reading "You don't have permission to view this page." API enforcement: backend endpoints supporting the Management Dashboard return HTTP 403 for users without the grant.

### 7.2 Audit events

| Event verb | Trigger | Target | Payload | Actor |
|---|---|---|---|---|
| `MANAGEMENT_DASHBOARD_EXPORTED` | User clicks Export PDF | `MGMT_DASHBOARD` | `{timeScope, sectionsIncluded[], timestamp}` | Spring Security current user |
| `MANAGEMENT_DASHBOARD_CSV_DOWNLOADED` | User downloads CSV per section | `MGMT_DASHBOARD` | `{section, timeScope, rowCount}` | Spring Security current user |
| `QI_COMPOSITE_WEIGHTS_UPDATED` | Admin saves new weights in QI Configuration | `QIWeights.id` | `{old: {qc, eqa, nce, amendment}, new: {qc, eqa, nce, amendment}}` | Spring Security current user |
| `SURVEILLANCE_MAPPING_IMPORTED` | Admin runs CSV import to populate `TestSurveillanceMapping` (v1 admin path; full UI is v1.x) | `TestSurveillanceMapping` (bulk) | `{rowsAdded, rowsUpdated, rowsSkipped, sourceFile}` | Spring Security current user |
| `SURVEILLANCE_MAPPING_CHANGED` | When v1.x admin UI ships: create/edit/delete of a mapping row | `TestSurveillanceMapping.id` | `{action, testId, programId, roleInProgram}` | Spring Security current user |

Home page itself triggers no `audit_trail` events — it is a read-only consumer. Drill-through clicks audit at their destination pages, not at the home page.

Payloads MUST NOT include patient PII beyond entity IDs. Sample IDs, order IDs, and result IDs are acceptable; patient identifiers (name, DOB, national ID, address) are not.

### 7.3 Envers coverage

| Entity | `@Audited` | Rationale |
|---|---|---|
| `SurveillanceProgram` | Yes | Configuration entity; admin-edited |
| `TestSurveillanceMapping` | Yes | Configuration entity; admin-edited |
| `QIWeights` | Yes | Configuration entity; weights change rarely but with significant impact |

### 7.4 Localization

All visible strings use the i18n helper. Key naming follows the `[category].[feature].[identifier]` convention with semantic identifiers (no digit-prefix keys).

**Common keys (both surfaces):**

| Key | Default English |
|---|---|
| `label.dashboard.refresh` | Refresh |
| `label.dashboard.lastUpdated` | Updated {0}m ago |
| `label.dashboard.scope.today` | Today |
| `label.dashboard.scope.thisWeek` | This week |
| `label.dashboard.scope.thisMonth` | This month |
| `label.dashboard.scope.last7days` | Last 7 days |
| `label.dashboard.scope.last30days` | Last 30 days |
| `label.dashboard.scope.last90days` | Last 90 days |
| `label.dashboard.scope.quarter` | Quarter |
| `label.dashboard.scope.yearToDate` | Year-to-date |
| `label.dashboard.scope.year` | Year |
| `label.dashboard.emptyState.caughtUp` | All caught up |
| `label.dashboard.emptyState.noAttention` | No items need attention |
| `breadcrumb.home` | Home |
| `breadcrumb.dashboards` | Dashboards |
| `breadcrumb.management` | Management Overview |
| `sidenav.dashboards` | Dashboards |
| `sidenav.management` | Management Overview |

**Home page keys:**

| Key | Default English |
|---|---|
| `label.home.greeting.morning` | Good morning, {0}. |
| `label.home.greeting.afternoon` | Good afternoon, {0}. |
| `label.home.greeting.evening` | Good evening, {0}. |
| `label.home.attention.count` | {0} items need your attention. |
| `label.home.attention.zero` | Nothing waiting on you. |
| `label.home.attention.tracking` | Lab tracking on TAT (median {0}). |
| `label.home.myqueue.title` | My queue |
| `label.home.myqueue.resultsToEnter` | Results to enter |
| `label.home.myqueue.resultsToValidate` | Results to validate |
| `label.home.myqueue.criticalReview` | Critical results to review |
| `label.home.myqueue.ordersToday` | Orders I started today |
| `label.home.myqueue.referrals` | Referrals from my sections |
| `label.home.myqueue.filter.mySections` | My sections |
| `label.home.myqueue.filter.myRole` | My role |
| `label.home.myqueue.filter.allSections` | All sections |
| `label.home.myqueue.filter.today` | Today |
| `label.home.pulse.title` | Today's lab pulse |
| `label.home.pulse.throughput` | Throughput |
| `label.home.pulse.throughput.detail` | {0} received / {1} completed |
| `label.home.pulse.tat` | Average TAT (median) |
| `label.home.pulse.openByStatus` | Open orders by status |
| `label.home.pulse.openByStatus.entered` | Entered |
| `label.home.pulse.openByStatus.inProgress` | In Progress |
| `label.home.pulse.openByStatus.techAccept` | Tech Acceptance |
| `label.home.pulse.openByStatus.pendingPrint` | Pending Print |
| `label.home.attention.title` | Attention |
| `label.home.attention.chip.critical` | Critical |
| `label.home.attention.chip.freezer` | Freezer |
| `label.home.attention.chip.rejection` | Rejection |
| `label.home.attention.chip.delayed` | Delayed |
| `label.home.attention.chip.shipment` | Shipment |
| `label.home.attention.chip.qc` | QC |
| `label.home.attention.chip.eqa` | EQA |
| `label.home.attention.chip.unprinted` | Unprinted |
| `label.home.quickActions.title` | Quick actions |
| `label.home.quickActions.newOrder` | New order |
| `label.home.quickActions.patientSearch` | Patient search |
| `label.home.quickActions.workplan` | Workplan |
| `label.home.quickActions.validateResults` | Validate results |
| `label.home.quickActions.printLabels` | Print labels |
| `label.home.quickActions.reports` | Reports |
| `label.home.snapshot.title` | Lab snapshot |
| `label.home.snapshot.specimensAtRefLab` | Specimens at reference lab |
| `label.home.snapshot.analyzerConnections` | Analyzer connections |
| `label.home.snapshot.todaySoFar` | Today so far |
| `label.home.snapshot.activeUsersNow` | Active users now |

**Management Dashboard keys:**

| Key | Default English |
|---|---|
| `label.mgmt.title` | Management Overview |
| `label.mgmt.subtitle` | {0} · {1} · {2} samples processed |
| `label.mgmt.kpi.totalSamples` | Total samples |
| `label.mgmt.kpi.medianTat` | Median TAT |
| `label.mgmt.kpi.onTime` | On-time completion |
| `label.mgmt.kpi.rejectionRate` | Rejection rate |
| `label.mgmt.kpi.qcPassRate` | QC pass rate |
| `label.mgmt.surveillance.title` | Disease surveillance |
| `label.mgmt.surveillance.tb` | Tuberculosis |
| `label.mgmt.surveillance.hiv` | HIV |
| `label.mgmt.surveillance.malaria` | Malaria |
| `label.mgmt.surveillance.amr` | AMR |
| `label.mgmt.surveillance.testCount` | {0} tests · {1} |
| `label.mgmt.antibiogram.title` | Antibiogram — % resistant by organism × antibiotic |
| `label.mgmt.antibiogram.meta` | Source: AST entry (introduced 2.4) · CLSI breakpoints |
| `label.mgmt.workload.title` | Workload & turnaround time |
| `label.mgmt.workload.byCard` | Workload by section (daily, {0}) |
| `label.mgmt.workload.tatTable` | TAT by section (median, {0}) |
| `label.mgmt.workload.tatTable.section` | Section |
| `label.mgmt.workload.tatTable.samples` | Samples |
| `label.mgmt.workload.tatTable.median` | Median |
| `label.mgmt.workload.tatTable.p90` | P90 |
| `label.mgmt.workload.tatTable.onTime` | On-time % |
| `label.mgmt.quality.title` | Quality rollup |
| `label.mgmt.quality.composite` | Composite quality |
| `label.mgmt.quality.components` | Components |
| `label.mgmt.quality.qcPass` | QC pass rate |
| `label.mgmt.quality.eqaPerf` | EQA performance |
| `label.mgmt.quality.nceInverse` | NCE inverse |
| `label.mgmt.quality.amendmentInverse` | Amendment rate inverse |
| `label.mgmt.quality.weightsConfigurable` | Weights resolve from QI Configuration per lab. |
| `label.mgmt.quality.editWeights` | Edit weights ↗ |
| `label.mgmt.equipment.title` | Equipment activity |
| `label.mgmt.equipment.subtitle` | Per-analyzer recent activity · sample counts in current scope ({0}) · maintenance & service tracked in a separate roadmap epic |
| `label.mgmt.equipment.status.active` | Active |
| `label.mgmt.equipment.status.quiet` | Quiet |
| `label.mgmt.equipment.status.noActivity` | No activity |
| `label.mgmt.equipment.lastActivity` | Last activity: {0} |
| `label.mgmt.stock.title` | Stock & inventory |
| `label.mgmt.stock.criticalReagents` | Critical reagents — on hand |
| `label.mgmt.stock.expiringIn30` | Expiring in 30 days |
| `label.mgmt.stock.reorderAlerts` | Reorder alerts |
| `label.mgmt.stock.emptyState` | Inventory is being set up at this deployment. Stock alerts will appear as reagent receipts are recorded. |
| `label.mgmt.export.title` | Export & share |
| `label.mgmt.export.pdf` | Export PDF |
| `label.mgmt.export.csv` | Download CSV |
| `label.mgmt.export.schedule` | Schedule report |
| `label.mgmt.export.scheduleTooltip` | Available in v2 |
| `error.dashboards.management.accessDenied` | You don't have permission to view this page. |

---

## 8. Acceptance Criteria

### 8.1 Home page

- [ ] Home page renders at `/` for any authenticated user with no role gate.
- [ ] Header strip displays greeting, attention summary, and time-scope toggle.
- [ ] Time-scope toggle persists per user across logout.
- [ ] My Queue renders 0–5 rows based on adaptive rules; rows hide when their underlying feature or role permission is absent.
- [ ] Each My Queue row links to a filtered worklist.
- [ ] "All caught up" empty-state copy replaces bare zeros on My Queue rows.
- [ ] Lab Pulse renders 2 or 3 cards based on the single-section adaptive rule.
- [ ] Throughput card shows today's received vs. completed plus 7-day mini bar chart.
- [ ] Average TAT card shows 14-day median sparkline, no compliance %.
- [ ] Open Orders by Status omitted for labs with 1 section.
- [ ] Attention feed renders only rows whose underlying feature is enabled.
- [ ] Each Attention row uses a colored chip indicating both category (label) and severity (color).
- [ ] Rejection row chip breakdown is correctly derived from `SampleQaEvent` + `AnalysisQaEvent` joined to `QaEvent.type` Dictionary.
- [ ] Freezer row appears when at least one `Alert` record with `entityType = 'Freezer'` is present and unacknowledged.
- [ ] Unprinted row reads from `Analysis.printedDate IS NULL` AND `releasedDate IS NOT NULL`.
- [ ] Quick Actions strip renders 4 or 6 tiles.
- [ ] Lab Snapshot collapsed by default; expands on click; renders ≤4 cells based on feature flags.
- [ ] Soft refresh every 5 min; manual Refresh button updates timestamp.
- [ ] All visible strings localized; no hardcoded English.

### 8.2 Management Dashboard

- [ ] Page renders at `/dashboards/management` only for users with `MANAGEMENT_DASHBOARD` grant.
- [ ] Users without the grant see an Access Denied notification on direct URL access; SideNav item is hidden for them.
- [ ] Header strip displays page title, site context, six-option time scope toggle.
- [ ] KPI strip renders 5 tiles with sparklines.
- [ ] Each KPI tile tints based on target compliance.
- [ ] Surveillance grid renders 4 program cards; cards hide if no tests are mapped to their program in `TestSurveillanceMapping`.
- [ ] AMR antibiogram heatmap renders for organism × antibiotic combinations with n ≥ 10 isolates.
- [ ] Antibiogram cells use color coding per CLSI breakpoints.
- [ ] Antibiogram falls back to organism counts only for pre-2.4 deployments without AST entry.
- [ ] Workload-by-section stacked area chart spans the current scope using Analysis → Sample → SampleItem → TestSection path.
- [ ] TAT-by-section table uses Carbon `<DataTable>` and is sortable by all columns.
- [ ] Composite quality score reads weights from `QIWeights`; weights configurable in QI Configuration; sum to 1.00 ± 0.01 validation.
- [ ] Composite reweights remaining components proportionally if EQA module is not deployed.
- [ ] Equipment cards show activity tag (`Active` / `Quiet` / `No activity`) based on `MAX(Analysis.completedDate)` per analyzer; no maintenance / calibration / uptime fields in v1.
- [ ] Stock section renders Inventory data when present; empty-state copy when Inventory module is enabled but unpopulated; section hidden when Inventory module is disabled.
- [ ] Export bar PDF and CSV buttons trigger respective audit events.
- [ ] Schedule report button visible but disabled in v1 with "Available in v2" tooltip.
- [ ] All visible strings localized.

### 8.3 Cross-cutting

- [ ] All severity indicators use chip color only (no separate severity dot anywhere).
- [ ] All counter rows render an empty-state message (never bare "0").
- [ ] All adaptive rules trigger correctly (verified by feature-flag matrix in QA).
- [ ] Soft auto-refresh interval is configurable per deployment (default 5 min); manual Refresh always available.
- [ ] Both surfaces pass WCAG 2.1 AA: keyboard nav, sufficient contrast, ARIA roles on cards and rows.
- [ ] Both surfaces respect locale: numbers, dates, time scopes formatted per user locale.
- [ ] PDF export and CSV download trigger audit_trail entries with the documented payloads.
- [ ] All tabular data renders via Carbon `<DataTable>`.
- [ ] All inline styles use Carbon `--cds-*` tokens, not raw pixel or hex values.

---

## 9. Non-functional requirements

- **Performance:** Home page first meaningful paint < 1.5s for a user with typical data (~100 samples in scope). Management Dashboard first meaningful paint < 2.5s for a 30-day scope at ~5,000 samples.
- **Data freshness:** Soft refresh every 5 min. Manual refresh respects backend rate limits (no more than 1 refresh per 15s per user).
- **Bandwidth:** Both surfaces optimized for low-bandwidth deployments (Indonesia, PNG). Initial payload < 200KB JS + CSS. Charts use inline SVG where feasible; no Chart.js / D3 dependencies for v1.
- **Accessibility:** WCAG 2.1 AA. All interactive elements keyboard-navigable. Severity is conveyed by chip color AND text label (color is not the sole signal).
- **Localization:** English, French, Spanish, Portuguese, Bahasa Indonesia at launch; structure supports adding additional locales without code changes.
- **Browser support:** Modern Chrome, Firefox, Safari, Edge. No IE11.
- **Mobile:** Carbon defaults; both surfaces are tablet-readable. Mobile-phone optimization is not a v1 goal.

---

## 10. Out of scope (deferred)

| Item | Reason | Lands in |
|---|---|---|
| Equipment maintenance & service tracking | Separate epic on roadmap | Equipment Maintenance & Service Tracking epic |
| Critical Result Acknowledgment per-item rows | Separate global TODO | Critical Result Acknowledgment Workflow epic |
| Per-test TAT targets and compliance % | Deferred upstream | QA Dashboard v8 |
| Scheduled report send (cron-style PDF delivery) | Infrastructure not in place | v2 of this epic |
| DHIS2 export integration | Out of v1 scope | v2 or later |
| Multi-site aggregation | Platform decision (Superset on FHIR) | Outside OpenELIS |
| Detail pages behind each card (heatmaps, drill-downs, full pareto) | Placeholder routes in v1 | v2 detail-page work |
| Mobile-phone optimization | Tablet-readable in v1; phones in future | Future mobile epic |
| `MyQueue` configurability (user pins / unpins rows) | v1 ships with fixed row set | v1.1+ |
| Quick Actions configurability per user | v1 ships with fixed tile set | v1.1+ |
| True analyzer heartbeat | Requires analyzer-side health check | Future analyzer module work |
| Per-deployment Surveillance Program admin UI | v1 ships seeded with TB/HIV/Malaria/AMR; CSV-import for mappings | Future admin UI |
| `TestSurveillanceMapping` interactive admin UI | v1 uses seed migration + CSV import | Future admin UI |
| Per-lab "critical reagent" filter customization (Stock section) | v1 uses heuristic default (reagents tied to surveillance-mapped tests or high-volume sections) | Future Stock admin |
| Workload chart row-hover linkage to TAT table | v1 ships sortable table only | Future polish |
| Equipment activity threshold configuration | v1 hardcodes Active <1h / Quiet 1–24h / No activity >24h | v1.x admin enhancement |
| QaEvent type/category Dictionary mapping admin UI | v1 ships seed mapping + lets admins edit Dictionary entries directly | Future admin UI |

---

## 11. Open questions (TBD before /breakdown)

1. **CPHL-specific surveillance disease mapping:** Does CPHL already tag tests to programs in their deployment? Confirm before declaring the seed migration final.
2. **Composite quality weights — admin UI placement:** Confirm placement under existing QI Configuration page (most natural home) vs. a new sub-section.
3. **Quick Actions tile set per role:** Should the default 4-or-6 tile set differ by role (e.g., receptionist sees New Order prominently; validator sees Validate Results)? Or fixed v1, configurable v1.1?
4. **Equipment "Active / Quiet / No activity" thresholds:** Confirm default cutoffs (Active <1h, Quiet 1–24h, No activity >24h) with one or two reference deployments; consider whether these should be admin-configurable in v1 or v1.1.
5. **Schedule report button visibility in v1:** Hidden vs. visible-but-disabled. Spec currently says visible-but-disabled with tooltip; confirm this is the right UX vs. hiding until v2 ships.
6. **Severity vocabulary harmonization:** Carbon `Tag` palette doesn't natively include orange. Three resolutions to choose: (a) extend the lab's design tokens with a custom orange severity color (declare in design system docs); (b) realign severity vocabulary so "needs attention soon" uses Carbon `warm-gray` (which collides with the established status meaning of "Intermediate / Borderline"); (c) collapse to two severity levels (red = critical, gray = informational, drop the middle tier). Recommended: (a) — keep three tiers, document the orange extension.
7. **Active users count source:** Reading the Spring HTTP session layer from a REST endpoint adds modest plumbing. Confirm whether v1 includes the cell or defers to v1.x.
8. **QaEvent type/category Dictionary seed mapping:** Validate the proposed reception / lab / validator stage discrimination against existing OpenELIS deployments to ensure the default mapping is sensible across CPHL, Mwanza, Indonesia, and Madagascar configurations.

---

*End of FRS — version-agnostic. Slicing into versions, story decomposition, and sprint capacity happen in `/breakdown`. Visual references: `home-page-redesign-preview.html`, `management-dashboard-preview.html`. Data model verified against `OpenELIS-Global-2/develop` SHA d7435687 on 2026-06-05.*
