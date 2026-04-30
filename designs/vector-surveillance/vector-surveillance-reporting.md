# Vector Surveillance Reporting
## Functional Requirements Specification — v1.0

**Version:** 1.4
**Date:** 2026-04-26
**Status:** Draft for Review
**Jira:** TBD (Epic: [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React, Apache Superset, HAPI FHIR, Google Open Health Stack (SQL-on-FHIR)
**Related Modules:** Vector Collection Workflow (V-02, OGC-581), Vector Testing & Identification (V-03, OGC-583), Vector Specimen Types & Taxonomy (V-01, OGC-555), FHIR Outbound Push (existing)

### Change Log

- **v1.4 (2026-04-26 — vector expert validation pass):** Reactivated trap type stratification across §7.1 (FHIR Specimen mapping), §8.1 (vector_collection_samples view), §8.5 (vector_collection_density_daily), and Dashboards #1 + #5 — driven by V-02 v2.4 reactivating Trap Type capture at intake. Added `sporozoite_rate_pct` derived column in §8.4 (vector_mir_weekly view) for Plasmodium individual-level confirmation; Dashboard #4 gains a third toggle option ("Sporozoite Rate (%)") alongside the existing mir_classic and infection_rate_per_1000 metrics. Added lifecycle_stage stratification across all surveillance views; Dashboard #4 defaults to ADULT-only with an opt-in toggle to include other stages. Added new §6.6 Export Adapters — eWARS and SILANTOR CSV exporters (row-per-pool, weekly cadence, manual button + scheduled email-out; column-list specifics pending schema docs from the expert; trap_type explicitly omitted from both export schemas per expert confirmation). Added §17.4 V-04d API Push to deferred future scope. Lifecycle stage and trap type both flow from V-02 v2.4 Sample fields through the FHIR pipeline.
- **v1.3 (2026-04-24 — infection rate accuracy for deconvoluted pools):** Rewrote §8.4 `vector_mir_weekly` to compute two metrics side-by-side: `mir_classic` (classical formula, conservative lower bound) and `infection_rate_per_1000` (uses exact positive counts when pool deconvolution is COMPLETE; falls back to classical assumption of 1 positive per unresolved positive pool). Added `positive_resolution_pct` diagnostic so report readers can judge how trustworthy the hybrid metric is. Rewrote BR-V04-001. Updated Dashboard #4 to show both metrics. Added §17.3 future-scope note for MLE-based PooledInfRate-style estimator (deferred — requires iterative solver, not expressible in pure SQL). Acceptance criteria added.
- **v1.2 (2026-04-24 — QC exclusion):** Added explicit QC sample handling. Surveillance aggregates (MIR, density) now filter out QC samples by traversing the existing OpenELIS `analysis_qaevent` join table. Per OpenELIS architecture, QC is identified at the Analysis level (a Sample is QC if any of its Analyses has a linked QaEvent record — Positive Control, Negative Control, Blank, Duplicate). New FR-V04-QC-001/002/003. New §8.6 `vector_qc_monitoring` view. New Dashboard #7 "QC Pass Rate". New BR-V04-008. Updated FHIR §7.3 DiagnosticReport mapping with `qaEventType` extension. Acceptance criteria for QC exclusion added.
- **v1.1 (2026-04-24 — alignment with simplified V-02/V-03):** Removed `trap_type` from FHIR Specimen mapping, OHS analytics views, and dashboard groupings — trap type is designed in the backend but currently out of scope for V-02 intake (no data captured). Replaced `pool_flag` references with derived `is_pool = (quantity > 1)` to match V-02 v2.2+ data model. Renamed `specimen_count` → `organism_count` consistently. Renamed `vector_trap_catch_daily` view → `vector_collection_density_daily` and metric `catch_rate` → `organisms_per_event` to reflect the post-trap-type entomological metric. Added §17.2 deferred-feature note for trap type. Dashboard #1 and #5 titles updated.
- **v1.0 (2026-04-20):** Initial draft.

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. User Stories
4. User Roles & Permissions
5. Architecture Overview
6. Functional Requirements
7. FHIR Resource Mapping
8. OHS SQL-on-FHIR View Schemas
9. Superset Dashboard Inventory
10. Infrastructure Specification
11. OpenELIS Embedding Page
12. Business Rules
13. Localization
14. Validation Rules
15. Security & Permissions
16. Acceptance Criteria
17. Future Scope
    - 17.1 V-04b — In-App Outbreak Alerts
    - 17.2 Trap Type Reactivation — ✅ Completed v1.4
    - 17.3 V-04c — MLE-based Infection Rate Estimation (Deferred)
    - 17.4 V-04d — eWARS / SILANTOR API Push (Deferred from v1.4)

---

## 1. Executive Summary

V-04 delivers vector surveillance analytics to OpenELIS operators without requiring a custom React charting module. An Apache Superset instance — fed by a HAPI FHIR server and Google Open Health Stack SQL-on-FHIR views — is embedded directly inside the OpenELIS Reports section via a guest-token-authenticated iframe. Coordinators see live trap catch rates, species distributions, pathogen positivity trends, and Minimum Infection Rate (MIR) calculations without leaving OpenELIS. A formal PDF surveillance report can be exported from Superset in one click. Threshold-based email alerts are configured in Superset admin.

---

## 2. Problem Statement

**Current state:** Vector surveillance data collected through V-02 (VECTOR-domain Samples) and V-03 (VectorSpecimenIdentification, pathogen results, deconvolution aliquots) is stored in OpenELIS but has no analytical surface. Coordinators must export raw data and process it externally — typically in Excel — to produce collection density figures, species-level summaries, or MIR calculations required by health authority reporting.

**Impact:** Manual aggregation is error-prone, time-consuming, and non-reproducible. Health authority submissions are delayed. There is no real-time view of surveillance trends, meaning outbreak signals may go undetected until the weekly manual report cycle.

**Proposed solution:** Deploy Apache Superset alongside OpenELIS (Docker Compose) connected to a local HAPI FHIR server. OpenELIS pushes vector data as FHIR resources via the existing outbound FHIR pipeline. Google Open Health Stack SQL-on-FHIR views flatten those resources into Postgres tables that Superset queries. Six pre-built Superset dashboards are embedded in the OpenELIS Reports → Vector Surveillance page via a guest token, with date range and site pre-filters passed as URL parameters. Superset's native alert engine handles threshold-based email notifications.

---

## 3. User Stories

### US-V04-01 — Surveillance Dashboard
> As a **Vector Surveillance Coordinator**, I want to see a real-time dashboard of trap catch rates, species distribution, and pathogen positivity within OpenELIS, so that I don't have to export data to Excel to understand current surveillance status.

**Acceptance:** Given I navigate to Reports → Vector Surveillance, when the page loads, then I see an embedded Superset dashboard with current data pre-filtered to my assigned sites.

---

### US-V04-02 — Date Range Filtering
> As a **Surveillance Coordinator**, I want to filter the dashboard by collection date range and sampling site, so that I can focus on a specific surveillance period or outbreak investigation window.

**Acceptance:** Given the Vector Surveillance page is loaded, when I change the date range or site filter in the OpenELIS header strip, then the embedded dashboard refreshes with a new pre-filtered guest token showing only the selected period and site(s).

---

### US-V04-03 — PDF Export
> As a **Lab Manager**, I want to export a PDF surveillance summary report, so that I can submit a formal surveillance report to the provincial health authority.

**Acceptance:** Given the dashboard is displayed, when I click "Export PDF", then Superset generates a formatted PDF of the active dashboard and the browser downloads it.

---

### US-V04-04 — MIR Calculation
> As a **Epidemiologist**, I want to see the Minimum Infection Rate (MIR) per species per panel per collection period, so that I can assess infection pressure and prioritise vector control interventions.

**Acceptance:** Given test results from V-03 have been recorded, when I view the MIR chart, then I see MIR = (number of positive pools / total specimens tested) × 1000, per species per test panel per week.

---

### US-V04-05 — Threshold Alerts
> As a **Lab Manager**, I want to receive an email alert when a trap catch rate or MIR exceeds a configured threshold, so that I am notified of potential outbreak signals without having to monitor the dashboard continuously.

**Acceptance:** Given a Superset alert is configured for a density or MIR threshold, when the metric exceeds the threshold, then a Superset-generated email with a dashboard snapshot is sent to the configured recipients.

---

### US-V04-06 — Open in Superset
> As a **Power User**, I want to open the dashboard directly in Superset for deeper drill-down and ad-hoc analysis, so that I am not constrained by the embedded iframe's viewport.

**Acceptance:** Given the Vector Surveillance page is loaded, when I click "Open in Superset", then the Superset dashboard opens in a new browser tab.

---

### US-V04-07 — Connection Error Handling
> As any **OpenELIS User**, I want to see a clear error message if the Superset connection is unavailable, so that I understand the dashboard is temporarily unavailable rather than thinking surveillance data is missing.

**Acceptance:** Given Superset is unreachable, when the Vector Surveillance page loads, then an `InlineNotification` (kind=error) is shown with a "Retry" action and the iframe is hidden.

---

### US-V04-08 — Site-Scoped Access (RLS — deferrable)
> As a **Field Coordinator**, I want to see only data from my assigned sampling sites, so that I am not viewing or inadvertently acting on data from sites outside my jurisdiction.

**Acceptance:** Given RLS is configured and I am assigned to sites BPP-01 and BPP-02, when the guest token is minted, then the Superset RLS filter limits all dashboard queries to those sites only.

> **⚠ Deferrable:** This story requires Superset row-level security dataset configuration and OpenELIS user → site assignment mapping. It can be omitted for single-tenant or trusted-network deployments where all coordinators see all sites.

---

## 4. User Roles & Permissions

| Role | Dashboard | Export PDF | Open in Superset | Configure Alerts |
|------|-----------|------------|-----------------|-----------------|
| Vector Surveillance Coordinator | View | Yes | Yes | No |
| Lab Manager | View | Yes | Yes | Yes (Superset UI) |
| Epidemiologist | View | Yes | Yes | No |
| System Administrator | Full | Yes | Yes | Yes |

**Required permission keys:**

- `vectorReport.view` — Access Reports → Vector Surveillance page and view embedded dashboard
- `vectorReport.export` — Trigger PDF export from Superset
- `vectorReport.openSuperset` — Access full Superset UI via link-out

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  OpenELIS Application                                               │
│                                                                      │
│  Reports → Vector Surveillance                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Header strip: date range | site filter | Export | Open ↗   │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  <iframe src="superset/guest-token-embed" />                │    │
│  │  (Superset dashboard — 6 charts)                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Backend: POST /api/v1/vector/superset/guest-token                   │
│    → calls Superset /api/v1/security/guest_token                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ FHIR outbound push (existing)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  HAPI FHIR Server  (Docker Compose service: hapi-fhir)               │
│  Stores: Specimen, Observation, DiagnosticReport, Patient            │
│  Port: 8080 (internal)                                               │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ OHS SQL-on-FHIR ETL (scheduled)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Postgres — analytics schema  (Docker Compose service: postgres-fhir) │
│  OHS flattened views:                                                 │
│    vector_collection_samples       vector_specimen_ids                │
│    vector_pathogen_results         vector_mir_weekly                  │
│    vector_collection_density_daily vector_qc_monitoring               │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ SQLAlchemy connection
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Apache Superset  (Docker Compose service: superset)                 │
│  Pre-built dashboards: 6 charts + 1 overview dashboard               │
│  Guest token API: /api/v1/security/guest_token                        │
│  Alert engine: email on threshold breach                              │
│  Port: 8088 (internal), proxied at /superset (external)              │
└──────────────────────────────────────────────────────────────────────┘
```

**Cloud swap:** Replace HAPI FHIR + Postgres with GCP FHIR Store + BigQuery. Update Superset database connection from Postgres SQLAlchemy to BigQuery. No application code changes required.

---

## 6. Functional Requirements

### 6.1 Infrastructure — Docker Compose

**FR-V04-INF-001:** The deployment MUST add three new Docker Compose services to `docker-compose.yml`: `hapi-fhir` (HAPI FHIR JPA Server), `postgres-fhir` (dedicated analytics Postgres instance), and `superset` (Apache Superset).

**FR-V04-INF-002:** The `hapi-fhir` service MUST be configured to persist FHIR resources to `postgres-fhir`. It MUST NOT share the OpenELIS application database.

**FR-V04-INF-003:** Superset MUST be reachable at the path `/superset` via the existing reverse proxy (nginx/Traefik). Direct access to port 8088 MUST be blocked from external networks.

**FR-V04-INF-004:** A `superset_config.py` configuration file MUST be provided with: `FEATURE_FLAGS = {"EMBEDDED_SUPERSET": True}`, CORS allowlist for the OpenELIS origin, `GUEST_ROLE_NAME = "VectorSurveillanceGuest"`, and `SECRET_KEY` sourced from an environment variable.

**FR-V04-INF-005:** An OHS SQL-on-FHIR ETL job MUST run on a configurable schedule (default: every 15 minutes) to flatten HAPI FHIR resources into the analytics Postgres schema. The schedule MUST be configurable via environment variable `OHS_ETL_CRON`.

**FR-V04-INF-006:** All service credentials (Superset admin password, Postgres password, FHIR server token) MUST be sourced from environment variables and MUST NOT be hardcoded in `docker-compose.yml` or `superset_config.py`.

### 6.2 FHIR Outbound Push Extensions

**FR-V04-FHIR-001:** The existing OpenELIS FHIR outbound push pipeline MUST be extended to push `Specimen` resources for each VECTOR-domain Sample created in V-02 — including top-level submissions and deconvolution aliquots (see V-03). Aliquots MUST set `Specimen.parent` to reference their parent Specimen.

**FR-V04-FHIR-002:** Each `VectorSpecimenIdentification` record (V-03) MUST generate a FHIR `Observation` resource with code = LOINC `81255-2` (organism identified) and component observations for species, method, and confidence.

**FR-V04-FHIR-003:** Each pathogen test result linked to a V-03 lot (pooled or deconvoluted) MUST be pushed as a FHIR `DiagnosticReport` referencing the parent `Specimen`.

**FR-V04-FHIR-004:** Deconvolution outcomes (per V-03 BR-V03-009) MUST be derivable from the pushed Specimen graph: the parent Sample's `Specimen.extension[deconvolutionStatus]` carries the workflow state, and aggregation across child specimens (linked via `Specimen.parent`) yields the positive count and outcome percentage. The `DeconvolutionTask` entity was removed in V-03 v1.4; no separate FHIR `Task` resource is pushed for deconvolution lifecycle events. A lightweight `VectorDeconvolutionEvent` audit record (V-03 §5) MAY OPTIONALLY be pushed as a FHIR `Provenance` resource referencing the parent Specimen.

**FR-V04-FHIR-005:** FHIR push failures MUST be logged to the existing OpenELIS outbound FHIR error log and MUST NOT block the primary OpenELIS workflow.

### 6.3 OHS Flattened Views

**FR-V04-OHS-001:** The OHS ETL job MUST produce the following Postgres views in the `vector_analytics` schema (see §8 for full schemas):
- `vector_collection_samples` — one row per VECTOR-domain Sample (top-level submissions and aliquots; carries derived `is_qc`)
- `vector_specimen_ids` — one row per VectorSpecimenIdentification
- `vector_pathogen_results` — one row per pathogen test result (carries `is_qc` and `qa_event_type`)
- `vector_mir_weekly` — pre-aggregated infection rate metrics by species × panel × ISO week (see §8.4 / Item 5 for classical vs. observed split; QC-excluded)
- `vector_collection_density_daily` — pre-aggregated organisms/collection-event by site × organism group × day (top-level submissions only; QC-excluded)
- `vector_qc_monitoring` — pre-aggregated QC pass rate by `qa_event_type` × site × ISO week (QC-only)

**FR-V04-OHS-002:** Views MUST be refreshed atomically (CREATE OR REPLACE VIEW or materialised view refresh) to prevent partial reads by Superset during ETL.

**FR-V04-OHS-003:** Each view MUST include a `site_id`, `site_name`, and `collection_date` column to support Superset row-level security filtering.

**FR-V04-QC-001:** QC samples — defined as Samples whose Analyses include one or more linked `AnalysisQaEvent` records (the existing OpenELIS QC pattern: `qa_event` catalog of Positive Control / Negative Control / Blank / Duplicate joined to Analysis via `analysis_qaevent`) — MUST be derivable as an `is_qc` boolean column in `vector_collection_samples` and `vector_pathogen_results` views. The QC type (`qa_event_type`) MUST be available alongside the boolean for QC monitoring reporting.

**FR-V04-QC-002:** Surveillance aggregate views (`vector_mir_weekly`, `vector_collection_density_daily`) MUST exclude rows where `is_qc = TRUE`. QC samples MUST NOT contribute to MIR numerator, MIR denominator, or organism density calculations.

**FR-V04-QC-003:** A separate `vector_qc_monitoring` view MUST aggregate QC sample results by `qa_event_type` × site × ISO week, producing per-control-type pass rates. This surfaces, e.g., "Positive Control pass rate at Site BPP-01 was 96% in W12" without polluting the surveillance aggregates.

### 6.4 Superset Dashboards

**FR-V04-DASH-001:** A single Superset dashboard named **"Vector Surveillance Overview"** MUST be pre-configured containing the six charts defined in §9.

**FR-V04-DASH-002:** The dashboard MUST support native Superset date-range and site filter cross-filtering so that selecting a date range or site in any chart updates all other charts on the dashboard.

**FR-V04-DASH-003:** Each chart MUST have a title, axis labels, and tooltip text in English by default. Superset's multi-language support MAY be configured separately.

**FR-V04-DASH-004:** The dashboard MUST be exportable as PDF via Superset's native export function (requires Superset `ENABLE_SCHEDULED_EMAIL_REPORTS = True` and a headless browser — see §10.3).

**FR-V04-DASH-005:** Superset alert rules MUST be configurable in the Superset admin UI for any metric in the `vector_mir_weekly` and `vector_collection_density_daily` views. Alert delivery is via email (SMTP configured in `superset_config.py`).

### 6.5 OpenELIS Embedding Page

**FR-V04-EMB-001:** A new page MUST be added at Reports → Vector Surveillance in the OpenELIS navigation.

**FR-V04-EMB-002:** On page load, the OpenELIS backend MUST call the Superset guest token API (`POST /api/v1/security/guest_token`) using a service account with role `VectorSurveillanceGuest` and return the token to the frontend.

**FR-V04-EMB-003:** The frontend MUST render the Superset dashboard as a full-width, full-height `<iframe>` using the guest token. The iframe src MUST include the dashboard UUID and the guest token as a URL parameter.

**FR-V04-EMB-004:** Date range and site filter selections in the OpenELIS header strip MUST be encoded as Superset native filter state URL parameters and included in the iframe src, so the dashboard initialises pre-filtered.

**FR-V04-EMB-005:** While the guest token is being fetched, a Carbon `Loading` spinner MUST be displayed in place of the iframe.

**FR-V04-EMB-006:** If the guest token request fails or Superset returns a non-2xx response, a Carbon `InlineNotification` (kind=`error`) MUST be shown with message key `error.vectorReport.supersetUnavailable` and a "Retry" button. The iframe MUST NOT be rendered in the error state.

**FR-V04-EMB-007:** An "Export PDF" button MUST trigger Superset's native PDF export endpoint (`GET /api/v1/report/{id}/pdf`) via a backend proxy. The response MUST be streamed to the browser as a file download.

**FR-V04-EMB-008:** An "Open in Superset ↗" button MUST open the Superset dashboard URL (full UI, not embedded) in a new browser tab.

**FR-V04-EMB-009 (RLS — deferrable):** When row-level security is enabled, the guest token request MUST include an `rls` array containing a SQL filter clause scoped to the authenticated OpenELIS user's assigned sites (e.g., `site_id IN (1, 3, 7)`). This requires the OpenELIS user entity to have a `assignedSites` relationship. This requirement MUST be skipped for single-tenant deployments.

### 6.6 Export Adapters — eWARS + SILANTOR (v1.4)

> **Status:** FR-shape spec complete in v1.4. Column-list specifics for both adapters are pending schema documentation from the vector expert; the implementation guide will lock the column list before build. API push (rather than CSV upload) is deferred to V-04d (§17.4).

**FR-V04-EXP-001:** OpenELIS Reports → Vector Surveillance MUST provide two CSV export adapters covering the regulatory submission paths used by Indonesian programs: the **eWARS Exporter** (Early Warning, Alert and Response System) and the **SILANTOR Exporter** (Sistem Informasi Laporan Pemantauan Vektor). Both adapters MUST support **manual trigger** (button click on the dashboard page) and **scheduled trigger** (weekly cron, configurable per-deployment, with optional email-out to a configured recipient list).

**FR-V04-EXP-002:** Both adapters MUST aggregate at the **row-per-pool** level (not row-per-week-per-site aggregate). The data source is `vector_pathogen_results` filtered to the requested period — one row per Sample × pathogen test result. The receiving authority performs its own aggregation. This was confirmed with the vector expert as the standard ingestion shape for both platforms.

**FR-V04-EXP-003:** Both adapters MUST exclude `trap_type_code`, `trap_type_name`, and Collection Context fields from the export payload. Per the vector expert, neither eWARS nor SILANTOR tracks trap-type or bionomics metadata at the export layer — those fields stay in the internal V-04 dashboards but are NOT submitted to the authority. The structural rule mirrors the QC exclusion pattern (BR-V04-008) — adapter views filter columns at the SQL projection layer.

**FR-V04-EXP-004:** QC samples MUST be excluded from both export adapters per BR-V04-008 (the existing QC structural exclusion). Only `is_qc = FALSE` rows are submitted.

**FR-V04-EXP-005 — eWARS Adapter.** Output format: CSV conforming to Indonesia's eWARS data-set schema (DHIS2-based; column list pending schema docs from the vector expert). Cadence: weekly. Filename pattern: `ewars_vector_{site_code}_{iso_year}_W{iso_week}.csv`. Encoding: UTF-8 with BOM. Content scope: `vector_pathogen_results` rows with `is_qc = FALSE` for the reporting period.

**FR-V04-EXP-006 — SILANTOR Adapter.** Output format: CSV conforming to Kemenkes Subdit Vektor SILANTOR schema (column list pending schema docs from the vector expert). Cadence: weekly. Filename pattern: `silantor_vector_{site_code}_{iso_year}_W{iso_week}.csv`. Encoding: UTF-8 with BOM. Content scope: same as eWARS adapter — `vector_pathogen_results` rows with `is_qc = FALSE`.

**FR-V04-EXP-007 — Permissions.** New permission keys: `vectorReport.exportEwars` (granted to Lab Manager, Vector Surveillance Coordinator, Epidemiologist by default) and `vectorReport.exportSilantor` (same default grants). The two are separately gated because some deployments may use only one of the two platforms.

**FR-V04-EXP-008 — Audit.** Each export run (manual or scheduled) MUST be logged with: timestamp, exporter (eWARS / SILANTOR), reporting period (iso_year, iso_week), row count, triggering user (or "scheduled"), and whether email-out was attempted. Logs are retained per the standard OpenELIS audit retention policy.

**FR-V04-EXP-009 — UI placement.** The two export buttons MUST be added to the dashboard page header alongside the existing "Export PDF" and "Open in Superset ↗" buttons (per FR-V04-EMB-007/008). Placement: a new "Export to Authority ▾" dropdown menu with eWARS and SILANTOR as menu items; only items the user has permission for SHALL be visible.

> **Implementation note.** When the schema docs arrive, this section will be augmented with the column-by-column mapping (per adapter): which `vector_pathogen_results` field maps to which CSV column, value transformations (e.g., DHIS2 expects ISO 8601 dates, etc.), and any coding-system mappings (organism_group → DHIS2 option set, panel_loinc → DHIS2 data element identifier). The current spec locks the FR-level shape only.

---

## 7. FHIR Resource Mapping

### 7.1 Sample (VECTOR domain) → FHIR Specimen

> Aligned with V-02 v2.4 — the source entity is the existing `Sample`. **Trap type is reactivated in v1.4** (was previously deferred per §17.2). Lifecycle stage and Collection Context fields added per V-02 v2.4 are also pushed.

| Sample field | FHIR Specimen path | Notes |
|---|---|---|
| `id` | `Specimen.identifier[0].value` | System: `https://openelis-global.org/sample` |
| `lab_number` | `Specimen.identifier[1].value` | Display label (e.g., `VCT-2026-000042`) |
| `sampling_site_id` | `Specimen.collection.collector` | Reference to Location (nullable; V-02 makes site optional). For child Aliquots, V-03 v1.13 adds an optional per-Aliquot `collection_location_id` override — pushed as the same field on the Aliquot's Specimen resource. |
| `received_at` | `Specimen.collection.collectedDateTime` | ISO 8601 — V-02 records lab receipt; collection date upstream of OpenELIS not captured |
| `quantity` | `Specimen.collection.quantity` | `Quantity` resource: `{ value: <int>, unit: "organisms" }` |
| — (derived) | `Specimen.note[0].text` | `"isPool:{quantity>1}"` — derived at push time |
| `identificationStatus` | `Specimen.status` | `available` = COMPLETE, `unavailable` = NOT_STARTED, `unsatisfactory` = IN_PROGRESS |
| `sample_type_id` (organism group) | `Specimen.type.coding[0].code` | System: `https://openelis-global.org/organism-group` |
| **`trap_type_id`** *(reactivated v1.4)* | `Specimen.type.coding[1].code` | System: `https://openelis-global.org/trap-type`. Sourced from the `VECTOR_TRAP_TYPE` Dictionary category (V-03 Appendix A.7.10 — passive traps + collection methods). |
| **`lifecycle_stage`** *(v1.4)* | `Specimen.extension[lifecycleStage]` | Custom extension URL: `https://openelis-global.org/extension/lifecycleStage`. Values from `VECTOR_LIFECYCLE_STAGE` Dictionary (V-03 Appendix A.7.9): EGG / LARVA / PUPA / ADULT / UNKNOWN. |
| **`collection_time_of_day`** *(v1.4)* | `Specimen.extension[collectionTimeOfDay]` | Custom extension. From V-02 v2.4 Collection Context accordion. |
| **`resting_context`** *(v1.4)* | `Specimen.extension[restingContext]` | Custom extension. From V-02 v2.4 Collection Context accordion. |
| **`human_biting_catch`** *(v1.4)* | `Specimen.extension[humanBitingCatch]` | Custom extension; valueBoolean. From V-02 v2.4 Collection Context accordion. |
| **`collection_context_notes`** *(v1.4)* | `Specimen.note[1].text` | Free-text. From V-02 v2.4. |
| `deconvolutionStatus` | `Specimen.extension[deconvolutionStatus]` | Custom extension URL |
| `parent_aliquot_id` | `Specimen.parent` | Set on child aliquots; references parent Specimen |

### 7.2 VectorSpecimenIdentification → FHIR Observation

| VectorSpecimenIdentification field | FHIR Observation path | Notes |
|---|---|---|
| `id` | `Observation.identifier[0].value` | — |
| `specimen.id` | `Observation.specimen` | Reference to Specimen |
| `species.scientificName` | `Observation.valueCodeableConcept.text` | — |
| `species.id` | `Observation.valueCodeableConcept.coding[0].code` | System: `https://openelis-global.org/vector-species` |
| `method` | `Observation.method.coding[0].code` | MORPHOLOGICAL / MOLECULAR / BOTH |
| `confidence` | `Observation.interpretation.coding[0].code` | CONFIRMED → `POS`, PRESUMPTIVE → `IND` |
| `identifiedAt` | `Observation.effectiveDateTime` | — |
| `identifiedBy` | `Observation.performer` | Reference to Practitioner |
| LOINC 81255-2 | `Observation.code.coding[0]` | "Organism identified" |

### 7.3 Pathogen Test Result → FHIR DiagnosticReport

| OpenELIS field | FHIR DiagnosticReport path | Notes |
|---|---|---|
| `result.id` | `DiagnosticReport.identifier[0].value` | — |
| `sample.id` | `DiagnosticReport.specimen[0]` | Reference to Specimen (Sample or Aliquot) |
| `panel.loincCode` | `DiagnosticReport.code.coding[0]` | Panel LOINC |
| `result.value` | `DiagnosticReport.conclusion` | Positive / Negative / Indeterminate |
| `result.resultDate` | `DiagnosticReport.effectiveDateTime` | — |
| `isPoolPositive` | `DiagnosticReport.extension[poolPositive]` | Custom extension URL |
| `analysis_qaevent.qa_event_id` (joined via `analysis_id`) | `DiagnosticReport.extension[qaEventType]` | CodeableConcept; absent when analysis is not QC. System: `https://openelis-global.org/qa-event-type`. Drives `is_qc` derivation in OHS views. |
| Provenance from BR-V03-012 §4 | `DiagnosticReport.extension[orderProvenance]` | "copied" / "reflex:VR-NN" / "manual" — supports ISO 17025 §7.5 audit |

### 7.4 Deconvolution → derived from Specimen graph

> Per V-03 v1.4 the standalone `DeconvolutionTask` entity was removed. Deconvolution state and outcomes are now derivable directly from the pushed Specimen graph using `Specimen.parent` and the `deconvolutionStatus` extension on the parent Specimen. No separate FHIR `Task` resource is pushed.

| Source | FHIR path | Notes |
|---|---|---|
| `parent_aliquot_id` (on each child Sample) | `Specimen.parent` | Reference to parent Specimen — establishes the deconvolution tree |
| `deconvolutionStatus` (on parent Sample) | `Specimen.extension[deconvolutionStatus]` | NOT_APPLICABLE / PENDING / IN_PROGRESS / COMPLETE |
| Aggregation over children | (computed in OHS view) | `positive_count` = COUNT(child WHERE result is_positive); `outcome_pct` = positive_count / total_children × 100 |
| **Optional:** `VectorDeconvolutionEvent` audit | `Provenance` referencing parent Specimen | Triggering result, aliquot count, initiated-by, timestamp; OPTIONAL push |

---

## 8. OHS SQL-on-FHIR View Schemas

All views live in the `vector_analytics` Postgres schema. The OHS `sql-on-fhir` engine generates these by running SQL projections against the HAPI FHIR Postgres tables.

### 8.1 `vector_collection_samples`

> Renamed from `vector_collection_lots` to align with V-02's Sample entity (the term "lot" is no longer used). **Trap type and lifecycle stage reactivated in v1.4** per V-02 v2.4. Collection Context fields also surfaced.

```sql
CREATE OR REPLACE VIEW vector_analytics.vector_collection_samples AS
SELECT
    s.id                              AS sample_fhir_id,
    s.lab_number                      AS lab_number,
    -- v1.13: per-Aliquot collection_location_id may override parent's site
    COALESCE(s.aliquot_collection_location_id, s.site_id)     AS site_id,
    COALESCE(s.aliquot_collection_location_name, s.site_name) AS site_name,
    s.collection_date::date           AS collection_date,
    EXTRACT(ISOYEAR FROM s.collection_date::date)  AS iso_year,
    EXTRACT(WEEK   FROM s.collection_date::date)   AS iso_week,
    s.organism_group                  AS organism_group,
    s.organism_count::int             AS organism_count,        -- from Specimen.collection.quantity.value
    (s.organism_count > 1)::boolean   AS is_pool,                -- derived; replaces former pool_flag
    s.identification_status           AS identification_status,
    s.deconvolution_status            AS deconvolution_status,
    s.parent_sample_fhir_id           AS parent_sample_fhir_id,  -- null for top-level samples; set for aliquots
    -- v1.4 trap type reactivation (Specimen.type.coding[1])
    s.trap_type_code                  AS trap_type_code,
    s.trap_type_name                  AS trap_type_name,
    -- v1.4 lifecycle stage from Specimen.extension[lifecycleStage]
    s.lifecycle_stage                 AS lifecycle_stage,
    -- v1.4 Collection Context fields (V-02 v2.4)
    s.collection_time_of_day          AS collection_time_of_day,
    s.resting_context                 AS resting_context,
    s.human_biting_catch::boolean     AS human_biting_catch,
    -- QC derivation: a Sample is QC if any of its Analyses has a linked AnalysisQaEvent (OpenELIS pattern).
    -- Pulled in OHS via DiagnosticReport.extension[qaEventType].
    EXISTS (
        SELECT 1
          FROM ohs_diagnosticreport_flat dr
         WHERE dr.specimen_ref = s.id
           AND dr.qa_event_type IS NOT NULL
    )::boolean                        AS is_qc,
    (
        SELECT array_agg(DISTINCT dr.qa_event_type)
          FROM ohs_diagnosticreport_flat dr
         WHERE dr.specimen_ref = s.id
           AND dr.qa_event_type IS NOT NULL
    )                                 AS qa_event_types  -- e.g. {'Positive Control'}, {'Blank','Duplicate'}, NULL when not QC
FROM ohs_specimen_flat s
WHERE s.system = 'https://openelis-global.org/sample';
```

### 8.2 `vector_specimen_ids`

```sql
CREATE OR REPLACE VIEW vector_analytics.vector_specimen_ids AS
SELECT
    o.id                              AS obs_fhir_id,
    o.specimen_ref                    AS lot_fhir_id,
    o.species_code                    AS species_code,
    o.species_name                    AS species_name,
    o.method_code                     AS identification_method,
    o.interpretation_code             AS confidence,
    o.effective_date::date            AS identification_date,
    s.site_id                         AS site_id,
    s.site_name                       AS site_name,
    s.collection_date::date           AS collection_date,
    EXTRACT(ISOYEAR FROM s.collection_date::date) AS iso_year,
    EXTRACT(WEEK   FROM s.collection_date::date) AS iso_week
FROM ohs_observation_flat o
JOIN ohs_specimen_flat s ON s.id = o.specimen_ref
WHERE o.loinc_code = '81255-2';
```

### 8.3 `vector_pathogen_results`

```sql
CREATE OR REPLACE VIEW vector_analytics.vector_pathogen_results AS
SELECT
    dr.id                             AS report_fhir_id,
    dr.specimen_ref                   AS sample_fhir_id,
    dr.panel_loinc                    AS panel_loinc,
    dr.panel_name                     AS panel_name,
    dr.conclusion                     AS result_value,
    (dr.conclusion = 'Positive')::boolean AS is_positive,
    dr.effective_date::date           AS result_date,
    s.site_id                         AS site_id,
    s.site_name                       AS site_name,
    s.organism_group                  AS organism_group,
    s.organism_count::int             AS organism_count,        -- pool size when is_pool, else 1
    (s.organism_count > 1)::boolean   AS is_pool,
    -- QC derivation: this analysis is QC iff its FHIR DiagnosticReport carries a qaEventType extension
    -- (sourced from analysis_qaevent → qa_event in OpenELIS; see FR-V04-QC-001).
    (dr.qa_event_type IS NOT NULL)::boolean AS is_qc,
    dr.qa_event_type                  AS qa_event_type,         -- 'Positive Control' / 'Negative Control' / 'Blank' / 'Duplicate' / NULL
    EXTRACT(ISOYEAR FROM dr.effective_date::date) AS iso_year,
    EXTRACT(WEEK   FROM dr.effective_date::date) AS iso_week
FROM ohs_diagnosticreport_flat dr
JOIN ohs_specimen_flat s ON s.id = dr.specimen_ref;
```

### 8.4 `vector_mir_weekly` (pre-aggregated)

Computes two infection rate metrics side-by-side:

- **`mir_classic`** — classical Minimum Infection Rate. `(positive_pools / total_organisms) × 1000`. Treats every positive pool as exactly 1 positive organism; conservative lower bound used by national surveillance programs and WHO standards for cross-program comparability.
- **`infection_rate_per_1000`** — hybrid metric. Uses *exact* positive counts when a pool's `deconvolution_status = COMPLETE`; falls back to the classical 1-positive-per-pool assumption when the pool is unresolved. When deconvolution coverage reaches 100%, this is the true observed infection rate.

A diagnostic `positive_resolution_pct` is included so report readers can judge how trustworthy `infection_rate_per_1000` is: 100% means fully resolved (the hybrid metric reflects ground truth), 0% means none resolved (the hybrid metric equals classical).

```sql
CREATE OR REPLACE VIEW vector_analytics.vector_mir_weekly AS
WITH sample_positivity AS (
    -- For each top-level non-QC tested Sample, compute the inferred number of
    -- positive organisms in that Sample, using exact counts when deconvolution is
    -- COMPLETE and the classical 1-positive-per-pool assumption otherwise.
    SELECT
        pr.site_id,
        pr.site_name,
        pr.organism_group,
        pr.panel_loinc,
        pr.panel_name,
        pr.iso_year,
        pr.iso_week,
        pr.sample_fhir_id,
        pr.organism_count,
        pr.is_positive,
        cs.deconvolution_status,
        (cs.deconvolution_status = 'COMPLETE')::boolean AS is_resolved,
        CASE
            WHEN NOT pr.is_positive
                THEN 0                                    -- negative pool / individual contributes 0 positives
            WHEN cs.organism_count = 1
                THEN 1                                    -- positive individual
            WHEN cs.deconvolution_status = 'COMPLETE'
                THEN (
                    -- exact count of positive descendant individuals for the same panel
                    SELECT COUNT(*)
                      FROM vector_analytics.vector_pathogen_results child_pr
                      JOIN vector_analytics.vector_collection_samples child_cs
                        ON child_pr.sample_fhir_id = child_cs.sample_fhir_id
                     WHERE child_cs.parent_sample_fhir_id = cs.sample_fhir_id
                       AND child_pr.panel_loinc = pr.panel_loinc
                       AND child_pr.is_positive
                       AND child_cs.organism_count = 1
                )
            ELSE 1                                        -- unresolved positive pool → classical assumption
        END                                               AS inferred_positive_organisms
    FROM vector_analytics.vector_pathogen_results pr
    JOIN vector_analytics.vector_collection_samples cs
        ON cs.sample_fhir_id = pr.sample_fhir_id
    WHERE pr.is_qc = FALSE                                -- FR-V04-QC-002
      AND cs.parent_sample_fhir_id IS NULL                -- top-level only; aliquots fold into their parent
)
SELECT
    site_id,
    site_name,
    organism_group,
    panel_loinc,
    panel_name,
    iso_year,
    iso_week,
    -- Counts
    COUNT(*)                              AS samples_tested,
    SUM(is_positive::int)                 AS positive_samples,
    SUM(organism_count)                   AS total_organisms,
    SUM(inferred_positive_organisms)      AS inferred_positive_organisms,
    SUM(CASE WHEN is_positive THEN 1 ELSE 0 END)         AS positive_pools,
    SUM(CASE WHEN is_positive AND is_resolved THEN 1 ELSE 0 END) AS resolved_positive_pools,
    -- mir_classic — conservative lower-bound; comparable across programs.
    ROUND(
        (SUM(is_positive::int)::numeric / NULLIF(SUM(organism_count), 0)) * 1000,
        2
    )                                     AS mir_classic,
    -- infection_rate_per_1000 — uses exact counts when resolved; classical fallback otherwise.
    ROUND(
        (SUM(inferred_positive_organisms)::numeric / NULLIF(SUM(organism_count), 0)) * 1000,
        2
    )                                     AS infection_rate_per_1000,
    -- sporozoite_rate_pct (added v1.4) — same numerator as infection_rate_per_1000, just rescaled to %
    -- and conventionally only meaningful for malaria with deconvolution-to-individuals + microscopy confirmation
    -- (Plasmodium Speciation Panel + VR-07 reflex → Sporozoite Confirmation Panel; V-03 Appendix A.5.9).
    -- Display only when positive_resolution_pct >= 95% per Dashboard #4 rules.
    ROUND(
        (SUM(inferred_positive_organisms)::numeric / NULLIF(SUM(organism_count), 0)) * 100,
        2
    )                                     AS sporozoite_rate_pct,
    -- Diagnostic — % of positive pools that have been deconvoluted.
    -- 100% → infection_rate_per_1000 equals the true observed infection rate.
    -- 0%   → infection_rate_per_1000 equals mir_classic.
    ROUND(
        SUM(CASE WHEN is_positive AND is_resolved THEN 1 ELSE 0 END)::numeric
            / NULLIF(SUM(CASE WHEN is_positive THEN 1 ELSE 0 END), 0) * 100,
        1
    )                                     AS positive_resolution_pct
FROM sample_positivity
GROUP BY site_id, site_name, organism_group,
         panel_loinc, panel_name, iso_year, iso_week;
```

### 8.5 `vector_collection_density_daily` (pre-aggregated)

> Renamed from `vector_trap_catch_daily`. Trap-type stratification is deferred (§17.2). The metric is now organisms-per-collection-event (a collection event = one Sample submission to the lab on a given date from a given site, regardless of trap method). When trap type is reactivated, it can be added as a grouping column without breaking this view's contract.

Collection density = total organisms received / number of collection events

```sql
CREATE OR REPLACE VIEW vector_analytics.vector_collection_density_daily AS
SELECT
    cs.site_id,
    cs.site_name,
    cs.organism_group,
    cs.collection_date,
    cs.iso_year,
    cs.iso_week,
    COUNT(*)                          AS collection_events,
    SUM(cs.organism_count)            AS total_organisms,
    ROUND(
        SUM(cs.organism_count)::numeric / NULLIF(COUNT(*), 0),
        2
    )                                 AS organisms_per_event
FROM vector_analytics.vector_collection_samples cs
WHERE cs.parent_sample_fhir_id IS NULL    -- exclude aliquots; only top-level submissions count as collection events
  AND cs.is_qc = FALSE                    -- FR-V04-QC-002 — exclude QC samples from density aggregates
GROUP BY cs.site_id, cs.site_name, cs.organism_group,
         cs.collection_date, cs.iso_year, cs.iso_week;
```

### 8.6 `vector_qc_monitoring` (pre-aggregated)

QC pass rate per QA event type per site per ISO week. Surfaces lab QC health alongside surveillance metrics — e.g., "Positive Control pass rate at BPP-01 was 96% in W12; investigate." Per FR-V04-QC-003.

```sql
CREATE OR REPLACE VIEW vector_analytics.vector_qc_monitoring AS
SELECT
    pr.site_id,
    pr.site_name,
    pr.qa_event_type,
    pr.panel_loinc,
    pr.panel_name,
    pr.iso_year,
    pr.iso_week,
    COUNT(*)                          AS qc_samples_run,
    -- "Pass" semantics depend on QA event type:
    --   Positive Control  → expected POSITIVE  → pass = is_positive
    --   Negative Control  → expected NEGATIVE  → pass = NOT is_positive
    --   Blank             → expected NEGATIVE  → pass = NOT is_positive
    --   Duplicate         → pass requires concordance with paired analysis (computed downstream; this view records both rows)
    SUM(CASE
        WHEN pr.qa_event_type = 'Positive Control' AND     pr.is_positive THEN 1
        WHEN pr.qa_event_type = 'Negative Control' AND NOT pr.is_positive THEN 1
        WHEN pr.qa_event_type = 'Blank'            AND NOT pr.is_positive THEN 1
        ELSE 0
    END)                              AS qc_passes,
    ROUND(
        SUM(CASE
            WHEN pr.qa_event_type = 'Positive Control' AND     pr.is_positive THEN 1
            WHEN pr.qa_event_type = 'Negative Control' AND NOT pr.is_positive THEN 1
            WHEN pr.qa_event_type = 'Blank'            AND NOT pr.is_positive THEN 1
            ELSE 0
        END)::numeric / NULLIF(COUNT(*), 0) * 100,
        2
    )                                 AS qc_pass_rate_pct
FROM vector_analytics.vector_pathogen_results pr
WHERE pr.is_qc = TRUE                                           -- inverse of FR-V04-QC-002 — QC-only view
GROUP BY pr.site_id, pr.site_name, pr.qa_event_type,
         pr.panel_loinc, pr.panel_name, pr.iso_year, pr.iso_week;
```

> **Note on Duplicate QC:** Pass-rate calculation for Duplicate-type QC requires comparing two paired analyses for concordance. The view above records each duplicate row but does not compute concordance — that is expressed in a separate downstream view or Superset calculated column when needed.

---

## 9. Superset Dashboard Inventory

All six charts are assembled into the **"Vector Surveillance Overview"** dashboard (UUID configured at deploy time).

| # | Chart name | Type | Source view | X axis | Y axis / Metric | Notes |
|---|---|---|---|---|---|---|
| 1 | **Collection Density — Trend** | Line chart | `vector_collection_density_daily` | `collection_date` (weekly aggregate) | `organisms_per_event` (avg) | Grouped by `site_name`; **trap type filter added v1.4** (Dictionary-backed, includes passive traps + collection methods); lifecycle stage filter (default ADULT). Threshold reference line configurable. |
| 2 | **Species Distribution** | Pie / Donut | `vector_specimen_ids` | — | COUNT per `species_name` | Filterable by site, date range, `confidence = CONFIRMED`, lifecycle stage |
| 3 | **Pathogen Positivity Rate** | Bar chart | `vector_pathogen_results` | `iso_week` | `is_positive` (% of rows) | Grouped by `panel_name`; stacked by site |
| 4 | **Infection Rate by Species × Panel** | Heatmap (3-way toggle, v1.4) | `vector_mir_weekly` | `iso_week` | `infection_rate_per_1000` (default) / `mir_classic` / **`sporozoite_rate_pct` (v1.4)** | Rows = `species_name`; color = quartile. Toggle in chart header switches metric. Tooltip shows ALL THREE metrics plus `positive_resolution_pct`. When `positive_resolution_pct < 95%`, the Sporozoite Rate toggle is disabled with hover hint "Insufficient deconvolution coverage for sporozoite rate." When `positive_resolution_pct < 100%`, the chart displays a small warning glyph indicating partial resolution. **Defaults to ADULT lifecycle stage**; toggle to include other stages. |
| 5 | **Site Comparison — Collection Density** | Bar chart | `vector_collection_density_daily` | `site_name` | `organisms_per_event` (period avg) | Horizontal bars; color by `organism_group`; **trap type stratification added v1.4** (multi-select filter). |
| 6 | **KPI Summary Tiles** | Big Number | All views | — | Total samples · Total organisms · Active sites · Highest MIR this week | 4-tile header row on dashboard. Counts exclude QC samples per FR-V04-QC-002. |
| 7 | **QC Pass Rate** | Bar chart | `vector_qc_monitoring` | `iso_week` | `qc_pass_rate_pct` | Grouped by `qa_event_type`; one stack per site. Threshold reference line at 95% (configurable). Renders below the surveillance dashboard, under a clear "Quality Control" section divider. Per FR-V04-QC-003. |

---

## 10. Infrastructure Specification

### 10.1 Docker Compose Services

```yaml
# Additions to docker-compose.yml

  postgres-fhir:
    image: postgres:15
    environment:
      POSTGRES_DB: fhir
      POSTGRES_USER: ${FHIR_DB_USER}
      POSTGRES_PASSWORD: ${FHIR_DB_PASSWORD}
    volumes:
      - fhir-db-data:/var/lib/postgresql/data
    networks:
      - openelis-network

  hapi-fhir:
    image: hapiproject/hapi:latest
    environment:
      spring.datasource.url: jdbc:postgresql://postgres-fhir:5432/fhir
      spring.datasource.username: ${FHIR_DB_USER}
      spring.datasource.password: ${FHIR_DB_PASSWORD}
      hapi.fhir.fhir_version: R4
    ports:
      - "8080:8080"    # Internal only — do not expose externally
    depends_on:
      - postgres-fhir
    networks:
      - openelis-network

  superset:
    image: apache/superset:latest
    environment:
      SUPERSET_SECRET_KEY: ${SUPERSET_SECRET_KEY}
      DATABASE_URL: postgresql+psycopg2://${FHIR_DB_USER}:${FHIR_DB_PASSWORD}@postgres-fhir:5432/fhir
    volumes:
      - ./superset_config.py:/app/pythonpath/superset_config.py
    ports:
      - "8088:8088"    # Internal only — proxied via nginx at /superset
    depends_on:
      - postgres-fhir
    networks:
      - openelis-network

volumes:
  fhir-db-data:
```

### 10.2 `superset_config.py`

```python
import os

SECRET_KEY = os.environ["SUPERSET_SECRET_KEY"]

FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,
    "ENABLE_TEMPLATE_PROCESSING": True,
}

# Allow OpenELIS to embed Superset
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "resources": ["*"],
    "origins": [os.environ.get("OPENELIS_ORIGIN", "http://localhost:8080")],
}

GUEST_ROLE_NAME = "VectorSurveillanceGuest"
GUEST_TOKEN_JWT_EXP_SECONDS = 300   # 5-minute token lifetime

# Email alerts (SMTP)
SMTP_HOST = os.environ.get("SMTP_HOST", "localhost")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_STARTTLS = True
ENABLE_SCHEDULED_EMAIL_REPORTS = True

# Row-level security (deferrable)
# ENABLE_ROW_LEVEL_SECURITY = True   # Uncomment to enable RLS
```

### 10.3 Headless Browser for PDF Export

PDF export requires a headless Chromium instance accessible to Superset. Add to Docker Compose:

```yaml
  chromium:
    image: browserless/chrome:latest
    environment:
      MAX_CONCURRENT_SESSIONS: 5
    networks:
      - openelis-network
```

Add to `superset_config.py`:
```python
WEBDRIVER_BASEURL = "http://superset:8088/"
WEBDRIVER_BASEURL_USER_FRIENDLY = os.environ.get("SUPERSET_EXTERNAL_URL", "http://superset:8088/")
```

### 10.4 Nginx Proxy Configuration

```nginx
# Add to existing nginx.conf

location /superset/ {
    proxy_pass         http://superset:8088/;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
}
```

### 10.5 OHS ETL Job

The OHS SQL-on-FHIR ETL runs as a Spring `@Scheduled` job (or standalone Python script using `sqlalchemy-fhirstore`). Configuration:

| Parameter | Env var | Default |
|---|---|---|
| Cron schedule | `OHS_ETL_CRON` | `0 */15 * * * *` (every 15 min) |
| FHIR server URL | `HAPI_FHIR_URL` | `http://hapi-fhir:8080/fhir` |
| Analytics DB URL | `ANALYTICS_DB_URL` | `postgresql://…/fhir` |
| Analytics schema | `ANALYTICS_SCHEMA` | `vector_analytics` |

---

## 11. OpenELIS Embedding Page

### Navigation Path

Reports → Vector Surveillance

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Tag: ● Connected / ○ Unavailable]   Vector Surveillance Dashboard  │
│                                                                      │
│  Date range: [2026-01-01] → [2026-04-20]   Site: [All Sites ▾]      │
│                                          [Export PDF] [Open in ↗]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   <Loading spinner — while guest token is being fetched>            │
│                                                                      │
│   OR                                                                 │
│                                                                      │
│   <InlineNotification kind="error" — if Superset unreachable>       │
│                                                                      │
│   OR                                                                 │
│                                                                      │
│   <iframe width="100%" height="calc(100vh - 120px)"                 │
│     src="/superset/embedded/{dashboardUuid}?token={guestToken}      │
│          &native_filters_key={encodedFilters}" />                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Backend Endpoint

```
POST /api/v1/vector/superset/guest-token

Request body:
{
  "dateFrom": "2026-01-01",
  "dateTo":   "2026-04-20",
  "siteIds":  [1, 2, 3]          // empty = all sites
}

Response:
{
  "token": "<jwt>",
  "dashboardUuid": "abc-123",
  "expiresAt": "2026-04-20T10:05:00Z",
  "nativeFiltersKey": "<encoded>"  // pre-computed filter state
}
```

Internally this calls: `POST /superset/api/v1/security/guest_token` with the service account credentials stored in OpenELIS system properties (`superset.serviceAccount.username`, `superset.serviceAccount.password`).

### RLS Guest Token Request (deferrable)

```json
{
  "user": { "username": "coordinator_siti", "first_name": "Siti", "last_name": "Rahayu" },
  "resources": [{ "type": "dashboard", "id": "abc-123" }],
  "rls": [{ "clause": "site_id IN (1, 3)" }]
}
```

> **⚠ Deferrable:** The `rls` field is only included when `vectorReport.rls.enabled = true` in OpenELIS system properties. Omit for single-tenant deployments.

---

## 12. Business Rules

**BR-V04-001:** Two infection rate metrics MUST be computed in `vector_mir_weekly` and surfaced together on Dashboard #4:

1. **`mir_classic`** — Minimum Infection Rate (classical formulation). Formula: `(positive_pools / total_organisms_tested) × 1000`. Treats every positive pool as containing exactly one positive organism. This is the conservative lower-bound estimate used by most national vector surveillance programs and is required for cross-program comparability.

2. **`infection_rate_per_1000`** — Hybrid observed-with-fallback infection rate. For each tested top-level Sample, the inferred number of positive organisms is computed as: exact count of positive descendant individuals when `deconvolution_status = COMPLETE`; 1 (classical assumption) when the pool is positive but unresolved; 0 when the pool is negative; 1 when an individual organism (`organism_count = 1`) is positive. Formula: `(SUM(inferred_positive_organisms) / SUM(total_organisms)) × 1000`. When all positive pools in the reporting period are deconvoluted, this metric equals the true observed infection rate.

A `positive_resolution_pct` diagnostic column MUST accompany both metrics, indicating the percentage of positive pools that have been fully deconvoluted in the reporting period. A value of 100% means the hybrid metric reflects ground truth; 0% means it equals `mir_classic`. Values in between represent partial resolution.

Only pools with a `CONFIRMED` test result status MUST be counted as positive. Inconclusive results MUST be excluded from numerator and denominator of both metrics. QC samples MUST NOT contribute to either numerator or denominator (BR-V04-008).

**BR-V04-002:** Only `VectorSpecimenIdentification` records with `confidence = CONFIRMED` MUST contribute to species distribution charts (per BR-V03-010).

**BR-V04-003:** Collection density MUST be expressed as organisms per collection event, where a collection event is one VECTOR-domain Sample submission (top-level, not aliquot) on a given collection date from a given sampling site. Trap-night and trap-type stratification are deferred (§17.2). Aliquots derived via deconvolution MUST NOT be counted as additional collection events.

**BR-V04-004:** Guest tokens MUST expire after 300 seconds (5 minutes). The OpenELIS frontend MUST silently refresh the token on expiry by calling the backend endpoint again. Refreshes MUST NOT cause a visible iframe reload.

**BR-V04-005:** FHIR push failures MUST NOT block the primary V-02/V-03 workflow. If FHIR push fails, OpenELIS MUST log the failure and queue the resource for retry on the next push cycle. Dashboard data may lag by up to one push cycle.

**BR-V04-006:** The OHS ETL job MUST complete within 5 minutes for datasets up to 500,000 FHIR resources. If the ETL job exceeds 10 minutes, it MUST be terminated and an error logged.

**BR-V04-007:** The `vector_analytics` schema views MUST be refreshed atomically. No Superset query MUST see a partial state during ETL refresh.

**BR-V04-008:** QC samples (those with one or more `analysis_qaevent` linkages on their analyses) MUST NOT contribute to MIR numerator, MIR denominator, or organism density calculations. They MUST be surfaced separately via `vector_qc_monitoring` (§8.6) and Dashboard #7 (§9). Users MUST NOT be able to disable this exclusion via filters — it is a structural property of the surveillance views, not a UI toggle.

---

## 13. Localization

All OpenELIS UI strings (header strip, error states, buttons) are externalized. Superset chart labels are managed in Superset admin separately.

| i18n Key | Default English Text |
|---|---|
| `heading.vectorReport.title` | Vector Surveillance Dashboard |
| `label.vectorReport.dateFrom` | From |
| `label.vectorReport.dateTo` | To |
| `label.vectorReport.siteFilter` | Sampling Site |
| `label.vectorReport.siteFilter.all` | All Sites |
| `label.vectorReport.connectionStatus.connected` | Connected |
| `label.vectorReport.connectionStatus.unavailable` | Dashboard Unavailable |
| `button.vectorReport.exportPdf` | Export PDF |
| `button.vectorReport.openSuperset` | Open in Superset |
| `button.vectorReport.retry` | Retry |
| `button.vectorReport.applyFilters` | Apply Filters |
| `error.vectorReport.supersetUnavailable` | The vector surveillance dashboard is temporarily unavailable. |
| `error.vectorReport.tokenFetchFailed` | Could not connect to the analytics service. Please try again. |
| `error.vectorReport.exportFailed` | PDF export failed. Please try again or open the dashboard in Superset. |
| `message.vectorReport.tokenRefreshing` | Refreshing dashboard session… |
| `placeholder.vectorReport.siteFilter` | Search sites… |
| `nav.vectorReport.title` | Vector Surveillance |

---

## 14. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Date range: From | Must be a valid date | `error.vectorReport.invalidDate` |
| Date range: To | Must be ≥ From date | `error.vectorReport.dateRangeInvalid` |
| Date range: span | Maximum 2 years | `error.vectorReport.dateRangeTooLarge` |
| Guest token | Must not be expired before iframe load | Internal — triggers silent refresh |
| FHIR Specimen push | `received_at` required (collection date upstream of OpenELIS not captured by V-02) | Blocked at V-02 Sample save |

---

## 15. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Vector Surveillance page | `vectorReport.view` | Menu item hidden |
| Fetch guest token | `vectorReport.view` | Backend returns 403 |
| Export PDF | `vectorReport.export` | Export PDF button hidden; backend returns 403 |
| Open in Superset | `vectorReport.openSuperset` | Button hidden |
| Administer Superset alerts | Superset `Admin` role | Superset-level only; no OpenELIS permission |

**Guest token security:** Guest tokens are issued server-side only. The Superset service account credentials MUST be stored in OpenELIS system properties (encrypted at rest) and MUST NOT be exposed to the frontend.

**RLS (deferrable):** When enabled, the guest token `rls` clause MUST restrict all dashboard queries to sites the authenticated OpenELIS user is assigned to. Enabling RLS requires: (1) Superset RLS datasets configured per view, (2) OpenELIS `SystemUser.assignedSites` populated, (3) `vectorReport.rls.enabled = true` in system properties.

---

## 16. Acceptance Criteria

### Infrastructure

- [ ] `docker-compose up` starts `hapi-fhir`, `postgres-fhir`, and `superset` services without errors
- [ ] Superset is accessible at `/superset` via the nginx reverse proxy
- [ ] Port 8088 and 8080 are not accessible from external networks
- [ ] OHS ETL job runs on schedule and populates all five `vector_analytics` views
- [ ] `superset_config.py` reads all secrets from environment variables; no hardcoded credentials

### FHIR Mapping

- [ ] Creating a VECTOR-domain Sample in V-02 generates a FHIR `Specimen` resource in HAPI FHIR within one push cycle
- [ ] Creating a deconvolution aliquot in V-03 generates a FHIR `Specimen` with `Specimen.parent` set to the parent Sample's Specimen reference
- [ ] Saving a VectorSpecimenIdentification in V-03 generates a FHIR `Observation` (LOINC 81255-2)
- [ ] A positive pool result generates a FHIR `DiagnosticReport` referencing the parent Specimen
- [ ] FHIR push failure is logged and does not block the V-02/V-03 UI workflow

### OHS Views

- [ ] `vector_collection_density_daily` produces correct `organisms_per_event` (organisms / collection events per site per organism group per day, top-level samples only, QC excluded)
- [ ] `vector_mir_weekly` `mir_classic` formula: `(positive_pools / total_organisms) × 1000`, rounded to 2 dp, QC excluded
- [ ] `vector_mir_weekly` `infection_rate_per_1000` uses exact descendant positive count when parent's `deconvolution_status = COMPLETE`; falls back to 1-per-positive-pool otherwise
- [ ] `vector_mir_weekly` `infection_rate_per_1000` equals `mir_classic` when no positive pools are resolved (`positive_resolution_pct = 0`)
- [ ] `vector_mir_weekly` `infection_rate_per_1000` equals true observed infection rate when all positive pools are resolved (`positive_resolution_pct = 100`)
- [ ] `positive_resolution_pct` correctly reflects the deconvolution coverage of positive pools in the period
- [ ] Dashboard #4 toggle correctly switches the heatmap between `mir_classic` and `infection_rate_per_1000`
- [ ] Dashboard #4 tooltip shows both metrics plus `positive_resolution_pct` simultaneously
- [ ] Dashboard #4 partial-resolution warning glyph appears when `positive_resolution_pct < 100`
- [ ] `vector_collection_samples` `is_qc` column is TRUE iff at least one of the Sample's analyses has a linked `analysis_qaevent` record
- [ ] `vector_pathogen_results` `is_qc` column matches the analysis's `qa_event_type` extension presence
- [ ] A Sample submitted as a "Positive Control" QC type does NOT appear in `vector_mir_weekly` or `vector_collection_density_daily`
- [ ] The same Sample DOES appear in `vector_qc_monitoring` with `qa_event_type = 'Positive Control'`
- [ ] `vector_qc_monitoring` correctly computes `qc_pass_rate_pct` for Positive Control (expected POS), Negative Control (expected NEG), and Blank (expected NEG) types
- [ ] Dashboard #7 "QC Pass Rate" renders below a "Quality Control" section divider and is visually separate from surveillance charts
- [ ] BR-V04-008: there is no UI toggle that allows QC samples to flow into surveillance aggregates
- [ ] Views refresh atomically — no partial reads during ETL
- [ ] ETL completes in < 5 minutes for a 500k-resource FHIR dataset

### Superset Dashboards

- [ ] "Vector Surveillance Overview" dashboard contains all six charts
- [ ] Date range and site cross-filters update all charts simultaneously
- [ ] PDF export produces a formatted multi-page PDF of the dashboard
- [ ] Superset alert rule can be configured for MIR > threshold → email delivered

### OpenELIS Embedding

- [ ] Reports → Vector Surveillance appears in navigation for users with `vectorReport.view`
- [ ] Page shows `Loading` spinner while guest token is being fetched
- [ ] Dashboard iframe renders after successful guest token fetch
- [ ] Date range and site filter changes re-fetch guest token and update iframe without full page reload
- [ ] Connection error shows `InlineNotification` (kind=error) with Retry button; iframe is hidden
- [ ] Export PDF button triggers download via backend proxy
- [ ] Open in Superset button opens Superset in a new tab
- [ ] Guest token is refreshed silently on expiry without visible iframe reload
- [ ] All strings use i18n keys — no hardcoded English in JSX

### RLS (deferrable)

- [ ] When `vectorReport.rls.enabled = true`, guest token includes `rls` clause scoped to user's assigned sites
- [ ] Coordinator assigned to sites A and B cannot see data for site C in any chart

---

## 17. Future Scope

### 17.1 V-04b — In-App Outbreak Alerts

A separate Jira story (V-04b) will add in-app alert integration:

**Scope:**
- A Spring `@Scheduled` background job polls `vector_mir_weekly` and `vector_collection_density_daily` every 15 minutes
- When a metric exceeds a configured threshold (stored in a new `VectorAlertThreshold` entity), the job creates an OpenELIS `SystemNotification`
- The notification appears in the existing OpenELIS Alerts tab with severity (WARNING / CRITICAL), metric name, site, current value, and threshold value
- An `InlineNotification` banner also appears on the Reports → Vector Surveillance page when there is at least one active unacknowledged alert for the sites visible to the user
- Acknowledging the alert in the Alerts tab dismisses the banner
- Configuration UI: Admin → Vector Surveillance → Alert Thresholds (DataTable with inline row expansion for threshold values per metric × organism group × site)

**Dependencies on V-04:** `VectorAlertThreshold` entity, `vector_analytics` views (must be available), `vectorReport.view` permission.

**Data model preview:**
```sql
CREATE TABLE vector_alert_threshold (
    id                SERIAL PRIMARY KEY,
    metric            VARCHAR(50) NOT NULL,  -- MIR | CATCH_RATE
    organism_group    VARCHAR(30),           -- nullable = all groups
    site_id           INTEGER REFERENCES sampling_site(id),  -- nullable = all sites
    panel_loinc       VARCHAR(20),           -- nullable = all panels; MIR only
    warning_threshold NUMERIC(10,3) NOT NULL,
    critical_threshold NUMERIC(10,3) NOT NULL,
    is_active         BOOLEAN DEFAULT TRUE,
    created_by        INTEGER REFERENCES system_user(id),
    created_at        TIMESTAMP DEFAULT NOW()
);
```

### 17.2 Trap Type Reactivation — ✅ Completed v1.4

**Status:** ~~Designed in the OpenELIS backend but currently out of scope for V-02 intake~~ → **Reactivated in V-02 v2.4 + V-04 v1.4** (vector expert validation pass). Trap type is now captured at intake (V-02 §4.2 Step 1), surfaces through the FHIR pipeline (§7.1), is exposed in the OHS view (§8.1), and stratifies Dashboards #1 + #5 (§9). The trap type Dictionary category (V-03 Appendix A.7.10) covers both passive traps (BG-Sentinel, CDC light trap, gravid trap, ovitrap) and active collection methods (human-landing collection, aspirator, sweep net) per the expert's confirmation.

**Carve-out preserved from the deferred state:** trap type is **not** included in the eWARS or SILANTOR export adapters (§6.6) — those platforms do not track trap-type at the export layer. Trap stratification is internal to V-04 dashboards only.

The remainder of this section is preserved as historical context for the original deferral rationale:

**Original deferred status:** Designed in the OpenELIS backend but currently out of scope for V-02 intake (per the V-02 v2.3 simplification pass). Trap type fields exist on the underlying entities and remain queryable for legacy/imported records but are not collected via the current V-02 workflow and are therefore omitted from the V-04 v1.1 analytics surface.

**Reactivation path (no ETL re-run required):**

1. **V-02 intake** — restore the Trap Type ComboBox in Step 1 (Vector domain) sourced from the existing trap-type catalog. No data model change needed.
2. **V-04 §7.1 FHIR mapping** — re-add `trap_type → Specimen.type.coding[1]` (system: `https://openelis-global.org/trap-type`).
3. **V-04 §8.1 view** — re-add `s.trap_type_code AS trap_type_code` and `s.trap_type_name AS trap_type_name` columns to `vector_collection_samples`.
4. **V-04 §8.5 view** — re-add `cs.trap_type_code, cs.trap_type_name` to `vector_collection_density_daily`'s SELECT and GROUP BY clauses. Optionally introduce `vector_trap_efficacy_daily` as a derived view if direct trap-comparison metrics are required.
5. **V-04 §9 dashboard** — add a "Catch Rate by Trap Type" chart (Dashboard #7) and add Trap Type to the dashboard cross-filter set. Existing dashboards continue to function unchanged because trap type would only be added as an additional grouping dimension.

**Surveillance metrics that become available on reactivation:**

- Catch rate per trap-night (the original `catch_rate = specimens / trap-nights` formulation)
- Trap-type efficacy comparison (e.g., BG-Sentinel vs. CDC light trap for *Aedes* surveillance)
- Trap-type-stratified MIR (rarely needed but valuable for some research programs)

**Why deferred:** Field labs in the V-04 v1.1 deployment context (Indonesia, single-trap-type sites) reported the trap-type field as low-value friction during intake. The data model and FHIR coding system stay in place so reactivation is purely a UI + view-layer change with no migration burden.

### 17.3 V-04c — MLE-based Infection Rate Estimation

**Status:** Considered in V-04 v1.3 design and deferred to a future release.

**Background.** The two-metric approach in §8.4 (`mir_classic` + `infection_rate_per_1000`) gives surveillance programs a defensible lower-bound estimate plus a hybrid metric that improves as deconvolution coverage grows. Both metrics break down for the case that vector surveillance most commonly faces: **variable pool sizes at low prevalence with no deconvolution.** In that regime, neither classical MIR nor the hybrid metric is statistically optimal — the gold-standard estimator is a **maximum likelihood estimate (MLE) of infection rate from pooled data**, as implemented in CDC's PooledInfRate package and described in Biggerstaff (2008).

**Why deferred.** The MLE estimator requires an iterative numerical solver (Newton-Raphson or expectation-maximisation) over the joint likelihood of variable-pool-size pooled testing data. It cannot be expressed in pure SQL and therefore does not fit cleanly into an OHS view. Implementation options for a future V-04c release:

1. A Python OHS post-processing job that consumes `vector_pathogen_results`, runs the PooledInfRate algorithm per site × organism × panel × week group, and writes results to a `vector_mle_weekly` materialised table.
2. A Spring `@Scheduled` job in the OpenELIS application calling a JVM port of the algorithm.
3. A Superset Python virtual dataset that calls a microservice running the estimator.

**Surveillance value.** Programs already submitting MIR figures to national health authorities will continue to use `mir_classic` because that is what the authority requires. MLE infection rate would be an internal analytical layer for outbreak signal detection and entomological research, not a reporting metric. This is why deferral is acceptable for V-04 v1.3.

**Design hook in V-04 v1.3:** The `vector_mir_weekly` view's column ordering and naming (`mir_classic` vs. `infection_rate_per_1000`) leaves room for a future `mle_infection_rate` column to be added without renaming or breaking existing dashboards.

### 17.4 V-04d — eWARS / SILANTOR API Push (Deferred from v1.4)

**Status:** Considered in V-04 v1.4 design and deferred to a future release. v1.4 ships CSV exporters (§6.6) as the v1 submission path; API push is the next iteration.

**Background.** v1.4 §6.6 implements **CSV exporters** for eWARS and SILANTOR — manual button + scheduled email-out, weekly cadence, row-per-pool. This was confirmed with the vector expert as the current standard ingestion shape for both Indonesian platforms. The expert also flagged that both platforms are evolving toward API ingestion (eWARS via DHIS2 Web API; SILANTOR's API is roadmap, not yet specified). API push will be the right architecture once those endpoints stabilise.

**Why deferred.** Three reasons:

1. **eWARS/SILANTOR API specs are not stabilised** — building against an unfrozen API guarantees rework. CSV is the lowest-friction path that meets the v1 reporting requirement today.
2. **Auth model is unclear** — DHIS2 supports basic auth, OAuth2, and PAT; SILANTOR's auth model isn't published. Each requires a different credential admin surface.
3. **Failure handling is more complex** — CSV submissions are idempotent (re-upload the same file) and human-reviewable; API submissions need retry queues, dedup logic, and reconciliation views. The v1 timeline doesn't have room for that scaffolding.

**Implementation options when V-04d lands:**

- Extend V-04's existing FHIR outbound push pipeline (already pushes to HAPI FHIR) with eWARS DHIS2 + SILANTOR adapters. Auth credentials live in OpenELIS system properties (encrypted at rest).
- Add a Submission Queue UI showing pending / submitted / failed records, with manual retry.
- Replace or supplement §6.6 CSV exporters; they SHOULD remain as a fallback path.

**Design hook in V-04 v1.4:** §6.6 export adapters are isolated from the dashboard layer and from the OHS views — adding API adapters is purely additive (new adapter classes, no view changes, no dashboard changes). The CSV-vs-API choice is configurable per deployment.
