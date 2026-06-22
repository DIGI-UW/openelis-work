# Cytology Case View — Bethesda 2014 Workflow

**FRS · Version 2.0 · 2026-05-27**
**Supersedes:** `designs/pathology/cytology-case-view.md` (v1.0, December 2025)
**Module:** Cytology → Case Detail View
**Route:** `/CytologyCaseView/:cytologySampleId` *(unchanged from existing route)*
**SideNav:** `Cytology → Dashboard → Case View`
**Breadcrumb:** `Home / Cytology / Dashboard / Case [LabNumber]`
**Role required:** `Cytopathologist` (existing role bundle)

---

## Lab Context

*A developer-onboarding narrative for someone who has never worked in a clinical laboratory. Read this first. It stands on its own — no cross-references to other sections of this spec.*

### Current State

A Pap smear is a cervical cytology test: a clinician swabs cells from a patient's cervix, smears them on a slide (or fixes them in liquid for a ThinPrep cassette), and sends the slide to the lab. In OpenELIS today, a lab tech registers the slide as a `cytology_sample`, prints a barcode label, and routes it to the cytology bench. A cytopathologist (a pathologist with a cervical-cytology subspecialty) opens the slide under a microscope and decides three things: is the slide good enough to interpret, what does it show, and what should the clinician do next. They record their decision in the Cytology Case View screen — which today is a long, free-form page with dropdowns and free-text fields that don't enforce any standard reporting structure. Cytopathologists screen anywhere from 30 to 90 slides per day in busy labs; this is volume work.

The reporting standard for cervical cytology worldwide is the **Bethesda System** (current edition: Bethesda 2014, named after the NIH conference where the terminology was set). Bethesda specifies five required report sections — specimen type, adequacy, general categorization, interpretation, and additional notes — and a fixed vocabulary of finding terms. Outside the United States it is also the WHO-recommended reporting framework. Co-testing with HPV (human papillomavirus DNA test on the same swab) is the standard of care; the HPV result combines with the Pap finding to drive follow-up recommendations published by **ASCCP** (American Society for Colposcopy and Cervical Pathology, the U.S. guideline body).

### Pain

The current OpenELIS Cytology Case View does not enforce Bethesda structure. A cytopathologist can save a case with no general categorization, with squamous-and-glandular findings mixed in one free-text box, with no specimen-type field, and with no recommendation. The result is reports that vary by author, are hard to compare across cases for QA review, and that downstream clinicians have to interpret without a standard structure. Three concrete examples Casey has heard from sites:

1. A cytopathologist marked a case as "Atypical cells, see comment" with no Bethesda category. The clinician downstream had no idea whether to schedule a colposcopy (procedure that examines the cervix with magnification) or a 6-month repeat Pap. The case had to be re-reviewed three weeks later.
2. A clinically significant **HSIL** finding (High-grade Squamous Intraepithelial Lesion — a precancerous change that needs immediate follow-up) was signed out, the clinician never saw the case in their inbox, and the patient was lost to follow-up for 11 months. There is no critical-result acknowledgment on cytology cases today.
3. HPV co-test results live on a separate Analysis attached to the same Sample. The cytopathologist has to open a second tab to look up the HPV result before writing a recommendation. About 1 in 5 cases ships with a recommendation that contradicts the HPV result because the cytopathologist didn't cross-check.

Beyond clinical risk, the existing screen also reinvents data shapes that already exist in the schema (the v1 spec proposed brand-new `CytologyCase` and `CytologyReport` UUID tables on top of the live `cytology_sample`, `cytology_diagnosis`, `cytology_diagnosis_result_map`, `cytology_specimen_adequacy`, and `cytology_report` tables shipping in production today).

### What Changes

After this work ships:

- The cytopathologist opens the Cytology Case View, sees the patient header and slide list at the top, and works through three always-visible sections: **Specimen Adequacy**, **Interpretation** (the Bethesda findings), and **Recommendation**. The system enforces Bethesda 2014: a case cannot be signed out without an adequacy decision, a general categorization (Negative / Epithelial Abnormality / Other), and a recommendation.
- The HPV co-test result, if one exists on the same Sample, appears on the right-hand summary panel as a read-only Tag. No second tab. If the HPV result is pending, the panel shows a pending state.
- When the cytopathologist selects a critical finding (**HSIL**, **HSIL with features suspicious for invasion**, **Squamous Cell Carcinoma**, **AIS** — Adenocarcinoma In Situ, or any **Adenocarcinoma**), the system labels it as a critical result. Sign-out triggers a critical-result event that surfaces in the Alerts Dashboard and requires explicit acknowledgment by the ordering clinician's queue (per the existing global Critical Result Acknowledgment work — see Dependencies below).
- The user enters their own recommendation in a free-text field **first**. Only after they have typed something can they expand the **ASCCP Suggested Recommendation** panel, which shows the guideline-driven suggestion for the combination of cytology + HPV findings. This anti-anchoring sequence is intentional and the FRS calls it out.
- All findings are stored in the existing `cytology_diagnosis_result_map` table (with one new `DiagnosisCategory` enum value to distinguish squamous from glandular epithelial abnormalities; see Data Model). One new table — `cytology_recommendation` — stores the user-entered text plus the system-suggested text plus a `used_system_suggestion` boolean for downstream QA. No invented UUID columns; no duplicate result storage.

A backend developer who has never touched cervical cytology should now know: what the lab does today, what is currently going wrong, and what the workflow looks like after this ships.

---

## Overview

The Cytology Case View is the case-detail screen used by cytopathologists to interpret a Pap smear and sign out a Bethesda 2014 conformant report. This redesign replaces the current free-form screen with a structured, Bethesda-enforced workflow that grounds every UI element in the existing `cytology_sample` / `cytology_diagnosis` schema, integrates HPV co-test results from the existing Analysis pipeline, and hooks critical findings into the global Critical Result Acknowledgment system.

### Navigation & URL

| Item | Value |
|------|-------|
| URL | `/CytologyCaseView/:cytologySampleId` — unchanged from current route (`useParams().cytologySampleId`) |
| SideNav | `Cytology → Dashboard → Case View` — opens from the Cytology Dashboard "in progress" / "awaiting review" lists |
| Breadcrumb | `Home / Cytology / Dashboard / Case [LabNumber]` |
| Page title | `Cytology Case — [LabNumber]` |

### Scope

**In scope (this FRS):** case-detail screen redesign; enforcement of Bethesda 2014 structure; HPV co-test surfacing from sibling Analysis (read-only display only); user + ASCCP recommendation entry with anti-anchoring sequence; critical-result acknowledgment hook for HSIL+ and malignancy findings; sign-out / status transition workflow; FHIR DiagnosticReport export hook (declared but built downstream).

**Out of scope (parked for future versions):**

- **Cytology order entry** (`/CytologyOrderEntry`) — separate existing route, no changes proposed.
- **Slide capture / image upload** — existing `cytology_slide` table and Carbon `FileUploader` already shipping; no redesign.
- **HPV ordering / result entry** — HPV is a separate test ordered under the parent Sample. This screen only reads the HPV Analysis result.
- **QA rescreening workflow** (mandatory rescreen of 10% NILM cases, all abnormals, per CLIA / WHO guidelines) — separate FRS.
- **Non-gynecologic cytology** — FNA (Fine Needle Aspiration), body fluids, respiratory cytology use different reporting frameworks and ship on a separate screen.
- **Pap smear PDF report layout** — `CytologyReport` table and PDF generation already shipping; this screen only triggers report generation.

---

## User Stories

1. **As a cytopathologist**, I want every Bethesda 2014 reporting section enforced before I can sign out a case, so that my reports are structurally complete and comparable to my colleagues' reports.
2. **As a cytopathologist**, I want the HPV co-test result visible on the same screen as the cytology findings, so that I don't sign out a recommendation that contradicts the HPV.
3. **As a cytopathologist**, I want to enter my own recommendation before I see the ASCCP-suggested recommendation, so that the system's suggestion does not anchor my clinical judgment.
4. **As a referring clinician**, I want HSIL or malignant cytology findings to require explicit acknowledgment from my queue, so that no critical Pap result is lost to follow-up.
5. **As a lab manager**, I want every diagnostic finding to live in the existing `cytology_diagnosis_result_map` rather than a parallel table, so that the schema stays auditable via the existing Envers history we already rely on for compliance.

---

## Layout

A Workbench layout with three primary work sections on the left and a sticky Case Summary panel on the right. All work sections are always visible — implemented as Carbon `Accordion` items that can be collapsed when done but never hidden — because a cytopathologist may revise an earlier section after seeing later evidence (e.g. revise adequacy after finding obscuring cells, or revise recommendation after HPV result arrives).

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Home / Cytology / Dashboard / Case 24CYT000042                          │
│ Cytology Case — 24CYT000042                                             │
├──────────── PatientHeader (existing common component) ─────────────────┤
│ SMITH, MARY  |  DOB 1985-06-15 (40 y)  |  F  |  Status: SCREENING       │
├────────────────────────────────────────────────────────┬────────────────┤
│                                                        │ ╭ CASE SUMMARY╮│
│ ▼ 1. Case Information                                  │ │ Adequacy:   ││
│   Specimen type · Clinical history · Prior Pap         │ │  Satisfact. ││
│                                                        │ │ Category:   ││
│ ▼ 2. Specimen Adequacy                                 │ │  Epithelial ││
│   • Satisfactory / Unsatisfactory radio                │ │ Finding:    ││
│   • Limitations multi-select (if satisfactory-limited) │ │  HSIL  [⚠] ││
│   • Reason (if unsatisfactory)                         │ │ HPV cotest: ││
│                                                        │ │  POS HPV-16 ││
│ ▼ 3. Interpretation (Bethesda 2014)                    │ │ Recomm.:    ││
│   • General category radio (NILM / Epithelial / Other) │ │  (pending)  ││
│   • Squamous OR Glandular finding (if Epithelial)      │ ╰─────────────╯│
│   • Organisms multi-select (if NILM)                   │                │
│   • Non-neoplastic findings multi-select (if NILM)     │ Slide list:    │
│   • Other findings text (if Other)                     │  • Slide 1     │
│                                                        │  • Slide 2     │
│ ▼ 4. Recommendation                                    │                │
│   • Your recommendation (required, entered FIRST)      │                │
│   • ASCCP suggested recommendation (collapsed panel,   │                │
│     unlocks AFTER user types something in box above)   │                │
│   • Additional comments (rich text)                    │                │
│                                                        │                │
├────────────────────────────────────────────────────────┴────────────────┤
│ Status: SCREENING                                                       │
│ [Discard changes]              [Save draft]    [Sign out & finalize]    │
└─────────────────────────────────────────────────────────────────────────┘
```

The wizard layout from the v1 FRS is intentionally removed. A wizard forces a linear flow that doesn't match how cytopathologists actually work — they re-open adequacy after finding obscuring blood while inspecting cells, they revise the recommendation when an HPV result lands, and they jump between sections during high-volume screening sessions. Accordion sections give them the same guided structure as a wizard without the back-and-forth cost.

---

## Functional Requirements

### FR-1 · Case Information section (display-only, collapsed by default)

The first accordion item displays case-level metadata pulled from the existing `Sample` and `cytology_sample` entities. No editing. Collapsed by default; the cytopathologist expands if they need to verify clinical history.

| Field | Source |
|-------|--------|
| Lab number | `sample.accession_number` |
| Request date | `sample.entered_date` |
| Specimen type | `sample_item.type_of_sample_id` joined to `type_of_sample` (e.g. `ThinPrep`, `Conventional smear`) |
| Provider | `sample_requester` joined to `provider` |
| Clinical history | `cytology_sample.questionnaire_response_uuid` rendered via existing `<QuestionnaireResponse>` component (LMP, symptoms, prior treatment) |
| Prior Pap result | Most recent prior `cytology_sample` for same patient, displayed as `[Result] (date)` — read from sibling samples on the same patient |

If a field is unavailable, render the row with `—` and a small "not recorded" hint. No invented fields.

### FR-2 · Specimen Adequacy section

Backed by the existing `cytology_specimen_adequacy` table (one row per `cytology_sample`).

**FR-2.1** A single radio group selects `satisfaction`:

| UI option | Stored value (`SpecimenAdequancySatisfaction` enum) |
|-----------|------------------------------------------------------|
| Satisfactory for evaluation | `SATISFACTORY_FOR_EVALUATION` |
| Satisfactory but limited by… | `SATISFACTORY_FOR_EVALUATION` + at least one `cytology_specimen_adequacy_value` row |
| Unsatisfactory for evaluation | `UN_SATISFACTORY_FOR_EVALUATION` |

**FR-2.2** If "limited" or "unsatisfactory" is selected, a `FilterableMultiSelect` exposes the dictionary entries in `dictionary_category` rows `cytology_adequacy_satisfactory` (for limitations) or `cytology_adequacy_unsatisfactory` (for unsatisfactory reasons). The selected dictionary IDs are stored as strings in `cytology_specimen_adequacy_value.value` (existing `@ElementCollection` table).

**FR-2.3** A free-text fallback field is available because the existing `CytologySpecimenAdequacy.resultType` enum supports `TEXT` (T) in addition to `DICTIONARY` (D). If the user types into the text field, `resultType` is set to `TEXT` and the multi-select is disabled. If they select from the multi-select, `resultType` is set to `DICTIONARY`.

**FR-2.4** When `satisfaction = UN_SATISFACTORY_FOR_EVALUATION`, sections 3 (Interpretation) and 4 (Recommendation) become read-only with a banner: "Specimen is unsatisfactory; no Bethesda interpretation required. The case may be signed out with the recommendation 'Repeat collection'." This is the only place the screen suppresses sections — and it does so by disabling them, not hiding them.

### FR-3 · Interpretation section

Backed by the existing `cytology_diagnosis` table (1:1 with `cytology_sample`) and `cytology_diagnosis_result_map` (1:many with `cytology_diagnosis`).

**FR-3.1 · General Categorization** A single radio group at the top of the section sets `cytology_diagnosis.negative_diagnosis` and, where applicable, drives which sub-sections become editable.

| UI option | Stored as |
|-----------|-----------|
| Negative for Intraepithelial Lesion or Malignancy (NILM) | `negative_diagnosis = true`; sub-sections 3.2 and 3.3 editable |
| Epithelial Cell Abnormality | `negative_diagnosis = false`; sub-section 3.4 editable |
| Other (e.g. endometrial cells in a woman ≥45) | `negative_diagnosis = true`; sub-section 3.5 editable |

(Bethesda 2014 treats "Other" as NILM with an additional note — the `negative_diagnosis` flag remains `true`, but a `cytology_diagnosis_result_map` row with category `OTHER` is also written.)

**FR-3.2 · Organisms** (visible only when NILM selected) — `FilterableMultiSelect` populated from `dictionary_category = 'cytology_diagnosis_organisms'`. Stored as a `cytology_diagnosis_result_map` row with `category = ORGANISMS`, `result_type = DICTIONARY`, `results = [dictionary_id, dictionary_id, ...]` (via the existing `StringListConverter`).

**FR-3.3 · Non-neoplastic findings** (visible only when NILM selected) — Carbon `Checkbox` group plus a "Reactive cellular changes" sub-group as a single nested Checkbox tree. Stored as two `cytology_diagnosis_result_map` rows: one with `category = NON_NEOPLASTIC_CELLULAR_VARIATIONS`, one with `category = REACTIVE_CELLULAR_CHANGES`. Dictionary categories `cytology_non-neoplastic_cellular_variations` and `cytology_reactive_cellular_changes`.

**FR-3.4 · Epithelial Cell Abnormality** (visible only when Epithelial Abnormality selected). Two parts:

- **Type radio:** `Squamous` / `Glandular` / `Both`. Drives which dictionary populates the finding list below.
- **Finding select:** Single `Select` (not multi) populated from `dictionary_category = 'cytology_epithelial_cell_abnomalit_squamous'` or `…_glandular` depending on type. If "Both" is selected, two Select widgets appear — one for each.

Findings are stored as `cytology_diagnosis_result_map` rows with `category = EPITHELIAL_CELL_ABNORMALITY` and the dictionary ID in `results`. Squamous-vs-glandular is recoverable from the dictionary entry's parent category (no schema field needed; the dictionary row already knows).

Each finding option is rendered with a Carbon `Tag` indicating its risk level (computed lookup, not stored — see FR-5):

| Finding | Tag color (Carbon `kind`) | Risk level |
|---------|---------------------------|------------|
| ASC-US, LSIL, AGC variants (NOS) | `warm-gray` | LOW |
| ASC-H, AGC favor neoplastic | `magenta` | INTERMEDIATE |
| HSIL, HSIL suspicious for invasion, AIS | `red` | HIGH |
| Squamous cell carcinoma, Adenocarcinoma (any) | `red-inverse` (custom or stronger red) | MALIGNANT |

**FR-3.5 · Other** (visible only when Other selected) — Free text field. Stored as `cytology_diagnosis_result_map` row with `category = OTHER`, `result_type = TEXT`, `results = [text]`.

### FR-4 · Recommendation section (anti-anchoring sequence)

Backed by a **new** `cytology_recommendation` table (see Data Model).

**FR-4.1 · User recommendation** — Required `TextArea`, must be non-empty for sign-out. Stored as `cytology_recommendation.user_text`.

**FR-4.2 · ASCCP suggested recommendation panel** — A separate Carbon `Accordion` item below the user textarea. The panel is **locked** (cannot be expanded; chevron disabled) until the user has typed at least one non-whitespace character into FR-4.1. Once unlocked, expanding the panel reveals the system-suggested recommendation:

- Header line: "ASCCP 2019 Guideline suggestion" with a Carbon `Tag` showing the computed risk level
- Body: the suggested text (e.g. "Immediate colposcopy or expedited treatment acceptable for non-pregnant patients ≥ 25 years")
- Two action buttons: **Copy to clipboard** and **Use this** (writes the suggested text into FR-4.1, replacing whatever the user wrote — with an `InlineNotification` confirming the replacement; reversible until save)
- Footer: "Source: 2019 ASCCP Risk-Based Management Consensus Guidelines"

Stored values: `cytology_recommendation.system_code`, `cytology_recommendation.system_text`, `cytology_recommendation.system_risk_level`, `cytology_recommendation.system_guideline_version` (e.g. "ASCCP 2019"), and a boolean `used_system_suggestion` set to `true` if the user clicked "Use this".

**FR-4.3 · ASCCP recommendation engine** — A server-side service `CytologyRecommendationService.suggest(cytologyFinding, hpvAnalysisResult, patientAge)` returns the suggestion. The lookup table is small (one row per cytology × HPV state × age band combination) and lives in a Liquibase-managed seed file `cytology_ascccp_2019_recommendations.xml`. The matrix below is the v1 seed:

| Cytology | HPV (sibling Analysis) | Age | System suggestion |
|----------|------------------------|-----|-------------------|
| NILM | Negative | 25–65 | Routine screening: repeat co-test in 5 years (or cytology alone in 3 years) |
| NILM | Positive — not HPV-16/18 | ≥ 30 | Repeat co-test in 1 year |
| NILM | HPV-16 or HPV-18 positive | ≥ 30 | Colposcopy |
| NILM | Unavailable / pending | any | Suggestion withheld; show banner "HPV result pending; ASCCP suggestion requires HPV" |
| ASC-US | Negative | any | Repeat co-test in 3 years |
| ASC-US | Positive | any | Colposcopy |
| ASC-H | any | any | Colposcopy |
| LSIL | Negative | ≥ 25 | Repeat co-test in 1 year |
| LSIL | Positive | any | Colposcopy |
| HSIL, HSIL-suspicious | any | any | Immediate colposcopy or expedited treatment |
| AGC (any subtype) | any | any | Colposcopy with endocervical sampling |
| AIS | any | any | Excisional procedure |
| SCC, Adenocarcinoma (any) | any | any | Urgent referral to gynecologic oncology |

Service note: this v1 matrix is intentionally simplified compared to the full ASCCP 2019 risk-based tables (which use 5-year CIN3+ risk thresholds and patient history). The simplification is acknowledged in the spec; v2 may import the full ASCCP risk tables once we have a partner organization willing to maintain them.

**FR-4.4 · Additional comments** — Optional rich `TextArea`. Stored as `cytology_recommendation.additional_comments`.

### FR-5 · Critical-result acknowledgment hook

When the selected epithelial-abnormality finding has a computed risk level of `HIGH` or `MALIGNANT` (the dictionary rows for HSIL, HSIL-suspicious, AIS, SCC, and any Adenocarcinoma), the system tags the case as containing a critical result.

**FR-5.1** A persistent `InlineNotification` (kind `warning`) appears at the top of the Interpretation section: "This finding requires critical-result acknowledgment by the ordering clinician. The case will be flagged in the Alerts Dashboard upon sign-out."

**FR-5.2** On **Sign out**, in addition to the normal `CytologyStatus.COMPLETED` transition, the system emits a `CriticalResultEvent` for the case, which is the integration point with the global Critical Result Acknowledgment work (see Dependencies). This is the only outgoing event in v1; the receiver is built in the Critical Ack FRS.

**FR-5.3** If the global Critical Ack feature is not yet deployed in a given installation, the event is still emitted but no acknowledgment dashboard is required. The current behavior degrades gracefully: a feature flag `criticalResultAcknowledgmentEnabled` (existing common-properties pattern) gates the downstream behavior. Sign-out is not blocked by the absence of the Critical Ack feature.

### FR-6 · Sign-out workflow and state transitions

The screen drives transitions on the existing `CytologyStatus` enum:

```
PREPARING_SLIDES ──► SCREENING ──► READY_FOR_CYTOPATHOLOGIST ──► COMPLETED
                       ▲                       │
                       └───── reopen ──────────┘
```

**FR-6.1 · Save draft** — `POST /rest/cytology/saveDraft/{cytologySampleId}`. Persists all in-progress fields without status change. No validation enforced. Available at all statuses prior to `COMPLETED`.

**FR-6.2 · Sign out & finalize** — `POST /rest/cytology/signOut/{cytologySampleId}`. Validates that adequacy is set, that interpretation is complete (general category + a sub-section answer), and that user recommendation is non-empty. On success, transitions status to `COMPLETED`, generates the `CytologyReport` PDF (existing path), emits `CYTOLOGY_CASE_SIGNED_OUT` audit event, and emits the `CriticalResultEvent` if FR-5 applies.

**FR-6.3 · Reopen** — A `COMPLETED` case can be reopened only by a user with the `Cytopathologist` role bundle (no new permission). Reopen transitions status back to `READY_FOR_CYTOPATHOLOGIST`, voids the prior `CytologyReport` row (sets `voided = true` — new column; see Data Model), and audits the reopen event.

### FR-7 · Localization

Every visible string is wrapped in `t(key, fallback)` per Constitution Principle 1. Existing `cytology.*` keys are reused; new keys follow the same convention. See the Localization table below.

### FR-8 · Audit Trail

Every state-changing action writes a row to `audit_trail`. No reads are audited.

| Action verb | Trigger | Target | Payload summary |
|-------------|---------|--------|-----------------|
| `CYTOLOGY_ADEQUACY_SAVED` | FR-2 save | `cytology_sample.id` | `satisfaction`, `result_type` |
| `CYTOLOGY_DIAGNOSIS_SAVED` | FR-3 save | `cytology_sample.id` | `negative_diagnosis`, list of `(category, result_type)` tuples — no PII |
| `CYTOLOGY_RECOMMENDATION_SAVED` | FR-4 save | `cytology_recommendation.id` | `used_system_suggestion`, `system_risk_level` |
| `CYTOLOGY_CASE_SIGNED_OUT` | FR-6.2 success | `cytology_sample.id` | `status_from`, `status_to`, `critical_result_emitted` (bool) |
| `CYTOLOGY_CASE_REOPENED` | FR-6.3 | `cytology_sample.id` | `voided_report_id` |
| `CYTOLOGY_CRITICAL_RESULT_EMITTED` | FR-5.2 | `cytology_sample.id` | `risk_level`, `finding_dictionary_id` |

Actor is auto-captured from Spring Security. No patient identifiers in payload (the `cytology_sample.id` resolves to the patient via existing audit query patterns).

### FR-9 · Envers coverage

Hibernate Envers `@Audited` on:

- `CytologySample` *(existing — verify still annotated; add if missing)*
- `CytologyDiagnosis` *(existing)*
- `CytologySpecimenAdequacy` *(existing)*
- `CytologyDiagnosisCategoryResultsMap` *(existing)*
- `CytologyRecommendation` *(new — see Data Model; clinical data, must be audited)*

`CytologySlide` does not need Envers (high-churn binary content; existing `CytologyReport` table also not audited per existing pattern).

---

## Data Model

### Reused (existing — no schema changes)

| Entity | Table | Notes |
|--------|-------|-------|
| `CytologySample` | `cytology_sample` | Root entity; extends `ProgramSample` (which extends `Sample`). Already has `status`, `technician_id`, `cytopathologist_id`, `specimen_adequacy_id`, `cytology_diagnosis_id`, `questionnaire_response_uuid`. Add a single new FK column `recommendation_id` (see new entity). |
| `CytologySpecimenAdequacy` | `cytology_specimen_adequacy` + `cytology_specimen_adequacy_value` | Already supports `DICTIONARY`/`TEXT` result types and `SATISFACTORY`/`UN_SATISFACTORY` enum. No changes. |
| `CytologyDiagnosis` | `cytology_diagnosis` | Has `negative_diagnosis` boolean and one-to-many `CytologyDiagnosisCategoryResultsMap`. No changes. |
| `CytologyDiagnosisCategoryResultsMap` | `cytology_diagnosis_result_map` | Has `category` (enum), `result_type` (D/T), `results` (string list via `StringListConverter`). **No new fields**, but FR-3 relies on the existing `EPITHELIAL_CELL_ABNORMALITY` enum value being usable for both squamous and glandular findings (the dictionary entry itself records which it is via parent dictionary category). |
| `CytologySlide` | `cytology_slide` | Existing slide list with binary image. No changes; rendered in the sticky summary panel. |
| `CytologyReport` | `cytology_report` | Existing PDF report rows. Add a single new column `voided` boolean to support FR-6.3 reopen. |

### New (one new entity)

**`CytologyRecommendation`** — one row per `cytology_sample` (1:1).

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | sequence `cytology_recommendation_seq` |
| `cytology_sample_id` | INTEGER FK | unique constraint (1:1) |
| `user_text` | TEXT | required for sign-out; the cytopathologist's typed recommendation |
| `system_code` | VARCHAR(64) | nullable; e.g. `COLPO_IMMEDIATE`, `REPEAT_COTEST_1Y` |
| `system_text` | TEXT | nullable; the rendered ASCCP suggestion shown to the user |
| `system_risk_level` | VARCHAR(32) | nullable; one of `LOW`, `INTERMEDIATE`, `HIGH`, `MALIGNANT` |
| `system_guideline_version` | VARCHAR(32) | e.g. `ASCCP 2019` |
| `used_system_suggestion` | BOOLEAN | `true` if user clicked "Use this" |
| `additional_comments` | TEXT | nullable; FR-4.4 |
| `last_updated` | TIMESTAMP | per existing convention |

Liquibase changeset: `2.9.x.x/cytology_recommendation.xml`. `@Audited` via Envers. No PII columns.

### Schema additions (small)

| Change | Reason |
|--------|--------|
| `cytology_sample` add column `recommendation_id INTEGER` (FK to `cytology_recommendation.id`) | 1:1 link from case to recommendation. |
| `cytology_report` add column `voided BOOLEAN DEFAULT false` | FR-6.3 reopen voids the prior PDF. |

### Dependencies (named, not designed in this FRS)

| Dependency | Status | What this FRS needs |
|------------|--------|---------------------|
| **Global Critical Result Acknowledgment** | TODO (memory: `project_critical_result_ack_global_todo`) | FR-5 emits `CriticalResultEvent`. The event consumer / Alerts Dashboard integration is built in that other FRS, not here. Feature flag `criticalResultAcknowledgmentEnabled` gates the consumer. |
| **HPV co-test Analysis lookup** | Exists in production via existing `Analysis` / `Result` model on the parent `Sample` | This FRS reads HPV findings (16, 18, other HR-HPV genotypes) from sibling `Analysis` rows where the test maps to the HPV LOINC group. The mapping query is `SELECT result FROM analysis a JOIN test t ON a.test_id=t.id WHERE a.sample_item.sample_id = :sampleId AND t.loinc_code IN (...)`. **Dependency:** a stable LOINC-coded HPV test must exist in the test catalog (most installations ship one; flagged for review per site). |
| **Bethesda 2014 dictionary content** | Partially present | Existing `dictionary_category` rows for organisms, non-neoplastic, reactive, squamous epithelial, glandular epithelial, other are seeded. **Gap:** the squamous and glandular dictionaries need to be re-checked against the Bethesda 2014 vocabulary list; a content review by a cytopathology SME is required before release. See Dependencies → Content review. |
| **Liquibase changeset 2.9.x.x** | New | All new schema lands in a single changeset under `2.9.x.x/cytology_recommendation.xml`, idempotent. |

---

## Permissions

| Action | Role bundle | Notes |
|--------|-------------|-------|
| Open Cytology Case View | `Cytopathologist` (existing) | URL `/CytologyCaseView` already registered in `system_module_url` for the `Cytology` module. |
| Save draft | `Cytopathologist` | Existing. No new per-action key. |
| Sign out / finalize | `Cytopathologist` | Existing. No new per-action key. |
| Reopen completed case | `Cytopathologist` | Same role bundle — no separate "reopen" permission key. OpenELIS does not use granular per-action keys (see Constitution: binary admin + module-bundle roles only). |

**Roles Builder additions:** None. Accessible via existing `Cytopathologist` bundle.

---

## Acceptance Criteria

Each AC traces to one or more FRs.

| AC | Statement | Traces to |
|----|-----------|-----------|
| AC-1 | Cytology Case View loads at `/CytologyCaseView/:cytologySampleId` and renders the patient header, slide list, and four work sections | Layout |
| AC-2 | Case Information section is collapsed by default and displays specimen type, request date, provider, clinical history, and most-recent prior Pap. Missing values render as `—` | FR-1 |
| AC-3 | Specimen Adequacy radio sets `satisfaction` to the correct enum value, and selecting "limited" or "unsatisfactory" reveals a multi-select populated from the matching dictionary category | FR-2.1, FR-2.2 |
| AC-4 | Selecting Unsatisfactory disables sections 3 and 4 and shows the unsatisfactory banner; sign-out is permitted with recommendation "Repeat collection" only | FR-2.4 |
| AC-5 | General Categorization radio drives which Interpretation sub-sections are editable: NILM → organisms + non-neoplastic; Epithelial → squamous/glandular finding; Other → free text | FR-3.1, FR-3.2, FR-3.3, FR-3.4, FR-3.5 |
| AC-6 | Epithelial Cell Abnormality finding select offers both squamous and glandular dictionaries; selecting "Both" shows two finding selects | FR-3.4 |
| AC-7 | Each finding option is rendered with a Carbon Tag whose `kind` matches the computed risk level (LOW=warm-gray, INTERMEDIATE=magenta, HIGH=red, MALIGNANT=red-inverse) | FR-3.4 |
| AC-8 | If a HIGH or MALIGNANT finding is selected, an InlineNotification (kind `warning`) appears at the top of the Interpretation section | FR-5.1 |
| AC-9 | HPV co-test result on the sticky summary panel reads from a sibling HPV Analysis on the parent Sample; if no HPV Analysis exists or it is pending, the panel shows a pending state | FR-4.3, Dependencies |
| AC-10 | Your-recommendation field is required for sign-out (non-empty after trim) | FR-4.1, FR-6.2 |
| AC-11 | ASCCP suggestion accordion is locked (chevron disabled, cursor `not-allowed`) until the user has typed at least one non-whitespace character into Your recommendation | FR-4.2 |
| AC-12 | "Use this" button writes the system text into Your recommendation, sets `used_system_suggestion = true`, and shows an InlineNotification confirming the replacement | FR-4.2 |
| AC-13 | If HPV result is unavailable when computing ASCCP suggestion, the panel renders "HPV result pending; ASCCP suggestion requires HPV" instead of a guess | FR-4.3 |
| AC-14 | Sign-out transitions `CytologyStatus` to `COMPLETED`, generates `CytologyReport`, writes a `CYTOLOGY_CASE_SIGNED_OUT` audit row | FR-6.2, FR-8 |
| AC-15 | Sign-out on a HIGH or MALIGNANT case also emits a `CriticalResultEvent` (audit row `CYTOLOGY_CRITICAL_RESULT_EMITTED`) | FR-5.2, FR-8 |
| AC-16 | If feature flag `criticalResultAcknowledgmentEnabled = false`, sign-out still emits the event but no downstream queue action is triggered, and sign-out is not blocked | FR-5.3 |
| AC-17 | Reopen of a `COMPLETED` case voids the prior `CytologyReport` (sets `voided = true`), returns status to `READY_FOR_CYTOPATHOLOGIST`, writes `CYTOLOGY_CASE_REOPENED` audit row | FR-6.3, FR-8 |
| AC-18 | All visible strings are wrapped in `t(key, fallback)`. Existing `cytology.*` keys are reused; new keys are listed in the Localization table below | FR-7 |
| AC-19 | `CytologyRecommendation` is `@Audited` (Envers row-level history available via existing audit query patterns) | FR-9 |
| AC-20 | No new per-action permission keys are introduced; access is gated by existing `Cytopathologist` role bundle | Permissions |

---

## Localization

New i18n keys (all categories follow the existing `cytology.*` convention; new keys are added to `frontend/src/languages/en.json` and propagated to fr/es/sw/ta/de/zh/ro/si). Existing keys reused where present.

| Key | English fallback | Reused? |
|-----|------------------|---------|
| `cytology.label.dashboard` | Cytology Dashboard | existing |
| `cytology.label.case` | Cytology Case | new |
| `cytology.section.caseInfo` | Case Information | new |
| `cytology.section.adequacy` | Specimen Adequacy | new |
| `cytology.section.interpretation` | Interpretation (Bethesda 2014) | new |
| `cytology.section.recommendation` | Recommendation | new |
| `cytology.adequacy.satisfactory` | Satisfactory for evaluation | new |
| `cytology.adequacy.satisfactoryLimited` | Satisfactory but limited by… | new |
| `cytology.adequacy.unsatisfactory` | Unsatisfactory for evaluation | new |
| `cytology.adequacy.limitationsPrompt` | Select limitations | new |
| `cytology.adequacy.unsatisfactoryReason` | Reason for unsatisfactory specimen | new |
| `cytology.adequacy.unsatisfactoryBanner` | Specimen is unsatisfactory; no Bethesda interpretation required. The case may be signed out with the recommendation 'Repeat collection'. | new |
| `cytology.category.nilm` | Negative for Intraepithelial Lesion or Malignancy (NILM) | new |
| `cytology.category.epithelial` | Epithelial Cell Abnormality | new |
| `cytology.category.other` | Other | existing (`cytology.label.other`) |
| `cytology.findings.squamous` | Squamous | existing |
| `cytology.findings.glandular` | Glandular | existing |
| `cytology.findings.both` | Both squamous and glandular | new |
| `cytology.findings.organisms` | Organisms identified | existing (`cytology.label.organisms`) |
| `cytology.findings.nonNeoplastic` | Non-neoplastic findings | new |
| `cytology.findings.reactive` | Reactive cellular changes | new |
| `cytology.findings.otherResult` | Other diagnosis result | existing (`cytology.label.otherResult`) |
| `cytology.risk.low` | Low risk | new |
| `cytology.risk.intermediate` | Intermediate risk | new |
| `cytology.risk.high` | High risk | new |
| `cytology.risk.malignant` | Malignant | new |
| `cytology.critical.banner` | This finding requires critical-result acknowledgment by the ordering clinician. The case will be flagged in the Alerts Dashboard upon sign-out. | new |
| `cytology.recommendation.yourLabel` | Your recommendation | new |
| `cytology.recommendation.yourPlaceholder` | Enter your clinical recommendation based on the findings… | new |
| `cytology.recommendation.suggestionTitle` | ASCCP 2019 guideline suggestion | new |
| `cytology.recommendation.suggestionLocked` | Enter your own recommendation first to unlock the ASCCP suggestion | new |
| `cytology.recommendation.suggestionPendingHpv` | HPV result pending; ASCCP suggestion requires HPV | new |
| `cytology.recommendation.useThis` | Use this | new |
| `cytology.recommendation.copyClipboard` | Copy to clipboard | new |
| `cytology.recommendation.usedSystemNotice` | Your recommendation has been replaced with the ASCCP suggestion. You can edit it before signing out. | new |
| `cytology.recommendation.additionalComments` | Additional comments | new |
| `cytology.hpv.panelTitle` | HPV co-test result | new |
| `cytology.hpv.pending` | HPV result pending | new |
| `cytology.hpv.unavailable` | No HPV co-test ordered on this sample | new |
| `cytology.action.saveDraft` | Save draft | new |
| `cytology.action.signOut` | Sign out & finalize | new |
| `cytology.action.discard` | Discard changes | new |
| `cytology.action.reopen` | Reopen case | new |
| `cytology.confirmSelect` | If you select this option, all current diagnosis information will be removed | existing |

---

## Non-functional Requirements

| Aspect | Target |
|--------|--------|
| Initial load | First contentful paint ≤ 1.5 s on a 4G connection from a 1× CPU mobile-class device (typical site profile in resource-constrained labs). Existing CytologyCaseView baseline; redesign must not regress. |
| Save draft | ≤ 500 ms server response on a case with ≤ 20 findings. |
| Sign-out | ≤ 2.0 s including PDF generation. |
| Accessibility | WCAG 2.1 AA. All form fields have labels; Tag risk indicators have `aria-label` describing the risk in addition to the color cue. Critical-result banner is announced via `role="alert"`. |
| Localization | Supports all 9 currently-shipped UI locales (en, fr, es, sw, ta, de, zh, ro, si). |
| Browser | Chrome / Edge / Firefox latest; iPad Safari for read-only review (not editing — cytopathologists screen on desktop microscopes). |

---

## What changed vs v1 FRS (December 2025)

For reviewers comparing this revision to the prior FRS at `designs/pathology/cytology-case-view.md`:

| Area | v1 | v2 (this FRS) |
|------|----|----|
| **Data model** | Proposed new `CytologyCase` and `CytologyReport` UUID tables | Reuses the existing `cytology_sample` / `cytology_diagnosis` / `cytology_diagnosis_result_map` / `cytology_specimen_adequacy` / `cytology_slide` / `cytology_report` tables that already ship in production; introduces exactly one new table (`cytology_recommendation`) and two small column additions |
| **Layout** | Wizard with progress dots and Back/Continue buttons | Accordion sections always visible — matches how cytopathologists actually work; revisable at any point |
| **HPV co-test** | Denormalized as fields on the case | Read-only display sourced from sibling HPV `Analysis` on the parent `Sample`; HPV ordering/entry stays in the existing HPV workflow |
| **Roles** | Invented "Cytotechnologist + Pathologist + Lab Manager" matrix | Single existing `Cytopathologist` role bundle (binary admin + module bundle, per Constitution) |
| **Critical results** | Not mentioned | Explicit hook to global Critical Result Acknowledgment via `CriticalResultEvent`, behind feature flag; HSIL/SCC/AIS/Adenocarcinoma findings trigger the event on sign-out |
| **Recommendation** | Algorithm output mixed with user entry | Separate `cytology_recommendation` table; anti-anchoring locked-panel UX for the ASCCP suggestion |
| **Hormonal Evaluation step** | Included as a step | **Removed.** Bethesda 2014 deprecated hormonal evaluation; it is no longer required reporting. |
| **Route** | `/CytologyCaseView/:caseId` | `/CytologyCaseView/:cytologySampleId` — matches the existing live route |
| **i18n** | Listed 16 keys, mostly new | Reuses 7 existing `cytology.*` keys; adds 40+ structured new keys with consistent naming |
| **Audit / Envers** | Not declared | Six explicit `audit_trail` action verbs; Envers coverage declared per entity |
| **Permissions** | Listed users by job title | Maps to existing `Cytopathologist` role bundle; no invented per-action keys |
| **Lab Context** | Absent | Three-subsection developer onboarding narrative as the first section |

---

## Related and prior art

- **Pathology Case View** (`designs/pathology/pathology-case-view.md`) — the parent design pattern for the pathology module; layout conventions (PatientHeader, sticky summary, slide list) follow it.
- **IHC Case View** (`designs/pathology/ihc-case-view.md`) — sibling case-detail screen; uses similar Carbon `Accordion` interaction model.
- **Global Critical Result Acknowledgment** (TODO in product memory: `project_critical_result_ack_global_todo`) — receiver of `CriticalResultEvent` emitted by FR-5.
- **EQA Review Queue** (in EQA V2 FRS) — independent of cytology; mentioned only as an example of the same Alerts Dashboard pattern.

---

*End of FRS — v2.0, 2026-05-27*
