# MVP Scoping Analysis — Environmental & Vector Testing Module (OGC-527)

**Date:** 2026-04-21  
**Sprint Plan:** 6 sprints, Apr 21 – Jul 4, 2026 (12 weeks)  
**Current scope:** 157 SP across 21 stories  
**Constraint:** Herman's stories due Jun 27; contract end June 2026

---

## The Problem

The full sprint plan at 157 SP / 6 sprints runs at ~26 SP/sprint of effective capacity — that's full load with no buffer. Three structural risks could cause slippage:

1. **OGC-586** (FHIR architectural review, Piotr) must resolve before Sprint 5 for V-04 to start. If it slips, V-04 pushes Sprint 6 — and Sprint 6 is already the buffer/testing sprint.
2. **OGC-517** (Results Entry Redesign, 13 SP) is a pre-existing, non-ENV ticket scheduled in Sprint 4 that blocks V-03. It consumes one full dev-sprint and introduces a cross-team coordination risk not within this epic's control.
3. **SILNAS Indonesia dev availability** is unconfirmed. Sprint 5–6 have TBD-assigned stories.

None of this means the plan fails — but the question is which items deliver the least day-1 value if something slips, and which are genuinely blocking a working ENV deployment by June 27.

---

## What an MVP SILNAS Deployment Actually Needs

For a clinical lab to run environmental samples and produce a compliant Laporan Hasil (the contractual report deliverable), the minimum viable workflow is:

```
Site Registry → Order Entry → (test results, existing OpenELIS) → Compliance Evaluation → Report
```

Everything that enables that chain is MVP. Everything else is either an operational enhancement, a Phase 2 analytics layer, or a nice-to-have.

---

## Item-by-Item Assessment

### ✅ Non-Negotiable Core (89 SP) — Do Not Cut

| Story | SP | Why It's Core |
|---|---|---|
| OGC-296 — sampleDomain enum | 3 | Foundational type system; everything else references this |
| Sample Collection Redesign | 8 | 4-step workflow prerequisite for S-03; nearly complete |
| **S-01** — Compliance Standards Admin | 10 | The system can't evaluate compliance without standards configured |
| **S-02** — Sampling Site Registry | 10 | Every ENV order requires a registered sampling site |
| **V-01** — Vector Specimen Types | 3 | Reference data; 3 SP; needed for any vector collection |
| **S-04** — Sample Domain Classification | 3 | Enables ENV/clinical separation; small, foundational |
| **S-03** — Environmental Order Entry | 13 | The trunk. All compliance, QC, and vector workflows depend on this. |
| S-03d Part A — Required By date | 3 | Small, applies to all order types, unifies EQA deadline field |
| **S-05** — Compliance Evaluation Engine | 13 | The core value proposition: auto-evaluate results against thresholds |
| **S-06** — Laporan Hasil (Compliance Report) | 8 | Contractual report deliverable for SILNAS; Herman due Jun 13 |
| **V-02** — Vector Collection Workflow | 8 | Needed for vector specimen intake; dependencies are all in Sprint 1–2 |
| S-03b — Sampling Uncertainty Field | 3 | ISO 17025 §7.6 required; 3 SP addendum; collection-time field |

**89 SP fits in Sprints 1–3 with room to spare**, leaving Sprints 4–6 for the "on-fence" items and testing.

---

### 🔴 Strong Defer (76 SP) — Cut for MVP, Phase 2

These items have real value but are either: (a) analytics/reporting enhancements on top of a working workflow, (b) conditional on external decisions not in our control, or (c) a high-effort pre-existing ticket that primarily benefits a different module.

| Story | SP | Defer Rationale |
|---|---|---|
| **OGC-517** — Results Entry Redesign | 13 | Pre-existing ticket, not ENV-specific. Blocks V-03 but V-03 is itself deferred. This is a large cross-module change with its own risk surface. |
| **V-03** — Vector Testing & Identification | 13 | Depends on OGC-517 and a mature V-02 deployment. The species ID workbench and pool deconvolution are Phase 2 features — you need V-02 running in the field first. |
| **V-04** — Vector Surveillance Reporting | 13+10+3=26 | Already conditional on OGC-586 (FHIR architectural review). Superset dashboard + FHIR ETL is a data infrastructure investment. Formalizing this as Phase 2 removes the biggest planning uncertainty. |
| **S-05b** — FHIR Disposition Publishing | 5 | Backend-only FHIR push with no user-facing value until V-04's FHIR pipeline exists. Defer with V-04. |
| **S-07** — Environmental Dashboard | 8 | Trend analysis and Superset charts are Phase 2 analytics. Day-1 users need reports (S-06), not dashboards. |
| **S-07b** — Chart PNG/PDF Export | 3 | Addendum to S-07. Defer with parent. |
| **S-06b** — LH Delivery Notification | 5 | Email/WhatsApp delivery of the Laporan Hasil. The report itself (S-06) is MVP; automated delivery is Phase 2 convenience. |

**V-03 + OGC-517 together is the single highest-impact cut: 26 SP removed, and it eliminates the biggest cross-epic dependency risk in Sprint 4.**

---

### 🟢 Confirmed In — ISO 17025 & Subcontract Requirements (24 SP)

Confirmed with SILNAS team (2026-04-21): labs regularly refer samples to external labs, and ISO 17025 compliance is a day-1 requirement. All four on-fence items are IN.

| Story | SP | Rationale |
|---|---|---|
| **S-08** — Environmental QC Rules | 8 | ✅ **ISO 17025 required.** Field blank, trip blank, duplicate, and spike recovery rules are non-negotiable for accreditation. |
| **S-03c** — Subcontract Management | 8 | ✅ **Labs use external referrals.** Chain-of-custody tracking (ISO 17025 §6.6/§7.7) is a real workflow need. |
| **S-03d Parts B+C** — SOP Deadline Auto-Calc | 5 | ✅ **ISO 17025 §7.1/§7.3.** Holding time enforcement and worklist deadline visibility are required for sample integrity compliance. |
| **X-01** — Referral-Out Notification | 3 | ✅ **External referrals confirmed.** Notification to referring providers is a natural extension of S-03c. Small addendum to existing infrastructure. |

---

## Revised MVP Sprint Plan

With the on-fence items confirmed in, the analytics/FHIR layer deferred, and the V-02 workflow simplified, the plan tightens further to ~106 SP across 6 sprints.

### Amendment (2026-04-23): V-01/V-02 Simplification

The vector collection workflow was simplified after stakeholder review:
- **V-02 order entry** reduced to 3 fields: organism group, quantity, test selection. Step 2 (Collect Sample) removed; workflow goes Step 1 → Label/Store → QA. SP estimate: 8 → **5 SP**.
- **V-01 Trap Type admin** deferred — no longer needed since trap metadata is not captured in V-02. SP estimate: 3 → **2 SP** (species catalog + VectorGroup only).
- **S-09 Pre-Analytical Eligibility Gate** vector-specific criteria (transit window, pool size) are not applicable — those fields are not captured in the simplified V-02. S-09 remains in Sprint 7 (stretch) for potential ENV use only. No impact on Sprint 3.
- **Net saving: ~4 SP** freed in Sprint 3 and Sprint 1.

### Revised Sprint Map

| Sprint | Dates | Stories | SP | Notes |
|---|---|---|---|---|
| **1 — Foundation** | Apr 21–May 2 | OGC-296, Sample Collection Redesign, S-01, S-02, V-01 | ~21 SP | V-01 reduced to ~2 SP (trap admin deferred) |
| **2 — Integration** | May 5–16 | S-03 (full), S-04, S-03d Part A, X-01 | ~22 SP | Unchanged |
| **3 — Compliance + Vector Collection** | May 19–30 | S-05, V-02, S-03b | ~21 SP | V-02 simplified to ~5 SP |
| **4 — Report + QC + Subcontract** | Jun 2–13 | S-06, S-08, S-03c (backend), S-03d B+C | ~29 SP | Unchanged |
| **5 — Subcontract Frontend + E2E Testing** | Jun 16–27 | S-03c frontend, E2E ENV + Vector, i18n, bug fixes | ~18 SP | Testing sprint |
| **6 — Buffer / Phase 2** | Jun 30–Jul 4 | V-03 if OGC-517 resolved; S-07 if capacity allows | TBD | Low-pressure overflow/Phase 2 start |

**What changed from the prior revised plan:**
- **V-01 Sprint 1:** Trap admin removed from scope → saves ~1 SP
- **V-02 Sprint 3:** Simplified intake (no trap/GPS/pool/weather) → saves ~3 SP
- **S-09:** Vector-specific eligibility gate deferred; ENV use tracked separately in Sprint 7
- **S-06 remains in Sprint 4** — contractual Laporan Hasil report, due Jun 13. ✅
- **S-07 defers to Phase 2** — Herman's Sprint 5 stays a testing sprint.

---

## Net Effect of Cuts

| Metric | Full Plan | Revised MVP |
|---|---|---|
| Total SP | 157 | ~106 |
| Sprints at effective full load | 6 | 4 |
| Buffer for testing / hardening | 0 sprints | Sprint 5 + Sprint 6 |
| Biggest dependency risks | V-04 (OGC-586 blocker), V-03 (OGC-517) | Both eliminated |
| Herman's at-risk deadline | S-07 Jun 27 (dashboard crunch) | S-06 Jun 13 (report, manageable) |
| Post-contract Phase 2 queue | Empty | V-03, V-04, S-07, S-06b, S-07b — fully specced and ready |

---

## Decision Checklist ✅ Updated

- [x] **ISO 17025 QC rules (S-08):** Confirmed required → IN
- [x] **External referrals (S-03c):** Confirmed real workflow → IN
- [x] **S-03d Parts B+C:** ISO 17025 §7.1/7.3 holding time compliance → IN
- [x] **X-01 referral-out notification:** External referrals confirmed → IN
- [ ] **OGC-517 status:** Confirm with Piotr whether Results Entry Redesign has committed dates. If it completes by end of Sprint 4, V-03 could be added to Sprint 5 as a stretch goal.

---

## Summary

**Cut (Phase 2, post-June):** V-03, OGC-517, V-04, S-05b, S-07, S-07b, S-06b — saves 44 SP from the full plan, eliminates both major dependency risks, and turns Sprint 5 into a genuine testing sprint.

**MVP (June 27 delivery):** The full ISO 17025 ENV + Vector collection workflow is covered — compliance standards, site registry, order entry, SOP deadlines, sampling uncertainty, compliance evaluation, Laporan Hasil report, QC rules, subcontract management, referral notifications, and vector specimen + collection workflow.

**Phase 2 (post-June, all specced and ready):** V-03 (vector testing workbench), V-04 (Superset surveillance dashboard + FHIR), S-07 (ENV trend dashboard), S-06b (LH delivery notifications), S-07b (chart export).
