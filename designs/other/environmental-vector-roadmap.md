# Environmental & Vector Testing Module — Roadmap

**Epic:** [OGC-527 — Vector: Environmental & Vector Testing Module](https://uwdigi.atlassian.net/browse/OGC-527)
**Last Updated:** 2026-04-10
**Target:** SILNAS (Indonesia) as first implementation; designed for international use

---

## Architecture Overview

The environmental/vector module is built across **3 architectural layers**, with specs progressing from foundational infrastructure through integration glue to analytical and reporting capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: Analytics, Reporting & Vector-Specific            │
│  S-05  S-06  S-07  S-08  V-01  V-02  V-03  V-04           │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: Integration & Workflow                            │
│  S-03  S-04                                                 │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: Foundational Infrastructure                       │
│  S-01  S-02  + Sample Collection Redesign + OGC-296         │
└─────────────────────────────────────────────────────────────┘
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
| **S-03** | Environmental Order Entry Integration | [OGC-537](https://uwdigi.atlassian.net/browse/OGC-537) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview |
| **S-04** | Sample Type Domain Classification | [OGC-538](https://uwdigi.atlassian.net/browse/OGC-538) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview (addendum to OGC-296) |

**Layer 2 summary:** Both specs complete. S-04 adds `sampleDomain` enum (CLINICAL/ENVIRONMENTAL/BOTH) to the SampleType entity as an addendum to OGC-296. This enables the workflow toggle to filter sample types and S-03's checklist to show only relevant types.

### Layer 3 — Analytics, Reporting & Vector-Specific

These specs add the analytical engine, compliance reporting, and vector-specific extensions.

| Spec | Title | Jira | Status | Description |
|------|-------|------|--------|-------------|
| **S-05** | Compliance Evaluation Engine | [OGC-547](https://uwdigi.atlassian.net/browse/OGC-547) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview — auto-evaluate results against ComplianceThresholds with pass/marginal/fail indicators, descriptive tag library, unit conversion, override workflow |
| **S-06** | Laporan Hasil (Compliance Report) | [OGC-552](https://uwdigi.atlassian.net/browse/OGC-552) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview — formal Sertifikat Hasil Uji PDF generation with shared Report Print Configuration, dual e-signature, batch ZIP download, audit trail |
| **S-07** | Environmental Dashboard & Trend Analysis | [OGC-553](https://uwdigi.atlassian.net/browse/OGC-553) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview — site-level compliance rate trends (monthly/12mo), per-parameter drill-down, exceedance summary table, site comparison bar chart, CSV export |
| **S-08** | Environmental QC Rules | [OGC-554](https://uwdigi.atlassian.net/browse/OGC-554) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview — field blank, trip blank, duplicate sample (RPD), spike recovery. Per-standard QC protocol config, QC sample creation at order entry, inline QC results tab, acknowledgment modal on validation |
| **V-01** | Vector Specimen Types & Taxonomy | [OGC-555](https://uwdigi.atlassian.net/browse/OGC-555) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview — species taxonomy (genus/species/subspecies), trap types, vector sample types with pooling strategy (INDIVIDUAL/POOL_FIXED/POOL_VARIABLE). Extends SampleType.sampleDomain with VECTOR, adds VectorSpecimenProfile, seeds ~40 species + 15 trap types |
| **V-02** | Vector Collection Workflow | [OGC-581](https://uwdigi.atlassian.net/browse/OGC-581) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview — trap-based CollectionLot entry, pool/individual intake, geographic/temporal clustering, field data capture |
| **V-03** | Vector Testing & Identification | [OGC-583](https://uwdigi.atlassian.net/browse/OGC-583) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview — species ID (morphological + molecular), pathogen screening panels, pool deconvolution workflow |
| **V-04** | Vector Surveillance Reporting | [OGC-585](https://uwdigi.atlassian.net/browse/OGC-585) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview — Superset embedded dashboard (trap catch rate, species distribution, MIR heatmap, pathogen positivity), guest token embedding, OHS ETL pipeline, PDF export, email alerts. FHIR implementation sprint **blocked by [OGC-586](https://uwdigi.atlassian.net/browse/OGC-586)** (Piotr architectural review). |
| — | V-04 FHIR Architectural Review | [OGC-586](https://uwdigi.atlassian.net/browse/OGC-586) | **In Review (Piotr)** | 7 architectural decisions required before FHIR implementation sprint: OHS ETL approach, trap-nights gap (Option A/B/C), Specimen.note → extension migration, lifecycle stage/sex push, StructureDefinition publication, SNOMED dual-coding, pool deconvolution chain gap. Blocks OGC-585 FHIR sprint. |

**Layer 3 summary:** 8 of 8 specs complete. All environmental and vector specs done. Epic OGC-527 spec phase complete.

---

## Dependency Graph

```
OGC-296 (Sample Type Management) ──────────────────────────┐
                                                            │
S-01 (Compliance Standards) ──┐                             │
                              ├── S-03 (Order Entry) ──┐    │
S-02 (Sampling Site Registry) ┘         │              │    │
                                        │              ├── S-04 (Sample Domain)
Sample Collection Redesign ─────────────┘              │
                                                       ├── S-05 (Evaluation Engine)
                                                       │
                                                       ├── S-06 (Laporan Hasil)
                                                       │
                                                       ├── S-07 (Dashboard/Trends)
                                                       │
                                                       └── S-08 (Environmental QC)

V-01 (Vector Specimens) ── V-02 (Collection) ── V-03 (Testing) ── V-04 (Surveillance)
```

---

## Recommended Build Order

The specs should be implemented in this order based on dependencies and value delivery:

| Phase | Specs | Rationale |
|-------|-------|-----------|
| **Phase 1 — Foundation** | S-01, S-02, Sample Collection Redesign | Core entities and 4-step workflow. Can be built in parallel. |
| **Phase 2 — Integration** | S-04 (sample domain), S-03 (order entry) | S-04 first (small, unblocks filtering), then S-03 wires everything together. |
| **Phase 3 — Compliance Loop** | S-05 (evaluation), S-06 (reporting) | Completes the end-to-end compliance workflow: enter → test → evaluate → report. |
| **Phase 4 — Operational** | S-07 (dashboard), S-08 (QC rules) | Adds operational tooling for environmental labs — trends, quality control. |
| **Phase 5 — Vector** | V-01, V-02, V-03, V-04 | Extends the environmental framework to vector surveillance. Sequential dependencies. |

---

## Current Sprint Focus

**Spec work completed (2026-04-20):**
- [OGC-586](https://uwdigi.atlassian.net/browse/OGC-586) created — V-04 FHIR Architectural Review task, assigned to Piotr Mankowski. Blocks OGC-585 FHIR implementation sprint. 7 decisions required (OHS ETL approach, trap-nights, Specimen.note migration, lifecycle stage/sex, StructureDefinition publication, SNOMED dual-coding, pool deconvolution chain). High priority.
- V-04 FRS v1.0 finalized — Vector Surveillance Reporting. Superset embedded dashboard via guest token JWT (5-min, silent refresh), OHS SQL-on-FHIR ETL pipeline (5 analytics views), Docker Compose infrastructure (hapi-fhir, postgres-fhir, superset, chromium), FHIR push extensions (Specimen, Observation, DiagnosticReport, Task), MIR heatmap, trap catch rate trend, species distribution donut, pathogen positivity bars. PDF export via headless Chromium. Superset native email alerts. RLS deferrable for single-tenant.
- V-04 React mockup: Carbon embedding shell with header strip filters, loading/error/connected states, simulated Superset dashboard (KPI tiles + 4 chart panels), token countdown, Pipeline & Infrastructure tab (arch diagram, OHS view status, FHIR push log, config accordion snippets)
- V-04 HTML preview: light-mode vanilla JS interactive preview with site filter (updates KPI + MIR data), token countdown, three connection state controls, SideNav
- FHIR Considerations doc: coverage assessment (45–50% native R4), 7 extensions, 5 CodeSystems, OHS ETL implications, WHO Vector Surveillance IG alignment approach, 7 questions for Piotr
- Jira ticket [OGC-585](https://uwdigi.atlassian.net/browse/OGC-585) created under epic OGC-527
- **Epic OGC-527 spec phase complete — all 8 specs done (S-01 through S-08, V-01 through V-04)**

**Spec work completed (2026-04-17):**
- V-02 and V-03 specs finalized — OGC-581 and OGC-583 respectively. V-03 amended: SideNav submenus replacing Tabs, inline lot expansion replacing page navigation, VectorTestPanel entity removed (uses Panel with panelDomain=VECTOR instead)

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
- Epic OGC-527 spec phase complete. Implementation sprints can begin with Phase 1 (S-01, S-02, Sample Collection Redesign). Pending: gallery registration + branch/PR for V-04 assets; FHIR Considerations doc review by Piotr; V-04b (in-app alerts) story to be created when V-04 implementation is underway.

---

## Cross-Cutting Dependencies (Outside Vector Epic)

| Dependency | Jira | Status | Impact on Vector |
|-----------|------|--------|-----------------|
| Sample Collection Redesign (4-step workflow) | *(pre-existing)* | Spec Complete | S-03 extends this workflow |
| Sample Type Management Module | [OGC-296](https://uwdigi.atlassian.net/browse/OGC-296) | In Progress | S-04 adds `sampleDomain` enum here |
| Test Catalog Management Redesign | [OGC-173](https://uwdigi.atlassian.net/browse/OGC-173) | Done | S-01 links standards to tests via catalog |
| FHIR Catalog Subscription | [OGC-447](https://uwdigi.atlassian.net/browse/OGC-447) | Backlog | Environmental sample types need to sync via FHIR |

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
