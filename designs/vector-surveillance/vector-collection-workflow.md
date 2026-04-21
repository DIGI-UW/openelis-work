# Vector Collection Workflow (V-02)
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-17
**Status:** Draft for Review
**Jira:** TBD (Epic: OGC-527)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Sample Collection Redesign (4-step workflow), S-02 Sampling Site Registry (OGC-531), V-01 Vector Specimen Types & Taxonomy (OGC-555), S-09 Pre-Analytical Eligibility Gate (OGC-580)

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

V-02 extends the existing OpenELIS Sample Collection Redesign (4-step workflow) with a third sample domain: **Vector**. Alongside the existing Clinical and Environmental / Other domain options, users can now register trap-based collection events — logging trap type, GPS coordinates, collection dates, pool flag, and organism count — through the same familiar 4-step interface. Reception staff can transcribe data from field paper forms; field coordinators can enter directly. Collection lots are then routed through the S-09 Pre-Analytical Eligibility Gate for vector-specific acceptance criteria.

---

## 2. Problem Statement

**Current state:** OpenELIS has no workflow for vector collection events. Field teams using traps (mosquito, tick, rodent) record collection data on paper forms and bring specimens to the lab. Reception staff have no system for entering this data — they either re-use the environmental workflow (incorrectly) or bypass the system entirely until a result is needed.

**Impact:**
- No traceability between trap event and lab test result.
- GPS coordinates, trap type, and organism counts are lost or entered inconsistently.
- Vector lots cannot be routed through the S-09 eligibility gate because there is no structured pre-analytical record.
- V-03 (identification) and V-04 (surveillance reporting) are blocked until collection data is structured.

**Proposed solution:** Add `Vector` as a third domain option in the Sample Collection Redesign workflow toggle. When selected, the form adapts to show vector-specific fields (trap type, GPS, pool flag, organism count, weather conditions) while reusing the Sampling Site lookup from S-02 and the 4-step shell unchanged. The resulting CollectionLot record provides the foundation for V-03 species identification and V-04 surveillance reporting.

---

## 3. User Roles & Permissions

| Role | Access | Notes |
|---|---|---|
| Registration Officer | Create, edit (pre-QC) | Enters basic order info and triggers the 4-step workflow |
| Sample / Specimen Receiver | Create, edit (pre-QC) | Enters collection event details; transcribes field paper forms |
| Field Coordinator | Create, edit (pre-QC) | May enter directly from field notes; same permissions as Sample Receiver |
| QA Officer | View, assess | Runs eligibility assessment in Step 4 (S-09 gate) |
| Lab Analyst | View | Receives lot after eligibility pass for V-03 testing |
| System Administrator | Full | — |

**Required permission keys:**

- `vector.collectionLot.view` — View collection lot list and detail
- `vector.collectionLot.create` — Create a new collection lot (Step 1–3)
- `vector.collectionLot.edit` — Edit a draft or received lot (pre-QC only)
- `vector.collectionLot.delete` — Soft-delete a draft lot
- `vector.eligibility.assess` — Run S-09 gate on a vector lot (Step 4)
- `vector.eligibility.override` — Override a failed eligibility assessment with note

---

## 4. Functional Requirements

### 4.1 Domain Toggle Extension

**FR-V02-TOG-001:** The Sample Category toggle in Step 1 of the Sample Collection Redesign MUST include a third option: **"Vector"**, appearing after "Environmental / Other". The toggle now reads: `Clinical | Environmental / Other | Vector`.

**FR-V02-TOG-002:** When the authenticated lab unit is configured with `sampleDomain = VECTOR` only, the toggle MUST be hidden and the Vector domain pre-selected. When configured for multiple domains, the toggle MUST be shown.

**FR-V02-TOG-003:** Switching domain on the toggle MUST clear all domain-specific form sections (Patient, Sampling Site, Collection Event) and reset section state. Fields shared across domains (Lab Number, Sample, Requester) MUST be preserved.

**FR-V02-TOG-004:** The Vector domain tag MUST render using the `teal` Carbon Tag kind throughout the workflow, consistent with the V-01 vector domain color scheme.

### 4.2 Step 1 — Enter Order (Vector Domain)

**FR-V02-S1-001:** When Vector is selected, the **Patient section** MUST be hidden. The **Sampling Site section** (same component as Environmental / Other, sourced from S-02 SamplingSite registry) MUST be shown.

**FR-V02-S1-002:** When Vector is selected, a **Collection Event section** MUST appear immediately below the Sampling Site section. It MUST contain the following fields:

| Field | Type | Required | Source |
|---|---|---|---|
| Trap Type | ComboBox | Yes | V-01 TrapType catalog (active records only) |
| Collection start date/time | DatePicker + TimeInput | Yes | Manual entry |
| Collection end date/time | DatePicker + TimeInput | No | Manual entry; must be ≥ start if entered |
| Field team / Collector name | TextInput | Yes | Free text |
| GPS — Latitude | NumberInput (decimal) | Yes | Pre-filled from SamplingSite.latitude; overrideable |
| GPS — Longitude | NumberInput (decimal) | Yes | Pre-filled from SamplingSite.longitude; overrideable |
| Pool flag | Toggle | Yes | Default: ON (pooled). When OFF: individual specimen |
| Organism count | NumberInput (integer) | Yes when pool=ON | Min 1; represents total organisms in pool |
| Sample type | Select | Yes | Filtered to VECTOR-domain SampleTypes from V-01 |

**FR-V02-S1-003:** The GPS fields MUST be pre-populated from the selected SamplingSite's stored coordinates. A helper note MUST read: *"Pre-filled from site. Update if trap GPS differs from site centre."* The user MAY override without affecting the parent SamplingSite record.

**FR-V02-S1-004:** When `Pool flag = OFF` (individual specimen), the Organism count field MUST be hidden and its value set to 1 automatically.

**FR-V02-S1-005:** A collapsible **Weather & Conditions** accordion section MUST appear below the required fields in the Collection Event section. It MUST contain: Air temperature (°C), Humidity (%), Weather condition (Select: Clear / Cloudy / Rainy / Post-rain / Overcast), Collection notes (TextArea). All fields are optional.

**FR-V02-S1-006:** The **Sample section** MUST filter its Sample Type dropdown to show only SampleTypes where `sampleDomain = VECTOR`. If no VECTOR-domain sample types exist, a warning MUST appear: *"No vector sample types configured. Contact your administrator."*

**FR-V02-S1-007:** The **Requester / Ordering Provider section** MUST remain visible and function identically to the Environmental workflow — search by organization name.

**FR-V02-S1-008:** On submission of Step 1, the system MUST create a `CollectionLot` record with status `DRAFT` referencing the selected SamplingSite, TrapType, collection dates, GPS coordinates, pool flag, organism count, and linked SampleType. A lab registration number MUST be assigned per the existing lab numbering rules, with module code `VCT`.

### 4.3 Step 2 — Collect Sample (Vector Domain)

**FR-V02-S2-001:** Step 2 for Vector domain MUST display a **Collection Event Summary card** showing the data entered in Step 1 (site name, trap type, GPS, collection dates, pool flag, organism count) in read-only format with an "Edit" link that returns to Step 1.

**FR-V02-S2-002:** Step 2 for Vector domain MUST show a **Receipt Confirmation section** with: Lab receipt date/time (DatePicker + TimeInput, required, defaults to now), Received by (auto-filled with logged-in user, editable), Cooler / container ID (TextInput, optional — links to the sample shipment feature if a shipment ID is entered), Shipment ID (TextInput, optional — links to existing sample shipment record).

**FR-V02-S2-003:** On completing Step 2, the CollectionLot status MUST advance from `DRAFT` to `RECEIVED`. The lab receipt date/time MUST be stored and used by the S-09 transit window auto-compute rule.

**FR-V02-S2-004:** Step 2 MUST display a **Collection Details accordion** allowing the user to review and update GPS coordinates, organism count, collection notes, and weather conditions entered in Step 1. Updates MUST be saved to the CollectionLot record.

### 4.4 Step 3 — Label & Store (Vector Domain)

**FR-V02-S3-001:** Step 3 for Vector domain MUST generate a collection lot barcode label using the assigned lab number. The label MUST include: lab number, site name, trap type, collection date, pool flag indicator, and organism count.

**FR-V02-S3-002:** The existing label print and store workflow MUST apply unchanged to vector lots. Storage location is optional at this stage (specimens may arrive in field containers).

### 4.5 Step 4 — QA Review / Eligibility Gate (Vector Domain)

**FR-V02-S4-001:** Step 4 for Vector domain MUST invoke the **S-09 Pre-Analytical Eligibility Gate** (OGC-580) for the vector CollectionLot. The gate MUST use the acceptance criteria configured for the lot's SampleType (see OGC-580 FRS §4.1).

**FR-V02-S4-002:** The eligibility assessment for vector lots MUST evaluate the vector-specific auto-compute rules: transit_window (collection start → lab receipt), pool_size (organism count ≥ configured minimum from VectorSpecimenProfile), volume_range (if configured).

**FR-V02-S4-003:** On passing the eligibility gate, the CollectionLot status MUST advance from `RECEIVED` to `PROCESSING`. The lot MUST appear in the V-03 identification worklist.

**FR-V02-S4-004:** On failing the eligibility gate with a `recoverable = true` criterion, the Resample NCE action MUST be available per the S-09 design (OGC-580). The officer MAY override with a documented reason per the S-09 override workflow.

---

## 5. Data Model

### Modified Entity: CollectionLot (UI binding — entity defined in V-01 FR-V01-030 to FR-V01-033)

V-02 provides the **create and edit UI** for CollectionLot and VectorSpecimen records. The data model is as defined in V-01 §4.4 and is not re-defined here. V-02 maps the following UI fields to the CollectionLot entity:

| UI Field | CollectionLot Field | Notes |
|---|---|---|
| Sampling Site (ComboBox) | `sampling_site_id` | FK → SamplingSite.id |
| Trap Type (ComboBox) | `trap_type_id` | FK → TrapType.id |
| Collection start date/time | `collection_start` | TIMESTAMP WITH TIME ZONE |
| Collection end date/time | `collection_end` | TIMESTAMP WITH TIME ZONE, nullable |
| GPS Latitude | `gps_lat` | DECIMAL(9,6), overrides site lat |
| GPS Longitude | `gps_lng` | DECIMAL(9,6), overrides site lng |
| Pool flag | `is_pool` | BOOLEAN |
| Organism count | `pool_size` | INTEGER, NULL when is_pool=false |
| Sample type | `sample_type_id` | FK → SampleType where sampleDomain=VECTOR |
| Collector name | `collector_name` | VARCHAR(200) |
| Weather condition | `weather_condition` | ENUM or VARCHAR |
| Air temperature | `weather_temp_c` | DECIMAL(4,1), nullable |
| Humidity | `weather_humidity_pct` | INTEGER, nullable |
| Collection notes | `collection_notes` | TEXT, nullable |
| Cooler / container ID | `container_id` | VARCHAR(100), nullable |
| Shipment ID | `shipment_id` | FK → SampleShipment.id, nullable |
| Lab receipt date/time | `received_at` | TIMESTAMP WITH TIME ZONE |
| Received by | `received_by_user_id` | FK → SystemUser.id |
| Status | `status` | ENUM: DRAFT / RECEIVED / PROCESSING / TESTED / ARCHIVED |
| Lab number | `lab_number` | VARCHAR(50), module code VCT |

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/vector/collectionLots` | List collection lots (filterable by status, site, date range) | `vector.collectionLot.view` |
| GET | `/api/v1/vector/collectionLots/{id}` | Get single lot with full detail | `vector.collectionLot.view` |
| POST | `/api/v1/vector/collectionLots` | Create new lot (Step 1 submit) | `vector.collectionLot.create` |
| PUT | `/api/v1/vector/collectionLots/{id}` | Update lot (Step 2 receipt, Step 3 label) | `vector.collectionLot.edit` |
| PATCH | `/api/v1/vector/collectionLots/{id}/receive` | Advance status DRAFT → RECEIVED with receipt data | `vector.collectionLot.edit` |
| DELETE | `/api/v1/vector/collectionLots/{id}` | Soft-delete a DRAFT lot | `vector.collectionLot.delete` |
| GET | `/api/v1/admin/vector/trapTypes?active=true` | List active trap types for ComboBox | `vector.trapType.view` |
| GET | `/api/v1/sampleTypes?domain=VECTOR&active=true` | List VECTOR-domain sample types | `sampleType.view` |
| POST | `/api/v1/vector/collectionLots/{id}/eligibility` | Run S-09 eligibility assessment on a lot | `vector.eligibility.assess` |

---

## 7. UI Design

See companion mockup: `vector-collection-workflow.jsx`
HTML interactive preview: `vector-collection-workflow.html`

### Navigation Path

Sample Collection → (Step 1: Enter Order) → select "Vector" domain

### Key Screens

1. **Step 1 — Enter Order (Vector active)** — 3-domain toggle with Vector selected; Sampling Site section; Collection Event section (trap type, GPS, pool, count, weather accordion); Sample section filtered to VECTOR types.
2. **Step 2 — Collect Sample (Vector)** — Collection Event Summary card; Receipt Confirmation section (lab receipt date/time, received by, cooler/shipment IDs); updatable Collection Details accordion.
3. **Step 3 — Label & Store (Vector)** — Lot barcode label print; storage location (optional).
4. **Step 4 — QA Review / Eligibility Gate (Vector)** — S-09 eligibility checklist for vector criteria (transit window, pool size); pass/fail outcome; override with note; status → PROCESSING on pass.

### Interaction Patterns

- Domain toggle replaces visible sections without page reload (same pattern as existing Clinical ↔ Environmental toggle)
- GPS fields pre-fill from SamplingSite; inline helper note indicates pre-fill source
- Pool flag toggle shows/hides Organism count field inline (no modal)
- Weather accordion collapses by default; expands on click
- Collection Event Summary in Step 2 uses read-only context card pattern (same as order context card in existing mockup)
- Eligibility gate in Step 4 reuses S-09 Screen 6 (Vector variant) pattern exactly

---

## 8. Business Rules

**BR-V02-001:** A CollectionLot MUST have exactly one SamplingSite. GPS coordinates MAY differ from the site centre (per-trap GPS override is permitted).

**BR-V02-002:** When `is_pool = true`, `pool_size` MUST be ≥ 1. The S-09 pool_size auto-compute rule will compare this against the SampleType's VectorSpecimenProfile minimum.

**BR-V02-003:** A CollectionLot MUST NOT advance to `PROCESSING` unless the S-09 eligibility assessment has been completed (pass OR override-with-note). Unevaluated lots remain in `RECEIVED`.

**BR-V02-004:** The transit window auto-compute rule MUST use `collection_start` (not `collection_end`) as the collection timestamp when computing elapsed time to `received_at`.

**BR-V02-005:** Editing a CollectionLot is permitted only while status is `DRAFT` or `RECEIVED`. Lots in `PROCESSING`, `TESTED`, or `ARCHIVED` status are read-only.

**BR-V02-006:** The lab number format for vector lots MUST use the module code `VCT` in the existing lab number template: `{seq}/{labCode}/VCT/{month}/{year}`.

**BR-V02-007:** Shipment ID linkage is optional. If entered and a matching SampleShipment record exists, the Cooler/Container ID MUST be auto-populated from the shipment record if available.

---

## 9. Localization

All UI strings are externalized. The following i18n keys must be added:

| i18n Key | Default English Text |
|---|---|
| `label.workflow.vector` | Vector |
| `heading.step1.collectionEvent` | Collection Event |
| `label.collectionEvent.trapType` | Trap Type |
| `placeholder.collectionEvent.trapType` | Search trap types… |
| `label.collectionEvent.collectionStart` | Collection start date/time |
| `label.collectionEvent.collectionEnd` | Collection end date/time (optional) |
| `label.collectionEvent.collectorName` | Field team / Collector name |
| `label.collectionEvent.gpsLat` | GPS Latitude |
| `label.collectionEvent.gpsLng` | GPS Longitude |
| `helperText.collectionEvent.gps` | Pre-filled from site. Update if trap GPS differs from site centre. |
| `label.collectionEvent.poolFlag` | Pooled specimen |
| `label.collectionEvent.organismCount` | Organism count |
| `label.collectionEvent.sampleType` | Vector Sample Type |
| `label.collectionEvent.weather` | Weather & Conditions (optional) |
| `label.collectionEvent.weatherTemp` | Air temperature (°C) |
| `label.collectionEvent.weatherHumidity` | Humidity (%) |
| `label.collectionEvent.weatherCondition` | Weather condition |
| `label.collectionEvent.weatherCondition.clear` | Clear |
| `label.collectionEvent.weatherCondition.cloudy` | Cloudy |
| `label.collectionEvent.weatherCondition.rainy` | Rainy |
| `label.collectionEvent.weatherCondition.postRain` | Post-rain |
| `label.collectionEvent.weatherCondition.overcast` | Overcast |
| `label.collectionEvent.notes` | Collection notes |
| `heading.step2.receiptConfirmation` | Receipt Confirmation |
| `label.receipt.receivedAt` | Lab receipt date/time |
| `label.receipt.receivedBy` | Received by |
| `label.receipt.coolerId` | Cooler / Container ID |
| `label.receipt.shipmentId` | Shipment ID |
| `helperText.receipt.shipmentId` | Optional. Links to an existing sample shipment record. |
| `label.collectionLot.status.draft` | Draft |
| `label.collectionLot.status.received` | Received |
| `label.collectionLot.status.processing` | Processing |
| `label.collectionLot.status.tested` | Tested |
| `label.collectionLot.status.archived` | Archived |
| `message.collectionLot.noVectorSampleTypes` | No vector sample types configured. Contact your administrator. |
| `message.collectionLot.gpsPreFilled` | Pre-filled from site. Update if trap GPS differs from site centre. |
| `button.collectionLot.saveStep1` | Continue to Collect |
| `button.collectionLot.saveStep2` | Continue to Label |
| `error.collectionEvent.trapTypeRequired` | Trap type is required. |
| `error.collectionEvent.collectionStartRequired` | Collection start date/time is required. |
| `error.collectionEvent.collectorRequired` | Field team / Collector name is required. |
| `error.collectionEvent.gpsLatInvalid` | Latitude must be between -90 and 90. |
| `error.collectionEvent.gpsLngInvalid` | Longitude must be between -180 and 180. |
| `error.collectionEvent.organismCountRequired` | Organism count is required for pooled specimens. |
| `error.collectionEvent.organismCountMin` | Organism count must be at least 1. |
| `error.receipt.receivedAtRequired` | Lab receipt date/time is required. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Trap Type | Required | `error.collectionEvent.trapTypeRequired` |
| Collection start | Required; must be in past | `error.collectionEvent.collectionStartRequired` |
| Collection end | Optional; if provided, must be ≥ collection start | `error.collectionEvent.collectionEndBeforeStart` |
| GPS Latitude | Required; decimal −90 to 90 | `error.collectionEvent.gpsLatInvalid` |
| GPS Longitude | Required; decimal −180 to 180 | `error.collectionEvent.gpsLngInvalid` |
| Organism count | Required when pool=true; integer ≥ 1 | `error.collectionEvent.organismCountRequired` |
| Lab receipt date/time | Required on Step 2; must be ≥ collection start | `error.receipt.receivedAtRequired` |
| Shipment ID | Optional; if provided and not found, warn (non-blocking) | `message.receipt.shipmentNotFound` |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View collection lot list | `vector.collectionLot.view` | Menu item hidden |
| Create new lot (Steps 1–3) | `vector.collectionLot.create` | "New Collection" button hidden |
| Edit lot (pre-QC) | `vector.collectionLot.edit` | Edit link hidden; API returns 403 |
| Delete draft lot | `vector.collectionLot.delete` | Delete button hidden |
| Run eligibility assessment | `vector.eligibility.assess` | Step 4 disabled; API returns 403 |
| Override failed assessment | `vector.eligibility.override` | Override button hidden; API returns 403 |

---

## 12. Acceptance Criteria

### Functional

- [ ] The Step 1 Sample Category toggle shows three options: Clinical, Environmental / Other, Vector
- [ ] Selecting Vector hides the Patient section and shows the Sampling Site section and Collection Event section
- [ ] The Trap Type ComboBox is populated from the V-01 TrapType catalog (active records only)
- [ ] GPS fields are pre-filled from the selected SamplingSite and display a helper note indicating the source
- [ ] When Pool flag is toggled OFF, Organism count field is hidden and value is set to 1
- [ ] The Sample Type dropdown in the Sample section shows only VECTOR-domain sample types
- [ ] Completing Step 1 creates a CollectionLot with status DRAFT and assigns a lab number with module code VCT
- [ ] Step 2 displays the Collection Event Summary and a Receipt Confirmation section
- [ ] Completing Step 2 advances CollectionLot status from DRAFT to RECEIVED and stores the lab receipt date/time
- [ ] The lab receipt date/time is used by the S-09 transit window auto-compute rule in Step 4
- [ ] Step 4 invokes the S-09 eligibility gate using vector-specific criteria for the lot's SampleType
- [ ] Passing the eligibility gate advances status to PROCESSING and the lot appears in the V-03 worklist
- [ ] A failed recoverable criterion shows the Resample NCE action per S-09 (OGC-580)
- [ ] Override with note is available to users with `vector.eligibility.override` permission
- [ ] Editing a lot in PROCESSING, TESTED, or ARCHIVED status is blocked (read-only)

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English in JSX
- [ ] Page transitions between steps complete within 1 second
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized requests)
- [ ] Feature renders correctly at 1280px viewport width
- [ ] GPS coordinate validation is applied client-side before form submission

### Integration

- [ ] TrapType ComboBox data sourced from `/api/v1/admin/vector/trapTypes?active=true` (V-01)
- [ ] Sample Type dropdown filtered via `/api/v1/sampleTypes?domain=VECTOR&active=true` (V-01)
- [ ] Sampling Site lookup uses existing S-02 SamplingSite API
- [ ] S-09 eligibility gate API invoked at Step 4 (`POST /api/v1/vector/collectionLots/{id}/eligibility`)
- [ ] Shipment ID lookup queries the existing sample shipment feature if a value is entered
- [ ] Lab number assigned using existing lab numbering service with module code VCT
