# FRS: Optional Patient Sex and Age at Order Entry (and "Gender" to "Sex" label fix)

| | |
|---|---|
| **Status** | Draft v0.2, 2026-09-28 (v0.2: Validation lane rule FR-16a) |
| **Author** | Casey (Director of Product) |
| **Domain** | Clinical order entry, patient entry, reference ranges |
| **Mockups** | None. Settings reuse the existing Order Entry Configuration toggle pattern; patient form changes are removal of a required marker plus a warning notification. |
| **Code read** | `DIGI-UW/OpenELIS-Global-2` `develop`, 2026-09-28 |

---

## Lab Context

### Current State

When reception registers a new patient while entering a lab order, OpenELIS forces two fields: **sex** (Male or Female) and **date of birth** (or an estimated age in years, months, days, which the form converts to a date of birth). The order cannot be saved without them. The form labels the sex field "Gender".

These two values matter because many tests have reference ranges (the "normal" interval printed next to a result) that differ by sex or by age. Haemoglobin is the classic example: an adult woman's normal range is lower than an adult man's, and a newborn's is different again. OpenELIS picks the range that matches the patient, uses it to flag results High or Low, and prints it on the report.

### Pain

Many labs receive specimens with a request form that leaves sex or age blank: referred samples from peripheral sites, anonymous or confidential testing programmes, unidentified emergency patients, and samples forwarded from another lab with only an ID. Because the fields are mandatory, reception guesses. A guessed "Male" on a female patient silently applies the male haemoglobin range, so a 12.5 g/dL result that is normal for her is flagged Low on the printed report. The report looks authoritative and nobody downstream knows the value was invented.

There is a second, quieter problem in the code today: when sex *is* blank (for example on a patient that arrived through an electronic order), the range lookup does not give up. It takes the first sex-specific range that fits the age, which might be the Male range, and applies it. When the date of birth is blank it takes a sex-specific range and ignores its age band, so an adult can receive a paediatric range. Calculated tests that use patient age (for example an estimated kidney-function calculation) fail outright when the date of birth is missing.

Finally, the English label "Gender" is wrong for what is being captured. Reference ranges depend on biological sex, and clinical lab standards use "Sex".

### What Changes

An administrator can switch off the requirement for sex, for age, or for both, in Order Entry Configuration. Reception then leaves a field blank instead of guessing. When a result comes in for a test whose range depends on the missing value, OpenELIS does not pretend: it uses a range only if one exists that does not depend on the missing value, and otherwise shows no range and no High/Low flag, exactly as it does today for a result with no patient. The result and the printed report carry an automatic note saying why ("Reference range not applied: patient sex not recorded"), and reception is warned at order save with a one-click option to raise a Non-Conforming Event (NCE, the lab's quality incident record) if the lab wants to track it. Tests whose ranges do not depend on sex or age are unaffected. Everywhere in the English interface, "Gender" reads "Sex".

---

## Overview

Two independent settings, **Patient sex required** and **Patient age required**, are added to Order Entry Configuration. Both default to **On**, so existing deployments behave exactly as today until an administrator changes them. The settings govern every place a patient record is created or edited (Add Order patient panel and Patient Management), so one patient cannot be optional on one screen and mandatory on another.

When a value is missing, reference-range selection follows one rule: **use only a range that does not depend on the missing value; if none exists, apply no range.** This replaces today's fallback, which borrows a sex- or age-specific range. The absence is made visible through an automatic result note (printed on the report), an order-save warning, and an optional NCE.

Separately, every English UI and report label reading "Gender" is changed to "Sex". Only English values change; i18n keys and other languages are untouched.

### Navigation & URL

- **SideNav placement:** existing page, `Admin → General Configuration → Order Entry Configuration` (no new menu item)
- **Breadcrumb:** unchanged from the existing Order Entry Configuration page
- **URL route:** existing `/MasterListsPage/SampleEntryConfigurationMenu`; the two new rows appear in its table alongside `requesterRequired`, `restrictFreeTextProviderEntry`, etc.

---

## User Stories

1. As an **Admin**, I want to make patient sex and/or age optional so that reception stops inventing values the request form does not contain.
2. As a **Reception** user, I want to save an order with sex or age blank, and be told which ordered tests will lose their reference range, so that I can chase the missing information or raise an NCE.
3. As an **Analyst** or **Validator**, I want to see plainly that a result has no reference range because the patient's sex or age is missing, so that I do not mistake a blank range for a catalog error or release a result with a borrowed range.
4. As a **Provider** reading the report, I want the report to state that the range was not applied and why, so that I interpret the value myself.

---

## Functional Requirements

### A. Settings

| ID | Requirement | Notes |
|---|---|---|
| FR-1 | Order Entry Configuration MUST offer two boolean settings: **Patient sex required** and **Patient age required**. Each defaults to **true**. | Same shape as the existing `requesterRequired` setting (liquibase 069). Existing deployments see no behaviour change on upgrade. |
| FR-2 | "Age" means *either* a date of birth *or* an estimated age (years/months/days). When Patient age required is On, one of them must be entered, as today. | No change to how estimated age is converted to a date of birth. |
| FR-3 | The settings MUST govern patient create and edit everywhere the shared patient form is used: the Add Order patient panel and Patient Management. Both frontend validation and server-side validation MUST honour them. | Today sex is enforced in both places (Yup schema and `@NotBlank` on `PatientManagementInfo.gender`); date of birth is enforced in the Yup schema. Both must read the setting. Legacy study/project entry forms (`PatientEntryByProjectFormValidator`) are out of scope. |
| FR-4 | When a setting is Off, the patient form MUST remove the required marker (`*`) from that field and accept a save with it blank. | |
| FR-5 | When Patient sex required is Off, the sex control MUST provide a way to clear a selection back to blank (for example a "Clear" ghost button beside the radio group). | A Carbon radio group cannot be deselected; without this a mis-click cannot be undone. |
| FR-6 | When a setting is On and a user edits or selects for a new order an existing patient whose value is missing, the form MUST require the value before saving the patient. | Applies to patients created while the setting was Off or received through electronic orders. |
| FR-7 | "Not recorded" MUST be stored as blank. No new sex value (such as Unknown or Other) is introduced. | The backend already accepts blank (`GENDER_REGEX = ^$|^M$|^F$`). |

### B. Reference range selection when a value is missing

A **range record** is one row of a test's (or result component's) reference ranges: it has an optional sex (blank = all sexes) and an age band (default band = all ages). A range record **depends on sex** if its sex is set; it **depends on age** if its age band is not the default.

| ID | Requirement | Notes |
|---|---|---|
| FR-8 | **Sex missing, age known:** the lookup MUST consider only range records with blank sex whose age band contains the patient's age. If none, no range applies. | Replaces `ageBasedResultLimit`'s second loop, which drops the sex condition and can return the Male or Female range. |
| FR-9 | **Age missing, sex known:** the lookup MUST consider only range records with the default age band whose sex is blank or matches the patient. A matching-sex record is preferred over a blank-sex record. If none, no range applies. | Replaces `genderBasedResultLimit`'s second loop, which drops the age condition and can return a paediatric band for an adult. |
| FR-10 | **Both missing:** the lookup MUST consider only the record with blank sex and the default age band (today's no-patient behaviour). If none, no range applies. | Unchanged; already implemented as `defaultResultLimit`. |
| FR-11 | Specimen-scoped ranges (OGC-1145) MUST follow the same rule inside their precedence: a sample-type override is used only if it passes FR-8 to FR-10, otherwise the shared records are tried under the same rule. | Keeps `selectWithSpecimenPrecedence` intact; only the per-patient selection changes. |
| FR-12 | When no range applies, the result MUST behave exactly as a result with no patient does today: no normal range displayed, no High/Low flag, and no critical or valid-range check from that range. | Critical and valid limits live on the same range record, so they are lost with it. The note (FR-15) says so. |
| FR-13 | When patient sex and age are both present, selection MUST be unchanged. | Regression guard. |
| FR-14 | A calculated test that uses the patient age attribute MUST NOT run when age is missing. The result is left for manual entry and carries a note: "Calculation not run: patient age not recorded." | Today `TestCalculatedUtil` dereferences a null birth date. |

### C. Making the absence visible

| ID | Requirement | Notes |
|---|---|---|
| FR-15 | When a result is saved and FR-8, FR-9 or FR-10 found no range *because* a value was missing, the system MUST attach an automatic note to that result, visible on the printed patient report: "Reference range not applied: patient sex not recorded" / "...patient age not recorded" / "...patient sex and age not recorded". | Only when the missing value mattered. If the test has no sex- or age-dependent range records, or a neutral record was found, no note is added. |
| FR-16 | Results Entry and Validation MUST show the same reason in the place the reference range normally appears, instead of an empty cell. | Validation lane behaviour is FR-16a. |
| FR-16a | On the Validation page, a result MUST be placed in **Needs review** (never Clear, and never auto-validated) when its test has age-banded normal ranges and the patient's age is missing, or has different normal ranges by sex and the patient's sex is missing, and no neutral range applied (the FR-15 condition). The row shows a **Range not applied** chip naming the missing value. | Casey 2026-09-28. Tests whose ranges do not depend on the missing value, or where a neutral range was found and applied, are unaffected and follow the normal clearance rule. Because this is the same condition as FR-15, the chip, note and lane never disagree. Once the value is added and the range applies (FR-17), the row is evaluated normally. |
| FR-17 | If the missing value is later added to the patient before the result is released, the range MUST be looked up again on the next save or validation, and the automatic note MUST stop printing. The note is kept in the result's history, not deleted. | D-002 (no hard delete). |
| FR-18 | At order save, if any ordered test would get no range for this patient under FR-8 to FR-10 while it has sex- or age-dependent range records, the order form MUST show a non-blocking warning listing the affected tests and the missing value. The warning offers: **Add sex/age** (focuses the patient field), **Report NCE**, and **Save anyway**. | Uses the same lookup as FR-8 to FR-10 so the warning never disagrees with what Results Entry will show. |
| FR-19 | **Report NCE** MUST open the existing NCE form pre-linked to the order and the affected tests, with a pre-filled description naming the missing value. The user chooses the category from the existing NCE list. No NCE is created unless the user submits it. | No automatic NCEs: at sites that routinely omit sex, auto-creation would flood the NCE dashboard. |
| FR-20 | Orders for tests whose ranges do not depend on the missing value MUST show no warning and get no note. | Casey: "If they are not by age or sex, that's all fine." |

### D. Label change: Gender to Sex (English only)

| ID | Requirement | Notes |
|---|---|---|
| FR-21 | Every English user-visible label, header, validation message and printed-report label that reads "Gender" MUST read "Sex". Change English values only; i18n keys stay the same so other languages are unaffected. | Full list in Localization below. |
| FR-22 | Hardcoded English strings MUST move to i18n keys as part of the change: the Yup message "Gender is Required", the `defaultMessage="Gender"` fallbacks in `SearchPatientForm.tsx` and `OrderQA.jsx`, and any literal "Gender" label in the patient report templates (`src/main/resources/reports/*.jrxml`). | Constitution Principle 1 (i18n). |

---

## Information & Data

- **Patient:** sex (Male, Female, or blank = not recorded) and date of birth (or blank). Both exist today; blank is already storable.
- **Order Entry settings:** two new boolean settings in the existing Order Entry Configuration set. Storage shape is left to the implementing engineer.
- **Reference range records:** existing test and result-component ranges, with optional sex, age band, optional sample type, normal, critical and valid limits. No new attributes.
- **Result note:** an existing report-visible (external) note on the result. The text is system-generated.
- **NCE:** existing NCE record, linked to order and tests. No new fields.

No new data is invented.

---

## Access

- **Admin** changes the two settings (existing Order Entry Configuration access).
- **Reception** (and anyone who can create or edit patients) is affected by the settings, sees the order-save warning and can open Report NCE. Accessible via the existing Reception role.
- **Analyst / Validator** see the "range not applied" reason in Results Entry and Validation. No new permissions.

---

## Localization

New keys:

| Key | English fallback | Context |
|---|---|---|
| `siteInfo.orderEntry.patientSexRequired` | Patient sex required | Setting name |
| `instructions.order.entry.patientSexRequired` | If true, patient sex must be entered when creating or editing a patient. If false, it may be left blank; tests with sex-specific ranges will show no range. | Setting description |
| `siteInfo.orderEntry.patientAgeRequired` | Patient age required | Setting name |
| `instructions.order.entry.patientAgeRequired` | If true, a date of birth or estimated age must be entered. If false, it may be left blank; tests with age-specific ranges will show no range. | Setting description |
| `patient.sex.required` | Sex is required | Validation message (replaces hardcoded "Gender is Required") |
| `patient.sex.clear` | Clear | Ghost button to clear the sex selection |
| `result.range.notApplied.sex` | Reference range not applied: patient sex not recorded | Result note, report, Results Entry, Validation |
| `result.range.notApplied.age` | Reference range not applied: patient age not recorded | Same |
| `result.range.notApplied.sexAge` | Reference range not applied: patient sex and age not recorded | Same |
| `validation.chip.rangeNotApplied` | Range not applied: {missing} not recorded | Validation Needs-review chip |
| `result.calculation.notRun.age` | Calculation not run: patient age not recorded | Calculated test note |
| `order.warning.demographics.title` | Some reference ranges will not be applied | Order-save warning title |
| `order.warning.demographics.body` | These tests have ranges that depend on {missing}. Without it, results will show no reference range or High/Low flag: {tests} | Order-save warning body |
| `order.warning.demographics.addValue` | Add sex/age | Warning action |
| `order.warning.demographics.reportNce` | Report NCE | Warning action |
| `order.warning.demographics.saveAnyway` | Save anyway | Warning action |
| `nce.prefill.demographicsMissing` | Patient {missing} not recorded on the request; reference ranges not applied for: {tests} | NCE description pre-fill |

English value changes (keys unchanged):

| Key | Current English | New English |
|---|---|---|
| `patient.gender` (frontend `en.json` and backend `message_en.properties`) | Gender | Sex |
| `patient.merge.gender` | Gender | Sex |
| `testCatalog.header.gender` | Gender | Sex |
| `eorder.patient.gender`, `porder.patient.gender`, `study.eorder.patient.gender` (both entries) | Gender | Sex |
| `resultlimits.gender` | Gender | Sex |
| `error.high.gender.value` | High Gender normal ... | High Sex normal ... (reword whole message for sense) |
| `gender.add.title`, `gender.add.subtitle`, `gender.browse.title`, `gender.description`, `gender.edit.title`, `gender.edit.subtitle`, `gender.genderType`, `gender.id` | ... Gender ... | ... Sex ... |
| `datasubmission.gendersuppress`, `.desc`, `datasubmission.gendertrend`, `.desc` | ... by Gender / by gender | ... by Sex / by sex |

Implementer to sweep `en.json`, `message_en.properties` and `reports/*.jrxml` for any remaining English "Gender" not listed here.

---

## Acceptance Criteria

1. With both settings at default (On), creating a patient without sex or date of birth is blocked in Add Order and Patient Management, exactly as today.
2. With Patient sex required Off, a patient saves with sex blank from both screens, the required marker is gone, and a selected sex can be cleared back to blank.
3. With Patient age required Off, a patient saves with no date of birth and no estimated age.
4. Server-side save of a patient with blank sex succeeds when the setting is Off and fails when it is On (API test, bypassing the UI).
5. Haemoglobin configured with only Male and Female adult ranges; patient age 35, sex blank: result shows no range, no H/L flag, and the note "Reference range not applied: patient sex not recorded" on screen and on the printed report.
6. Same test with an additional all-sexes adult range: that range is applied and no note is added.
7. Test with only paediatric and adult age bands; patient sex Female, no date of birth: no range applies and the age note is added. It never returns the paediatric band.
8. Test with a single all-sexes, all-ages range: no warning, no note, range applied regardless of missing values.
9. Adding the patient's sex before release and re-saving the result applies the correct range; the note no longer prints but remains in the result's history.
10. An order containing a sex-dependent test for a patient with blank sex shows the order-save warning listing that test; Save anyway saves the order; Report NCE opens the NCE form pre-linked to the order and test, and nothing is created if the user cancels.
11. A calculated test using patient age, for a patient with no age, does not throw, is left for manual entry, and carries the calculation note.
12. With both values present, range selection results are identical to the pre-change behaviour across the existing range test suite.
13. No English UI screen or English printed report shows the word "Gender".
14. On the Validation page, the AC-5 haemoglobin result (sex-specific ranges only, sex blank) is in Needs review with a Range not applied chip and is not auto-validated; the AC-6 result (all-sexes range applied) and the AC-8 result (single all-sexes, all-ages range) follow the normal clearance rule.

---

## Crosscheck

**Verdict: Proceed with coordination.** No active decision is contradicted; three sibling specs render the same concepts and should pick up the new label, the "range not applied" text and (for Validation) the new Needs-review signal.

- **Contradictions:** none. FR-17 keeps the superseded note in history (D-002). No new menu (D-010). Settings stay configuration-driven, consistent with clinical order entry v4 FR-28 ("required fields are configuration-driven... MUST NOT hardcode").
- **Overlaps:**
  - *Clinical order entry v4* (patient panel, order-save flow): the FR-18 warning should land in the v4 save step, not only the legacy form. MEDIUM.
  - *Validation page v4 / clearance rule (OGC-817, OGC-1226):* decided (FR-16a): a result is Needs review, with a Range not applied chip, only when its test has age-banded or sex-differentiated normals and the value it needs is missing. This adds a new Needs-review signal to the one clearance predicate (D-057), so auto-validation picks it up with no separate rule. The clearance FRS should list the new signal and its chip. MEDIUM.
  - *Patient report redesign (OGC-1111):* the report must print the FR-15 note and the "Sex" label. MEDIUM.
  - *Test catalog ranges editor:* `testCatalog.header.gender` relabel only. LOW.
- **Dependencies:** none unbuilt. Uses the existing NCE form, result notes and range lookup.
- **Docs impact:** published manual pages for Order Entry Configuration, Add Order and patient entry will show "Gender" in screenshots and need re-capture.

---

## Dependencies

- None blocking. All data and components exist today.

---

## Out of Scope

- A new sex value (Unknown, Other, Intersex) or a separate gender identity field.
- Changing which age is used for range selection (the lookup uses current age, not age at collection; worth a separate ticket).
- Legacy study/project entry forms (`PatientEntryByProjectFormValidator`, RetroCI study forms).
- Automatically creating NCEs.
- Changing other languages' translations of "Gender" (translators handle those; note that French currently reads "Genre", "Mâle", "Femelle").
- Environmental and vector orders (no patient; already follow the no-patient rule).
