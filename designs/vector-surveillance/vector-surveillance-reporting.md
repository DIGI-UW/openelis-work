# Vector Surveillance Reporting
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-20
**Status:** Draft for Review
**Jira:** TBD (Epic: [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React, Apache Superset, HAPI FHIR, Google Open Health Stack (SQL-on-FHIR)
**Related Modules:** Vector Collection Workflow (V-02, OGC-581), Vector Testing & Identification (V-03, OGC-583), Vector Specimen Types & Taxonomy (V-01, OGC-555), FHIR Outbound Push (existing)

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
17. Future Scope (V-04b)

---

## 1. Executive Summary

V-04 delivers vector surveillance analytics to OpenELIS operators without requiring a custom React charting module. An Apache Superset instance — fed by a HAPI FHIR server and Google Open Health Stack SQL-on-FHIR views — is embedded directly inside the OpenELIS Reports section via a guest-token-authenticated iframe. Coordinators see live trap catch rates, species distributions, pathogen positivity trends, and Minimum Infection Rate (MIR) calculations without leaving OpenELIS. A formal PDF surveillance report can be exported from Superset in one click. Threshold-based email alerts are configured in Superset admin.

---

## 2. Problem Statement

**Current state:** Vector surveillance data collected through V-02 (CollectionLot) and V-03 (VectorSpecimenIdentification, pathogen results) is stored in OpenELIS but has no analytical surface. Coordinators must export raw data and process it externally — typically in Excel — to produce trap catch rates, species-level summaries, or MIR figures required by health authority reporting.

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
│    vector_collection_lots    vector_specimen_ids                      │
│    vector_pathogen_results   vector_mir_weekly                        │
│    vector_trap_catch_daily                                            │
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

**FR-V04-FHIR-001:** The existing OpenELIS FHIR outbound push pipeline MUST be extended to push `Specimen` resources for each `CollectionLot` created in V-02.

**FR-V04-FHIR-002:** Each `VectorSpecimenIdentification` record (V-03) MUST generate a FHIR `Observation` resource with code = LOINC `81255-2` (organism identified) and component observations for species, method, and confidence.

**FR-V04-FHIR-003:** Each pathogen test result linked to a V-03 lot (pooled or deconvoluted) MUST be pushed as a FHIR `DiagnosticReport` referencing the parent `Specimen`.

**FR-V04-FHIR-004:** `DeconvolutionTask` outcomes (V-03) MUST be pushed as FHIR `Task` resources with `Task.output` containing positive child count and deconvolution outcome percentage.

**FR-V04-FHIR-005:** FHIR push failures MUST be logged to the existing OpenELIS outbound FHIR error log and MUST NOT block the primary OpenELIS workflow.

### 6.3 OHS Flattened Views

**FR-V04-OHS-001:** The OHS ETL job MUST produce the following Postgres views in the `vector_analytics` schema (see §8 for full schemas):
- `vector_collection_lots` — one row per CollectionLot
- `vector_specimen_ids` — one row per VectorSpecimenIdentification
- `vector_pathogen_results` — one row per pathogen test result
- `vector_mir_weekly` — pre-aggregated MIR by species × panel × ISO week
- `vector_trap_catch_daily` — pre-aggregated specimens/trap-night by site × day

**FR-V04-OHS-002:** Views MUST be refreshed atomically (CREATE OR REPLACE VIEW or materialised view refresh) to prevent partial reads by Superset during ETL.

**FR-V04-OHS-003:** Each view MUST include a `site_id`, `site_name`, and `collection_date` column to support Superset row-level security filtering.

### 6.4 Superset Dashboards

**FR-V04-DASH-001:** A single Superset dashboard named **"Vector Surveillance Overview"** MUST be pre-configured containing the six charts defined in §9.

**FR-V04-DASH-002:** The dashboard MUST support native Superset date-range and site filter cross-filtering so that selecting a date range or site in any chart updates all other charts on the dashboard.

**FR-V04-DASH-003:** Each chart MUST have a title, axis labels, and tooltip text in English by default. Superset's multi-language support MAY be configured separately.

**FR-V04-DASH-004:** The dashboard MUST be exportable as PDF via Superset's native export function (requires Superset `ENABLE_SCHEDULED_EMAIL_REPORTS = True` and a headless browser — see §10.3).

**FR-V04-DASH-005:** Superset alert rules MUST be configurable in the Superset admin UI for any metric in the `vector_mir_weekly` and `vector_trap_catch_daily` views. Alert delivery is via email (SMTP configured in `superset_config.py`).

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

---

## 7. FHIR Resource Mapping

### 7.1 CollectionLot → FHIR Specimen

| CollectionLot field | FHIR Specimen path | Notes |
|---|---|---|
| `id` | `Specimen.identifier[0].value` | System: `https://openelis-global.org/lot` |
| `lotCode` | `Specimen.identifier[1].value` | Display label |
| `samplingSite.id` | `Specimen.collection.collector` | Reference to Location |
| `collectionDate` | `Specimen.collection.collectedDateTime` | ISO 8601 |
| `trapType.code` | `Specimen.type.coding[0].code` | System: `https://openelis-global.org/trap-type` |
| `specimenCount` | `Specimen.note[0].text` | `"specimenCount:{n}"` |
| `poolFlag` | `Specimen.note[1].text` | `"poolFlag:true|false"` |
| `identificationStatus` | `Specimen.status` | `available` = COMPLETE, `unavailable` = NOT_STARTED, `unsatisfactory` = IN_PROGRESS |
| `group` (organism group) | `Specimen.type.coding[1].code` | System: `https://openelis-global.org/organism-group` |

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
| `lot.id` | `DiagnosticReport.specimen[0]` | Reference to Specimen (lot) |
| `panel.loincCode` | `DiagnosticReport.code.coding[0]` | Panel LOINC |
| `result.value` | `DiagnosticReport.conclusion` | Positive / Negative / Indeterminate |
| `result.resultDate` | `DiagnosticReport.effectiveDateTime` | — |
| `isPoolPositive` | `DiagnosticReport.extension[poolPositive]` | Custom extension URL |

### 7.4 DeconvolutionTask → FHIR Task

| DeconvolutionTask field | FHIR Task path | Notes |
|---|---|---|
| `id` | `Task.identifier[0].value` | — |
| `parentLot.id` | `Task.focus` | Reference to parent Specimen |
| `strategy` | `Task.input[0].valueCode` | INDIVIDUAL / SUB_POOL |
| `childCount` | `Task.input[1].valueInteger` | — |
| `positiveCount` | `Task.output[0].valueInteger` | — |
| `deconvolutionOutcomePct` | `Task.output[1].valueDecimal` | Percent positive |
| `status` | `Task.status` | IN_PROGRESS / COMPLETE |

---

## 8. OHS SQL-on-FHIR View Schemas

All views live in the `vector_analytics` Postgres schema. The OHS `sql-on-fhir` engine generates these by running SQL projections against the HAPI FHIR Postgres tables.

### 8.1 `vector_collection_lots`

```sql
CREATE OR REPLACE VIEW vector_analytics.vector_collection_lots AS
SELECT
    s.id                              AS lot_fhir_id,
    s.lot_code                        AS lot_code,
    s.site_id                         AS site_id,
    s.site_name                       AS site_name,
    s.collection_date::date           AS collection_date,
    EXTRACT(ISOYEAR FROM s.collection_date::date)  AS iso_year,
    EXTRACT(WEEK   FROM s.collection_date::date)  AS iso_week,
    s.trap_type_code                  AS trap_type_code,
    s.trap_type_name                  AS trap_type_name,
    s.organism_group                  AS organism_group,
    s.specimen_count::int             AS specimen_count,
    s.pool_flag::boolean              AS pool_flag,
    s.identification_status           AS identification_status
FROM ohs_specimen_flat s
WHERE s.system = 'https://openelis-global.org/lot';
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
    dr.specimen_ref                   AS lot_fhir_id,
    dr.panel_loinc                    AS panel_loinc,
    dr.panel_name                     AS panel_name,
    dr.conclusion                     AS result_value,
    (dr.conclusion = 'Positive')::boolean AS is_positive,
    dr.effective_date::date           AS result_date,
    s.site_id                         AS site_id,
    s.site_name                       AS site_name,
    s.organism_group                  AS organism_group,
    s.specimen_count::int             AS pool_size,
    EXTRACT(ISOYEAR FROM dr.effective_date::date) AS iso_year,
    EXTRACT(WEEK   FROM dr.effective_date::date) AS iso_week
FROM ohs_diagnosticreport_flat dr
JOIN ohs_specimen_flat s ON s.id = dr.specimen_ref;
```

### 8.4 `vector_mir_weekly` (pre-aggregated)

MIR = (positive pools / total specimens tested) × 1000

```sql
CREATE OR REPLACE VIEW vector_analytics.vector_mir_weekly AS
SELECT
    pr.site_id,
    pr.site_name,
    pr.organism_group,
    pr.panel_loinc,
    pr.panel_name,
    pr.iso_year,
    pr.iso_week,
    COUNT(*)                          AS pools_tested,
    SUM(pr.is_positive::int)          AS positive_pools,
    SUM(pr.pool_size)                 AS total_specimens,
    ROUND(
        (SUM(pr.is_positive::int)::numeric / NULLIF(SUM(pr.pool_size), 0)) * 1000,
        2
    )                                 AS mir
FROM vector_analytics.vector_pathogen_results pr
GROUP BY pr.site_id, pr.site_name, pr.organism_group,
         pr.panel_loinc, pr.panel_name, pr.iso_year, pr.iso_week;
```

### 8.5 `vector_trap_catch_daily` (pre-aggregated)

Trap catch rate = total specimens / number of trap-nights

```sql
CREATE OR REPLACE VIEW vector_analytics.vector_trap_catch_daily AS
SELECT
    cl.site_id,
    cl.site_name,
    cl.organism_group,
    cl.trap_type_code,
    cl.trap_type_name,
    cl.collection_date,
    cl.iso_year,
    cl.iso_week,
    COUNT(*)                          AS trap_nights,
    SUM(cl.specimen_count)            AS total_specimens,
    ROUND(
        SUM(cl.specimen_count)::numeric / NULLIF(COUNT(*), 0),
        2
    )                                 AS catch_rate
FROM vector_analytics.vector_collection_lots cl
GROUP BY cl.site_id, cl.site_name, cl.organism_group,
         cl.trap_type_code, cl.trap_type_name,
         cl.collection_date, cl.iso_year, cl.iso_week;
```

---

## 9. Superset Dashboard Inventory

All six charts are assembled into the **"Vector Surveillance Overview"** dashboard (UUID configured at deploy time).

| # | Chart name | Type | Source view | X axis | Y axis / Metric | Notes |
|---|---|---|---|---|---|---|
| 1 | **Trap Catch Rate — Trend** | Line chart | `vector_trap_catch_daily` | `collection_date` (weekly aggregate) | `catch_rate` (avg) | Grouped by `site_name`; threshold reference line configurable |
| 2 | **Species Distribution** | Pie / Donut | `vector_specimen_ids` | — | COUNT per `species_name` | Filterable by site, date range, `confidence = CONFIRMED` |
| 3 | **Pathogen Positivity Rate** | Bar chart | `vector_pathogen_results` | `iso_week` | `is_positive` (% of rows) | Grouped by `panel_name`; stacked by site |
| 4 | **MIR by Species × Panel** | Heatmap | `vector_mir_weekly` | `iso_week` | `mir` | Rows = `species_name`; color = MIR quartile |
| 5 | **Site Comparison — Catch Rate** | Bar chart | `vector_trap_catch_daily` | `site_name` | `catch_rate` (period avg) | Horizontal bars; color by `organism_group` |
| 6 | **KPI Summary Tiles** | Big Number | All views | — | Total lots · Total specimens · Active sites · Highest MIR this week | 4-tile header row on dashboard |

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

**BR-V04-001:** MIR MUST be calculated as `(positive_pools / total_specimens_in_pools) × 1000`. Only pools with a `CONFIRMED` test result status MUST be counted as positive. Inconclusive results MUST be excluded from MIR numerator and denominator.

**BR-V04-002:** Only `VectorSpecimenIdentification` records with `confidence = CONFIRMED` MUST contribute to species distribution charts (per BR-V03-010).

**BR-V04-003:** Trap catch rate MUST be expressed as specimens per trap-night. One trap deployed for one collection date = one trap-night.

**BR-V04-004:** Guest tokens MUST expire after 300 seconds (5 minutes). The OpenELIS frontend MUST silently refresh the token on expiry by calling the backend endpoint again. Refreshes MUST NOT cause a visible iframe reload.

**BR-V04-005:** FHIR push failures MUST NOT block the primary V-02/V-03 workflow. If FHIR push fails, OpenELIS MUST log the failure and queue the resource for retry on the next push cycle. Dashboard data may lag by up to one push cycle.

**BR-V04-006:** The OHS ETL job MUST complete within 5 minutes for datasets up to 500,000 FHIR resources. If the ETL job exceeds 10 minutes, it MUST be terminated and an error logged.

**BR-V04-007:** The `vector_analytics` schema views MUST be refreshed atomically. No Superset query MUST see a partial state during ETL refresh.

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
| FHIR Specimen push | `collectionDate` required | Blocked at V-02 CollectionLot save |

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

- [ ] Creating a CollectionLot in V-02 generates a FHIR `Specimen` resource in HAPI FHIR within one push cycle
- [ ] Saving a VectorSpecimenIdentification in V-03 generates a FHIR `Observation` (LOINC 81255-2)
- [ ] A positive pool result generates a FHIR `DiagnosticReport` referencing the parent Specimen
- [ ] FHIR push failure is logged and does not block the V-02/V-03 UI workflow

### OHS Views

- [ ] `vector_trap_catch_daily` produces correct `catch_rate` (specimens / trap-nights per site per day)
- [ ] `vector_mir_weekly` MIR formula: `(positive_pools / total_specimens) × 1000`, rounded to 2 dp
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

## 17. Future Scope — V-04b: In-App Outbreak Alerts

A separate Jira story (V-04b) will add in-app alert integration:

**Scope:**
- A Spring `@Scheduled` background job polls `vector_mir_weekly` and `vector_trap_catch_daily` every 15 minutes
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
