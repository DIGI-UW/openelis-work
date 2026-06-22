# OpenELIS QA Release — Plan & Staffing

**Date:** 2026-05-04
**Author:** Casey Iiams-Hauser
**Purpose:** A single document that organizes every QA-related work item we have specced — v0.5, v1 MVP, v2, Westgard Phase 2, v8, v9, v10–v11, v12, plus parked items — into priority phases so we get the highest-value pieces first, ship something working early, and end on "great ifs we can pick up later."

The plan applies the same staffing lens used in the Westgard Phase 2 FRS (§11): each item is classified by who should realistically do it (senior dev, junior dev, community, or "wait & see").

---

## Executive summary

Five phases from "ship something working" to "wait until we hear demand":

| Phase | Theme | Cumulative hours (core team) | Customer-visible value |
|---|---|---|---|
| **A — Foundation** | Make the QA menu real and ship one operational dashboard | ~85–110h | "There's a Quality Assurance menu now. The KPI dashboard tells me what's drifting today." |
| **B — Core Value** | Close workflow loops + add the second daily-useful surface | ~70–95h add (155–205h cumulative) | "Critical violations create NCEs automatically. Inspectors can pull the signature log they ask for." |
| **C — Add-ons** | Modernize what's currently legacy + add depth | depends on NCE v2 scope; estimate ~80–130h add | "The NCE workflow is modern Carbon. CAPA register exists. QI Dashboard is configurable." |
| **D — Community / nice-to-have** | Self-contained scope work that doesn't need senior hours | ~30–50h core (much less if community contributes) | "Inspectors stop asking for screenshots. EQA V2 surfaces are built." |
| **E — Wait & see** | Don't invest until a customer asks | 0h until trigger | (parked) |

**Recommended starting point:** Phase A only. ~85–110h core team. That's a complete-feeling QA menu (rehomed pillars + IA + a daily KPI dashboard + the four-QC-feature framing visible in the IA). Everything else builds from there. If hours run out at Phase A, the system is meaningfully better than today and nothing is half-built.

---

## Staffing key

| Role | What they do |
|---|---|
| **Senior** | Cross-module changes, service / business logic, workflow / state-machine work, schema design, code that needs to be right the first time |
| **Junior** | Frontend components matching established patterns, simple read-side endpoints, conditional rendering, forms, tests, documentation |
| **Mid** | Backend extensions in a single module, JasperReports template work, REST controllers that don't touch state machines |
| **Community** | Self-contained scope, well-documented spec, bounded inputs and outputs, no service-layer changes (or changes already reviewed and merged) |
| **Wait & see** | Parked indefinitely; un-park only when a specific customer trigger fires |

Where work splits, the table shows multiple rows per item.

---

## Phase A — Foundation

**Goal:** ship a complete-feeling QA menu with one working operational dashboard. After this phase, the QA menu exists, the rehomed pages live in their natural home, and a QA Officer has one new page (the QI Dashboard) that's worth opening every morning.

**Cumulative hours:** ~85–110h. **Senior:** ~22–32h. **Junior:** ~50–62h. **Mid:** ~13–16h.

### A.1 — v0.5 IA Rehome (~30–46h)

Detailed in `qa-v0.5-frs.md`. Why it's first: unblocks Madagascar GRIST UAT (LO-07-02 / -03 / -04) and gives every later version a stable container to land in.

| # | Sub-task | Hours | Senior | Junior | Mid | Community |
|---|---|---|---|---|---|---|
| A.1.1 | Top-level QA sidenav group + IA wiring | 4–6h | review only | ✅ owns | — | — |
| A.1.2 | Three pillar landings (`<QualityAssurancePillarLanding />`) | 4–6h | — | ✅ owns | — | — |
| A.1.3 | Two FUTURE-feature placeholders | 2–3h | — | ✅ owns | — | — |
| A.1.4 | Route mounts at new paths | 4–6h | — | ✅ owns | — | — |
| A.1.5 | 301 redirects for legacy URLs | 2–3h | — | — | ✅ owns | — |
| A.1.6 | Permission registry (4 visibility-only keys) | 3–5h | — | — | ✅ owns | — |
| A.1.7 | Hide legacy entry points | 2–3h | — | ✅ owns | — | — |
| A.1.8 | Madagascar GRIST UAT step rewrites + fixture seed | 3–5h | — | — | ✅ owns | — |
| A.1.9 | Tests | 4–6h | — | ✅ owns | — | — |
| A.1.10 | Cross-team PR review iteration | 2–3h | ✅ time | — | — | — |

**Customer-visible value:** "Every QA-adjacent feature now lives under one Quality Assurance menu. Old links still work. Madagascar UAT can pass."

### A.2 — v1 MVP (~45–55h)

Detailed in `qa-v1-mvp-frs.md`. Why it's in Phase A: ships the first net-new operational surface (the QI Dashboard MVP). Sara's morning page from `qa-qc-narrative.md` Act 6.

| # | Sub-task | Hours | Senior | Junior | Mid | Community |
|---|---|---|---|---|---|---|
| A.2.1 | NCE FRS v4.0 implementation (URL re-rooting, breadcrumb update, 301s) | 6–8h | — | — | ✅ owns | — |
| A.2.2 | QA Overview daily-focused landing page (Attention center + Today + This Week + Pillars + Activity) | 10–14h | review only | ✅ owns | — | — |
| A.2.3 | `/rest/qi/rejection-rate` wrapper | 3–4h | ✅ owns | — | — | — |
| A.2.4 | `/rest/qi/amendment-rate` wrapper | 3–4h | ✅ owns | — | — | — |
| A.2.5 | `/rest/reports/tat/compliance` wrapper (returns aggregate avg in v1; threshold param reserved for v8) | 2–3h | ✅ owns | — | — | — |
| A.2.6 | QI Dashboard MVP frontend (4 tiles + header strip + drill-through routing) | 12–16h | — | ✅ owns | — | — |
| A.2.7 | Detail-page placeholders × 3 (TAT lab-unit drill, Rejection, Amendment) | 8–11h | — | ✅ owns | — | — |
| A.2.8 | NCE Pulse client-filter logic | 1h | — | ✅ owns | — | — |
| A.2.9 | QA Officer default role bundling | 2–3h | — | — | ✅ owns | — |
| A.2.10 | Tests | 4–6h | — | ✅ owns | — | — |
| A.2.11 | Cross-team PR review (TAT module owners) | 2–3h | ✅ time | — | — | — |

**Customer-visible value:** "QA Overview shows me what needs me today + what's trending. The QI Dashboard tells me TAT, Rejection Rate, Amendment Rate, and NCE Pulse at a glance."

### Phase A summary

**Hours:** 85–110h core team total.
- Senior: ~22–32h (mostly the 3 wrappers + cross-team review + reviews)
- Junior: ~50–62h (mostly the QI Dashboard frontend + QA Overview frontend + IA wiring)
- Mid: ~13–16h (NCE FRS v4.0 implementation + permission registry + redirects)

**What ships:** new top-level QA menu, three pillars, four KPI tiles, daily-focused QA Overview, all rehomed pages still working at their old + new URLs, four FUTURE-feature placeholders signaling roadmap, Madagascar UAT passes.

**What's still missing after Phase A:** automatic NCE creation on QC violations, signature log, accreditation management, full QI configuration, Critical Callback, EQA V2, modern NCE register. All of those are Phase B+ work.

---

## Phase B — Core Value

**Goal:** close the QC ↔ QMS workflow loop and add the inspector-facing pieces partner labs ask about most. After Phase B, critical events propagate automatically through the system, and inspectors get the e-signature log they expect.

**Cumulative hours:** ~70–95h add (155–205h cumulative). **Senior:** ~35–48h add. **Junior:** ~25–35h add. **Mid:** ~10–12h add.

### B.1 — Westgard Phase 2 Tier 1 (~10–14h)

Detailed in `qa-westgard-phase2-frs.md` §3. Why it's in Phase B: closes the QC ↔ QMS workflow loop with the smallest possible investment.

| # | Sub-task | Hours | Senior | Junior | Mid | Community |
|---|---|---|---|---|---|---|
| B.1.1 | Active-violations alert banner (frontend) | 4h | review | ✅ owns | — | ✅ alt |
| B.1.2 | Auto-create NCE on critical violations (backend service hook) | 5–8h | ✅ owns | — | — | — |
| B.1.3 | Auto-NCE link card on violation detail (frontend) | 1–2h | review | ✅ owns | — | ✅ alt |

**Customer-visible value:** "Critical QC violations now create NCEs automatically. The dashboard surfaces violations without making me click into a tab."

### B.2 — v2 Electronic Signature Log (~10–15h)

Detailed in `electronic-signature-log-outline.md`. Why Phase B: inspector ask + the audit revealed a single-table query (down from the original 4-table union estimate).

| # | Sub-task | Hours | Senior | Junior | Mid | Community |
|---|---|---|---|---|---|---|
| B.2.1 | Backend single-table query against `electronic_signature` | 1–2h | — | ✅ owns | — | ✅ alt |
| B.2.2 | CSV export (RFC-4180 streaming) | 2–3h | — | ✅ owns | — | ✅ alt |
| B.2.3 | PDF export (JasperReports template) | 2–3h | — | — | ✅ owns | ✅ if JR experience |
| B.2.4 | Frontend filterable table + row expansion + pagination | 5–7h | — | ✅ owns | — | — |

**Customer-visible value:** "Inspectors get the e-signature log they ask for, with CSV and PDF export. Login + config-change events deliberately excluded — that lives on Audit Trail."

### B.3 — Confirm NCE v2 scope, then sequence v3–v7 (TBD)

Why Phase B: the NCE v2 build (in progress per Piotr) determines how much of the originally-planned v4 (NCE Register modernization), v5 (NCE Create/Report flow), v6 (NCE Analytics), and v7 (CAPA Register) collapses into NCE v2 vs. ships separately.

**Action item:** ~30 min meeting with Piotr / Mozzy to confirm NCE v2 scope. Possible outcomes:
- **All four collapse into NCE v2** → v3–v7 ship via NCE v2 with no extra Phase B/C work from us.
- **Only register modernization is in NCE v2 scope** → v5, v6, v7 remain. ~95–115h additional core team work post-NCE-v2.
- **Just NCE register CRUD** → v4, v5, v6, v7 all need separate scoping. Heaviest case: ~125–165h additional.

**No estimate locked** until the meeting happens. Phase B as estimated above stands; the NCE-related work goes into Phase C with effort TBD.

### Phase B summary

**Hours added on top of Phase A:** 20–29h confirmed (Westgard Tier 1 + E-Sig Log) + TBD for NCE work depending on scope confirmation.
- Senior: ~5–10h add
- Junior: ~13–18h add
- Mid: ~2–3h add

**What ships:** automatic NCE creation on QC violations · alert banner above QC summary tiles · Electronic Signature Log with exports.

**Cumulative core team after Phase B (excluding TBD NCE work):** ~105–139h.

---

## Phase C — Add-ons

**Goal:** add the depth pieces — full QI configuration, NCE register modernization (or whatever NCE v2 didn't cover), CAPA register, statistical-method completion. After Phase C, the QA menu is feature-complete for routine clinical use.

**Cumulative hours:** depends heavily on NCE v2 scope. Estimate range: ~80–130h add (235–335h cumulative).

### C.1 — Westgard Phase 2 Tier 2 (~8–12h)

Detailed in `qa-westgard-phase2-frs.md` §4. Why Phase C: completes existing partial work in the rule evaluator + adds inspector-relevant sigma metrics. Lower urgency than Phase B's NCE auto-create.

| # | Sub-task | Hours | Senior | Junior | Mid | Community |
|---|---|---|---|---|---|---|
| C.1.1 | Stat-method completion (rule-evaluator integration) | 4–6h | ✅ owns | — | — | — |
| C.1.2 | MANUFACTURER_FIXED entry form (frontend) | 2–3h | review | ✅ owns | — | — |
| C.1.3 | `SigmaMetricsService` (backend) | 2–3h | ✅ owns | — | — | — |
| C.1.4 | Sigma display tile on ControlChartDetail | 1–2h | — | ✅ owns | — | — |

**Customer-visible value:** "All three statistical methods drive rule evaluation. Sigma performance is visible per test."

### C.2 — v3 / v4 / v5 / v6 / v7 — NCE-related work (effort TBD)

If NCE v2 doesn't cover everything, the following items (in dependency order) ship in Phase C:

- **v4 — NCE Register modernization** (~40–50h). Modern Carbon UI replacing legacy NCE Register. Senior backend (NCE service refactor) + senior/mid frontend (modern register UI per FRS v3.1).
- **v5 — NCE Create/Report flow** (~30–40h). 11 trigger points wired up with the inline form. Senior backend (trigger logic) + junior frontend (forms).
- **v6 — NCE Analytics page** (~30–40h). 4 KPIs + 9 charts + 6 reports. Mid backend (analytics queries) + junior frontend (chart rendering with the Carbon-blessed library).
- **v7 — CAPA Register** (~25–35h). View over existing `nce_capa` data. Mid backend + junior frontend.

**These slot into Phase C only if NCE v2 leaves them on the table.** If NCE v2 covers any subset, Phase C shrinks accordingly.

### C.3 — v8 QI Dashboard full + Configuration + per-QI detail pages (~50–60h)

Why Phase C: replaces the v1 MVP dashboard in place + adds configurability + adds the optional Critical Callback Compliance fifth tile.

| # | Sub-task | Hours | Senior | Junior | Mid | Community |
|---|---|---|---|---|---|---|
| C.3.1 | QI Configuration admin page (toggles + per-test override table) | 10–14h | — | ✅ owns | — | — |
| C.3.2 | Disable cascade implementation (across QI Dashboard / Alerts / NCE auto-gen / recompute) | 6–8h | ✅ owns | — | — | — |
| C.3.3 | Three full per-QI detail pages (Rejection Rate heatmap+Pareto+per-test, Amendment Rate, TAT Compliance) | 24–32h | — | ✅ owns | — | — |
| C.3.4 | TAT compliance threshold parameter wiring (extend wrapper to compute pass/fail when `thresholdHours` passed) | 2–3h | ✅ owns | — | — | — |
| C.3.5 | Tests | 8–10h | — | ✅ owns | — | — |

**Customer-visible value:** "I can configure which QIs the lab tracks + their thresholds. Detail pages show heatmaps + Pareto + per-test breakdowns."

### Phase C summary

**Hours added (excluding NCE TBD):** ~58–72h.
**With NCE TBD work:** ~150–200h add.
- Senior: ~22–35h add (Westgard Tier 2 + disable cascade + TAT threshold wiring + NCE service refactors if applicable)
- Junior: ~36–37h add (QI configuration + per-QI detail pages + tests + frontends for NCE-related items if applicable)

**What ships:** sigma metrics · QI Configuration admin page · per-QI detail pages with heatmaps · whatever NCE work landed.

---

## Phase D — Community-ideal & nice-to-have

**Goal:** the bounded-scope work that's perfect for community contribution + the items that are valuable but not on the critical path. After Phase D, the system is feature-complete including the items partner labs occasionally ask about (EQA V2, accreditation management, reporting export).

**Cumulative hours (core team):** ~30–50h add. **With community contribution:** much less.

### D.1 — v2 Test Accreditation Management (~community-led)

Spec is fully ready in `test-accreditation-frs.md` v5 (uploaded by user). Mockup exists. HTML preview exists. Schema is small (`accrediting_body` + `test_accreditation`). Self-contained admin feature. **Best community contribution candidate in the entire roadmap.**

| # | Sub-task | Hours | Senior | Junior | Mid | Community |
|---|---|---|---|---|---|---|
| D.1.1 | Accrediting Bodies admin page (CRUD with logo + per-body expiration + visibility mode) | 12–18h | — | — | review | ✅ ideal |
| D.1.2 | Test Accreditations pivot page (read-only with bulk-remove + deep-link) | 8–12h | — | — | review | ✅ ideal |
| D.1.3 | Backend: 2 new tables + endpoints + audit logging | 6–10h | review | — | — | ✅ ideal |
| D.1.4 | Patient report rendering: conditional logo + notes line | 4–6h | review | — | — | ✅ ideal (with JR knowledge for templates) |

**Customer-visible value:** "Labs can declare accrediting bodies, enroll tests under them, and reports auto-render the logos."
**Effort if community leads:** ~0h core team, ~3–5h reviews.
**Effort if core team leads:** ~30–46h.

### D.2 — Westgard Phase 2 Tier 3 — QC reporting / trend export (~10–15h)

Detailed in `qa-westgard-phase2-frs.md` §5. Self-contained. Good fit for community.

| # | Sub-task | Hours | Senior | Junior | Mid | Community |
|---|---|---|---|---|---|---|
| D.2.1 | Run Detail CSV (streaming) | 3–4h | — | ✅ owns | — | ✅ ideal |
| D.2.2 | Violations Log CSV (with NCE join) | 2–3h | — | ✅ owns | — | ✅ ideal |
| D.2.3 | Monthly Summary PDF (JasperReports template) | 4–5h | — | — | ✅ owns | ✅ if JR experience |
| D.2.4 | Trend Report PDF (JasperReports template) | 3h | — | — | ✅ owns | ✅ if JR experience |
| D.2.5 | Export menu UI (dropdown + parameter modal) | 2h | — | ✅ owns | — | ✅ alt |

**Customer-visible value:** "Inspectors stop asking for screenshots. Lab can export monthly QC summaries, run details, and violations logs."

### D.3 — v9 Critical Callback Compliance opt-in (~30–40h)

Detailed in `qi-critical-callback-compliance-outline.md`. Why Phase D: opt-in feature with default OFF; nobody is currently asking for it; depends on schema audit (CC-Q1) that may surface a migration.

| # | Sub-task | Hours | Senior | Junior | Mid | Community |
|---|---|---|---|---|---|---|
| D.3.1 | Schema audit + possible migration (caller / recipient / read-back / ack-time) | 4–8h | ✅ owns | — | — | — |
| D.3.2 | NCE Report FRS v3.2 sub-revision (Critical Callback Failure trigger) | 3–4h | ✅ owns | — | — | — |
| D.3.3 | Critical Callback wrapper endpoint | 4–6h | ✅ owns | — | — | — |
| D.3.4 | QI Configuration page: opt-in toggle + per-test target | 3–4h | — | ✅ owns | — | — |
| D.3.5 | Critical Callback tile + detail page | 12–16h | — | ✅ owns | — | — |
| D.3.6 | Tests | 4–6h | — | ✅ owns | — | — |

**Customer-visible value:** "Labs that perform critical-result callbacks can opt in to track compliance with the same dashboard pattern as other QIs."

### D.4 — v10–v11 EQA V2 (~85–105h, biggest single chunk)

Specced but not built. Heavy from-scratch work for the cycle/scheme model + 5 EQA stories. **Worth considering whether community could lead this** — the spec is mature, the design exists, and EQA is a self-contained module.

| # | Sub-task | Hours | Senior | Junior | Mid | Community |
|---|---|---|---|---|---|---|
| D.4.1 | Cycle / scheme data model + migrations | 8–12h | ✅ owns | — | — | maybe |
| D.4.2 | My EQA participant view | 14–20h | — | ✅ owns | — | maybe |
| D.4.3 | EQA Lab Performance dashboard | 16–22h | — | ✅ owns | — | maybe |
| D.4.4 | Follow-Up Queue | 12–16h | — | ✅ owns | — | maybe |
| D.4.5 | Analyst Competency | 14–20h | — | ✅ owns | — | maybe |
| D.4.6 | EQA Program Management rehome | 8–12h | — | ✅ owns | — | maybe |
| D.4.7 | `/rest/eqa/cycles/latest-performance` wrapper | 2–3h | — | — | ✅ owns | maybe |
| D.4.8 | QA Overview EQA tile lights up | 2–3h | — | ✅ owns | — | — |
| D.4.9 | Tests | 10–15h | — | ✅ owns | — | maybe |

**Customer-visible value:** "EQA participants get scorecards. Labs see cumulative performance. Provider workflows are managed."
**Note:** the schema work (D.4.1) needs senior; everything else is junior-friendly. Community could plausibly lead this if the schema work is done first by core team.

### D.5 — v12 Results Entry inline NCE upgrade (~10–15h)

Replaces the current Phase-1 "Report NCE" button with the v3.0 inline panel (Sample Action radios, delta-check, NCE flag badge). Tactical polish.

| # | Sub-task | Hours | Senior | Junior | Mid | Community |
|---|---|---|---|---|---|---|
| D.5.1 | Swap button handler to render v3.0 inline panel | 6–8h | review | — | ✅ owns | — |
| D.5.2 | Sample Action radios + delta-check + NCE flag badge | 3–4h | — | ✅ owns | — | — |
| D.5.3 | QA Officer training material refresh | 1–2h | — | ✅ owns | — | — |

**Customer-visible value:** "Analysts get the full v3.0 inline NCE experience at point of capture instead of a button + modal."

### Phase D summary

**Hours (core team):** ~30–50h if community handles D.1 (Test Accreditation) + D.2 (Westgard Tier 3).
**Hours (core team) without community help:** ~135–215h.
- The biggest community win is D.1 (~30–46h saved if a contributor takes it).
- D.2 is the second biggest (~10–15h).
- D.4 (EQA V2) is too big for full community lead but could be partially community-led with the schema piece on core team.

---

## Phase E — Wait & see

These items are deliberately deferred unless a customer surfaces a specific need. Each has a clear "trigger" — a circumstance that would un-park it.

| Item | Source | Trigger that un-parks it | Approx effort if un-parked |
|---|---|---|---|
| Lot expiration dashboard indicator | Westgard Phase 2 §1.2 | Partner lab reports missing a lot rollover | ~4h (junior, frontend addition) |
| Patient-based QC (CLSI EP25 / moving averages) | Westgard Phase 2 §1.2 | Customer specifically requests CLSI EP25 implementation | substantial — would be its own FRS, ~40–80h |
| Cross-instrument peer comparison | Westgard Phase 2 §1.2 | Multi-site customer requests it | ~20–30h, rolls into multi-site rollup |
| Dynamic rule recommendation (sigma-driven auto-tuning) | Westgard Phase 2 §1.2 | Sigma metrics ship + customer asks | ~30–40h |
| Auto-create NCE on non-critical Westgard violations (1-2s, 4-1s, 10-x) | Westgard Phase 2 §11.3 | Workflow change request from a partner lab | ~3–5h to extend the existing critical-only logic |
| Sigma metrics display | Westgard Phase 2 §11.3 | Inspector pressure or sigma-tier lab | covered by C.1 if Tier 2 ships |
| Trend Report PDF (subset of D.2) | Westgard Phase 2 §11.3 | Community contributor with JasperReports experience | covered by D.2.4 |
| Monthly Summary PDF (subset of D.2) | Westgard Phase 2 §11.3 | Inspector escalation | covered by D.2.3 |
| Multi-site / multi-lab rollup | Original v1 deferred backlog | Ministry-network customer asks | major — separate initiative; not in current QA roadmap |
| Document Control module (ISO 15189 §8.3) | Original v1 deferred backlog | CAP / SANAS audit gap | substantial — its own FRS |
| Equipment Management module (§6.4) | Original v1 deferred backlog | Lab inventory / calibration tracking ask | substantial — its own FRS |
| Risk Register (§8.5) | Original v1 deferred backlog | ISO 15189 risk-management requirement audit | moderate — its own FRS |
| Internal Audit Tracker full version (§8.9) | Original v1 deferred backlog | Inspector specifically asks for audit-program tooling | moderate — its own FRS |
| Time-boxable Inspector/Auditor credentials | Original v1 deferred backlog | Flexible-roles engine matures + customer asks | ~12–20h after engine ships |
| Accreditation Binder PDF export | Original v1 deferred backlog | After D.1 ships + customer asks | ~15–20h, leverages JasperReports |

**None of these block anything else.** Each is a standalone potential follow-up.

---

## Cumulative budget summary

The numbers below assume Phases A through C ship. Phase D variability depends on community contribution. Phase E adds nothing.

| Phase | Hours (core team) | Cumulative (core team) | Cumulative (with community) |
|---|---|---|---|
| A — Foundation | 85–110 | 85–110 | 85–110 |
| B — Core Value (excl. NCE TBD) | 20–29 | 105–139 | 105–139 |
| B — NCE TBD work (worst case if NCE v2 covers nothing) | 95–115 | 200–254 | 200–254 |
| C — Add-ons (Westgard Tier 2 + v8) | 58–72 | 258–326 | 258–326 |
| D — Community-ideal (if core team leads everything) | 135–215 | 393–541 | — |
| D — Community-ideal (if D.1 + D.2 community-led) | 90–125 (skip D.1, D.2) | 348–451 | 258–326 + ~10h reviews |
| E — Wait & see | 0 until trigger | — | — |

**Realistic floor (Phase A only):** ~85–110h.
**Realistic mid (Phase A + B core, no NCE TBD):** ~105–139h. Already a meaningfully better QA menu than today.
**Realistic stretch (Phase A + B + C, no NCE TBD):** ~163–211h.
**Worst case (everything core team, no community):** ~395–540h. Matches the original 6-sprint estimate.
**Best case (community takes D.1 + D.2):** ~270–340h core team, with the rest from contributions.

---

## Recommended sequencing if hours are tight

If you have a small fixed budget and want every dollar to land:

| Budget | What you ship | Why |
|---|---|---|
| **~85h** | Phase A only (v0.5 + v1 MVP) | Complete QA menu IA + the daily dashboard. Madagascar UAT passes. Sara's morning page works. |
| **~110h** | Above + Westgard Tier 1 (B.1) | + Critical violations create NCEs automatically. The most-asked daily UI complaint is fixed. |
| **~125h** | Above + E-Sig Log (B.2) | + Inspectors get the signature log. CSV/PDF export. |
| **~140h** | Above + Westgard Tier 2 (C.1) | + Statistical methods complete. Sigma metrics display. |
| **~190h** | Above + v8 QI Dashboard full (C.3) | + QI Configuration page + per-QI detail pages with heatmap/Pareto. |
| **~220h** | Above + community-led D.1 (Test Accreditation) | + Accreditation management (assuming community contributor). |
| **~250h** | Above + v9 Critical Callback (D.3) | + Critical Callback Compliance opt-in for labs that need it. |
| **~340h** | Above + EQA V2 (D.4) | + Full EQA pillar shipped. |
| **+ as time permits** | v12 Results Entry inline (D.5), Phase E un-parks | Polish + responsive scope-up to customer asks. |

**Cleanest narrative for a stakeholder conversation:** "We need ~85h to get the QA menu shipped with one daily dashboard. ~25h more closes the QC↔QMS workflow loop and gives inspectors what they ask for. From there we can build incrementally — and a chunk of the rest is a strong fit for community contribution."

---

## Cross-team coordination notes

- **NCE module owner (Mozzy + NCE v2 build):** confirm NCE v2 scope to lock Phase B's TBD lines + Phase C v3–v7 plan. Highest-leverage outstanding question in the entire plan.
- **QC module owner (Piotr):** reviewer on Phase A.1 (rehomes), B.1 (Westgard Tier 1), C.1 (Westgard Tier 2). Tag in PR descriptions; flag-and-proceed pattern (don't block merge on his sign-off per his Madagascar UAT bandwidth).
- **TAT module owner:** reviewer on A.2.5 (TAT compliance wrapper). Flag-and-proceed.
- **Flexible-roles engine team:** A.1.6 + A.2.9 register new permission keys. If the engine isn't shipped by Phase A start, A.2.9 (QA Officer default role) slides to A.2-fast-follow with feature-flagged checks in the meantime.
- **Community channel** (Slack / GitHub Discussions): announce D.1 (Test Accreditation) and D.2 (Westgard Tier 3) as contribution opportunities once Phase A + B ship.

---

## Cross-references

| Document | Relevance |
|---|---|
| `qa-menu-versioning-plan.md` | Per-version scope; this plan is the staffing/priority overlay |
| `qa-v0.5-frs.md` | Phase A.1 ship-ready FRS |
| `qa-v1-mvp-frs.md` | Phase A.2 ship-ready FRS |
| `qa-westgard-phase2-frs.md` | Phase B.1 + C.1 + D.2 ship-ready FRS (with its own §11 staffing breakdown) |
| `electronic-signature-log-outline.md` | Phase B.2 outline-level FRS |
| `qa-final-preview.html` | End-state mockup; visible target for everything in this plan |
| `qa-v0.5-preview.html` | Phase A.1 mockup |
| `qa-v1-preview.html` | Phase A.2 mockup |
| `qa-westgard-phase2-preview.html` | Phase B.1 + C.1 + D.2 visualization |
| `test-accreditation-frs.md` (uploaded) | Phase D.1 canonical implementation reference |
| `qa-qc-narrative.md` | Audience-friendly walk-through that motivates the prioritization in this plan |

---

## Revision history

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-05-04 | Casey | Initial release plan with five phases (A Foundation → E Wait & see). Per-item staffing classification (senior / junior / mid / community / wait-and-see). Cumulative budget table from ~85h floor to ~395–540h worst case. Recommended sequencing table for tight-hours conversations. Phase B includes NCE v2 scope confirmation as the highest-leverage open question. |

---

*End of QA release plan.*
