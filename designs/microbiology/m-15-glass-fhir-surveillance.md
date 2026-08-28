# M-15 GLASS Surveillance via Consolidated FHIR (AMR + TB Global Reporting) — Functional Requirements Specification

**Version:** 1.1 (canonical — reuse-first; no separate addendum). **v1.1 adds the negative / no-growth path** — see §4.9, §4.10, the rewritten §5, AC-M15-11…17, §11 open verification items, and the changelog in §12.
**Date:** 2026-08-27 (v1.0: 2026-06-08)
**Module:** Microbiology → Surveillance → GLASS / FHIR Submission
**Route:** `/admin/surveillance/fhir` (config) · `/reports/surveillance-submission` (run + history)
**Phase:** 2+ — **the last module in the bundle.** It depends on the finalized output of M-04/M-05 (bacterial), M-14 (TB), M-09 (WHONET mapping + first-isolate dedup), and M-02 (breakpoint snapshots). Build it only after those have shipped.
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

> **v1.1 amendment in one line:** v1.0 only ever emitted a Bundle for a case that *grew something*. A culture that grows nothing is a complete, final, reportable result — and in a **sample-based** GLASS-AMR dataset the negatives are the **denominator**. v1.1 makes every finalized Case — bacterial or TB — surveillance-eligible, negative ones included (which TB outcomes qualify is decided in M-14 §7.1), and replaces the isolate-present release/export gate with an **outcome-recorded** gate (§4.10).

> Self-contained. Key decisions written inline. **(1)** GLASS reporting needs cross-lab aggregation, but OpenELIS is single-tenant per deployment (`project_no_multitenancy`); this spec keeps aggregation **central, outside OE**, and OE's job is only to **push its own finalized results** to a **consolidated FHIR server** that does the aggregation and GLASS generation (§2.2, §4.7). **(2)** OE already speaks FHIR — this module **reuses `FhirTransformService` (which already builds `DiagnosticReport` + `Observation`), `FhirPersistanceService.createFhirResourcesInFhirStore()`, `FhirConfig`, and `fhir_uuid` columns**, and follows the **`EQAFhirSubmissionService` precedent** (build one DiagnosticReport + N Observations, submit scoped by organization). It invents no new transport (§4.1–4.2, §7). **(3)** This is **complementary to, not a replacement for, the M-09 WHONET file path** — labs that submit to a National Coordinating Centre by WHONET file keep doing so; the FHIR path is the standards-based, continuous alternative that also feeds the same central aggregator (§2.2). **(4)** It carries **both AMR (bacterial) and TB** results, selected by the case's `workflow_type` (§6). **(5)** *(v1.1)* It carries **negative (no-growth) cases as well as positive ones**, because the sample-based GLASS dataset counts specimens tested, not just isolates found (§4.9, §5). All config interaction is inline (no modals).

---

## 1. Lab Context

**Current State.** Most cultures grow nothing. In a typical bacteriology bench, the large majority of plates are read after incubation, called **no growth**, signed out as a final negative report, and filed — a complete result, produced the same way and by the same people as a positive one. The minority that do grow something get an organism identified and antibiotics tested against it. A finalized Microbiology Case (M-04) or TB Case (M-14) that grew something holds everything a surveillance system wants: a specimen, an organism (or *M. tuberculosis* complex), and per-antibiotic interpretations — S/I/R against a snapshotted CLSI/EUCAST breakpoint (M-02), or R/S at a WHO critical concentration plus molecular flags for TB. M-09 can already render that as a WHONET file for a National Coordinating Centre (NCC) to aggregate by hand and submit to WHO GLASS. Separately, OE already converts results to FHIR `DiagnosticReport` + `Observation` resources and pushes them to a remote FHIR store via `FhirPersistanceService` (used today for referrals, the EQA module, and analyzer import).

**Pain — the negatives never leave the building.** Both export paths as first designed only carry a case that has an isolate on it. A negative culture — read, called, signed out — has no isolate, so nothing about it is ever sent anywhere. That matters because **AMR = Antimicrobial Resistance** surveillance reports resistance as a *proportion* — resistant isolates divided by **either** the isolates tested **or** the specimens tested, depending on which flavour of the dataset a country submits (§5.1). Where the denominator is specimens tested, it counts every specimen cultured, including the ones that grew nothing. Ship the resistant isolates without the count of specimens tested and the top of the fraction arrives while the bottom does not, so every resistance percentage computed downstream is too high by an unknown amount. Nothing errors; the file looks well-formed. Worse, on the bench, a released negative case that the system still describes as blocked or incomplete teaches staff to ignore the banner that is supposed to tell them when something really is unfinished.

**Pain — the center's workload.** The WHONET path is also **periodic, file-based, and manual at the center**: each lab emails a CSV, someone at the NCC loads dozens of files into WHONET, reconciles code differences, de-duplicates across labs, and assembles the GLASS submission once or twice a year. It is slow, error-prone, and gives no near-real-time national picture. Meanwhile OE's own FHIR pipeline already moves results continuously to a shared server — but micro/AST/TB results aren't yet shaped into the **AMR surveillance profile** the aggregator needs, so that channel can't feed GLASS.

**What Changes.** Each OE deployment gains a **surveillance FHIR submission** that covers **every finalized culture, positive and negative alike**. A no-growth case is pushed as a small Bundle that says, in coded form, *this specimen was cultured and nothing grew* — so the center can count specimens tested, not just isolates found, and can build either flavour of the GLASS dataset. A positive case is pushed as before, with its organism and per-antibiotic results. On the bench nothing new is asked of the tech: they mark no growth and release the report exactly as they do today, and the case then reads as finished instead of claiming it is still waiting on an isolate.

When a Case is finalized (or on a schedule, or on demand), OE transforms its **surveillance-eligible** micro/AST/TB results into FHIR resources conforming to the **WHO AMR reporting profiles** and pushes them to the **consolidated FHIR server** — the same server the DIGI ecosystem already aggregates dashboards from. The consolidated server is the only place that sees **all** labs; **it** performs cross-lab first-isolate de-duplication and **generates the GLASS-AMR submission** (and the GLASS-TB / drug-resistant-TB surveillance extract), or produces a WHONET-compatible national extract for the NCC. No lab database ever holds another lab's data, so single-tenancy is preserved. The WHONET file path (M-09) remains available for labs or NCCs that still want it.

---

## 2. Overview

### 2.1 Purpose
Get each lab's finalized AMR + TB results to **WHO GLASS** — **numerator and denominator both** — in a way that (a) respects OE single-tenancy by aggregating centrally, (b) reuses OE's existing FHIR pipeline rather than inventing a new exporter, (c) coexists with the WHONET file path, and (d) carries negative (no-growth) cases so the center can build the **sample-based** dataset as well as the isolate-based one (§4.9, §5). OE's responsibility is **transform + push its own results**; the **consolidated FHIR server** owns aggregation, cross-lab dedup, and GLASS dataset generation.

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
| Surveillance eligibility | *(v1.1)* Two rules, not one. **Positive** cases: **reuse the M-09 dedup** (first isolate per patient per organism per window) to choose which isolates are eligible **at the lab** before push; the center dedups again across labs. **Negative** cases: every finalized no-growth case is eligible — de-duplication does not apply, because the unit being counted is the **specimen**, not an isolate (§4.9). | Reuse (positives) + one new predicate (negatives) |
| Breakpoint provenance | Each AST Observation carries the **snapshotted breakpoint standard + version** (M-02) so the central system knows how S/I/R (or R/S) was derived. | Reuse (M-02 snapshot) |
| Submission audit | A `surveillance_submission_run` row per push (period, filters, counts, target endpoint, bundle id, status, operator) — **same shape as M-09's `whonet_export_run`**. | New table, mirrors M-09 |

**No new transport, no new result store, no new code vocabulary** — codes come from the M-01 masters (WHONET/LOINC/SNOMED already mapped in M-09's mapping admin).

## 4. Functional Requirements

### 4.1 AMR FHIR transform (extend FhirTransformService)
Add a transform that, for a surveillance-eligible **case** *(v1.1 — was "isolate"; a no-growth case has no isolate and must still transform, §4.9)*, emits a FHIR `Bundle` conforming to the **WHO AMR reporting profiles** (the GLASS/IG-AMR `DiagnosticReport` + `Observation` profiles):
- A **`DiagnosticReport`** (category = microbiology) for the isolate's workup, referencing the specimen, the patient (de-identified to the GLASS minimum — see §4.6), the lab `Organization`, and the collection date.
- One **organism-identification `Observation`** (the isolate's organism, SNOMED CT / WHONET code from M-01).
- One **AST `Observation` per antibiotic**, valued with the interpretation (`S` / `I` / `R`) plus the raw MIC (µg/mL) or zone (mm) where available, the method, and the **breakpoint standard + version** (M-02 snapshot) as components. LOINC for the analyte, the AMR IG value sets for interpretation.
- Specimen, patient origin, and significance flags carried as the GLASS dataset requires.

*(v1.1)* **For a negative (no-growth) case** the same transform emits a deliberately smaller Bundle of the same shape, so the center parses one structure, not two:
- The same **`DiagnosticReport`** (category = microbiology), referencing the same specimen, de-identified patient, lab `Organization`, and collection date, with `conclusionCode` carrying the coded no-growth concept.
- **One** organism-identification `Observation` whose `valueCodeableConcept` is the coded **"no growth / no organism isolated"** concept instead of a species code. Its `status` is `final` — a negative is a result, not a missing one.
- **No AST Observations**, and no phenotype flags. Their absence is meaningful and must not be read as "results pending"; the coded conclusion is what distinguishes *nothing grew* from *not yet tested*.
- Everything the sample-based denominator needs — specimen type, patient origin, collection date, lab — is present, because it comes from the specimen and not from the isolate.

Exact code bindings for the no-growth concept are listed as an open verification item in §11.

### 4.2 Submission service (MicroSurveillanceFhirSubmissionService)
Following the EQA precedent: select the eligible **cases** for the run *(v1.1)* — positives by the M-09 first-isolate dedup, negatives unconditionally (§4.9) — transform each (§4.1), assemble the FHIR transaction Bundle, and submit via `FhirPersistanceService.createFhirResourcesInFhirStore(...)` to the consolidated-FHIR endpoint from `FhirConfig`. Returns a result map (success, resourceCount, runId) and writes a `surveillance_submission_run` row. Idempotent on `fhir_uuid` so re-runs update rather than duplicate.

### 4.3 Trigger modes
- **On-finalize** (preferred): when a Case/TB Case is finalized **with a recorded culture outcome** (§4.10), queue it for submission — for a positive case, additionally when its isolate is first-isolate-eligible; for a negative case, unconditionally (§4.9). *(v1.1: the precondition was "and its isolate is first-isolate-eligible", which excluded every negative.)* Reuses the existing async/queue mechanism used for FHIR outbound.
- **Scheduled**: a periodic batch (reuse OE's scheduler, as M-09's scheduled export does) for a rolling window.
- **Manual**: surveillance officer picks a period + filters on `/reports/surveillance-submission` and submits.

### 4.4 Validation (reuse M-09's validation pass)
Before push, run the M-09 validation: unmapped organism/antibiotic/specimen/origin codes **block** with an inline "Map now" link to the M-09 mapping admin; missing-but-recommended fields **warn**. The center should never receive un-coded data.

*(v1.1)* **One unmapped code is not like the others.** If the **no-growth concept** (§4.1) is unmapped at a deployment, the ordinary rule blocks every negative case at once — a large outage from a single missing mapping, and one that presents as "some codes are unmapped" rather than as "your entire denominator is not being sent". The validation pass must report this case **distinctly**, naming the consequence, rather than listing it as one unmapped organism among many. Whether it should block or merely warn and hold the negatives is open — §11 V-9.

### 4.5 Run history & re-submission
`/reports/surveillance-submission/history` lists past runs with counts, status, target, and the bundle id; a failed/partial run can be re-submitted. Mirrors the M-09 export-history page.

### 4.6 Privacy / minimum dataset
Push only the **GLASS minimum dataset** (age/age-group, sex, specimen, origin, organism, AST) — not name or full identifiers. De-identification is applied in the transform (§4.1). The consolidated server, not OE, holds any cross-lab linkage.

### 4.7 Central aggregation (context — outside OpenELIS scope)
Documented here so the boundary is explicit, **not built in OE**: the consolidated FHIR server ingests every lab's Bundles (each tagged by source `Organization`), performs **cross-lab first-isolate de-duplication**, maps to the **GLASS-AMR aggregated dataset** (sample- or isolate-based, by WHO priority specimen–pathogen–antibiotic combinations), and generates the GLASS submission to WHO — or a WHONET-compatible national extract for an NCC that prefers Path A's tooling. This is where legitimate multi-tenancy lives, consistent with `project_no_multitenancy` in OE.

### 4.8 Config surface
`/admin/surveillance/fhir` (inline forms): consolidated-FHIR endpoint + auth (via `FhirConfig`), included `workflow_type`s, dedup parameters (reuse M-09 defaults — WHO GLASS-aligned), trigger mode + schedule, AMR profile/IG version, and an on-page "test connection / send sample bundle" action.

*(v1.1)* One added control: **Include negative (no-growth) cases** — a toggle, **on by default**, with the inline helper *"Negatives are the denominator for sample-based GLASS reporting. Turning this off makes resistance proportions computed from this lab's data too high."* It exists because a deployment whose National Coordinating Centre only accepts the isolate-based dataset has no use for the extra traffic; it defaults on because the surveillance-correct choice should be the one nobody has to know to make. The run history (§4.5) reports positive and negative counts separately so an operator can see at a glance which they sent.

### 4.9 Negative (no-growth) cases — the sample-based denominator *(v1.1)*

**What is pushed.** Every **finalized** Case — bacterial **or TB** — is surveillance-eligible, whether or not it grew anything. A case that reached the no-growth outcome and had its final report released pushes the negative Bundle described in §4.1. This is a **case-level** push, not an aggregate count: OE sends one Bundle per specimen and lets the center do the counting, so the denominator can be re-cut later by specimen type, origin, ward, or period without OE having pre-decided the grouping.

**Why case-level rather than a periodic "specimens tested" tally.** An aggregate count is smaller to send but cannot be re-sliced, cannot be de-duplicated against the isolate stream, and cannot be audited back to a specimen. The center already receives one Bundle per positive case; receiving one per negative case keeps a single ingestion path and a single unit of account — the specimen.

**De-duplication does not apply to negatives *at the lab*.** First-isolate de-duplication answers *"is this the same bug in the same patient again?"*. A negative has no bug, so the `FIRST_OR_REPEAT` / first-isolate machinery is simply not evaluated for a negative case: OE emits one Bundle per cultured specimen and does not collapse them.

Whether the **center** then aggregates those specimens to the patient is the center's decision, not OE's (§4.7) — and it matters, because GLASS's sample-based approach may count **patients tested** rather than **specimens tested** as the denominator. Case-level push is deliberately agnostic here: sending one record per specimen preserves both options, whereas sending a pre-collapsed count forecloses one of them. **This is the single most consequential unknown in v1.1 — see §11 V-8.**

**Contaminant-only cases.** A culture that grew only organisms the lab judged contaminants is, for surveillance, a specimen tested with no reportable pathogen. It pushes as a negative Bundle, with the contaminant isolates omitted rather than sent as pathogens. Contaminant judgement reuses the existing isolate **significance** attribute — the same one M-09 exports in its `SIGNIFICANCE` column — and no new field is introduced.

**Volume.** Negatives are the majority of cultures, so this multiplies submission volume by roughly the inverse of the culture positivity rate — commonly 3–10×. The negative Bundle is small (no AST Observations), and the existing trigger modes (§4.3) already batch and schedule. Deployments that must throttle should use the scheduled mode rather than on-finalize; this is a configuration choice, not a reason to drop negatives.

**Out of scope.** Rejected specimens, cancelled orders, and lost specimens are **not** negatives and are **not** pushed — they were never cultured, so they belong in neither the numerator nor the denominator. Only a case that was actually incubated and read produces a Bundle.

*(v1.1)* **On the TB bench the same rule sorts the outcomes differently, and M-14 §7.1 owns that sorting.** Three differences worth stating here because they are counter-intuitive from the bacteriology side: a **contaminated** TB culture exports **nothing** — the specimen was not successfully cultured, so unlike a bacteriology contaminant-only case it is *not* a specimen tested; an **NTM** case is a positive culture of the wrong organism and must never be emitted with a no-growth code; and a TB case still **culturing** contributes nothing however many interim smear or molecular reports have already been released to the clinician. Eligibility on the TB bench is decided by the culture branch, not by what has been reported.

### 4.10 Release and export gating — outcome recorded, not isolate present *(v1.1)*

**The rule.** Final release and surveillance export are gated on the culture having a **recorded outcome**, not on an isolate existing. The gate is satisfied by any one of:

1. at least one isolate with a completed, reviewed AST workup (the positive path, unchanged);
2. a recorded **no-growth** outcome (the negative path);
3. isolates present but **all** judged contaminants — **bacteriology only**; this is the contaminant-only path, which behaves as a negative per §4.9 because the culture *did* work. On the **TB** bench the equivalently-named stage `CONTAMINATED` means the specimen was **not** successfully cultured: it satisfies the release gate (the clinician must be told) but contributes nothing to surveillance. M-14 §7.1 and AC-M14-20 own that.

A case that has none of these — still incubating, or grew something no one has worked up — is genuinely unfinished and is still correctly blocked.

**What this replaces.** An isolate-present precondition on final release and on export. That precondition makes a released negative case contradict itself: the case is finalized and the negative has reached the patient's report, while the workbench still announces that release is blocked and the export refuses to carry it. Both symptoms have the same single cause, and both are fixed by this one rule.

**Post-release consistency (the part that is easy to miss).** The readiness/blockers computation must be evaluated against the case's **current** state. Once a case is finally released, readiness must report no blockers — for the negative path exactly as for the positive one. A blocker returned for an already-released case is a defect regardless of which blocker it is, because it trains staff to disregard a banner whose whole purpose is to flag genuinely unfinished work.

**Message wording.** When the gate does legitimately block, the message names the **missing outcome**, not the missing isolate: *"Record the culture outcome before releasing"* — never *"Isolate required"*, which is false for a plate that grew nothing and is the wording that produced the contradiction.

## 5. The GLASS dataset (what the center builds from the push) *(rewritten in v1.1)*

GLASS-AMR is reported by **priority specimen–pathogen–antimicrobial combinations** (e.g., blood *E. coli* vs 3rd-gen cephalosporins/carbapenems/fluoroquinolones; urine, stool, urogenital combinations per the WHO list), with patient demographics in WHO age groups. OE does not itself decide GLASS categories — it supplies the raw material and the center slots each record into the combinations.

### 5.1 Two dataset flavours, and what each one needs from the lab

| Dataset | The question it answers | Numerator | Denominator | What the lab must send |
|---|---|---|---|---|
| **Isolate-based** | Of the bugs we found, what share were resistant? | Resistant isolates | **Isolates tested** | Positive cases only (v1.0 was sufficient) |
| **Sample-based** | Of the specimens (or patients) we cultured, what share yielded a resistant bug? | Resistant isolates | **Specimens tested** — *or patients tested; unit unconfirmed, see §11 V-8* | Positive **and** negative cases (v1.1) |

First-isolate de-duplication applies to the **isolate** stream in both flavours. It does **not** apply to negatives (§4.9) — each cultured specimen counts once.

### 5.2 Why v1.0 could not support the sample-based dataset

v1.0 emitted a Bundle only for a case with an isolate. That covers the numerator of both flavours and the denominator of the isolate-based flavour, but it never sends the specimens that grew nothing — so **specimens tested** was unknowable from OE's push. A center that computed a sample-based proportion from it would divide by the positives alone and overstate resistance by a factor of one over the culture positivity rate. Nothing would error; the numbers would simply be wrong, in a consistent and invisible direction.

### 5.3 What v1.1 sends, and what the center does with it

The lab pushes one Bundle per finalized culture. Positives carry organism + AST (§4.1); negatives carry a coded no-growth conclusion and no AST (§4.1, §4.9). Both carry specimen type, origin, collection date, de-identified demographics, and the source lab. From that stream the center can construct **either** dataset without going back to the lab, count specimens tested per priority specimen type, and compute positivity rates as a data-quality signal in their own right — an implausible positivity rate is often the first sign a lab's data is incomplete.

**Boundary, restated.** Choosing which dataset a country submits, and assembling it, remains central and out of OE scope (§4.7). OE's obligation is that the push is **sufficient** for either choice. v1.0 was not; v1.1 is.

## 6. TB (GLASS-TB / DR-TB surveillance)
TB results flow through the **same push**, selected by `workflow_type = MYCOBACTERIOLOGY_TB`. *(v1.1: this now includes TB **negatives** — a culture negative at day N, once released, pushes a negative Bundle exactly as a bacterial no-growth case does. Which TB outcomes are eligible is decided in **M-14 §7.1**, not here, because it depends on TB bench states this spec does not own. Note that GLASS-TB is a separate WHO stream from GLASS-AMR, so whether it wants a denominator on the same terms is its own question — M-14 §14 T-1, paired with §11 V-8.)*
- AST Observations for TB are **R/S at a WHO critical concentration** (M-02 WHO-TB family, M-14), not the S/I/R clinical ladder — the interpretation value set and the breakpoint-snapshot component reflect that.
- **Molecular** resistance (GeneXpert MTB/RIF, LPA) is carried as genotypic-flag Observations distinct from phenotypic DST.
- The derived **MDR / pre-XDR / XDR** category (M-14) is included so the center can feed drug-resistant-TB surveillance.
WHO TB surveillance is a separate WHO stream from GLASS-AMR, but the same consolidated-FHIR push covers both; the center routes by organism/workflow.

## 7. Data-reuse & invented-data statement (design-addendum MUST)
- **Transport, transform, persistence:** reused (`FhirTransformService`, `FhirPersistanceService`, `FhirConfig`, `fhir_uuid`, the EQA submission pattern). No new transport invented.
- **Codes:** reused from the M-01 masters via M-09's existing WHONET/LOINC/SNOMED mappings. No new vocabulary.
- **Dedup, validation, run-history, scheduling:** reused from M-09.
- **Breakpoint provenance:** reused from M-02 snapshots.
- **New in v1.1:** no new entity or column. The negative path is expressed entirely in **existing** state — the case's no-growth outcome and the existing isolate **significance** attribute (the same one M-09 exports in `SIGNIFICANCE`) — plus one coded vocabulary concept for "no growth", which comes from the standard terminologies via the M-01 masters and is **not** an OpenELIS invention (exact bindings: §11). The §4.10 gate is a change to an existing precondition, not a new field. The one added config value is the **Include negative (no-growth) cases** setting on the existing §4.8 config surface.
- **New:** `fhir_uuid` columns on three micro entities, a `surveillance_submission_run` audit table (mirrors `whonet_export_run`), one `MicroSurveillanceFhirSubmissionService`, the AMR-profile transform method, and the config + run surfaces. Multi-tenant aggregation is **explicitly out of OE** (§4.7), preserving `project_no_multitenancy`.
- No modals (inline config); Carbon for React on the two surfaces.

## 8. Internationalization
All new strings use the `module.surface.element` key pattern (`surveillance.fhir.config.endpoint`, `surveillance.submission.run.button`, `surveillance.submission.validation.unmappedCode`, etc.). ~40 new keys.

*(v1.1)* Four more here: `surveillance.fhir.config.includeNegatives` and `surveillance.fhir.config.includeNegatives.helper` (the §4.8 toggle and its inline helper), and `surveillance.submission.run.positiveCount` / `surveillance.submission.run.negativeCount` (the two counts reported separately in run history, AC-M15-16).

The §4.10 blocking message is **not** in this namespace. It is rendered on the case workbench's release path, which M-04 owns, so it lives at `micro.case.error.releaseFinal.outcomeRequired` (M-04 §12) — English *"Record the culture outcome before releasing"*. The old isolate-required string is **retired**, not re-worded in place, so no deployment keeps a translated copy of a message that is wrong on the negative branch.

## 9. Acceptance Criteria
- **AC-M15-01** *(positive path)* A finalized, first-isolate-eligible bacterial Case produces a FHIR Bundle (1 DiagnosticReport + organism Observation + per-antibiotic AST Observations) conforming to the configured AMR profile, with breakpoint standard+version components.
- **AC-M15-02** Each AST Observation carries interpretation (S/I/R), method, and the M-02 breakpoint snapshot; raw MIC (µg/mL) or zone (mm) included when present.
- **AC-M15-03** Submission pushes via `FhirPersistanceService.createFhirResourcesInFhirStore(...)` to the `FhirConfig` consolidated endpoint and writes a `surveillance_submission_run` row; re-runs are idempotent on `fhir_uuid`.
- **AC-M15-04** On-finalize, scheduled, and manual trigger modes all work. Selection is **case-level** (§4.2): a positive case is selected when the lab-side first-isolate dedup (M-09) marks its isolate eligible; a negative case is selected unconditionally; a case with no recorded culture outcome is selected in neither mode.
- **AC-M15-05** Validation blocks on unmapped codes with an inline "Map now" link to the M-09 mapping admin; warnings are advisory.
- **AC-M15-06** TB cases (`workflow_type = MYCOBACTERIOLOGY_TB`) submit with R/S-at-critical-concentration interpretations, molecular flags, and the MDR/pre-XDR/XDR category.
- **AC-M15-07** Only the GLASS minimum (de-identified) dataset is pushed; no name/full identifiers leave OE.
- **AC-M15-08** Submission run history lists runs with counts/status/target/bundle id and supports re-submission.
- **AC-M15-09** No OpenELIS instance stores another lab's data; aggregation/GLASS generation is documented as central and out of scope.
- **AC-M15-10** The WHONET file path (M-09) continues to work unchanged; M-15 is additive.
- **AC-M15-11** *(v1.1)* A finalized **no-growth** Case — bacterial or TB — produces a Bundle containing a `DiagnosticReport` and exactly one organism-identification `Observation` whose value is the coded no-growth concept, with **no** AST Observations and no phenotype flags. The Observation `status` is `final`.
- **AC-M15-12** *(v1.1)* Negative Bundles are **not** subjected to first-isolate de-duplication: two no-growth cultures from the same patient in the same window both submit as separate Bundles. (What the centre then does with them is the centre's decision — §4.7, §11 V-8 — and is deliberately not asserted here.)
- **AC-M15-13** *(v1.1)* A **bacterial** case whose isolates are **all** marked contaminant submits as a negative Bundle (§4.9), and its contaminant isolates are not sent as pathogens. Rejected, cancelled, and lost specimens submit **nothing**. A **TB** case follows M-14 §7.1 instead: `CONTAMINATED` submits **nothing**, `NTM_IDENTIFIED` is never submitted with a no-growth code, and a case still culturing submits nothing (AC-M14-18, AC-M14-19).
- **AC-M15-14** *(v1.1)* Final release and surveillance export are gated on a **recorded culture outcome** — isolate workup complete, no growth recorded, or contaminant-only (bacteriology) / `CONTAMINATED` (TB, which releases but exports nothing — M-14 §7.1) — never on an isolate existing. **Release-eligibility and surveillance-eligibility are evaluated separately**: satisfying the release gate does not by itself make a case exportable. A no-growth case that meets the gate releases and exports with no blockers, and a case with no recorded outcome is still blocked, with a message naming the missing **outcome** rather than a missing isolate.
- **AC-M15-15** *(v1.1)* After final release, the readiness/blockers computation returns **no blockers** for a released case on the negative path as well as the positive path. Any blocker returned for an already-released case fails this criterion.
- **AC-M15-16** *(v1.1)* The **Include negative (no-growth) cases** setting defaults **on**; run history reports positive and negative counts separately for every run.
- **AC-M15-17** *(v1.1)* When the no-growth concept itself is unmapped, validation reports it as its own distinct condition naming the consequence — that every negative case, and therefore the whole sample-based denominator, would be withheld — and not as one row in a list of unmapped organisms.

## 10. Dependencies & phasing
**Depends on:** M-04/M-05 (finalized bacterial AST), M-14 (TB results, and — v1.1 — the TB surveillance-eligibility rules in M-14 §7.1), M-02 (breakpoint snapshots incl. WHO-TB), M-09 (WHONET mapping, first-isolate dedup, validation, run-history patterns), M-01 (coded masters). **Reuses** the existing OE FHIR stack.

**Phase 2+ — last in the bundle.** Do not start until the bacterial case + AST + breakpoint + WHONET foundation and the TB profile have shipped, since M-15 transforms and pushes exactly their finalized output.

**Sequencing note added in v1.1.** The release/export gate in §4.10 is *not* Phase 2+ work. It lives in M-04's release path and M-09's export path, it is what makes a released negative case stop contradicting itself on the bench, and it is a prerequisite for everything in §4.9. It should ship with M-04/M-09, ahead of the FHIR transform.

---

## 11. Open verification items *(v1.1)*

**V-1…V-5 are code bindings.** Each must be confirmed against the published value sets before implementation; none of them changes the shape of the Bundle. **V-8 and V-9 are not** — V-8 is an open design question about the dataset itself and V-9 is a validation-behaviour question; both are listed here so they are not lost, and both need an answer rather than a lookup. **V-6 and V-7 are M-09 §11's** (the WHONET no-growth code, and recipient appetite); the numbering is shared across the two files deliberately so an item is discussed once.

| # | Item | Why it needs checking |
|---|---|---|
| V-1 | The **SNOMED CT** concept for "no growth / no organism isolated" used as the organism Observation's `valueCodeableConcept`, and whether the WHO AMR IG binds a specific code or leaves it to the implementer | The whole negative path hangs on one coded concept; a wrong or non-conformant code makes negatives unparseable at the center |
| V-2 | Whether the AMR IG's `DiagnosticReport` profile permits a report with **no** AST Observations, or requires a placeholder | If it requires one, §4.1's negative shape needs a conformant equivalent |
| V-3 | The **LOINC** code for the culture observation carrying a no-growth value, versus reusing the same code the positive path uses with a different value | Determines whether the center can filter negatives by code or must inspect the value |
| V-4 | The **WHONET** organism code for no growth (M-09 §4 and its mapping vocabularies) and whether WHONET expects negatives as rows at all, or as a separate specimen count | M-09's amendment depends on this; see M-09 §11 |
| V-5 | Whether the deployment's National Coordinating Centre accepts the **sample-based** dataset | Decides whether the §4.8 toggle is left on; does not change what OE is capable of sending |
| V-8 | **The denominator's unit** *(GLASS-AMR; M-14 §14 T-1 asks the same of the separate GLASS-TB stream, which may answer differently)*. Whether the target GLASS dataset counts **specimens tested** or **patients tested**, and whether negatives are expected to be collapsed to the patient (and if so, per specimen type, per surveillance period) | §4.9 and §5.1 are written in specimens throughout. Case-level push preserves both options, so this does not change what OE sends — but it changes what the centre must do with it, and §5.1's wording should follow whichever is confirmed |
| V-9 | Whether an unmapped **no-growth concept** should block the push at all, or warn and hold only the negatives | §4.4 blocks a push on unmapped organism codes. If the no-growth concept is the unmapped one, that rule blocks **every negative** at once — a large, silent, single-cause outage from one missing mapping. §4.4 now requires the validation pass to name this case distinctly (AC-M15-17); whether it should block or warn is the open question |

---

## 12. Changelog

**v1.1 — 2026-08-27.** Adds the negative / no-growth path. Prompted by UAT on build `b1c692b` (OGC-782 AMR UAT, AMR-S29): a finalized, released no-growth case reported `finalReleaseReady: false, blockers: ["ISOLATE_REQUIRED"]` while its stage and final-release state were both `FINAL_RELEASED`, and its WHONET export was refused for the same reason. The behaviour was consistent with v1.0 as written — v1.0 named both the sample-based and isolate-based datasets in §5 but only ever emitted a Bundle for an isolate-bearing case, and never used the words *no growth*, *negative*, or *denominator*. That is a specification gap, so the spec is amended before the code is.

Changed: header and §1 Lab Context (negatives and why they matter); §2.1 Purpose; §3 eligibility row; §4.1 (negative Bundle shape, and the transform keyed on the case rather than the isolate); §4.2 and §4.3 (selection and the on-finalize trigger no longer exclude negatives); §4.8 (Include-negatives toggle, default on); **new §4.9** (negative cases and the sample-based denominator); **new §4.10** (release/export gated on recorded outcome, not isolate present); **§5 rewritten** (the two dataset flavours, why v1.0 could not support the sample-based one); §7 (data-reuse statement — the negative path adds no entity or column); §4.4 (an unmapped no-growth concept is reported as its own condition, since it would withhold every negative at once); §4.9 and §6 extended to the TB bench, with §4.10 item 3 / AC-M15-13 / AC-M15-14 scoped by bench; §10 Depends-on now names M-14 §7.1; §8 (i18n, and where the blocking message actually lives); AC-M15-01 scoped to the positive path and AC-M15-04 restated as case-level selection; **new AC-M15-11…17**; **new §11** open verification items.

Companion amendments: **M-09 v2.1** (negatives in the WHONET path), **M-14 v1.1** (the TB bench — `NO_GROWTH_READY`, `CONTAMINATED` releases but exports nothing, new §7.1 which this spec defers to), **M-00 / M-04 v2.1** (`NO_GROWTH_FINAL` → non-terminal `NO_GROWTH_READY`, which then releases into the normal terminal released stage). The separate `FINAL_REPORTED` / `FINAL_RELEASED` naming divergence between the specs and the shipped build is **flagged in M-04 §3.1, not resolved** — it touches every module in the bundle and deserves a deliberate decision rather than being folded in here.

**v1.0 — 2026-06-08.** Initial canonical spec.
