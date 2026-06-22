# Informed Consent Capture for Sample Collection
## Functional Requirements Specification — v1.0

**Version:** 1.1
**Date:** 2026-04-14
**Status:** Draft for Review
**Jira:** OGC-557
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Order Entry

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

This feature adds an informed consent capture section to the OpenELIS sample order entry workflow. Lab agents can record that a patient has provided a signed physical consent form before sample collection, optionally referencing the consent form's ID number. The section is advisory — it does not block order submission — and provides an auditable timestamp and agent record for regulatory compliance purposes. The feature is deployed globally across all OpenELIS instances and is the first rollout priority for Madagascar deployments. The reusable `ConsentAccordionSection` component can be integrated into other workflows (such as the new Sample Collection Wizard) independently.

---

## 2. Problem Statement

**Current state:** OpenELIS has no mechanism to record whether patient informed consent was obtained before sample collection. Lab staff in regulated environments (particularly in Madagascar, where informed consent is required for certain categories of testing) rely on paper logs or offline tracking that is disconnected from the order record.

**Impact:** During audits, labs cannot demonstrate within the LIMS itself that consent was obtained for a given order. This creates compliance risk under national laboratory regulations and standards such as ISO 15189. Lab managers must manually reconcile paper consent logs with electronic order records.

**Proposed solution:** Add a collapsible Accordion section to the sample order entry form (and Reagan's new sample collection workflow). The section contains a checkbox confirming patient consent and an optional text field for the physical consent form reference number. All consent records include the logged-in agent's identity and a timestamp, stored against the sample order record.

---

## 3. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Lab Technician | View & Edit | Can record and update consent on orders they create or edit |
| Lab Manager | View & Edit | Can view and update consent on all orders |
| System Administrator | Full | Full access |
| Receptionist / Order Entry | View & Edit | Can record consent at point of order entry |

**Required permission keys:**

- `sampleOrder.modify` — Required to record or update consent fields. This is the existing order edit permission; no new permission key is introduced by this feature.

---

## 4. Functional Requirements

### 4.1 Consent Section — Display

**FR-1-001:** The system MUST display an "Informed Consent" Accordion section on the Add Order / Edit Order screen for all deployments globally.

**FR-1-002:** The Accordion section MUST be expanded by default when the order entry form loads.

**FR-1-003:** The user MUST be able to collapse and re-expand the Accordion section without affecting any other form state.

**FR-1-004:** The Accordion section header MUST display the section title and, when consent has been recorded, a Carbon Tag (kind="teal") reading "Consent Recorded" so the status is visible even when the section is collapsed.

### 4.2 Consent Checkbox

**FR-2-001:** The Accordion body MUST contain a Checkbox with the label "Patient has provided signed consent."

**FR-2-002:** The Checkbox MUST default to unchecked when a new order is created.

**FR-2-003:** When the order is loaded for editing, the Checkbox MUST reflect the previously saved consent state.

**FR-2-004:** Checking or unchecking the Checkbox MUST NOT trigger an immediate save — consent is saved as part of the overall order save action.

### 4.3 Consent Form Reference Number

**FR-3-001:** When the Checkbox is checked, the system MUST reveal a TextInput field labelled "Consent Form Reference No." below the Checkbox.

**FR-3-002:** When the Checkbox is unchecked, the Consent Form Reference No. field MUST be hidden and its value MUST be cleared.

**FR-3-003:** The Consent Form Reference No. field MUST be optional — the order can be saved with the Checkbox checked but no reference number entered.

**FR-3-004:** The Consent Form Reference No. field MUST accept a maximum of 100 characters.

**FR-3-005:** The placeholder text for the Consent Form Reference No. field MUST read "e.g. CF-2026-00123."

### 4.4 Consent Audit Record

**FR-4-001:** When an order is saved and the consent Checkbox is checked, the system MUST record: (a) the ID of the logged-in user, (b) the timestamp of the save action (UTC), and (c) the consent form reference number if provided.

**FR-4-002:** When an order is saved and the consent Checkbox is unchecked, all previously stored consent fields (consentGiven, consentFormReference, consentRecordedAt, consentRecordedBy) MUST be cleared/set to null.

**FR-4-003:** The consent audit record MUST be stored as fields on the existing SampleOrder entity — no separate consent table is required.

**FR-4-004:** The logged agent name and timestamp MUST be displayed in the Accordion body (read-only) when consent has been previously recorded and the order is being edited.

### 4.5 Advisory-Only Enforcement

**FR-5-001:** The order submission action MUST NOT be blocked if the Informed Consent Checkbox is unchecked. The consent section is advisory.

**FR-5-002:** No warning or error notification MUST be shown if the order is submitted without consent being recorded.

---

## 5. Data Model

### Modified Entities

**SampleOrder** (existing entity) — Add fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| consentGiven | Boolean | No | True = consent checkbox was checked at time of last save. Null if never recorded. |
| consentFormReference | String (100) | No | Optional reference number of physical consent form. Null if not provided or if consent unchecked. |
| consentRecordedAt | Timestamp | No | UTC timestamp of the save action when consent was last recorded. Null if consentGiven is false/null. |
| consentRecordedBy | FK → SystemUser | No | ID of the logged-in user who recorded consent. Null if consentGiven is false/null. |

**Database migration:** A Liquibase changeset must add the four columns to the `sample_order` table with nullable constraints. No backfill is required — existing rows remain null.

---

## 6. API Endpoints

No new API endpoints are required. Consent fields are included in the existing SampleOrder create and update endpoints.

| Method | Path | Description | Permission |
|---|---|---|---|
| PUT | `/api/v1/sampleOrder/{id}` | Update order (includes consent fields) | `sampleOrder.modify` |
| POST | `/api/v1/sampleOrder` | Create order (includes consent fields) | `sampleOrder.add` |
| GET | `/api/v1/sampleOrder/{id}` | Retrieve order (includes consent fields in response) | `sampleOrder.view` |

**Request body additions (PUT / POST):**
```json
{
  "consentGiven": true,
  "consentFormReference": "CF-2026-00123"
}
```

**Response additions:**
```json
{
  "consentGiven": true,
  "consentFormReference": "CF-2026-00123",
  "consentRecordedAt": "2026-04-14T09:32:00Z",
  "consentRecordedBy": { "id": 42, "displayName": "Marie Rakoto" }
}
```

---

## 7. UI Design

See companion React mockup: `informed-consent-mockup.jsx`

### Navigation Path

Order Entry → Add Order / Edit Order → Informed Consent section (Accordion)

### Key Screens

1. **Add Order — Consent unchecked (default):** Accordion expanded, checkbox unchecked, reference field hidden.
2. **Add Order — Consent checked:** Checkbox checked, reference field revealed below with placeholder text.
3. **Edit Order — Consent previously recorded:** Checkbox checked, reference number pre-filled, audit record (agent + timestamp) displayed read-only below the reference field.
4. **Accordion collapsed with status tag:** Section collapsed, "Consent Recorded" teal tag visible in header.

### Interaction Patterns

- **Collapsible Accordion** for the consent section — optional but not required for order submission
- **Conditional field reveal** — reference number TextInput appears only when Checkbox is checked
- **No modal** — all consent capture is inline within the order form

---

## 8. Business Rules

**BR-001:** Consent state is always tied to the last save. If a user checks consent, saves, then re-opens and unchecks and saves again, the consent record is cleared. There is no audit trail of the intermediate consent state (consent history is out of scope).

**BR-002:** The consent recorded-by agent is always the currently logged-in user at the time of the save action, regardless of who entered the order originally.

**BR-003:** Clearing the Checkbox clears all four consent fields (consentGiven, consentFormReference, consentRecordedAt, consentRecordedBy) atomically in the same transaction as the order save.

**BR-004:** If a user saves an order with the Checkbox unchecked, no consent audit fields are written — the backend ignores any consentFormReference value sent with a false consentGiven flag.

**BR-005:** The Consent Form Reference No. field accepts alphanumeric characters, hyphens, and spaces only. Special characters beyond these are rejected client-side.

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files (English default provided; French and Malagasy translations required for Madagascar deployment):

| i18n Key | Default English Text |
|---|---|
| `heading.informedConsent.sectionTitle` | Informed Consent |
| `label.informedConsent.consentGiven` | Patient has provided signed consent |
| `label.informedConsent.formReference` | Consent Form Reference No. |
| `placeholder.informedConsent.formReference` | e.g. CF-2026-00123 |
| `label.informedConsent.recordedBy` | Consent recorded by |
| `label.informedConsent.recordedAt` | Recorded on |
| `label.informedConsent.statusTag` | Consent Recorded |
| `label.informedConsent.notRecorded` | Not recorded |
| `error.informedConsent.formReferenceMaxLength` | Consent form reference must be 100 characters or fewer |
| `error.informedConsent.formReferenceInvalidChars` | Only letters, numbers, hyphens, and spaces are allowed |
| `heading.informedConsent.auditRecord` | Consent Audit Record |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| consentFormReference | Max 100 characters | `error.informedConsent.formReferenceMaxLength` |
| consentFormReference | Alphanumeric, hyphens, spaces only | `error.informedConsent.formReferenceInvalidChars` |
| consentFormReference | Only validated when consentGiven = true | — |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View consent fields on order | `sampleOrder.view` | Consent section not shown |
| Record / update consent | `sampleOrder.modify` | Checkbox and TextInput are disabled (read-only); API returns 403 if attempted |

No new permission keys are introduced. Consent capture is part of the existing order edit workflow.

---

## 12. Acceptance Criteria

### Functional

- [ ] The Informed Consent Accordion section is visible on the Add Order screen for all users with `sampleOrder.view` permission
- [ ] The Accordion is expanded by default when the Add Order form loads
- [ ] The Accordion can be collapsed and re-expanded without losing form state
- [ ] The Consent Form Reference No. TextInput is hidden when the Checkbox is unchecked
- [ ] The Consent Form Reference No. TextInput appears when the Checkbox is checked
- [ ] Unchecking the Checkbox clears the Consent Form Reference No. field
- [ ] An order can be submitted with the Checkbox unchecked — no blocking or warning
- [ ] An order can be submitted with the Checkbox checked but no reference number — no blocking
- [ ] Saving an order with the Checkbox checked persists consentGiven=true, consentRecordedAt (UTC timestamp), and consentRecordedBy (logged-in user ID)
- [ ] Saving an order with the Checkbox unchecked clears all four consent fields to null
- [ ] When editing an order with previously recorded consent, the Checkbox and reference number are pre-populated from the saved values
- [ ] The audit record (agent display name + formatted timestamp) is shown read-only when editing an order with recorded consent
- [ ] A "Consent Recorded" teal Tag appears in the Accordion header when consent has been recorded and the section is collapsed
- [ ] Consent Form Reference No. longer than 100 characters shows the `error.informedConsent.formReferenceMaxLength` validation message
- [ ] Consent Form Reference No. with invalid characters shows the `error.informedConsent.formReferenceInvalidChars` validation message

### Non-Functional

- [ ] All UI strings use i18n keys — zero hardcoded English text in JSX
- [ ] All i18n keys listed in Section 9 are present in the English message properties file
- [ ] French and Malagasy translations provided for all keys in Section 9
- [ ] The Informed Consent section renders correctly on screens 1280px wide and above
- [ ] Consent fields are included in the SampleOrder GET response
- [ ] Users without `sampleOrder.modify` permission see the consent section as read-only (fields disabled); API returns HTTP 403 if consent update is attempted

### Integration

- [ ] A Liquibase changeset adds the four consent columns to `sample_order` with nullable constraints
- [ ] Existing SampleOrder records are unaffected (all four columns default to null — no backfill)
- [ ] Consent fields are included in any FHIR ServiceRequest mapping if applicable
