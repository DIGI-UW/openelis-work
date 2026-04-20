# Environmental & Vector Testing Module — Roadmap

**Epic:** [OGC-527 — Vector: Environmental & Vector Testing Module](https://uwdigi.atlassian.net/browse/OGC-527)
**Last Updated:** 2026-04-20
**Target:** SILNAS (Indonesia) as first implementation; designed for international use

---

## Architecture Overview

The environmental/vector module is built across **4 architectural layers**, with specs progressing from foundational infrastructure through integration, analytics/reporting, and PRD gap addenda.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: Gap Specs & Addenda (from PRD v0.5 + Bogor review)            │
│  X-01  S-03b✅  S-03c  S-03d  S-05b  S-06b✅  S-07b✅                  │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 3: Analytics, Reporting & Vector-Specific                        │
│  S-05✅  S-06✅  S-07✅  S-08✅  V-01✅  V-02✅  V-03✅  V-04✅        │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 2: Integration & Workflow                                        │
│  S-03✅  S-04✅                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 1: Foundational Infrastructure                                   │
│  S-01✅  S-02✅  + Sample Collection Redesign✅  + OGC-296✅            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Progress Tracker

### Layer 1 — Foundational Infrastructure

| Spec | Title | Jira | Status | Deliverables |
|------|-------|------|--------|-------------|
| **S-01** | Compliance Standards Administration | [OGC-528](https://uwdigi.atlassian.net/browse/OGC-528) | ✅ Spec Complete | FRS v1.0, JSX mockup, HTML preview |
| **S-02** | Sampling Site Registry | [OGC-531](https://uwdigi.atlassian.net/browse/OGC-531) | ✅ Spec Complete | FRS v1.0, JSX mockup, HTML preview |
| — | Sample Collection Redesign (4-step workflow) | *(pre-existing)* | ✅ Spec Complete | FRS v2.0, HTML mockup |
| — | Sample Type Domain Flag (clinical/environmental/both) | [OGC-296](https://uwdigi.atlassian.net/browse/OGC-296) | ✅ Addendum Complete | `sampleDomain` Set enum — addendum FRS + preview (OGC-296 addendum) |

### Layer 2 — Integration & Workflow

| Spec | Title | Jira | Status | Deliverables |
|------|-------|------|--------|-------------|
| **S-03** | Environmental Order Entry Integration | [OGC-537](https://uwdigi.atlassian.net/browse/OGC-537) | ✅ Spec Complete | FRS v1.0, JSX mockup, HTML preview |
| **S-04** | Sample Type Domain Classification | [OGC-538](https://uwdigi.atlassian.net/browse/OGC-538) | ✅ Spec Complete | FRS v1.0, JSX mockup, HTML preview |

### Layer 3 — Analytics, Reporting & Vector-Specific

#### Environmental Sub-track

| Spec | Title | Jira | Status | Deliverables |
|------|-------|------|--------|-------------|
| **S-05** | Compliance Evaluation Engine | [OGC-547](https://uwdigi.atlassian.net/browse/OGC-547) | ✅ Spec Complete | FRS v1.0, JSX mockup, HTML preview |
| **S-06** | Laporan Hasil (Compliance Report) | [OGC-552](https://uwdigi.atlassian.net/browse/OGC-552) | ✅ Spec Complete | FRS v1.0, JSX mockup, HTML preview |
| **S-07** | Environmental Dashboard & Trend Analysis | [OGC-553](https://uwdigi.atlassian.net/browse/OGC-553) | ✅ Spec Complete | FRS v1.0, JSX mockup, HTML preview |
| **S-08** | Environmental QC Rules | [OGC-554](https://uwdigi.atlassian.net/browse/OGC-554) | ✅ Spec Complete | FRS v1.0, JSX mockup, HTML preview |

#### Vector Surveillance Sub-track

| Spec | Title | Jira | Status | Deliverables |
|------|-------|------|--------|-------------|
| **V-01** | Vector Specimen Types & Taxonomy | [OGC-555](https://uwdigi.atlassian.net/browse/OGC-555) | ✅ Spec Complete | FRS v1.0, JSX mockup, HTML preview |
| **V-02** | Vector Collection Workflow | [OGC-581](https://uwdigi.atlassian.net/browse/OGC-581) | ✅ Spec Complete | FRS v1.0, JSX mockup, HTML preview — trap-based collection, pool/individual, geographic clustering |
| **V-03** | Vector Testing & Identification | [OGC-583](https://uwdigi.atlassian.net/browse/OGC-583) | ✅ Spec Complete | FRS v1.0, JSX mockup, HTML preview — species ID workbench, pathogen panels, pool deconvolution |
| **V-04** | Vector Surveillance Reporting | [OGC-585](https://uwdigi.atlassian.net/browse/OGC-585) | ✅ Spec Complete | FRS v1.0, JSX mockup, HTML preview — Superset dashboard, FHIR/OHS ETL, MIR/density charts. Blocked by [OGC-586](https://uwdigi.atlassian.net/browse/OGC-586) FHIR review |

**Layer 3 summary:** All 8 specs complete. V-04 dev blocked pending FHIR architectural decisions in OGC-586 (assigned: Piotr Mankowski).

### Layer 4 — Gap Specs & Addenda

Identified from cross-referencing PRD v0.5 and the Bogor requirements spreadsheet against the 12 core specs (2026-04-20). Full coverage mapping: `designs/other/PRD-roadmap-coverage-mapping.md`.

#### New Cross-Cutting Specs

| Spec | Title | Jira | Status | Summary |
|------|-------|------|--------|---------|
| **X-01** | Inter-Lab Transfer Workflow | TBD | ⬜ Not Started | Transfer sample to another lab unit with reason, notification (WhatsApp/email), and history. Applies to both ENV and Vector modules. |
| **S-03c** | Subcontract Management | TBD | ⬜ Not Started | Track samples sent to external laboratories: external lab, handoff date, expected return, subcontract status. Addendum to S-03 and V-02. Must Have, Phase 1 (Bogor). |
| **S-03d** | SOP Deadline Calculation | TBD | ⬜ Not Started | Compute testing deadline from collection date/time + SOP maximum holding time. Flag approaching/exceeded deadlines in ENV testing worklist. Must Have, Phase 1 (Bogor). |
| **S-05b** | Final Storage Disposition | TBD | ⬜ Not Started | Record final sample fate (Temporary / Biorepository / Disposal) at result entry for ENV (S-05) and Vector (V-03). Cross-cutting with Biorepository Module. Must Have, Phase 1 (Bogor). |

#### Addenda to Existing Specs

| Addendum | Parent | Jira | Status | Summary |
|----------|--------|------|--------|---------|
| **S-03b** | S-03 / [OGC-537](https://uwdigi.atlassian.net/browse/OGC-537) | OGC-537 addendum | ✅ Spec Complete | **Sampling Uncertainty field** added to Collection Conditions. ISO 17025 §7.6 field/sampling uncertainty: NumberInput + unit Select (%, mg/L, μg/L, CFU/100mL, Other). Mandatory by default, per-program optional. Carries to Step 2 via ENV-3-002. |
| **S-06b** | S-06 / [OGC-552](https://uwdigi.atlassian.net/browse/OGC-552) | [OGC-587](https://uwdigi.atlassian.net/browse/OGC-587) | ✅ Spec Complete | **Email/WhatsApp LH delivery + Sent Messages tab**. Extends OGC-437/OGC-439 with LH_COMPLETED trigger. Global Sent Messages main-menu tab with per-channel ✓/✗ status, resend flow, delivery log modal, secure download token. |
| **S-07b** | S-07 / [OGC-553](https://uwdigi.atlassian.net/browse/OGC-553) | OGC-553 addendum | ✅ Spec Complete | **Chart PNG + full-dashboard PDF export**. Per-chart hover download (client-side SVG→PNG @2×). PDF config modal → server-side generation. ROLE_ENV_EXPORT permission. |
| **S-03e** | S-03 / [OGC-537](https://uwdigi.atlassian.net/browse/OGC-537) | TBD | ⬜ Not Started (Research) | **Multiple containers per test** — support adding a 2nd, 3rd, etc. physical tube/container to the same test on an order (e.g., 3 water tubes all running the same panel). Requires research: how is tube count specified (test catalog config vs. at-collection decision vs. both)? How are containers labeled? Are results per-tube or aggregated? Does this warrant a full spec or a targeted addendum? Applies to ENV and potentially clinical orders. |

**Layer 4 summary:** 3 of 7 gap specs complete (S-03b, S-06b, S-07b). Remaining: X-01, S-03c, S-03d, S-05b.

---

## Dependency Graph

```
OGC-296 (Sample Type Management) ──────────────────────────────┐
                                                                │
S-01 (Compliance Standards) ──┐                                 │
                               ├── S-03 (Order Entry) ──┐      │
S-02 (Sampling Site Registry) ┘         │                │      │
                                        │                ├── S-04 (Sample Domain)
Sample Collection Redesign ─────────────┘                │
                                                         ├── S-05 (Evaluation) ──── S-05b (Storage)
                                                         │
                                                         ├── S-06 (Laporan Hasil) ── S-06b (Delivery)
                                                         │
                                                         ├── S-07 (Dashboard) ────── S-07b (Export)
                                                         │
                                                         └── S-08 (QC Rules)

S-03 ──── S-03b (Uncertainty) · S-03c (Subcontract) · S-03d (SOP Deadline)

V-01 (Vector Specimens) ── V-02 (Collection) ── V-03 (Testing) ── V-04 (Surveillance)

X-01 (Inter-Lab Transfer) ── cross-cutting: applies to S-03, V-02
```

---

## Recommended Build Order

| Phase | Specs | Rationale |
|-------|-------|-----------|
| **Phase 1 — Foundation** | S-01, S-02, Sample Collection Redesign | Core entities and 4-step workflow. Can be built in parallel. |
| **Phase 2 — Integration** | S-04 (sample domain), S-03 (order entry) | S-04 first (small, unblocks filtering), then S-03 wires everything together. |
| **Phase 3 — Compliance Loop** | S-05 (evaluation), S-06 (reporting) | Completes the end-to-end compliance workflow: enter → test → evaluate → report. |
| **Phase 4 — Operational** | S-07 (dashboard), S-08 (QC rules) | Adds operational tooling for environmental labs — trends, quality control. |
| **Phase 5 — Vector** | V-01, V-02, V-03, V-04 | Extends the environmental framework to vector surveillance. Sequential dependencies. |
| **Phase 6 — Gap Addenda (low-effort)** | S-03b, S-06b, S-07b | Field-level additions and notification extensions to existing workflows. |
| **Phase 7 — Gap Specs (higher effort)** | X-01, S-03c, S-03d, S-05b | New workflow components. X-01 first (cross-cutting), then registration addenda, storage last. |

---

## Current Sprint Focus

**Spec work completed (2026-04-20) — Layer 4 gap addenda:**

- **S-03b** — Sampling Uncertainty Field (OGC-537 addendum)
  - FRS v1.0, 3-scene JSX mockup (Step 1 entry, Step 2 carry-forward, QA completeness warning)
  - Gallery entry #85: `env-order-sampling-uncertainty-field`
  - Addendum comment posted to OGC-537

- **S-06b** — LH Delivery Notification & Sent Messages Tab (OGC-587 new story)
  - FRS v1.1 (rewritten to extend OGC-437/439 infrastructure), 4-scene JSX mockup
  - Scenes: Sent Messages tab, resend flow, delivery log modal, customer download page
  - Per-channel ✓/✗ delivery status pills (Email, WhatsApp), Carbon pagination
  - Gallery entry #83: `lh-delivery-sent-messages-tab`
  - Jira story OGC-587 created (assigned: Reagan, labels: Indonesia+Vector)

- **S-07b** — Chart PNG & Dashboard PDF Export (OGC-553 addendum)
  - FRS v1.0, 2-scene annotated JSX mockup (scope badge convention)
  - Gold dashed border = S-07b new; dimmed = S-07 existing context
  - Scenes: annotated dashboard, A4 PDF layout preview (5 selectable pages)
  - Gallery entry #84: `env-dashboard-chart-pdf-export`
  - Two addendum comments posted to OGC-553

All three committed to `feat/add-informed-consent-ogc-557` (commit `7e4eac9`).

**Previous sprint (2026-04-17–19) — V-03 and V-04:**
- V-03 FRS v1.0 — Vector Testing & Identification: species ID workbench, pathogen panels, pool deconvolution. Jira [OGC-583](https://uwdigi.atlassian.net/browse/OGC-583).
- V-04 FRS v1.0 — Vector Surveillance Reporting: Superset dashboard, FHIR/OHS SQL-on-FHIR ETL, MIR/density/trap-catch charts, PDF/email alerts. Jira [OGC-585](https://uwdigi.atlassian.net/browse/OGC-585).
- V-04 FHIR architectural review doc posted as OGC-586 for Piotr Mankowski.

**Next up (Layer 4):**
- S-03c — Subcontract Management
- S-03d — SOP Deadline Calculation
- S-05b — Final Storage Disposition
- X-01 — Inter-Lab Transfer Workflow

---

## Cross-Cutting Dependencies (Outside Vector Epic)

| Dependency | Jira | Status | Impact on Vector |
|-----------|------|--------|-----------------|
| Sample Collection Redesign (4-step workflow) | *(pre-existing)* | Spec Complete | S-03 extends this workflow |
| Sample Type Management Module | [OGC-296](https://uwdigi.atlassian.net/browse/OGC-296) | Addendum Complete | S-04 adds `sampleDomain` Set enum |
| TextIt SMS Notification | [OGC-437](https://uwdigi.atlassian.net/browse/OGC-437) | Spec Complete | S-06b extends with LH_COMPLETED trigger |
| Email/SMTP Notification | [OGC-439](https://uwdigi.atlassian.net/browse/OGC-439) | Spec Complete | S-06b extends with LH_COMPLETED trigger |
| Test Catalog Management Redesign | [OGC-173](https://uwdigi.atlassian.net/browse/OGC-173) | Done | S-01 links standards to tests via catalog |
| FHIR Catalog Subscription | [OGC-447](https://uwdigi.atlassian.net/browse/OGC-447) | Backlog | Environmental sample types need FHIR sync |
| V-04 FHIR Architectural Review | [OGC-586](https://uwdigi.atlassian.net/browse/OGC-586) | In Review (Piotr) | 7 architecture decisions gate V-04 dev |

---

## File Index

### Core Specs (upload/)

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

### Layer 4 Addenda (upload/)

| Addendum | FRS | Mockup (JSX) |
|----------|-----|-------------|
| S-03b | `S03b-sampling-uncertainty-frs-v1.0.md` | `S03b-sampling-uncertainty-mockup.jsx` |
| S-06b (v1.1) | `S06b-lh-delivery-notification-frs-v1.1.md` | `S06b-sent-messages-mockup.jsx` |
| S-07b | `S07b-chart-export-frs-v1.0.md` | `S07b-chart-export-mockup.jsx` |

### Gallery Registrations (designs/)

| Spec | JSX | Spec Doc |
|------|-----|---------|
| S-03b | `designs/sample-collection/sampling-uncertainty.jsx` | `designs/sample-collection/sampling-uncertainty.md` |
| S-06b | `designs/reports/lh-delivery-sent-messages.jsx` | `designs/reports/lh-delivery-sent-messages.md` |
| S-07b | `designs/reports/environmental-dashboard-chart-export.jsx` | `designs/reports/environmental-dashboard-chart-export.md` |
