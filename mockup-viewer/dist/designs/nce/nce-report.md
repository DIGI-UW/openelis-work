# Non-Conformity Report
## Functional Requirements Specification

**Document Version:** 3.0  
**Date:** February 18, 2026  
**Author:** Casey Iiams-Hauser  
**Mockup Reference:** `nce-modal-linking.jsx`

---

## Related Documents

| Document | Scope |
|----------|-------|
| **NCE Dashboard & CAPA Management FRS** | Navigation, NCE list views, CAPA workflow, batch actions |
| **NCE Results Entry Integration FRS** | Inline NCE form, delta check alerts, trigger integration |
| **NCE Analytics FRS** | KPI dashboard, trend charts, reports, export |

---

## 1. Overview

This specification defines the Non-Conformity Report — the form and workflows for creating, classifying, and linking Non-Conformity Events (NCEs). It covers the data model, category taxonomy, severity classification, sample/result linking, rejection/cancellation trigger integration, and administrative configuration.

### 1.1 Purpose

- Capture and document all non-conformity events across the laboratory workflow
- Ensure every rejection, cancellation, and nullification action is recorded as a quality event
- Provide a consistent, configurable taxonomy for classifying quality issues
- Link NCEs to affected samples, results, orders, referrals, and QC violations
- Support both manual and trigger-generated NCE creation

### 1.2 Scope

This system replaces the existing "Non Conformity" menu item and integrates with:

- Sample Reception (specimen rejection/issues)
- Results Entry (result-related NCEs)
- Result Validation (validation rejections and retests)
- Order Entry / Modification (test and order cancellations)
- Referral Management (referral result rejections)
- Pathology / Cytology / IHC Workflows (case rejections)
- Specimen Storage & Disposal (premature disposal)
- Westgard QC Module (QC violation → result invalidation)

### 1.3 i18n Requirement

All user-facing text — including labels, messages, prompts, confirmation dialogs, rejection reasons, category/subcategory names, severity labels, status labels, admin configuration text, form field labels, and button text — MUST be externalized to resource bundles for multi-language (i18n) support.

---

## 2. Non-Conformity Types

### 2.1 Category Structure

NCEs are classified into four primary categories, each with specific subcategories.

#### Pre-Analytical

Issues occurring before testing begins.

| Subcategory | Description | Trigger Source | Tag |
|---|---|---|---|
| Specimen Collection | Incorrect collection technique, wrong tube type | Manual | `label.nce.subcategory.specimenCollection` |
| Specimen Labeling | Missing/incorrect labels, patient ID mismatch | Sample Reception | `label.nce.subcategory.specimenLabeling` |
| Specimen Transport | Temperature excursion, delayed transport | Manual | `label.nce.subcategory.specimenTransport` |
| Specimen Integrity | Hemolysis, lipemia, clotting, insufficient quantity | Sample Reception | `label.nce.subcategory.specimenIntegrity` |
| Container Issue | Wrong tube type, leaking | Sample Reception | `label.nce.subcategory.containerIssue` |
| Order Entry | Incorrect test ordered, missing clinical info | Manual | `label.nce.subcategory.orderEntry` |

Tag for category: `label.nce.category.preAnalytical`

#### Analytical

Issues during the testing process.

| Subcategory | Description | Trigger Source | Tag |
|---|---|---|---|
| Equipment Malfunction | Instrument failure, calibration issues | Manual (link to Westgard) | `label.nce.subcategory.equipmentMalfunction` |
| QC Failure | Control results out of range | Link from Westgard | `label.nce.subcategory.qcFailure` |
| Reagent Issue | Expired reagent, lot failure, contamination | Manual | `label.nce.subcategory.reagentIssue` |
| Testing Error | Procedural deviation, incorrect method | Results Entry | `label.nce.subcategory.testingError` |
| Result Discrepancy | Delta check failure, unexpected result | Results Entry (prompt) | `label.nce.subcategory.resultDiscrepancy` |
| Result Nullification | Entered results discarded due to cancellation or invalidation | Order Modification, Westgard | `label.nce.subcategory.resultNullification` |

Tag for category: `label.nce.category.analytical`

#### Post-Analytical

Issues after testing is complete.

| Subcategory | Description | Trigger Source | Tag |
|---|---|---|---|
| Reporting Error | Incorrect result reported, wrong patient | Validation | `label.nce.subcategory.reportingError` |
| Transcription Error | Data entry mistake | Validation | `label.nce.subcategory.transcriptionError` |
| Result Delay | TAT exceeded, delayed reporting | Manual / Automated | `label.nce.subcategory.resultDelay` |
| Interpretation Error | Incorrect clinical interpretation | Validation | `label.nce.subcategory.interpretationError` |
| Referral Result Rejection | Results from reference laboratory rejected | Referral Management | `label.nce.subcategory.referralResultRejection` |

Tag for category: `label.nce.category.postAnalytical`

#### Administrative

Process and documentation issues.

| Subcategory | Description | Trigger Source | Tag |
|---|---|---|---|
| Documentation Gap | Missing records, incomplete forms | Manual | `label.nce.subcategory.documentationGap` |
| Process Deviation | SOP not followed | Manual | `label.nce.subcategory.processDeviation` |
| Communication Failure | Notification not sent, miscommunication | Manual | `label.nce.subcategory.communicationFailure` |
| Training Issue | Competency gap identified | Manual | `label.nce.subcategory.trainingIssue` |
| Test Cancellation | Individual test removed from active order | Order Modification | `label.nce.subcategory.testCancellation` |
| Order Cancellation | Entire order cancelled | Order Entry/Modification | `label.nce.subcategory.orderCancellation` |
| Specimen Disposal | Premature specimen disposal before testing complete | Storage/Disposal | `label.nce.subcategory.specimenDisposal` |

Tag for category: `label.nce.category.administrative`

### 2.2 Severity Classification

| Severity | Definition | Response Time | Examples | Tag |
|---|---|---|---|---|
| **Critical** | Patient safety risk, regulatory violation | Immediate (< 24 hrs) | Wrong result reported, critical value not communicated, missing label | `label.nce.severity.critical` |
| **Major** | Significant impact on quality or operations | 48–72 hours | QC failure affecting patient results, equipment down, hemolyzed sample | `label.nce.severity.major` |
| **Minor** | Limited impact, easily corrected | 7 days | Documentation gap, minor labeling issue, clinician-cancelled order | `label.nce.severity.minor` |

### 2.3 Root Cause Categories

| Category | Description | Example | Tag |
|---|---|---|---|
| Human Error | Procedural deviation, transcription mistake | Tech selected wrong test | `label.nce.rootCause.humanError` |
| Equipment Failure | Instrument malfunction, calibration drift | Analyzer pump failure | `label.nce.rootCause.equipmentFailure` |
| Reagent/Supply Issue | Expired, contaminated, or defective materials | Reagent lot out of spec | `label.nce.rootCause.reagentIssue` |
| Process Gap | SOP inadequate or missing | No procedure for edge case | `label.nce.rootCause.processGap` |
| Training Deficiency | Competency gap, inadequate training | New hire not trained | `label.nce.rootCause.trainingDeficiency` |
| Environmental | Temperature, humidity, power issues | Refrigerator excursion | `label.nce.rootCause.environmental` |
| Specimen Issue | Pre-analytical sample problems | Wrong tube type | `label.nce.rootCause.specimenIssue` |
| External/Vendor | Third-party issue | Courier delayed delivery | `label.nce.rootCause.externalVendor` |
| Other | Does not fit categories (requires description) | — | `label.nce.rootCause.other` |

---

## 3. Data Model

### 3.1 Database Schema

```sql
-- Non-Conformity Event
nce_event (
  id                    SERIAL PRIMARY KEY,
  nce_number            VARCHAR(20) UNIQUE NOT NULL,  -- Auto-generated: NCE-YYYYMMDD-XXXX

  -- Classification
  category              VARCHAR(50) NOT NULL,         -- pre_analytical, analytical, post_analytical, administrative
  subcategory           VARCHAR(50) NOT NULL,
  severity              VARCHAR(20) NOT NULL,         -- critical, major, minor

  -- Description
  title                 VARCHAR(200),                 -- Optional
  description           TEXT,                         -- Optional
  immediate_action      TEXT,

  -- Status & Workflow
  status                VARCHAR(30) NOT NULL DEFAULT 'open',
  -- Statuses: open, acknowledged, under_investigation, corrective_action,
  --           closed_pending_verification, closed_verified, closed_recurrence

  -- Assignment
  assigned_to           INTEGER REFERENCES systemuser(id),
  assigned_by           INTEGER REFERENCES systemuser(id),
  assigned_date         TIMESTAMP,

  -- Dates
  occurrence_date       TIMESTAMP NOT NULL,
  detection_date        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledged_date     TIMESTAMP,
  investigation_start   TIMESTAMP,
  investigation_end     TIMESTAMP,
  closure_date          TIMESTAMP,
  verification_due_date DATE,
  verified_date         TIMESTAMP,

  -- Root Cause (populated during investigation)
  root_cause_category   VARCHAR(50),
  root_cause_details    TEXT,

  -- Source tracking
  source_type           VARCHAR(30),                  -- manual, sample_reception, results_entry, validation,
                                                      -- order_modification, referral, pathology, westgard, disposal
  source_reference_id   INTEGER,

  -- Trigger tracking
  trigger_type          VARCHAR(30),                  -- mandatory, prompted, manual
  trigger_action        VARCHAR(50),                  -- sample_rejection, result_rejection_retest,
                                                      -- result_rejection_no_retest, test_cancellation,
                                                      -- order_cancellation, referral_rejection,
                                                      -- case_rejection, qc_invalidation, premature_disposal
  prompt_dismissed      BOOLEAN DEFAULT FALSE,

  -- Reporter
  reported_by           INTEGER REFERENCES systemuser(id) NOT NULL,

  -- Audit
  created_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified_by      INTEGER REFERENCES systemuser(id)
);

-- NCE Links to Samples
nce_sample_link (
  id                    SERIAL PRIMARY KEY,
  nce_id                INTEGER REFERENCES nce_event(id) NOT NULL,
  sample_id             INTEGER REFERENCES sample(id) NOT NULL,
  lab_number            VARCHAR(30),
  link_type             VARCHAR(30),                  -- affected, related
  created_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NCE Links to Results
nce_result_link (
  id                    SERIAL PRIMARY KEY,
  nce_id                INTEGER REFERENCES nce_event(id) NOT NULL,
  result_id             INTEGER REFERENCES result(id) NOT NULL,
  test_name             VARCHAR(100),
  result_value          VARCHAR(200),                 -- Captured at time of linking for nullified results
  link_type             VARCHAR(30),                  -- affected, related, nullified
  created_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NCE Links to Westgard Violations
nce_westgard_link (
  id                    SERIAL PRIMARY KEY,
  nce_id                INTEGER REFERENCES nce_event(id) NOT NULL,
  westgard_violation_id INTEGER NOT NULL,
  link_type             VARCHAR(30),                  -- triggered_by, related
  created_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NCE Links to Referrals
nce_referral_link (
  id                    SERIAL PRIMARY KEY,
  nce_id                INTEGER REFERENCES nce_event(id) NOT NULL,
  referral_id           INTEGER NOT NULL,
  referring_lab_name    VARCHAR(200),
  link_type             VARCHAR(30),                  -- affected
  created_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAPA (Corrective and Preventive Actions)
nce_capa (
  id                    SERIAL PRIMARY KEY,
  nce_id                INTEGER REFERENCES nce_event(id) NOT NULL,

  capa_type             VARCHAR(20) NOT NULL,         -- corrective, preventive, both
  capa_category         VARCHAR(50),                  -- training, process_change, equipment, documentation, other
  description           TEXT NOT NULL,

  assigned_to           INTEGER REFERENCES systemuser(id),
  due_date              DATE,

  status                VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, in_progress, completed

  resolution_notes      TEXT,
  completed_date        TIMESTAMP,
  completed_by          INTEGER REFERENCES systemuser(id),

  created_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by            INTEGER REFERENCES systemuser(id) NOT NULL
);

-- Effectiveness Review
nce_effectiveness_review (
  id                    SERIAL PRIMARY KEY,
  nce_id                INTEGER REFERENCES nce_event(id) NOT NULL,

  review_date           TIMESTAMP NOT NULL,
  reviewed_by           INTEGER REFERENCES systemuser(id) NOT NULL,

  effective             BOOLEAN NOT NULL,
  evidence              TEXT NOT NULL,

  recurrence_nce_id     INTEGER REFERENCES nce_event(id),

  notes                 TEXT,
  created_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NCE Notes/Comments
nce_note (
  id                    SERIAL PRIMARY KEY,
  nce_id                INTEGER REFERENCES nce_event(id) NOT NULL,

  note_type             VARCHAR(20) NOT NULL,         -- comment, status_change, assignment, escalation, prompt_dismissed
  note_text             TEXT NOT NULL,

  created_by            INTEGER REFERENCES systemuser(id) NOT NULL,
  created_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NCE Attachments
nce_attachment (
  id                    SERIAL PRIMARY KEY,
  nce_id                INTEGER REFERENCES nce_event(id) NOT NULL,

  file_name             VARCHAR(255) NOT NULL,
  file_type             VARCHAR(50),
  file_size             INTEGER,
  file_path             VARCHAR(500) NOT NULL,

  description           TEXT,

  uploaded_by           INTEGER REFERENCES systemuser(id) NOT NULL,
  uploaded_date         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full Audit Trail
nce_audit_log (
  id                    SERIAL PRIMARY KEY,
  nce_id                INTEGER REFERENCES nce_event(id) NOT NULL,

  action                VARCHAR(50) NOT NULL,         -- created, updated, status_changed, assigned,
                                                      -- prompt_dismissed, auto_generated, etc.
  field_name            VARCHAR(100),
  old_value             TEXT,
  new_value             TEXT,

  performed_by          INTEGER REFERENCES systemuser(id) NOT NULL,
  performed_date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  ip_address            VARCHAR(50),
  user_agent            TEXT
);

-- Rejection Reason → NCE Mapping Configuration
nce_rejection_reason_mapping (
  id                    SERIAL PRIMARY KEY,
  rejection_reason_id   INTEGER NOT NULL,
  rejection_reason_name VARCHAR(200) NOT NULL,
  nce_category          VARCHAR(50) NOT NULL,
  nce_subcategory       VARCHAR(50) NOT NULL,
  default_severity      VARCHAR(20) NOT NULL,
  is_active             BOOLEAN DEFAULT TRUE,
  created_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NCE Trigger Configuration
nce_trigger_config (
  id                    SERIAL PRIMARY KEY,
  trigger_action        VARCHAR(50) NOT NULL UNIQUE,
  trigger_behavior      VARCHAR(20) NOT NULL,         -- mandatory, prompted, disabled
  default_category      VARCHAR(50),
  default_subcategory   VARCHAR(50),
  default_severity      VARCHAR(20),
  is_active             BOOLEAN DEFAULT TRUE,
  created_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Indexes

```sql
CREATE INDEX idx_nce_status ON nce_event(status);
CREATE INDEX idx_nce_assigned_to ON nce_event(assigned_to);
CREATE INDEX idx_nce_category ON nce_event(category);
CREATE INDEX idx_nce_severity ON nce_event(severity);
CREATE INDEX idx_nce_occurrence_date ON nce_event(occurrence_date);
CREATE INDEX idx_nce_verification_due ON nce_event(verification_due_date);
CREATE INDEX idx_nce_trigger_action ON nce_event(trigger_action);
CREATE INDEX idx_nce_source_type ON nce_event(source_type);
CREATE INDEX idx_nce_capa_status ON nce_capa(status);
CREATE INDEX idx_nce_capa_assigned ON nce_capa(assigned_to);
CREATE INDEX idx_nce_audit_nce_id ON nce_audit_log(nce_id);
CREATE INDEX idx_nce_rejection_mapping ON nce_rejection_reason_mapping(rejection_reason_id);
```

### 3.3 NCE Number Format

Auto-generated: `NCE-YYYYMMDD-XXXX`

- `YYYY` — 4-digit year
- `MM` — 2-digit month
- `DD` — 2-digit day
- `XXXX` — 4-digit sequential counter per day (resets daily, starts at 0001)

---

## 4. NCE Recording

### 4.1 Generation Modes

Each rejection, cancellation, or quality event falls into one of two behavior modes:

**Mandatory NCE:** The system opens the NCE form when the triggering action occurs. The user cannot complete the triggering action without submitting an NCE. Dismissing or cancelling the form cancels the triggering action.

**Prompted NCE:** The system displays an NCE prompt after the triggering action completes. The user decides whether to record an NCE. The user can dismiss the prompt and proceed. If dismissed, the audit trail records the dismissal with user, timestamp, and context.

The behavior for each trigger is configurable by administrators (Section 9).

### 4.2 Manual Recording (Report NCE)

Accessible from NCE → Report NCE in the sidebar.

#### Form Layout

The Report NCE form is a full-page form (not a modal) within the NCE content area.

**Page Header:**
```
NCE  ›  Report NCE

📋 Report Non-Conformity Event
```

| Element | Tag |
|---------|-----|
| Page title | `label.nce.reportNce.title` |
| Breadcrumb | `label.breadcrumb.nce` › `label.menu.nce.reportNce` |

#### Form Fields

| Field | Required | Type | Tag |
|-------|----------|------|-----|
| Category | Yes | Dropdown | `label.nce.field.category` |
| Subcategory | Yes | Dropdown (filtered by category) | `label.nce.field.subcategory` |
| Severity | Yes | Radio cards (Critical / Major / Minor) | `label.nce.field.severity` |
| Title | No | Text input (200 char max) | `label.nce.field.title` |
| Description | No | Textarea | `label.nce.field.description` |
| Immediate Action Taken | No | Textarea | `label.nce.field.immediateAction` |
| Attachments | No | File upload (multi) | `label.nce.field.attachments` |

#### Form Actions

| Button | Style | Tag |
|--------|-------|-----|
| Cancel | Ghost (text) | `label.button.cancel` |
| Submit NCE | Primary (teal bg) | `label.nce.action.submitNce` |

### 4.3 Sample / Result Linking

The Report NCE form includes a "Link to Samples / Results" section with hierarchical order search.

#### Search

| Element | Description | Tag |
|---------|-------------|-----|
| Search input | Typeahead search by Lab Number, Patient ID, or Patient Name | `label.nce.linking.search` |
| Placeholder | "Search by Lab #, Patient ID, or Name..." | `label.nce.linking.searchPlaceholder` |

#### Order / Sample / Result Tree

After selecting an order from search results, the linked items display as a hierarchical tree:

```
┌─ DEV01260000000123 — Smith, John (3456789) ──────────────── [✕ Remove] ─┐
│ ☑ 🧪 Serum — Chemistry Panel (collected 01/05/2026 08:30)               │
│     ☑ Potassium — 6.8 mmol/L ⚠ Critical High                           │
│     ☑ Sodium — 142 mEq/L                                                │
│     ☑ Chloride — 101 mEq/L                                              │
│ ☐ 🧪 Whole Blood — CBC (collected 01/05/2026 08:30)                     │
│     ☐ Hemoglobin — 14.2 g/dL                                            │
│     ☐ WBC — 8.5 x10³/µL                                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

**Tree Behavior:**

| Behavior | Description |
|----------|-------------|
| Parent auto-select | Checking a sample item (parent) auto-selects all child results |
| Child deselect | Individual results can be unchecked while keeping the parent sample checked |
| Child select | Checking a result automatically checks its parent sample |
| Multiple orders | Multiple orders can be linked to a single NCE (add via search) |
| Remove | "✕ Remove" button detaches the entire order from the NCE |

**Linked item tags:**

| Element | Tag |
|---------|-----|
| Remove button | `label.nce.linking.remove` |
| Sample icon label | `label.nce.linking.sample` |
| Result icon label | `label.nce.linking.result` |

### 4.4 Contextual Recording — Sample Reception

When triggered from Sample Reception, the NCE form is contextually pre-populated:

**Pre-populated fields:**
- Context banner with sample info (lab number, tests, patient, received date)
- Category: "Pre-Analytical" (user can change)
- Sample auto-linked

**Issue Type Radio Selection (replaces Subcategory dropdown for Sample Reception context):**

| Option | Maps to Subcategory | Tag |
|--------|---------------------|-----|
| Specimen Labeling | specimen_labeling | `label.nce.sampleIssue.labeling` |
| Specimen Integrity | specimen_integrity | `label.nce.sampleIssue.integrity` |
| Specimen Transport | specimen_transport | `label.nce.sampleIssue.transport` |
| Container Issue | container_issue | `label.nce.sampleIssue.container` |
| Other | (user selects subcategory) | `label.nce.sampleIssue.other` |

**Reject Sample Checkbox:**

| Element | Description | Tag |
|---------|-------------|-----|
| Checkbox | "Reject Sample" — when checked, sample status set to Rejected and pending tests cancelled | `label.nce.sampleAction.rejectSample` |
| Helper text | "When checked, sample status will be set to 'Rejected' and tests cancelled." | `label.nce.sampleAction.rejectSample.help` |

**Mandatory behavior:** The user CANNOT complete a sample rejection without submitting the NCE. Dismissing the form cancels the rejection action.

---

## 5. Rejection & Cancellation Integration

### 5.1 Comprehensive Trigger Map

| # | Trigger Point | Screen/Workflow | Default Behavior | Escalation |
|---|---|---|---|---|
| 1 | Sample rejection at reception | Sample Reception | Mandatory | — |
| 2 | Partial sample item rejection | Sample Reception | Mandatory | — |
| 3 | Result rejection with retest | Validation | Prompted | — |
| 4 | Result rejection without retest | Validation | Mandatory | — |
| 5 | Individual test cancellation (no results entered) | Order Modification | Prompted | → Mandatory if results exist (#6) |
| 6 | Test cancellation after results entered | Order Modification | Mandatory | — |
| 7 | Order-level cancellation | Order Entry/Modification | Prompted | → Mandatory if any results exist |
| 8 | Referral result rejection | Referral Management | Mandatory | — |
| 9 | Pathology/Cytology/IHC case rejection | Pathology Workflows | Prompted | → Mandatory for "unsatisfactory specimen" |
| 10 | QC-triggered result invalidation | Westgard/QC | Mandatory | — |
| 11 | Premature specimen disposal | Storage/Disposal | Prompted (only if pending tests) | — |

### 5.2 Trigger Details

#### Trigger #1: Sample Rejection at Reception

**Current:** Reject button on Sample Reception screen with selectable rejection reasons.

**NCE behavior:** Mandatory — NCE form opens with "Reject Sample" pre-checked. Existing rejection reason maps to NCE subcategory via rejection reason mapping. Dismissing cancels the rejection.

**Pre-populated:** Sample context, all tests as affected items, Category = Pre-Analytical, Severity = Major.

#### Trigger #2: Partial Sample Item Rejection

**Current:** Users reject individual sample items while accepting others.

**NCE behavior:** Mandatory — NCE links only to rejected sample item(s) and their tests. Accepted items are NOT linked.

**Pre-populated:** Affected sample items and tests, Category = Pre-Analytical, Severity = Major.

#### Trigger #3: Result Rejection with Retest

**Current:** Supervisor rejects results during validation and sends for retesting.

**NCE behavior:** Prompted — prompt appears after rejection completes. User can dismiss.

**Pre-populated:** Rejected result, test, method, rejection reason, Category = Analytical.

**Dismissal:** Confirmation dialog: "No NCE will be recorded for this rejection. Continue?" — Tag: `label.nce.trigger.dismissConfirm`

**Linking:** Both original rejected result AND new retest order are linked.

#### Trigger #4: Result Rejection Without Retest

**Current:** Validator rejects a result without ordering retest (nullification).

**NCE behavior:** Mandatory — form opens and cannot be dismissed.

**Pre-populated:** Result value, rejection reason, Category = Analytical, Severity = Major.

**Grouping:** Multiple results rejected without retest in same session should be grouped into a single NCE (user can split). Tag: `label.nce.trigger.groupOffer`

#### Trigger #5: Individual Test Cancellation — No Results

**Current:** Tests cancelled/removed from active order before results entered.

**NCE behavior:** Prompted — cancellation proceeds regardless.

**Pre-populated:** Linked order and cancelled test, Category = Administrative, Subcategory = Test Cancellation.

**Escalation:** If results had been entered, escalates to Mandatory (Trigger #6).

#### Trigger #6: Test Cancellation After Results Entered

**Current:** Test cancelled after results entered but not validated. Results nullified.

**NCE behavior:** Mandatory.

**Pre-populated:** Nullified result value, Category = Analytical or Administrative (user selects).

**Data preservation:** Nullified result values MUST be preserved in `nce_result_link.result_value`.

#### Trigger #7: Order-Level Cancellation

**Current:** Entire order cancelled, cancelling all samples and tests.

**NCE behavior:** Prompted (escalates to Mandatory if any results exist).

**Pre-populated:** All samples and tests listed, Category = Administrative, Subcategory = Order Cancellation.

#### Trigger #8: Referral Result Rejection

**Current:** Receiving lab rejects results returned from reference laboratory.

**NCE behavior:** Mandatory.

**Pre-populated:** Referring lab name, referral ID, rejected result and test, Category = Post-Analytical, Subcategory = Referral Result Rejection, Severity = Major.

**Linking:** Links to referral record and sample/test. Captures whether re-referral or in-house retest initiated.

#### Trigger #9: Pathology / Cytology / IHC Case Rejection

**Current:** Cases rejected at various stages in pathology workflows.

**NCE behavior:** Prompted (escalates to Mandatory for "unsatisfactory specimen" or "inadequate for diagnosis").

**Pre-populated:** Case ID, specimen type, workflow stage, rejection reason, Category = Pre-Analytical (specimen) or Analytical (processing).

**Note:** Standard case revisions (amended diagnoses) do NOT trigger NCE prompts unless the original diagnosis was clinically significant and the revision indicates an error.

#### Trigger #10: QC-Triggered Result Invalidation

**Current:** Westgard rule violation detected, patient results in affected batch invalidated.

**NCE behavior:** Mandatory — auto-generated when patient results invalidated due to QC failure.

**Pre-populated:** Westgard violation record, all affected patient results, instrument/method, Category = Analytical, Subcategory = QC Failure.

**Severity auto-mapping:**

| Westgard Rule | Default Severity |
|---|---|
| 1-2s (warning) | Minor |
| 1-3s | Major |
| 2-2s | Major |
| R-4s | Critical |
| 4-1s | Major |
| 10x | Major |

**Patient tracking:** NCE lists all patients whose results were affected.

#### Trigger #11: Premature Specimen Disposal

**Current:** Specimens disposed with reason, method, and notes.

**NCE behavior:** Prompted — only if tests are still pending. If all tests completed, disposal proceeds without prompt.

**Pre-populated:** Sample info, disposal reason, pending tests, Category = Administrative, Subcategory = Specimen Disposal.

### 5.3 Rejection Reason → NCE Mapping

Existing OpenELIS rejection reasons map to NCE categories and subcategories. Administrators can customize via Admin → NCE Configuration → Rejection Reason Mapping.

| Rejection Reason | NCE Category | NCE Subcategory | Default Severity |
|---|---|---|---|
| Hemolyzed sample | Pre-Analytical | Specimen Integrity | Major |
| Lipemic sample | Pre-Analytical | Specimen Integrity | Major |
| Clotted sample | Pre-Analytical | Specimen Integrity | Major |
| Quantity not sufficient (QNS) | Pre-Analytical | Specimen Integrity | Major |
| Wrong tube type / container | Pre-Analytical | Container Issue | Major |
| Leaking container | Pre-Analytical | Container Issue | Critical |
| Missing label | Pre-Analytical | Specimen Labeling | Critical |
| Incorrect label / patient mismatch | Pre-Analytical | Specimen Labeling | Critical |
| Damaged in transport | Pre-Analytical | Specimen Transport | Major |
| Temperature excursion | Pre-Analytical | Specimen Transport | Major |
| Expired sample | Pre-Analytical | Specimen Transport | Major |
| Duplicate order | Administrative | Order Entry | Minor |
| Clinician-cancelled | Administrative | Order Cancellation | Minor |

New rejection reasons MUST be mapped before they appear in the rejection workflow.

### 5.4 Screens Requiring Modification

| Screen | Modification | Tag |
|---|---|---|
| Sample Reception | "Report NCE" replaces "Reject" button | `label.sampleReception.reportNce` |
| Order Entry / Modification | Add NCE prompt on test and order cancellation | `label.orderMod.ncePrompt` |
| Result Validation | Add NCE prompt/mandatory form on result rejection | `label.validation.ncePrompt` |
| Referral Management | Add mandatory NCE form on referral result rejection | `label.referral.ncePrompt` |
| Pathology Dashboard | Add NCE prompt on case rejection | `label.pathology.ncePrompt` |
| Cytology Dashboard | Add NCE prompt on unsatisfactory specimen | `label.cytology.ncePrompt` |
| IHC Dashboard | Add NCE prompt on case rejection | `label.ihc.ncePrompt` |
| Specimen Storage/Disposal | Add NCE prompt on disposal with pending tests | `label.disposal.ncePrompt` |
| Westgard QC Module | Auto-generate NCE on patient result invalidation | `label.westgard.nceAutoGen` |

### 5.5 Audit Trail

All NCE generation events are recorded in the audit trail:

| Event | Fields Recorded |
|-------|-----------------|
| NCE created | Trigger source, trigger type (mandatory/prompted/manual), NCE ID, source screen, user, timestamp |
| NCE prompt dismissed | User, timestamp, trigger action, affected item ID, confirmation text |
| NCE auto-generated | Trigger source (e.g., Westgard), violation/event ID, all linked items, user who triggered |

---

## 6. Westgard QC Integration

| Feature | Description |
|---------|-------------|
| Filter | NCE Dashboard shows option to filter by "Linked to QC Violation" |
| Linking | NCE can search and link existing Westgard violations |
| Display | Linked violations show in NCE detail with link to Westgard module |
| Separation | QC violations maintain their own corrective action workflow; NCE provides additional documentation layer |
| Auto-generation | Patient result invalidation due to Westgard violation auto-generates NCE (Trigger #10) |

---

## 7. Integration Points Summary

| Integration | Modification |
|-------------|-------------|
| Sample Reception | "Report NCE" replaces "Reject" button; NCE form with optional rejection |
| Results Entry | "Report NCE" in result row actions; inline NCE form (see Results Entry FRS) |
| Result Validation | NCE prompts on result rejection (see Results Entry FRS) |
| Order Modification | NCE prompts on test/order cancellation |
| Referral Management | Mandatory NCE on referral result rejection |
| Pathology/Cytology/IHC | NCE prompts on case rejection |
| Specimen Storage/Disposal | NCE prompt on disposal with pending tests |
| Westgard QC | Auto-generate NCE on patient result invalidation |
| Alerts Dashboard | Surface overdue NCEs, approaching SLA, effectiveness reviews due, overdue CAPAs, unassigned critical NCEs (see Dashboard FRS) |

---

## 8. API Endpoints

### 8.1 NCE CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nce` | Create new NCE |
| GET | `/api/nce/{id}` | Get NCE details |
| PUT | `/api/nce/{id}` | Update NCE |

### 8.2 Links

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nce/{id}/link/sample` | Link sample to NCE |
| POST | `/api/nce/{id}/link/result` | Link result to NCE |
| POST | `/api/nce/{id}/link/westgard` | Link Westgard violation |
| POST | `/api/nce/{id}/link/referral` | Link referral to NCE |
| DELETE | `/api/nce/{id}/link/{linkType}/{linkId}` | Remove link |

### 8.3 Order Search (for NCE linking)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/search` | Search orders by lab number, patient ID, or patient name |
| GET | `/api/orders/{labNumber}/samples` | Get sample items and results for an order |

### 8.4 Attachments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nce/{id}/attachments` | List attachments |
| POST | `/api/nce/{id}/attachments` | Upload attachment |
| DELETE | `/api/nce/{id}/attachments/{attachmentId}` | Delete attachment |

### 8.5 Configuration (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nce/config/triggers` | Get trigger configurations |
| PUT | `/api/nce/config/triggers/{triggerAction}` | Update trigger behavior |
| GET | `/api/nce/config/rejection-mapping` | Get rejection reason mappings |
| PUT | `/api/nce/config/rejection-mapping/{id}` | Update rejection reason mapping |
| GET | `/api/nce/config/severity-rules` | Get severity auto-assignment rules |
| PUT | `/api/nce/config/severity-rules` | Update severity rules |

---

## 9. Configuration & Administration

### 9.1 NCE Trigger Behavior Configuration

**Location:** Admin → NCE Configuration → Trigger Behavior

Each trigger from Section 5.1 can be individually configured:

| Behavior | Description | Tag |
|----------|-------------|-----|
| Mandatory | NCE form cannot be dismissed; triggering action blocked without NCE | `label.admin.nce.trigger.mandatory` |
| Prompted | NCE form shown but can be dismissed; action proceeds either way | `label.admin.nce.trigger.prompted` |
| Disabled | No NCE prompt; action proceeds without NCE interaction | `label.admin.nce.trigger.disabled` |

### 9.2 Rejection Reason Mapping

**Location:** Admin → NCE Configuration → Rejection Reason Mapping

Interface to map each rejection reason to an NCE subcategory and default severity. New rejection reasons must be mapped before they appear in the rejection workflow.

| Column | Description | Tag |
|--------|-------------|-----|
| Rejection Reason | Existing rejection reason name (read-only) | `label.admin.nce.rejectionMapping.reason` |
| NCE Category | Mapped category | `label.admin.nce.rejectionMapping.category` |
| NCE Subcategory | Mapped subcategory | `label.admin.nce.rejectionMapping.subcategory` |
| Default Severity | Default severity for this reason | `label.admin.nce.rejectionMapping.severity` |
| Active | Enable/disable the mapping | `label.admin.nce.rejectionMapping.active` |

### 9.3 Severity Auto-Assignment Rules

**Location:** Admin → NCE Configuration → Severity Rules

Rules for automatic severity assignment based on trigger type and context.

| Rule Example | Default Severity |
|-------------|-----------------|
| Labeling errors (missing/incorrect label) | Always Critical |
| QNS (quantity not sufficient) | Configurable: Major or Minor |
| Clinician-cancelled order | Minor |
| Leaking container | Critical |

### 9.4 SLA Configuration

**Location:** Admin → NCE Configuration → SLA Settings

Configurable SLA times per severity level for acknowledgment and investigation start. See Dashboard FRS for SLA defaults.

### 9.5 Automatic Prompt Settings

**Location:** Admin → NCE Configuration → Automatic Prompt Settings

Configurable thresholds for automatic NCE prompts in Results Entry:

| Setting | Description | Default | Tag |
|---------|-------------|---------|-----|
| Delta check enabled | Enable delta check alerts | Yes | `label.admin.nce.deltaCheck.enabled` |
| Delta check threshold | Percentage change threshold | 30% | `label.admin.nce.deltaCheck.threshold` |
| Critical value prompt | Prompt when critical value entered | Yes | `label.admin.nce.criticalValue.enabled` |
| Extreme value prompt | Prompt when result > 3× or < 0.3× limits | Yes | `label.admin.nce.extremeValue.enabled` |

---

## 10. Acceptance Criteria

### NCE Recording (Manual)
- [ ] NCE can be created from NCE → Report NCE
- [ ] Category, Subcategory, and Severity are required fields
- [ ] Title and Description are optional
- [ ] NCE number is auto-generated in format NCE-YYYYMMDD-XXXX
- [ ] Attachments can be uploaded during creation
- [ ] All form labels and messages use localization tags

### Sample / Result Linking
- [ ] Typeahead search works for Lab Number, Patient ID, and Patient Name
- [ ] Selected orders display hierarchical tree (Order → Sample → Result)
- [ ] Checking a sample item auto-selects all child results
- [ ] Individual results can be deselected while keeping parent sample checked
- [ ] Checking a result auto-checks its parent sample
- [ ] Multiple orders can be linked to a single NCE
- [ ] "Remove" button detaches entire order

### Rejection & Cancellation Triggers
- [ ] Sample rejection at reception requires mandatory NCE (Trigger #1)
- [ ] Partial sample item rejection requires mandatory NCE (Trigger #2)
- [ ] Result rejection with retest shows prompted NCE (Trigger #3)
- [ ] Result rejection without retest requires mandatory NCE (Trigger #4)
- [ ] Test cancellation (no results) shows prompted NCE (Trigger #5)
- [ ] Test cancellation (results entered) requires mandatory NCE (Trigger #6)
- [ ] Order-level cancellation shows prompted NCE; escalates if results exist (Trigger #7)
- [ ] Referral result rejection requires mandatory NCE (Trigger #8)
- [ ] Pathology/Cytology/IHC case rejection shows prompted NCE; escalates for unsatisfactory (Trigger #9)
- [ ] QC-triggered result invalidation auto-generates mandatory NCE (Trigger #10)
- [ ] Premature specimen disposal with pending tests shows prompted NCE (Trigger #11)
- [ ] For mandatory triggers, dismissing the form cancels the triggering action
- [ ] For prompted triggers, dismissal confirmation dialog is shown
- [ ] Prompted NCE dismissals are recorded in audit trail
- [ ] Multiple results rejected in same session can be grouped into single NCE
- [ ] Existing rejection reasons are mapped to NCE subcategories and severities
- [ ] New rejection reasons cannot be used until mapped

### Westgard Integration
- [ ] Westgard violations can be linked to NCE
- [ ] Linked violations display in NCE detail with navigation link
- [ ] NCE dashboard can filter to show NCEs linked to QC violations
- [ ] Patient result invalidation due to QC failure auto-generates NCE

### Configuration & Administration
- [ ] Admin can configure trigger behavior (mandatory/prompted/disabled) per trigger
- [ ] Admin can map rejection reasons to NCE subcategories and severities
- [ ] Admin can configure severity auto-assignment rules
- [ ] Admin can configure SLA times per severity level
- [ ] Admin can configure automatic prompt thresholds (delta check, critical value, extreme value)

### Audit Trail
- [ ] All field changes logged in nce_audit_log
- [ ] Audit log captures user, timestamp, field, old value, new value
- [ ] NCE prompt dismissals logged with user, timestamp, trigger action, affected item
- [ ] Audit trail cannot be modified or deleted

### i18n
- [ ] All labels, buttons, prompts, category/subcategory names, severity labels, and messages use localization tags
- [ ] No hard-coded English strings in the implementation

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-05 | OpenELIS Implementation Team | Initial draft (combined document) |
| 1.1 | 2026-01-05 | OpenELIS Implementation Team | Updated linking workflow: hierarchical order search, multiselect, optional title/description |
| 2.0 | 2026-02-14 | OpenELIS Implementation Team | Comprehensive rejection/cancellation integration: 11 trigger points, mandatory/prompted behavior, rejection reason mapping, new subcategories, admin configuration |
| 3.0 | 2026-02-18 | OpenELIS Implementation Team | Split into separate FRS. Report NCE is now a full-page form accessed via sidebar submenu (not a modal from Dashboard). Localization tags added for all categories, subcategories, and form elements. Sample Reception contextual form detailed. |

---

*End of Document*
