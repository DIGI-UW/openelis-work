# GLASS submission on an Aspect-parity platform

**Version** 2.0 · **Date** 2026-08-08 · **Status** Draft for review
**Supersedes** `glass-downstream-impacts-and-slotting.md` v1.0 (2026-08-05), which scoped this against **WHONET** parity and a bespoke consolidated server. Casey's steer — *"we need to start with feature parity with Aspect"* — changes the substrate, and two of v1.0's conclusions were wrong as a result. Both corrections are recorded in §1.
**Basis** WHO GLASS manual 2023 (9789240076600) · `Aspect_GxAlert_to_OpenELIS_Gap_Analysis_v2.docx` (Jul 2026) · `DIGI_Engagement_Scope_Aspect_GxAlert.docx` (Aug–Dec 2026) · M-09 FRS v2.0 · M-15 FRS v1.0 · OGC-794 / OGC-918

> Tags: **[WHO]** required by the GLASS manual · **[ASPECT]** stated in the Aspect gap analysis or engagement scope · **[AS-SPECCED]** current OpenELIS plan · **[REC]** a design opinion.

---

## 1. What changed, and why it matters

v1.0 assumed OpenELIS stays strictly single-tenant per **D-001**, concluded that cross-lab aggregation therefore had to happen in a separate system nobody owned, and reasoned from there. The Aspect engagement invalidates that premise.

**Correction 1 — the consolidated server is not unowned, unbuilt, or hypothetical.** v1.0's §5 open question 1 read: *"Who owns, builds and hosts the consolidated server? This is the largest unresolved question."* **[ASPECT]** It is **W9 — Central Multi-Facility Data Model & Headless Auto-Validation**, rated HIGH, described as *"the second genuine build after TextIt"*, staffed to Engineer 2, handoff November 2026. DIGI builds; the country hosts, with data held in-country. That question is closed for this deployment.

**Correction 2 — "do not build a national dashboard" was wrong.** v1.0 §2.5 listed *"anything that looks like a national dashboard"* among the things OpenELIS should **not** build. **[ASPECT]** §3.4 rates ministry-level surveillance dashboards a HIGH gap and commits to closing it: *"the proven OHS pipeline — FHIR Data Pipes (SQL-on-FHIR → Parquet/SQL warehouse) with Superset or Power BI on top"*, plus a FHIR R4 push to DHIS2. That is **W3**, staffed to Engineer 3, handoff November. The gap analysis further notes *"the dashboard draft spec needs a refresh"* — which is exactly the existing `designs/reports/disease-surveillance-dashboard.md` v1.0.

**What did not change.** Every WHO-derived requirement in v1.0 §2 stands. The corrections are about *where the work lands and who does it*, not about what GLASS demands.

### 1.1 The finding that should shape everything else

**[ASPECT]** Counted across the full gap analysis text: **"AMR" appears 0 times. "WHONET" 0. "antimicrobial" 0. "first-isolate" 0.** Aspect is a TB/HIV/HCV/SARS-CoV-2 disease-intelligence platform, and the replacement plan inherits that scope faithfully.

So *feature parity with Aspect* is the right floor and a genuinely valuable one — but it is **not partial progress toward GLASS**. It delivers the substrate GLASS was missing and none of the content GLASS needs. Stated plainly, because the phrase "start with parity" can be heard either way:

| | Aspect parity delivers | GLASS additionally needs |
|---|---|---|
| Many sites in one view | **W9** — multi-facility model + facility attribution | Nothing more |
| Data freshness per site | **W8** — last-sync / freshness meta-dashboard | Nothing more |
| Analytics pipeline | **W3** — FHIR Data Pipes → warehouse → Superset/Power BI | AMR indicator layer (§4) |
| Automated inflow | **W9** — headless auto-validation, quarantine on error | Nothing more |
| Ministry reporting | **W3** — DHIS2 push | GLASS is a *separate* channel — not DHIS2 |
| Isolate-level AMR data | — *nothing* | Organism/antibiotic/specimen model, first-isolate dedup, RIS + SAMPLE generation, GLASS scope profile, WHONET code mapping |

Reading the bottom row as "a bit more work on top of W3" would badly under-scope it. Everything in it is net-new.

---

## 2. The architectural decision GLASS must not pre-empt

**[ASPECT]** §3.10 offers three ways to hold many facilities, and W9 will pick one:

| Option | Description | Consequence for GLASS |
|---|---|---|
| **A** | True multitenancy in one OpenELIS — *"largest change"* | GLASS aggregation happens inside OpenELIS; dedup and RIS/SAMPLE are OpenELIS features |
| **B** | Facility-as-Organization scoping in the single tenant — *"lighter … but no per-facility access isolation"* | Same as A functionally; the access-isolation gap matters for line-level patient data crossing institutional boundaries (§5) |
| **C** | Aggregate in the FHIR/analytics layer, facilities run on-site instances | **This is precisely what v1.0 called "the consolidated server."** GLASS lives in the analytics layer, fed by M-15 |

**[REC] GLASS should state its requirements against all three and consume whichever W9 chooses.** Re-litigating the tenancy decision from the AMR side would duplicate a decision already scoped, staffed and scheduled — and W9 is deciding it for a national TB/HIV programme with far more weight behind it than the AMR use case currently carries.

The requirements GLASS places on that decision, whichever option wins, are only these four:

1. **Line-level records, not aggregates.** **[WHO]** *"All consecutive isolates (and negative samples) should be submitted to the NCC, which will remove duplicate results."* De-duplication needs the individual records; a pre-aggregated warehouse cannot produce a first-isolate set.
2. **Stable facility attribution on every record.** GLASS surveillance is stratified by site; whichever mechanism W9 picks must survive into the AMR record.
3. **Retention and reproducibility.** Countries revise prior years. A prior period's submission must be reproducible exactly — versioned scope profiles, versioned dedup parameters, immutable source records.
4. **A non-OpenELIS ingest route.** Not every lab in a country runs OpenELIS. This is the one place Aspect parity genuinely helps: **[ASPECT]** Aspect already connects *"any device"* across 3,500+ labs, so a file/API intake path is native to the platform being replaced, and dropping it would be a regression.

### 2.1 D-001 is now in tension and needs an explicit ruling

**D-001** (GLOBAL, active) reads: *"Single-tenant per deployment; no lab/site/tenant selector."* Options A and B both contradict it directly; option C preserves it by pushing the multi-site view outside OpenELIS.

**[REC]** This is not a GLASS decision to make, but GLASS is the second workstream to hit it, so it is worth surfacing now rather than discovering it twice. Either D-001 gets scoped ("single-tenant for facility deployments; the national instance is a distinct deployment profile") or it gets superseded by whatever W9 rules. Leaving it silently contradicted is the bad outcome — the decision log exists so that a design can be checked against it, and an active GLOBAL row that the flagship engagement is about to break makes every future `/crosscheck` unreliable.

---

## 3. What each OpenELIS lab instance must still do

Unchanged from v1.0 in substance. These are cheap, they prevent classes of silent error, and **none of them depend on W3/W9 landing** — they deliver value to a country using WHONET by hand today.

### 3.1 M-09 WHONET Export (OGC-794) — four changes

| # | Change | Type | Effort |
|---|---|---|---|
| 1 | **Flip de-duplication to "send everything"** — emit all consecutive isolates with the repeat marker. Keep site-side dedup as a configurable option for national protocols that require it. | Behaviour | Small — M-09 already has *"Include with R marker"*; it is the wrong default |
| 2 | **Correct the 7-day window and its helper string.** The shipped i18n string asserts *"WHO GLASS default is 7 days."* **[WHO]** says one result *per surveillance period, for example 12 months*. Seven days is CLSI M39, valid for local antibiograms (M-13), not GLASS. | **Factual correction** | Trivial |
| 3 | **Export negatives.** No-growth and non-GLASS-pathogen results for GLASS specimen types, with collection date, age, sex and derived origin. Filter by test *intent* so stool-for-O&P and genital-swab-for-microscopy don't inflate the denominator. | **New capability** | Medium |
| 4 | **Split `INFECTION_ORIGIN` from ward/location.** Today's vocabulary (`INP/OUT/ICU/EME/LTC`) is *where the patient is*. GLASS `ORIGIN` is `HO/CO/UNK`, derived from admission date + collection date on a >2-calendar-day rule. | New derivation | Small, now that the input exists |

**Change 3 remains the highest-value single item in this analysis.** Without negatives the SAMPLE dataset cannot be built, so a country can report **percentage resistance only, never infection rates per 100 000**. That ceiling is invisible until an NCC tries to build SAMPLE and cannot — and it is a ceiling created by a LIMS design choice, not by the country's data.

### 3.2 M-03 Order Entry — dependency now satisfied

**[WHO]** ORIGIN derivation needs date of admission. v1.0 flagged this as an open dependency on already-shipped work. **Closed 2026-08-05**: M-03 v2.1 adds Date of Admission (OGC-789, PR #254), and v2.2 refines the surrounding tile. Degradation is specified — outpatients resolve to `CO` without a date; admitted patients without one are `UNK` — so partial adoption still improves on today, where every record is `UNK`.

### 3.3 M-15 FHIR push (OGC-918) — now the natural fit, not an optimisation

v1.0 ranked M-15 *"later — genuinely an optimisation"*, on the reasoning that file export works and most NCCs accept files. **[REC] That ranking should rise if W9 lands option A or B**, because M-15's FHIR push is then the same mechanism the platform already uses to get results into the central instance. Building a parallel file path for AMR only, alongside a FHIR path everything else uses, would be the odd choice.

Two adjustments stand: remove lab-side dedup from the push path (OGC-921's acceptance still says *"lab-side first-isolate dedup (M-09) selects eligibles"*), and make **"M-09 and M-15 emit the same record set"** an architectural constraint rather than an aspiration — one shared surveillance-record-selection service consumed by both. If they diverge, an NCC receiving both gets two different numbers for the same lab and no way to tell which is right.

### 3.4 M-02 Breakpoint catalog — unchanged and already correct

Reviewed AST runs retain the standard they were interpreted against; activating a new standard does not recalculate history. That is exactly what surveillance needs — a resubmission of a prior period must reproduce the original interpretations. Recorded explicitly so nobody "improves" it later.

---

## 4. The AMR layer on W3

**[ASPECT]** W3 delivers *"OHS FHIR Data Pipes → warehouse → Superset/Power BI dashboards; DHIS2 push scoped; spec refreshed"*. The pipe is committed. The AMR content is not, because nothing in the engagement is AMR-shaped.

**[REC]** Treat the AMR indicators as a **content layer on the refreshed dashboard spec**, not a separate dashboard product. The existing `disease-surveillance-dashboard.md` v1.0 is a FHIR *publication-completeness* spec — DiagnosticReport, Observation, ServiceRequest, Device and Organization completeness plus Superset/DHIS2 URL configuration. It defines what must be in the FHIR store for dashboards to be possible; it does not define any indicator. The AMR layer is specified separately in **`glass-amr-dashboard-indicators.md`** (companion to this document).

Two things that must not be conflated, because they use the same data and answer different questions:

- **The GLASS submission** is a periodic, tightly-specified export to WHO in a fixed file format, produced for a human focal point to upload. It is not a dashboard.
- **The AMR dashboards** are continuous, locally-defined views for a programme. They are far more useful day-to-day and have no WHO format constraints.

Building the second and calling it the first is a failure mode worth naming: a country can have excellent AMR dashboards and still be unable to submit to GLASS.

---

## 5. Open questions

Renumbered; v1.0's #1 (ownership) is closed, and #2–#6 survive with the Aspect frame applied.

1. **Which W9 option?** A, B or C (§2). Decided by the TB/HIV engagement, not by AMR — but AMR should be in the room, because option B's *"no per-facility access isolation"* has direct consequences for #3 below.
2. **One server per country, or one multi-country instance?** GLASS submission is national, so per-country is the natural unit; a shared instance is cheaper to run and has data-sovereignty consequences. **[ASPECT]** The engagement scope states data is *"held in-country"*, which points to per-country.
3. **Does the central instance hold identifiable data?** Line-level records with patient identifiers, dates and locations crossing an institutional boundary is a different governance question from aggregate submission. GLASS's own line-listed option is **anonymized**. Option B's lack of per-facility access isolation sharpens this considerably.
4. **What is the ingest contract for non-OpenELIS labs?** Accepting WHONET file exports is pragmatic, but WHONET's own GLASS export **already de-duplicates**, which violates the send-everything rule. Those labs should send WHONET *line-level* data instead — and that needs stating in the interface document, not discovered later.
5. **Countries not enrolled in GLASS.** No direct route exists. The platform should still be useful — holding GLASS-shaped output until a national channel exists, and feeding local antibiograms (M-13).
6. **Retention and resubmission.** Covered by requirement 3 in §2, but needs an owner.

---

## 6. Sequencing

**[REC]** Ordered so that stopping early still leaves value.

**Now — corrections that prevent wrong data.** None depend on W3/W9.

1. Fix the 7-day default and helper string (M-09).
2. Flip the dedup default to send-everything, with `surveillance.dedup.performedBy = NCC | SITE`, defaulting `NCC`.
3. Reword OGC-924 from *"generates the GLASS submission"* to *"produces GLASS-conformant RIS + SAMPLE files for the focal point to upload."* No system submits to GLASS — **[WHO]** platform credentials are personal and non-shareable, so the pipeline's job ends at a conformant file and a human who can see it is ready.
4. Housekeeping — reconcile OGC-921/923 and OGC-879/881 showing Done under Backlog parents; retitle OGC-918 to separate GLASS-AMR from DR-TB, since *M. tuberculosis* is not a GLASS-AMR pathogen.
5. **Raise the D-001 ruling** (§2.1) before W9 commits, not after.

**Next — the export that makes SAMPLE possible.**

6. Negatives export (M-09) — do this even if W3/W9 slip.
7. `INFECTION_ORIGIN` derivation (M-09), input now available.
8. Versioned GLASS scope profile as reference data — used for readiness display and warnings, **not** row filtering. *"Of your 12 GLASS-target organisms, 12 are mapped"* is far more actionable than a count of all 47.

**Then — ride W3/W9 as they land.**

9. AMR indicator layer on the refreshed dashboard spec (§4).
10. First-isolate dedup + RIS/SAMPLE generation, on whichever tenancy W9 picks.
11. Code-mapping queue for unmapped organisms/antibiotics/specimens.
12. M-15 FHIR push — priority contingent on the W9 outcome (§3.3).

**The argument in one line:** everything in *Now* and *Next* has standalone value even if W3 and W9 never ship, because the same corrected export feeds an NCC using WHONET today.

---

## 7. The risk worth naming

v1.0 named the risk that the consolidated server might never be built. Aspect parity substantially retires it — the platform is funded, staffed and scheduled to November 2026.

**[REC] The replacement risk is subtler and worth watching: that AMR gets assumed into a TB/HIV engagement.** W3 and W9 will deliver multi-site aggregation and national dashboards, and it will be reasonable for everyone involved to conclude that surveillance is handled. It will be — for TB and HIV. The counts in §1.1 are the evidence that AMR is not in that scope, and the gap will not announce itself; it will surface when someone tries to build a SAMPLE dataset and finds no denominators.

The mitigation is cheap: name AMR explicitly as out of scope for W3/W9 in the engagement's own documentation, so the boundary is written down where the delivery team will see it rather than only here.

---

*Companion: `glass-amr-dashboard-indicators.md` (indicator layer), `glass-submission-console.html` (submission surface mockup). Supersedes `glass-downstream-impacts-and-slotting.md` v1.0.*
