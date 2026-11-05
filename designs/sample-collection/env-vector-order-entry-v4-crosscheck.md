## Crosscheck: Environmental and Vector Order Entry v4

**Verdict:** ⚠ Proceed with coordination. The design reuses the same order save path as clinical (`SamplePatientEntryServiceImpl.persistData`), so the environmental and vector MVP must land alongside clinical M1, M4 and M5, not against them. Next step: settle the two open items at the bottom, then write the design brief.

Researched against develop 44dbc44 (2026-09-26), the decision log (up to D-084), the spec registry and open OGC tickets.

### Footprint

**Entities:**
- Sample and SampleItem.
- `VectorSamplingSite`, which serves both environmental and vector sites.
- `VectorPool`.
- `SampleItemQcProfile`.
- Observations: `ENV_*`, `VS_*`, `ENV_PRESERVATION_METHOD`.
- Dictionaries: "Sample Container", "Env Collection Method", "Env Weather".
- Sample storage, Referral, NCE, label presets.
- The config keys `sampleAcceptCheck.environmental` and `sampleAcceptCheck.vector`.

**Routes and pages:**
- `/order/environmental/enter|label|qa` and `/order/vector/enter|label|qa|complete`.
- The Sampling Sites admin page.
- The environmental and vector dashboards.

**Shared concepts:**
- Whole-step save (D-072), two required levels (D-074), server clock (D-075), shared components (D-073), numbering (D-082).
- Pool group row, QC child row.
- Holding time.
- Domain enum (D-004).
- Environmental Compliance Standards (D-068).

**Write, delete and state actions:**
- Order save; sampling-site create.
- Organism fan-out and intake pool create.
- The parent sample item at fan-out: hard-deleted today, voided after this work.
- QC profile write; storage and referral writes.
- Cancel order.

### Contradictions (vs the decision log)

| Design or code | Decision | Conflict | Severity |
|---|---|---|---|
| Built: `VectorPoolFanOutServiceImpl` hard-deletes the parent sample item and its barcode row (lines 135-146) | D-002 | Hard delete of a domain record. This design fixes it by keeping the parent as the catch sample (C-6, MVP). | CRITICAL in develop, resolved by this design |
| Built: vector organism members have no `externalId`; a code comment claims "accession.sortOrder" | D-082 | No sample number on a physical specimen. C-1 needs a rule for organisms (open item 1). | HIGH |
| This design: container numbering in all three domains (C-1) | D-082 (FEATURE, clinical only) | An intended reversal. Supersede D-082 with a GLOBAL decision: containers use `-n` and `-n.m`; vector pools use `-P01` and `-S1` labels. | resolve by new decision |
| Built: holding time at intake anchors on received time; the Results over-hold flag anchors on collection time | none; internal inconsistency | Two clocks for one limit. This design anchors both on collection time (C-3). | MEDIUM |
| OGC-1068 comment: environmental save level is site, requester and sample; OGC-1068 body: "Site + Compliance Standard required" | none | Compliance standard's required level is undecided (open item 2) | MEDIUM |

No contradiction with D-001 (single tenancy), D-004 (domain enum) or D-068 (compliance standards) was found.

### Overlaps (vs the spec registry and sibling specs)

| With | Shared element | Why it matters | Severity |
|---|---|---|---|
| Clinical Order Entry v4 (OGC-1266) | `persistData`, one save path for all domains; the shared tables | The environmental and vector MVP save changes (site create inside the transaction, fan-out void) edit the same method clinical M1 and M4 rewrite. Sequence them together. | HIGH |
| Environmental QC evaluation (OGC-554 S-08) | `SampleItemQcProfile`, written at intake today | QC rows (C-5) must keep writing the same profile; S-08 evaluation reads it | HIGH |
| V-03 Vector Testing & Identification | `VectorPool` labels, deconvolution | V-03 FR-V03-DEC-006, results-entry-v4 FR-I2, the style guide and env-vector-workflows describe `LABNO.X-Y`, which the code doesn't do. Correct them to C-1. | MEDIUM |
| V-04 Vector surveillance reporting | FHIR `Specimen` graph (`Specimen.parent`, `{acc}-{n}` identifiers) | Organism numbers (open item 1) become FHIR identifiers. Pools must stay derivable. | MEDIUM |
| CSV Bulk Sample Intake (OGC-1138, OGC-1075) | Rows in the samples table | Imports must go through the same rows, required levels and save | MEDIUM |
| M-16 Cluster Detection | `VectorSamplingSite` coordinates | Site create and no-overwrite rules change the data M-16 reads | LOW |
| Sampling Sites admin (OGC-1161), dictionary seeds (OGC-1182) | Sites, containers, collection methods | Empty dictionaries on a fresh install block the required fields. Link as prerequisites. | MEDIUM |

### Dependencies

**Upstream (must exist first):**
- Clinical M1 (idempotent save), M4 (one-save pattern), M5 (footer, required levels, checklist) for the MVP.
- Clinical P1 (Container Types, taking over the environmental "Sample Container" dictionary and preservative) and P7 (samples table) for phase 2.
- OGC-1182 seeds and OGC-1161 empty states, so required fields can be filled on a fresh install.

**Downstream (affected, may need re-review):**
- V-03 workbench (pool labels, member numbers).
- V-04 FHIR push.
- S-08 QC evaluation.
- Results entry (child numbering text).
- Environmental and vector dashboards (OGC-1192, In Progress).
- CSV intake.

**In flight (never close; link):**
- OGC-1192 (Mozzy, In Progress): environmental orders missing from dashboards.
- OGC-1049, OGC-1050, OGC-1051 (Herman, In Progress).

  OGC-1050 (a blank Collect page for environmental) becomes moot once environmental has no Collect route. Let it finish or close it with Herman's agreement.

### You may be forgetting (things to build once)

- **One sample-number formatter** for all three domains, plus one pool-label formatter. Parent links come from the parent pointer or pool, never from parsing a label (`stripLastSegment` in `VectorDeconvolutionServiceImpl` splits on `-`).
- **One "void, never delete" helper** for fan-out that other flows reuse (deconvolution, aliquot voids).
- **Sample check setting:** reuse the existing `sampleAcceptCheck.<domain>` keys (MANDATORY / OPTIONAL / OFF) rather than adding a new one. Off hides the step, matching clinical FR-F2.

### Registry upkeep triggered by this run

- **Env/Vector order entry row:** point it at the new FRS, and replace "aliquot LABNO.X-Y" with the C-1 scheme.
- **Registry note "no environmental sampling-site entity (vector only)":** it misleads. Environmental sites are stored as `VectorSamplingSite`. Reword it.
- **Candidate decisions:**
  - Container numbering GLOBAL, superseding D-082.
  - Pools labelled as groups.
  - Fan-out voids the parent.
  - Field QC at intake.
  - Environmental and vector use one step plus Sample check.

### Open items for Casey

1. ~~Organism numbers~~ **Settled (C-6):** the catch stays sample `-1`; its organisms are `-1.1` onward; pool `-P01` groups them.
2. ~~Compliance standard's level~~ **Settled (C-7):** complete level; "No standard (investigative)" is an explicit choice.
