# QA Menu v1 — Claude-Assisted Effort Estimate

**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Scope:** Full v1 build (Sprints 1 through 6 + Sprint 2-MVP fast-follow)

---

## Headline

| Estimate | Hours | Engineer-weeks (40h/wk) |
|---|---|---|
| Low | **~350 h** | ~9 weeks (1 engineer) |
| High | **~500 h** | ~12.5 weeks (1 engineer) |
| **Midpoint** | **~425 h** | **~10.5 weeks (1 engineer)** |

This is an estimate of engineer-hours assuming the engineer is working with Claude in coding mode (Cursor / Claude Code / similar). It does **not** include cross-team review wall-clock time, stakeholder alignment meetings, or product-side iteration.

For context: a comparable scope without Claude would land around 700–1000 h (a ~50% speedup, weighted toward the boilerplate-heavy sprints).

## Speedup model

Claude compresses different work types differently. The estimates below are weighted by what kind of work each sprint contains:

| Work type | Claude speedup | Examples in this scope |
|---|---|---|
| Boilerplate / known patterns | 3–5× | Controllers, DTOs, CRUD endpoints, Carbon component scaffolding |
| Net-new with clear spec | 1.5–2.5× | QA Overview tile aggregation, QI Dashboard frontend |
| Schema migrations | 1.2–1.5× | Liquibase XML still needs human review for production safety |
| Cross-team review | ~1× | Wall-clock dominated by humans |
| Integration / debugging | 1–1.5× | Modest speedup; harder to predict |
| Spec authoring | 5–10× | **Already realized** in this project |

The spec-authoring portion of this work — outlines, FRSes, decision logs, the xlsx tracker — represents roughly 80–120 hours of compressed equivalent effort that has **already been completed**. The numbers below are forward-looking build effort only.

---

## Per-sprint breakdown

### Sprint 1 — IA skeleton + NCE FRS v4.0 + QA Overview build

| Item | Low | High |
|---|---|---|
| Top-level QA sidenav group + IA skeleton | 4 | 6 |
| NCE FRS v4.0 implementation (URL re-rooting, i18n aliases, breadcrumb update, 301 redirects) | 6 | 8 |
| QA Overview landing page (5-question strip + 4 pillar tiles + worst-of aggregation + states + persistence) | 10 | 14 |
| `/rest/qc/dashboard/sections` wrapper | 2 | 3 |
| Permission registry (qa.view.\*, qa.manage.\*) integrated with flexible-roles engine | 3 | 5 |
| QA Officer default role bundling | 2 | 3 |
| Tests | 4 | 6 |
| Cross-team PR review iteration (TAT/QC) | 2 | 3 |
| **Sprint 1 total** | **33** | **48** |

### Sprint 2 — NCE/CAPA bedrock build

| Item | Low | High |
|---|---|---|
| NCE Register (list + filter + detail per FRS v3.1) | 24 | 36 |
| NCE Create/Report flow (11 trigger points) | 12 | 18 |
| NCE Analytics page (4 KPIs + 9 charts + 6 reports) | 16 | 24 |
| Results Entry "Report NCE" button (Phase-1 interim polish) | 4 | 6 |
| Tests | 10 | 15 |
| **Sprint 2 total** | **66** | **99** |

### Sprint 2-MVP fast-follow — KPI Rollup

| Item | Low | High |
|---|---|---|
| `/rest/qi/rejection-rate` wrapper | 3 | 4 |
| `/rest/qi/amendment-rate` wrapper | 3 | 4 |
| `/rest/reports/tat/compliance` wrapper (pulled forward from Sprint 4) | 2 | 3 |
| NCE Pulse tile client-filter logic | 1 | 1 |
| MVP dashboard frontend (4 tiles + detail placeholders + banner) | 12 | 16 |
| Tests | 4 | 6 |
| Sprint-4 transition test (in-place swap) | 1 | 1 |
| **Sprint 2-MVP total** | **26** | **35** |

### Sprint 3 — Rehomes + new QMS views

| Item | Low | High |
|---|---|---|
| Westgard / L-J / Audit Trail rehomes (route + sidenav changes) | 4 | 6 |
| EQA "Lab Performance Dashboard" → "EQA Lab Performance" rename | 2 | 3 |
| CAPA Register (endpoint + frontend) | 11 | 16 |
| Electronic Signature Log (endpoint + frontend; **down from initial estimate due to unified electronic_signature table audit**) | 10 | 15 |
| Accreditation Status (lab-attested registry + QA-evidence section + small migration; **down from initial estimate due to redesign**) | 18 | 24 |
| Audit-table schema audits (already done — counted at 0) | 0 | 0 |
| Tests | 8 | 12 |
| **Sprint 3 total** | **53** | **76** |

### Sprint 4 — Pillar-3 QI specs + dashboard + admin config

| Item | Low | High |
|---|---|---|
| Three QI FRSes (full from outlines) | 6 | 9 |
| Three QI tiles + detail pages (Rejection Rate, Amendment Rate, Critical Callback) | 24 | 32 |
| QI Dashboard build (full version replacing MVP) | 8 | 12 |
| QI Configuration admin page | 10 | 14 |
| Disable cascade implementation across surfaces | 6 | 8 |
| Per-test override table on Rejection Rate config | 4 | 6 |
| NCE Report FRS v3.2 sub-revision (Critical Callback Failure trigger) | 3 | 4 |
| Tests | 10 | 15 |
| **Sprint 4 total** | **71** | **100** |

### Sprint 5 — EQA V2 MVP

This sprint is the heaviest because **EQA V2 is a from-scratch build** — the existing codebase has only the legacy `EQAOrdersRestController` per the audit (memory entry `project_eqa_v2_status.md`).

| Item | Low | High |
|---|---|---|
| Cycle / scheme model + migrations | 8 | 12 |
| My EQA participant view | 14 | 20 |
| EQA Lab Performance dashboard | 16 | 22 |
| Follow-Up Queue | 12 | 16 |
| Analyst Competency | 14 | 20 |
| EQA Program Management rehome (provider-only) | 8 | 12 |
| `/rest/eqa/cycles/latest-performance` wrapper | 2 | 3 |
| QA Overview EQA tile lights up | 2 | 3 |
| Tests | 10 | 15 |
| **Sprint 5 total** | **86** | **123** |

### Sprint 6 — Results Entry NCE upgrade + v1 close-out

| Item | Low | High |
|---|---|---|
| Swap Results Entry button → v3.0 inline panel (Sample Action radios, delta-check, NCE flag badge) | 10 | 14 |
| QA Officer training material refresh | 6 | 8 |
| v1 acceptance against 5 ISO 15189 questions | 4 | 6 |
| Tests | 6 | 8 |
| **Sprint 6 total** | **26** | **36** |

---

## v1 grand total

| | Low | High |
|---|---|---|
| Sprint 1 | 33 | 48 |
| Sprint 2 | 66 | 99 |
| Sprint 2-MVP | 26 | 35 |
| Sprint 3 | 53 | 76 |
| Sprint 4 | 71 | 100 |
| Sprint 5 | 86 | 123 |
| Sprint 6 | 26 | 36 |
| **v1 total** | **361 h** | **517 h** |

Calling it **~350–500 hours** as the headline range, **midpoint ~425 h**.

---

## Things that could move this

### Could go higher

- **Cross-team review friction.** TAT, QC, and EQA modules have separate owners. The "flag and proceed" pattern works well but if a module owner pushes back on a wrapper's parameter shape post-merge, expect a small follow-up PR (~2–4h each). Three wrappers × possible iteration = up to 12h.
- **Schema migration production rollout.** Adding `prior_state` / `new_state` to `electronic_signature`, plus the new `accreditation_record` and `internal_audit_review_log` tables, is small Liquibase work (~3–5h dev) but each one has wall-clock cost in staging validation that doesn't compress with Claude.
- **EQA V2 surprises.** Sprint 5 is from-scratch. The estimate assumes the existing EQA V2 spec corpus is implementation-ready; if it surfaces gaps during build, expect ~10–20h of extra spec-iteration work.
- **i18n translation work.** Estimates above assume English-only at code-time. Actual translation into the languages OpenELIS supports (French, Khmer, Indonesian, etc.) is wall-clock effort that compresses less with Claude — typically 0.5–1h per ~50 strings, depending on translator availability.

### Could go lower

- **Pattern reuse compounds across sprints.** Sprint 1's QA Overview tile shell is reused for the QI Dashboard tiles in Sprint 2-MVP and Sprint 4. The Sprint 4 estimate already credits some reuse; if more shows up, Sprint 4 lands closer to the low end.
- **Liquibase migrations are nearly identical in pattern.** Three small migrations across the v1 (electronic_signature columns + accreditation_record + internal_audit_review_log) — Claude writes the second and third 50% faster than the first.
- **Tests.** The estimate uses generous test allocation. Claude is particularly strong at scaffolding test cases from acceptance criteria; if your test infrastructure is tight, test work drops 30–40%.
- **Audits up-front saved real effort.** The TAT API audit (DEC23) and the electronic_signature unified-table audit (DEC45) prevented us from designing wrappers we didn't need or schemas that already existed. Each audit saved ~3–5h of misdirected build effort. The Accreditation Status redesign (DEC48) saved ~6–8h directly. **~12–18h of build effort already saved before any code is written**, just by doing the design audits with Claude.

---

## What this leaves out

- **v2 backlog** (Sprint 7+). QC Lot Management, Accreditation Binder export, multi-site rollup, Document Control, Equipment Management, Risk Register, Internal Audit Tracker, time-boxable Inspector/Auditor. Out of v1 scope; not estimated here.
- **Stakeholder review wall-clock time.** Sprint gates, FRS reviews, design review meetings — these consume calendar time but not engineer-hours.
- **Production deployment + UAT iteration** post-Sprint 6.
- **i18n translation** (counted in "could go higher" above; not in the headline number).

---

## Recommended planning shape

Given the midpoint of ~425h and a single dedicated engineer:

- **~10.5 weeks** (40 h/week, 1 engineer)
- **~5.5 weeks** (40 h/week, 2 engineers — assumes parallelizable across NCE-bedrock vs. wrapper-build vs. frontend tracks)
- **~3.5 weeks** (40 h/week, 3 engineers — Sprint 5 EQA V2 work is the bottleneck and partially serial)

The MVP fast-follow (Sprint 2-MVP, ~30h) is the highest leverage early ship: customers see Pillar-3 value within weeks of Sprint 2 NCE/CAPA bedrock landing. Worth keeping as a prioritized parallel track rather than a Sprint 4 dependency.

---

*This estimate is forward-looking from 2026-04-23. Actuals will be tracked in the qa-menu-roadmap.xlsx Sprint Plan sheet as work lands.*
