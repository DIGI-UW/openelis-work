# Disease Surveillance Dashboard — FHIR Publication Requirements
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-23
**Status:** Draft for Review
**Jira:** [To be created — OELIS-DASH-001]
**Technology:** Java Spring Framework, Carbon React, FHIR R4 (HAPI FHIR)
**Related Modules:** Analyzer Integration, Results Entry, Admin Configuration

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. User Roles & Permissions
4. Functional Requirements
5. Data Model
6. API Endpoints
7. UI Design
8. Business Rules
9. Localization
10. Validation Rules
11. Security & Permissions
12. Acceptance Criteria

---

## 1. Executive Summary

This feature defines the FHIR R4 publication requirements OpenELIS must satisfy to enable a standalone Apache Superset instance to compute TB/HIV disease intelligence dashboards for national program managers. OpenELIS is the authoritative source of lab result data; all dashboards consume the central FHIR lab data repository populated by OpenELIS. The feature covers three OpenELIS deliverables: (1) FHIR resource completeness for the four required metric domains, (2) an admin configuration page for FHIR publication settings and the Superset URL, and (3) a "Dashboards" navigation entry in the OpenELIS side navigation that opens the Superset instance.

---

## 2. Problem Statement

**Current state:** Aspect/GxAlert provides national program managers with disease intelligence dashboards (test positivity, volume, TAT, equipment utilization, geographic breakdown) by consuming GeneXpert device data directly. With Aspect fully decommissioned, this visibility is lost unless OpenELIS publishes equivalent structured data.

**Impact:** Without these dashboards, national TB/HIV program managers cannot monitor test positivity trends, identify sites with high error rates, or report to ministry. Clinical decision-making and supply forecasting are degraded.

**Proposed solution:** OpenELIS publishes complete, correctly structured FHIR R4 resources to its central FHIR lab data repository. An external Apache Superset instance connects directly to this repository via FHIR search endpoints to compute and display program metrics. OpenELIS provides an admin config page to manage publication settings and a nav link so users can access dashboards without leaving the OpenELIS context. A FHIR R4 push to the ministry's external DHIS2 instance is also triggered from the same repo.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Lab Technician | None (this feature) | No access to FHIR config or Dashboard nav entry |
| Lab Manager | View only | Can access Dashboards nav link to Superset; cannot modify FHIR config |
| Program Manager | View only | Primary consumer — accesses Superset via nav link |
| System Administrator | Full | Can configure FHIR publication settings, Superset URL, DHIS2 push endpoint |

**Required permission keys:**

- `fhir.publication.view` — View FHIR publication configuration page
- `fhir.publication.modify` — Edit publication settings, Superset URL, DHIS2 push target
- `dashboard.navigate` — See and access the Dashboards nav link in the side navigation

---

## 4. Functional Requirements

### 4.1 FHIR Resource Completeness — DiagnosticReport

**FR-1-001:** For every completed test result, OpenELIS MUST publish a FHIR R4 `DiagnosticReport` resource to the central FHIR repo containing the following fields:
- `id` — unique OpenELIS result identifier
- `status` — `final` for validated results; `registered` for pending
- `code` — LOINC code for the test (e.g., 67562-1 for MTB/RIF GeneXpert)
- `subject` — reference to `Patient` resource
- `performer` — reference to `Organization` resource representing the reporting facility
- `issued` — datetime the result was validated and published (ISO 8601)
- `result` — array of references to associated `Observation` resources
- `extension[device]` — reference to the `Device` (analyzer) that produced the result

**FR-1-002:** For TAT calculation, OpenELIS MUST include a reference to the originating `ServiceRequest` in `DiagnosticReport.basedOn`.

**FR-1-003:** `DiagnosticReport.category` MUST include a code identifying the disease program: `TB` or `HIV` using the OpenELIS program code system (`http://openelis-global.org/fhir/CodeSystem/program`).

### 4.2 FHIR Resource Completeness — Observation

**FR-2-001:** Each `Observation` linked from a `DiagnosticReport` MUST include:
- `status` — `final`
- `code` — LOINC test component code
- `valueCodeableConcept` or `valueQuantity` — the result value
- `interpretation` — MUST use `http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation` with values: `POS` (positive/detected), `NEG` (negative/not detected), `IND` (indeterminate/invalid)
- `issued` — result datetime

**FR-2-002:** For GeneXpert MTB/RIF results, `Observation.component` MUST include a rifampicin resistance sub-observation with `valueCodeableConcept` of `detected`, `not-detected`, or `indeterminate`.

### 4.3 FHIR Resource Completeness — ServiceRequest (for TAT)

**FR-3-001:** Every test order MUST publish a `ServiceRequest` with:
- `authoredOn` — datetime the order was created (used as TAT start)
- `requester` — reference to requesting `Organization` or `Practitioner`
- `performer` — reference to performing `Organization`
- `code` — same LOINC code as the resulting `DiagnosticReport`
- `status` — `active` | `completed` | `revoked`

### 4.4 FHIR Resource Completeness — Device (for Equipment Utilization)

**FR-4-001:** Each GeneXpert analyzer MUST be registered as a FHIR `Device` resource with:
- `identifier` — the GeneXpert serial number
- `deviceName` — display name (e.g., "GeneXpert IV — Site A")
- `type` — coded type: `GeneXpert` using OpenELIS device type code system
- `location` — reference to the `Location` (facility) where the device is installed
- `extension[moduleCount]` — integer count of modules on the device
- `status` — `active` | `inactive` | `entered-in-error`

**FR-4-002:** When a GeneXpert result has an error or invalid status, the `DiagnosticReport.status` MUST be set to `partial` or `entered-in-error` respectively, allowing Superset to compute error rates per device.

### 4.5 FHIR Resource Completeness — Organization Hierarchy (for Geography)

**FR-5-001:** Every facility MUST be registered as a FHIR `Organization` with:
- `identifier` — national facility identifier (e.g., DHIS2 org unit UID if available)
- `name` — facility display name
- `type` — `prov` (provider/facility)
- `partOf` — reference to parent `Organization` (district)

**FR-5-002:** District `Organization` resources MUST reference their parent regional `Organization`, and regions MUST reference the national `Organization`, creating a navigable 4-level hierarchy: National → Region → District → Facility.

**FR-5-003:** OpenELIS MUST expose a FHIR `$hierarchy` operation or equivalent search that Superset can use to resolve the full facility tree for geographic filtering.

### 4.6 Admin Configuration — FHIR Publication Settings

**FR-6-001:** A new admin page "FHIR Publication Settings" MUST allow a System Administrator to configure:
- FHIR endpoint URL for the central FHIR lab data repository
- Authentication type: Bearer token | Basic auth | None
- Credential fields (conditionally shown based on auth type)
- Publication toggle per resource type: DiagnosticReport, Observation, ServiceRequest, Device, Organization
- Retry policy: number of retries on failed publish, retry interval (minutes)
- Publication mode: synchronous (on result validation) | asynchronous (batch, configurable interval)

**FR-6-002:** The admin page MUST display a "Last publication status" row per resource type showing: last published timestamp, count of records published in last 24 hours, and any error count with inline error message.

**FR-6-003:** A "Test Connection" button MUST send a FHIR `CapabilityStatement` request to the configured endpoint and display success or failure with HTTP status code.

### 4.7 Admin Configuration — Superset & DHIS2 URLs

**FR-7-001:** The admin page MUST include a "Dashboard Links" section where an administrator can configure:
- Superset base URL (used to construct the Dashboards nav link)
- DHIS2 FHIR push endpoint URL and credentials

**FR-7-002:** The Superset URL MUST be validated as a well-formed HTTPS URL before saving.

### 4.8 Navigation — Dashboards Menu Entry

**FR-8-001:** When a user with `dashboard.navigate` permission is logged in, a "Dashboards" entry MUST appear in the OpenELIS side navigation under the "Reports" section.

**FR-8-002:** Clicking "Dashboards" MUST open the configured Superset URL in a new browser tab.

**FR-8-003:** If the Superset URL is not configured, the "Dashboards" menu item MUST be hidden for all users including administrators.

---

## 5. Data Model

### New Entities

**FhirPublicationConfig**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| fhirEndpointUrl | String(512) | Yes | Central FHIR repo URL |
| authType | Enum | Yes | NONE, BEARER_TOKEN, BASIC |
| authCredential | String(1024) | No | Encrypted at rest |
| publicationMode | Enum | Yes | SYNCHRONOUS, ASYNC_BATCH |
| batchIntervalMinutes | Integer | No | Required if ASYNC_BATCH |
| retryCount | Integer | Yes | Default 3 |
| retryIntervalMinutes | Integer | Yes | Default 5 |
| supersetUrl | String(512) | No | For nav link |
| dhis2FhirEndpointUrl | String(512) | No | DHIS2 push target |
| dhis2AuthCredential | String(1024) | No | Encrypted at rest |
| lastModifiedBy | String | Yes | User who last saved |
| lastModifiedAt | Timestamp | Yes | Auto-populated |

**FhirPublicationResourceToggle**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| configId | Long | Yes | FK → FhirPublicationConfig |
| resourceType | Enum | Yes | DIAGNOSTIC_REPORT, OBSERVATION, SERVICE_REQUEST, DEVICE, ORGANIZATION |
| enabled | Boolean | Yes | Default true |
| lastPublishedAt | Timestamp | No | Updated after each publish |
| last24hCount | Integer | No | Rolling 24h publish count |
| last24hErrorCount | Integer | No | Rolling 24h error count |
| lastErrorMessage | String(2048) | No | Most recent error detail |

### Modified Entities

**Result** — Add fields:

| Field | Type | Notes |
|---|---|---|
| fhirDiagnosticReportId | String(64) | FHIR resource ID after successful publish |
| fhirPublishedAt | Timestamp | Datetime of last successful publish |
| fhirPublishStatus | Enum | PENDING, PUBLISHED, ERROR, SKIPPED |

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/admin/fhir-publication/config` | Get current FHIR publication config | `fhir.publication.view` |
| PUT | `/api/v1/admin/fhir-publication/config` | Save FHIR publication config | `fhir.publication.modify` |
| POST | `/api/v1/admin/fhir-publication/test-connection` | Test FHIR endpoint connectivity | `fhir.publication.modify` |
| GET | `/api/v1/admin/fhir-publication/status` | Get per-resource publication status | `fhir.publication.view` |
| POST | `/api/v1/admin/fhir-publication/publish-now` | Trigger immediate batch publish | `fhir.publication.modify` |

---

## 7. UI Design

See companion React mockup: `disease-surveillance-dashboard-mockup.jsx`

### Navigation Path

Admin → Integration → FHIR Publication Settings

### Key Screens

1. **FHIR Publication Settings** — Connection config, auth, resource toggles, publication status table, Test Connection button
2. **Dashboard Links section** — Superset URL field, DHIS2 push URL field
3. **Dashboards nav entry** — Side nav item under Reports, visible to users with `dashboard.navigate`

### Interaction Patterns

- **Inline row expansion** for each resource type's status detail
- **Accordion** for "Advanced: Retry Policy" section (not primary workflow)
- **InlineNotification** for connection test result (success/failure)
- No modals — all config on a single scrollable page

---

## 8. Business Rules

**BR-001:** Credentials (Bearer token, Basic auth password) MUST be encrypted at rest using the OpenELIS encryption service. They MUST NOT be returned in GET responses — placeholder text ("••••••••") is shown instead.

**BR-002:** Publication MUST occur only for results with status `final` (validated). Draft, pending, and corrected results MUST NOT be published until validation is complete.

**BR-003:** If a publish fails after the configured retry count, the result's `fhirPublishStatus` MUST be set to `ERROR` and an entry added to the OpenELIS audit log. Failed records MUST be retried on the next scheduled batch run.

**BR-004:** Disabling a resource type toggle does not retroactively delete already-published FHIR resources from the central repo. It only stops future publication.

**BR-005:** The Organization hierarchy (National → Region → District → Facility) MUST be synchronized to the FHIR repo whenever a facility is created or modified in OpenELIS Admin.

**BR-006:** Device resources MUST be synchronized to the FHIR repo whenever an analyzer is added or modified in the OpenELIS Analyzer Configuration.

---

## 9. Localization

| i18n Key | Default English Text |
|---|---|
| `heading.fhirPublication.title` | FHIR Publication Settings |
| `heading.fhirPublication.connection` | FHIR Repository Connection |
| `heading.fhirPublication.resources` | Resource Publication |
| `heading.fhirPublication.dashboardLinks` | Dashboard Links |
| `heading.fhirPublication.retryPolicy` | Advanced: Retry Policy |
| `label.fhirPublication.endpointUrl` | FHIR Repository URL |
| `label.fhirPublication.authType` | Authentication Type |
| `label.fhirPublication.authType.none` | None |
| `label.fhirPublication.authType.bearer` | Bearer Token |
| `label.fhirPublication.authType.basic` | Basic Auth |
| `label.fhirPublication.credential` | Credential |
| `label.fhirPublication.publicationMode` | Publication Mode |
| `label.fhirPublication.publicationMode.sync` | Synchronous (on result validation) |
| `label.fhirPublication.publicationMode.batch` | Batch (scheduled interval) |
| `label.fhirPublication.batchInterval` | Batch Interval (minutes) |
| `label.fhirPublication.supersetUrl` | Superset Dashboard URL |
| `label.fhirPublication.dhis2Url` | DHIS2 FHIR Push URL |
| `label.fhirPublication.resourceType` | Resource Type |
| `label.fhirPublication.enabled` | Publish |
| `label.fhirPublication.lastPublished` | Last Published |
| `label.fhirPublication.last24hCount` | Records (24h) |
| `label.fhirPublication.last24hErrors` | Errors (24h) |
| `button.fhirPublication.save` | Save Settings |
| `button.fhirPublication.testConnection` | Test Connection |
| `button.fhirPublication.publishNow` | Publish Now |
| `message.fhirPublication.saveSuccess` | FHIR publication settings saved. |
| `message.fhirPublication.connectionSuccess` | Connection successful. FHIR R4 endpoint is reachable. |
| `message.fhirPublication.publishStarted` | Batch publish started. Results will appear in the status table. |
| `error.fhirPublication.connectionFailed` | Connection failed: {statusCode} — {message} |
| `error.fhirPublication.invalidUrl` | Please enter a valid HTTPS URL. |
| `error.fhirPublication.required` | This field is required. |
| `nav.dashboards` | Dashboards |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| fhirEndpointUrl | Required, must be valid HTTPS URL | `error.fhirPublication.required`, `error.fhirPublication.invalidUrl` |
| supersetUrl | If provided, must be valid HTTPS URL | `error.fhirPublication.invalidUrl` |
| dhis2FhirEndpointUrl | If provided, must be valid HTTPS URL | `error.fhirPublication.invalidUrl` |
| batchIntervalMinutes | Required if mode = ASYNC_BATCH; min 1, max 1440 | `error.fhirPublication.required` |
| retryCount | Min 0, max 10 | — |
| retryIntervalMinutes | Min 1, max 60 | — |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View FHIR config page | `fhir.publication.view` | Page not shown in Admin menu |
| Save settings | `fhir.publication.modify` | Save/Test buttons hidden; API returns 403 |
| Trigger manual publish | `fhir.publication.modify` | Publish Now button hidden; API returns 403 |
| Access Dashboards nav link | `dashboard.navigate` | Nav entry hidden |

---

## 12. Acceptance Criteria

### Functional

- [ ] Admin with `fhir.publication.modify` can configure FHIR endpoint URL, auth type, and credentials and save successfully
- [ ] "Test Connection" button sends a FHIR CapabilityStatement request and displays success or failure inline
- [ ] Resource type toggles enable/disable publication per resource type independently
- [ ] Publication status table shows last published timestamp, 24h record count, and error count per resource type
- [ ] A validated TB or HIV result is published as a complete `DiagnosticReport` to the FHIR repo within the configured publication window
- [ ] `DiagnosticReport` includes `performer` (Organization), `issued` (datetime), `basedOn` (ServiceRequest), and `result` (Observation) references
- [ ] `Observation.interpretation` correctly encodes POS/NEG/IND for TB and HIV results
- [ ] GeneXpert device is registered as a FHIR `Device` with serial number, location, and module count
- [ ] Organization hierarchy (4 levels) is navigable via FHIR search from the published data
- [ ] Dashboards nav link appears for users with `dashboard.navigate` and opens the configured Superset URL in a new tab
- [ ] Dashboards nav link is hidden if Superset URL is not configured

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Auth credentials are encrypted at rest and not returned in API GET responses
- [ ] Synchronous publication adds ≤500ms overhead to the result validation API call
- [ ] Permissions enforced at API layer (HTTP 403 for unauthorized)

### Integration

- [ ] Superset instance can execute a FHIR search on `DiagnosticReport?category=TB&_include=DiagnosticReport:performer` and receive complete results
- [ ] TAT is calculable from `ServiceRequest.authoredOn` to `DiagnosticReport.issued` without additional OpenELIS API calls
- [ ] DHIS2 push endpoint receives FHIR bundle on each batch run when configured
