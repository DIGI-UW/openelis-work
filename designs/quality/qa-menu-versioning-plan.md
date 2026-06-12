# QA Menu — Thin-Slice Versioning Plan

**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Supersedes:** the 6-sprint structure in `qa-menu-roadmap.md` (kept for context, but versions below are the canonical sequence)

---

## Why thin slices

The earlier 6-sprint plan grouped work by capability area (NCE bedrock, rehomes, Pillar 3, EQA V2, Results Entry). That worked for spec authoring but creates fat releases — Sprint 2 alone is 66–99h, Sprint 5 is 86–123h. Each release blocks on multiple modules being ready.

Thin slicing aims for **~25–50h releasable units** that:

- Land independently. Each version is a complete, shippable, useful thing.
- Don't block on cross-team coordination unless explicitly needed.
- Build on what came before — the previous version's surfaces stay live.
- Can be re-ordered without breaking the IA. Hard dependencies are called out per-version.

Total v1+ effort matches the Claude-assisted estimate from `effort-estimate-with-claude.md` (~360–500h for the equivalent of original Sprints 1–6). Slicing redistributes effort, doesn't add to it.

---

## Version sequence

### v0.5 — IA Rehome + In-Progress Integration

**Effort:** ~30–46h
**Blocks on:** nothing — but coordinates with the in-progress NCE v2 build for the QMS pillar destination URL
**Ships:** No net-new features. Gives every QA-adjacent existing/in-progress surface a coherent home so v1+ can land on a stable IA, and so the Madagascar GRIST UAT can pass.

Scope (per `qa-v0.5-frs.md`):
- New top-level **Quality Assurance** sidenav group with three pillars (Statistical QC, EQA, QMS & Improvement).
- **Statistical QC pillar** — QC Dashboard + QC Alerts (rehomed from `/analyzers/qc/db`); Reagent QC + Analyzer Manual QC as FUTURE placeholders cross-linking to design docs on GitHub (per Piotr's four-QC-feature framing).
- **EQA pillar** — existing EQA pages rehomed from `/eqa/...` to `/qa/eqa/...`.
- **QMS pillar** — NCE Register (destination URL for in-progress NCE v2); Audit Trail rehomed from Admin (cross-link preserved).
- 301 redirects from legacy URLs.
- 4 new visibility-only permission keys (`qa.view.overview`, `qa.view.qc`, `qa.view.eqa`, `qa.view.qms`).
- Madagascar GRIST UAT alignment: LO-07-02 PASS, LO-07-03 SPLIT (EQA pass + 2 PARTIAL with design-doc refs), LO-07-04 PASS.

**Customer-visible value:** "Every QA feature lives in one menu. The four-QC-feature framing is preserved from day one. UAT testers can pass the Madagascar QC reqs with documented Round-2 rewrites."

Out of scope (deferred to v1+): QA Overview, QI Dashboard, E-Sig Log, Accreditation, NCE modernization beyond what NCE v2 ships.

---

### v1 — QA Overview placeholder + QI Dashboard MVP

**Effort:** ~45–55h
**Blocks on:** nothing
**Ships:** A working Quality Assurance sidenav with the QI Dashboard MVP populated. Other pillars visible as "coming soon" placeholders.

Scope:
- New top-level **Quality Assurance** sidenav group with the four pillar nodes (Statistical QC / EQA / Quality Indicators / QMS & Improvement) — three of them rendering placeholder pages.
- **QA Overview** landing page with four pillar tiles. QI tile is live (rolls up from the QI Dashboard MVP); other three render gray "coming soon" with deep-links to existing surfaces (Validation, EQA, NCE) where applicable.
- **QI Dashboard MVP** with four tiles (TAT Compliance, Rejection Rate, Amendment Rate, NCE Pulse) per `qa-mvp-kpi-rollup-outline.md`.
- **Three new wrappers**: `/rest/reports/tat/compliance`, `/rest/qi/rejection-rate`, `/rest/qi/amendment-rate`.
- NCE Pulse tile uses existing `/rest/nce/dashboard` with client-side filter (no new wrapper).
- **Permission registry** — `qa.view.overview`, `qa.view.qi`, `qa.manage.qi` registered in the flexible-roles engine. Other pillar permissions registered as no-ops (locked-out by default).
- **QA Officer default role** — pre-bundled with v1 permissions only.

Out of scope (in later versions):
- NCE menu rehome (URL stays at `/nce/...` for now; the QMS pillar's NCE Register node deep-links to the existing legacy URL).
- Audit Trail rehome.
- Any pillar functionality beyond the QI Dashboard MVP.
- QI Configuration admin page.
- Critical Callback Compliance.

**Customer-visible value:** "We have a Quality Assurance menu and four KPI tiles."

---

### v2 — Electronic Signature Log + Test Accreditation Management

**Effort:** ~25–35h core team + community contribution for accreditation
**Blocks on:** v1 IA skeleton merged. Most of the original v2 rehome scope (NCE rehome, Audit Trail rehome, Westgard rehome) **moved to v0.5**.
**Ships:** Electronic Signature Log + Test Accreditation Management surfaces.

Scope:
- **Electronic Signature Log** built per outline (small thanks to unified `electronic_signature` table audit). Reads `electronic_signature` directly with `record_type` filter; CSV/PDF export.
- **Test Accreditation Management** per the existing `test-accreditation-frs.md` (uploaded reference). Two new admin pages under Test Catalog Management:
  - **Accrediting bodies** (CRUD with logo + per-body expiration + logo visibility mode) — `/admin/test-catalog/accreditation/bodies`
  - **Test accreditations** (pivot view; read-only; bulk-remove) — `/admin/test-catalog/accreditation/test-accreditations`
  - Conditional logo rendering on patient reports + automated notes line.
  - **Community may lead this build** — the spec is fully ready (`test-accreditation-frs.md` v5), the mockup exists (`test-accreditation-mockup.jsx`), and the HTML preview exists (`test-accreditation-preview.html`). This is a self-contained admin feature that's a good fit for community contribution.

Out of scope:
- Lab-attested accreditation registry under QMS (the earlier v3 design — superseded by Test Accreditation Management approach, which models accreditation by body + per-test enrollments rather than a self-attested record).

**Customer-visible value:** "Inspectors get the signature log they ask for. Labs can configure which accrediting bodies they hold and which tests are accredited under each, with automatic logo rendering on reports."

---

### Westgard Phase 2 (slot pending — coordinated with NCE v2 scope)

**Effort:** ~25–35h core team (or split across community contributors)
**Blocks on:** NCE v2 scope confirmation. If NCE v2 wires up trigger #10 (QC invalidation → auto-NCE), item 1 below resolves with NCE v2 and this slot shrinks. If not, item 1 ships here as a small follow-up.
**Ships:** Three small functional gaps in the existing Westgard / QC Dashboard module, identified via 2026-05-04 code audit. No new pillar; extends the existing `/qa/qc/dashboard` and `/qa/qc/alerts` surfaces. Could ship as a single PR or as three independent ones.

Scope:
1. **Auto-create NCE on critical QC violations** (~6–10h). Today, a 1-3s violation is recorded in `qc_rule_violation` but doesn't auto-create an NCE — the QA Officer has to notice and file manually. Per NCE FRS v3.1, trigger #10 ("QC invalidation from Westgard") is specced for this; it just needs to be wired up. If NCE v2 covers it, this collapses; if not, this is the highest-leverage gap to close.
2. **QC reporting / trend export** (~10–15h). Charts render on screen but no CSV/PDF export, no monthly QC summary report, no trend API. CAP / SANAS inspectors regularly ask for monthly QC summaries and today the lab has to take screenshots. Self-contained feature; **good community contribution candidate** — bounded scope, clear inputs (existing `qc_rule_violation` + `qc_control_lot` + `analyzer_results` data), clear output (CSV format + JasperReports PDF template).
3. **Statistical-method completion + sigma metrics** (~8–12h). Today: ROLLING mean/SD recalc logic exists but isn't fully integrated into rule evaluation; MANUFACTURER_FIXED hardcoded values lack a UI for manual entry; no sigma calculation. Phase 2 completes the integration and adds basic sigma display (`sigma = (TEa − bias) / CV`). Sigma metrics are nice-to-have for advanced/sigma-tier labs; basic completion of statistical methods is the core value here.
4. **Active-violations alert banner above summary tiles** (~4h, layout fix from 2026-05-04 UI audit). Today, the QC Dashboard summary tiles show *counts* of violations (In Control / Warning / Out of Control) but the QA Officer has to click into the Instruments or Alerts tab to see *which* analyzers are actually in violation. A simple collapsible banner above the summary tiles showing the top 3–5 unacknowledged violations (Instrument · Test · Rule · Timestamp · Severity · Acknowledge button) closes the gap with one component. Conditionally rendered when `unacknowledged_violations > 0`. Highest layout-leverage change identified in the UI audit.

**Customer-visible value:** "Critical QC violations auto-create NCEs (closes the QC ↔ QMS workflow loop). Inspectors can pull monthly QC summary reports without screenshots. Sigma performance is visible per test. The dashboard surfaces *which* analyzers are in violation without a tab click — the QA Officer's most common daily question."

Out of scope (stays parked indefinitely):
- Patient-based QC / moving averages (CLSI EP25). Almost no LIMS has this; post-v3+ if ever.
- Cross-instrument peer comparison. Niche; defer.
- Dynamic rule recommendation (auto-suggest rule changes based on sigma). Advanced; defer.
- Lot-expiration-soon dashboard indicator. Surfaced as a minor weakness in the UI audit; would address by adding lot-expiry rollup to the summary tiles. Worth doing if a partner lab asks; otherwise wait for natural touch.

---

### v3 — Reconsider scope post-NCE-v2

**Effort:** TBD
**Blocks on:** NCE v2 actual scope confirmed (currently in progress).
**Ships:** Whatever NCE work didn't make NCE v2's scope, or rolls forward to a different version.

The original v3 (lab-attested Accreditation Status registry) was superseded by moving Test Accreditation Management to v2. The original v4 (NCE Register modernization), v5 (NCE Create/Report flow), and v6 (NCE Analytics) may collapse into v0.5/NCE v2 scope depending on what NCE v2 actually delivers.

**Action item before v3 planning:** confirm NCE v2 scope with Piotr / Mozzy (open question §11.2.1 of `qa-v0.5-frs.md`).

---

### v4 — NCE Register modernization

**Effort:** ~40–50h
**Blocks on:** v2 (URL re-rooting in place).
**Ships:** Modern NCE Register UI replaces the legacy view at the rehomed URL.

Scope:
- NCE Register list + filter + detail per NCE FRS v3.1.
- Five views: My Assignments / All NCEs / Pending Verification / Report NCE (link only — form is v5) / Analytics (link only — page is v6).
- Inline row expansion with tabs (Event Details / Investigation / CAPA(n) / History).
- Row actions and batch actions per FRS.
- Summary cards (Critical / Major / Minor / Overdue).

Out of scope:
- Create / Report flow (v5).
- Analytics page (v6).
- CAPA Register (v7).

**Customer-visible value:** "NCE list and detail are modernized. Same data, much better UX."

---

### v5 — NCE Create/Report flow

**Effort:** ~30–40h
**Blocks on:** v4 (Register lives under modern UI).
**Ships:** Modern NCE creation flow with 11 trigger points wired in.

Scope:
- NCE Report form per FRS v3.1 §5.
- 11 trigger points: sample rejection, partial rejection, result rejection w/wo retest, test cancellation, order cancellation, referral rejection, pathology, QC invalidation, disposal.
- Context preloading from triggering artifact.
- Inline form (no modal) per OpenELIS sidenav-submenus convention.
- Update Results Entry "Report NCE" button to point at the new form (button itself stays; v9 swaps it for the inline panel).

Out of scope:
- Inline NCE form on Results Entry page (v9 — Phase-1 button stays for now).

**Customer-visible value:** "All 11 NCE trigger points work; the Report NCE button writes through the modern flow."

---

### v6 — NCE Analytics page

**Effort:** ~30–40h
**Blocks on:** v4 (NCE Register in place); v5 helpful but not required.
**Ships:** 4 KPI cards, 9 charts, 6 reports per `nce-analytics.md` v3.0.

Scope:
- 4 KPI tiles (Total NCEs / Avg Resolution / CAPA Effectiveness / Recurrence Rate).
- 9 charts (Pareto, trend, category breakdown, severity breakdown, trigger breakdown).
- 6 formal reports (Summary, CAPA Effectiveness, Root Cause, User Performance, Trend Analysis, Rejection Quality).
- Lives under QA → QMS → NCE Register → Analytics (per qa-menu IA).

**Customer-visible value:** "Lab leadership has a real NCE/CAPA analytics dashboard."

---

### v7 — CAPA Register

**Effort:** ~25–35h
**Blocks on:** v4 (uses the same NCE infrastructure); could land before v6 if priorities shift.
**Ships:** Standalone CAPA list per `capa-register-outline.md` (with the post-Q&A scope additions).

Scope:
- 5 summary tiles (In Progress / Pending / Overdue / Pending Effectiveness Review / Completed last 90d).
- Filter/sort by all documented dimensions.
- Row expansion with effectiveness review status.
- Bulk reassign + bulk Mark-Complete (single shared note).
- Drill-through to parent NCE.
- Linked-recurrence badge on closed-recurrence parents.

**Customer-visible value:** "QA Officer has a single view of all CAPAs across all NCEs."

---

### v8 — QI Dashboard full + QI Configuration + Pillar-3 detail pages

**Effort:** ~50–60h
**Blocks on:** v1 (QI MVP exists for the swap).
**Ships:** Full Pillar-3 functionality replacing the MVP in place.

Scope:
- QI Dashboard full version replaces MVP at the same URL (in-place swap; user prefs persist).
- QI Configuration admin page per `qi-configuration-outline.md`.
- Disable cascade implementation (tile/detail/alerts/NCE auto-gen all respect the toggle).
- Per-test override table on Rejection Rate.
- Detail pages for Rejection Rate + Amendment Rate (heatmap, Pareto, per-test breakdown).
- TAT tile keeps deep-linking to existing TAT report.

Out of scope:
- Critical Callback Compliance (v9).

**Customer-visible value:** "QIs are fully configurable; detail pages have heatmaps and Pareto analysis."

---

### v9 — Critical Callback Compliance opt-in

**Effort:** ~30–40h
**Blocks on:** v8 (QI Configuration page exists for the toggle); v5 (NCE Create flow handles the new subcategory).
**Ships:** Optional fourth Pillar-3 QI for labs that perform critical-result callbacks.

Scope:
- Schema audit confirmed (CC-Q1) — schema may need extension for caller / recipient / read-back / ack-time fields.
- Migration if needed.
- NCE Report FRS v3.2 sub-revision adding the Critical Callback Failure subcategory + trigger.
- QI tile + detail page.
- Disabled by default in QI Configuration; labs opt-in.

**Customer-visible value:** "Labs that need to track critical-result callback compliance now can."

---

### v10 — EQA V2 part 1: cycle/scheme model + participant + lab performance

**Effort:** ~45–55h
**Blocks on:** EQA V2 spec corpus is implementation-ready (currently specced but not yet built per memory entry).
**Ships:** Cycle/scheme data model + 2 of 5 EQA V2 stories.

Scope:
- New cycle/scheme tables + migrations (model arrives with V2 build).
- **My EQA** (participant view).
- **EQA Lab Performance** dashboard (renamed from "Lab Performance Dashboard" per DEC07).
- `/rest/eqa/cycles/latest-performance` wrapper.
- QA Overview EQA tile lights up; Q2 of the five-question strip lights up.

Out of scope (deferred to v11):
- Follow-Up Queue.
- Analyst Competency.
- EQA Program Management rehome.

**Customer-visible value:** "Participants can submit PT and see their performance scorecard; labs see cumulative performance across cycles."

---

### v11 — EQA V2 part 2: oversight tools

**Effort:** ~40–50h
**Blocks on:** v10.
**Ships:** Remaining 3 EQA V2 stories.

Scope:
- **Follow-Up Queue** (failed-cycle actions tracked to resolution).
- **Analyst Competency** (per-analyst competency per test; auto-suspension triggers on failure).
- **EQA Program Management** rehome (`eqa.provider`-scoped visibility).

**Customer-visible value:** "EQA oversight surfaces are fully built. Provider-side scoping respected."

---

### v12 — Results Entry inline NCE upgrade

**Effort:** ~10–15h
**Blocks on:** v5 (NCE Create flow exists — handler swap targets the new inline panel from `nce-results-entry.md` v3.0).
**Ships:** Swaps the interim "Report NCE" button on Results Entry for the full inline panel.

Scope:
- Sample Action radios (Continue with NCE flag / Reject sample) at point-of-capture.
- Auto-delta-check panel.
- Mandatory trigger #4 (result rejection without retest) cannot be dismissed.
- NCE flag badge on result rows with linked NCEs.
- QA Officer training material refresh (small).

**Customer-visible value:** "Analysts get the full v3.0 inline NCE experience at point of capture."

---

### v13+ — Original v2 backlog

Deferred items from `qa-menu-roadmap.md` §11:

- QC Lot Management.
- Accreditation Binder PDF export.
- Time-boxable Inspector/Auditor credentials.
- Multi-site / multi-lab rollup.
- Document Control module.
- Equipment Management module.
- Risk Register.
- Internal Audit Tracker (full version).

Each of these is a candidate v13, v14, v15, … to be sequenced based on customer demand.

---

## Total v0.5–v12 effort summary

| Version | Effort (h) | Cumulative (h) | Notes |
|---|---|---|---|
| **v0.5 — IA Rehome + In-Progress Integration** | **30–46** | **30–46** | NEW — supersedes most of original v2 rehome scope |
| v1 — QA menu + KPI MVP | 45–55 | 75–101 | Unchanged scope; lands on v0.5 IA |
| v2 — E-Sig Log + Test Accreditation Management | 25–35 (core) | 100–136 | Reduced — most rehomes moved to v0.5; community may lead accreditation |
| v3 — TBD post-NCE-v2 | TBD | — | Reconsider once NCE v2 scope is confirmed |
| v4–v7 — Reconsider | TBD | — | NCE Register modernization / Create flow / Analytics / CAPA Register may collapse into NCE v2 |
| v8 — QI Dashboard full + Config + details | 50–60 | — | Unchanged |
| v9 — Critical Callback opt-in | 30–40 | — | Unchanged |
| v10 — EQA V2 part 1 | 45–55 | — | Unchanged |
| v11 — EQA V2 part 2 | 40–50 | — | Unchanged |
| v12 — Results Entry inline | 10–15 | — | Unchanged |

**Total: TBD pending NCE v2 scope clarification.** Pre-NCE-v2 versions (v0.5 + v1 + v2 + v8 onwards) total ~275–355h core team, with possible community contribution on v2's accreditation work reducing core team load by ~15–25h.

Average slice: **~30–50h** for confirmed versions. NCE-related versions (v3–v7) await NCE v2 scope confirmation before re-estimating.

---

## Re-ordering

The slice graph is mostly linear with a few flexible orderings:

- **v3 (Accreditation Status) can ship before v2 (NCE rehome + Audit Trail rehome)** if customers ask. v3 doesn't depend on v2; it's just listed second because v2 is faster value to ship.
- **v6 (NCE Analytics) can swap with v7 (CAPA Register)** depending on whether QA Officers ask first for analytics or for the CAPA list.
- **v9 (Critical Callback) can be deferred indefinitely** if no customer asks. It's an opt-in feature.
- **v10 + v11 (EQA V2)** are gated by EQA V2 spec corpus being implementation-ready. If that's not the case at the time we get there, both versions slide.

Hard dependencies (must-not-reorder) are called out per-version above.

---

## How this changes the existing artifacts

1. **`qa-menu-roadmap.md`** — keep for context (the 6-sprint structure remains the conceptual organization). Add a header note pointing to this versioning plan as the canonical delivery sequence.
2. **`qa-menu-roadmap.xlsx`** — Sprint Plan rows get a new `Version` column mapping each row to v1–v12.
3. **`qa-mvp-kpi-rollup-outline.md`** — content unchanged but it's now the v1 spec (was Sprint 2-MVP).
4. **`effort-estimate-with-claude.md`** — keep for sprint-level estimate; add a note pointing to this versioning plan for the per-version breakdown.
5. **All other outline files** — content unchanged; their version assignment is documented in this plan.

---

## Revision history

| Version | Date | Notes |
|---|---|---|
| 0.1 | 2026-04-23 | Initial thin-slice plan. v1 = QA menu + QA Overview placeholder + QI Dashboard MVP (~50h). 12 slices total, ~33–43h average. Total ~400–510h matches original 6-sprint estimate. |
| 0.2 | 2026-05-01 | Inserted **v0.5** before v1 per user request: IA-rehome version that consolidates existing + in-progress QA features (Westgard / EQA / NCE v2 / Audit Trail) plus FUTURE-feature placeholders for Reagent QC + Analyzer Manual QC (per Piotr's four-QC-feature framing). Madagascar GRIST UAT alignment baked in. v2 reframed: Test Accreditation Management (per `test-accreditation-frs.md`) replaces the lab-attested-registry approach; community may lead the build. v3–v7 marked TBD pending NCE v2 scope clarification. |
