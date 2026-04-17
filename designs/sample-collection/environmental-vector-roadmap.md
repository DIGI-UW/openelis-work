# Environmental & Vector Testing Module — Roadmap

**Epic:** [OGC-527 — Vector: Environmental & Vector Testing Module](https://uwdigi.atlassian.net/browse/OGC-527)
**Last Updated:** 2026-04-16
**Target:** SILNAS (Indonesia) as first implementation; designed for international use
**PRD Alignment:** Crosswalked against *PRD Human, ENV, Vector & BPP Module Ver. V.0.5* (2026-01-16)

---

## Architecture Overview

The module is built across **4 architectural layers**, with specs progressing from foundational infrastructure through integration glue to analytical/reporting capabilities and cross-cutting operational workflows.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: Cross-Cutting Operational Workflows (PRD gaps)               │
│  S-09  S-10  S-11  S-12  S-13  S-14                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 3: Analytics, Reporting & Vector-Specific                       │
│  S-05  S-06  S-07  S-08  V-01  V-02  V-03  V-04                      │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 2: Integration & Workflow                                       │
│  S-03  S-04                                                            │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 1: Foundational Infrastructure                                  │
│  S-01  S-02  + Sample Collection Redesign + OGC-296                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Progress Tracker

### Layer 1 — Foundational Infrastructure

These specs define the core entities and admin interfaces that everything else builds on.

| Spec | Title | Jira | Status | Deliverables |
|------|-------|------|--------|-------------|
| **S-01** | Compliance Standards Administration | [OGC-528](https://uwdigi.atlassian.net/browse/OGC-528) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview |
| **S-02** | Sampling Site Registry | [OGC-531](https://uwdigi.atlassian.net/browse/OGC-531) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview |
| — | Sample Collection Redesign (4-step workflow) | *(pre-existing)* | **Spec Complete** | FRS v2.0, HTML mockup |
| — | Sample Type Domain Flag (clinical/environmental/both) | [OGC-296](https://uwdigi.atlassian.net/browse/OGC-296) | **In Progress** (needs env addendum) | Existing module — needs `sampleDomain` enum |

**Layer 1 summary:** 3 of 4 specs complete. OGC-296 needs a small addendum to add `sampleDomain` enum (`CLINICAL`, `ENVIRONMENTAL`, `BOTH`) to the SampleType entity. This is a cross-cutting dependency — not part of the Vector epic, but required by S-03 and everything above.

### Layer 2 — Integration & Workflow

These specs wire the foundational entities into the order entry and results workflows.

| Spec | Title | Jira | Status | Deliverables |
|------|-------|------|--------|-------------|
| **S-03** | Environmental Order Entry Integration | [OGC-537](https://uwdigi.atlassian.net/browse/OGC-537) | **Spec Complete** | FRS v1.0 (merged into Sample Collection Redesign FRS v2.0), JSX mockup, HTML preview |
| **S-04** | Sample Type Domain Classification | [OGC-538](https://uwdigi.atlassian.net/browse/OGC-538) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview (addendum to OGC-296) |

**Layer 2 summary:** Both specs complete. S-04 adds `sampleDomain` enum (CLINICAL/ENVIRONMENTAL/BOTH) to the SampleType entity as an addendum to OGC-296. This enables the workflow toggle to filter sample types and S-03's checklist to show only relevant types.

### Layer 3 — Analytics, Reporting & Vector-Specific

These specs add the analytical engine, compliance reporting, and vector-specific extensions.

| Spec | Title | Jira | Status | Description |
|------|-------|------|--------|-------------|
| **S-05** | Compliance Evaluation Engine | [OGC-547](https://uwdigi.atlassian.net/browse/OGC-547) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview — auto-evaluate results against ComplianceThresholds with pass/marginal/fail indicators, descriptive tag library, unit conversion, override workflow |
| **S-06** | Laporan Hasil (Compliance Report) | [OGC-552](https://uwdigi.atlassian.net/browse/OGC-552) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview — formal Sertifikat Hasil Uji PDF generation with shared Report Print Configuration, dual e-signature, batch ZIP download, audit trail |
| **S-07** | Environmental Dashboard & Trend Analysis | [OGC-553](https://uwdigi.atlassian.net/browse/OGC-553) | **Spec Complete** *(needs S-07a addendum)* | FRS v1.0, JSX mockup, HTML preview — site-level compliance rate trends (monthly/12mo), per-parameter drill-down, exceedance summary table, site comparison bar chart, CSV export. **PRD gap:** needs geographic map view (see S-07a below) |
| **S-08** | Environmental QC Rules | [OGC-554](https://uwdigi.atlassian.net/browse/OGC-554) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview — field blank, trip blank, duplicate sample (RPD), spike recovery. Per-standard QC protocol config, QC sample creation at order entry, inline QC results tab, acknowledgment modal on validation |
| **V-01** | Vector Specimen Types & Taxonomy | [OGC-555](https://uwdigi.atlassian.net/browse/OGC-555) | **Spec Complete** | FRS v1.3, JSX mockup, HTML preview — species taxonomy (genus/species/subspecies), trap types, vector sample types with pooling strategy (INDIVIDUAL/POOL_FIXED/POOL_VARIABLE). Extends SampleType.sampleDomain with VECTOR, adds VectorSpecimenProfile, seeds ~40 species + 15 trap types |
| **V-02** | Vector Collection Workflow | TBD | **Not Started** | Registration, eligibility gate, sample input (coordinates, trap data, pool/individual), CSV/XLS import, distribution to analyst, QR code labeling. PRD Tables 16 rows 2–14 map here. |
| **V-03** | Vector Testing & Identification | TBD | **Not Started** | Manual + analyzer-interfaced testing, instrument QC gating, reflex test triggers, species ID (morphological + molecular), pathogen screening panels, pool deconvolution, storage disposition. PRD Table 17 maps here. |
| **V-04** | Vector Surveillance Reporting | TBD | **Not Started** | Dual verification→validation pipeline (Verificator then Validator), e-Sign integration, LH numbering, PDF generation/download, density indices, infection rates, distribution maps, outbreak alerts. PRD Table 18 maps here. |

**Layer 3 summary:** 5 of 8 environmental specs complete + V-01 complete. V-02/V-03/V-04 not started but now enriched with PRD user stories. S-07 needs a geographic map addendum.

### Layer 4 — PRD Gap Items (Addendums & New Specs)

Capabilities identified in the SILNAS PRD v0.5 that our original S-series did not cover. After reviewing existing OpenELIS functionality, most of these are **addendums** to existing modules rather than full new specs. Only S-10 is a genuinely new standalone spec; S-13 is deferred pending contractor delivery.

| Spec | Title | Type | Extends | Status | Description | PRD Source |
|------|-------|------|---------|--------|-------------|------------|
| **S-07a** | Geographic Map Dashboard View | Addendum | S-07 | **Not Started** | Leaflet/OpenLayers choropleth map with case markers (size = count, color = sample type), case detail pop-up, cluster boundaries, disease toggle, PNG/PDF export. | PRD ENV Table 10, row 5 |
| **S-09** | Pre-Analytical Eligibility Gate & Resampling | Addendum | Sample Collection Redesign (Step 2) | **Not Started** | Formal Eligible/Non-Eligible decision point after sample receipt. OE already has NCE system and configurable sample rejection — this addendum formalizes it as a gate with resampling loop (notify customer, re-submit), QR label generation on pass, status transitions (Received → Eligible/Non-Eligible → Pending/Resampling/Rejection). | PRD ENV Table 11 rows 10–12; Vector Table 16 rows 10–11 |
| **S-10** | Sample Distribution & Analyst Assignment | New spec | — | **Not Started** | Assign eligible samples to specific analysts/departments. Worklist by department, read-only registration summary, Baku Mutu display, distribution confirmation. OE has RBAC department scoping but no analyst assignment UI or department worklist. | PRD ENV Table 11 rows 14–15; Vector Table 16 row 14 |
| **S-11** | Instrument QC Gating | Addendum | S-08 / existing QC module | **Not Started** | OE already has analyzer manual QC, QC status panel, overdue alerts, Westgard rules, and auto-NCE on failure. This addendum adds the PRD's requirement: block testing if instrument QC is overdue/failed, display warning before analyst can proceed. May already be partially implemented. | PRD ENV Table 12 rows 3–4; Vector Table 17 rows 3–4 |
| **S-12** | Dual Verification → Validation Pipeline | Addendum | Existing OE validation workflow | **Not Started** | OE already has multi-level validation (validation 1/2 support) and enhanced validation screen. This addendum adds explicit Verificator→Validator role routing, return-to-analyst amendment loop with revision flags, and correction tracking per the SILNAS dual-stage model. | PRD ENV Table 13; Vector Table 18 |
| **S-13** | Payment & Billing Integration | **Deferred** | — | **Awaiting contractor** | Independent contractor is building payment/billing. We will adapt their deliverable for ENV/Vector integration rather than spec from scratch. PRD scope: payment status (Unpaid→Paid), payment type (General/Program), receipt printing, gateway integration. Optional gate — samples can proceed even if Unpaid. | PRD ENV Table 11 row 13; Vector Table 16 row 12 |
| **S-14** | Inter-Lab Sample Transfer & Referral | Addendum | Existing OE referral module | **Not Started** | OE already has referral infrastructure, FHIR R4 external lab integration, and a referral dashboard. This addendum adds: transfer reason input, target lab selection from predefined list, WhatsApp/email notification to target lab and customer, transfer history tracking, and inbound referral registration processing. | PRD ENV Table 11 row 9, row 3; Vector Table 16 row 9, row 3 |
| **S-15** | Bulk Sample Import (CSV/XLS) | Addendum | S-03 / existing import infra | **Not Started** | OE already has `generic_sample:import` permission and analyzer file upload. This addendum adds: downloadable CSV/XLS template per sample type, coordinate validation, parameter/Baku Mutu assignment, duplicate detection, import preview with error highlighting. | PRD ENV Table 11 row 5; Vector Table 16 row 5 |

**Layer 4 summary:** 8 items from PRD crosswalk. 1 new spec (S-10), 6 addendums to existing modules, 1 deferred (S-13 — awaiting contractor). The addendum approach significantly reduces effort since OpenELIS already has NCE, QC, multi-level validation, referral, and import infrastructure.

---

## PRD Crosswalk Summary

Source document: *[Revise] PRD Human, ENV, Vector & BPP Module Ver. V.0.5*

### What our specs cover that the PRD does not detail

| Our Spec | Capability | PRD Coverage |
|----------|-----------|--------------|
| **S-01** | Compliance Standard admin with threshold management | PRD references "Baku Mutu" but has no admin interface spec |
| **S-02** | Sampling Site Registry as a dedicated entity | PRD has no site management entity |
| **S-04** | Sample Type Domain Classification (CLINICAL/ENV/BOTH/VECTOR) | PRD does not distinguish at sample type level |
| **S-05** | Compliance Evaluation Engine (auto pass/marginal/fail, descriptive tags, unit conversion) | PRD says "validate against reference ranges" — no detail |
| **S-08** | Environmental QC Rules (field blank, trip blank, RPD, spike recovery) | PRD has generic "QC" mention only |
| **Sample Collection Redesign** | Decoupled 4-step order entry with step-independence, barcode scan, OrderContext | PRD uses traditional sequential workflow |

### What the PRD covers that our specs did not (now addressed in Layer 4)

| PRD Requirement | Spec | Type | Notes |
|----------------|------|------|-------|
| Geographic map (Leaflet/OpenLayers, choropleth, clustering) | **S-07a** | Addendum to S-07 | Net-new UI component |
| Eligibility gate with resampling loop | **S-09** | Addendum to Sample Collection Redesign | OE has NCE + sample rejection — formalize as gate |
| Sample distribution to analysts | **S-10** | **New spec** | OE has RBAC but no assignment UI |
| Instrument QC gating before testing | **S-11** | Addendum to S-08 / QC module | OE has QC infrastructure — add gating UX |
| Dual Verificator → Validator pipeline | **S-12** | Addendum to OE validation | OE has multi-level validation — add role routing |
| Payment/billing integration | **S-13** | **Deferred** | Awaiting independent contractor delivery |
| Inter-lab transfer/referral | **S-14** | Addendum to OE referral | OE has referral + FHIR — add notifications + tracking |
| Bulk CSV/XLS sample import | **S-15** | Addendum to S-03 / import infra | OE has import permission — add templates + validation |

---

## Dependency Graph

```
OGC-296 (Sample Type Management) ──────────────────────────────┐
                                                                │
S-01 (Compliance Standards) ──┐                                 │
                              ├── S-03 (Order Entry) ──┐        │
S-02 (Sampling Site Registry) ┘         │              │        │
                                        │              ├── S-04 (Sample Domain)
Sample Collection Redesign ─────────────┘              │
       │                                               ├── S-05 (Evaluation Engine)
       │                                               │
       └── S-09 (Eligibility Gate) ← addendum Step 2   ├── S-06 (Laporan Hasil)
                │                                      │
                └── S-10 (Distribution) ← new spec     ├── S-07 (Dashboard/Trends)
                                                       │        └── S-07a (Map) ← addendum
                                                       │
                                                       └── S-08 (Environmental QC)
                                                                └── S-11 (Inst. QC) ← addendum

Addendums to existing OE modules (no S-series dependency):
  S-12 (Verification Pipeline) ← addendum to OE validation module
  S-14 (Inter-Lab Transfer)    ← addendum to OE referral module
  S-15 (Bulk Import)           ← addendum to OE import + S-03 templates

Deferred:
  S-13 (Payment/Billing)       ← awaiting independent contractor delivery

V-01 (Vector Specimens) ── V-02 (Collection) ── V-03 (Testing) ── V-04 (Surveillance)
     │                         │                     │                  │
     │                         ├── S-09 (Elig.)      ├── S-11 (Inst.QC) ├── S-12 (Verif.)
     │                         ├── S-10 (Distrib.)   │                  │
     │                         └── S-15 (Import)     │                  │
```

---

## Recommended Build Order

| Phase | Specs | Type | Rationale |
|-------|-------|------|-----------|
| **Phase 1 — Foundation** | S-01, S-02, Sample Collection Redesign | Spec complete | Core entities and 4-step workflow. Can be built in parallel. |
| **Phase 2 — Integration** | S-04 (sample domain), S-03 (order entry) | Spec complete | S-04 first (small, unblocks filtering), then S-03 wires everything together. |
| **Phase 3 — Compliance Loop** | S-05 (evaluation), S-06 (reporting) | Spec complete | Completes the end-to-end compliance workflow: enter → test → evaluate → report. |
| **Phase 4 — Operational** | S-07 (dashboard), S-08 (QC rules) | Spec complete | Adds operational tooling for environmental labs — trends, quality control. |
| **Phase 5 — PRD Addendums** | S-09 (eligibility gate), S-10 (distribution), S-15 (bulk import) | 1 new + 2 addendums | Formalizes the pre-analytical workflow. S-09 extends Step 2 with NCE-based gate, S-10 is new (analyst assignment), S-15 extends existing import infra. |
| **Phase 6 — PRD Addendums cont.** | S-11 (instrument QC), S-12 (verification pipeline), S-14 (transfer) | 3 addendums | Light extensions to existing OE modules. S-11 adds QC gating UX, S-12 adds role routing to validation, S-14 adds notification to referral. Can be built in parallel. |
| **Phase 7 — Dashboard Enhancement** | S-07a (geographic map) | Addendum | Adds Leaflet/OpenLayers map view to existing S-07 dashboard. |
| **Phase 8 — Vector** | V-01, V-02, V-03, V-04 | 1 complete + 3 new | Extends the environmental framework to vector surveillance. Sequential dependencies. V-02 consumes S-09/S-10/S-15; V-03 consumes S-11; V-04 consumes S-12. |
| **Deferred** | S-13 (payment/billing) | Awaiting contractor | Adapt from independent contractor's payment module delivery. |

---

## Current Sprint Focus

**Spec work completed (2026-04-16):**
- PRD crosswalk completed against *PRD Human, ENV, Vector & BPP Module Ver. V.0.5* — the same document that originally drove S-01 through S-08 and V-01
- Reviewed 8 PRD gap items against existing OpenELIS functionality; reclassified:
  - 6 as **addendums** (S-07a, S-09, S-11, S-12, S-14, S-15) — OE already has NCE, QC, multi-level validation, referral, and import infrastructure
  - 1 as **new spec** (S-10 — Sample Distribution & Analyst Assignment)
  - 1 as **deferred** (S-13 — Payment/Billing, awaiting independent contractor delivery)
- V-02, V-03, V-04 descriptions enriched with PRD user stories (Tables 16–18)
- Roadmap updated to v2.0 with Layer 4, PRD crosswalk summary, updated dependency graph, and revised build order (8 phases + deferred)
- Sample Collection Redesign mockup updated with S-03 environmental sections (commit `dae1259`)
- Sample Collection Redesign FRS v2.0 finalized with S-03 merge (commit `db0ef52`)

**Spec work completed (2026-04-13):**
- V-01 FRS v1.0 finalized — Vector Specimen Types & Taxonomy reference data. Species taxonomy (genus + species + optional subspecies), organism groups (MOSQUITO/TICK/RODENT/OTHER_ARTHROPOD/OTHER_ANIMAL), lifecycle stages, pathogens of interest, trap type registry, vector sample types with pooling strategy (INDIVIDUAL/POOL_FIXED/POOL_VARIABLE). Extends SampleType.sampleDomain with VECTOR and adds VectorSpecimenProfile. Defines CollectionLot → VectorSpecimen data model for V-02
- V-01 React mockup: 3-tab Carbon mockup — Species | Trap Types | Vector Sample Types. Inline row expansion, Accordion for advanced config, progressive disclosure of pool size when strategy = POOL_FIXED, organism-group color coding
- V-01 HTML preview: interactive 3-tab preview with search, filters, row expansion, accordion, seed reload simulation
- Seed data spec: ~40 pre-loaded species (18 mosquitoes, 10 ticks, 7 rodents, 5 other) and 15 trap types relevant to Indonesia
- Jira ticket [OGC-555](https://uwdigi.atlassian.net/browse/OGC-555) created under epic OGC-527
- New `vector-surveillance` category added to design gallery; V-01 assets registered in mockup-viewer

**Spec work completed (2026-04-10):**
- S-08 FRS v1.0 finalized — Environmental QC Rules with field blank, trip blank, duplicate sample (RPD), spike recovery. Per-standard QC protocol configuration, QC sample creation at order entry, inline QC results tab, QC warning with acknowledgment modal on validation
- S-08 React mockup: 3-screen Carbon mockup — QC Protocol Config (Accordion per QC type), QC Results Tab (DataTable with type tags, pass/fail status, RPD calculations), QC Warning + Acknowledgment (modal with justification and checkbox)
- S-08 HTML preview: interactive 3-screen with accordion toggle, DataTable, modal with validation
- Jira ticket [OGC-554](https://uwdigi.atlassian.net/browse/OGC-554) created under epic OGC-527
- All S-08 assets added to design gallery and mockup-viewer
- S-07 FRS v1.0 finalized — Environmental Dashboard & Trend Analysis with KPI summary cards (with trend comparison), site-level compliance rate trend chart (monthly aggregation, 12-month default), per-parameter drill-down with threshold reference lines, exceedance summary DataTable, site comparison bar chart, CSV export
- S-07 React mockup: recharts-based dashboard with interactive drill-down, custom tooltips, color-coded compliance bars, export overflow menu
- S-07 HTML preview: Chart.js-based interactive preview with all 6 charts, toggleable drill-down panel
- Jira ticket [OGC-553](https://uwdigi.atlassian.net/browse/OGC-553) created under epic OGC-527
- All S-07 assets added to design gallery and mockup-viewer

**Spec work completed (2026-04-09):**
- S-06 FRS v1.0 finalized — Laporan Hasil (Compliance Report / Sertifikat Hasil Uji) with shared Report Print Configuration admin page, formal PDF certificate structure, dual e-signature integration (§11.50), batch ZIP generation, sequential certificate numbering, and generation audit trail
- S-06 React mockup: two-screen Carbon Design System mockup — Reports → Laporan Hasil workbench (DataTable + filters + batch actions + inline row expansion with compliance preview) and Admin → Report Configuration (Accordion-grouped settings form)
- S-06 HTML preview created with interactive row expansion, batch selection, accordion config, screen switcher
- Jira ticket [OGC-552](https://uwdigi.atlassian.net/browse/OGC-552) created under epic OGC-527
- All S-06 assets added to design gallery and mockup-viewer

**Spec work completed (2026-04-04):**
- S-05 FRS v1.0 finalized — Compliance Evaluation Engine with three-tier pass/marginal/fail evaluation, descriptive tag library with type-ahead multi-select, unit conversion engine, configurable margin percentages, version-locked evaluation, and override workflow with audit trail
- S-05 React mockup extends existing results-page.jsx with ComplianceSummaryBanner, DescriptiveTagSelector, ComplianceDetailTile, and override form
- S-05 HTML preview created
- Jira ticket [OGC-547](https://uwdigi.atlassian.net/browse/OGC-547) created and gallery permalinks posted
- All S-05 assets added to design gallery

**Spec work completed (2026-04-03):**
- S-03 FRS v1.0 finalized with sample type selection, test auto-suggestion, collection conditions, regulatory reference, dashboard extensions, QA completeness, and reporting data contract
- S-03 React mockup and HTML preview updated with sample type checklist + override flow
- Jira ticket [OGC-537](https://uwdigi.atlassian.net/browse/OGC-537) created
- S-04 FRS v1.0 completed as addendum to OGC-296 — `sampleDomain` enum, Basic Info tab extension, bulk assignment utility, workflow toggle filtering
- S-04 React mockup and HTML preview with list view (domain column + filter), editor (domain dropdown on Basic Info), and bulk assignment accordion
- Jira ticket [OGC-538](https://uwdigi.atlassian.net/browse/OGC-538) created

**Next up:**
- **Phase 5 addendums** — S-09 (eligibility gate addendum to Step 2), S-10 (new spec: analyst assignment), S-15 (bulk import addendum). S-09 should come first as it's consumed by both ENV and Vector.
- **V-02:** Vector Collection Workflow — trap-based collection, pool/individual processing, field data entry. Consumes S-09/S-10/S-15. Builds on V-01 reference data.
- **S-13 (Payment):** On hold — adapt from independent contractor's delivery when available.

---

## Cross-Cutting Dependencies (Outside Vector Epic)

| Dependency | Jira | Status | Impact on Module |
|-----------|------|--------|-----------------|
| Sample Collection Redesign (4-step workflow) | *(pre-existing)* | Spec Complete | S-03 extends this workflow; S-09 adds eligibility gate |
| Sample Type Management Module | [OGC-296](https://uwdigi.atlassian.net/browse/OGC-296) | In Progress | S-04 adds `sampleDomain` enum here |
| Test Catalog Management Redesign | [OGC-173](https://uwdigi.atlassian.net/browse/OGC-173) | Done | S-01 links standards to tests via catalog |
| FHIR Catalog Subscription | [OGC-447](https://uwdigi.atlassian.net/browse/OGC-447) | Backlog | Environmental sample types need to sync via FHIR |
| Existing OpenELIS Validation Workflow | *(core module)* | Existing | S-12 extends with dual Verificator→Validator pipeline |
| Existing OpenELIS QC Module | *(core module)* | Existing | S-11 extends with instrument QC gating |
| Payment Gateway (SATUSEHAT) | *(external)* | **Deferred — contractor** | S-13 will adapt from contractor's payment module |
| National e-Signature Service | *(external)* | TBD | S-06 and S-12 depend on e-Sign for LH signing |
| WhatsApp Business API / Email | *(external)* | TBD | S-14 depends on notification service for transfer alerts |

---

## File Index

All spec deliverables are in the upload folder:

| Spec | FRS | Mockup (JSX) | Preview (HTML) |
|------|-----|-------------|----------------|
| S-01 | `S01-compliance-standards-admin-frs-v1.0.md` | `S01-compliance-standards-mockup.jsx` | `S01-compliance-standards-preview.html` |
| S-02 | `S02-sampling-site-registry-frs-v1.0.md` | `S02-sampling-site-registry-mockup.jsx` | `S02-sampling-site-registry-preview.html` |
| S-03 | `S03-environmental-order-entry-frs-v1.0.md` | `S03-environmental-order-entry-mockup.jsx` | `S03-environmental-order-entry-preview.html` |
| S-04 | `S04-sample-type-domain-classification-frs-v1.0.md` | `S04-sample-type-domain-classification-mockup.jsx` | `S04-sample-type-domain-classification-preview.html` |
| S-05 | `S05-compliance-evaluation-engine-frs-v1.0.md` | `S05-compliance-evaluation-engine-mockup.jsx` | `S05-compliance-evaluation-engine-preview.html` |
| S-06 | `S06-laporan-hasil-compliance-report-frs-v1.0.md` | `S06-laporan-hasil-mockup.jsx` | `S06-laporan-hasil-preview.html` |
| S-07 | `S07-environmental-dashboard-frs-v1.0.md` | `S07-environmental-dashboard-mockup.jsx` | `S07-environmental-dashboard-preview.html` |
| S-08 | `S08-environmental-qc-rules-frs-v1.0.md` | `S08-environmental-qc-rules-mockup.jsx` | `S08-environmental-qc-rules-preview.html` |
| V-01 | `V01-vector-specimen-types-taxonomy-frs-v1.0.md` | `V01-vector-specimen-types-taxonomy-mockup.jsx` | `V01-vector-specimen-types-taxonomy-preview.html` |
| S-07a | *Not started* | — | — |
| S-09 | *Not started* | — | — |
| S-10 | *Not started* | — | — |
| S-11 | *Not started* | — | — |
| S-12 | *Not started* | — | — |
| S-13 | *Not started* | — | — |
| S-14 | *Not started* | — | — |
| S-15 | *Not started* | — | — |
| V-02 | *Not started* | — | — |
| V-03 | *Not started* | — | — |
| V-04 | *Not started* | — | — |
