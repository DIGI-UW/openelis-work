# OpenELIS Global - Cytology Case View Redesign
## Functional Requirements Specification

**Version:** 1.0  
**Date:** December 2025  
**Module:** Cytology → Case Detail View  
**Route:** `/CytologyCaseView/:caseId`

---

## 1. Overview

### 1.1 Problem Statement

The current Cytology Case View has an unfriendly interface that doesn't guide users through the structured Bethesda System algorithm for Pap smear evaluation. Key issues:

- No guided workflow through the Bethesda classification algorithm
- Difficult to understand which fields apply based on previous selections
- No clear visualization of where in the decision tree the user is
- HPV co-testing results not integrated with recommendations
- No algorithm-driven follow-up recommendations

### 1.2 Solution Summary

Redesign the Cytology Case View with:

- **Wizard-style guided interface** that walks through the Bethesda algorithm step-by-step
- **Conditional field display** - only show relevant options based on previous selections
- **Visual progress indicator** showing current position in the algorithm
- **Integrated HPV co-testing** that influences recommendations
- **Automated recommendation engine** based on Bethesda guidelines
- **Clean summary view** of all findings before report generation

### 1.3 The Bethesda System Algorithm

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SPECIMEN ADEQUACY                                │
│         ┌──────────────┴──────────────┐                            │
│    Satisfactory                  Unsatisfactory                     │
│         │                             │                             │
│         ▼                             ▼                             │
│  ┌─────────────┐              [Reason for rejection]               │
│  │ GENERAL     │              → End: Report as Unsatisfactory       │
│  │ CATEGORY    │                                                    │
│  └─────────────┘                                                    │
│         │                                                           │
│    ┌────┴────┬────────────┐                                        │
│    ▼         ▼            ▼                                        │
│  NILM    Epithelial    Other                                       │
│    │     Abnormality     │                                         │
│    │         │           │                                         │
│    ▼         │           ▼                                         │
│ [Organisms]  │     [Endometrial                                    │
│ [Reactive]   │      cells ≥45]                                     │
│    │         │                                                     │
│    │    ┌────┴────┐                                               │
│    │    ▼         ▼                                               │
│    │ Squamous  Glandular                                          │
│    │    │         │                                               │
│    │    ▼         ▼                                               │
│    │ [ASC-US]  [AGC]                                              │
│    │ [ASC-H]   [AGC-FN]                                           │
│    │ [LSIL]    [AIS]                                              │
│    │ [HSIL]    [Adenoca]                                          │
│    │ [SCC]                                                         │
│    │                                                               │
│    └────────────┬──────────────────────────────────────────────────┘
│                 ▼                                                   │
│          HPV CO-TESTING                                            │
│                 │                                                   │
│                 ▼                                                   │
│          RECOMMENDATION                                            │
│          (Algorithm-driven)                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.4 Users

| Role | Primary Actions |
|------|-----------------|
| Cytotechnologist | Screen slides, enter initial findings |
| Pathologist | Review, confirm/modify findings, sign out |
| Lab Manager | Full access, quality assurance review |

---

## 2. Layout Structure

### 2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header (existing OpenELIS header)                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Breadcrumb: Home / Cytology / Case 24CYT000042                      │
│ Page Title: Cytology Case - [Lab Number]                            │
│ Patient: [Last Name, First Name] | DOB: [Date] | Gender: F          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─ Case Information ──────────────────────────────────────────┐   │
│  │ (Collapsible - Patient, specimen, clinical info)            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ Bethesda Classification ───────────────────────────────────┐   │
│  │                                                              │   │
│  │  Progress: ●───●───○───○───○                                │   │
│  │            1   2   3   4   5                                 │   │
│  │                                                              │   │
│  │  ┌─ Step 2: General Categorization ─────────────────────┐   │   │
│  │  │                                                       │   │   │
│  │  │  ○ Negative for Intraepithelial Lesion (NILM)        │   │   │
│  │  │  ● Epithelial Cell Abnormality                        │   │   │
│  │  │  ○ Other                                              │   │   │
│  │  │                                                       │   │   │
│  │  └───────────────────────────────────────────────────────┘   │   │
│  │                                                              │   │
│  │  [← Back]                                      [Continue →]  │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ Summary & Report ──────────────────────────────────────────┐   │
│  │ (Shows after completing algorithm)                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Sticky Footer: [Discard Changes]      [Save Progress] [Generate Report]│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Algorithm Steps Specification

### 3.1 Step 1: Specimen Adequacy

**Purpose:** Determine if the specimen can be evaluated

**Options:**

| Option | Value | Next Step |
|--------|-------|-----------|
| Satisfactory for evaluation | SATISFACTORY | Step 2 |
| Satisfactory but limited by... | SATISFACTORY_LIMITED | Step 2 (with qualifier) |
| Unsatisfactory for evaluation | UNSATISFACTORY | End (Step 6) |

**If Satisfactory but Limited, show qualifier checkboxes:**
- [ ] Partially obscuring blood
- [ ] Partially obscuring inflammation
- [ ] Partially obscuring thick areas
- [ ] Scant cellularity
- [ ] Other: [free text]

**If Unsatisfactory, show reason (required):**
- [ ] Specimen rejected (not processed) because: [dropdown]
  - Unlabeled specimen
  - Slide broken/unreadable
  - No cervical cells identified
  - Other: [free text]
- [ ] Specimen processed but unsatisfactory because: [dropdown]
  - Scant squamous cellularity
  - Obscuring blood (>75%)
  - Obscuring inflammation (>75%)
  - Obscuring thick areas (>75%)
  - Absent transformation zone component (note: may still be satisfactory)
  - Other: [free text]

**Layout:**
```
┌─ Step 1: Specimen Adequacy ────────────────────────────────────────┐
│                                                                     │
│  Is the specimen adequate for evaluation?                          │
│                                                                     │
│  ○ Satisfactory for evaluation                                     │
│                                                                     │
│  ○ Satisfactory for evaluation, but limited by:                    │
│    ┌──────────────────────────────────────────────────────────┐   │
│    │ □ Partially obscuring blood                               │   │
│    │ □ Partially obscuring inflammation                        │   │
│    │ □ Scant cellularity                                       │   │
│    │ □ Absent transformation zone / endocervical component     │   │
│    │ □ Other: [________________]                               │   │
│    └──────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ○ Unsatisfactory for evaluation                                   │
│    ┌──────────────────────────────────────────────────────────┐   │
│    │ Reason: [Select reason...                            ▼]  │   │
│    │ Details: [________________]                               │   │
│    └──────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Step 2: General Categorization

**Purpose:** Primary classification of findings

**Options (single select):**

| Option | Value | Next Step |
|--------|-------|-----------|
| Negative for Intraepithelial Lesion or Malignancy (NILM) | NILM | Step 3A |
| Epithelial Cell Abnormality | EPITHELIAL_ABNORMALITY | Step 3B |
| Other | OTHER | Step 3C |

**Layout:**
```
┌─ Step 2: General Categorization ───────────────────────────────────┐
│                                                                     │
│  What is the general interpretation?                               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ○ Negative for Intraepithelial Lesion or Malignancy (NILM) │  │
│  │   No evidence of neoplasia                                  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ○ Epithelial Cell Abnormality                               │  │
│  │   Squamous or glandular cell abnormality identified         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ○ Other                                                     │  │
│  │   Endometrial cells in a woman ≥45 years of age            │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Step 3A: NILM - Additional Findings

**Purpose:** Document non-neoplastic findings

**Organisms (multi-select):**
- [ ] Trichomonas vaginalis
- [ ] Fungal organisms morphologically consistent with Candida spp.
- [ ] Shift in flora suggestive of bacterial vaginosis
- [ ] Bacteria morphologically consistent with Actinomyces spp.
- [ ] Cellular changes consistent with Herpes simplex virus
- [ ] Cellular changes consistent with Cytomegalovirus
- [ ] None identified

**Other Non-Neoplastic Findings (multi-select):**
- [ ] Reactive cellular changes associated with:
  - [ ] Inflammation (includes typical repair)
  - [ ] Radiation
  - [ ] Intrauterine contraceptive device (IUD)
  - [ ] Other: [free text]
- [ ] Glandular cells status post hysterectomy
- [ ] Atrophy
- [ ] Pregnancy-related changes
- [ ] None

**Layout:**
```
┌─ Step 3A: Additional Findings (NILM) ──────────────────────────────┐
│                                                                     │
│  ┌─ Organisms ─────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │ □ Trichomonas vaginalis                                     │  │
│  │ □ Candida spp.                                              │  │
│  │ □ Shift in flora suggestive of bacterial vaginosis          │  │
│  │ □ Actinomyces spp.                                          │  │
│  │ □ Herpes simplex virus                                      │  │
│  │ □ Cytomegalovirus                                           │  │
│  │ ☑ None identified                                           │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ Other Non-Neoplastic Findings ─────────────────────────────┐  │
│  │                                                              │  │
│  │ □ Reactive cellular changes associated with:                 │  │
│  │   └─ □ Inflammation    □ Radiation    □ IUD                 │  │
│  │ □ Glandular cells status post hysterectomy                  │  │
│  │ □ Atrophy                                                   │  │
│  │ ☑ None                                                      │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 Step 3B: Epithelial Cell Abnormality

**Purpose:** Classify the type of epithelial abnormality

**Part 1: Abnormality Type (single select):**

| Option | Value | Shows Part 2 |
|--------|-------|--------------|
| Squamous Cell | SQUAMOUS | Squamous sub-options |
| Glandular Cell | GLANDULAR | Glandular sub-options |
| Both | BOTH | Both sub-options |

**Part 2A: Squamous Cell Abnormalities (single select within group):**

| Option | Code | Severity |
|--------|------|----------|
| Atypical squamous cells of undetermined significance | ASC-US | Low |
| Atypical squamous cells, cannot exclude HSIL | ASC-H | Intermediate |
| Low-grade squamous intraepithelial lesion (LSIL) | LSIL | Low |
| High-grade squamous intraepithelial lesion (HSIL) | HSIL | High |
| HSIL with features suspicious for invasion | HSIL_SUSPICIOUS | High |
| Squamous cell carcinoma | SCC | Malignant |

**Part 2B: Glandular Cell Abnormalities (single select within group):**

| Option | Code | Severity |
|--------|------|----------|
| Atypical glandular cells (AGC) - Endocervical NOS | AGC_ENDO_NOS | Intermediate |
| Atypical glandular cells (AGC) - Endometrial NOS | AGC_ENDOM_NOS | Intermediate |
| Atypical glandular cells (AGC) - NOS | AGC_NOS | Intermediate |
| Atypical glandular cells, favor neoplastic - Endocervical | AGC_FN_ENDO | High |
| Atypical glandular cells, favor neoplastic - NOS | AGC_FN_NOS | High |
| Endocervical adenocarcinoma in situ (AIS) | AIS | High |
| Adenocarcinoma - Endocervical | ADENO_ENDO | Malignant |
| Adenocarcinoma - Endometrial | ADENO_ENDOM | Malignant |
| Adenocarcinoma - Extrauterine | ADENO_EXTRA | Malignant |
| Adenocarcinoma - NOS | ADENO_NOS | Malignant |

**Layout:**
```
┌─ Step 3B: Epithelial Cell Abnormality ─────────────────────────────┐
│                                                                     │
│  What type of epithelial abnormality?                              │
│                                                                     │
│  ○ Squamous Cell    ● Glandular Cell    ○ Both                     │
│                                                                     │
│  ┌─ Glandular Cell Abnormalities ──────────────────────────────┐  │
│  │                                                              │  │
│  │  Atypical Glandular Cells (AGC):                            │  │
│  │  ○ Endocervical cells, NOS                                  │  │
│  │  ○ Endometrial cells, NOS                                   │  │
│  │  ○ Glandular cells, NOS                                     │  │
│  │                                                              │  │
│  │  Atypical Glandular Cells, Favor Neoplastic:                │  │
│  │  ○ Endocervical cells                                       │  │
│  │  ○ Glandular cells, NOS                                     │  │
│  │                                                              │  │
│  │  Adenocarcinoma In Situ:                                    │  │
│  │  ● Endocervical adenocarcinoma in situ (AIS)               │  │
│  │                                                              │  │
│  │  Adenocarcinoma:                                            │  │
│  │  ○ Endocervical    ○ Endometrial    ○ Extrauterine   ○ NOS │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.5 Step 3C: Other Findings

**Purpose:** Document other significant findings

**Options:**
- [ ] Endometrial cells in a woman ≥45 years of age
- [ ] Other: [free text]

### 3.6 Step 4: HPV Co-Testing

**Purpose:** Integrate HPV results for risk stratification

**HPV Test Performed?**
- ○ Yes
- ○ No
- ○ Pending

**If Yes:**

| Field | Type | Options |
|-------|------|---------|
| HPV Result | Radio | Positive / Negative |
| HPV 16 | Radio | Positive / Negative / Not tested |
| HPV 18 | Radio | Positive / Negative / Not tested |
| Other HR-HPV | Radio | Positive / Negative / Not tested |
| HPV Test Method | Dropdown | Hybrid Capture 2, Cobas, Aptima, Other |

**Layout:**
```
┌─ Step 4: HPV Co-Testing ───────────────────────────────────────────┐
│                                                                     │
│  Was HPV testing performed?                                        │
│                                                                     │
│  ● Yes    ○ No    ○ Pending (results will be added later)         │
│                                                                     │
│  ┌─ HPV Results ───────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  Overall HPV Result:   ○ Positive    ● Negative             │  │
│  │                                                              │  │
│  │  ┌─ Genotype-Specific (if applicable) ──────────────────┐  │  │
│  │  │                                                       │  │  │
│  │  │  HPV 16:        ○ Positive  ● Negative  ○ Not tested │  │  │
│  │  │  HPV 18:        ○ Positive  ● Negative  ○ Not tested │  │  │
│  │  │  Other HR-HPV:  ○ Positive  ● Negative  ○ Not tested │  │  │
│  │  │                                                       │  │  │
│  │  └───────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  Test Method: [Cobas HPV Test                          ▼]  │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.7 Step 5: Hormonal Evaluation (Optional)

**Purpose:** Hormonal assessment based on cytology

**Options:**
- ○ Hormonal pattern compatible with age and history
- ○ Hormonal pattern incompatible with age and history: [specify]
- ○ Hormonal evaluation not possible due to: [specify]
- ○ Not evaluated

### 3.8 Step 6: Review & Recommendation

**Purpose:** Summary of findings and user-entered recommendation with optional system guidance

**Auto-generated Summary:**
Based on all previous selections, display a formatted summary of:
- Specimen adequacy
- Interpretation/diagnosis
- Additional findings
- HPV status

**User Recommendation (Required):**
The user enters their own recommendation FIRST in a free text field. This ensures the clinician forms their own clinical judgment before seeing any system suggestions.

**ASCCP Guideline Suggestion (Collapsible):**
A separate collapsible panel shows the algorithm-driven recommendation per ASCCP guidelines. The user can:
- Expand/collapse to view the suggestion
- Copy the text to clipboard
- Click "Use This" to populate their recommendation field

This design prevents anchoring bias while still providing guideline-based decision support.

| Cytology | HPV | Age | System Suggestion |
|----------|-----|-----|-------------------|
| NILM | Negative | 25-65 | Routine screening in 5 years (co-test) or 3 years (cytology alone) |
| NILM | Positive (not 16/18) | 30+ | Repeat co-test in 1 year |
| NILM | HPV 16/18 Positive | 30+ | Colposcopy |
| ASC-US | Negative | Any | Repeat co-test in 3 years |
| ASC-US | Positive | Any | Colposcopy |
| ASC-H | Any | Any | Colposcopy |
| LSIL | Negative | 25+ | Repeat co-test in 1 year |
| LSIL | Positive | Any | Colposcopy |
| HSIL | Any | Any | Immediate colposcopy or expedited treatment |
| AGC | Any | Any | Colposcopy with endocervical sampling |
| AIS | Any | Any | Excisional procedure |

**Layout:**
```
┌─ Step 6: Review & Recommendation ──────────────────────────────────┐
│                                                                     │
│  ┌─ Summary ───────────────────────────────────────────────────┐  │
│  │  SPECIMEN ADEQUACY: ✓ Satisfactory                          │  │
│  │  INTERPRETATION: HSIL                                        │  │
│  │  HPV CO-TESTING: Positive (HPV 16 detected)                 │  │
│  │  ADDITIONAL FINDINGS: None                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ Your Recommendation * ─────────────────────────────────────┐  │
│  │                                                              │  │
│  │  Enter your clinical recommendation based on findings:      │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ [Free text entry - user types first]                   │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ 💡 ASCCP Guideline Suggestion ──────────── [HIGH RISK] ─ ▼ ─┐  │
│  │                                                              │  │
│  │  Based on HSIL cytology with HPV 16 positive:               │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ Immediate colposcopy or expedited treatment (excision) │ │  │
│  │  │ acceptable for non-pregnant patients ≥25 years         │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  Reference: 2019 ASCCP Guidelines    [📋 Copy] [↑ Use This] │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ Additional Comments ───────────────────────────────────────┐  │
│  │ [Rich text editor for any additional notes...]              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Progress Indicator

### 4.1 Visual Design

The wizard shows a horizontal progress bar with numbered steps:

```
Specimen      General       Findings      HPV         Review &
Adequacy      Category                    Testing     Report
   ●────────────●────────────●────────────○────────────○
   1            2            3            4            5
                             ▲
                         You are here
```

### 4.2 Step States

| State | Visual | Description |
|-------|--------|-------------|
| Completed | ● (filled, green) | Step finished, can click to edit |
| Current | ● (filled, blue) | Currently active step |
| Upcoming | ○ (outline, gray) | Not yet reached |
| Skipped | ◐ (half-filled) | Skipped due to algorithm branch |

### 4.3 Navigation

- **Back button**: Returns to previous step (preserves selections)
- **Continue button**: Advances to next step (validates current step)
- **Step click**: Jump to any completed step to edit
- **Keyboard**: Enter to continue, Escape to go back

---

## 5. Summary Panel

### 5.1 Always-Visible Summary

A collapsible side panel or bottom bar shows the current selections as the user progresses:

```
┌─ Current Selections ────────────────────────────────┐
│ Adequacy: ✓ Satisfactory                            │
│ Category: Epithelial Cell Abnormality               │
│ Type: Squamous - HSIL                               │
│ HPV: (pending)                                      │
│ Recommendation: (pending)                           │
└─────────────────────────────────────────────────────┘
```

---

## 6. Data Dictionary Configuration

### 7.1 Overview

All Bethesda System classification options must be included in the OpenELIS data dictionary as part of the default installation. This ensures consistent terminology across implementations and enables proper dropdown population in the UI.

### 7.2 Dictionary Categories

The following dictionary categories must be created:

| Category Code | Description | Count |
|---------------|-------------|-------|
| CYTOLOGY_SPECIMEN_ADEQUACY | Specimen adequacy assessment | 3 |
| CYTOLOGY_ADEQUACY_LIMITATION | Reasons for limited adequacy | 6 |
| CYTOLOGY_UNSATISFACTORY_REASON | Reasons specimen is unsatisfactory | 8 |
| CYTOLOGY_GENERAL_CATEGORY | General Bethesda categorization | 3 |
| CYTOLOGY_ORGANISM | Organisms identified (NILM) | 7 |
| CYTOLOGY_NON_NEOPLASTIC | Non-neoplastic findings (NILM) | 8 |
| CYTOLOGY_SQUAMOUS_ABNORMALITY | Squamous cell abnormalities | 6 |
| CYTOLOGY_GLANDULAR_ABNORMALITY | Glandular cell abnormalities | 10 |
| CYTOLOGY_OTHER_FINDING | Other Bethesda findings | 1 |
| CYTOLOGY_HPV_RESULT | HPV test results | 4 |
| CYTOLOGY_HPV_GENOTYPE | HPV genotype results | 3 |
| CYTOLOGY_HPV_METHOD | HPV test methods | 5 |
| CYTOLOGY_HORMONAL_EVAL | Hormonal evaluation status | 4 |
| CYTOLOGY_RISK_LEVEL | Risk stratification levels | 4 |
| CYTOLOGY_RECOMMENDATION | ASCCP management recommendations | 10 |

**Total: 82 dictionary entries**

### 7.3 CSV Format

A CSV file is provided with all entries in the following format:

```
dictionary_category,code,display_name,display_order,description,risk_level,bethesda_section
```

| Column | Description |
|--------|-------------|
| dictionary_category | The category/group for this entry |
| code | Unique code for the value (used in database) |
| display_name | Human-readable name shown in UI |
| display_order | Sort order within category |
| description | Full description/definition |
| risk_level | Associated risk level (LOW/INTERMEDIATE/HIGH/MALIGNANT) if applicable |
| bethesda_section | Which section of Bethesda report this belongs to |

### 7.4 Implementation Requirements

1. **Liquibase Migration**: Create a Liquibase changeset to insert all dictionary entries
2. **Default Data**: Include in `liquibase/base/dictionary_data.xml` or equivalent
3. **Idempotent**: Migration should be idempotent (can run multiple times safely)
4. **Localization Ready**: Display names should support i18n translation keys
5. **Active Flag**: All entries should have `is_active = true` by default

### 7.5 Sample Liquibase Changeset

```xml
<changeSet id="cytology-bethesda-dictionary" author="openelis">
    <comment>Add Bethesda System dictionary entries for Cytology module</comment>
    
    <!-- Specimen Adequacy -->
    <insert tableName="dictionary">
        <column name="dictionary_category" value="CYTOLOGY_SPECIMEN_ADEQUACY"/>
        <column name="code" value="SATISFACTORY"/>
        <column name="display_name" value="Satisfactory for evaluation"/>
        <column name="display_order" value="1"/>
        <column name="is_active" value="true"/>
    </insert>
    <!-- ... additional entries ... -->
</changeSet>
```

---

## 7. Data Model

### 6.1 CytologyCase Entity

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| order_id | UUID | FK to order |
| specimen_adequacy | Enum | SATISFACTORY, SATISFACTORY_LIMITED, UNSATISFACTORY |
| adequacy_limitation_reasons | JSON | Array of limitation codes |
| unsatisfactory_reason | Enum | Reason code if unsatisfactory |
| unsatisfactory_details | Text | Free text details |
| general_category | Enum | NILM, EPITHELIAL_ABNORMALITY, OTHER |
| squamous_abnormality | Enum | ASC_US, ASC_H, LSIL, HSIL, HSIL_SUSPICIOUS, SCC |
| glandular_abnormality | Enum | AGC codes, AIS, adenocarcinoma codes |
| organisms | JSON | Array of organism codes |
| non_neoplastic_findings | JSON | Array of finding codes |
| other_findings | Text | Free text |
| hpv_tested | Boolean | Whether HPV testing was performed |
| hpv_result | Enum | POSITIVE, NEGATIVE, PENDING |
| hpv_16_result | Enum | POSITIVE, NEGATIVE, NOT_TESTED |
| hpv_18_result | Enum | POSITIVE, NEGATIVE, NOT_TESTED |
| hpv_other_hr_result | Enum | POSITIVE, NEGATIVE, NOT_TESTED |
| hpv_test_method | String | Test method used |
| hormonal_evaluation | Enum | COMPATIBLE, INCOMPATIBLE, NOT_POSSIBLE, NOT_EVALUATED |
| hormonal_evaluation_notes | Text | Details if incompatible/not possible |
| recommendation_code | String | Algorithm-generated suggestion code |
| recommendation_text | Text | Algorithm-generated suggestion text |
| user_recommendation | Text | User-entered recommendation (required) |
| additional_comments | Text | Free text comments |
| screened_by | UUID | FK to user (cytotechnologist) |
| screened_date | Timestamp | When screened |
| reviewed_by | UUID | FK to user (pathologist) |
| reviewed_date | Timestamp | When reviewed/signed out |
| status | Enum | SCREENING, REVIEW, COMPLETE |

### 6.2 CytologyReport Entity

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| case_id | UUID | FK to CytologyCase |
| version_number | Integer | Sequential version |
| report_type | Enum | DRAFT, FINAL |
| generated_date | Timestamp | When created |
| generated_by | String | FK to user |
| pdf_path | String | Path to generated PDF |

---

## 8. API Endpoints

### 7.1 Case Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cytology/case/{id}` | Get case with all fields |
| PUT | `/api/cytology/case/{id}` | Update case |
| PUT | `/api/cytology/case/{id}/step/{stepNumber}` | Update specific step |
| POST | `/api/cytology/case/{id}/complete-screening` | Mark screening complete |
| POST | `/api/cytology/case/{id}/sign-out` | Pathologist sign-out |

### 7.2 Recommendation Engine

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cytology/recommendation` | Calculate recommendation based on inputs |

Request body:
```json
{
  "cytologyResult": "HSIL",
  "hpvResult": "POSITIVE",
  "hpv16": true,
  "hpv18": false,
  "patientAge": 35
}
```

Response:
```json
{
  "recommendationCode": "COLPO_IMMEDIATE",
  "recommendationText": "Immediate colposcopy or expedited treatment",
  "riskLevel": "HIGH",
  "reference": "2019 ASCCP Guidelines"
}
```

### 7.3 Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cytology/case/{id}/report/generate` | Generate report PDF |
| GET | `/api/cytology/case/{id}/reports` | List generated reports |

---

## 9. Acceptance Criteria

- [ ] **AC-1**: Wizard guides user through Bethesda algorithm step-by-step
- [ ] **AC-2**: Progress indicator shows current step and completed steps
- [ ] **AC-3**: User can navigate back to previous steps to edit
- [ ] **AC-4**: Conditional fields only appear based on previous selections
- [ ] **AC-5**: Specimen adequacy step correctly branches to end if Unsatisfactory
- [ ] **AC-6**: NILM path shows organisms and non-neoplastic findings
- [ ] **AC-7**: Epithelial abnormality path shows squamous/glandular options
- [ ] **AC-8**: HPV co-testing integrates with recommendation engine
- [ ] **AC-9**: System suggestion shown in collapsible panel with Copy and Use This buttons
- [ ] **AC-10**: User must enter their own recommendation first (required field)
- [ ] **AC-11**: Summary shows all selections before report generation
- [ ] **AC-12**: Report includes all Bethesda elements in standard format
- [ ] **AC-13**: Save Progress saves current wizard state
- [ ] **AC-14**: Case can be saved mid-wizard and resumed later
- [ ] **AC-15**: Validation prevents advancing without required selections
- [ ] **AC-16**: All Bethesda classification options included in data dictionary default installation

---

## 10. Wireframes

### 9.1 Step 3B with Squamous Abnormalities Selected

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Home / Cytology / 24CYT000042                                               │
│ Cytology Case - 24CYT000042                                                 │
│ Patient: SMITH, MARY | DOB: 1985-06-15 | F | Status: SCREENING              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─ Case Information ──────────────────────────────────────────────── ▶ ─┐  │
│ └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌─ Bethesda Classification ─────────────────────────────────────────────┐  │
│ │                                                                        │  │
│ │   Specimen      General       Findings        HPV         Review &    │  │
│ │   Adequacy      Category                     Testing      Report      │  │
│ │      ●────────────●────────────●────────────○────────────○           │  │
│ │      ✓            ✓         Current                                   │  │
│ │                                                                        │  │
│ │  ┌─ Step 3: Epithelial Cell Abnormality ───────────────────────────┐ │  │
│ │  │                                                                  │ │  │
│ │  │  What type of epithelial abnormality?                           │ │  │
│ │  │                                                                  │ │  │
│ │  │  ● Squamous Cell    ○ Glandular Cell    ○ Both                  │ │  │
│ │  │                                                                  │ │  │
│ │  │  ┌─ Squamous Cell Abnormalities ─────────────────────────────┐ │ │  │
│ │  │  │                                                            │ │ │  │
│ │  │  │  Atypical Squamous Cells:                                 │ │ │  │
│ │  │  │  ○ ASC-US (of undetermined significance)                  │ │ │  │
│ │  │  │  ○ ASC-H (cannot exclude HSIL)                            │ │ │  │
│ │  │  │                                                            │ │ │  │
│ │  │  │  Squamous Intraepithelial Lesion:                         │ │ │  │
│ │  │  │  ○ LSIL (Low-grade)                                       │ │ │  │
│ │  │  │  ● HSIL (High-grade)                                      │ │ │  │
│ │  │  │  ○ HSIL with features suspicious for invasion             │ │ │  │
│ │  │  │                                                            │ │ │  │
│ │  │  │  Carcinoma:                                                │ │ │  │
│ │  │  │  ○ Squamous cell carcinoma                                │ │ │  │
│ │  │  │                                                            │ │ │  │
│ │  │  └────────────────────────────────────────────────────────────┘ │ │  │
│ │  │                                                                  │ │  │
│ │  └──────────────────────────────────────────────────────────────────┘ │  │
│ │                                                                        │  │
│ │  ┌─ Current Selections ─────────────────────────────────────────────┐ │  │
│ │  │ ✓ Satisfactory  │  Epithelial Abnormality  │  Squamous: HSIL    │ │  │
│ │  └──────────────────────────────────────────────────────────────────┘ │  │
│ │                                                                        │  │
│ │                         [← Back]              [Continue →]             │  │
│ │                                                                        │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                              [Save Progress]            [Generate Report]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Color Coding & Risk Levels

### 10.1 Result Severity Colors

| Severity | Color | Background | Examples |
|----------|-------|------------|----------|
| Normal | Green | #d4edda | NILM |
| Low Risk | Yellow | #fff3cd | ASC-US, LSIL |
| Intermediate | Orange | #ffe0b2 | ASC-H, AGC |
| High Risk | Red | #f8d7da | HSIL, AIS |
| Malignant | Dark Red | #dc3545 | SCC, Adenocarcinoma |

### 10.2 Recommendation Risk Badges

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ● LOW RISK   │  │ ● HIGH RISK  │  │ ● MALIGNANT  │
│   (green)    │  │   (red)      │  │   (dark red) │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 12. Related Features

- **Pathology Case View** (OGC-264): Different workflow (blocks/slides)
- **IHC Case View** (OGC-265): Different workflow (scoring fields)
- **HPV Results Entry**: Integration with cytology recommendation
- **Quality Assurance**: Rescreening workflow for 10% QA review

---

## 13. Future Enhancements (Out of Scope v1)

1. **ThinPrep/SurePath specific fields** - Liquid-based cytology specifics
2. **Image attachment** - Attach representative images to case
3. **QA rescreening workflow** - 10% random rescreen, all abnormals
4. **Non-gynecologic cytology** - FNA, body fluids, respiratory
5. **Prior history integration** - Show previous Pap results
6. **Screening time tracking** - Measure time per slide for productivity
