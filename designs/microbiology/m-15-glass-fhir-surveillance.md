# M-15 GLASS Surveillance via Consolidated FHIR (AMR + TB Global Reporting) — Functional Requirements Specification

**Version:** 1.0 (canonical — reuse-first; no separate addendum)
**Date:** 2026-06-08
**Module:** Microbiology → Surveillance → GLASS / FHIR Submission
**Route:** `/admin/surveillance/fhir` (config) · `/reports/surveillance-submission` (run + history)
**Phase:** 2+ — **the last module in the bundle.** It depends on the finalized output of M-04/M-05 (bacterial), M-14 (TB), M-09 (WHONET mapping + first-isolate dedup), and M-02 (breakpoint snapshots). Build it only after those have shipped.
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

> Self-contained. Key decisions written inline. **(1)** GLASS reporting needs cross-lab aggregation, but OpenELIS is single-tenant per deployment (`project_no_multitenancy`); this spec keeps aggregation **central, outside OE**, and OE's job is only to **push its own finalized results** to a **consolidated FHIR server** that does the aggregation and GLASS generation (§2.2, §4.7). **(2)** OE already speaks FHIR — this module **reuses `FhirTransformService` (which already builds `DiagnosticReport` + `Observation`), `FhirPersistanceService.createFhirResourcesInFhirStore()`, `FhirConfig`, and `fhir_uuid` columns**, and follows the **`EQAFhirSubmissionService` precedent** (build one DiagnosticReport + N Observations, submit scoped by organization). It invents no new transport (§4.1–4.2, §7). **(3)** This is **complementary to, not a replacement for, the M-09 WHONET file path** — labs that submit to a National Coordinating Centre by WHONET file keep doing so; the FHIR path is the standards-based, continuous alternative that also feeds the same central aggregator (§2.2). **(4)** It carries **both AMR (bacterial) and TB** results, selected by the case's `workflow_type` (§6). All config interaction is inline (no modals).

---

## 1. Lab Context

**Current State.** A finalized Microbiology Case (M-04) or TB Case (M-14) holds everything a surveillance system wants: a specimen, an organism (or *M. tuberculosis* complex), and per-antibiotic interpretations — S/I/R against a snapshotted CLSI/EUCAST breakpoint (M-02), or R/S at a WHO critical concentration plus molecular flags for TB. M-09 can already render that as a WHONET file for a National Coordinating Centre (NCC) to aggregate by hand and submit to WHO GLASS. Separately, OE already converts results to FHIR `DiagnosticReport` + `Observation` resources and pushes them to a remote FHIR store via `FhirPersistanceService` (used today for referrals, the EQA module, and analyzer import).

**Pain.** The WHONET path is **periodic, file-based, and manual at the center**: each lab emails a CSV, someone at the NCC loads dozens of files into WHONET, reconciles code differences, de-duplicates across labs, and assembles the GLASS submission once or twice a year. It is slow, error-prone, and gives no near-real-time national picture. Meanwhile OE's own FHIR pipeline already moves results continuously to a shared server — but micro/AST/TB results aren't yet shaped into the **AMR surveillance profile** the aggregator needs, so that channel can't feed GLASS.

**What Changes.** Each OE deployment gains a **surveillance FHIR submission**: when a Case is finalized (or on a schedule, or on demand), OE transforms its **first-isolate-eligible** micro/AST/TB results into FHIR resources conforming to the **WHO AMR reporting profiles** and pushes them to the **consolidated FHIR server** — the same server the DIGI ecosystem already aggregates dashboards from. The consolidated server is the only place that sees **all** labs; **it** performs cross-lab first-isolate de-duplication and **generates the GLASS-AMR submission** (and the GLASS-TB / drug-resistant-TB surveillance extract), or produces a WHONET-compatible national extract for the NCC. No lab database ever holds another lab's data, so single-tenancy is preserved. The WHONET file path (M-09) remains available for labs or NCCs that still want it.

---

## 2. Overview

### 2.1 Purpose
Get each lab's finalized AMR + TB results to **WHO GLASS**, in a way that (a) respects OE single-tenancy by aggregating centrally, (b) reuses OE's existing FHIR pipeline rather than inventing a new exporter, and (c) coexists with the WHONET file path. OE's responsibility is **transform + push its own results**; the **consolidated FHIR server** owns aggregation, cross-lab dedup, and GLASS dataset generation.

### 2.2 The two aggregation paths (both end at GLASS; both aggregate centrally)

```
                                    ┌─────────────────────────────┐
  PATH A — WHONET file (M-09)       │  National Coordinating      │
  Lab OE ──WHONET CSV/TXT──────────▶│  Centre (NCC)               │──┐
  (periodic, manual at center)      │  · WHONET software          │  │
                                    │  · cross-lab dedup by hand  │  │   ┌──────────────┐
                                    └─────────────────────────────┘  ├──▶│  WHO GLASS    │
                                                                      │   │  (GLASS-AMR,  │
  PATH B — Consolidated FHIR (M-15) ┌─────────────────────────────┐  │   │   GLASS-TB)   │
  Lab OE ──FHIR DiagnosticReport────▶│ Consolidated FHIR server    │──┘   └──────────────┘
  + per-drug Observations           │  (multi-source; THE only     │
  (continuous / scheduled,          │   place that sees all labs)  │
   AMR IG profiles)                 │  · cross-lab first-isolate   │
                                    │    dedup                     │
                                    │  · GLASS dataset generation  │
                                    │  · WHONET extract for NCC    │
                                    └─────────────────────────────┘
```

- **Single-tenancy is preserved** in both paths: the lab only ever exports/pushes **its own** data; the entity that holds many labs' data (NCC or consolidated FHIR server) is **outside** any OpenELIS instance. This is the same boundary the Management Dashboard epic (OGC-897) draws — "multi-site aggregation lives outside OpenELIS, on aggregated FHIR."
- **Path B does not replace Path A.** A deployment may run either or both. Path B is preferred where a consolidated FHIR server exists, because it is continuous, standards-based, and removes the manual file-handling step at the center.

### 2.3 Users
| Role | Use |
|------|-----|
| Lab Manager / Admin | Configures the consolidated-FHIR endpoint, which `workflow_type`s to include, and the schedule; reviews submission run history |
| Surveillance Officer | Triggers an on-demand submission for a period; reviews validation results; reconciles unmapped codes |
| (Central, out of OE) NCC / surveillance epidemiologist | Operates the consolidated FHIR server; generates and submits the GLASS dataset to WHO |

### 2.4 Navigation & URL
- **Config — SideNav:** `Admin → Microbiology → Surveillance (FHIR)`; URL `/admin/surveillance/fhir`. Holds the consolidated-FHIR endpoint (reuses `FhirConfig`), included workflow types (BACTERIOLOGY / MYCOBACTERIOLOGY_TB), dedup parameters (reuse M-09), trigger mode (on-finalize / scheduled / manual), and the AMR profile version.
- **Run + history — SideNav:** `Reports → Surveillance Submission`; URL `/reports/surveillance-submission` (+ `/history`). Mirrors the M-09 export-run surface so the two feel like siblings.

---

## 3. Data Model — reuse first

| Need | Decision | Reuse / new |
|------|----------|-------------|
| Result → FHIR conversion | **Reuse `FhirTransformService`** — it already exposes `transformResultToDiagnosticReport(Analysis)` and builds `Observation`s. Add a micro/AST/TB transform method that emits the AMR-profile shape (§4.1). | Reuse (extend) |
| Push to the consolidated server | **Reuse `FhirPersistanceService.createFhirResourcesInFhirStore(map)`** and `FhirConfig` for the endpoint/credentials. | Reuse |
| Submission orchestration | **Follow the `EQAFhirSubmissionService` pattern** (`submitResultsViaFhir(...)` builds 1 DiagnosticReport + N Observations, scoped by organization). Add `MicroSurveillanceFhirSubmissionService`. | New service, established pattern |
| Stable cross-system IDs | **Reuse the `fhir_uuid UUID` column convention** (AGENTS.md: "all entities with external exposure MUST have `fhir_uuid`"). Add `fhir_uuid` to `micro_case`, `micro_isolate`, `micro_ast_run`. | Reuse convention |
| First-isolate selection | **Reuse the M-09 dedup** (first isolate per patient per organism per window) to choose which isolates are surveillance-eligible **at the lab** before push; the center dedups again across labs. | Reuse |
| Breakpoint provenance | Each AST Observation carries the **snapshotted breakpoint standard + version** (M-02) so the central system knows how S/I/R (or R/S) was derived. | Reuse (M-02 snapshot) |
| Submission audit | A `surveillance_submission_run` row per push (period, filters, counts, target endpoint, bundle id, status, operator) — **same shape as M-09's `whonet_export_run`**. | New table, mirrors M-09 |

**No new transport, no new result store, no new code vocabulary** — codes come from the M-01 masters (WHONET/LOINC/SNOMED already mapped in M-09's mapping admin).

## 4. Functional Requirements

### 4.1 AMR FHIR transform (extend FhirTransformService)
Add a transform that, for a surveillance-eligible isolate, emits a FHIR `Bundle` conforming to the **WHO AMR reporting profiles** (the GLASS/IG-AMR `DiagnosticReport` + `Observation` profiles):
- A **`DiagnosticReport`** (category = microbiology) for the isolate's workup, referencing the specimen, the patient (de-identified to the GLASS minimum — see §4.6), the lab `Organization`, and the collection date.
- One **organism-identification `Observation`** (the isolate's organism, SNOMED CT / WHONET code from M-01).
- One **AST `Observation` per antibiotic**, valued with the interpretation (`S` / `I` / `R`) plus the raw MIC (µg/mL) or zone (mm) where available, the method, and the **breakpoint standard + version** (M-02 snapshot) as components. LOINC for the analyte, the AMR IG value sets for interpretation.
- Specimen, patient origin, and significance flags carried as the GLASS dataset requires.

### 4.2 Submission service (MicroSurveillanceFhirSubmissionService)
Following the EQA precedent: select the eligible isolates for the run, transform each (§4.1), assemble the FHIR transaction Bundle, and submit via `FhirPersistanceService.createFhirResourcesInFhirStore(...)` to the consolidated-FHIR endpoint from `FhirConfig`. Returns a result map (success, resourceCount, runId) and writes a `surveillance_submission_run` row. Idempotent on `fhir_uuid` so re-runs update rather than duplicate.

### 4.3 Trigger modes
- **On-finalize** (preferred): when a Case/TB Case is finalized and its isolate is first-isolate-eligible, queue it for submission (reuse the existing async/queue mechanism used for FHIR outbound).
- **Scheduled**: a periodic batch (reuse OE's scheduler, as M-09's scheduled export does) for a rolling window.
- **Manual**: surveillance officer picks a period + filters on `/reports/surveillance-submission` and submits.

### 4.4 Validation (reuse M-09's validation pass)
Before push, run the M-09 validation: unmapped organism/antibiotic/specimen/origin codes **block** with an inline "Map now" link to the M-09 mapping admin; missing-but-recommended fields **warn**. The center should never receive un-coded data.

### 4.5 Run history & re-submission
`/reports/surveillance-submission/history` lists past runs with counts, status, target, and the bundle id; a failed/partial run can be re-submitted. Mirrors the M-09 export-history page.

### 4.6 Privacy / minimum dataset
Push only the **GLASS minimum dataset** (age/age-group, sex, specimen, origin, organism, AST) — not name or full identifiers. De-identification is applied in the transform (§4.1). The consolidated server, not OE, holds any cross-lab linkage.

### 4.7 Central aggregation (context — outside OpenELIS scope)
Documented here so the boundary is explicit, **not built in OE**: the consolidated FHIR server ingests every lab's Bundles (each tagged by source `Organization`), performs **cross-lab first-isolate de-duplication**, maps to the **GLASS-AMR aggregated dataset** (sample- or isolate-based, by WHO priority specimen–pathogen–antibiotic combinations), and generates the GLASS submission to WHO — or a WHONET-compatible national extract for an NCC that prefers Path A's tooling. This is where legitimate multi-tenancy lives, consistent with `project_no_multitenancy` in OE.

### 4.8 Config surface
`/admin/surveillance/fhir` (inline forms): consolidated-FHIR endpoint + auth (via `FhirConfig`), included `workflow_type`s, dedup parameters (reuse M-09 defaults — WHO GLASS-aligned), trigger mode + schedule, AMR profile/IG version, and an on-page "test connection / send sample bundle" action.

## 5. The GLASS dataset (what the center builds from the push)
GLASS-AMR is reported by **priority specimen–pathogen–antimicrobial combinations** (e.g., blood *E. coli* vs 3rd-gen cephalosporins/carbapenems/fluoroquinolones; urine, stool, urogenital combinations per the WHO list), as either a **sample-based** or **isolate-based** dataset, with first-isolate de-duplication and patient demographics in WHO age groups. The lab push (§4.1) carries everything needed for the center to slot each isolate into those combinations; OE does not itself decide GLASS categories.

## 6. TB (GLASS-TB / DR-TB surveillance)
TB results flow through the **same push**, selected by `workflow_type = MYCOBACTERIOLOGY_TB`:
- AST Observations for TB are **R/S at a WHO critical concentration** (M-02 WHO-TB family, M-14), not the S/I/R clinical ladder — the interpretation value set and the breakpoint-snapshot component reflect that.
- **Molecular** resistance (GeneXpert MTB/RIF, LPA) is carried as genotypic-flag Observations distinct from phenotypic DST.
- The derived **MDR / pre-XDR / XDR** category (M-14) is included so the center can feed drug-resistant-TB surveillance.
WHO TB surveillance is a separate WHO stream from GLASS-AMR, but the same consolidated-FHIR push covers both; the center routes by organism/workflow.

## 7. Data-reuse & invented-data statement (design-addendum MUST)
- **Transport, transform, persistence:** reused (`FhirTransformService`, `FhirPersistanceService`, `FhirConfig`, `fhir_uuid`, the EQA submission pattern). No new transport invented.
- **Codes:** reused from the M-01 masters via M-09's existing WHONET/LOINC/SNOMED mappings. No new vocabulary.
- **Dedup, validation, run-history, scheduling:** reused from M-09.
- **Breakpoint provenance:** reused from M-02 snapshots.
- **New:** `fhir_uuid` columns on three micro entities, a `surveillance_submission_run` audit table (mirrors `whonet_export_run`), one `MicroSurveillanceFhirSubmissionService`, the AMR-profile transform method, and the config + run surfaces. Multi-tenant aggregation is **explicitly out of OE** (§4.7), preserving `project_no_multitenancy`.
- No modals (inline config); Carbon for React on the two surfaces.

## 8. Internationalization
All new strings use the `module.surface.element` key pattern (`surveillance.fhir.config.endpoint`, `surveillance.submission.run.button`, `surveillance.submission.validation.unmappedCode`, etc.). ~40 new keys.

## 9. Acceptance Criteria
- **AC-M15-01** A finalized, first-isolate-eligible bacterial Case produces a FHIR Bundle (1 DiagnosticReport + organism Observation + per-antibiotic AST Observations) conforming to the configured AMR profile, with breakpoint standard+version components.
- **AC-M15-02** Each AST Observation carries interpretation (S/I/R), method, and the M-02 breakpoint snapshot; raw MIC (µg/mL) or zone (mm) included when present.
- **AC-M15-03** Submission pushes via `FhirPersistanceService.createFhirResourcesInFhirStore(...)` to the `FhirConfig` consolidated endpoint and writes a `surveillance_submission_run` row; re-runs are idempotent on `fhir_uuid`.
- **AC-M15-04** On-finalize, scheduled, and manual trigger modes all work; the lab-side first-isolate dedup (M-09) selects eligible isolates before push.
- **AC-M15-05** Validation blocks on unmapped codes with an inline "Map now" link to the M-09 mapping admin; warnings are advisory.
- **AC-M15-06** TB cases (`workflow_type = MYCOBACTERIOLOGY_TB`) submit with R/S-at-critical-concentration interpretations, molecular flags, and the MDR/pre-XDR/XDR category.
- **AC-M15-07** Only the GLASS minimum (de-identified) dataset is pushed; no name/full identifiers leave OE.
- **AC-M15-08** Submission run history lists runs with counts/status/target/bundle id and supports re-submission.
- **AC-M15-09** No OpenELIS instance stores another lab's data; aggregation/GLASS generation is documented as central and out of scope.
- **AC-M15-10** The WHONET file path (M-09) continues to work unchanged; M-15 is additive.

## 10. Dependencies & phasing
**Depends on:** M-04/M-05 (finalized bacterial AST), M-14 (TB results), M-02 (breakpoint snapshots incl. WHO-TB), M-09 (WHONET mapping, first-isolate dedup, validation, run-history patterns), M-01 (coded masters). **Reuses** the existing OE FHIR stack.

**Phase 2+ — last in the bundle.** Do not start until the bacterial case + AST + breakpoint + WHONET foundation and the TB profile have shipped, since M-15 transforms and pushes exactly their finalized output.
