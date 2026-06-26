# M-10 Hub Subscription — SUPERSEDED (retired; folded into Catalog Subscription)

**Version:** 3.0 (retirement) · **Date:** 2026-06-12 · **Status:** Retired — do not build as a standalone module.

> **This module is retired.** The bespoke "Hub Subscription" mechanism specified in v2.0 (its own `hub_subscription_config` / `hub_import_run` tables, a custom CSV/REST hub, a parallel discovery-signal + diff + audit) duplicates an existing, more capable feature already designed and on `main`: **Catalog Subscription & Metadata Sync** (`designs/admin-config/catalog-subscription.md`, v1.2). Per Casey (2026-06-12), the AMR reference-data update path is **Catalog Subscription + M-02 file import**, not a second hub. The v2.0 content is preserved in git history.

---

## 1. Why retired

Catalog Subscription already provides everything M-10 v2.0 proposed, FHIR-natively:

| M-10 v2.0 proposed | Catalog Subscription already does it |
|---|---|
| Subscribe to a central hub (`hub.openelis-global.org`) | **OpenELIS Community Hub** registry (FR-1-009…012) — a FHIR registry server with a browseable catalog of publishers |
| Pull breakpoint table updates | Pulls **`PlanDefinition`** resources; §4.5 explicitly diffs **EUCAST breakpoint sets** at organism × antimicrobial × S/I/R × MIC granularity |
| Pull organism / antibiotic / test-reference updates | Pulls **`ActivityDefinition`** (tests) with canonical-URL + LOINC identity matching |
| Preview diff; preserve locally-customized rows; explicit override | Field-level **accept/reject** diff that defaults to preserving local edits (FR-4) |
| Auto-check + "N updates available" discovery signal | Background `CatalogSyncJob` + pending-updates nav badge (FR-2, FR-6-001) |
| Import history + per-record audit | Audit trail per sync run + per field decision (FR-6-002) |

M-10's only **genuinely new** requirements are the three deltas in §2. Everything else was duplication.

## 2. The AMR delta — what Catalog Subscription must add to absorb M-10

These are the only requirements that don't already exist in Catalog Subscription v1.2. They should be added there (as extension stories under Catalog Subscription's epic), **not** built as a separate hub:

1. **Breakpoint "loaded → not active → activate" hand-off (M-02).** When Catalog Subscription applies a `PlanDefinition` breakpoint set, the new `breakpoint_standard` lands with `status = Loaded`, **never auto-activated**. The apply-summary surfaces an **"Activate in Breakpoint Catalog →"** deep-link into M-02 §8, where a lab manager sets the effective date and activates. (Catalog Subscription today writes mapped fields directly; for breakpoints it must route through M-02's activation gate so historical AST runs keep their snapshotted version.)
2. **WHONET code-mapping domain.** WHONET organism/antibiotic/specimen/origin code mappings (consumed by M-09) aren't `ActivityDefinition`/`PlanDefinition`. Add them as a reference-vocabulary catalog type — candidate FHIR shape: `CodeSystem` / `ConceptMap`. Open question for the Catalog Subscription owner: model as a third resource type, or sync as OE reference data.
3. **Organism / Antibiotic master sync (M-01).** Catalog Subscription's `ActivityDefinition` mapping is test-centric. Organism Master and Antibiotic Master (M-01) entries — including intrinsic resistances and WHONET codes — need either their own resource type or a reference-data sync path. Flag for the Catalog Subscription owner.

## 3. The realistic breakpoint-update model (the actual design question)

Breakpoints (CLSI/EUCAST/WHO-TB) are **reference data that changes ~annually** and that turns a raw MIC/zone into S/I/R. Antibiograms (M-13) are **not** updated — they recompute %S on demand from finalized results against whatever breakpoint version was active, so they need no update channel; they only depend on breakpoints being current + M-09 first-isolate dedup.

Two realistic update layers (no bespoke hub):

- **Floor (offline, must-have):** ship a current EUCAST/CLSI set at install + import annual update **files** via **M-02 §7 CSV import** + activation. Works with no connectivity. Seed/update content sourced from the open-source **AMR R package** (encodes EUCAST + CLSI interpretation rules with SNOMED/LOINC) — the same source chosen for M-09.
- **Connected sites:** **Catalog Subscription** pulls a EUCAST / WHO / national-reference-lab FHIR catalog (or the Community Hub) and a manager reviews + applies the annual diff (with the §2.1 M-02 activation gate for breakpoints).

**Reality checks:**
- Cadence is annual, not continuous — the realistic interaction is "a manager imports a file or reviews a diff and activates, once a year." A live-polling hub is more than the problem needs.
- The actor is a **lab manager / national reference lab**, never a bench tech.
- **Gating dependency (owns every auto-update path):** a clean, **licensed, machine-readable** breakpoint source. CLSI content is copyrighted/not freely redistributable; EUCAST is more open; the AMR R package is the practical open source. Whether anyone publishes a maintained FHIR breakpoint catalog or operates the OE Community Hub is an **ownership/licensing** question to resolve before betting on any subscription mechanism — it does not change the UI.

## 4. Disposition

- **Jira:** epic **OGC-795** retired; stories **OGC-882 / OGC-884** closed as superseded by Catalog Subscription. The §2 deltas should be created as extension stories under the Catalog Subscription epic when it's set up (its spec lists Jira as `OGC-[TBD]`).
- **M-02 (Breakpoints):** unchanged and now the offline update path of record (CSV import + activation). It also receives the activation hand-off from Catalog Subscription (§2.1).
- **M-09 (WHONET):** consumes the WHONET-code domain (§2.2) once Catalog Subscription adds it; unaffected otherwise.
- **M-00 module map:** M-10 marked retired.

## 5. References

- `designs/admin-config/catalog-subscription.md` (v1.2) — the surviving feature.
- M-02 Breakpoint Catalog (CSV import §7, activation §8).
- M-01 AMR Reference Data; M-09 WHONET Export.
- AMR R package (open-source EUCAST/CLSI interpretation + WHONET/SNOMED/LOINC crosswalk) — candidate seed/update source.
