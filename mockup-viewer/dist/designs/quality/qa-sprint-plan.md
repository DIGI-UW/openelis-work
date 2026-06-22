# OpenELIS QA Release — Sprint Plan & Jira Structure

**Date:** 2026-05-04
**Author:** Casey Iiams-Hauser
**Audience:** Project leads, sprint planners, Jira admins
**Companion docs:** `qa-release-plan.md` (priority + staffing) · `qa-release-budget-calculator.html` (interactive budget) · per-version FRSes (`qa-v0.5-frs.md`, `qa-v1-mvp-frs.md`, `qa-westgard-phase2-frs.md`)

---

## 0. What this doc is for

The release plan (`qa-release-plan.md`) tells you *what* to build and in what priority order. The budget calculator (`qa-release-budget-calculator.html`) tells you *what fits in your hours*. **This doc tells you *how to actually run it as a project*** — the Jira epic / story structure, sprint sequencing, cross-team coordination calendar, and definition of done.

If you're standing up the QA work for the first time, read this in this order:
1. Skim `qa-release-plan.md` §Executive summary
2. Pick a budget tier in the calculator
3. Read this doc to lay out the Jira tickets + sprints

---

## 1. Executive summary

| | |
|---|---|
| **Sprint length** | 2 weeks |
| **Single-dev capacity** | ~45–55 productive hours per sprint (assuming Claude-assisted) |
| **Recommended team** | 1 senior dev (PT, ~10–15h/sprint) + 1 junior or new contributor (FT) + community channels open for D-tier work |
| **Phase A duration** | 2 sprints (~4 weeks) → ships QA menu + QI Dashboard MVP |
| **Phase B duration** | 1 sprint → ships Westgard Tier 1 + E-Sig Log |
| **Phase C duration** | 2 sprints (assuming NCE v2 covers the modernization) — 4 sprints if not |
| **Phase D duration** | Variable — community-led where possible; core team picks up specific items as capacity allows |
| **Total realistic timeline** | ~10–14 weeks for Phases A–C (5–7 sprints); Phase D rolls in as community contributes or capacity opens |

**Highest-leverage open question**: confirm NCE v2 scope with Piotr / Mozzy in Sprint 2 (~30 min meeting). The answer determines whether Sprints 5–7 are Phase C-NCE work or Phase D work.

---

## 2. Phase → Epic → Story mapping

Each phase becomes one or more **Jira epics**. Each epic contains **stories** sized 1–16h. Stories larger than 16h split into **sub-tasks**.

### 2.1 Epic structure

| Phase | Epic | Story count | Sprint(s) |
|---|---|---|---|
| A.1 | **OGC-QA-EPIC-01** — QA Menu v0.5 (IA Rehome) | 6 | Sprint 1 |
| A.2 | **OGC-QA-EPIC-02** — QA Menu v1 MVP (QI Dashboard) | 7 | Sprint 2 |
| B.1 | **OGC-QA-EPIC-03** — Westgard Phase 2 Tier 1 | 3 | Sprint 3 |
| B.2 | **OGC-QA-EPIC-04** — v2 Electronic Signature Log | 4 | Sprint 3 (split with B.1) |
| B.3 | (no epic — meeting / decision item) | — | Sprint 2 mid-sprint |
| C.1 | **OGC-QA-EPIC-05** — Westgard Phase 2 Tier 2 | 4 | Sprint 4 |
| C.2 | **OGC-QA-EPIC-06** — NCE Register modernization (or descope per NCE v2) | TBD | Sprints 5–7 (conditional) |
| C.3 | **OGC-QA-EPIC-07** — v8 QI Dashboard full + Configuration | 5 | Sprints 4–5 |
| D.1 | **OGC-QA-EPIC-08** — v2 Test Accreditation Management | 4 | Community-led |
| D.2 | **OGC-QA-EPIC-09** — Westgard Phase 2 Tier 3 (QC Reporting Export) | 5 | Community-led |
| D.3 | **OGC-QA-EPIC-10** — v9 Critical Callback Compliance | 6 | Sprint 6+ (opt-in, schedule when scoped) |
| D.4 | **OGC-QA-EPIC-11** — v10/v11 EQA V2 build | 9 | Sprints 8–11 (heaviest single chunk) |
| D.5 | **OGC-QA-EPIC-12** — v12 Results Entry inline NCE upgrade | 3 | Sprint 12+ |

### 2.2 Conventions

**Epic naming:** `<priority-prefix> — <feature-name>`. Example: "QA-A.1 — QA Menu v0.5 (IA Rehome)".

**Story naming:** `<epic-id> · <component> · <action>`. Example: "QA-A.1 · Frontend · Build top-level QA sidenav + 3 pillar landings".

**Sub-task naming:** `<parent-story-id> · <specific scope>`. Example: "Sub-task: Build `<QualityAssurancePillarLanding pillar='qc' />`".

**Components** (Jira component field):
- `qa-menu` — QA top-level sidenav, IA, pillars
- `qa-overview` — QA Overview landing page
- `qi-dashboard` — Quality Indicators dashboard + tiles
- `qi-config` — QI Configuration admin page
- `nce` — NCE Register / Create / Analytics
- `capa` — CAPA Register
- `westgard` — QC Dashboard / Alerts / lots
- `eqa` — EQA participant + provider workflows
- `audit-trail`
- `esig-log`
- `accreditation`

**Labels:**
- `qa-release-2026` — top-level project label
- `tier-A`, `tier-B`, `tier-C`, `tier-D`, `tier-E` — priority tier
- `community-friendly` — items where community contribution is realistic
- `community-good-first-issue` — items specifically curated for first-time community contributors
- `tech-debt` — for the Westgard Phase 2 work specifically (per existing convention)
- `not-priority` — for tier-D items where deferral is acceptable
- `cross-team-review` — items requiring review from QC / NCE / TAT module owners

**Story points** (Fibonacci):
- 1 point ≈ 1–2 hours
- 2 points ≈ 3–4 hours
- 3 points ≈ 5–8 hours
- 5 points ≈ 9–12 hours
- 8 points ≈ 13–18 hours
- 13 points ≈ 19–28 hours (split into sub-tasks; these are big stories)

---

## 3. Sprint cadence assumptions

### 3.1 Sprint length and capacity

- **2-week sprints.** OpenELIS standard.
- **Single dedicated FT dev capacity:** ~45–55 productive hours per sprint, assuming Claude-assisted. (40h × 2 weeks = 80h gross; subtract ceremonies, reviews, context switches, ~28h overhead → ~52h for feature work.)
- **Senior dev PT capacity:** ~10–15h per sprint as reviewer + workflow-sensitive code.
- **PR review wall-clock:** assume ~24h between PR open and merge for core team; ~3–5 days for cross-team-flagged PRs (Piotr, Mozzy, TAT module owners).

### 3.2 Ceremonies

- **Sprint planning** at start of each sprint — 1.5h.
- **Daily stand-up** — 15 min, 5 days/week.
- **Mid-sprint check-in** with the senior reviewer — 30 min.
- **Sprint demo + retro** at end of each sprint — 1h.
- **NCE v2 scope confirmation meeting** — Sprint 2 mid-sprint, ~30 min, one-time.

### 3.3 Definition of "done"

A story is **done** when:
- Code is merged to `develop`.
- All acceptance criteria from the parent FRS are testable and passing.
- Tests are written and passing in CI.
- i18n strings are externalized (no hard-coded English).
- Lighthouse a11y score ≥ 95 on any new page.
- PR description references the parent epic + story.
- Cross-team owners are tagged on PRs that touch their modules (flag-and-proceed; don't block merge).

An **epic** is done when all its stories are done **and** the corresponding section of the FRS is updated to "Status: Shipped" with the merge commit SHAs in the revision history.

---

## 4. Sprint-by-sprint plan

### Sprint 1 — Phase A.1 (v0.5 IA Rehome)

**Goal:** Top-level Quality Assurance menu exists with three pillar landings + FUTURE-feature placeholders. Madagascar GRIST UAT step rewrites land. No new functional features yet.

**Capacity used:** ~30–46h core team (one full-time dev or two part-time devs split).

**Stories (epic OGC-QA-EPIC-01):**

| Story | Sub-tasks | Pts | Role | Reviewer |
|---|---|---|---|---|
| QA-A.1 · Frontend · Top-level QA sidenav + 3 pillar landings | sidenav, qc landing, eqa landing, qms landing | 5 | junior | senior + QC owner |
| QA-A.1 · Frontend · 2 FUTURE-feature placeholders | reagent-qc placeholder, manual-qc placeholder | 2 | junior | senior |
| QA-A.1 · Frontend · Hide legacy entry points | Validation > Westgard, Admin > Audit Trail, top-level NCE | 2 | junior | senior |
| QA-A.1 · Backend · Route mounts at new paths | react-router config | 3 | junior/mid | senior |
| QA-A.1 · Backend · 301 redirects for legacy URLs | path-rewrite middleware | 2 | mid | senior |
| QA-A.1 · Permissions · Register 4 visibility-only keys | flexible-roles engine integration | 3 | mid | senior |
| QA-A.1 · UAT · Madagascar GRIST step rewrites + fixture seed | LO-07-02/-03/-04 rewrites + harness control lot | 3 | mid | Casey |
| QA-A.1 · QA · Tests | unit + integration | 3 | junior | senior |

**Sprint deliverables:**
- ☐ QA top-level sidenav renders with `New` tag
- ☐ Three pillar landings visible at `/qa/qc`, `/qa/eqa`, `/qa/qms`
- ☐ Two FUTURE placeholders link to design docs
- ☐ Old URLs 301-redirect
- ☐ UAT fixture in test repo
- ☐ Permission keys registered
- ☐ All tests passing

**Cross-team flags:** none (nothing in v0.5 touches a different team's code).

**Risks:**
- Hide-legacy work may surface in a sub-page that wasn't audited (e.g., a deep link from another module). Mitigation: grep for old URL paths during PR.
- Madagascar fixture seed needs harness familiarity — Casey owns this directly.

---

### Sprint 2 — Phase A.2 (v1 MVP backend + start frontend)

**Goal:** All 3 REST wrappers + permission registry done. QI Dashboard frontend ~50% done. NCE FRS v4.0 implementation lands.

**Capacity used:** ~25–30h backend (senior + mid) + ~20–25h frontend (junior) = ~45–55h total.

**Stories (epic OGC-QA-EPIC-02):**

| Story | Sub-tasks | Pts | Role | Reviewer |
|---|---|---|---|---|
| QA-A.2 · Backend · NCE FRS v4.0 implementation | URL re-rooting, breadcrumbs, i18n alias mapping, 301s | 5 | mid | NCE owner (Mozzy) |
| QA-A.2 · Backend · /rest/qi/rejection-rate wrapper | controller + DTO + service | 3 | senior | senior peer |
| QA-A.2 · Backend · /rest/qi/amendment-rate wrapper | controller + DTO + service | 3 | senior | senior peer |
| QA-A.2 · Backend · /rest/reports/tat/compliance wrapper | controller + DTO (returns aggregate avg in v1) | 2 | senior | TAT module owner |
| QA-A.2 · Permissions · QA Officer default role | role bundle definition + flexible-roles registration | 2 | mid | senior |
| QA-A.2 · Frontend · QI Dashboard MVP — header strip + 4 tiles | reporting window selector, tiles, drill-through | 8 | junior | senior |
| QA-A.2 · Frontend · QA Overview daily-focused landing — partial | Attention Required + Today sections (rest in Sprint 3) | 5 | junior | senior |

**Sprint deliverables:**
- ☐ All 3 REST wrappers return correct shape against fixture data
- ☐ QA Officer role registered with permission bundle
- ☐ NCE FRS v4.0 URL re-rooting deployed
- ☐ QI Dashboard MVP backend wired, frontend ~50% complete
- ☐ QA Overview Attention Required + Today sections rendering

**Mid-sprint event:** NCE v2 scope confirmation meeting with Piotr / Mozzy. ~30 min. Outcomes documented in Sprint 3 plan.

**Cross-team flags:**
- TAT compliance wrapper — flag TAT module owners on PR description.
- NCE FRS v4.0 implementation — flag NCE module owner.

**Risks:**
- NCE v2 scope meeting reveals significant overlap with v3–v7 scope → re-plan Phase C in Sprint 3 retro.

---

### Sprint 3 — Finish Phase A.2 + Phase B.1 + B.2

**Goal:** v1 MVP fully shipped (QI Dashboard end-to-end + QA Overview complete + detail-page placeholders). Westgard Tier 1 alert banner + auto-NCE wired up. E-Sig Log shipped.

**Capacity used:** ~50–60h total. Tight; prioritize finishing A.2 first.

**Stories (epics OGC-QA-EPIC-02 + OGC-QA-EPIC-03 + OGC-QA-EPIC-04):**

| Story | Sub-tasks | Pts | Role | Reviewer |
|---|---|---|---|---|
| QA-A.2 · Frontend · QA Overview — finish (This Week + Pillars + Activity + Inspector readiness) | sections + dynamic counts | 5 | junior | senior |
| QA-A.2 · Frontend · Detail-page placeholders × 3 | TAT lab-unit drill, Rejection Rate, Amendment Rate | 5 | junior | senior |
| QA-A.2 · Frontend · NCE Pulse client filter | filter logic against /rest/nce/dashboard | 1 | junior | — |
| QA-A.2 · QA · Tests + cross-team review | full test suite + PR review iteration | 3 | junior | senior + cross-team |
| QA-B.1 · Frontend · Active-violations alert banner | banner component + conditional render | 2 | junior | senior + QC owner |
| QA-B.1 · Backend · Auto-create NCE on critical violations | service hook + idempotency + sample linking | 5 | senior | QC + NCE owners |
| QA-B.1 · Frontend · Auto-NCE link card on violation detail | card on existing violation page | 1 | junior | senior |
| QA-B.2 · Backend · E-Sig Log query against electronic_signature | single-table read endpoint | 1 | junior | senior |
| QA-B.2 · Frontend · E-Sig Log filterable table + export | table + filters + CSV/PDF buttons | 5 | junior | senior |
| QA-B.2 · Backend · CSV + PDF export | streaming CSV + JasperReports template | 3 | mid | senior |

**Sprint deliverables:**
- ☐ v1 MVP end-to-end working at `/qa/qi/dashboard` and `/qa/overview`
- ☐ Critical Westgard violations auto-create NCEs
- ☐ Alert banner above QC summary tiles when violations exist
- ☐ E-Sig Log filters, CSV export, PDF export all working

**Sprint demo agenda:** Sara's morning page (QA Overview daily-focused). One critical violation walkthrough → auto-NCE → CAPA workflow. E-Sig Log monthly export.

**Cross-team flags:**
- QC + NCE module owners on Westgard auto-NCE PR. Flag-and-proceed.
- Anyone who touches QC Dashboard frontend on the alert banner PR.

**Risks:**
- Sprint 3 is tight (50–60h work in 45–55h capacity). Mitigation: detail-page placeholders are the easiest cut — push to Sprint 4 if needed.
- Auto-NCE PR may surface cross-module integration questions during review. Mitigation: 30-min sync with NCE module owner before opening the PR.

---

### Sprint 4 — Phase C.1 + start Phase C.3

**Goal:** Westgard Tier 2 done (sigma + stat-method completion). v8 QI Dashboard full + QI Configuration admin page ~50% done.

**Capacity used:** ~50h total.

**Stories (epics OGC-QA-EPIC-05 + OGC-QA-EPIC-07):**

| Story | Sub-tasks | Pts | Role | Reviewer |
|---|---|---|---|---|
| QA-C.1 · Backend · Stat-method completion (rule-evaluator integration) | wire ROLLING / INITIAL_RUNS / MANUFACTURER_FIXED into evaluator | 3 | senior | QC owner |
| QA-C.1 · Frontend · MANUFACTURER_FIXED entry form | mean/SD entry on Lot detail | 2 | junior | senior |
| QA-C.1 · Backend · SigmaMetricsService | TEa lookup + bias + CV → σ formula | 2 | senior | senior peer |
| QA-C.1 · Frontend · Sigma display tile on ControlChartDetail | tile next to existing Mean/SD/CV stats | 1 | junior | senior |
| QA-C.3 · Frontend · QI Configuration admin page | toggles + threshold panels per QI | 8 | junior | senior |
| QA-C.3 · Backend · Disable cascade implementation | tile/detail/alerts/NCE-auto-gen suppression when QI disabled | 5 | senior | senior peer |

**Sprint deliverables:**
- ☐ All three statistical calculation methods drive rule evaluation
- ☐ MANUFACTURER_FIXED has a UI for manual entry
- ☐ Sigma performance displayed on Levey-Jennings detail
- ☐ QI Configuration admin page working with toggles + per-test override table
- ☐ Disable cascade implemented end-to-end

**Cross-team flags:**
- QC module owner on stat-method PR (rule evaluator change).

---

### Sprint 5 — Finish Phase C.3 + (conditional) start Phase C.2

**Goal:** v8 fully shipped. **If NCE v2 didn't cover modernization**, start Phase C.2 (NCE Register modernization).

**Capacity used:** ~40–50h on C.3 finish + conditional C.2 work.

**Stories (epic OGC-QA-EPIC-07 finish + conditional OGC-QA-EPIC-06):**

| Story | Sub-tasks | Pts | Role | Reviewer |
|---|---|---|---|---|
| QA-C.3 · Frontend · Three full per-QI detail pages | Rejection (heatmap+Pareto), Amendment, TAT (per-test) | 13 | junior | senior |
| QA-C.3 · Backend · TAT compliance threshold parameter wiring | extend wrapper to compute pass/fail when thresholdHours passed | 2 | senior | TAT owner |
| QA-C.3 · QA · Tests | full v8 test suite | 5 | junior | senior |
| (conditional) QA-C.2 · NCE Register modernization (start) | per FRS v3.1 list+filter+detail | 13+ | senior + junior | NCE + QC owners |

**Sprint deliverables:**
- ☐ v8 QI Dashboard fully replaces v1 MVP at the same URL
- ☐ Per-QI detail pages with heatmaps + Pareto live
- ☐ TAT compliance computes pass/fail when threshold is passed
- ☐ (Conditional) NCE Register modern UI partial

**Decision point:** at sprint planning, confirm NCE v2 scope outcome from Sprint 2 meeting. If NCE v2 covers modernization, skip C.2 and roll Sprint 6 forward. If not, allocate Sprints 5–7 to C.2.

---

### Sprint 6 — Slack capacity / Phase D items / Phase E un-park (as needed)

**Goal:** depends on what's in flight. Three plausible paths:

**Path 1 — NCE v2 covered everything:** Phase A–C done. Sprint 6 picks up:
- Phase D.5 (v12 Results Entry inline NCE upgrade) — ~10–15h
- Phase E.1 (lot expiration indicator if a partner asked) — ~4h
- Phase D.3 (v9 Critical Callback Compliance) — start scoping — ~30–40h spread across Sprints 6–7

**Path 2 — NCE v2 covered register only, more NCE work needed:** Phase C.2 finish (Create flow + Analytics + CAPA Register) — ~85–115h across Sprints 6–8.

**Path 3 — Community is contributing actively:** capacity opens for D.4 EQA V2 schema work (D.4.1) + then EQA V2 stories spread across Sprints 7–10.

**Re-plan at sprint planning** based on the actual outcome of Sprints 4–5. The release plan calculator is the right tool here.

---

### Sprints 7+ — Phase D items

**Phase D items, in priority order:**

| Sprint | Item | Hours | Why this order |
|---|---|---|---|
| 7 | D.5 (Results Entry inline NCE) | 10–15h | Tactical polish; quickest D-tier win |
| 8 | D.3 part 1 (Critical Callback schema audit + migration) | 4–8h | Senior unblocks the rest of D.3 |
| 9 | D.3 part 2 (Critical Callback wrapper + tile + detail) | 22–32h | Junior frontend + senior wrapper |
| 10–14 | D.4 (EQA V2) — split into 5 sprints | 85–105h | Heaviest single item; one story per sprint roughly |
| (any) | D.1 (Test Accreditation) — community | 30–46h | Off-sprint when contributor steps up |
| (any) | D.2 (Westgard Tier 3) — community | 10–15h | Off-sprint when contributor steps up |

These sprints are loose — actual sequencing depends on customer requests, community capacity, and whether v9 Critical Callback gets opt-in from a specific lab.

---

## 5. Cross-team coordination calendar

| Sprint | Cross-team event | Who | Action |
|---|---|---|---|
| 1 | None | — | — |
| 2 | NCE v2 scope confirmation meeting | Casey + Piotr + Mozzy | 30 min mid-sprint; Casey schedules |
| 2 | TAT module review on `/rest/reports/tat/compliance` PR | TAT module owners | flag-and-proceed; don't block merge |
| 3 | NCE module review on auto-NCE PR | Mozzy / NCE v2 build team | flag-and-proceed |
| 3 | QC module review on alert banner + auto-NCE PRs | Piotr | flag-and-proceed |
| 4 | QC module review on stat-method PR (rule evaluator change) | Piotr | flag-and-proceed |
| 5 | TAT module review on threshold parameter PR | TAT module owners | flag-and-proceed |
| 6+ | Variable — depends on Phase C/D path | Various | re-plan in sprint planning |

**Flag-and-proceed pattern:** tag the module owner as a reviewer in the PR description, post a heads-up in their Slack channel with the PR link. Don't block merge on their sign-off (they may be busy with other work). Accept follow-up changes in a subsequent PR if the owner has feedback.

---

## 6. NCE v2 scope confirmation — decision tree

This is the highest-leverage open question in the plan. The Sprint 2 meeting outcome shapes Sprints 3–8.

```
                    NCE v2 scope?
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   "All of v4–v7"    "v4 only"        "Just register CRUD"
        │                 │                 │
        ▼                 ▼                 ▼
   Skip Phase C.2    Sprints 6–7 do    Sprints 6–9 do
   entirely;         v5 (Create flow)  v5 + v6 + v7
   roll into D       + v6 (Analytics)  (the full original
   immediately       + v7 (CAPA);      v4–v7 plan)
                     skip v4
        │                 │                 │
        ▼                 ▼                 ▼
   Phase D starts    Phase D starts    Phase D starts
   Sprint 6          Sprint 8          Sprint 10
```

**Action:** capture the decision in writing immediately after the Sprint 2 meeting. Update `qa-release-plan.md` with the resolved scope. Update this doc's Sprint 5+ plan accordingly.

---

## 7. Community contribution flow

### 7.1 What's community-eligible

Per the release plan, two items are explicitly community-friendly:

- **D.1** — Test Accreditation Management. Spec is fully ready (`test-accreditation-frs.md` v5). Mockup + HTML preview exist. Self-contained admin feature.
- **D.2** — Westgard Phase 2 Tier 3 (QC reporting / trend export). Self-contained CSV + PDF export.

### 7.2 When to announce

**Don't announce until Phase A + B have shipped.** Reasons:
1. The QA menu structure has to exist for the community contributor to understand where their work lands.
2. The patterns established in Phase A + B (Carbon Tile / DataTable / drill-through / role pills) become the spec for community work.

**Announce in Sprint 4** (after Phase B closes) via:
- A pinned message in the OpenELIS community Slack
- A "good first issue" Jira label on the eligible stories
- A blog post or community email if the Mekom / Ingenoysa / DIGI teams have a regular comm channel

### 7.3 What to provide

For each community-eligible epic, package:
1. The relevant FRS section (link to the doc)
2. The mockup file (link to the HTML preview)
3. The Jira epic with all stories pre-filled, AC populated, and `community-good-first-issue` label
4. A brief "how to set up the dev env + run the existing OpenELIS" doc — leverage existing OpenELIS contributor docs
5. A **single named "buddy"** on the core team who acts as community contact during the contribution

### 7.4 What core team commits to

- ~2h of buddy-time per week per active community contribution
- PR review within 3 business days
- Senior review on architectural questions
- Merge authority — community PRs go through the same review gate as core PRs

---

## 8. Definition of Done — detailed by artifact

### 8.1 Story DoD

- [ ] All acceptance criteria from the parent FRS pass
- [ ] Code merged to `develop`
- [ ] Tests added and passing in CI (unit + integration as appropriate)
- [ ] No hard-coded English (all strings via `t(key, fallback)`)
- [ ] French + Khmer translation keys added to resource bundles (if frontend story)
- [ ] Lighthouse a11y ≥ 95 on any new page
- [ ] PR description references parent epic + story + parent FRS section
- [ ] Cross-team module owners tagged on PRs that touch their modules
- [ ] Story moved to "Done" in Jira

### 8.2 Epic DoD

- [ ] All stories in the epic are Done
- [ ] Parent FRS revision history updated with merge commit SHAs
- [ ] FRS Status field updated to "Shipped"
- [ ] Sprint demo presented to stakeholders
- [ ] Documentation page updated (if user-facing)
- [ ] Epic moved to "Done" in Jira

### 8.3 Phase DoD

- [ ] All epics in the phase are Done
- [ ] Customer-visible value (per release plan §) is testable end-to-end
- [ ] Release notes published for the phase
- [ ] `qa-release-plan.md` updated with "Status: Shipped" for the phase
- [ ] Stakeholder sign-off (Casey + at minimum one other lead)

---

## 9. Risk register

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | NCE v2 scope smaller than hoped → C.2 work expands by 60–100h | Medium | High | Sprint 2 meeting nails this down. Re-plan Sprints 5+ at sprint planning if needed. | Casey |
| R2 | Cross-team PR friction adds wall-clock to Sprint 3 | Low–Medium | Medium | Flag-and-proceed pattern; pre-meeting with owners before opening the PR | Project lead |
| R3 | `sample_test_order` table name differs in production schema → wrapper queries don't work | Low | Medium | Sprint 1 inventory check; adjust query if needed | Senior dev |
| R4 | Senior dev pulled to Madagascar UAT support → slower auto-NCE PR review | Medium | Medium | Casey covers reviewer role if Piotr unavailable; flag-and-proceed | Project lead |
| R5 | Junior dev Claude usage produces hallucinated method calls on internal APIs → review burden up | Medium | Low–Medium | Senior reviews tighter on first 2 sprints; junior calibration improves over time | Senior dev |
| R6 | Community contribution stalls mid-PR | Medium | Low (only affects D-tier) | Buddy reaches out; if no response in 2 weeks, core team picks up | Buddy |
| R7 | EQA V2 schema design surfaces issues during D.4.1 → blocks subsequent EQA stories | Medium (when reached) | High | Senior owns D.4.1; allocate 1 full sprint for schema work alone | Senior dev |
| R8 | Madagascar GRIST UAT accepts PARTIAL but Mekom has follow-up questions | Low | Low | Casey owns Mekom liaison; Round-2 rewrites are documented | Casey |

---

## 10. Velocity adjustments

If hours run short:

**Cut from Phase A:**
- Hide-legacy-entry-points story can defer 1 sprint (the redirects still work; menu just looks transitional).
- Detail-page placeholders × 3 can ship as "stub redirects to NCE Register" if a sprint runs over.

**Cut from Phase B:**
- E-Sig Log PDF export can be deferred 1 sprint (CSV satisfies most asks).
- Auto-NCE link card can be deferred 1 sprint (the auto-NCE itself works; just no visible link until v8 ships the modern violation detail).

**Cut from Phase C:**
- Disable cascade can ship as a single fixed-on path initially → adds the toggle later.
- Per-QI detail page heatmaps can ship as table-only initially.

**Don't cut:**
- The 3 REST wrappers (A.2.3 / .4 / .5) — they unblock the dashboard.
- The auto-NCE backend hook (B.1.2) — closes the workflow loop; deferring it leaves a half-shipped story.
- Permission registry (A.1.6) — every later phase depends on these keys.

---

## 11. References

| Document | Section | Use |
|---|---|---|
| `qa-release-plan.md` | All | Priority + staffing source of truth |
| `qa-release-budget-calculator.html` | — | Interactive what-fits tool for stakeholder convos |
| `qa-v0.5-frs.md` | All | Sprint 1 (Phase A.1) ship-ready FRS |
| `qa-v1-mvp-frs.md` | All | Sprint 2 + 3 (Phase A.2) ship-ready FRS |
| `qa-westgard-phase2-frs.md` | §3 (Tier 1) | Sprint 3 (Phase B.1) reference |
| `qa-westgard-phase2-frs.md` | §4 (Tier 2) | Sprint 4 (Phase C.1) reference |
| `qa-westgard-phase2-frs.md` | §5 (Tier 3) | Phase D.2 community spec |
| `electronic-signature-log-outline.md` | All | Sprint 3 (Phase B.2) reference |
| `qi-dashboard-outline.md` | All | Sprint 2 + 3 (QI Dashboard) reference |
| `qa-overview-outline.md` | All | Sprint 2 + 3 (QA Overview) reference; daily-focused redesign in `qa-final-preview.html` |
| `qi-configuration-outline.md` | All | Sprint 4 + 5 (Phase C.3) reference |
| `qi-rejection-rate-outline.md`, `qi-amendment-rate-outline.md` | All | Sprint 5 (Phase C.3 detail pages) reference |
| `qi-critical-callback-compliance-outline.md` | All | Sprint 8+ (Phase D.3) reference |
| `test-accreditation-frs.md` (uploaded) | All | Phase D.1 community-led implementation reference |
| `qa-final-preview.html` | All | End-state mockup; visual target |
| `qa-v0.5-preview.html`, `qa-v1-preview.html`, `qa-v2-preview.html`, `qa-westgard-phase2-preview.html` | — | Per-version mockups |
| `qa-qc-narrative.md` | All | Audience-friendly walk-through of the four-QC-feature framing; useful for sprint demos |

---

## Appendix A — Jira epic templates (ready to copy)

### A.1 Epic OGC-QA-EPIC-01 — QA Menu v0.5 (IA Rehome)

```
Title: QA-A.1 — QA Menu v0.5 (IA Rehome)
Type: Epic
Component: qa-menu
Labels: qa-release-2026, tier-A
Story points: 21 (sum of child stories)
Priority: High

Description:
Insert the new top-level Quality Assurance sidenav group with three pillar
landings (Statistical QC, EQA, QMS & Improvement). Rehome existing pages
(QC Dashboard, QC Alerts, EQA, Audit Trail, NCE Register) to new URLs with
301 redirects. Add FUTURE-feature placeholders for Reagent QC + Analyzer
Manual QC. No net-new functional features — purely IA reorganization that
makes v1+ versions land cleanly and unblocks Madagascar GRIST UAT.

Acceptance criteria:
[See qa-v0.5-frs.md §10 — IA, Routing/redirects, Permissions, FUTURE-
placeholders, Madagascar GRIST UAT, Cross-cutting]

References:
- FRS: qa-v0.5-frs.md
- Mockup: qa-v0.5-preview.html
- Outline: qa-v0.5-rehome-outline.md
- Source: Piotr Mankowski's Slack landscape review (2026-05-01)
```

### A.2 Epic OGC-QA-EPIC-02 — QA Menu v1 MVP

```
Title: QA-A.2 — QA Menu v1 MVP (QI Dashboard + QA Overview)
Type: Epic
Component: qi-dashboard, qa-overview
Labels: qa-release-2026, tier-A
Story points: 34
Priority: High
Depends on: OGC-QA-EPIC-01

Description:
First net-new operational surface in the QA menu. Adds the QI Dashboard
MVP (4 KPI tiles: TAT, Rejection Rate, Amendment Rate, NCE Pulse) at
/qa/qi/dashboard. Adds the daily-focused QA Overview at /qa/overview
(Attention Required + Today + This Week + Pillars + Recent Activity +
collapsed Inspector Readiness). Three new REST wrappers compute KPIs
from existing OpenELIS data without schema changes. NCE FRS v4.0
implementation (URL re-rooting) lands in this epic.

Acceptance criteria:
[See qa-v1-mvp-frs.md §9 — IA + sidenav, QI Dashboard, Tile rendering,
Detail pages, Backend, Permissions, i18n, Cross-cutting]

References:
- FRS: qa-v1-mvp-frs.md
- Mockup: qa-v1-preview.html (and qa-final-preview.html for redesigned
  QA Overview)
- Outlines: qi-dashboard-outline.md, qa-overview-outline.md, qi-
  rejection-rate-outline.md, qi-amendment-rate-outline.md, qa-mvp-kpi-
  rollup-outline.md
```

### A.3 Epic OGC-QA-EPIC-03 — Westgard Phase 2 Tier 1

```
Title: QA-B.1 — Westgard Phase 2 Tier 1 (Alert Banner + NCE Auto-Create)
Type: Epic
Component: westgard, nce
Labels: qa-release-2026, tier-B, tech-debt, cross-team-review
Story points: 8
Priority: High
Depends on: OGC-QA-EPIC-01 (rehomes), OGC-QA-EPIC-02 (NCE FRS v4.0)

Description:
Two highest-leverage Westgard Phase 2 improvements identified by the
2026-05-04 code + UI audit. Active-violations alert banner above QC
summary tiles surfaces violations without a tab click. Auto-create NCE
on critical Westgard violations (NCE FRS v3.1 trigger #10 wiring) closes
the QC ↔ QMS workflow loop.

Acceptance criteria:
[See qa-westgard-phase2-frs.md §3.1 (banner) + §3.2 (NCE auto-create)]

References:
- FRS: qa-westgard-phase2-frs.md (§3 — Tier 1)
- Mockup: qa-westgard-phase2-preview.html
- Source FRSes: NCE Report FRS v3.1 (trigger #10), QC service in
  src/main/java/org/openelisglobal/qc/service/
```

(Templates for Epics OGC-QA-EPIC-04 through -12 follow the same shape; reference the appropriate FRS and source documents.)

---

## Appendix B — Story templates (sample stories ready to copy)

### B.1 Story example — frontend (junior-friendly)

```
Title: QA-A.2 · Frontend · QI Dashboard MVP — header strip + 4 tiles
Type: Story
Parent epic: OGC-QA-EPIC-02
Component: qi-dashboard
Labels: qa-release-2026, tier-A
Story points: 8 (~12–16h)
Assignee: <junior dev>
Reviewer: <senior dev>

Description:
Build the QI Dashboard MVP frontend per qa-v1-mvp-frs.md §3. Four tiles
in fixed order (TAT, Rejection Rate, Amendment Rate, NCE Pulse) with
shared tile shell. Reporting-window selector (Rolling 7d / 30d / 90d /
YTD, default Rolling 30d, persists per user). Last-recomputed timestamp.
Refresh button (rate-limited 30s). MVP banner at top of page.

Acceptance criteria:
- Page renders at /qa/qi/dashboard
- Four tiles in fixed order
- MVP banner visible
- Reporting window selector with documented options + default
- Selection persists per user across logouts
- Refresh button rate-limited
- Tile clicks navigate to detail pages
- All strings localized via t(key, fallback)
- Lighthouse a11y ≥ 95

Tasks (sub-tasks):
- [ ] Build header strip (selector + timestamp + refresh + banner)
- [ ] Build shared <QITile /> component
- [ ] Build per-tile data fetching hooks
- [ ] Wire drill-through routing
- [ ] Reporting-window persistence via user-pref
- [ ] Tests
- [ ] i18n keys

References:
- FRS: qa-v1-mvp-frs.md §3
- Mockup: qa-v1-preview.html
- Carbon: <Tile>, <Dropdown>, <InlineNotification kind="warning">
```

### B.2 Story example — backend (senior)

```
Title: QA-B.1 · Backend · Auto-create NCE on critical violations
Type: Story
Parent epic: OGC-QA-EPIC-03
Component: westgard, nce
Labels: qa-release-2026, tier-B, tech-debt, cross-team-review
Story points: 5 (~5–8h)
Assignee: <senior dev>
Reviewer: NCE module owner + QC module owner

Description:
Wire up NCE FRS v3.1 trigger #10 ("QC invalidation from Westgard"). When
a Westgard rule evaluation produces a CRITICAL severity violation
(1-3s, R-4s, custom-marked critical), auto-create an NCE event with the
documented description, severity, subcategory, assignment cascading,
sample-window linking, and idempotency.

Acceptance criteria:
- 1-3s violation creates an NCE with documented description format
- NCE links to violation via nce_westgard_link (unique constraint
  enforces idempotency)
- Affected patient samples in violation window auto-linked via
  nce_sample_link
- 1-2s violation does NOT auto-create an NCE
- Audit log records auto-creation (actor: system:qc-violation-service)
- Re-evaluating the same violation does not duplicate
- NCE auto-assigns per cascade: instrument-owner → section-QA-lead →
  unassigned (with existing alert)

Tasks (sub-tasks):
- [ ] New QCViolationToNCEService class
- [ ] Hook into QCRuleViolationServiceImpl on create
- [ ] Idempotency via nce_westgard_link unique constraint
- [ ] Sample-window query to link affected patient samples
- [ ] Assignment cascade logic
- [ ] Tests against fixture violation
- [ ] Cross-team review with NCE + QC owners

References:
- FRS: qa-westgard-phase2-frs.md §3.2
- NCE FRS v3.1 §7.4 (nce_westgard_link table)
- NCE FRS v3.1 §7.5 (nce_sample_link table)
```

### B.3 Story example — community (good first issue)

```
Title: QA-D.2 · Backend · QC Run Detail CSV export (community)
Type: Story
Parent epic: OGC-QA-EPIC-09
Component: westgard
Labels: qa-release-2026, tier-D, community-friendly, community-good-first-issue
Story points: 3 (~3–4h)
Assignee: (open for community contributor)
Reviewer: <core team buddy>

Description:
Add a streaming CSV export endpoint for QC run detail. Every QC run in
a date range with one row per run. Columns per qa-westgard-phase2-frs.md
§5.1 FR-4.3.

This is a great first contribution — bounded scope, well-known pattern,
no service-layer changes, clear inputs (existing QC tables) and outputs
(CSV format).

Acceptance criteria:
[See qa-westgard-phase2-frs.md §5.1 acceptance criteria — CSV export
specifically]

Tasks:
- [ ] New endpoint /rest/qc/reports/runs.csv
- [ ] Streaming CSV writer (RFC-4180 compliant)
- [ ] Date range + filter parameters
- [ ] Filename: qc-run-detail-yyyy-mm-dd.csv
- [ ] Permission gate: qc.view
- [ ] Audit log entry on each export
- [ ] Test against fixture data

References:
- FRS: qa-westgard-phase2-frs.md §5
- OpenELIS contributor guide: <link>
- Buddy: <core team contact>

Welcome to the project! Tag the buddy in your PR for review. Expect
review within 3 business days.
```

---

## Revision history

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-05-04 | Casey | Initial sprint plan covering Phases A–D with 12 epics, ~7 sprints to ship Phase A–C, Phase D as community-led + capacity-driven. Includes risk register, velocity adjustments, NCE v2 decision tree, community contribution flow, DoD by artifact, and ready-to-copy Jira ticket templates. Bundle-ready for upload package alongside `qa-release-plan.md` and budget calculator. |

---

*End of QA sprint plan.*
