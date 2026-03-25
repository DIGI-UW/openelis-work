# Test Catalog Management - Updated Requirements

**Version:** 2.0  
**Date:** December 12, 2025  
**Changes:** Added functional coverage validation, test ordering, panel association, inline method/panel creation, multi-select test sections

---

## New Features Summary

| Feature | Description |
|---------|-------------|
| **Functional Coverage Validation** | Clickable gaps that pre-fill the add range form with suggested values |
| **Test Ordering** | Drag-and-drop ordering of tests within a sample type |
| **Panel Association** | Select panels for this test, with inline panel creation |
| **Inline Method Creation** | Create new methods without leaving the test editor |
| **Multi-Select Test Sections** | Test can belong to multiple laboratory units |
| **Hour-Level Normal Ranges** | Support for neonatal ranges at hour granularity |
| **AMR Test Flag** | Mark tests for WHONET export and AMR surveillance |
| **Alert Rules** | Configure notifications for critical/abnormal values |
| **Reflex & Calculated Tab** | View reflex rules and calculated result relationships |
| **Sample Storage Tab** | Define storage conditions, duration, disposal, and special handling |
| **Internal QA Flag** | "Internal QA - No Results Release" replaces "In Lab Only" |
| **Result Interpretations** | Configure condition-based interpretations added as external notes to results |
| **Shortcodes for Methods & Interpretations** | Macro-style quick entry codes for fast selection in result entry screens |
| **Copy from Test** | Copy methods or interpretations from another test |
| **Labels Tab** | Configure default label presets and quantities for test orders |
| **Label Presets Management** | Admin-configurable label types with dimensions, fields, and barcode settings |
| **Reagents Tab** | Link reagents from inventory to track consumption per test |
| **Analyzers Tab** | Link analyzers that can perform this test |

---

## Test Editor Status Flags

The Basic Info tab includes the following status flags:

| Flag | Description |
|------|-------------|
| **Active** | Test is available for ordering and use |
| **Orderable** | Test appears in order entry screens |
| **Internal QA - No Results Release** | Test results will not appear on patient reports. Use for internal quality assurance tests, proficiency testing, or instrument verification. |

---

## Sample Storage Tab

### Purpose

Define recommended storage conditions, maximum storage duration, disposal requirements, and special handling instructions for samples collected for this test. This information is displayed during order entry and can optionally be locked to prevent modifications.

---

## Result Interpretations

### Purpose

Configure interpretive labels and clinical guidance that are automatically added to results as external notes. This allows standardized clinical guidance to accompany result values without manual entry. 

Labels are **fully customizable** - they can represent simple concepts like "High" or "Low", or more complex clinical classifications like cancer staging, treatment responses, diagnostic categories, or any other interpretive framework relevant to the test.

### Interpretation Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Code** | String | Yes | Unique shortcode for macro entry (e.g., "STAGE-2", "TX-FAIL") |
| **Label** | String | Yes | Display label for the interpretation (any text) |
| **Color** | Dropdown | No | Optional color for visual distinction |
| **Value/Range** | Text Input | Yes (numeric) | Threshold, range, or comparison for numeric tests |
| **Selected Value(s)** | Checkboxes | Yes (select) | One or more select list options that trigger this interpretation |
| **Interpretation Text** | Textarea | Yes | Clinical guidance displayed as external note |
| **Is Active** | Boolean | Yes | Enable/disable this interpretation |

### Value Field Adapts to Test Type

The value field in the Add/Edit Interpretation modal **automatically adapts** based on the test's result type. This ensures the system can properly match results to interpretations and suggest appropriate clinical guidance.

**For Numeric Tests:**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Value or Range *                                        â”‚
â”‚ [>126___________________________] (text input)          â”‚
â”‚ Use comparison operators (>, <, >=, <=), ranges (70-99) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```
- Text input field for entering numeric expressions
- Supports: `>N`, `<N`, `>=N`, `<=N`, `N-M` (range), exact values
- System evaluates numeric result against these expressions

**For Select List Tests:**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ When Value(s) Selected *                                â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ â˜‘ Positive                                          â”‚ â”‚
â”‚ â”‚ â˜ Negative                                          â”‚ â”‚
â”‚ â”‚ â˜ Indeterminate                                     â”‚ â”‚
â”‚ â”‚ â˜‘ Reactive                                          â”‚ â”‚
â”‚ â”‚ â˜ Non-Reactive                                      â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚ Selected: [Positive Ã—] [Reactive Ã—]                     â”‚
â”‚ Select one or more values that trigger this interpret.  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```
- Checkbox list populated from the test's configured select list options
- **Can select 1 or more options** that will trigger the same interpretation
- Selected values shown as removable tags below the list
- Any matching value triggers the interpretation

### Interpretation Suggestion Behavior

When a result is entered, the system evaluates the value against configured interpretations:

**Numeric Example:**
```
Test: Fasting Glucose
Result entered: 142 mg/dL

System checks interpretations:
  - GLU-CRIT-H: >400 â†’ No match
  - GLU-HI: >126 â†’ MATCH (142 > 126)
  - GLU-NL: 70-99 â†’ No match
  
Suggested interpretation: "High" with associated clinical text
```

**Select List Example (Single Value):**
```
Test: HIV Rapid Test
Result selected: "Reactive"

System checks interpretations:
  - HIV-POS: [Reactive, Positive] â†’ MATCH (Reactive in list)
  - HIV-NEG: [Non-Reactive, Negative] â†’ No match
  
Suggested interpretation: "Positive" with associated clinical text
```

**Select List Example (Multiple Trigger Values):**
```
Test: Hepatitis Panel
Interpretation "Acute Infection" configured for: [Reactive, Positive, Detected]

Result selected: "Detected"
â†’ MATCH - suggests "Acute Infection" interpretation

Result selected: "Reactive"  
â†’ MATCH - suggests "Acute Infection" interpretation

Result selected: "Negative"
â†’ No match
```

### Available Colors

| Color | Use Case Examples |
|-------|-------------------|
| Red | Critical values, positive diagnoses, treatment failures |
| Orange | High values, warnings, borderline results |
| Yellow | Low values, caution, monitoring needed |
| Green | Normal values, negative results, treatment success |
| Teal | Special categories, follow-up needed |
| Blue | Informational, reference ranges |
| Purple | Staging, classifications, special protocols |
| Pink | Specific categories, gender-specific |
| Gray | Default, neutral, unclassified |

### Value/Range Syntax (Numeric Tests)

| Syntax | Description | Example |
|--------|-------------|---------|
| `>N` | Greater than N | `>126` |
| `>=N` | Greater than or equal to N | `>=6.5` |
| `<N` | Less than N | `<70` |
| `<=N` | Less than or equal to N | `<=50` |
| `N-M` | Range from N to M (inclusive) | `70-99` |
| `=N` or `N` | Exact value | `=0` or `Positive` |

### Example: Traditional Lab Values (Fasting Glucose)

| Code | Label | Color | Value | Interpretation |
|------|-------|-------|-------|----------------|
| GLU-CRIT-H | Critical High | Red | >400 | CRITICAL: Glucose severely elevated. Immediate clinical attention required. |
| GLU-HI | High | Orange | >126 | Elevated fasting glucose. Consider diabetes screening. |
| GLU-NL | Normal | Green | 70-99 | Fasting glucose within normal limits. |
| GLU-LO | Low | Yellow | <70 | Hypoglycemia. Evaluate for symptoms and underlying cause. |
| GLU-CRIT-L | Critical Low | Red | <50 | CRITICAL: Severe hypoglycemia. Immediate intervention required. |

### Example: Cancer Staging (PSA with Clinical Context)

| Code | Label | Color | Value | Interpretation |
|------|-------|-------|-------|----------------|
| PSA-NL | Normal | Green | <4.0 | PSA within normal limits. Routine screening per guidelines. |
| PSA-GRAY | Gray Zone | Yellow | 4.0-10.0 | PSA in gray zone. Consider free PSA ratio, PHI, or repeat testing. |
| PSA-ELEV | Elevated | Orange | 10.1-20.0 | Elevated PSA. Recommend urology referral and consider biopsy. |
| PSA-HIGH | Significantly Elevated | Red | >20.0 | Significantly elevated PSA. Urgent urology referral. Staging workup recommended. |
| PSA-VELOC | Rapid Rise | Purple | velocity >0.75 | PSA velocity concerning. Enhanced monitoring or intervention indicated. |

### Example: Infectious Disease (HIV Viral Load)

| Code | Label | Color | Value | Interpretation |
|------|-------|-------|-------|----------------|
| VL-TND | Target Not Detected | Green | <20 | Viral load undetectable. Optimal viral suppression achieved. |
| VL-SUPP | Suppressed | Green | 20-200 | Low-level viremia. Generally considered suppressed. Continue current regimen. |
| VL-BLIP | Viral Blip | Yellow | 201-1000 | Viral blip detected. Repeat testing in 4 weeks. Assess adherence. |
| VL-FAIL | Virologic Failure | Red | >1000 | Virologic failure. Resistance testing recommended. Consider regimen change. |
| VL-HIGH | High Viral Load | Red | >100000 | High viral load. Assess for acute infection or treatment failure. |

### Example: Treatment Response (Oncology)

| Code | Label | Color | Value | Interpretation |
|------|-------|-------|-------|----------------|
| TX-CR | Complete Response | Green | =0 | Complete response. No detectable disease. Continue surveillance. |
| TX-PR | Partial Response | Teal | 1-50 | Partial response. >50% reduction from baseline. Continue current therapy. |
| TX-SD | Stable Disease | Yellow | 51-125 | Stable disease. Consider continuation or clinical trial options. |
| TX-PD | Progressive Disease | Red | >125 | Progressive disease. >25% increase from nadir. Recommend therapy change. |

### Example: Select List Test (Hepatitis B Surface Antigen)

| Code | Label | Color | Selected Value(s) | Interpretation |
|------|-------|-------|-------------------|----------------|
| HBSAG-R | Reactive | Red | Reactive, Positive | HBsAg reactive indicates active HBV infection. Order confirmatory test and liver panel. |
| HBSAG-NR | Non-Reactive | Green | Non-Reactive, Negative | HBsAg non-reactive. No evidence of active HBV infection. Consider vaccination. |
| HBSAG-IND | Indeterminate | Yellow | Indeterminate, Equivocal | Result indeterminate. Repeat testing in 2-4 weeks with fresh sample. |

### Add/Edit Interpretation Modal

The Add Interpretation modal includes:

**For All Tests:**
- Code field (uppercase, shortcode for quick entry)
- Label field (free text - any descriptive label)
- Color dropdown (optional - for visual distinction)
- Interpretation text (clinical guidance)
- Active checkbox

**For Numeric Tests:**
- Value/Range input (e.g., ">126", "70-99", "<50")

**For Select List Tests:**
- "When Value Selected" dropdown (populated from test's select list options)

**Live Preview:**
- Shows the label with selected color as it will appear in the table

### Copy from Test

Users can copy interpretations from another test:
1. Click "Copy from Test..." button
2. Search and select source test
3. Test list shows result type badge (Numeric/Select List)
4. Preview interpretations with labels, colors, and values
5. Choose import mode:
   - **Replace existing**: Remove current interpretations, add copied ones
   - **Append to existing**: Add copied interpretations to current list
6. Confirm copy

**Note:** Labels and colors are fully preserved when copying. Users can edit after copying if adjustments are needed.

---

## Shortcodes for Macro-Style Input

### Purpose

Both Methods and Interpretations have a **Code** field that acts as a shortcode/macro for quick entry in the result entry screen. This enables lab technicians to rapidly select methods or add interpretations without navigating dropdowns.

### Method Shortcodes

| Code | Method Name |
|------|-------------|
| HEX | Hexokinase Method |
| GOX | Glucose Oxidase Method |
| ELEC | Electrode Method |
| GOD-PAP | Enzymatic (GOD-PAP) |
| ISE | Ion-Selective Electrode |

### Result Entry Integration

In the result entry screen:

**Method Selection:**
- Type method code (e.g., "HEX") in method field
- Press Tab or Enter to auto-select the method
- Autocomplete dropdown shows matching codes as user types

**Interpretation Entry:**
- Type interpretation code (e.g., "CRITH") in interpretation field
- Press Tab or Enter to add interpretation as external note
- Multiple codes can be entered to add multiple interpretations

### Code Requirements

- **Unique**: Codes must be unique within their scope (method codes globally, interpretation codes per test)
- **Format**: Alphanumeric, uppercase, no spaces (e.g., "HEX", "GLU-CRIT-H")
- **Length**: Recommended 3-10 characters for ease of typing

---

## Labels Tab

### Purpose

Configure default label presets and quantities to be automatically suggested when this test is ordered. This enables labs to pre-define labeling requirements for each test type.

### Labels Tab UI

The Labels tab allows admins to:
1. Add multiple label presets to a test
2. Set default and maximum quantities per preset
3. Enable/disable user override at order entry

### Configuration Options

| Field | Description |
|-------|-------------|
| **Label Preset** | Dropdown of active label presets from Master Lists |
| **Default Qty** | Pre-populated quantity when test is ordered |
| **Max Qty** | Maximum allowed quantity (enforced at Order Entry) |
| **Allow Override** | If unchecked, user cannot change quantity at Order Entry |

### Label Generation Settings

- **Allow label count override at order entry**: Global setting that permits users to modify label quantities during order entry
- Individual label types can still be locked via the "Allow Override" column

### Order Entry Integration

When tests are selected during Order Entry:
1. System reads label config for each selected test
2. Aggregates across all tests ordered for the sample
3. Pre-populates the Labels section on the Add Order step

**Aggregation Rules:**

| Scenario | Rule |
|----------|------|
| Same label type from multiple tests | Use **highest** default quantity |
| Different label types | Include all types |
| Test with no label config | Use system defaults from Barcode Configuration |
| Override disabled for test | User cannot edit that label count (read-only) |

**Source Display:**
Order Entry shows which test drove each label count for transparency.

---

## Label Preset Management

### Location

Administration â†’ Master Lists â†’ Label Presets

### List View

| Column | Description |
|--------|-------------|
| Name | Preset name (e.g., "Cryo Vial Label") |
| Category | Order, Specimen, Pathology, Storage |
| Size (mm) | Height Ã— Width |
| Fields | Number of fields configured |
| Status | Active / Inactive |
| Actions | Edit, Delete (system presets locked) |

### System Presets (Cannot be deleted)

- Order Label
- Specimen Label
- Block Label
- Slide Label
- Freezer Label

### Preset Editor

**Basic Information:**
- Preset Name (required, unique)
- Category (Order | Specimen | Pathology | Storage)
- Description
- Active (checkbox)

**Dimensions:**
- Height (mm)
- Width (mm)
- Barcode Type (Code 128 | QR Code | DataMatrix)
- Barcode Position (Top | Bottom | Left | Right)

**Content Fields:**
- Selectable fields with checkboxes
- Line number assignment for layout
- Drag-and-drop reordering
- Live preview updates in real-time

### Available Label Fields

| Field Code | Display Name | Description |
|------------|--------------|-------------|
| LAB_NUMBER | Lab Number | Order/sample lab number (mandatory) |
| SAMPLE_ITEM_ID | Sample Item ID | Unique identifier for the sample item |
| PATIENT_ID | Patient ID | Patient identifier |
| PATIENT_NAME | Patient Name | Patient full name |
| PATIENT_DOB | Patient DOB | Date of birth |
| PATIENT_SEX | Patient Sex | Gender |
| REFERRING_SITE | Referring Site | Ordering/referring site |
| COLLECTION_DATE | Collection Date | Sample collection date |
| COLLECTION_TIME | Collection Time | Sample collection time |
| COLLECTED_BY | Collected By | Person who collected sample |
| SPECIMEN_TYPE | Specimen Type | Type of specimen |
| TESTS | Tests | Ordered tests |
| STORAGE_LOCATION | Storage Location | Freezer/shelf location |
| EXPIRY_DATE | Expiry Date | Sample expiration |
| BLOCK_ID | Block ID | Pathology block identifier |
| SLIDE_ID | Slide ID | Slide identifier |
| STAIN_TYPE | Stain Type | Stain used |
| CASE_NUMBER | Case Number | Pathology case number |

**Note:** Lab Number is the only mandatory field. All others are optional.

### Database Tables

**label_preset:**
- id, name, category, description
- height_mm, width_mm, barcode_type, barcode_position
- is_system, is_active, created_date, last_modified

**label_preset_field:**
- id, preset_id, field_code, display_order, line_number

**test_label_config:**
- id, test_id, preset_id, default_qty, max_qty, allow_override

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/label-presets` | List all label presets |
| GET | `/api/label-presets/{id}` | Get preset details |
| POST | `/api/label-presets` | Create new preset |
| PUT | `/api/label-presets/{id}` | Update preset |
| DELETE | `/api/label-presets/{id}` | Delete preset (if not system/in-use) |
| GET | `/api/label-presets/{id}/preview` | Get preview image |
| GET | `/api/tests/{id}/labels` | Get label config for test |
| PUT | `/api/tests/{id}/labels` | Update label config for test |
| GET | `/api/orders/label-defaults?tests={ids}` | Get aggregated label defaults |

---

## Reagents Tab

### Purpose

Link reagents from inventory to tests to track consumption and enable inventory management integration. Reagents are configured in **Administration â†’ Master Lists â†’ Reagents**.

### Linked Reagent Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Reagent** | Lookup | Yes | Select from configured reagents |
| **Usage Type** | Dropdown | Yes | PRIMARY or SECONDARY |
| **Quantity Per Test** | Number | Yes | Amount consumed per test run |
| **Unit** | Dropdown | Yes | Unit of measure (ÂµL, mL, etc.) |

### UI Elements

- List of linked reagents with cards showing name, manufacturer, usage type, quantity per test
- Current stock level display (from inventory)
- "Link Reagent" button to add new associations
- Remove button on each reagent card

---

## Analyzers Tab

### Purpose

Link laboratory analyzers/instruments to tests to indicate which instruments can perform this test. Analyzers are configured in **Administration â†’ Master Lists â†’ Analyzers**. Test code mapping for interfacing is configured separately in the analyzer interface setup.

### Linked Analyzer Display

| Field | Source | Description |
|-------|--------|-------------|
| **Name** | Master List | Analyzer name (e.g., "Cobas c 501") |
| **Manufacturer** | Master List | Equipment manufacturer |
| **Serial Number** | Master List | Equipment serial number |
| **Location** | Master List | Physical location in the lab |
| **Status** | Master List | Online, Offline, Maintenance |

### UI Elements

**Linked Analyzers List:**
- Cards showing analyzer name, manufacturer, location, serial number
- Status badge (Online = green, Maintenance = yellow, Offline = red)
- "Unlink" action button

**Link Analyzer Modal:**
- Checkbox list of available analyzers (not yet linked)
- Shows analyzer name, manufacturer, location, status
- Multi-select supported
- "Link Selected" button

**Info Card:**
- Explains that analyzers are configured in Master Lists
- Notes that test code mapping is configured separately

### Database Schema

```sql
CREATE TABLE test_analyzer (
  id UUID PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES test(id),
  analyzer_id UUID NOT NULL REFERENCES analyzer(id),
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(test_id, analyzer_id)
);
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tests/{id}/analyzers` | Get linked analyzers for test |
| POST | `/api/tests/{id}/analyzers` | Link analyzer(s) to test |
| DELETE | `/api/tests/{id}/analyzers/{analyzerId}` | Unlink analyzer from test |
| GET | `/api/analyzers` | List all configured analyzers |
| GET | `/api/analyzers/available?testId={id}` | List analyzers not linked to test |

---

## Sample Storage Tab

### Storage Requirements

| Field | Description | Required |
|-------|-------------|----------|
| **Storage Conditions** | Temperature range for sample preservation | Yes |
| **Custom Storage Conditions** | Free-text override or additional details | No |
| **Maximum Storage Duration** | Time limit before testing (with unit) | Yes |
| **Stability Notes** | Additional stability information | No |

**Standard Storage Conditions:**
- Ultra-low freezer: -80Â°C to -60Â°C
- Freezer: -30Â°C to -15Â°C
- Refrigerator: 2Â°C to 8Â°C
- Cold room: 4Â°C to 8Â°C
- Cool room: 15Â°C to 18Â°C
- Room temperature: 18Â°C to 25Â°C
- Controlled room temp: 20Â°C to 25Â°C
- Warm incubator: 35Â°C to 37Â°C
- Ambient: Uncontrolled room temperature

### Special Handling Requirements

Checkboxes for common requirements:
- Protect from light
- Do not freeze
- Do not refrigerate
- Keep upright
- Centrifuge before storage
- Aliquot before storage

### Disposal Requirements

| Field | Description | Required |
|-------|-------------|----------|
| **Disposal Method** | Waste category/handling | Yes |
| **Disposal Timeframe** | Maximum time after test completion | No |

**Standard Disposal Methods:**
1. Biohazard/Infectious waste bin
2. Sharps container
3. Chemical deactivation
4. Incineration
5. Autoclave then general waste
6. Pharmaceutical waste
7. Radioactive waste
8. General waste (non-hazardous only)
9. Return to manufacturer

### Special Instructions

Free-text field for additional guidance that doesn't fit standard fields.

### Override Restricted

When enabled:
- Order entry staff cannot modify storage or disposal requirements
- Settings appear as read-only in order entry
- Only Lab Managers can modify requirements
- Use for critical tests (HIV, controlled substances, etc.)

### Data Model

```sql
CREATE TABLE test_sample_handling (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id) UNIQUE,
    storage_condition VARCHAR(50),           -- 'refrigerator', 'freezer', etc.
    storage_condition_custom VARCHAR(200),   -- Custom/override text
    storage_duration INTEGER NOT NULL,
    storage_unit VARCHAR(20) NOT NULL,       -- 'hours', 'days', 'weeks', 'months'
    stability_notes TEXT,
    protect_from_light BOOLEAN DEFAULT FALSE,
    do_not_freeze BOOLEAN DEFAULT FALSE,
    do_not_refrigerate BOOLEAN DEFAULT FALSE,
    keep_upright BOOLEAN DEFAULT FALSE,
    centrifuge_before_storage BOOLEAN DEFAULT FALSE,
    aliquot_before_storage BOOLEAN DEFAULT FALSE,
    disposal_method VARCHAR(100) NOT NULL,
    disposal_timeframe INTEGER,
    disposal_unit VARCHAR(20),               -- 'days', 'weeks', 'months'
    special_instructions TEXT,
    override_restricted BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail for changes
CREATE TABLE test_sample_handling_history (
    id SERIAL PRIMARY KEY,
    test_sample_handling_id INTEGER NOT NULL REFERENCES test_sample_handling(id),
    changed_by INTEGER NOT NULL REFERENCES system_user(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_type VARCHAR(20) NOT NULL,        -- 'CREATE', 'UPDATE'
    previous_values JSONB,
    new_values JSONB
);
```

### Acceptance Criteria

- [ ] Storage conditions can be selected from standard list or custom entry
- [ ] Storage duration required with unit selection
- [ ] Special handling checkboxes persist correctly
- [ ] Disposal method required with optional timeframe
- [ ] Special instructions field supports free text
- [ ] Override Restricted flag locks settings in order entry
- [ ] Changes are tracked in version history
- [ ] Quick reference card displays temperature ranges

---

## Test List View Enhancements

### AMR Filter

The test catalog list view includes a filter for Antimicrobial Resistance (AMR) tests to support WHONET export workflows.

**Filter Options:**
- **All Tests** (default): Show all tests in the catalog
- **AMR Tests Only**: Show only tests flagged as AMR tests for WHONET export
- **Non-AMR Tests**: Show tests that are not part of AMR surveillance

**Visual Indicators:**
- AMR tests display a purple "AMR" badge next to the test name in the list
- Badge tooltip shows the WHONET antibiotic code (e.g., "WHONET: AMP")

**Use Cases:**
- Quickly identify all antimicrobial susceptibility tests in the catalog
- Verify WHONET configuration before export
- Bulk operations on AMR tests (e.g., update breakpoint standards)

---

## Range Types Overview

OpenELIS Global supports four distinct range types, **all of which can vary by age and sex**:

| Range Type | Purpose | Age/Sex Specific | Behavior |
|------------|---------|------------------|----------|
| **Normal Range** | Clinical reference values | **Yes** - commonly varies | Results outside flagged H/L on reports |
| **Valid Range** | Expected human sample values | Sometimes | Entry outside prompts verification dialog |
| **Critical Range** | Panic values requiring immediate action | **Yes** - can vary by age | Triggers immediate alerts/notifications |
| **Reporting Range** | Instrument/method limits | Rarely | Results outside trigger warning about dilution/rerun |

### Evidence for Age-Specific Critical Values

Research confirms that critical (panic) values **do vary by age**, particularly for:
- **Neonatal Bilirubin**: Hour-by-hour thresholds (0-23 hrs: >7.9, 24-35 hrs: >10.9, etc.)
- **Potassium**: Pediatric thresholds differ from adult
- **TCO2/Bicarbonate**: Pediatric thresholds differ from adult
- **Glucose**: Neonatal hypoglycemia thresholds differ

Source: Beaumont Laboratory Critical Values; acutecaretesting.org pediatric considerations

---

## Detailed Range Requirements

### 6.3.1 Age/Sex-Specific Range Support

**All four range types** must support demographic-specific variations:

```
Range Entry Structure:
â”œâ”€â”€ Range Type (Normal | Valid | Critical | Reporting)
â”œâ”€â”€ Sex (Male | Female | All)
â”œâ”€â”€ Age From (value + unit)
â”œâ”€â”€ Age To (value + unit)
â”œâ”€â”€ Low Value (nullable for critical-high-only)
â”œâ”€â”€ High Value (nullable for critical-low-only)
â””â”€â”€ Notes (optional)
```

**Age Units Supported:**
- Hours (for neonatal critical values)
- Days
- Weeks
- Months
- Years

**Sex Options:**
- Male (M)
- Female (F)
- All (A) - applies to both sexes

### 6.3.2 Example: Bilirubin Ranges

**Normal Ranges (Sex-Specific):**
| Sex | Age From | Age To | Low | High | Unit |
|-----|----------|--------|-----|------|------|
| Male | 0 days | 5 days | 1 | 155 | Âµmol/L |
| Male | 6 days | 14 days | 1 | 140 | Âµmol/L |
| Male | 15 days | 1 month | 1 | 130 | Âµmol/L |
| Male | 1 month | 1 year | 1 | 115 | Âµmol/L |
| Male | 1 year | âˆž | 5 | 40 | Âµmol/L |
| Female | 0 days | 55 days | 1 | 175 | Âµmol/L |
| Female | 56 days | 1 year | 1 | 130 | Âµmol/L |
| Female | 1 year | âˆž | 5 | 35 | Âµmol/L |

**Critical Ranges (Age-Specific, Sex-Neutral):**
| Sex | Age From | Age To | Critical High | Unit |
|-----|----------|--------|---------------|------|
| All | 0 hours | 23 hours | >7.9 | mg/dL |
| All | 24 hours | 35 hours | >10.9 | mg/dL |
| All | 36 hours | 47 hours | >13.9 | mg/dL |
| All | 48 hours | 71 hours | >14.9 | mg/dL |
| All | 72 hours | 13 days | >17.9 | mg/dL |
| All | 14 days | âˆž | >15.0 | mg/dL |

### 6.3.3 Coverage Validation Requirements

The system **must validate complete age coverage** for each sex:

**Validation Rules:**
1. For each sex (Male, Female), age ranges must cover from birth (0) to maximum age (âˆž) without gaps
2. Overlapping age ranges for the same sex are not allowed
3. "All" sex ranges count as coverage for both Male and Female
4. Validation runs on save and displays clear error messages for any gaps

**Coverage Check Algorithm:**
```
For each sex in [Male, Female]:
  1. Collect all ranges for this sex + "All" ranges
  2. Normalize all age values to a common unit (days)
  3. Sort by age_from ascending
  4. Verify first range starts at 0
  5. Verify each range.age_to + 1 == next_range.age_from (no gaps)
  6. Verify last range extends to infinity (999 years or marked as "no upper limit")
```

**UI Feedback:**
- Green checkmark: "Male coverage: Complete"
- Amber warning: "Female coverage: Gap detected (56 days to 1 year)"
- List of specific gaps with suggested fix

### 6.3.4 Range Editor UI Requirements

**Structured View (Default):**
- Group ranges by type (Normal, Valid, Critical, Reporting)
- Within each type, sub-group by sex
- Show age range, low/high values, mini visual bar
- Expand/collapse each range type section

**Visual View:**
- Demographic selector (Sex dropdown, Age input with unit)
- Shows all 4 range types on stacked horizontal bars
- Updates dynamically as user changes demographics
- Useful for "what ranges apply to a 3-day-old male?"

**Table View:**
- Flat table of all ranges across all types
- Sortable by any column
- Bulk editing capability

**Add/Edit Range Modal:**
- Sex selector (All / Male Only / Female Only)
- Age From: number input + unit dropdown (hours/days/weeks/months/years)
- Age To: number input + unit dropdown (use 999 years for infinity)
- Low value (optional for critical-high-only scenarios)
- High value (optional for critical-low-only scenarios)
- Coverage warning banner showing impact of this range

---

## Data Model Updates

### TestRange Entity (Updated)

```sql
CREATE TABLE test_range (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    range_type VARCHAR(20) NOT NULL, -- 'NORMAL', 'VALID', 'CRITICAL', 'REPORTING'
    sex CHAR(1) NOT NULL DEFAULT 'A', -- 'M', 'F', 'A' (All)
    age_from_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    age_from_unit VARCHAR(10) NOT NULL DEFAULT 'days', -- 'hours', 'days', 'weeks', 'months', 'years'
    age_to_value DECIMAL(10,2) NOT NULL DEFAULT 999,
    age_to_unit VARCHAR(10) NOT NULL DEFAULT 'years',
    low_value DECIMAL(15,6) NULL, -- NULL allowed for critical-high-only
    high_value DECIMAL(15,6) NULL, -- NULL allowed for critical-low-only
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_range_type CHECK (range_type IN ('NORMAL', 'VALID', 'CRITICAL', 'REPORTING')),
    CONSTRAINT chk_sex CHECK (sex IN ('M', 'F', 'A')),
    CONSTRAINT chk_age_unit CHECK (age_from_unit IN ('hours', 'days', 'weeks', 'months', 'years')),
    CONSTRAINT chk_at_least_one_value CHECK (low_value IS NOT NULL OR high_value IS NOT NULL)
);

CREATE INDEX idx_test_range_test_id ON test_range(test_id);
CREATE INDEX idx_test_range_lookup ON test_range(test_id, range_type, sex);
```

### Helper Function: Normalize Age to Days

```sql
CREATE FUNCTION normalize_age_to_days(value DECIMAL, unit VARCHAR) 
RETURNS DECIMAL AS $$
BEGIN
    RETURN CASE unit
        WHEN 'hours' THEN value / 24.0
        WHEN 'days' THEN value
        WHEN 'weeks' THEN value * 7.0
        WHEN 'months' THEN value * 30.44  -- Average days per month
        WHEN 'years' THEN value * 365.25  -- Account for leap years
        ELSE value
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## API Requirements

### Get Ranges for Test

```http
GET /api/v1/tests/{testId}/ranges
```

**Response:**
```json
{
  "testId": 123,
  "ranges": {
    "normal": [
      {
        "id": 1,
        "sex": "M",
        "ageFrom": { "value": 0, "unit": "days" },
        "ageTo": { "value": 5, "unit": "days" },
        "low": 1,
        "high": 155
      },
      // ... more ranges
    ],
    "valid": [...],
    "critical": [...],
    "reporting": [...]
  },
  "coverage": {
    "male": { "complete": true, "gaps": [] },
    "female": { "complete": false, "gaps": ["56 days to 1 year"] }
  }
}
```

### Validate Coverage

```http
POST /api/v1/tests/{testId}/ranges/validate
```

**Response:**
```json
{
  "valid": false,
  "coverage": {
    "male": { "complete": true, "gaps": [] },
    "female": { 
      "complete": false, 
      "gaps": [
        {
          "rangeType": "normal",
          "from": { "value": 56, "unit": "days" },
          "to": { "value": 1, "unit": "years" },
          "message": "No normal range defined for females aged 56 days to 1 year"
        }
      ]
    }
  }
}
```

### Get Applicable Range (for Result Entry)

```http
GET /api/v1/tests/{testId}/applicable-range?sex=M&ageValue=3&ageUnit=days
```

**Response:**
```json
{
  "testId": 123,
  "demographic": { "sex": "M", "age": { "value": 3, "unit": "days" } },
  "applicableRanges": {
    "normal": { "low": 1, "high": 155 },
    "valid": { "low": 0, "high": 600 },
    "critical": { "low": null, "high": 7.9 },
    "reporting": { "low": 0.1, "high": 30 }
  }
}
```

---

## Acceptance Criteria (Ranges)

### Range Editor

- [ ] All four range types (Normal, Valid, Critical, Reporting) support age/sex-specific variations
- [ ] Age can be specified in hours, days, weeks, months, or years
- [ ] Sex can be Male, Female, or All (applies to both)
- [ ] User can switch between Structured, Visual, and Table views
- [ ] Visual view updates dynamically when demographic selector changes

### Coverage Validation

- [ ] System validates that all ages from 0 to âˆž are covered for each sex
- [ ] Validation runs automatically on save
- [ ] Clear error messages identify specific gaps (e.g., "Female: 56 days to 1 year not covered")
- [ ] Validation considers "All" sex ranges as covering both Male and Female
- [ ] Overlapping ranges for the same sex/type are flagged as errors

### Critical Ranges

- [ ] Critical ranges support age-specific thresholds (e.g., neonatal bilirubin by hour)
- [ ] Critical low and critical high can be set independently
- [ ] Null values allowed (e.g., only critical high, no critical low)

### Result Entry Integration

- [ ] When entering results, system looks up applicable ranges based on patient sex and age
- [ ] Correct range applied even for complex cases (e.g., 3-day-old male)
- [ ] H/L flags use the applicable normal range for the patient's demographics
- [ ] Critical alerts use the applicable critical range for the patient's demographics

---

## NEW: Functional Coverage Validation

### Requirements

The coverage validation panel must be functional, not just informational:

1. **Display Issues Clearly**
   - Show separate panels for Male and Female coverage
   - Each panel shows: complete/incomplete status, count of issues
   - Issues categorized as: GAP (missing range) or OVERLAP (conflicting ranges)

2. **Gap Detection**
   - Identify all age ranges not covered from birth (0 hours) to infinity
   - Show specific gap boundaries (e.g., "55 days to 1 year")
   - Display suggested values from adjacent range

3. **Overlap Detection**
   - Identify any overlapping age ranges for the same sex/type
   - Show which ranges conflict
   - Provide option to edit or delete conflicting ranges

4. **"Fill Gap" Action**
   - Clicking "Fill Gap" on any gap issue opens the Add Range modal
   - Modal pre-fills:
     - Sex: From the coverage panel (Male or Female)
     - Age From/To: Exact gap boundaries
     - Low/High values: From adjacent range (with banner showing source)
   - User can modify pre-filled values before saving
   - Banner text: "Values from: 48 hours â€“ 72 hours range"

5. **Copy From Range Action**
   - Each range row has a "Copy to other sex" action
   - Creates a new range with same age/values but different sex
   - Opens modal with pre-filled values for user confirmation

### UI Mockup Notes

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Age Coverage Validation                                 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ Male      âœ“ Complete â”‚  â”‚ Female    âš  1 Issue    â”‚  â”‚
â”‚  â”‚                      â”‚  â”‚                         â”‚  â”‚
â”‚  â”‚ âœ“ All ages covered   â”‚  â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚  â”‚
â”‚  â”‚                      â”‚  â”‚ â”‚ GAP                 â”‚ â”‚  â”‚
â”‚  â”‚                      â”‚  â”‚ â”‚ 55 days to 1 year   â”‚ â”‚  â”‚
â”‚  â”‚                      â”‚  â”‚ â”‚                     â”‚ â”‚  â”‚
â”‚  â”‚                      â”‚  â”‚ â”‚ Suggested: L=1 H=130â”‚ â”‚  â”‚
â”‚  â”‚                      â”‚  â”‚ â”‚        [Fill Gap]   â”‚ â”‚  â”‚
â”‚  â”‚                      â”‚  â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## NEW: Test Display Order (Within Sample Type)

### Requirements

1. **Ordering Per Sample Type**
   - Each sample type maintains its own display order for tests
   - Order determines sequence in: order entry, result entry, worklists, reports

2. **Drag-and-Drop Interface**
   - Tests displayed as draggable rows with grip handle
   - Visual feedback during drag (highlighted, shadow)
   - Drop position indicator between rows

3. **Arrow Controls (Accessibility)**
   - Up/Down arrow buttons on each row
   - Keyboard accessible alternative to drag-and-drop

4. **Sample Type Selector**
   - Dropdown to switch between sample types
   - Order is saved per sample type (same test can have different positions in Serum vs Plasma)

5. **Persistence**
   - Order saved to `test_sample_type.display_order` column
   - Changes saved on drop (auto-save) or explicit Save button

### Data Model

```sql
ALTER TABLE test_sample_type 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Index for efficient ordering queries
CREATE INDEX idx_test_sample_type_order 
ON test_sample_type(sample_type_id, display_order);
```

### Acceptance Criteria

- [ ] User can drag tests to reorder within a sample type
- [ ] Arrow buttons provide alternative to drag-and-drop
- [ ] Order is persisted and applied in order entry screen
- [ ] Order is sample-type-specific (different order for Serum vs Plasma)
- [ ] Order numbers update automatically to maintain sequence (1, 2, 3...)

---

## NEW: Localization Hardening

### Problem Statement

Currently, OpenELIS can throw errors or display blank values when a test is viewed in a language that lacks a translation. This creates fragility in multi-language deployments where not all content is translated immediately.

### Requirements

1. **Graceful Fallback Behavior**
   - When a translation is missing for the selected UI language, display the value from the "base" or "primary" language (typically the language in which the test was created)
   - Never display blank/null values or throw errors due to missing translations
   - Fallback chain: Selected Language â†’ Primary Language â†’ First Available Translation â†’ Internal Code

2. **Multi-Language Metadata Storage**
   - Each localizable field maintains values for all supported languages
   - Localizable fields for tests include:
     - Test name
     - Reporting name
     - Description
     - Result value labels (for select lists)
     - Unit of measure display text
   - Store `primary_language` flag to identify the authoritative translation

3. **Translation Status Indicators**
   - In the test editor, show which languages have translations
   - Visual indicator: âœ“ (translated), âš  (missing), or language code badges
   - Allow bulk identification of untranslated content across the catalog

4. **No Breaking on Missing Translations**
   - All display logic must handle null/missing translations gracefully
   - API responses include both the requested language value AND the fallback value
   - Frontend displays fallback with optional indicator (e.g., italic text or small flag)

### Data Model

```sql
-- Test localizations table
CREATE TABLE test_localization (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    language_code VARCHAR(10) NOT NULL,  -- e.g., 'en', 'fr', 'sw', 'ht'
    field_name VARCHAR(50) NOT NULL,      -- e.g., 'name', 'reportingName', 'description'
    value TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_id, language_code, field_name)
);

CREATE INDEX idx_test_localization_lookup 
ON test_localization(test_id, field_name, language_code);

-- Helper function for fallback retrieval
CREATE FUNCTION get_localized_test_field(
    p_test_id INTEGER,
    p_field_name VARCHAR,
    p_language_code VARCHAR
) RETURNS TEXT AS $$
DECLARE
    v_value TEXT;
BEGIN
    -- Try requested language
    SELECT value INTO v_value 
    FROM test_localization 
    WHERE test_id = p_test_id 
      AND field_name = p_field_name 
      AND language_code = p_language_code;
    
    IF v_value IS NOT NULL THEN
        RETURN v_value;
    END IF;
    
    -- Fallback to primary language
    SELECT value INTO v_value 
    FROM test_localization 
    WHERE test_id = p_test_id 
      AND field_name = p_field_name 
      AND is_primary = TRUE;
    
    IF v_value IS NOT NULL THEN
        RETURN v_value;
    END IF;
    
    -- Fallback to any available translation
    SELECT value INTO v_value 
    FROM test_localization 
    WHERE test_id = p_test_id 
      AND field_name = p_field_name 
    LIMIT 1;
    
    RETURN COALESCE(v_value, '[' || p_field_name || ']');
END;
$$ LANGUAGE plpgsql STABLE;
```

### API Response Format

```json
{
  "test": {
    "id": 123,
    "name": {
      "value": "GlycÃ©mie Ã  jeun",
      "language": "fr",
      "isFallback": false
    },
    "description": {
      "value": "Fasting blood glucose measurement",
      "language": "en",
      "isFallback": true
    }
  }
}
```

### UI Considerations

- Fallback values displayed in *italics* or with small language indicator
- Tooltip: "Showing English (translation not available in French)"
- Translation management screen to bulk-add missing translations
- Export untranslated strings for external translation services

### Acceptance Criteria

- [ ] System never throws errors when translation is missing
- [ ] Missing translations fall back to primary language automatically
- [ ] Fallback values are visually distinguishable from native translations
- [ ] Test editor shows translation status for each supported language
- [ ] API returns both value and source language information
- [ ] Bulk export of untranslated strings is available

---

## NEW: Antimicrobial Resistance (AMR) Test Flag

### Purpose

Enable proper identification of AMR-related tests for export to WHONET and other AMR surveillance systems. WHONET is the standard software for managing antimicrobial susceptibility data used by WHO's Global Antimicrobial Resistance Surveillance System (GLASS).

### Requirements

1. **AMR Test Designation**
   - Checkbox/toggle on Basic Info tab: "Antimicrobial Resistance (AMR) Test"
   - When enabled, shows additional AMR-specific configuration options
   - AMR tests are flagged for inclusion in WHONET exports

2. **AMR Configuration Fields** (shown when AMR flag is enabled)
   - **WHONET Antibiotic Code**: Standard WHONET code (e.g., "AMP" for Ampicillin, "CIP" for Ciprofloxacin)
   - **Antibiotic Class**: Classification (e.g., Penicillins, Fluoroquinolones, Cephalosporins)
   - **Test Method**: Disk diffusion, MIC, E-test, etc.
   - **Breakpoint Standard**: CLSI, EUCAST, or custom
   - **Potency/Disk Content**: e.g., "10 Âµg" for disk diffusion

3. **WHONET Export Compatibility**
   - AMR-flagged tests included in WHONET export files
   - Proper mapping of result interpretations (S/I/R) to WHONET format
   - Support for zone diameter (mm) and MIC (Âµg/mL) result types

4. **Organism Linkage**
   - AMR tests can be linked to specific organism panels
   - Support for intrinsic resistance rules
   - Expert rules integration (future enhancement)

### UI Mockup

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ â˜‘ Antimicrobial Resistance (AMR) Test                       â”‚
â”‚   Enable for WHONET export and AMR surveillance             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ WHONET Configuration                                        â”‚
â”‚                                                             â”‚
â”‚ Antibiotic Code:  [AMP     â–¼]   Antibiotic Class: [Penicillins â–¼] â”‚
â”‚ Test Method:      [Disk Diffusion â–¼]                        â”‚
â”‚ Breakpoint Std:   [CLSI 2024 â–¼]  Potency: [10    ] Âµg       â”‚
â”‚                                                             â”‚
â”‚ â„¹ This test will be included in WHONET exports              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Data Model

```sql
-- AMR test configuration
ALTER TABLE test ADD COLUMN is_amr_test BOOLEAN DEFAULT FALSE;

CREATE TABLE test_amr_config (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id) UNIQUE,
    whonet_antibiotic_code VARCHAR(10),      -- e.g., 'AMP', 'CIP', 'GEN'
    antibiotic_class VARCHAR(100),            -- e.g., 'Penicillins'
    test_method VARCHAR(50),                  -- 'DISK', 'MIC', 'ETEST'
    breakpoint_standard VARCHAR(50),          -- 'CLSI', 'EUCAST'
    breakpoint_year INTEGER,
    disk_potency DECIMAL(10,2),
    disk_potency_unit VARCHAR(10) DEFAULT 'Âµg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WHONET antibiotic reference table
CREATE TABLE whonet_antibiotic_codes (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    antibiotic_class VARCHAR(100),
    atc_code VARCHAR(20)
);
```

### Acceptance Criteria

- [ ] Tests can be flagged as AMR tests via checkbox
- [ ] AMR configuration panel appears when flag is enabled
- [ ] WHONET antibiotic code can be selected from standard list
- [ ] Breakpoint standard (CLSI/EUCAST) can be specified
- [ ] AMR tests are properly exported to WHONET format
- [ ] Zone diameter and MIC result types supported

---

## NEW: Alert Rules Configuration

### Purpose

Configure automated notifications when specific result conditions are met, enabling timely communication of critical or abnormal values to appropriate recipients.

### Requirements

1. **Rule Builder Interface**
   - Visual rule builder for defining alert conditions
   - Support for multiple rules per test
   - Rules can be enabled/disabled without deletion

2. **Trigger Conditions**
   - **All Results**: Notify on every result entry
   - **Abnormal Values**: Result outside normal range (high or low)
   - **Critical Values**: Result in critical/panic range
   - **Specific Value**: Exact match (useful for select list results like "Positive")
   - **Custom Expression**: Advanced condition builder (e.g., "value > 200 AND patient.age < 18")

3. **Delivery Channels**
   - **SMS**: Send text message to phone number
   - **Email**: Send email notification
   - Future: In-app notification, WhatsApp, etc.

4. **Recipient Types**
   - **Ordering Physician**: Auto-resolve from order/sample data
   - **Patient**: Use patient's registered phone/email
   - **Referring Facility**: Contact for the referring site
   - **Custom Contact**: Manually specified phone number or email address
   - **Role-Based**: All users with specific role (e.g., "Lab Director")

5. **Message Customization**
   - Template-based messages with variable substitution
   - Variables: `{{patient_name}}`, `{{test_name}}`, `{{result}}`, `{{unit}}`, `{{reference_range}}`, `{{collected_date}}`, etc.
   - Different templates for SMS (short) vs Email (detailed)

6. **Alert History & Audit**
   - Log all sent alerts with timestamp, recipient, delivery status
   - Retry logic for failed deliveries
   - View alert history from result entry screen

### UI Mockup

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Alert Rules                                              [+ Add Rule]â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                      â”‚
â”‚ â”Œâ”€ Rule 1: Critical Value Alert â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â˜‘ Enabled â”€â”â”‚
â”‚ â”‚                                                                   â”‚â”‚
â”‚ â”‚ WHEN result is   [Critical Value    â–¼]                           â”‚â”‚
â”‚ â”‚                                                                   â”‚â”‚
â”‚ â”‚ NOTIFY via       [SMS â–¼]  [Email â–¼]                              â”‚â”‚
â”‚ â”‚                                                                   â”‚â”‚
â”‚ â”‚ RECIPIENTS                                                        â”‚â”‚
â”‚ â”‚   â˜‘ Ordering Physician                                           â”‚â”‚
â”‚ â”‚   â˜ Patient                                                       â”‚â”‚
â”‚ â”‚   â˜ Custom: [                    ]                               â”‚â”‚
â”‚ â”‚                                                                   â”‚â”‚
â”‚ â”‚ MESSAGE TEMPLATE (SMS)                                            â”‚â”‚
â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚â”‚
â”‚ â”‚ â”‚ CRITICAL: {{test_name}} result {{result}} {{unit}} for      â”‚  â”‚â”‚
â”‚ â”‚ â”‚ {{patient_name}}. Please review immediately.                â”‚  â”‚â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚â”‚
â”‚ â”‚                                                    [Edit] [Delete]â”‚â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                                      â”‚
â”‚ â”Œâ”€ Rule 2: Abnormal Result Notification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â˜‘ Enabled â”€â”â”‚
â”‚ â”‚                                                                   â”‚â”‚
â”‚ â”‚ WHEN result is   [Abnormal (High or Low) â–¼]                      â”‚â”‚
â”‚ â”‚ NOTIFY via       [Email â–¼]                                        â”‚â”‚
â”‚ â”‚ RECIPIENTS       â˜‘ Ordering Physician                            â”‚â”‚
â”‚ â”‚                                                    [Edit] [Delete]â”‚â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                                      â”‚
â”‚ â”Œâ”€ Rule 3: Positive Result Alert â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â˜ Disabled â”â”‚
â”‚ â”‚ WHEN result equals "Positive"                                     â”‚â”‚
â”‚ â”‚ NOTIFY via SMS to Patient                          [Edit] [Delete]â”‚â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Add/Edit Rule Modal

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Add Alert Rule                                                   âœ•  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                      â”‚
â”‚ Rule Name: [Critical Value SMS Alert                    ]           â”‚
â”‚                                                                      â”‚
â”‚ â”€â”€â”€ Trigger Condition â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚                                                                      â”‚
â”‚ Alert when result is:  â—‹ All Results                                â”‚
â”‚                        â—‹ Abnormal (outside normal range)            â”‚
â”‚                        â— Critical (panic value)                     â”‚
â”‚                        â—‹ Specific Value: [          ]               â”‚
â”‚                        â—‹ Custom Expression                          â”‚
â”‚                                                                      â”‚
â”‚ â”€â”€â”€ Notification Channel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚                                                                      â”‚
â”‚ Send via:  â˜‘ SMS    â˜‘ Email                                        â”‚
â”‚                                                                      â”‚
â”‚ â”€â”€â”€ Recipients â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚                                                                      â”‚
â”‚ â˜‘ Ordering Physician (from order)                                   â”‚
â”‚ â˜ Patient (from patient record)                                     â”‚
â”‚ â˜ Referring Facility contact                                        â”‚
â”‚ â˜ Custom recipient:                                                 â”‚
â”‚     Phone: [+1 555-123-4567        ]                               â”‚
â”‚     Email: [                        ]                               â”‚
â”‚ â˜ All users with role: [Lab Director â–¼]                            â”‚
â”‚                                                                      â”‚
â”‚ â”€â”€â”€ Message Templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚                                                                      â”‚
â”‚ SMS Template (160 char recommended):                                 â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ CRITICAL: {{test_name}} {{result}} {{unit}} for {{patient_name}}â”‚ â”‚
â”‚ â”‚ ID:{{patient_id}}. Review immediately.                          â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚ Characters: 98/160                                                   â”‚
â”‚                                                                      â”‚
â”‚ Email Subject:                                                       â”‚
â”‚ [Critical Lab Result: {{test_name}} for {{patient_name}}    ]       â”‚
â”‚                                                                      â”‚
â”‚ Email Body:                                                          â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ A critical laboratory result requires your attention:           â”‚ â”‚
â”‚ â”‚                                                                  â”‚ â”‚
â”‚ â”‚ Patient: {{patient_name}} (ID: {{patient_id}})                  â”‚ â”‚
â”‚ â”‚ Test: {{test_name}}                                              â”‚ â”‚
â”‚ â”‚ Result: {{result}} {{unit}}                                      â”‚ â”‚
â”‚ â”‚ Reference Range: {{reference_range}}                             â”‚ â”‚
â”‚ â”‚ Collected: {{collected_date}}                                    â”‚ â”‚
â”‚ â”‚ ...                                                              â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                                                      â”‚
â”‚ Available variables: patient_name, patient_id, test_name, result,   â”‚
â”‚ unit, reference_range, collected_date, resulted_date, lab_name      â”‚
â”‚                                                                      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                        [Cancel]  [Save Alert Rule]  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Data Model

```sql
-- Alert rule definition
CREATE TABLE test_alert_rule (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    trigger_type VARCHAR(30) NOT NULL, -- 'ALL', 'ABNORMAL', 'CRITICAL', 'SPECIFIC_VALUE', 'CUSTOM'
    trigger_value VARCHAR(100),         -- For SPECIFIC_VALUE type
    trigger_expression TEXT,            -- For CUSTOM type (future)
    notify_sms BOOLEAN DEFAULT FALSE,
    notify_email BOOLEAN DEFAULT FALSE,
    notify_ordering_physician BOOLEAN DEFAULT FALSE,
    notify_patient BOOLEAN DEFAULT FALSE,
    notify_referring_facility BOOLEAN DEFAULT FALSE,
    notify_custom_phone VARCHAR(20),
    notify_custom_email VARCHAR(100),
    notify_role_id INTEGER REFERENCES user_role(id),
    sms_template TEXT,
    email_subject_template VARCHAR(200),
    email_body_template TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_test_alert_rule_test ON test_alert_rule(test_id);
CREATE INDEX idx_test_alert_rule_enabled ON test_alert_rule(is_enabled) WHERE is_enabled = TRUE;

-- Alert delivery log
CREATE TABLE alert_delivery_log (
    id SERIAL PRIMARY KEY,
    alert_rule_id INTEGER NOT NULL REFERENCES test_alert_rule(id),
    result_id INTEGER NOT NULL REFERENCES result(id),
    channel VARCHAR(10) NOT NULL,        -- 'SMS', 'EMAIL'
    recipient VARCHAR(200) NOT NULL,
    message_content TEXT,
    delivery_status VARCHAR(20) NOT NULL, -- 'PENDING', 'SENT', 'DELIVERED', 'FAILED'
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_delivery_result ON alert_delivery_log(result_id);
CREATE INDEX idx_alert_delivery_status ON alert_delivery_log(delivery_status) WHERE delivery_status IN ('PENDING', 'FAILED');
```

### Acceptance Criteria

- [ ] Users can create multiple alert rules per test
- [ ] Rules can be enabled/disabled individually
- [ ] Trigger conditions include: All, Abnormal, Critical, Specific Value
- [ ] SMS and Email delivery channels available
- [ ] Recipients can be: ordering physician, patient, custom contact, role-based
- [ ] Message templates support variable substitution
- [ ] SMS template shows character count
- [ ] Alert delivery is logged for audit
- [ ] Failed deliveries are retried

---

## NEW: Reflex Tests & Calculated Results

### Purpose

Display reflex test rules and calculated result configurations that apply to this test, with links to the existing management pages for editing. This tab provides visibility into how this test participates in automated workflows without duplicating the full editor functionality.

### Requirements

1. **Read-Only Display with Edit Links**
   - Show reflex rules that are triggered BY this test's results
   - Show reflex rules that ORDER this test
   - Show calculated results that USE this test as an input
   - Show if this test IS a calculated result
   - All editing links navigate to existing pages:
     - `/MasterListsPage#reflex` for reflex test management
     - `/MasterListsPage#calculatedValue` for calculated result management

2. **Reflex Test Display**
   - Trigger test and condition
   - Target test(s) to order
   - Order mode (auto vs suggest)
   - Link to edit in Master Lists

3. **Calculated Result Display**
   - Formula expression
   - Input variables and their source tests
   - Link to edit in Master Lists

### UI Mockup

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Reflex & Calculated Results                                         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                      â”‚
â”‚ â”Œâ”€ REFLEX TESTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”â”‚
â”‚ â”‚                                                                   â”‚â”‚
â”‚ â”‚ Rules triggered BY this test:                                     â”‚â”‚
â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚â”‚
â”‚ â”‚ â”‚ IF result > 200 mg/dL â†’ ORDER Hemoglobin A1c                â”‚  â”‚â”‚
â”‚ â”‚ â”‚ Mode: Suggest (require confirmation)                         â”‚  â”‚â”‚
â”‚ â”‚ â”‚                                    [Edit in Master Lists â†’] â”‚  â”‚â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚â”‚
â”‚ â”‚                                                                   â”‚â”‚
â”‚ â”‚ Rules that ORDER this test:                                       â”‚â”‚
â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚â”‚
â”‚ â”‚ â”‚ â†³ Glucose Tolerance Test (when 2-hour > 140)                â”‚  â”‚â”‚
â”‚ â”‚ â”‚                                    [Edit in Master Lists â†’] â”‚  â”‚â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚â”‚
â”‚ â”‚                                                                   â”‚â”‚
â”‚ â”‚ [+ Add New Reflex Rule in Master Lists â†’]                        â”‚â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                                      â”‚
â”‚ â”Œâ”€ CALCULATED RESULTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”â”‚
â”‚ â”‚                                                                   â”‚â”‚
â”‚ â”‚ Calculations that USE this test as input:                        â”‚â”‚
â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚â”‚
â”‚ â”‚ â”‚ âš™ LDL Cholesterol (Calculated)                              â”‚  â”‚â”‚
â”‚ â”‚ â”‚   Formula: Total_Chol - HDL - (Triglycerides / 5)           â”‚  â”‚â”‚
â”‚ â”‚ â”‚                                    [Edit in Master Lists â†’] â”‚  â”‚â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚â”‚
â”‚ â”‚                                                                   â”‚â”‚
â”‚ â”‚ This test IS a calculated result:                                 â”‚â”‚
â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚â”‚
â”‚ â”‚ â”‚ (Not configured as a calculated result)                     â”‚  â”‚â”‚
â”‚ â”‚ â”‚           [+ Configure in Master Lists â†’]                   â”‚  â”‚â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Navigation Links

| Action | Destination |
|--------|-------------|
| Edit reflex rule | `/MasterListsPage#reflex?testId={id}` |
| Add new reflex rule | `/MasterListsPage#reflex?action=add&triggerTestId={id}` |
| Edit calculated result | `/MasterListsPage#calculatedValue?testId={id}` |
| Configure as calculated | `/MasterListsPage#calculatedValue?action=add&resultTestId={id}` |

### Acceptance Criteria

**Reflex Tests:**
- [ ] Display reflex rules triggered by this test's results
- [ ] Display reflex rules that order this test
- [ ] Show trigger condition, target tests, and order mode
- [ ] "Edit in Master Lists" link opens reflex management page
- [ ] "Add New Reflex Rule" link pre-fills trigger test

**Calculated Results:**
- [ ] Display calculations that use this test as input
- [ ] Display if this test is a calculated result with its formula
- [ ] "Edit in Master Lists" link opens calculated value management
- [ ] "Configure in Master Lists" link pre-fills result test

---

## NEW: Panel Membership with Display Order

### Requirements

1. **Multi-Select Panel Assignment**
   - Display all available panels as checkable cards
   - Show panel name and current test count
   - Visual indicator (checkmark, highlight) for selected panels

2. **Display Order Within Panel (Dual Input Method)**
   - When a panel is selected, user can set the position of this test within that panel
   - **Two methods to set position:**
     - **Numeric input**: Direct entry of position number (1 to N+1)
     - **Drag-and-drop**: Drag the "This test" item within the preview list to desired position
   - Both methods update the same underlying value and stay synchronized
   - Default position: end of panel (testCount + 1)

3. **Order Preview with Drag Support**
   - Scrollable list showing all tests currently in the panel
   - Current test highlighted with "â† This test" indicator and drag handle (â‰¡)
   - Existing tests shown in current order (not draggable)
   - Dragging "This test" reorders the list and updates the numeric input
   - Visual feedback during drag (drop indicator line, item highlighting)

4. **Inline Panel Creation**
   - "Create New Panel" button in panel section
   - Expands inline form (not modal) for quick entry
   - Fields: Panel name only (minimal required info)
   - Create & Cancel buttons
   - New panel automatically selected after creation

### UI Mockup

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ â˜‘ Basic Metabolic Panel                    Position: 3  â–¼  â”‚
â”‚   8 tests                                                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Display Position: [3] of 9     â”‚ Panel Test Order Preview   â”‚
â”‚                                â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚ Enter number or drag the test  â”‚ â”‚   1. Glucose            â”‚â”‚
â”‚ in the preview list            â”‚ â”‚   2. BUN                â”‚â”‚
â”‚                                â”‚ â”‚ â‰¡ 3. â† THIS TEST        â”‚â”‚ â† draggable
â”‚                                â”‚ â”‚   4. Creatinine         â”‚â”‚
â”‚                                â”‚ â”‚   5. Sodium             â”‚â”‚
â”‚                                â”‚ â”‚   ...                   â”‚â”‚
â”‚                                â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Interaction Details

**Numeric Input:**
- Type a number to set exact position
- Validation: min 1, max testCount + 1
- Pressing Enter or blur confirms the value
- Preview list reorders to reflect new position

**Drag-and-Drop:**
- Grip handle (â‰¡) on "This test" row indicates draggability
- Only the new test being added is draggable; existing panel tests are static
- Drag to reposition within the list
- Drop zones appear between existing tests
- On drop: numeric input updates to match new position
- Keyboard accessible: Arrow keys to move when row is focused

### Data Model

```sql
-- Panel-test junction with display order
CREATE TABLE panel_test (
    id SERIAL PRIMARY KEY,
    panel_id INTEGER NOT NULL REFERENCES panel(id),
    test_id INTEGER NOT NULL REFERENCES test(id),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(panel_id, test_id)
);

CREATE INDEX idx_panel_test_order ON panel_test(panel_id, display_order);
```

### Acceptance Criteria

- [ ] User can select multiple panels for a test
- [ ] Selected panels expand to show order configuration
- [ ] User can set position via numeric input (type a number)
- [ ] User can set position via drag-and-drop in preview list
- [ ] Both input methods stay synchronized
- [ ] Preview shows where test will appear in panel order
- [ ] Drag handle (â‰¡) clearly indicates draggable item
- [ ] Drop zones provide clear visual feedback during drag
- [ ] User can create a new panel inline without navigating away
- [ ] New panels appear in the list immediately after creation
- [ ] Panel selection and order persist when saving test

---

## NEW: Inline Method Creation

### Requirements

1. **Link Existing Method**
   - "Link Method" button opens method selector
   - Shows available (unlinked) methods
   - Click to link method to test

2. **Create New Method**
   - "Create New Method" link in method selector
   - Opens inline form for method creation
   - Minimum fields: Method name
   - "Create & Link" button creates method AND links it to current test

3. **Method Management**
   - Set default method (one default per test)
   - Effective date for each linked method
   - Edit/Remove linked methods

### Acceptance Criteria

- [ ] User can link existing methods to a test
- [ ] User can create a new method inline without navigating away
- [ ] New method is automatically linked after creation
- [ ] Default method can be set/changed

---

## NEW: Multi-Select Test Sections

### Requirements

1. **Multiple Section Assignment**
   - Test can belong to multiple laboratory units/sections
   - UI: Multi-select checkbox list (not single dropdown)
   - Scrollable if many sections

2. **Use Cases**
   - Cross-departmental tests (e.g., Blood Gas done by both Chemistry and Respiratory)
   - Training/backup scenarios (multiple units capable of running test)
   - Reference lab routing options

3. **UI Implementation**
   - Bordered container with checkbox list
   - All sections visible (scrollable if >8)
   - "Select one or more" helper text

### Data Model

```sql
-- Junction table for test-section many-to-many
CREATE TABLE test_section_assignment (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    section_id INTEGER NOT NULL REFERENCES test_section(id),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_id, section_id)
);
```

### Acceptance Criteria

- [ ] User can select multiple sections for a test
- [ ] At least one section required (validation)
- [ ] Primary section can be designated (optional)
- [ ] Test appears in worklists for all assigned sections

---

## Updated Acceptance Criteria (Complete)

### Range Editor
- [ ] All four range types support age/sex-specific variations
- [ ] Age can be specified in hours, days, weeks, months, or years
- [ ] Ranges displayed sorted by age (0-24 hours first, then 24-48 hours, etc.)
- [ ] Structured view groups by type, then sex, sorted by age
- [ ] Visual view shows applicable ranges for selected demographic

### Coverage Validation (Functional)
- [ ] Gaps and overlaps detected and displayed clearly
- [ ] Clicking "Fill Gap" opens add modal with pre-filled values from adjacent range
- [ ] User can modify pre-filled values before saving
- [ ] "Copy to other sex" action available on each range
- [ ] Validation panel shows male/female status separately

### Test Ordering
- [ ] Drag-and-drop reordering with visual feedback
- [ ] Arrow buttons for accessibility
- [ ] Order is sample-type specific
- [ ] Order persisted and used in order entry

### Panel Membership
- [ ] Multi-select panel assignment
- [ ] Selected panels expand to show order configuration
- [ ] User can set position via numeric input
- [ ] User can set position via drag-and-drop in preview list
- [ ] Both input methods stay synchronized
- [ ] Preview shows where test will appear in panel order
- [ ] Inline panel creation without navigation
- [ ] New panels immediately available after creation

### Localization Hardening
- [ ] System never throws errors when translation is missing
- [ ] Missing translations fall back to primary language automatically
- [ ] Fallback values are visually distinguishable from native translations
- [ ] Test editor shows translation status for each supported language
- [ ] API returns both value and source language information
- [ ] Bulk export of untranslated strings is available

### AMR Test Flag
- [ ] Tests can be flagged as AMR tests via checkbox
- [ ] AMR configuration panel appears when flag is enabled
- [ ] WHONET antibiotic code can be selected from standard list
- [ ] Breakpoint standard (CLSI/EUCAST) can be specified
- [ ] AMR tests are properly exported to WHONET format

### AMR Filter (Test List View)
- [ ] Filter dropdown includes "All Tests", "AMR Tests Only", "Non-AMR Tests" options
- [ ] AMR tests display purple "AMR" badge in list view
- [ ] Badge tooltip shows WHONET antibiotic code
- [ ] Filter correctly filters test list based on `is_amr_test` flag

### Alert Rules
- [ ] Users can create multiple alert rules per test
- [ ] Rules can be enabled/disabled individually
- [ ] Trigger conditions include: All, Abnormal, Critical, Specific Value
- [ ] SMS and Email delivery channels available
- [ ] Recipients can be: ordering physician, patient, custom contact, role-based
- [ ] Message templates support variable substitution
- [ ] Alert delivery is logged for audit

### Reflex Tests
- [ ] Display reflex rules triggered by this test's results
- [ ] Display reflex rules that order this test
- [ ] Show trigger condition, target tests, and order mode
- [ ] "Edit in Master Lists" link opens reflex management page
- [ ] "Add New Reflex Rule" link pre-fills trigger test

### Calculated Results
- [ ] Display calculations that use this test as input
- [ ] Display if this test is a calculated result with its formula
- [ ] "Edit in Master Lists" link opens calculated value management
- [ ] "Configure in Master Lists" link pre-fills result test

### Sample Storage
- [ ] Storage conditions can be selected from standard list or custom entry
- [ ] Storage duration required with unit selection (hours/days/weeks/months)
- [ ] Special handling checkboxes (protect from light, do not freeze, etc.) persist correctly
- [ ] Disposal method required with optional timeframe
- [ ] Special instructions field supports free text
- [ ] Override Restricted flag locks settings in order entry
- [ ] Changes are tracked in version history

### Status Flags
- [ ] "Internal QA - No Results Release" flag prevents results from appearing on patient reports
- [ ] Flag description tooltip explains purpose clearly

### Method Linking
- [ ] Link existing methods to test
- [ ] Inline method creation without navigation
- [ ] Set default method
- [ ] Effective date tracking
- [ ] Method code field for macro-style quick entry
- [ ] Copy methods from another test

### Result Interpretations
- [ ] Add interpretations with code, label, optional color, value/range, and interpretation text
- [ ] Label field accepts any text (not limited to predefined conditions)
- [ ] Color dropdown provides visual distinction options (red, orange, yellow, green, teal, blue, purple, pink, gray)
- [ ] Live preview shows label with selected color in modal
- [ ] Interpretation codes enable macro-style quick entry in result entry screen
- [ ] Interpretations are added as external notes when result meets value criteria
- [ ] For numeric tests: show text input for value expressions (>, <, >=, <=, ranges)
- [ ] For select list tests: show checkbox list of test's configured options
- [ ] For select list tests: allow selecting 1 or more values that trigger the interpretation
- [ ] Selected values displayed as removable tags in the modal
- [ ] Reorder interpretations via drag-and-drop
- [ ] Toggle interpretations active/inactive
- [ ] Edit existing interpretations via modal
- [ ] Delete interpretations with confirmation
- [ ] Copy interpretations from another test (with replace/append option)
- [ ] Copy preserves labels and colors from source test

### Test Sections
- [ ] Multi-select section assignment (not single dropdown)
- [ ] Minimum one section required
- [ ] Test appears in all assigned section worklists

### Labels Tab
- [ ] Labels tab appears in test configuration editor
- [ ] Admin can add multiple label presets to a test
- [ ] Admin can set default and max quantities per preset
- [ ] Admin can enable/disable override per label type
- [ ] Global "allow override at order entry" setting works correctly
- [ ] Order Entry preview shows expected label configuration

### Label Preset Management
- [ ] Admin can create new label presets with unique names
- [ ] Admin can configure preset dimensions (height, width)
- [ ] Admin can select/deselect content fields
- [ ] Admin can reorder fields via drag-and-drop
- [ ] Admin can select barcode type and position
- [ ] Live preview updates in real-time as settings change
- [ ] Admin can deactivate presets
- [ ] System presets cannot be deleted (only edited)
- [ ] Presets in use by tests cannot be deleted

### Reagents Tab
- [ ] Reagents tab appears in test configuration editor
- [ ] Link reagents from Master Lists to test
- [ ] Specify usage type (PRIMARY/SECONDARY) per reagent
- [ ] Specify quantity consumed per test
- [ ] Display current stock level from inventory
- [ ] Unlink reagents with confirmation

### Analyzers Tab
- [ ] Analyzers tab appears in test configuration editor
- [ ] Link analyzers from Master Lists to test
- [ ] Multi-select analyzers in link modal
- [ ] Display analyzer status (Online/Offline/Maintenance)
- [ ] Display analyzer location and serial number
- [ ] Unlink analyzers with confirmation
- [ ] Info card explains analyzer linking purpose and that test code mapping is separate

### Order Entry Label Integration
- [ ] Order Entry shows all label types from selected tests
- [ ] Label counts pre-populated from test configuration
- [ ] Source (test name) shown for each label count
- [ ] Multiple tests aggregate correctly (highest count wins)
- [ ] Non-overridable labels are displayed as read-only
