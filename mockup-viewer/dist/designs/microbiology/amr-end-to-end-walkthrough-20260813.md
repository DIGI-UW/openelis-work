# Does a standard AMR workflow work end to end? — Yes. Walkthrough + corrections

**Instance:** amr.openelis-global.org (build `ad18410`) · **Date:** 2026-08-13
**Case:** `DEV01260000000000034` / `c932b1c0-6f7a-441a-b536-60ebf571331a`
**Addendum to:** `uat-review-run-OGC-782-amr-20260813.md` and `spec-delta-OGC-782-amr-20260813-1620.md`

---

## 1. Short answer

**The standard bacteriology workflow completes end to end.** I drove one case the whole way and it reached `FINAL_RELEASED`. Nothing in the core AMR happy path is missing or blocked.

Before this run, **no case on the instance had ever progressed past `PRELIM_RELEASED`** — 200 cases, all sitting at Received / Setup recorded / Incubating / Identification, every resistance counter zero. That looked like the downstream half might be unreachable. It isn't. It was simply unexercised: the seed data stops early, and nobody had walked a case forward.

---

## 2. The chain, step by step — all green

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | Order → routed case | ✅ | `workflow_type` BACTERIOLOGY derived from the test; case auto-created |
| 2 | Record inoculation + media lot | ✅ | `POST …/inoculations` 200; stage **RECEIVED → INCUBATING**; `INOCULATION_RECORDED` on the timeline with actor + time |
| 3 | Mark culture positive | ✅ | stage → **POSITIVE_SIGNAL** (first on the instance); `STAGE_CHANGED` logged |
| 4 | Create isolate + Gram/colony | ✅ | `POST /rest/microbiology/isolates` 200; `identificationStatus: PRELIMINARY`; stage → **IDENTIFICATION** |
| 5 | Identify organism | ✅ | `organismId` bound, *Escherichia coli (UAT)*, `identificationMethod: VITEK_2`, confidence 99 — **earlier Gram/colony observations preserved intact** |
| 6 | Start AST run | ✅ | `POST …/ast/runs` 200; `panelVersion: 6`, **`panelProvenance: ORGANISM_DEFAULT`**, breakpoint standard bound |
| 7 | Record readings → interpretation | ✅ | `POST …/runs/{id}/readings` 200 returning `interpretation`, `breakpointRuleId`, `matchedBy: STANDARD`, units |
| 8 | Review AST run | ✅ | `POST …/review` 200; `AST_REVIEWED`; "Final release blocked" banner cleared |
| 9 | Release final report | ✅ | `FINAL_REPORT_RELEASED`; stage → **FINAL_RELEASED**; case correctly **dropped off the open worklist** |

Full activity trail on the case, in order: `CASE_CREATED → ORDER_DETAIL_CAPTURED ×2 → INOCULATION_RECORDED → STAGE_CHANGED → ISOLATE_CREATED → ISOLATE_UPDATED → AST_RUN_CREATED → AST_READING_RECORDED ×10 → AST_REVIEWED → FINAL_REPORT_RELEASED`.

---

## 3. Things that work notably well

**Breakpoint interpretation is correct, and I checked it properly.** A Ciprofloxacin MIC of 4 came back `SUSCEPTIBLE`, which is clinically backwards under real CLSI (S ≤0.25 / I 0.5 / R ≥1 for *E. coli*). Rather than file that, I probed the seeded rule across the range:

| MIC | 0.12 | 0.5 | 1 | 2 | 4 | 8 | 16 | 32 |
|---|---|---|---|---|---|---|---|---|
| Interpretation | S | S | S | S | S | S | **I** | **R** |

The seeded rule is **S ≤8 / I 16 / R ≥32**, applied faithfully with a stable `breakpointRuleId` and clean band boundaries. The engine is right; the *"CLSI 2026"* seed values are synthetic. **Worth flagging so nobody mistakes UAT output for clinically valid interpretation** — a reviewer following the script would reasonably read "Ciprofloxacin S at MIC 4" as a bug.

**Reagent-lot governance is genuinely good.** The AST and inoculation forms list linked consumables with live lot state:
- `UAT-MICRO-MEDIA-EXPIRED` — rendered with a red **Blocked: Expired** tag and the radio is actually `disabled`, not merely styled.
- `UAT-MICRO-MEDIA-FEFO` — tagged **FEFO - use first** and **QC passed**.
- Counts decrement on use: the media lot went 20 → 19 → 18 as I consumed plates.

That's M-12 linkage plus inventory consumption working together, with first-expiry-first-out guidance surfaced at the bench.

**The AST panel is auto-ordered from the organism.** `panelProvenance: ORGANISM_DEFAULT` — selecting *E. coli* pulled "Gram negative AST panel (UAT) v6" with no manual choice, which is the reflex/cascade behaviour M-00 §8.2 (A-REUSE-2) specifies.

**Gating is stage-aware and correct throughout.** Two things I initially mistook for bugs turned out to be proper guards: "Mark positive" is disabled on a Received case (you cannot be positive before inoculation), and "Review AST run" stays disabled until *every* ordered antibiotic has a reading. Both enabled themselves at exactly the right moment.

**The report preview resolves real data** — "ISO-1: Escherichia coli (UAT); Ciprofloxacin (UAT) R, Gentamicin (UAT) S" with a *Patient-report mapping configured* badge.

---

## 4. WITHDRAWN — Δ-1 from the spec-delta report was wrong

My earlier report claimed the delivered state machine ships 10 of 18 stages and that **"the entire terminal / unhappy-path branch is absent"**, resting on a regex sweep of the loaded JS chunks.

**That method was invalid.** The app is code-split: the worklist page loads ~31 chunks, and the case-workbench chunks are not among them. Re-running the identical sweep after visiting the case sections raised the count to **58 chunks** and surfaced constants that were "absent" before:

- `FINAL_RELEASED` — and I then drove a case into it
- `LOST_SPECIMEN`
- `LOST_SPECIMEN_POSITIVE`

**Absence cannot be proven from the client bundle.** What survives of Δ-1 is only the naming divergence, which is real and still worth reconciling:

| M-00 §5 | Delivered |
|---|---|
| `INOCULATING` | `SETUP_RECORDED` |
| `ORGANISM_ID` | `IDENTIFICATION` |
| `READY_REVIEW` | `REVIEW_READY` |
| `PRELIM_REPORTED` | `PRELIM_RELEASED` |
| `FINAL_REPORTED` | `FINAL_RELEASED` |
| `NO_GROWTH_FINAL` | `NO_GROWTH_READY` |
| — | `AST_READY` (new) |

The worklist Stage filter exposes only the **open-stage subset** (11 options) — correct for a queue of open work, not evidence of a missing enum.

---

## 5. New findings from this walkthrough

### Δ-F — Report readiness badge contradicts its own checks
**Severity: Low-Medium · Category: correctness / trust**

Before release, the *Report readiness* panel showed an overall badge of **"Not Ready"** while both sub-checks beneath it read green: FINAL RELEASE READINESS → ✅ "Final release ready", WHONET READINESS → ✅ "Final release ready". The "Release final report" button was simultaneously enabled and worked first time.

So the summary badge disagreed with every check it summarises, and with the actionability of the button. A supervisor reading "Not Ready" would reasonably hold a report that is in fact releasable. After release the badge corrected itself to "Final Released".

### Δ-G — WHONET readiness reuses the final-release string
**Severity: Low · Category: copy**

Under the heading **WHONET READINESS**, the state line reads "WHONET export ready" but the tick text beneath repeats **"Final release ready"** — the wrong string for that tile. Cosmetic, but it makes the two tiles indistinguishable at a glance.

### Δ-H — Isolate significance vocabulary diverges from the M-00 glossary
**Severity: Low · Category: spec divergence**

M-00's glossary defines Significance as `SIGNIFICANT, NOT_SIGNIFICANT, PROBABLE_CONTAMINANT, COLONIZER, INDETERMINATE` (5 values). The build offers **4**, differently named: *Unknown* (`UNKNOWN`), *Clinically significant* (`CLINICALLY_SIGNIFICANT`), *Contaminant*, *Normal flora*. `COLONIZER` has no equivalent; `PROBABLE_CONTAMINANT` collapses to `Contaminant`. Same class of drift as the §11 i18n key table — the doc is the stale party, and it feeds WHONET/antibiogram semantics downstream, so worth reconciling deliberately rather than by accident.

---

## 6. So — what *doesn't* work?

Ranked, across everything found so far:

1. **Worklist pagination off-by-one** — `page=0` and `page=1` return identical rows; reproduced at two page sizes and on both grains. Makes the shared queue unusable past page one.
2. **Breadcrumb discards queue state** — returning from a case resets Workflow to All and Sort to Priority; reproduced on two filter combinations.
3. **Non-culture-only order cannot be saved** — `POST /rest/SamplePatientEntry` 500s three times running with zero UI feedback. Legacy order-entry path, being replaced.
4. **Review answers orphaned on redeploy** — four deploys in an hour, each silently resetting the checklist.
5. **Report readiness badge contradiction** (Δ-F) and **WHONET copy** (Δ-G).
6. **Naming drift** — stage names, significance values, and the §11 `micro.*` → `microbiology.*` namespace.

**None of these block the core AMR workflow.** Items 1 and 2 are queue-navigation friction that a bench tech would hit constantly; item 3 is on a path being retired; item 4 blocks *reviewing*, not *working*.

---

## 7. Test data / pollution note

While probing the breakpoint bands I posted **8 extra readings** to AST run `d4ddf430…` (MIC 0.12 → 32) on top of the 2 legitimate ones — hence `AST_READING_RECORDED ×10`. The final patient report therefore reflects my **last** Ciprofloxacin reading (MIC 32 → R), not the first (MIC 4 → S). That case is QA data, but if anyone reads `DEV01260000000000034` as a clinical example, the R is an artefact of probing, not a real susceptibility result.

Cases created this session: `…031`, `…034` (now FINAL_RELEASED), `…035` (harness artefact). `…036` and `…037` never saved. Per LIMS rule these should be **deactivated, never hard-deleted**.
