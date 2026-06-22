# Environmental & Vector Testing Module — Roadmap (v2.0)

**Epic:** [OGC-527 — Vector: Environmental & Vector Testing Module](https://uwdigi.atlassian.net/browse/OGC-527)
**Last Updated:** 2026-04-25 (v2.0 simplification audit applied)
**Target:** SILNAS (Indonesia) as first implementation; designed for international use
**PRD Alignment:** Crosswalked against *PRD Human, ENV, Vector & BPP Module Ver. V.0.5* (2026-01-16)

---

## ⚠️ 2026-04-25 — v2.0 Simplification Audit

A simplification audit reduced the spec set substantially. Key changes:

- **S-03 → v2.0** (OGC-537): rewritten as standalone env order entry for domain-assigned labs. 3-step wizard (Branch+Order / Label & Store / QA-QC) with branch selector (Regulation-driven / Ad-hoc) at top of single-page Step 1. New §14 FHIR Referral Contract.
- **S-03b** (Sampling Uncertainty, OGC-603): **closed** — absorbed into S-03 v2.0 §5.1.10 as two optional fields.
- **S-03c** (Subcontract Mgmt, OGC-590): **closed** — merged with originally-planned S-14 into a single addendum. Same scope, no separate Subcontract Register page (uses existing Referral dashboard with new columns/filter).
- **S-03d → v2.0** (OGC-593): split. Part A (generic Required-By field) moved out to new **GENERIC ticket (OGC-625)** — cross-cutting OE feature, all order types. Parts B+C (env/vector SOP holding-time + worklist deadline) stay on OGC-593, moved Sprint 2 → Sprint 4 to match Confluence plan.
- **S-08 → v2.0** (OGC-554): reframed to ~30% size — only QC result evaluation + validation warning. Protocol Config admin dropped (user knows requirements). QC sample creation now in S-03 v2.0 §5.3.2.
- **S-09 → v2.0** (OGC-580): rebased on S-03 v2.0 (3-step model). Eligibility Worklist replaced by Order Dashboard status filter. Label criterion dropped (handled by existing OE label module). **Moved Sprint 7 → Sprint 3** using freed S-03b capacity.
- **S-14** (Inter-Lab Transfer & Subcontract): **new ticket OGC-624** in Sprint 4. Replaces S-03c BE+FE slots.
- **GENERIC Required-By** (OGC-625): **new ticket** in Sprint 2. Replaces S-03d Part A slot.

Net effect: ~60% reduction in addendum spec volume; existing OE referral, NCE, label, notification modules reused rather than duplicated. See Confluence sprint plan v15 for the updated assignment grid.

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
| **S-03** | Environmental Order Entry — Standalone (v2.0) | [OGC-537](https://uwdigi.atlassian.net/browse/OGC-537) | **Spec Complete v2.0** | FRS v2.0, JSX mockup v2, HTML preview v2 (in-context with full OE chrome). 3-step wizard, branch selector, FHIR §14 referral contract. Absorbs S-03b Sampling Uncertainty fields. |
| **S-04** | Sample Type Domain Classification | [OGC-538](https://uwdigi.atlassian.net/browse/OGC-538) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview (addendum to OGC-296) |

**Layer 2 summary:** Both specs complete. **S-03 v2.0** is the standalone env order entry screen for domain-assigned env lab units — no clinical/env workflow toggle within the screen. S-04 adds `sampleDomain` enum (CLINICAL/ENVIRONMENTAL/VECTOR/BOTH) to the SampleType entity, used by S-03 v2.0 sample manifest filtering and S-09 Acceptance Criteria gating.

### Layer 3 — Analytics, Reporting & Vector-Specific

These specs add the analytical engine, compliance reporting, and vector-specific extensions.

| Spec | Title | Jira | Status | Description |
|------|-------|------|--------|-------------|
| **S-05** | Compliance Evaluation Engine | [OGC-547](https://uwdigi.atlassian.net/browse/OGC-547) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview — auto-evaluate results against ComplianceThresholds with pass/marginal/fail indicators, descriptive tag library, unit conversion, override workflow |
| **S-06** | Laporan Hasil (Compliance Report) | [OGC-552](https://uwdigi.atlassian.net/browse/OGC-552) | **Spec Complete** | FRS v1.0, JSX mockup, HTML preview — formal Sertifikat Hasil Uji PDF generation with shared Report Print Configuration, dual e-signature, batch ZIP download, audit trail |
| **S-07** | Environmental Dashboard & Trend Analysis | [OGC-553](https://uwdigi.atlassian.net/browse/OGC-553) | **Spec Complete** *(needs S-07a addendum)* | FRS v1.0, JSX mockup, HTML preview — site-level compliance rate trends (monthly/12mo), per-parameter drill-down, exceedance summary table, site comparison bar chart, CSV export. **PRD gap:** needs geographic map view (see S-07a below) |
| **S-08** | QC Result Evaluation + Validation Warning (v2.0 reframed) | [OGC-554](https://uwdigi.atlassian.net/browse/OGC-554) | **Spec Complete v2.0** | FRS v2.0 (~30% of v1), JSX mockup v2, HTML preview v2 (in-context). Result evaluation (RPD, recovery, blank threshold) + validation warning with required acknowledgment. **Dropped from v1.0:** Protocol Config admin (user knows requirements), QC sample creation (now in S-03 v2.0 §5.3.2). |
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
| **S-09** | Pre-Analytical Eligibility Gate & Resampling (v2.0) | Addendum | S-03 v2.0 §5.3 (Step 3) | **Spec Complete v2.0** ([OGC-580](https://uwdigi.atlassian.net/browse/OGC-580)) | FRS v2.0, JSX mockup v2, HTML preview v2 (in-context). Per-SampleType acceptance criteria checklist (new 6th tab on SampleType admin), Resample sample action on existing NCE dialog, status formalization (PENDING_INTAKE / ELIGIBLE / RESAMPLING / REJECTED), per-domain gate behavior config. **Moved from Sprint 7 Stretch to Sprint 3** per 2026-04-25 audit. | PRD ENV Table 11 rows 10–12; Vector Table 16 rows 10–11 |
| **S-10** | Sample Distribution & Analyst Assignment | New spec | — | **Not Started** | Assign eligible samples to specific analysts/departments. Worklist by department, read-only registration summary, Baku Mutu display, distribution confirmation. OE has RBAC department scoping but no analyst assignment UI or department worklist. | PRD ENV Table 11 rows 14–15; Vector Table 16 row 14 |
| **S-11** | Instrument QC Gating | Addendum | S-08 v2.0 / existing QC module | **Not Started** | OE already has analyzer manual QC, QC status panel, overdue alerts, Westgard rules, and auto-NCE on failure. This addendum adds the PRD's requirement: block testing if instrument QC is overdue/failed, display warning before analyst can proceed. | PRD ENV Table 12 rows 3–4; Vector Table 17 rows 3–4 |
| **S-12** | Dual Verification → Validation Pipeline | Addendum | Existing OE validation workflow | **Not Started** | OE already has multi-level validation (validation 1/2 support) and enhanced validation screen. This addendum adds explicit Verificator→Validator role routing, return-to-analyst amendment loop with revision flags, and correction tracking per the SILNAS dual-stage model. | PRD ENV Table 13; Vector Table 18 |
| **S-13** | Payment & Billing Integration | **Deferred** | — | **Awaiting contractor** | Independent contractor is building payment/billing. We will adapt their deliverable for ENV/Vector integration rather than spec from scratch. | PRD ENV Table 11 row 13; Vector Table 16 row 12 |
| **S-14** | Inter-Lab Transfer & Subcontract (merged from S-03c) | Addendum | Existing OE Refer Out / Referral module | **Spec Complete v1.0** ([OGC-624](https://uwdigi.atlassian.net/browse/OGC-624)) | FRS v1.0, JSX mockup, HTML preview (in-context). Subcontract metadata panel + 5-state status workflow + outbound notifications + inbound FHIR referral registration. **Replaces closed OGC-590 (S-03c).** No new "Subcontract Register" page — uses existing Referral dashboard with new columns/filter. Generic to all order types. | PRD ENV Table 11 row 9, row 3; Vector Table 16 row 9, row 3 |
| **S-15** | Bulk Sample Import (CSV/XLS) | Addendum | S-03 v2.0 / existing import infra | **Not Started** | OE already has `generic_sample:import` permission. **Note:** S-03 v2.0 §5.1.9 already adds CSV manifest upload to Step 1 sample manifest entry. This addendum may now be smaller — re-scope before starting. | PRD ENV Table 11 row 5; Vector Table 16 row 5 |
| **GENERIC** | Required-By Date Field on Order Entry Step 1 | Cross-cutting | — | **Spec Complete** ([OGC-625](https://uwdigi.atlassian.net/browse/OGC-625)) | FRS, JSX mockup, HTML preview (in-context). DatePicker + TimePicker on Step 1 for ALL order types (Clinical/Env/Vector/EQA). Per-domain Required toggle in Lab Unit admin. EQA `eqa_deadline` migration to unified `order.required_by` column. **Split out from S-03d v1.0 Part A** per 2026-04-25 audit. Filed under OGC-527 epic for tracking; cross-cutting work (not env-specific). | (split from S-03d) |

**Layer 4 summary (post-audit):** 9 items total. 4 spec-complete after the simplification audit (S-09 v2.0, S-14, GENERIC, plus see Layer 2-3 changes for S-08 v2.0 and S-03d v2.0). 4 not started (S-10, S-11, S-12, S-15). 1 deferred (S-13). The addendum approach + 2026-04-25 audit significantly reduces total effort by reusing OE's existing NCE, QC, label, multi-level validation, referral, and import infrastructure rather than building parallel surfaces.

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

## Recommended Build Order (post v2.0 audit)

Reorganized 2026-04-25 to reflect the 6-sprint Confluence plan and the simplification audit. See the Confluence sprint plan v15 for the canonical assignment grid.

| Sprint | Items | Notes |
|--------|-------|-------|
| **Sprint 1 — Foundation** (Apr 21–May 2) | OGC-296, Sample Collection Redesign, S-01, S-02, V-01 | Silo work; both teams parallel. ~24 SP. |
| **Sprint 2 — Integration Gateway** (May 5–16) | **S-03 v2.0** (OGC-537), S-04 (OGC-538), **GENERIC OGC-625** (replaces S-03d Part A), X-01 (OGC-589) | S-03 v2.0 is the single most important gate. ~22 SP. |
| **Sprint 3 — Compliance + Vector + Eligibility** (May 19–30) | S-05 (OGC-547), V-02 (OGC-581), **S-09 v2.0 OGC-580** (moved from Sprint 7) | S-09 brought forward using S-03b absorption capacity. ~26 SP. |
| **Sprint 4 — Reporting + QC + Inter-Lab** (Jun 2–13) | OGC-517 Result Entry Redesign, S-08 v2.0 (OGC-554), **S-14 OGC-624** (replaces S-03c), S-06 (OGC-552), **S-03d v2.0 Parts B+C** (OGC-593, moved from Sprint 2) | OGC-517 must complete before V-03 in Sprint 5. ~29 SP. |
| **Sprint 5 — Vector Testing + Dashboards** (Jun 16–27) | V-03 (OGC-583), V-04 (OGC-585) conditional, S-07 (OGC-553), S-07b (OGC-602), V-04 Superset, S-06b (OGC-587) | V-04 conditional on OGC-586 resolution. ~32 SP. |
| **Sprint 6 — FHIR + Hardening** (Jun 30–Jul 4) | S-05b (OGC-592), V-04 if deferred, E2E testing, i18n review | Full integration sprint. ~23–36 SP. |
| **Deferred** | S-10 (Distribution), S-11 (Instrument QC), S-12 (Verification Pipeline), S-15 (Bulk Import — re-scope), S-07a (Map view), S-13 (Payment) | S-10 and S-12 are still TBD-not-started. S-15 re-scoping needed since S-03 v2.0 already includes CSV manifest upload. |

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
| **S-03 v2.0** | `S03-environmental-order-entry-frs-v2.0.md` | `S03-environmental-order-entry-mockup-v2.jsx` | `S03-environmental-order-entry-preview-v2.html` |
| ~~S-03b~~ | ⚠️ SUPERSEDED — absorbed into S-03 v2.0 §5.1.10 | (v1.0 preserved with SUPERSEDED header) | — |
| ~~S-03c~~ | ⚠️ SUPERSEDED — merged into S-14 | (v1.0 preserved with SUPERSEDED header) | — |
| **S-03d v2.0** | `S03d-sop-deadline-calculation-frs-v2.0.md` | `S03d-sop-deadline-calculation-mockup.jsx` | `S03d-sop-deadline-calculation-preview.html` |
| S-04 | `S04-sample-type-domain-classification-frs-v1.0.md` | `S04-sample-type-domain-classification-mockup.jsx` | `S04-sample-type-domain-classification-preview.html` |
| S-05 | `S05-compliance-evaluation-engine-frs-v1.0.md` | `S05-compliance-evaluation-engine-mockup.jsx` | `S05-compliance-evaluation-engine-preview.html` |
| S-06 | `S06-laporan-hasil-compliance-report-frs-v1.0.md` | `S06-laporan-hasil-mockup.jsx` | `S06-laporan-hasil-preview.html` |
| S-07 | `S07-environmental-dashboard-frs-v1.0.md` | `S07-environmental-dashboard-mockup.jsx` | `S07-environmental-dashboard-preview.html` |
| **S-08 v2.0** | `S08-environmental-qc-rules-frs-v2.0.md` | `S08-environmental-qc-rules-mockup.jsx` | `S08-environmental-qc-rules-preview.html` |
| **S-09 v2.0** | `S09-eligibility-gate-resampling-frs-v2.0.md` | `S09-eligibility-gate-mockup-v2.jsx` | `S09-eligibility-gate-preview-v2.html` |
| **S-14 v1.0** (new) | `S14-inter-lab-transfer-frs-v1.0.md` | `S14-inter-lab-transfer-mockup-v1.jsx` | `S14-inter-lab-transfer-preview-v1.html` |
| **GENERIC** (new) | `GENERIC-required-by-field-frs.md` | `GENERIC-required-by-field-mockup.jsx` | `GENERIC-required-by-field-preview.html` |
| V-01 | `V01-vector-specimen-types-taxonomy-frs-v1.0.md` | `V01-vector-specimen-types-taxonomy-mockup.jsx` | `V01-vector-specimen-types-taxonomy-preview.html` |
| S-07a (Map) | *Not started* | — | — |
| S-10 | *Not started* | — | — |
| S-11 | *Not started* | — | — |
| S-12 | *Not started* | — | — |
| S-13 | *Deferred — awaiting contractor* | — | — |
| S-15 | *Re-scope after S-03 v2.0 CSV upload* | — | — |
| V-02 | *Not started — in progress (Reagan)* | — | — |
| V-03 | *Not started — Sprint 5* | — | — |
| V-04 | *Not started — Sprint 5/6 (conditional on OGC-586)* | — | — |
