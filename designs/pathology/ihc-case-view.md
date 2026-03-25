# OpenELIS Global - IHC Case View v2 Enhancements
## Functional Requirements Specification

**Version:** 2.0  
**Date:** December 2025  
**Module:** Immunohistochemistry → Case Detail View  
**Route:** `/ImmunohistochemistryCaseView/:caseId`  
**Parent Epic:** OGC-265

---

## 1. Overview

### 1.1 Purpose

This specification defines the v2 enhancements to the IHC Case View, building on the v1 redesign (always-visible scoring fields). These enhancements add intelligent automation, pre-configured panel templates, and digital pathology integration to streamline pathologist workflows.

### 1.2 Features Summary

| Feature | Description | Priority |
|---------|-------------|----------|
| Auto-Calculate Allred Scores | Compute Allred from proportion + intensity | High |
| Auto-Suggest Molecular SubType | Suggest subtype from ER/PR/HER2/Ki-67 | High |
| ISH Interpretation Calculator | Interpret HER2 status from ISH results | High |
| Panel Templates | Pre-configured marker panels | Medium |
| Digital Pathology Integration | View stained slides inline | Medium |

### 1.3 Users

| Role | Benefits |
|------|----------|
| Pathologist | Faster scoring with auto-calculations, reduced cognitive load |
| Lab Technician | Standardized panels ensure complete marker coverage |
| Lab Manager | Consistent reporting, quality metrics tracking |

---

## 2. Auto-Calculate Allred Scores

### 2.1 Background

The Allred Score is a semi-quantitative scoring system for ER and PR immunohistochemistry in breast cancer. It combines:
- **Proportion Score (PS)**: Percentage of positive cells (0-5)
- **Intensity Score (IS)**: Average staining intensity (0-3)
- **Total Allred Score**: PS + IS (0-8)

Currently, pathologists must manually calculate and enter the Allred score. This enhancement auto-calculates it from the entered percentage and intensity.

### 2.2 Proportion Score Mapping

| Percentage Range | Proportion Score |
|------------------|------------------|
| 0% | 0 |
| <1% | 1 |
| 1-10% | 2 |
| 11-33% | 3 |
| 34-66% | 4 |
| 67-100% | 5 |

### 2.3 Intensity Score Mapping

| Intensity | Score |
|-----------|-------|
| Negative | 0 |
| Weak | 1 |
| Moderate | 2 |
| Strong | 3 |

### 2.4 UI Behavior

```
┌─ Hormone Receptor Scoring ─────────────────────────────────────────────┐
│                                                                         │
│  ER   [  85 ]% nuclear staining     Intensity [Strong        ▼]        │
│       Allred Score: [  8  ] / 8   ← Auto-calculated ✓                  │
│       ℹ️ Proportion: 5 (67-100%) + Intensity: 3 (Strong) = 8           │
│                                                                         │
│       [🔒 Lock] to override auto-calculation                            │
│                                                                         │
│  PR   [  45 ]% nuclear staining     Intensity [Moderate      ▼]        │
│       Allred Score: [  6  ] / 8   ← Auto-calculated ✓                  │
│       ℹ️ Proportion: 4 (34-66%) + Intensity: 2 (Moderate) = 6          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.5 Functional Requirements

| ID | Requirement |
|----|-------------|
| ALLRED-1 | System SHALL auto-calculate Allred score when percentage AND intensity are entered |
| ALLRED-2 | System SHALL display breakdown tooltip showing PS + IS calculation |
| ALLRED-3 | User MAY lock the Allred field to override with manual value |
| ALLRED-4 | Locked fields SHALL display lock icon and disable auto-calculation |
| ALLRED-5 | Changing percentage or intensity on unlocked field SHALL recalculate Allred |
| ALLRED-6 | System SHALL validate Allred score 0-8 even when manually overridden |

### 2.6 Calculation Logic (Pseudocode)

```javascript
function calculateProportionScore(percentage) {
  if (percentage === 0) return 0;
  if (percentage < 1) return 1;
  if (percentage <= 10) return 2;
  if (percentage <= 33) return 3;
  if (percentage <= 66) return 4;
  return 5; // 67-100%
}

function calculateAllredScore(percentage, intensity) {
  const proportionScore = calculateProportionScore(percentage);
  const intensityScore = { 'Negative': 0, 'Weak': 1, 'Moderate': 2, 'Strong': 3 }[intensity];
  return proportionScore + intensityScore;
}
```

---

## 3. Auto-Suggest Molecular SubType

### 3.1 Background

Breast cancer molecular subtypes are classified based on immunohistochemical markers:
- **Estrogen Receptor (ER)**: Positive ≥1%
- **Progesterone Receptor (PR)**: Positive ≥1%
- **HER2**: Positive if 3+ or ISH amplified
- **Ki-67**: Low <20%, High ≥20%

### 3.2 Molecular SubType Classification Algorithm

| SubType | ER | PR | HER2 | Ki-67 |
|---------|----|----|------|-------|
| Luminal A | + | + (≥20%) | - | Low (<20%) |
| Luminal B (HER2-negative) | + | Any | - | High (≥20%) OR PR <20% |
| Luminal B (HER2-positive) | + | Any | + | Any |
| HER2-enriched | - | - | + | Any |
| Triple-negative / Basal-like | - | - | - | Any |

### 3.3 UI Behavior

```
┌─ Diagnosis ────────────────────────────────────────────────────────────┐
│                                                                         │
│  Histological Diagnosis:                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Invasive ductal carcinoma, Grade 2, Nottingham score 6/9        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Molecular SubType:                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 💡 Suggested: Luminal A                                          │   │
│  │                                                                   │   │
│  │ Based on: ER+ (85%), PR+ (45%), HER2- (Score 1+), Ki-67 Low (15%)│   │
│  │                                                                   │   │
│  │    [Accept Suggestion]    [Choose Different ▼]                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ⚠️ Final classification requires clinical correlation                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Functional Requirements

| ID | Requirement |
|----|-------------|
| SUBTYPE-1 | System SHALL suggest molecular subtype when ER, PR, HER2, and Ki-67 values are entered |
| SUBTYPE-2 | Suggestion SHALL display reasoning showing which markers led to classification |
| SUBTYPE-3 | User MAY accept suggestion with one click |
| SUBTYPE-4 | User MAY override suggestion by selecting different subtype from dropdown |
| SUBTYPE-5 | System SHALL display warning that final classification requires clinical correlation |
| SUBTYPE-6 | Suggestion SHALL update in real-time as marker values change |
| SUBTYPE-7 | If insufficient data for suggestion, system SHALL display "Insufficient data" message |

### 3.5 Classification Logic (Pseudocode)

```javascript
function suggestMolecularSubType(er, pr, her2Status, ki67) {
  const erPositive = er >= 1;
  const prPositive = pr >= 1;
  const prHigh = pr >= 20;
  const her2Positive = her2Status === 'Positive' || her2Status === '3+';
  const ki67Low = ki67 < 20;

  if (!erPositive && !prPositive && !her2Positive) {
    return { subtype: 'Triple-negative / Basal-like', confidence: 'High' };
  }
  
  if (!erPositive && !prPositive && her2Positive) {
    return { subtype: 'HER2-enriched', confidence: 'High' };
  }
  
  if (erPositive && her2Positive) {
    return { subtype: 'Luminal B (HER2-positive)', confidence: 'High' };
  }
  
  if (erPositive && !her2Positive) {
    if (ki67Low && prHigh) {
      return { subtype: 'Luminal A', confidence: 'High' };
    } else {
      return { subtype: 'Luminal B (HER2-negative)', confidence: 'High' };
    }
  }
  
  return { subtype: null, confidence: null, message: 'Unable to classify - verify marker values' };
}
```

---

## 4. ISH Interpretation Calculator

### 4.1 Background

Dual ISH (In Situ Hybridization) testing determines HER2 gene amplification status. The ASCO/CAP 2018 guidelines define interpretation based on:
- **HER2/CEP17 Ratio**: Ratio of HER2 signals to chromosome 17 centromere signals
- **Average HER2 Signals/Cell**: Mean HER2 copy number per nucleus

### 4.2 ASCO/CAP 2018 Interpretation Algorithm

| Group | HER2/CEP17 Ratio | Avg HER2/Cell | Interpretation | Action |
|-------|------------------|---------------|----------------|--------|
| 1 | ≥2.0 | ≥4.0 | **Positive** | HER2-targeted therapy eligible |
| 2 | ≥2.0 | <4.0 | **Positive** | HER2-targeted therapy eligible |
| 3 | <2.0 | ≥6.0 | **Positive** | HER2-targeted therapy eligible |
| 4 | <2.0 | ≥4.0 and <6.0 | **Equivocal** | Retest with alternate assay |
| 5 | <2.0 | <4.0 | **Negative** | Not eligible |

### 4.3 UI Behavior

```
┌─ ISH Scoring ──────────────────────────────────────────────────────────┐
│                                                                         │
│  Number of Cancer nuclei counted:        [    50    ]                   │
│                                                                         │
│  Average HER2 signals per nucleus:       [   5.2    ]                   │
│                                                                         │
│  Average Chromosome 17 signals per nucleus: [   2.1    ]                │
│                                                                         │
│  HER2/CEP17 Ratio:                       [   2.48   ] ← Auto-calculated │
│                                                                         │
│  ┌─ ISH Interpretation ────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  🔬 HER2 Status: POSITIVE (Group 1)                              │   │
│  │                                                                   │   │
│  │  Ratio ≥2.0 (2.48) AND Avg HER2 ≥4.0 (5.2)                       │   │
│  │  → ASCO/CAP 2018 Group 1: ISH Positive                           │   │
│  │                                                                   │   │
│  │  ✓ Patient eligible for HER2-targeted therapy                    │   │
│  │                                                                   │   │
│  │     [Accept Interpretation]    [Override ▼]                      │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  IHC (CerbB2) Score:                     [2+             ▼]             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Functional Requirements

| ID | Requirement |
|----|-------------|
| ISH-1 | System SHALL auto-calculate HER2/CEP17 ratio from entered values |
| ISH-2 | System SHALL interpret HER2 status using ASCO/CAP 2018 algorithm |
| ISH-3 | Interpretation SHALL display Group number (1-5) and status |
| ISH-4 | System SHALL display clinical implication (therapy eligibility) |
| ISH-5 | User MAY accept or override interpretation |
| ISH-6 | For Group 4 (Equivocal), system SHALL recommend retesting |
| ISH-7 | Interpretation SHALL update in real-time as values change |

### 4.5 Interpretation Logic (Pseudocode)

```javascript
function interpretISH(avgHER2, avgCEP17) {
  const ratio = avgHER2 / avgCEP17;
  
  if (ratio >= 2.0) {
    if (avgHER2 >= 4.0) {
      return { group: 1, status: 'Positive', action: 'HER2-targeted therapy eligible' };
    } else {
      return { group: 2, status: 'Positive', action: 'HER2-targeted therapy eligible' };
    }
  } else {
    if (avgHER2 >= 6.0) {
      return { group: 3, status: 'Positive', action: 'HER2-targeted therapy eligible' };
    } else if (avgHER2 >= 4.0) {
      return { group: 4, status: 'Equivocal', action: 'Recommend retest with alternate assay' };
    } else {
      return { group: 5, status: 'Negative', action: 'Not eligible for HER2-targeted therapy' };
    }
  }
}
```

---

## 5. Panel Templates

### 5.1 Background

IHC panels are standardized sets of markers used to diagnose specific tumor types. Pre-configured templates ensure complete marker coverage and reduce the risk of missing critical stains.

### 5.2 Default Panel Templates

#### 5.2.1 Breast Cancer Panel

| Marker | Purpose |
|--------|---------|
| ER | Estrogen receptor status |
| PR | Progesterone receptor status |
| HER2 | HER2 overexpression |
| Ki-67 | Proliferation index |
| E-cadherin | Lobular vs ductal differentiation (optional) |

#### 5.2.2 Lymphoma Panel

| Marker | Purpose |
|--------|---------|
| CD20 | B-cell marker |
| CD3 | T-cell marker |
| CD10 | Germinal center marker |
| BCL-2 | Anti-apoptotic protein |
| BCL-6 | Germinal center transcription factor |
| MUM1 | Post-germinal center marker |
| Ki-67 | Proliferation index |
| CD5 | Mantle cell/CLL marker |
| Cyclin D1 | Mantle cell lymphoma |

#### 5.2.3 Melanoma Panel

| Marker | Purpose |
|--------|---------|
| S100 | Melanocyte marker (sensitive) |
| HMB-45 | Melanocyte marker (specific) |
| Melan-A/MART-1 | Melanocyte differentiation |
| SOX10 | Neural crest/melanocyte marker |
| Ki-67 | Proliferation index |

#### 5.2.4 Lung Carcinoma Panel

| Marker | Purpose |
|--------|---------|
| TTF-1 | Lung adenocarcinoma |
| Napsin A | Lung adenocarcinoma |
| p40 | Squamous differentiation |
| CK5/6 | Squamous differentiation |
| Chromogranin | Neuroendocrine |
| Synaptophysin | Neuroendocrine |
| Ki-67 | Proliferation index |

#### 5.2.5 GI Stromal Tumor (GIST) Panel

| Marker | Purpose |
|--------|---------|
| CD117 (c-KIT) | GIST marker |
| DOG1 | GIST marker |
| CD34 | Vascular/GIST marker |
| SMA | Smooth muscle |
| Desmin | Muscle differentiation |
| S100 | Neural differentiation |
| Ki-67 | Proliferation index |

### 5.3 UI Behavior

```
┌─ Panel Template Selection ─────────────────────────────────────────────┐
│                                                                         │
│  Select Panel Template:   [Breast Cancer Standard         ▼]           │
│                                                                         │
│  Or create custom panel   [+ New Custom Panel]                         │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📋 Breast Cancer Standard Panel                                        │
│                                                                         │
│  Required Markers:                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ☑ ER (Estrogen Receptor)                        Status: Pending  │  │
│  │ ☑ PR (Progesterone Receptor)                    Status: Pending  │  │
│  │ ☑ HER2                                          Status: Pending  │  │
│  │ ☑ Ki-67                                         Status: Pending  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Optional Markers:                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ☐ E-cadherin (Lobular vs Ductal)                                 │  │
│  │ ☐ p53                                                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [+ Add Additional Marker]                                              │
│                                                                         │
│  Panel Completion: ████░░░░░░ 0/4 required markers scored               │
│                                                                         │
│  [Apply Panel]   [Save as Custom Template]                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Functional Requirements

| ID | Requirement |
|----|-------------|
| PANEL-1 | System SHALL provide pre-configured panel templates for common tumor types |
| PANEL-2 | User MAY select a panel template when creating/editing IHC case |
| PANEL-3 | Selected panel SHALL populate required markers checklist |
| PANEL-4 | System SHALL track completion status for each marker in panel |
| PANEL-5 | System SHALL warn if generating report with incomplete required markers |
| PANEL-6 | User MAY add additional markers beyond panel template |
| PANEL-7 | User MAY create and save custom panel templates |
| PANEL-8 | Lab Manager MAY configure which panels are available at site level |
| PANEL-9 | Panel completion percentage SHALL be visible on case list view |

### 5.5 Data Model

#### PanelTemplate Entity

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Template name |
| description | Text | Template description |
| tumor_type | String | Associated tumor type |
| is_system | Boolean | True if system-provided, false if custom |
| site_id | FK | Site (null for global templates) |
| created_by | FK | User who created (for custom) |
| is_active | Boolean | Whether template is available |

#### PanelTemplateMarker Entity

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| template_id | FK | Link to PanelTemplate |
| marker_name | String | Marker name (e.g., "ER", "CD20") |
| marker_code | String | Standardized code |
| is_required | Boolean | Required vs optional |
| display_order | Integer | Order in panel |
| interpretation_guide | Text | How to interpret results |

---

## 6. Database Migration & Test Catalog Integration

### 6.1 Overview

Panel templates are system-provided reference data that must be:
1. Added to the default OpenELIS test catalog
2. Loaded during initial database setup via Liquibase migration
3. Available to all sites upon fresh installation

### 6.2 Data Dictionary

The complete panel template data dictionary is provided as a CSV file: `IHC_Panel_Templates_DataDictionary.csv`

**Summary Statistics:**
| Panel | Tumor Type | Required Markers | Optional Markers | Total |
|-------|------------|------------------|------------------|-------|
| Breast Cancer Standard | Breast | 4 | 2 | 6 |
| Lymphoma Panel | Lymphoma | 7 | 4 | 11 |
| Melanoma Panel | Melanoma | 4 | 3 | 7 |
| Lung Carcinoma Panel | Lung | 4 | 4 | 8 |
| GIST Panel | GI Stromal | 3 | 4 | 7 |
| Colorectal MMR Panel | Colorectal | 4 | 3 | 7 |
| Prostate Carcinoma Panel | Prostate | 5 | 2 | 7 |
| **TOTAL** | | **31** | **22** | **53** |

### 6.3 Liquibase Migration

#### 6.3.1 Panel Template Table

```xml
<changeSet id="ihc-panel-template-table" author="openelis">
  <preConditions onFail="MARK_RAN">
    <not><tableExists tableName="ihc_panel_template"/></not>
  </preConditions>
  
  <createTable tableName="ihc_panel_template">
    <column name="id" type="UUID">
      <constraints primaryKey="true" nullable="false"/>
    </column>
    <column name="template_id" type="VARCHAR(50)">
      <constraints nullable="false" unique="true"/>
    </column>
    <column name="name" type="VARCHAR(100)">
      <constraints nullable="false"/>
    </column>
    <column name="description" type="TEXT"/>
    <column name="tumor_type" type="VARCHAR(50)"/>
    <column name="is_system" type="BOOLEAN" defaultValueBoolean="false"/>
    <column name="is_active" type="BOOLEAN" defaultValueBoolean="true"/>
    <column name="site_id" type="UUID"/>
    <column name="created_by" type="UUID"/>
    <column name="created_date" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
    <column name="last_updated" type="TIMESTAMP"/>
  </createTable>
  
  <createIndex tableName="ihc_panel_template" indexName="idx_panel_template_tumor">
    <column name="tumor_type"/>
  </createIndex>
</changeSet>
```

#### 6.3.2 Panel Template Marker Table

```xml
<changeSet id="ihc-panel-template-marker-table" author="openelis">
  <preConditions onFail="MARK_RAN">
    <not><tableExists tableName="ihc_panel_template_marker"/></not>
  </preConditions>
  
  <createTable tableName="ihc_panel_template_marker">
    <column name="id" type="UUID">
      <constraints primaryKey="true" nullable="false"/>
    </column>
    <column name="template_id" type="UUID">
      <constraints nullable="false" 
                   foreignKeyName="fk_marker_template" 
                   references="ihc_panel_template(id)"/>
    </column>
    <column name="marker_name" type="VARCHAR(100)">
      <constraints nullable="false"/>
    </column>
    <column name="marker_code" type="VARCHAR(20)"/>
    <column name="is_required" type="BOOLEAN" defaultValueBoolean="true"/>
    <column name="display_order" type="INTEGER" defaultValueNumeric="0"/>
    <column name="interpretation_guide" type="TEXT"/>
  </createTable>
  
  <createIndex tableName="ihc_panel_template_marker" indexName="idx_marker_template">
    <column name="template_id"/>
  </createIndex>
</changeSet>
```

#### 6.3.3 Load Default Panel Templates

```xml
<changeSet id="ihc-panel-templates-default-data" author="openelis">
  <comment>Load default IHC panel templates into test catalog</comment>
  
  <!-- Breast Cancer Standard Panel -->
  <insert tableName="ihc_panel_template">
    <column name="id" valueComputed="uuid_generate_v4()"/>
    <column name="template_id" value="BREAST_STD"/>
    <column name="name" value="Breast Cancer Standard"/>
    <column name="description" value="Standard breast cancer hormone receptor panel for ER/PR/HER2/Ki-67 assessment"/>
    <column name="tumor_type" value="Breast"/>
    <column name="is_system" valueBoolean="true"/>
    <column name="is_active" valueBoolean="true"/>
  </insert>
  
  <!-- Lymphoma Panel -->
  <insert tableName="ihc_panel_template">
    <column name="id" valueComputed="uuid_generate_v4()"/>
    <column name="template_id" value="LYMPH_STD"/>
    <column name="name" value="Lymphoma Panel"/>
    <column name="description" value="Comprehensive B-cell and T-cell lymphoma workup panel"/>
    <column name="tumor_type" value="Lymphoma"/>
    <column name="is_system" valueBoolean="true"/>
    <column name="is_active" valueBoolean="true"/>
  </insert>
  
  <!-- Melanoma Panel -->
  <insert tableName="ihc_panel_template">
    <column name="id" valueComputed="uuid_generate_v4()"/>
    <column name="template_id" value="MEL_STD"/>
    <column name="name" value="Melanoma Panel"/>
    <column name="description" value="Melanocytic lesion workup panel"/>
    <column name="tumor_type" value="Melanoma"/>
    <column name="is_system" valueBoolean="true"/>
    <column name="is_active" valueBoolean="true"/>
  </insert>
  
  <!-- Lung Carcinoma Panel -->
  <insert tableName="ihc_panel_template">
    <column name="id" valueComputed="uuid_generate_v4()"/>
    <column name="template_id" value="LUNG_STD"/>
    <column name="name" value="Lung Carcinoma Panel"/>
    <column name="description" value="Lung carcinoma subtyping panel for adenocarcinoma vs squamous differentiation"/>
    <column name="tumor_type" value="Lung"/>
    <column name="is_system" valueBoolean="true"/>
    <column name="is_active" valueBoolean="true"/>
  </insert>
  
  <!-- GIST Panel -->
  <insert tableName="ihc_panel_template">
    <column name="id" valueComputed="uuid_generate_v4()"/>
    <column name="template_id" value="GIST_STD"/>
    <column name="name" value="GIST Panel"/>
    <column name="description" value="Gastrointestinal stromal tumor diagnostic panel"/>
    <column name="tumor_type" value="GI Stromal"/>
    <column name="is_system" valueBoolean="true"/>
    <column name="is_active" valueBoolean="true"/>
  </insert>
  
  <!-- Colorectal MMR Panel -->
  <insert tableName="ihc_panel_template">
    <column name="id" valueComputed="uuid_generate_v4()"/>
    <column name="template_id" value="CRC_STD"/>
    <column name="name" value="Colorectal Carcinoma MMR Panel"/>
    <column name="description" value="Mismatch repair protein panel for Lynch syndrome screening"/>
    <column name="tumor_type" value="Colorectal"/>
    <column name="is_system" valueBoolean="true"/>
    <column name="is_active" valueBoolean="true"/>
  </insert>
  
  <!-- Prostate Carcinoma Panel -->
  <insert tableName="ihc_panel_template">
    <column name="id" valueComputed="uuid_generate_v4()"/>
    <column name="template_id" value="PROST_STD"/>
    <column name="name" value="Prostate Carcinoma Panel"/>
    <column name="description" value="Prostate adenocarcinoma confirmation panel"/>
    <column name="tumor_type" value="Prostate"/>
    <column name="is_system" valueBoolean="true"/>
    <column name="is_active" valueBoolean="true"/>
  </insert>
</changeSet>
```

#### 6.3.4 Load Panel Markers (CSV Load)

```xml
<changeSet id="ihc-panel-markers-load" author="openelis">
  <comment>Load panel markers from CSV data dictionary</comment>
  <loadData tableName="ihc_panel_template_marker"
            file="db/changelog/data/ihc_panel_markers.csv"
            separator=","
            quotchar='"'>
    <column name="id" type="computed" valueComputed="uuid_generate_v4()"/>
    <column name="template_id" type="computed" 
            valueComputed="(SELECT id FROM ihc_panel_template WHERE template_id = :template_id)"/>
    <column name="marker_name" type="string"/>
    <column name="marker_code" type="string"/>
    <column name="is_required" type="boolean"/>
    <column name="display_order" type="numeric"/>
    <column name="interpretation_guide" type="string"/>
  </loadData>
</changeSet>
```

### 6.4 Test Catalog Integration

#### 6.4.1 Test Catalog Reference

Panel templates should be linked to test catalog entries for automatic marker ordering:

| Panel | Associated Test Catalog Entries |
|-------|--------------------------------|
| BREAST_STD | ER IHC, PR IHC, HER2 IHC, Ki-67 IHC |
| LYMPH_STD | CD20 IHC, CD3 IHC, CD10 IHC, BCL-2 IHC, BCL-6 IHC, MUM1 IHC, Ki-67 IHC |
| MEL_STD | S100 IHC, HMB-45 IHC, Melan-A IHC, SOX10 IHC |
| LUNG_STD | TTF-1 IHC, Napsin A IHC, p40 IHC, CK5/6 IHC |
| GIST_STD | CD117 IHC, DOG1 IHC, CD34 IHC |
| CRC_STD | MLH1 IHC, PMS2 IHC, MSH2 IHC, MSH6 IHC |
| PROST_STD | PSA IHC, NKX3.1 IHC, AMACR IHC, p63 IHC, HMWCK IHC |

#### 6.4.2 Panel-Test Mapping Table

```xml
<changeSet id="ihc-panel-test-mapping-table" author="openelis">
  <createTable tableName="ihc_panel_test_mapping">
    <column name="id" type="UUID">
      <constraints primaryKey="true" nullable="false"/>
    </column>
    <column name="panel_marker_id" type="UUID">
      <constraints nullable="false" 
                   foreignKeyName="fk_mapping_marker" 
                   references="ihc_panel_template_marker(id)"/>
    </column>
    <column name="test_id" type="UUID">
      <constraints foreignKeyName="fk_mapping_test" 
                   references="test(id)"/>
    </column>
  </createTable>
</changeSet>
```

### 6.5 Site Configuration

Labs can configure which system panels are visible and create custom panels:

| Setting | Description | Default |
|---------|-------------|---------|
| `ihc.panels.breast.enabled` | Enable Breast Cancer panel | true |
| `ihc.panels.lymphoma.enabled` | Enable Lymphoma panel | true |
| `ihc.panels.melanoma.enabled` | Enable Melanoma panel | true |
| `ihc.panels.lung.enabled` | Enable Lung Carcinoma panel | true |
| `ihc.panels.gist.enabled` | Enable GIST panel | true |
| `ihc.panels.colorectal.enabled` | Enable Colorectal MMR panel | true |
| `ihc.panels.prostate.enabled` | Enable Prostate panel | true |
| `ihc.panels.custom.allowed` | Allow creation of custom panels | true |

---

## 7. Digital Pathology Integration

### 7.1 Background

Digital pathology systems scan glass slides into high-resolution whole slide images (WSI). Integrating these images into the IHC Case View allows pathologists to:
- View stained slides without switching applications
- Compare multiple stains side-by-side
- Correlate morphology with IHC results
- Annotate regions of interest

### 7.2 Supported Integrations

| System | Integration Type | Status |
|--------|------------------|--------|
| OpenSlide | Direct file access | Supported |
| DICOM WSI | DICOM web viewer | Supported |
| PathCore | API integration | Planned |
| Aperio eSlide | API integration | Planned |
| Philips IntelliSite | API integration | Planned |

### 7.3 UI Behavior

```
┌─ Digital Slides ───────────────────────────────────────────────────────┐
│                                                                         │
│  Case: 24IHC000015 | 4 slides available                                │
│                                                                         │
│  ┌─ Slide Thumbnails ──────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │   │
│  │  │  ███    │  │  ███    │  │  ███    │  │  ███    │            │   │
│  │  │  █ER█   │  │  █PR█   │  │  HER2   │  │ Ki-67   │            │   │
│  │  │  ███    │  │  ███    │  │  ███    │  │  ███    │            │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │   │
│  │      ER          PR          HER2        Ki-67                  │   │
│  │   ● Selected                                                     │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ Slide Viewer ──────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │                                                             │ │   │
│  │  │                   [Whole Slide Image]                       │ │   │
│  │  │                                                             │ │   │
│  │  │                      Zoom: 20x                              │ │   │
│  │  │                                                             │ │   │
│  │  │  ┌─────┐                                                    │ │   │
│  │  │  │ Nav │  ← Thumbnail navigator                             │ │   │
│  │  │  └─────┘                                                    │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  │                                                                   │   │
│  │  [🔍+] [🔍-] [↻ Reset] [📐 Measure] [✏️ Annotate] [⬜ Compare]   │   │
│  │                                                                   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Expand to Full Screen]   [Open in External Viewer]                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Comparison View

```
┌─ Side-by-Side Comparison ──────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────────────────────┐  ┌──────────────────────────┐            │
│  │                          │  │                          │            │
│  │      ER (Strong 3+)      │  │      HER2 (Score 2+)     │            │
│  │                          │  │                          │            │
│  │   [Whole Slide Image]    │  │   [Whole Slide Image]    │            │
│  │                          │  │                          │            │
│  │                          │  │                          │            │
│  └──────────────────────────┘  └──────────────────────────┘            │
│                                                                         │
│  🔗 Synchronized navigation: ON                                         │
│                                                                         │
│  Left:  [ER              ▼]    Right: [HER2            ▼]              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.5 Functional Requirements

| ID | Requirement |
|----|-------------|
| DIGIPATH-1 | System SHALL display thumbnails of available digital slides |
| DIGIPATH-2 | User MAY click thumbnail to view slide in embedded viewer |
| DIGIPATH-3 | Viewer SHALL support pan, zoom, and reset navigation |
| DIGIPATH-4 | Viewer SHALL display current magnification level |
| DIGIPATH-5 | User MAY measure distances on slide |
| DIGIPATH-6 | User MAY add annotations (rectangles, arrows, text) |
| DIGIPATH-7 | Annotations SHALL be saved with case |
| DIGIPATH-8 | User MAY compare two slides side-by-side |
| DIGIPATH-9 | Side-by-side view MAY synchronize navigation |
| DIGIPATH-10 | User MAY expand viewer to full screen |
| DIGIPATH-11 | User MAY open slide in external viewer application |
| DIGIPATH-12 | System SHALL support OpenSlide-compatible formats (SVS, NDPI, SCN, etc.) |
| DIGIPATH-13 | System SHALL support DICOM WSI via DICOMweb |

### 7.6 Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `digitalPathology.enabled` | Enable/disable feature | false |
| `digitalPathology.provider` | Integration provider | openslide |
| `digitalPathology.baseUrl` | Slide server URL | - |
| `digitalPathology.authType` | Authentication method | none |
| `digitalPathology.maxCacheSize` | Tile cache size (MB) | 500 |
| `digitalPathology.defaultMagnification` | Initial zoom level | 10x |

---

## 8. Data Model Updates

### 8.1 IHCCase Entity Updates

| Field | Type | Description |
|-------|------|-------------|
| er_allred_locked | Boolean | True if Allred manually overridden |
| pr_allred_locked | Boolean | True if Allred manually overridden |
| suggested_molecular_subtype | String | System-suggested subtype |
| molecular_subtype_accepted | Boolean | True if user accepted suggestion |
| ish_interpretation_group | Integer | ASCO/CAP group (1-5) |
| ish_interpretation_status | String | Positive/Equivocal/Negative |
| ish_interpretation_locked | Boolean | True if manually overridden |
| panel_template_id | FK | Applied panel template |

### 8.2 New Entity: CaseDigitalSlide

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| case_id | FK | Link to IHCCase |
| slide_id | String | External slide identifier |
| stain_name | String | Marker/stain name |
| slide_url | String | URL to access slide |
| thumbnail_url | String | URL to thumbnail |
| format | String | File format (SVS, NDPI, etc.) |
| uploaded_date | Timestamp | When slide was linked |

### 8.3 New Entity: SlideAnnotation

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| slide_id | FK | Link to CaseDigitalSlide |
| annotation_type | String | rectangle, arrow, text, polygon |
| coordinates | JSON | Shape coordinates |
| label | String | Annotation label |
| color | String | Display color |
| created_by | FK | User |
| created_date | Timestamp | When created |

---

## 9. API Endpoints

### 9.1 Calculation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ihc/calculate/allred` | Calculate Allred score |
| POST | `/api/ihc/calculate/molecular-subtype` | Suggest molecular subtype |
| POST | `/api/ihc/calculate/ish-interpretation` | Interpret ISH results |

### 9.2 Panel Template Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ihc/panel-templates` | List available templates |
| GET | `/api/ihc/panel-templates/{id}` | Get template details |
| POST | `/api/ihc/panel-templates` | Create custom template |
| PUT | `/api/ihc/panel-templates/{id}` | Update custom template |
| DELETE | `/api/ihc/panel-templates/{id}` | Delete custom template |
| POST | `/api/ihc/case/{id}/apply-panel` | Apply panel to case |

### 9.3 Digital Pathology Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ihc/case/{id}/slides` | List digital slides for case |
| POST | `/api/ihc/case/{id}/slides` | Link slide to case |
| DELETE | `/api/ihc/case/{id}/slides/{slideId}` | Unlink slide |
| GET | `/api/ihc/slides/{id}/tile/{z}/{x}/{y}` | Get tile (proxy to slide server) |
| GET | `/api/ihc/slides/{id}/thumbnail` | Get thumbnail |
| POST | `/api/ihc/slides/{id}/annotations` | Create annotation |
| GET | `/api/ihc/slides/{id}/annotations` | List annotations |
| DELETE | `/api/ihc/slides/{id}/annotations/{annotationId}` | Delete annotation |

---

## 10. Acceptance Criteria

### 10.1 Allred Calculator
- [ ] **AC-1**: Allred score auto-calculates when percentage and intensity entered
- [ ] **AC-2**: Calculation breakdown displayed as tooltip/helper text
- [ ] **AC-3**: Lock button allows manual override
- [ ] **AC-4**: Locked fields show lock icon and don't recalculate
- [ ] **AC-5**: Validation enforces 0-8 range

### 10.2 Molecular SubType Suggestion
- [ ] **AC-6**: Suggestion appears when all 4 markers (ER, PR, HER2, Ki-67) have values
- [ ] **AC-7**: Suggestion shows reasoning (which markers led to classification)
- [ ] **AC-8**: Accept button populates field with suggestion
- [ ] **AC-9**: User can override with dropdown selection
- [ ] **AC-10**: Clinical correlation warning displayed

### 10.3 ISH Interpretation
- [ ] **AC-11**: HER2/CEP17 ratio auto-calculates
- [ ] **AC-12**: Interpretation shows ASCO/CAP group (1-5)
- [ ] **AC-13**: Interpretation shows Positive/Equivocal/Negative status
- [ ] **AC-14**: Clinical action displayed (therapy eligibility)
- [ ] **AC-15**: Equivocal results recommend retesting

### 10.4 Panel Templates
- [ ] **AC-16**: At least 7 pre-configured panels available in default test catalog
- [ ] **AC-17**: Panel selection populates required markers
- [ ] **AC-18**: Completion tracking shows progress
- [ ] **AC-19**: Warning shown if generating report with incomplete panel
- [ ] **AC-20**: Custom templates can be created and saved
- [ ] **AC-21**: Panels loaded via Liquibase migration on fresh install

### 10.5 Digital Pathology
- [ ] **AC-22**: Slide thumbnails displayed when digital slides available
- [ ] **AC-23**: Clicking thumbnail opens embedded viewer
- [ ] **AC-24**: Viewer supports pan, zoom, reset
- [ ] **AC-25**: Side-by-side comparison available
- [ ] **AC-26**: Annotations can be added and saved

---

## 11. Dependencies

| Dependency | Description | Required For |
|------------|-------------|--------------|
| OGC-265 v1 | Base IHC Case View redesign | All v2 features |
| OpenSlide | WSI library | Digital pathology |
| Leaflet or OpenLayers | Map/tile viewer | Digital pathology UI |
| Site configuration | Panel template management | Panel templates |

---

## 12. Future Considerations

1. **Machine Learning Integration**: Auto-scoring from digital slides
2. **Quality Metrics Dashboard**: Track Allred score distributions, panel compliance
3. **Multi-institutional Panels**: Share panel templates across sites
4. **Voice Annotation**: Dictate annotations while viewing slides
5. **AI-assisted Hotspot Detection**: Identify high Ki-67 areas automatically
