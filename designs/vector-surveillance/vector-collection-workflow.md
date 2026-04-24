# Vector Collection Workflow (V-02)
## Functional Requirements Specification — v2.0

**Version:** 2.0
**Date:** 2026-04-23
**Status:** Draft for Review
**Jira:** [OGC-581](https://uwdigi.atlassian.net/browse/OGC-581) (Epic: OGC-527)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Sample Collection Redesign (4-step workflow), V-01 Vector Specimen Types & Taxonomy (OGC-555), S-02 Sampling Site Registry (OGC-531)

### Change Log

- **v2.0 (2026-04-23):** Major simplification. Order entry reduced to organism group (= sample type), quantity, and test selection. Step 2 (Collect Sample) removed entirely — workflow goes directly from Step 1 to label/store/refer. QA screen simplified: QA samples can be added as needed; S-09 transit window and pool_size eligibility criteria removed (no longer captured). Trap type, GPS, collection dates, pool flag, weather conditions, cooler ID, and shipment ID all removed from the data model and UI. Sampling site retained as optional context field.
- **v1.0 (2026-04-17):** Initial draft.

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

V-02 adds **Vector** as a third domain option in the Sample Collection Redesign workflow. The vector order entry flow is deliberately minimal: Step 1 captures the organism group (the vector "sample type"), quantity of organisms, an optional sampling site, and the test/panel selection. Step 2 is label/store/refer. The QA screen allows QA samples to be added to the order as needed. There is no trap metadata, GPS capture, pool flag, or weather data in this workflow — the lab's scope is to record what was received and test it.

---

## 2. Problem Statement

**Current state:** OpenELIS has no workflow for vector specimen receipt and testing. Lab staff receiving mosquito or tick batches for pathogen screening have no structured intake mechanism — they either improvise with environmental orders or bypass the system entirely.

**Proposed solution:** Extend the Sample Collection workflow with a Vector domain option. When selected, the form presents a simple intake: organism group, quantity, and test selection. The resulting CollectionLot record provides the foundation for V-03 species identification and V-04 surveillance reporting.

---

## 3. User Roles & Permissions

| Role | Access | Notes |
|---|---|---|
| Registration Officer | Create, edit (pre-QC) | Enters order info and triggers the workflow |
| Sample / Specimen Receiver | Create, edit (pre-QC) | Receives specimens and enters intake data |
| QA Officer | View, add QA samples | Adds QA samples to order on QA screen |
| Lab Analyst | View | Receives lot after QA completion for V-03 testing |
| System Administrator | Full | — |

**Required permission keys:**

- `vector.collectionLot.view` — View collection lot list and detail
- `vector.collectionLot.create` — Create a new collection lot
- `vector.collectionLot.edit` — Edit a draft or received lot (pre-QC only)
- `vector.collectionLot.delete` — Soft-delete a draft lot
- `vector.qa.addSample` — Add QA samples to an order on the QA screen

---

## 4. Functional Requirements

### 4.1 Domain Toggle Extension

**FR-V02-TOG-001:** The Sample Category toggle in Step 1 of the Sample Collection Redesign MUST include a third option: **"Vector"**, appearing after "Environmental / Other". The toggle reads: `Clinical | Environmental / Other | Vector`.

**FR-V02-TOG-002:** When the authenticated lab unit is configured with `labUnitDomain = VECTOR`, the toggle MUST be hidden and the Vector domain pre-selected silently. When the lab unit supports multiple domains, the toggle MUST be shown.

**FR-V02-TOG-003:** Switching the domain toggle MUST clear all domain-specific form sections and reset their state. Fields shared across domains (Lab Number, Requester) MUST be preserved.

---

### 4.2 Step 1 — Enter Order (Vector Domain)

**FR-V02-S1-001:** When Vector domain is active, the **Patient section** MUST be hidden. No patient demographics are captured for vector orders.

**FR-V02-S1-002:** Step 1 MUST show the following fields for Vector domain:

| Field | Type | Required | Notes |
|---|---|---|---|
| Organism Group | ComboBox | Yes | Sourced from V-01 VectorGroup catalog (active only). This is the vector "sample type" — e.g., Mosquito, Tick, Rodent. Displayed as "Organism Group" in the UI; maps to `sample_type_id` (VECTOR-domain SampleType) internally. |
| Quantity | NumberInput (integer) | Yes | Number of organisms received. Minimum 1. Label: "Quantity (organisms)". |
| Sampling Site | ComboBox | No | Optional. Sourced from S-02 SamplingSite registry. Records which site the specimens came from. |

**FR-V02-S1-003:** Below the intake fields, a **Test / Panel selection section** MUST appear, identical in behaviour to the standard order entry test selection component, filtered to panels and tests with `panelDomain = VECTOR` (or `sampleDomain = VECTOR` for individual tests). At least one test or panel MUST be selected before Step 1 can be submitted.

**FR-V02-S1-004:** The **Requester / Ordering Provider section** MUST remain visible and function identically to other domains — search by organisation name.

**FR-V02-S1-005:** On submission of Step 1, the system MUST:
1. Create a `CollectionLot` record with status `DRAFT`
2. Assign a lab number using module code `VCT`
3. Link the selected Organism Group (as SampleType), Quantity, Sampling Site (if provided), and test orders

---

### 4.3 Step 2 — Label & Store (Vector Domain)

> **Note:** The "Collect Sample" step (formerly Step 2) is not present in the Vector workflow. After completing Step 1, the workflow advances directly to label/store/refer.

**FR-V02-S2-001:** Step 2 MUST generate a collection lot barcode label using the assigned lab number. The label MUST include: lab number, organism group, quantity, and receipt date.

**FR-V02-S2-002:** On entering Step 2, the CollectionLot status MUST advance from `DRAFT` to `RECEIVED` and a lab receipt timestamp MUST be recorded automatically.

**FR-V02-S2-003:** The existing label print, storage location, and refer-out workflow MUST apply unchanged to vector lots. Storage location is optional.

---

### 4.4 QA Screen — Vector Domain

**FR-V02-QA-001:** The QA screen for Vector lots MUST allow QA samples to be added to the order as needed. The QA officer selects the QA sample type, quantity, and associated tests from a compact form.

**FR-V02-QA-002:** Adding QA samples is optional. The order MAY proceed to `PROCESSING` without QA samples if none are required for the current lot.

**FR-V02-QA-003:** On completing the QA screen (with or without QA samples), the CollectionLot status MUST advance from `RECEIVED` to `PROCESSING`. The lot MUST appear in the V-03 identification worklist.

---

## 5. Data Model

### Modified Entity: CollectionLot

V-02 provides the create and edit UI for CollectionLot records. The following fields are used by the Vector workflow:

| UI Field | CollectionLot Field | Type | Notes |
|---|---|---|---|
| Organism Group | `sample_type_id` | FK → SampleType (sampleDomain=VECTOR) | Displayed as "Organism Group"; user selects from VectorGroup-mapped SampleTypes |
| Quantity | `quantity` | INTEGER | Number of organisms received; minimum 1 |
| Sampling Site | `sampling_site_id` | FK → SamplingSite, nullable | Optional context field |
| Lab receipt date/time | `received_at` | TIMESTAMP WITH TIME ZONE | Auto-set on Step 2 entry |
| Received by | `received_by_user_id` | FK → SystemUser | Auto-set from logged-in user |
| Status | `status` | ENUM: DRAFT / RECEIVED / PROCESSING / TESTED / ARCHIVED | |
| Lab number | `lab_number` | VARCHAR(50) | Module code VCT |

**Fields removed in v2.0** (not captured in this workflow): `trap_type_id`, `collection_start`, `collection_end`, `gps_lat`, `gps_lng`, `is_pool`, `pool_size`, `collector_name`, `weather_condition`, `weather_temp_c`, `weather_humidity_pct`, `collection_notes`, `container_id`, `shipment_id`.

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/vector/collectionLots` | List collection lots (filterable by status, site, date) | `vector.collectionLot.view` |
| GET | `/api/v1/vector/collectionLots/{id}` | Get single lot with full detail | `vector.collectionLot.view` |
| POST | `/api/v1/vector/collectionLots` | Create new lot (Step 1 submit) | `vector.collectionLot.create` |
| PUT | `/api/v1/vector/collectionLots/{id}` | Update lot | `vector.collectionLot.edit` |
| PATCH | `/api/v1/vector/collectionLots/{id}/receive` | Advance status DRAFT → RECEIVED | `vector.collectionLot.edit` |
| DELETE | `/api/v1/vector/collectionLots/{id}` | Soft-delete a DRAFT lot | `vector.collectionLot.delete` |
| GET | `/api/v1/sampleTypes?domain=VECTOR&active=true` | List VECTOR-domain sample types for Organism Group ComboBox | `sampleType.view` |
| POST | `/api/v1/vector/collectionLots/{id}/qa-samples` | Add QA sample(s) to a lot | `vector.qa.addSample` |

---

## 7. UI Design

See companion mockup: `vector-collection-workflow.jsx`
HTML interactive preview: `vector-collection-workflow.html`

### Navigation Path

Sample Collection → Step 1 (Enter Order, Vector domain) → Step 2 (Label & Store) → QA Screen

### Key Screens

1. **Step 1 — Enter Order (Vector active)** — Domain toggle with Vector selected; Organism Group ComboBox; Quantity NumberInput; optional Sampling Site ComboBox; Test/Panel selection section (VECTOR-domain only).
2. **Step 2 — Label & Store** — Lot barcode label print (lab number, organism group, quantity, date); storage location (optional); refer-out option.
3. **QA Screen** — Optional QA sample addition form; proceed to Processing.

### Interaction Patterns

- Domain toggle replaces visible sections without page reload
- Organism Group ComboBox is searchable by group name
- Quantity field shows "organisms" unit label inline
- Test/Panel section is the standard order entry component, domain-filtered
- QA sample addition uses a compact inline form (no modal)

---

## 8. Business Rules

**BR-V02-001:** Organism Group is required. A CollectionLot MUST have a `sample_type_id` pointing to an active VECTOR-domain SampleType.

**BR-V02-002:** Quantity MUST be ≥ 1. There is no maximum enforced at the system level; labs may configure soft warnings via QA rules if needed.

**BR-V02-003:** At least one test or panel MUST be selected in Step 1 before the lot can be saved.

**BR-V02-004:** A CollectionLot MUST NOT advance to `PROCESSING` unless the QA screen has been visited and confirmed (with or without QA samples added).

**BR-V02-005:** Editing a CollectionLot is permitted only while status is `DRAFT` or `RECEIVED`. Lots in `PROCESSING`, `TESTED`, or `ARCHIVED` status are read-only.

**BR-V02-006:** The lab number format for vector lots MUST use the module code `VCT` in the existing lab number template: `{seq}/{labCode}/VCT/{month}/{year}`.

**BR-V02-007:** Sampling site is optional. A CollectionLot MAY have a null `sampling_site_id`. When provided, it is for traceability only and does not affect workflow routing.

---

## 9. Localization

| i18n Key | Default English Text |
|---|---|
| `label.workflow.vector` | Vector |
| `label.vectorOrder.organismGroup` | Organism Group |
| `placeholder.vectorOrder.organismGroup` | Search organism groups… |
| `label.vectorOrder.quantity` | Quantity (organisms) |
| `label.vectorOrder.samplingSite` | Sampling Site (optional) |
| `placeholder.vectorOrder.samplingSite` | Search sampling sites… |
| `heading.vectorOrder.tests` | Tests & Panels |
| `label.collectionLot.status.draft` | Draft |
| `label.collectionLot.status.received` | Received |
| `label.collectionLot.status.processing` | Processing |
| `label.collectionLot.status.tested` | Tested |
| `label.collectionLot.status.archived` | Archived |
| `button.collectionLot.saveStep1` | Continue to Label & Store |
| `button.vectorQa.addQaSample` | Add QA Sample |
| `button.vectorQa.proceed` | Proceed to Processing |
| `message.vectorOrder.noSampleTypes` | No vector organism groups configured. Contact your administrator. |
| `message.vectorOrder.noTests` | At least one test or panel is required. |
| `error.vectorOrder.organismGroupRequired` | Organism group is required. |
| `error.vectorOrder.quantityRequired` | Quantity is required. |
| `error.vectorOrder.quantityMin` | Quantity must be at least 1. |
| `error.vectorOrder.testRequired` | Select at least one test or panel. |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Organism Group | Required | `error.vectorOrder.organismGroupRequired` |
| Quantity | Required; integer ≥ 1 | `error.vectorOrder.quantityRequired` / `error.vectorOrder.quantityMin` |
| Tests / Panel | At least one required | `error.vectorOrder.testRequired` |
| Sampling Site | Optional; if provided must resolve to an active SamplingSite record | — |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View collection lot list | `vector.collectionLot.view` | Menu item hidden |
| Create new lot | `vector.collectionLot.create` | "New Collection" button hidden |
| Edit lot (pre-QC) | `vector.collectionLot.edit` | Edit link hidden; API returns 403 |
| Delete draft lot | `vector.collectionLot.delete` | Delete button hidden |
| Add QA samples | `vector.qa.addSample` | QA sample form hidden; API returns 403 |

---

## 12. Acceptance Criteria

### Functional

- [ ] The Step 1 Sample Category toggle shows three options: Clinical, Environmental / Other, Vector
- [ ] Selecting Vector hides the Patient section
- [ ] Organism Group ComboBox is populated from the V-01 VectorGroup catalog (VECTOR-domain SampleTypes)
- [ ] Quantity field accepts integers ≥ 1; rejects non-integer and < 1 values
- [ ] Sampling Site ComboBox is optional and sourced from S-02 SamplingSite API
- [ ] Test/Panel section shows only VECTOR-domain panels and tests
- [ ] At least one test or panel must be selected before Step 1 can be submitted
- [ ] Completing Step 1 creates a CollectionLot with status DRAFT and assigns a lab number with module code VCT
- [ ] Step 2 displays the label print UI and advances status to RECEIVED on entry
- [ ] Storage location is optional on Step 2
- [ ] QA screen allows QA samples to be added (organism group, quantity, tests)
- [ ] QA screen can be completed without adding any QA samples
- [ ] Completing the QA screen advances CollectionLot status to PROCESSING
- [ ] The lot appears in the V-03 identification worklist after reaching PROCESSING
- [ ] Editing a lot in PROCESSING, TESTED, or ARCHIVED status is blocked (read-only)

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English in JSX
- [ ] Page transitions between steps complete within 1 second
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized requests)
- [ ] Feature renders correctly at 1280px viewport width

### Integration

- [ ] Organism Group ComboBox data sourced from `/api/v1/sampleTypes?domain=VECTOR&active=true`
- [ ] Sampling Site lookup uses existing S-02 SamplingSite API
- [ ] Lab number assigned using existing lab numbering service with module code VCT
- [ ] Completed lot is accessible via V-03 identification worklist API
