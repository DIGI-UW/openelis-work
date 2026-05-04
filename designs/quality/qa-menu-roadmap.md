# OpenELIS Global — Quality Assurance Menu Roadmap

**Phase 0 deliverable** • 2026-04-23 • Casey Iiams-Hauser

This is the narrative plan for consolidating OpenELIS's disparate QA-adjacent features (Westgard rules, Levey-Jennings, EQA, NCE/CAPA, audit trail, and new quality indicators) under a single top-level **Quality Assurance** menu. It is the companion to the forthcoming `qa-menu-roadmap.xlsx` tracker.

---

## Objective

Give OpenELIS a coherent top-level **Quality Assurance** surface that a QA Officer, Lab Director, or visiting inspector can open and, within three clicks, answer the five questions that ISO 15189:2022 and CAP consistently ask of a clinical lab:

1. Are my analytical runs in control? (Statistical QC, §7.3)
2. How did we perform against our peers last PT cycle? (EQA/PT, §7.3)
3. Are we meeting our quality indicators? (QIs, §8.8)
4. What non-conformities do we have open and what are we doing about them? (NCE/CAPA, §8.7 / §8.9)
5. Are we accreditation-ready? (QMS rollup, §8.x)

Today these features live in different menus (QC under Validation, EQA at top-level, NCE not yet shipped, audit trail in Admin, TAT in Reports), with no shared rollup and no shared permission model. The result is that the lab's quality evidence is fragmented across the app and nobody — least of all an inspector — can see the whole picture.

## Non-goals

- No net-new lab-functional features beyond what's already in the design corpus (NCE, CAPA, EQA V2 are already specified; this roadmap consolidates and sequences them).
- No multi-lab / multi-site comparison in v1 (deferred to a later initiative; keeps scope single-site).
- No Accreditation Binder export in v1 (deferred to v2).
- No time-boxable Inspector/Auditor credential in v1 (deferred; it's a flexible-roles engine enhancement, not a role definition).
- No backend rewrites of QC, EQA, or audit-trail services; this is a UX/IA consolidation plus the NCE/CAPA build-out that was already on the backlog.

---

## Four-pillar information architecture

The menu is structured around four pillars grounded in ISO 15189:2022 clause structure. A fifth node (**QA Overview**) is a pillar rollup landing page.

```
Quality Assurance                                   [qa.view.* required]
├── QA Overview                                     (NEW — pillar rollup)
├── Statistical QC                                  (ISO 15189 §7.3)
│   ├── Run Review & Levey-Jennings                 (EXISTS — rehome)
│   ├── Westgard Rules                              (EXISTS — rehome)
│   ├── QC Lot Management                           (NEW — v2)
│   ├── Batch Workplan Reagent QC                   (EXISTS — cross-link)
│   └── Analyzer Manual QC                          (EXISTS — cross-link)
├── EQA (Proficiency Testing)                       (ISO 15189 §7.3)
│   ├── My EQA
│   ├── EQA Oversight
│   │   ├── EQA Lab Performance                     (RENAMED from "Lab Performance Dashboard")
│   │   ├── Follow-Up Queue
│   │   └── Analyst Competency
│   └── EQA Program Management                      [eqa.provider only]
├── Quality Indicators                              (ISO 15189 §8.8)
│   ├── QI Dashboard                                (NEW)
│   ├── TAT Compliance                              (DEEP-LINK to existing TAT report)
│   ├── Rejection Rate                              (NEW)
│   ├── Amendment Rate                              (NEW)
│   └── Critical Callback Compliance                (NEW)
└── QMS & Improvement                               (ISO 15189 §8.7, §8.9)
    ├── NCE Register                                (REHOMED from top-level)
    ├── CAPA Register                               (NEW view over existing NCE data model)
    ├── Accreditation Status                        (NEW rollup)
    ├── Audit Trail                                 (REHOMED from Admin; cross-link preserved)
    └── Electronic Signature Log                    (NEW log view)
```

The menu respects the standing OpenELIS sidenav pattern (submenu items, not in-page tabs) recorded in `feedback_openelis_sidenav_submenus.md`.

---

## Feature crosswalk — ideal vs. current state

| Pillar | Feature | Exists? | Current location | Action |
|---|---|---|---|---|
| Statistical QC | Levey-Jennings charts | Yes | under Validation | Rehome under QA → Statistical QC |
| Statistical QC | Westgard multi-rule config | Yes | under Validation / Analyzer | Rehome under QA → Statistical QC |
| Statistical QC | QC Lot Management (target/SD governance) | No | — | New spec (v2 — defer to Sprint 7+) |
| Statistical QC | Batch Workplan Reagent QC | Yes | Workplan module | Cross-link from QA menu |
| Statistical QC | Analyzer Manual QC | Yes | Analyzer module | Cross-link from QA menu |
| EQA | My EQA (participant view) | Yes | EQA top-level | Rehome |
| EQA | EQA Lab Performance (was "Lab Performance Dashboard") | Spec'd | EQA V2.3 | Build in Sprint 5; rename to avoid colliding with shipped Lab Management Dashboard |
| EQA | Follow-Up Queue | Spec'd | EQA V2 | Build in Sprint 5 |
| EQA | Analyst Competency | Spec'd | EQA V2 | Build in Sprint 5 |
| EQA | EQA Program Management | Yes | EQA top-level | Rehome; visible only to `eqa.provider` permission |
| Quality Indicators | QI Dashboard | No | — | New in Sprint 4 |
| Quality Indicators | TAT Compliance | Yes (report) | Reports | Deep-link from QA; do not duplicate |
| Quality Indicators | Rejection Rate | No | — | New spec in Sprint 4 |
| Quality Indicators | Amendment Rate | No | — | New spec in Sprint 4 |
| Quality Indicators | Critical Callback Compliance | No | — | New spec in Sprint 4 |
| QMS | NCE Register | Spec'd (FRS v3.1) | Was top-level in FRS v3.0 — needs v4.0 revision | Rehome under QA → QMS in Sprint 2 |
| QMS | CAPA Register | Data model exists in `nce_capa` + `nce_effectiveness_review` | Part of NCE FRS v3.1 | New *view* over existing data in Sprint 3 |
| QMS | Accreditation Status rollup | No | — | New rollup in Sprint 3 |
| QMS | Audit Trail | Yes | Admin menu | Rehome under QA → QMS with cross-link from Admin |
| QMS | Electronic Signature Log | No | — | New log view in Sprint 3 |

Key correction from earlier scoping: **CAPA is not net-new.** The full CAPA data model (both `nce_capa` and `nce_effectiveness_review` tables) is already specified in NCE Report FRS v3.1. The CAPA Register becomes a standalone *view* over existing data, not a new entity.

---

## Sprint roadmap

Sequencing principle: **skeleton before bedrock.** The IA, sidenav, and permission scaffolding ship first, so every subsequent sprint lands into a stable container.

### Sprint 1 — IA skeleton + NCE Dashboard FRS v4.0 revision

- New top-level **Quality Assurance** sidenav group added (empty-state landing page for unbuilt children, rehome-in-place for children that already exist).
- QA Overview landing page (pillar rollup — even if each card is a stub initially).
- NCE Dashboard FRS bumped from v3.0 to v4.0: NCE rehomed under QA → QMS → NCE Register; removes the top-level "NCE" menu entry.
- RBAC scaffolding: `qa.view.overview`, `qa.view.qc`, `qa.view.eqa`, `qa.view.qi`, `qa.view.qms` permission keys added to the flexible-roles engine registry.
- **QA Officer** default role ships pre-bundled with the above read permissions plus all write permissions from the NCE FRS.
- **Lab Director** and **Inspector/Auditor** documented as recommended permission bundles (not shipped as defaults — customers compose these via the flexible-roles engine per `project_flexible_roles.md`).

### Sprint 2 — NCE/CAPA bedrock build

- NCE Register (list + filter + detail) — FRS v3.1.
- NCE Create/Report flow — FRS v3.1 (11 trigger points, including the Results Entry trigger).
- NCE Analytics page (4 KPIs, 9 charts, 6 reports) under QA → QMS → NCE Register → Analytics.
- NCE Results Entry reconciliation:
  - **Long-term target: the v3.0 inline-form spec.** Sample Action radios, auto-delta-check, mandatory trigger #4, and row-level NCE flag badge.
  - **Current production: "Report NCE" button** that opens a context-preloaded form. Documented in FRS as "Phase 1 — tactical MVP," not the canonical target.
  - Sprint 2 keeps the button live; Sprint 6 swaps the handler to render the v3.0 inline panel without changing the backing data model.

### Sprint 3 — Rehomes + new QMS views

- Rehome Westgard Rules and Run Review & Levey-Jennings under Statistical QC (move-only; UI polish deferred).
- Rehome Audit Trail under QMS (with cross-link preserved from Admin, per `project_qa_menu.md`).
- New: CAPA Register (view over existing `nce_capa` / `nce_effectiveness_review` data).
- New: Electronic Signature Log.
- New: Accreditation Status rollup (single-site).
- Rename EQA V2.3 "Lab Performance Dashboard" → **EQA Lab Performance** (avoids collision with the shipped Lab Management Dashboard).

### Sprint 4 — Pillar-3 Quality Indicator specs

Three new FRS documents plus a QI Dashboard:

- QI Dashboard (landing + rollup tiles, deep-link to each indicator).
- Rejection Rate FRS.
- Amendment Rate FRS.
- Critical Callback Compliance FRS.
- TAT Compliance: deep-link to the existing TAT report rather than duplicating (enforces the "one source" rule for TAT).

### Sprint 5 — EQA V2 MVP (5-story epic)

- My EQA.
- EQA Lab Performance (renamed).
- Follow-Up Queue.
- Analyst Competency.
- EQA Program Management rehome with `eqa.provider`-scoped visibility.

### Sprint 6 — Results Entry NCE upgrade + v1 close-out

- Swap Results Entry "Report NCE" button handler to render the v3.0 inline panel (Sample Action radios, delta-check, NCE flag badge).
- Close v1 acceptance against the five quality questions above.

### Sprint 2 fast-follow — MVP KPI Rollup

The closing step in the QA menu FRS-creation sequence. Specced in `qa-mvp-kpi-rollup-outline.md`. Ships an early version of the QI Dashboard using only KPIs computable from data already in the system:

- Three tiles: Rejection Rate, Amendment Rate, TAT Compliance (no Critical Callback in MVP — schema-pending; no QI Configuration in MVP — fixed defaults).
- Same URL as the full Sprint 4 dashboard. MVP is replaced in place when Sprint 4 ships; no migration needed.
- ~8–11 engineer-hours of wrappers + a small frontend. Rejection Rate, Amendment Rate, and TAT Compliance wrappers are pure controller-level additions.
- Detail-page placeholders are filterable tables with NCE links. Sprint 4 replaces them with full detail pages.
- MVP banner at top of page so users know what they're seeing; removed when Sprint 4 ships.

This is the only sprint deliverable scoped specifically to give users tangible Pillar-3 value before the full Sprint 4 buildout lands. It's deliberately the *last* spec in the FRS-creation sequence because it depends on every per-pillar outline being settled — the MVP makes scope cuts that only make sense once the full version is fully specified.

### Sprint 7+ — v2 scope

- QC Lot Management.
- Accreditation Binder export (deferred from v1).
- Time-boxable Inspector/Auditor credentials (flexible-roles engine enhancement).
- Multi-site / network rollup (separate initiative).

---

## Permissions model (post-flexible-roles)

Post the flexible-roles engine (see `project_flexible_roles.md`), **permissions are the atomic unit** and roles are bundles. We ship one new default role and document the rest as composable bundles customers can assemble themselves.

### New permissions registered in Sprint 1

```
qa.view.overview
qa.view.qc           qa.manage.qc
qa.view.eqa          qa.manage.eqa
qa.view.qi           qa.manage.qi
qa.view.qms          qa.manage.qms
nce.view.own         nce.view.all          nce.acknowledge
nce.investigate      nce.capa.manage       nce.assign
nce.effectiveness.review                   nce.batch
eqa.provider         eqa.oversight         eqa.participant
audit.view           audit.export
esig.view            esig.export
accreditation.view   accreditation.manage
```

### Default role shipped pre-configured

**QA Officer** — bundles the eight `nce.*` permissions plus all `qa.view.*`, all `qa.manage.*` except `qa.manage.qc` (analyst-owned), `audit.view`, `esig.view`, `accreditation.view`. Intended as the out-of-box owner of the QA menu.

### Recommended permission bundles (not shipped as default roles)

- **Lab Director** — adds `qa.manage.qc`, `accreditation.manage`, `audit.export`, `esig.export`, `nce.assign`, plus whatever order-entry/results permissions the customer already includes in their Director role.
- **Inspector/Auditor** — read-only: all `qa.view.*`, `audit.view`, `esig.view`, `accreditation.view`, `nce.view.all`. Intended to be *time-boxable* once that engine capability ships (deferred from v1).

Customers compose Director / Inspector via the flexible-roles UI; OpenELIS ships the bundle *recipes* as in-app recommendations, not as editable role records.

This supersedes the older "admin is binary" constraint recorded in `feedback_openelis_admin_permissions.md` once the flexible-roles engine ships.

---

## Dependencies and risks

| # | Item | Impact | Mitigation |
|---|---|---|---|
| D1 | Flexible-roles engine must land before Sprint 1 closes | Blocks QA Officer default role and permission keys | Sprint 1 can ship with feature-flagged permission checks; role bundling slides to Sprint 2 if engine slips |
| D2 | NCE Dashboard FRS v4.0 revision | Blocks Sprint 1 IA lock | Bundled into Sprint 1 scope so it can't be forgotten |
| D3 | Admin Menu IA redesign runs in parallel | Accreditation config placement could drift | Coordinate Phase 3 of admin-menu-redesign with Sprint 3 of this roadmap; lock Accreditation config path jointly |
| D4 | Three Pillar-3 QI specs must be written | Blocks Sprint 4 build | Specs owned in Sprint 4 (write + build in same sprint); pre-work during Sprint 3 |
| D5 | EQA V2.3 Lab Performance Dashboard rename | Downstream doc drift | Rename locked in Sprint 3; update all references in EQA V2 corpus before Sprint 5 build |
| R1 | Button-vs-inline-form Results Entry reconciliation | Analyst workflow change mid-rollout | Keep button live through Sprint 2–5; swap handler in Sprint 6 after QA Officer training materials land |
| R2 | Audit Trail rehome with Admin cross-link | Admin users lose the path they know | Preserve the Admin-side link to Audit Trail so old muscle memory still works |
| R3 | Single-site scope in v1 | Multi-lab customers (ministry networks) get v1 with no comparison view | Document explicitly in release notes; multi-site stays in the v2 backlog |

---

## Open items / deferred

Deferred to v2 or later:

- QC Lot Management FRS.
- Accreditation Binder export.
- Time-boxable Inspector/Auditor credentials.
- Multi-site / multi-lab rollup dashboards.
- Document control module (ISO 15189 §8.3) — QMS pillar stub in v1, spec'd later.
- Equipment management module (§6.4) — same.
- Risk register (§8.5) — same.
- Internal audit tracker (§8.9) — same.

---

## Revision history

| Version | Date | Author | Notes |
|---|---|---|---|
| 0.1 | 2026-04-23 | Casey | Phase 0 roadmap. Four-pillar IA, six-sprint plan, flexible-roles permissions model, Results Entry recommendation (v3.0 spec as target, current button as Phase-1 interim). |
