# Blood Bank: Patient Blood Bank Record
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-03-19
**Status:** Draft for Review
**Jira:** TBD (Blood Bank epic)
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Patient Demographics (existing), Order Entry (existing), Results Entry (existing), Validation (existing), Blood Bank Program & Unit Reception (Spec 1), Pre-Transfusion Testing & Transfusion Request (Spec 3), Issue-to-Patient & Emergency Release (Spec 4)

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. Scope & Two-Tier Architecture
4. User Roles & Permissions
5. Functional Requirements — Tier 1 (Core Lab Record)
6. Functional Requirements — Tier 2 (Optional Clinical Data)
7. Data Model
8. API Endpoints
9. UI Design
10. Business Rules
11. Localization
12. Validation Rules
13. Security & Permissions
14. Acceptance Criteria

---

## 1. Executive Summary

This spec defines the Patient Blood Bank Record — a persistent, longitudinal view that aggregates each patient's blood bank history within OpenELIS. The record is split into two tiers. Tier 1 (always present) covers data that the laboratory owns and is required to maintain by transfusion medicine standards: ABO/Rh typing history, antibody screen history, alloantibody profile, and a traceability log of blood units issued to the patient. Tier 2 (admin-configurable, disabled by default) covers data that may be managed in an EMR or hemovigilance system in integrated environments but is useful in settings without one: special transfusion requirements and transfusion reaction flagging. The record is surfaced as a "Blood Bank" tab on the existing Patient Demographics view.

---

## 2. Problem Statement

**Current state:** Patient blood bank history in OpenELIS is fragmented across individual order and result records. There is no consolidated view of a patient's ABO/Rh type, antibody history, or record of units issued to them.

**Impact:** Staff cannot quickly confirm a patient's historical ABO/Rh type at crossmatch time, may miss previously identified alloantibodies if a new antibody screen is negative (antibody titers can fall below detectable levels), and have no structured issuance log within the LIS to support traceability audits.

**Proposed solution:** A Patient Blood Bank Record that is automatically created and populated from existing validated results and issue workflows. Tier 1 data is populated entirely by the system — no manual data entry is required for the core record. Tier 2 fields are optional and can be enabled by labs that manage clinical data within OpenELIS rather than in an EMR.

---

## 3. Scope & Two-Tier Architecture

### Tier 1 — Core Lab Record (always enabled)

This data is owned by the laboratory. Maintaining it is a requirement under transfusion medicine standards (AABB, WHO, ISO 15189) regardless of whether an EMR is present. All Tier 1 data is populated automatically from existing validated result and issue workflows — no manual data entry by lab staff is required for the record to be useful.

| Section | Data Source | Lab Rationale |
|---|---|---|
| ABO/Rh Typing History | Existing validated results | Labs must maintain concordant typing history; discordance must be flagged before issue |
| Antibody Screen History | Existing validated results | Labs must know if a patient has ever screened positive; titer can drop below detection |
| Alloantibody Profile | Lab-entered (inline form) | Previously identified antibodies (e.g., anti-E) must be on record even if not detected on current screen |
| Unit Issuance Log | Populated by Spec 4 automatically | Regulatory traceability requirement: every unit must be traceable from receipt to recipient |

### Tier 2 — Optional Clinical Data (disabled by default)

This data is relevant in settings without an EMR or when the lab acts as the system of record for transfusion management. Labs with EMR integration will typically receive this data from the EMR rather than entering it in OpenELIS. A Blood Bank Admin enables Tier 2 per-section via Admin → Blood Bank → Program Settings.

| Section | Why Optional |
|---|---|
| Special Transfusion Requirements | Prescription originates with the physician; EMR is the natural home. The lab needs it at crossmatch time, but many labs receive it via EMR integration or paper order. |
| Reaction Flagging | Full clinical documentation belongs in the EMR. The lab side is a lightweight workup trigger — useful in settings without an EMR, redundant with one. |

---

## 4. User Roles & Permissions

| Role | Access Level | Notes |
|---|---|---|
| Blood Bank Technologist | View full record; add alloantibody entries | Cannot modify special requirements or record reactions |
| Blood Bank Supervisor | All Technologist permissions + add/edit special requirements (Tier 2), record reaction flags (Tier 2) | — |
| Blood Bank Admin | View full record; configure Tier 2 settings | Cannot create orders or enter results |
| Ordering Clinician | View only | Read access to inform clinical decisions; cannot edit |
| System Administrator | Full | — |

**Required permission keys:**

- `bloodbank.patient.view` — View patient blood bank record
- `bloodbank.patient.antibody.modify` — Add/edit alloantibody profile entries
- `bloodbank.patient.requirements.modify` — Add/deactivate special transfusion requirements (Tier 2)
- `bloodbank.patient.reaction.record` — Flag a transfusion reaction (Tier 2)

---

## 5. Functional Requirements — Tier 1 (Core Lab Record)

### 5.1 Record Creation and Linkage

**FR-1-001:** A Patient Blood Bank Record SHALL be created automatically the first time any Blood Bank program order is created for a patient, or the first time a blood bank-related test result (ABO/Rh, antibody screen) is validated for a patient.

**FR-1-002:** The record SHALL be permanently linked to the OpenELIS patient by patient ID. One record per patient. The record is never deleted.

**FR-1-003:** The record SHALL be accessible from the existing Patient Demographics view as a "Blood Bank" tab, visible only to users with `bloodbank.patient.view` permission.

**FR-1-004:** If a patient has no blood bank history, the Blood Bank tab SHALL display an empty state message rather than an error or blank screen.

### 5.2 ABO/Rh Typing History

**FR-2-001:** The record SHALL display all validated ABO Group and Rh Type results for the patient, ordered chronologically (most recent first). Each entry SHALL show: result date, ABO result, Rh result, order accession number, and interpreting technologist.

**FR-2-002:** The record SHALL compute and prominently display a **Confirmed ABO/Rh** value when two or more validated ABO/Rh results from distinct order accession numbers agree. The confirmed value SHALL display a "Confirmed" Tag (kind="green"). A single result SHALL display "Unconfirmed — second sample required" with a Tag (kind="yellow").

**FR-2-003:** If validated ABO/Rh results for the patient are discordant (results from distinct accessions disagree), the record SHALL display a "Discordance Alert" InlineNotification (kind="error") and the confirmed ABO/Rh field SHALL show "Discordant — supervisor review required." No confirmed type SHALL be shown until a Blood Bank Supervisor adds a resolution note (FR-7-002), at which point the discordance is acknowledged and the most recent validated type is used.

**FR-2-004:** ABO/Rh history entries are read-only in this record. All data is populated from the existing Results Entry and Validation workflow.

**FR-2-005:** The confirmed ABO/Rh value and confirmation status SHALL be cached on the PatientBloodBankRecord entity and refreshed by an event listener whenever a new blood bank result is validated for this patient.

### 5.3 Antibody Screen History

**FR-3-001:** The record SHALL display all validated antibody screen results for the patient chronologically, showing: result date, screen result (Positive / Negative / Equivocal), and order accession number.

**FR-3-002:** If any validated antibody screen result is Positive, the record SHALL display an "Antibody Screen Positive" InlineNotification (kind="warning") in the record header, visible regardless of which section is active.

**FR-3-003:** The most recent antibody screen result and date SHALL be shown in the record header summary alongside the confirmed ABO/Rh. Antibody screen history entries are read-only.

### 5.4 Alloantibody Profile

**FR-4-001:** A user with `bloodbank.patient.antibody.modify` permission SHALL be able to add identified alloantibodies to the patient's profile via an inline form. Each entry SHALL capture: antibody specificity (free text), clinical significance (High / Low / Unknown), identification method (Panel / Adsorption / Elution / Other), date identified, and an optional note.

**FR-4-002:** The alloantibody profile SHALL be displayed as a table with: specificity, clinical significance Tag, date identified, method, and note (truncated, expandable). Alloantibodies marked High clinical significance SHALL appear as a clinical alert in the record header.

**FR-4-003:** Entries are editable via inline row expansion by users with `bloodbank.patient.antibody.modify`. Deletion is not permitted; entries may be superseded by adding a new entry. The edit form SHALL mirror the add form.

**FR-4-004:** Alloantibodies with High clinical significance SHALL be provided via API to the Pre-Transfusion Testing workflow (Spec 3) for antigen-negative filtering of the crossmatch pool.

### 5.5 Unit Issuance Log

**FR-5-001:** The record SHALL display a read-only log of all blood units issued to this patient, populated automatically by the Issue-to-Patient workflow (Spec 4). No manual entry is possible in this section.

**FR-5-002:** Each issuance log entry SHALL show: issue date/time, unit number, component type, ABO/Rh of the issued unit, volume, and issuing technologist. This satisfies the regulatory requirement to trace each unit from receipt to recipient.

**FR-5-003:** The log SHALL be ordered most-recent-first. If Tier 2 reaction flagging is enabled (FR-6-002), a "Reaction Flagged" Tag SHALL appear on entries with a reaction flag.

---

## 6. Functional Requirements — Tier 2 (Optional Clinical Data)

Tier 2 sections are hidden by default. A Blood Bank Admin enables each section independently via Admin → Blood Bank → Program Settings → Patient Record Options. When a section is disabled, its data is not collected, its API endpoints return 404, and its UI elements are not rendered.

### 6.1 Special Transfusion Requirements

**FR-6-001:** When enabled, a user with `bloodbank.patient.requirements.modify` permission SHALL be able to record special transfusion requirements for the patient. Requirements are selected from the existing Special Attributes set (Irradiated / CMV Negative / Leukoreduced / Washed / HLA Matched / Other).

**FR-6-002:** Each requirement entry SHALL capture: requirement type, date recorded, ordering clinician (free text), clinical indication (free text), and active/inactive status.

**FR-6-003:** Active requirements SHALL appear in the record header summary as a clinical alert alongside alloantibodies. They SHALL be provided via API to the Spec 3 crossmatch pool — units lacking a required attribute SHALL be flagged as incompatible.

**FR-6-004:** Deactivating a requirement SHALL require confirmation and a reason (Clinical indication resolved / Ordered in error / Other). Inactive requirements remain in the record for audit purposes.

### 6.2 Reaction Flagging

**FR-7-001:** When enabled, a user with `bloodbank.patient.reaction.record` permission SHALL be able to flag a transfusion reaction against an issuance log entry. The flag is a lightweight workup trigger — it is not a substitute for full clinical reaction documentation in an EMR.

**FR-7-002:** The reaction flag SHALL capture: reaction category (Hemolytic / Non-hemolytic febrile / Allergic / Other), onset time, and a free-text workup note (max 500 characters). No severity grading, clinical management fields, or hemovigilance fields are included — those belong in the EMR.

**FR-7-003:** A flagged entry SHALL display a "Reaction Flagged" Tag in the issuance log table. If any reaction has been flagged for this patient, an alert SHALL appear in the record header.

**FR-7-004:** Reaction flags are immutable after saving. A correction is made by adding a new note on the record (FR-7-002 in Spec 3 v1 clinical notes section is removed from this spec; a simplified correction note field on the flag itself is sufficient).

---

## 7. Data Model

### New Entities

**PatientBloodBankRecord** (Tier 1)

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| patientId | Long | Yes | FK to Patient; unique |
| confirmedAboGroup | String(5) | No | Cached; recomputed on result validation |
| confirmedRhType | String(10) | No | Cached |
| aboRhConfirmationStatus | Enum | No | CONFIRMED / UNCONFIRMED / DISCORDANT / DISCORDANCE_ACKNOWLEDGED |
| lastAntibodyScreenResult | String(20) | No | POSITIVE / NEGATIVE / EQUIVOCAL; cached |
| lastAntibodyScreenDate | Date | No | Cached |
| createdDate | Date | Yes | — |
| lastModifiedDate | Date | Yes | Auto-updated |

**PatientAlloantibody** (Tier 1)

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | — |
| patientBloodBankRecordId | Long | Yes | FK to PatientBloodBankRecord |
| specificity | String(100) | Yes | e.g. anti-E, anti-K |
| clinicalSignificance | Enum | Yes | HIGH / LOW / UNKNOWN |
| identificationMethod | Enum | Yes | PANEL / ADSORPTION / ELUTION / OTHER |
| identificationDate | Date | Yes | — |
| note | Text | No | — |
| createdByUserId | Long | Yes | — |
| createdDate | Date | Yes | — |

**PatientSpecialRequirement** (Tier 2 — only present when section enabled)

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | — |
| patientBloodBankRecordId | Long | Yes | — |
| requirementType | Enum | Yes | IRRADIATED / CMV_NEGATIVE / LEUKOREDUCED / WASHED / HLA_MATCHED / OTHER |
| requirementOtherText | String(200) | No | Required when type = OTHER |
| dateRecorded | Date | Yes | — |
| orderingClinician | String(200) | No | — |
| clinicalIndication | Text | No | — |
| isActive | Boolean | Yes | Default true |
| deactivatedDate | Date | No | — |
| deactivationReason | Enum | No | RESOLVED / ORDERED_IN_ERROR / OTHER |
| createdByUserId | Long | Yes | — |

**PatientTransfusionReactionFlag** (Tier 2 — only present when section enabled)

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | — |
| transfusionHistoryEntryId | Long | Yes | FK to TransfusionHistoryEntry (Spec 4) |
| patientBloodBankRecordId | Long | Yes | — |
| reactionCategory | Enum | Yes | HEMOLYTIC / NON_HEMOLYTIC_FEBRILE / ALLERGIC / OTHER |
| onsetTime | Timestamp | Yes | — |
| workupNote | Text(500) | No | Brief workup / investigation note |
| createdByUserId | Long | Yes | — |
| createdDate | Timestamp | Yes | Immutable |

### Existing Infrastructure Reused

- **Patient** — linked by patientId; no changes
- **Order / Result / Validation** — ABO/Rh and antibody screen history read from existing validated result tables; no duplicate storage
- **TransfusionHistoryEntry** — created by Spec 4; the issuance log section is a view over these records

### Derived / Cached Fields

`confirmedAboGroup`, `confirmedRhType`, `aboRhConfirmationStatus`, `lastAntibodyScreenResult`, and `lastAntibodyScreenDate` are cached on `PatientBloodBankRecord` and recomputed by an event listener on result validation. Caching is required for efficient header display and crossmatch-time safety checks.

---

## 8. API Endpoints

| Method | Path | Description | Permission | Tier |
|---|---|---|---|---|
| GET | `/api/v1/bloodbank/patients/{patientId}/record` | Full record (all sections per Tier config) | `bloodbank.patient.view` | 1 |
| GET | `/api/v1/bloodbank/patients/{patientId}/abo-rh-history` | Validated ABO/Rh result history | `bloodbank.patient.view` | 1 |
| GET | `/api/v1/bloodbank/patients/{patientId}/antibody-screen-history` | Validated antibody screen history | `bloodbank.patient.view` | 1 |
| GET | `/api/v1/bloodbank/patients/{patientId}/alloantibodies` | Alloantibody profile | `bloodbank.patient.view` | 1 |
| POST | `/api/v1/bloodbank/patients/{patientId}/alloantibodies` | Add alloantibody entry | `bloodbank.patient.antibody.modify` | 1 |
| PUT | `/api/v1/bloodbank/patients/{patientId}/alloantibodies/{id}` | Edit alloantibody entry | `bloodbank.patient.antibody.modify` | 1 |
| GET | `/api/v1/bloodbank/patients/{patientId}/issuance-log` | Unit issuance traceability log | `bloodbank.patient.view` | 1 |
| GET | `/api/v1/bloodbank/patients/{patientId}/compatibility-profile` | ABO/Rh + active alloantibodies + active requirements (Spec 3 input) | `bloodbank.patient.view` | 1+2 |
| GET | `/api/v1/bloodbank/patients/{patientId}/requirements` | Special requirements list | `bloodbank.patient.view` | 2 |
| POST | `/api/v1/bloodbank/patients/{patientId}/requirements` | Add special requirement | `bloodbank.patient.requirements.modify` | 2 |
| PUT | `/api/v1/bloodbank/patients/{patientId}/requirements/{id}` | Deactivate requirement | `bloodbank.patient.requirements.modify` | 2 |
| POST | `/api/v1/bloodbank/patients/{patientId}/issuance-log/{id}/reaction` | Flag transfusion reaction | `bloodbank.patient.reaction.record` | 2 |

Tier 2 endpoints return `404 Feature Disabled` when the respective section is not enabled in program settings.

The `/compatibility-profile` endpoint is the primary integration point for Spec 3 (Pre-Transfusion Testing). It returns: confirmed ABO/Rh + status, all High-significance alloantibodies, and (if Tier 2 enabled) all active special requirements. Spec 3 uses this to filter the crossmatch pool.

---

## 9. UI Design

See companion React mockup: `patient-blood-bank-record-mockup.jsx`

### Navigation Path

Patient Search → Patient Demographics → Blood Bank tab

### Key Screens

1. **Record header** — Persistent at top of Blood Bank tab. Always shows: confirmed ABO/Rh with status Tag, most recent antibody screen result. Conditionally shows: antibody screen positive alert, High-significance alloantibody alerts, active special requirements (if Tier 2 enabled), reaction history alert (if Tier 2 enabled and any reaction flagged).
2. **ABO/Rh History section** — Accordion. Read-only table of validated typing results. Discordance alert if applicable.
3. **Antibody Screen History section** — Accordion. Read-only table.
4. **Alloantibody Profile section** — Accordion. Editable table with inline add/edit form.
5. **Unit Issuance Log section** — Accordion. Read-only traceability table. Reaction Flag inline form if Tier 2 enabled.
6. **Special Requirements section** — Accordion, only shown if Tier 2 enabled. Add form + deactivation modal.

### Interaction Patterns

- **Record header persistent** — clinical alerts always visible without scrolling
- **Accordion sections** — independently expandable; default all collapsed except header
- **Inline add/edit** for alloantibodies; inline reaction flag form in issuance log
- **Modal** for special requirement deactivation only

---

## 10. Business Rules

**BR-001:** ABO/Rh confirmation requires two concordant validated results from distinct order accession numbers. The same accession number cannot satisfy both requirements.

**BR-002:** ABO/Rh discordance is acknowledged (not resolved) by a Blood Bank Supervisor adding a record note. Acknowledgement sets status to DISCORDANCE_ACKNOWLEDGED and uses the most recent validated result going forward. The discordant historical results remain immutable in the record.

**BR-003:** High-significance alloantibodies are always included in the `/compatibility-profile` API response used by Spec 3, regardless of how old the identification date is. There is no automatic expiry.

**BR-004:** The unit issuance log is read-only in this record. It is populated exclusively by the Spec 4 issue workflow. Manual entries are not permitted.

**BR-005:** Tier 2 sections are per-installation configuration, not per-patient. Enabling or disabling a Tier 2 section affects all patients in the system. Existing data in a Tier 2 section is retained if the section is later disabled; it simply becomes inaccessible until re-enabled.

**BR-006:** The `/compatibility-profile` endpoint always returns available Tier 1 data (ABO/Rh, alloantibodies). Tier 2 data (special requirements) is included in the response only if Tier 2 is enabled and the patient has active requirements. Spec 3 must handle both cases.

---

## 11. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `heading.bbPatient.title` | Patient Blood Bank Record |
| `heading.bbPatient.aboRhHistory` | ABO/Rh Typing History |
| `heading.bbPatient.antibodyScreenHistory` | Antibody Screen History |
| `heading.bbPatient.alloantibodyProfile` | Alloantibody Profile |
| `heading.bbPatient.issuanceLog` | Unit Issuance Log |
| `heading.bbPatient.specialRequirements` | Special Transfusion Requirements |
| `heading.bbPatient.addAlloantibody` | Add Identified Alloantibody |
| `heading.bbPatient.editAlloantibody` | Edit Alloantibody Entry |
| `heading.bbPatient.addRequirement` | Add Special Requirement |
| `heading.bbPatient.flagReaction` | Flag Transfusion Reaction |
| `label.bbPatient.confirmedAboRh` | Confirmed ABO/Rh |
| `label.bbPatient.lastAntibodyScreen` | Latest Antibody Screen |
| `label.bbPatient.activeAlloantibodies` | Active Alloantibodies |
| `label.bbPatient.activeRequirements` | Special Requirements |
| `label.bbPatient.specificity` | Antibody Specificity |
| `label.bbPatient.clinicalSignificance` | Clinical Significance |
| `label.bbPatient.identificationMethod` | Identification Method |
| `label.bbPatient.dateIdentified` | Date Identified |
| `label.bbPatient.requirementType` | Requirement Type |
| `label.bbPatient.clinicalIndication` | Clinical Indication |
| `label.bbPatient.orderingClinician` | Ordering Clinician |
| `label.bbPatient.reactionCategory` | Reaction Category |
| `label.bbPatient.onsetTime` | Onset Time |
| `label.bbPatient.workupNote` | Workup Note |
| `label.bbPatient.status.confirmed` | Confirmed |
| `label.bbPatient.status.unconfirmed` | Unconfirmed |
| `label.bbPatient.status.discordant` | Discordant |
| `label.bbPatient.status.discordanceAcknowledged` | Discordance Acknowledged |
| `button.bbPatient.addAlloantibody` | Add Alloantibody |
| `button.bbPatient.editAlloantibody` | Edit |
| `button.bbPatient.addRequirement` | Add Requirement |
| `button.bbPatient.deactivate` | Deactivate |
| `button.bbPatient.flagReaction` | Flag Reaction |
| `button.bbPatient.save` | Save |
| `button.bbPatient.cancel` | Cancel |
| `message.bbPatient.noHistory` | No blood bank history on file for this patient. |
| `message.bbPatient.saveSuccess` | Record updated successfully. |
| `message.bbPatient.requirementDeactivated` | Special requirement deactivated. |
| `message.bbPatient.reactionFlagged` | Transfusion reaction flagged. Workup note recorded. |
| `message.bbPatient.deactivateConfirm` | Are you sure you want to deactivate this special requirement? |
| `message.bbPatient.antibodyScreenPositive` | This patient has a positive antibody screen on record. Review alloantibody profile before issuing blood. |
| `message.bbPatient.aboDiscordance` | ABO/Rh discordance detected. Supervisor review required before issuing blood. |
| `message.bbPatient.aboDiscordanceAcknowledged` | ABO/Rh discordance acknowledged. Using most recent validated type. |
| `message.bbPatient.reactionHistory` | This patient has a flagged transfusion reaction. Review issuance log. |
| `message.bbPatient.unconfirmedAboRh` | ABO/Rh type requires confirmation from a second sample. |
| `message.bbPatient.tier2Disabled` | This section is not enabled for this installation. |
| `error.bbPatient.specificityRequired` | Antibody specificity is required. |
| `error.bbPatient.significanceRequired` | Clinical significance is required. |
| `error.bbPatient.methodRequired` | Identification method is required. |
| `error.bbPatient.requirementTypeRequired` | Requirement type is required. |
| `error.bbPatient.reactionCategoryRequired` | Reaction category is required. |
| `error.bbPatient.onsetTimeRequired` | Onset time is required. |
| `error.bbPatient.deactivationReasonRequired` | Deactivation reason is required. |

---

## 12. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| antibody.specificity | Required, max 100 chars | `error.bbPatient.specificityRequired` |
| antibody.clinicalSignificance | Required | `error.bbPatient.significanceRequired` |
| antibody.identificationMethod | Required | `error.bbPatient.methodRequired` |
| requirement.requirementType | Required | `error.bbPatient.requirementTypeRequired` |
| requirement.deactivationReason | Required on deactivation | `error.bbPatient.deactivationReasonRequired` |
| reaction.reactionCategory | Required | `error.bbPatient.reactionCategoryRequired` |
| reaction.onsetTime | Required | `error.bbPatient.onsetTimeRequired` |
| reaction.workupNote | Max 500 chars | — |

---

## 13. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Blood Bank tab | `bloodbank.patient.view` | Tab not shown |
| Add/edit alloantibody entries | `bloodbank.patient.antibody.modify` | Add/Edit buttons hidden; API returns 403 |
| Add/deactivate special requirements (Tier 2) | `bloodbank.patient.requirements.modify` | Buttons hidden; API returns 403 |
| Flag transfusion reaction (Tier 2) | `bloodbank.patient.reaction.record` | Flag button hidden; API returns 403 |

---

## 14. Acceptance Criteria

### Functional — Tier 1

- [ ] Patient Blood Bank Record created automatically on first blood bank order or validated blood bank result
- [ ] Blood Bank tab visible only to users with `bloodbank.patient.view`; hidden otherwise
- [ ] Header shows confirmed ABO/Rh with Confirmed / Unconfirmed / Discordant Tag
- [ ] ABO/Rh confirmation requires two concordant results from distinct accession numbers
- [ ] Discordance alert appears when validated ABO/Rh results from distinct accessions disagree
- [ ] Antibody screen positive alert appears in header when any validated screen is positive
- [ ] High-significance alloantibodies appear as header alerts
- [ ] ABO/Rh and antibody screen history sections are read-only, populated from validated results
- [ ] User with `bloodbank.patient.antibody.modify` can add alloantibody via inline form
- [ ] Alloantibody entries editable via inline expansion; deletion not permitted
- [ ] Unit issuance log populated automatically by Spec 4; no manual entries
- [ ] Empty state shown when patient has no blood bank history

### Functional — Tier 2

- [ ] Special Requirements and Reaction Flagging sections are hidden by default
- [ ] Blood Bank Admin can enable/disable each Tier 2 section independently via Program Settings
- [ ] When Special Requirements enabled: add, view, and deactivate requirements with reason
- [ ] Active requirements appear in record header when Tier 2 enabled
- [ ] When Reaction Flagging enabled: user with `bloodbank.patient.reaction.record` can flag reaction against issuance log entry
- [ ] Flagged entries show "Reaction Flagged" Tag in issuance log
- [ ] Reaction history header alert appears when any flag exists
- [ ] Tier 2 API endpoints return 404 when section is disabled

### Non-Functional

- [ ] All UI strings use i18n keys
- [ ] Record loads within 2 seconds
- [ ] Works on screens 1280px wide and above
- [ ] Write operations enforced at API layer

### Integration

- [ ] ABO/Rh history populated from validated results — no manual entry required
- [ ] `/compatibility-profile` endpoint provides Tier 1 data (and Tier 2 if enabled) to Spec 3
- [ ] Active High-significance alloantibodies correctly filter crossmatch pool in Spec 3
- [ ] Active special requirements (Tier 2) correctly filter crossmatch pool in Spec 3
- [ ] Issuance log entries created by Spec 4 appear in real time

---

## Appendix: Design Rationale

**Why the two-tier split?** OpenELIS is deployed globally, including in settings without an EMR. In those settings the lab is the system of record for everything. In integrated environments, the EMR handles clinical data and the lab handles lab data. A single hard-coded feature set would be either over-built for integrated sites or under-built for standalone sites. The configurable Tier 2 satisfies both without adding complexity to the core.

**Why is the reaction record a lightweight flag rather than full clinical documentation?** The blood bank role in a transfusion reaction is to investigate (perform a clerical check, repeat compatibility testing, check for hemolysis). The clinical role is to manage the patient. A workup note tied to the issuance record is sufficient for the lab's purposes. Full clinical documentation of severity, management, and hemovigilance reporting belongs in the EMR or a dedicated hemovigilance system.

---

*FRS paired with: `patient-blood-bank-record-mockup.jsx`*
*Part of: Blood Banking Module — Phase 1, Spec 2 of 5*
