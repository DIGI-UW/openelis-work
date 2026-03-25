# Result Validation Page - Functional Requirements Specification

## Overview

The Result Validation page allows authorized users to review, validate, and release test results. This page follows the same design patterns as the Results Entry page but is focused on the validation workflow rather than data entry.

### Purpose

- Provide a dedicated interface for result validation/verification
- Enable batch validation of multiple results
- Support the review of all relevant information before release
- Allow direct editing of results when corrections are needed
- Support retest requests with required documentation

### Access Control

- **RBAC Role Required**: Users must have the validation role to access this page
- Existing OpenELIS Global RBAC permission system applies
- Role typically assigned to supervisors, senior technicians, or quality assurance personnel

## Page Layout

### Initial State (Before Search)

When the page first loads, no data is displayed. Users must either:
1. Select a Lab Unit from the dropdown, OR
2. Enter a search query

This prevents unnecessary data loading and ensures users work with relevant data sets.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                          ðŸ”                                                     â”‚
â”‚                                                                                 â”‚
â”‚                    Search to View Results                                       â”‚
â”‚                                                                                 â”‚
â”‚     Select a lab unit from the dropdown or enter a search term to view          â”‚
â”‚     results awaiting validation. This helps ensure only relevant data           â”‚
â”‚     is loaded.                                                                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Header Section

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ›¡ï¸ Result Validation                                    [47] awaiting validationâ”‚
â”‚    Review and validate results before release                                   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Element | Description |
|---------|-------------|
| **Page Title** | "Result Validation" with shield icon |
| **Subtitle** | "Review and validate results before release" |
| **Count Badge** | Number of results awaiting validation |

### Search and Filter Bar

The search bar requires either a lab unit selection OR a search query before results are loaded.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ [Select Lab Unit... â–¼]  or  ðŸ” [Search by lab number, patient ID...]  [Search]  â”‚
â”‚                                                            [Filters]  [Clear]   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Element | Description |
|---------|-------------|
| **Lab Unit Dropdown** | Required selection OR search query to load data |
| **Search Input** | Full-text search across lab number, patient ID, test name |
| **Search Button** | Disabled until lab unit selected OR search query entered |
| **Filters Button** | Toggle advanced filters panel |
| **Clear Button** | Resets to initial empty state (only visible after search) |

### Advanced Filters Panel

When expanded, shows additional filter options:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Lab Number From    Lab Number To     Date From        Date To                   â”‚
â”‚ [____________]     [____________]    [__________]     [__________]              â”‚
â”‚                                                                                 â”‚
â”‚ Test Section       Analyzer          Entered By       Quick Filters             â”‚
â”‚ [All Sections â–¼]   [All Analyzers â–¼] [All Users â–¼]   â˜ Flagged â˜ Normal â˜ Abnormalâ”‚
â”‚                                                                                 â”‚
â”‚                                                           [Apply Filters]       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Filter | Description |
|--------|-------------|
| **Lab Number Range** | From/To text inputs for accession number range |
| **Date Range** | From/To date pickers for test date |
| **Test Section** | Dropdown to filter by test section |
| **Analyzer** | Dropdown to filter by analyzer used |
| **Entered By** | Dropdown to filter by user who entered result |
| **Quick Filters** | Checkboxes for Flagged, Normal, Abnormal (mutually exclusive) |

### Quick Stats (After Search)

### Quick Stats (After Search)

Displayed after a successful search:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ [4 Normal] [2 Abnormal] [3 Flagged]                                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Badge | Description |
|-------|-------------|
| **Normal** | Count of results within normal range |
| **Abnormal** | Count of results outside normal range |
| **Flagged** | Count of results with any flags (delta check, critical, etc.) |

### Batch Actions Bar

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ â˜‘ Select All  â”‚  âœ“ Select Normal (4)  â”‚  3 selected     [Retest Selected] [Accept & Release Selected]â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Element | Description |
|---------|-------------|
| **Select All** | Checkbox to select/deselect all visible results |
| **Select Normal** | Button to select only results within normal range |
| **Selection Count** | Display of currently selected result count |
| **Retest Selected** | Batch action to send selected results for retest |
| **Accept & Release Selected** | Batch action to validate and release selected results |

**Batch Action Behavior:**

- **Accept & Release**: Validates selected results and releases them (makes available to patient/EMR)
- **Retest**: Opens retest modal requiring a reason; sets status back to "Pending"

## Results Table

### Collapsed Row View

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ â˜ â–¶ ðŸŸ¢ DEV01250000000000   WBC               Sysmex XN-L   4.00-10.00   7.5    â”‚
â”‚        3456789 â€¢ M/14y     Whole Blood                      x10^9/L            â”‚
â”‚                                                              J.Smith 10:30 [â†»][âœ“]â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Column | Description |
|--------|-------------|
| **Checkbox** | Row selection for batch actions |
| **Expand** | Click to expand/collapse row details |
| **QC Status** | Colored dot (green=pass, red=fail) |
| **Lab Number** | Sample/accession number |
| **Patient Info** | Patient ID, Sex/Age (name hidden for privacy) |
| **Test Name** | Name of the test |
| **Sample Type** | Type of sample |
| **Method/Analyzer** | "Manual" or analyzer name |
| **Range** | Reference range with unit |
| **Result** | Result value (highlighted if abnormal) |
| **Flags** | Flag icons (above/below normal, delta check, critical) |
| **Entered By** | User who entered result and timestamp |
| **Row Actions** | Retest (â†») and Accept (âœ“) buttons |

### Expanded Row View

When a row is expanded, the following sections are displayed:

#### Patient Details Banner
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Test, Patient    DOB: 01/11/2011    ID: 3456789                        M / 14y â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

Patient name is only visible when row is expanded (privacy protection in collapsed view).

#### Entry Info Banner
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ‘¤ Entered by: J. Smith    ðŸ• at 12/18/2025 10:30    Method: [Sysmex XN-L]      â”‚
â”‚ Manual count performed using hemocytometer with improved Neubauer chamber.      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Element | Description |
|---------|-------------|
| **Entered By** | User who entered the result |
| **Entry Time** | Date and time of entry |
| **Method** | Manual or Analyzer name |
| **Method Notes** | Optional notes about the method used (if manual) |

#### Result and Interpretation Section

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ RESULT VALUE                    â”‚ INTERPRETATION                              â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                 â”‚ [Normal]                                    â”‚
â”‚ â”‚    7.5      â”‚ x10^9/L         â”‚ White blood cell count within normal limits.â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                 â”‚ No evidence of infection or hematologic     â”‚
â”‚ Range: 4.00 - 10.00             â”‚ abnormality.                                â”‚
â”‚                                 â”‚                                             â”‚
â”‚ âš ï¸ Delta Check: +44.9% from     â”‚                                             â”‚
â”‚    previous (98) - exceeds 20%  â”‚                                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Element | Description |
|---------|-------------|
| **Result Value** | Editable input showing current result |
| **Unit** | Unit of measurement |
| **Range** | Reference range for comparison |
| **Delta Check Alert** | Warning if delta exceeds threshold |
| **Interpretation** | Label and text for the interpretation |

**Result Editing:**
- Validators can directly edit the result value
- Changes are logged in the audit trail
- Edited results may trigger re-evaluation of flags and interpretation

#### Notes Section (If Notes Exist)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ“„ Notes                                                                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ J. Smith                             [In Lab Only]           12/18/2025 09:45   â”‚
â”‚ Sample hemolyzed, may need redraw.                                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

Displays all notes associated with the result, distinguishing between internal ("In Lab Only") and external notes.

### Tab Structure

| Tab | Icon | Purpose |
|-----|------|---------|
| **Method & Reagents** | Flask | View method and reagent lots used |
| **History** | History | View previous results and delta calculations |
| **QA/QC** | CheckCircle | View QC results and warnings |

#### Method & Reagents Tab

Displays the method and reagent lots that were recorded when the result was entered.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ METHOD USED                     â”‚ REAGENT LOTS USED                           â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ Sysmex XN-L        [Online] â”‚ â”‚ â”‚ Cellpack DCL         [Expiring Soon]   â”‚ â”‚
â”‚ â”‚ Automated analyzer          â”‚ â”‚ â”‚ Lot: LOT-2024-0892 â€¢ Expires: 12/20/24 â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”‚
â”‚                                 â”‚ â”‚ Lysercell WNR        [Expiring Soon]   â”‚ â”‚
â”‚                                 â”‚ â”‚ Lot: LOT-2024-5678 â€¢ Expires: 12/25/24 â”‚ â”‚
â”‚                                 â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Read-only view** - validators can see but not modify method/reagent selections.

#### History Tab

Displays previous results for the same test and patient.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ“œ Previous Results                                                             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Date                  â”‚ Result         â”‚ Status    â”‚ Delta                      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ 12/18/2025 (Current)  â”‚ 7.5 x10^9/L    â”‚ [Normal]  â”‚ â€”                          â”‚
â”‚ 12/01/2025            â”‚ 6.8 x10^9/L    â”‚ [Normal]  â”‚ +10.3%                     â”‚
â”‚ 11/15/2025            â”‚ 7.2 x10^9/L    â”‚ [Normal]  â”‚ +4.2%                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Column | Description |
|--------|-------------|
| **Date** | Date of result (current highlighted) |
| **Result** | Result value with unit |
| **Status** | Normal/Abnormal badge |
| **Delta** | Percentage change from current result |

#### QA/QC Tab

Displays QC results and any warnings.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ QC RESULTS                      â”‚ WARNINGS                                    â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ Level 1 (Low)      [âœ“ Pass] â”‚ â”‚ â”‚ âš ï¸ Cellpack DCL                        â”‚ â”‚
â”‚ â”‚ Expected: 3.5 â€¢ Actual: 3.6 â”‚ â”‚ â”‚    Lot LOT-2024-0892 expires 12/20/24  â”‚ â”‚
â”‚ â”‚ CV: 2.9%                    â”‚ â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”‚
â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”‚ â”‚ âš ï¸ Lysercell WNR                       â”‚ â”‚
â”‚ â”‚ Level 2 (Normal)   [âœ“ Pass] â”‚ â”‚ â”‚    Lot LOT-2024-5678 expires 12/25/24  â”‚ â”‚
â”‚ â”‚ Expected: 7.0 â€¢ Actual: 7.1 â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚ â”‚ CV: 1.4%                    â”‚ â”‚                                             â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚                                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Element | Description |
|---------|-------------|
| **QC Level** | Control level name |
| **Pass/Fail** | Status badge |
| **Expected/Actual** | Expected vs actual values |
| **CV** | Coefficient of variation |
| **Warnings** | Reagent expiration or other warnings |

### Row Actions

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Lab #: DEV01250000000000 â€¢ Test: WBC                    [Retest] [Accept & Release]â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Action | Description |
|--------|-------------|
| **Retest** | Opens retest modal; requires reason |
| **Accept & Release** | Validates and releases the result |

## Retest Modal

When a result is sent for retest (single or batch), a modal dialog appears:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ â†» Send for Retest                                                         [X]  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                                 â”‚
â”‚ This result will be sent back for retesting. The status will be reset to       â”‚
â”‚ "Pending" and the technician will need to re-enter the result.                 â”‚
â”‚                                                                                 â”‚
â”‚ Retest Reason *                                                                 â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚ â”‚ Enter the reason for requesting a retest...                                 â”‚â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚ This reason will be added as an internal note and recorded in result history.  â”‚
â”‚                                                                                 â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚ â”‚ â„¹ï¸ Note: Retest requests are logged in the audit trail with your user ID   â”‚â”‚
â”‚ â”‚    and timestamp.                                                           â”‚â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                                                 â”‚
â”‚                                                    [Cancel] [Confirm Retest]   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Retest Modal Fields

| Field | Required | Description |
|-------|----------|-------------|
| **Retest Reason** | Yes | Text field for entering the reason for retest |

### Retest Behavior

When a retest is confirmed:

1. **Status Change**: Result status is set back to "Pending" (waiting for result entry)
2. **Internal Note**: The retest reason is added as an internal note with:
   - Author: Current user
   - Type: "Internal" (In Lab Only)
   - Body: "[RETEST REQUESTED] " + reason text
3. **History Record**: A record is added to the result history showing:
   - Action: "Retest Requested"
   - By: Current user
   - Timestamp: Current date/time
   - Reason: Retest reason
4. **Audit Trail**: Action is logged with user ID, timestamp, and reason
5. **Result Value**: Previous result value is preserved in history but cleared from current entry

## Pagination

The page uses standard pagination controls with a configurable page size.

### Pagination Bar

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Showing 1 to 25 of 147 results    Show [25 â–¼] per page    [Â«Â«][Prev][1][2][3][Next][Â»Â»]â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Pagination Controls

| Element | Description |
|---------|-------------|
| **Showing X to Y of Z** | Current range and total count display |
| **Page Size Selector** | Dropdown with options: 10, 25, 50, 100 (default: 25) |
| **First Page (Â«Â«)** | Jump to first page |
| **Previous** | Go to previous page |
| **Page Numbers** | Direct page selection (shows up to 5 page numbers with ellipsis) |
| **Next** | Go to next page |
| **Last Page (Â»Â»)** | Jump to last page |

### Page Size Options

| Value | Use Case |
|-------|----------|
| **10** | Quick review of small batches |
| **25** | Default - balanced view |
| **50** | Larger batch validation |
| **100** | Maximum for bulk operations |

### Pagination Behavior

- Default page size is 25 results
- Page size preference persists during the session
- Changing page size resets to page 1
- Selection is cleared when changing pages
- Navigation buttons are disabled when at boundaries

## Workflow States

### Result Status Flow

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Pending  â”‚ â”€â”€â–¶ â”‚ Entered  â”‚ â”€â”€â–¶ â”‚ Awaiting         â”‚ â”€â”€â–¶ â”‚ Released â”‚
â”‚          â”‚     â”‚          â”‚     â”‚ Validation        â”‚     â”‚          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      â–²                                    â”‚
      â”‚                                    â”‚
      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                   (Retest)
```

| Status | Description |
|--------|-------------|
| **Pending** | Result not yet entered |
| **Entered** | Result entered, not yet submitted for validation |
| **Awaiting Validation** | Result submitted, waiting for validator review |
| **Released** | Result validated and released to patient/EMR |

### Validation Actions

| Action | From Status | To Status | Notes |
|--------|-------------|-----------|-------|
| **Accept & Release** | Awaiting Validation | Released | Validates and releases result |
| **Retest** | Awaiting Validation | Pending | Sends back for re-entry with required reason |

## Data Model

### Validation Result Interface

```typescript
interface ValidationResult {
  id: number;
  labNumber: string;
  patient: {
    name: string;
    id: string;
    dob: string;
    sex: string;
    age: string;
  };
  testDate: string;
  testName: string;
  sampleType: string;
  normalRange: string;
  unit: string;
  result: string;
  status: 'awaiting-validation';
  
  // Entry Information
  enteredBy: {
    name: string;
    date: string;  // Date and time of entry
  };
  method: 'manual' | 'analyzer';
  methodNotes?: string;  // Notes for manual method
  analyzer?: string;     // Analyzer name if method is 'analyzer'
  
  // Flags and Status
  flags: ('above-normal' | 'below-normal' | 'delta-check' | 'critical')[];
  isNormal: boolean;
  qcStatus: 'pass' | 'fail';
  
  // Related Data
  previousResults: PreviousResult[];
  notes: Note[];
  interpretation: Interpretation;
  qcData: QCResult[];
  reagentLots: ReagentLot[];
  deltaCheck?: DeltaCheck;
}

interface PreviousResult {
  date: string;
  value: string;
  status: 'normal' | 'abnormal' | 'low-normal' | 'high-normal';
}

interface Note {
  id: number;
  date: string;
  author: string;
  type: 'internal' | 'external';
  body: string;
}

interface Interpretation {
  code: string;
  label: string;
  text: string;
}

interface QCResult {
  level: string;
  expected: string;
  actual: string;
  status: 'pass' | 'fail';
  cv: string;
}

interface ReagentLot {
  name: string;
  lot: string;
  expires: string;
  status: 'ok' | 'expiring-soon' | 'expired';
}

interface DeltaCheck {
  previous: string;
  change: string;
  threshold: string;
}
```

### Retest Request Interface

```typescript
interface RetestRequest {
  resultIds: number[];      // IDs of results to retest
  reason: string;           // Required reason for retest
  requestedBy: string;      // User ID of validator
  requestedAt: string;      // ISO timestamp
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/validation/results` | List results awaiting validation |
| GET | `/api/validation/results/{id}` | Get single result with full details |
| PUT | `/api/validation/results/{id}` | Update result value (edit) |
| POST | `/api/validation/results/{id}/accept` | Accept and release result |
| POST | `/api/validation/results/accept` | Batch accept and release results |
| POST | `/api/validation/results/{id}/retest` | Send single result for retest |
| POST | `/api/validation/results/retest` | Batch send results for retest |

### Query Parameters for Search

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Smart search query |
| `labUnit` | string | Filter by lab unit (required if no search query) |
| `labNumberFrom` | string | Filter by lab number range start |
| `labNumberTo` | string | Filter by lab number range end |
| `dateFrom` | date | Filter by test date range start |
| `dateTo` | date | Filter by test date range end |
| `testSection` | string | Filter by test section |
| `analyzer` | string | Filter by analyzer |
| `flagged` | boolean | Filter to show only flagged results |
| `normal` | boolean | Filter by normal status |
| `enteredBy` | string | Filter by user who entered result |
| `page` | integer | Page number (default: 1) |
| `pageSize` | integer | Results per page (default: 25, options: 10, 25, 50, 100) |

### Response Format

```json
{
  "results": [...],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalResults": 147,
    "totalPages": 6
  },
  "summary": {
    "normal": 95,
    "abnormal": 42,
    "flagged": 18
  }
}
```

### Accept Request Body

```json
{
  "resultIds": [1, 2, 3]
}
```

### Retest Request Body

```json
{
  "resultIds": [1, 2, 3],
  "reason": "Delta check exceeded threshold. Please verify sample and re-run."
}
```

## Acceptance Criteria

### Initial State (Required Search)
- [ ] Page loads with empty state - no data displayed
- [ ] Empty state shows "Search to View Results" message
- [ ] Search button disabled until lab unit selected OR search query entered
- [ ] Selecting lab unit triggers automatic search
- [ ] Entering search query and pressing Enter or clicking Search triggers search
- [ ] Clear button resets to initial empty state

### Page Loading (After Search)
- [ ] Page loads with results in "Awaiting Validation" status only
- [ ] Results sorted by entry date (oldest first by default)
- [ ] Count of awaiting results displayed in header
- [ ] Quick stats show Normal, Abnormal, and Flagged counts
- [ ] Loading indicator displayed during data fetch

### Pagination
- [ ] Default page size is 25 results
- [ ] Page size selector shows options: 10, 25, 50, 100
- [ ] Changing page size resets to page 1
- [ ] "Showing X to Y of Z" text displays correctly
- [ ] Page numbers display with ellipsis for large result sets
- [ ] First/Last page buttons work correctly
- [ ] Previous/Next buttons work correctly
- [ ] Navigation buttons disabled at boundaries
- [ ] Selection cleared when changing pages

### Advanced Filters
- [ ] Filters panel toggles visibility
- [ ] Lab Number range filter works (From/To)
- [ ] Date range filter works (From/To)
- [ ] Test Section dropdown filter works
- [ ] Analyzer dropdown filter works
- [ ] Entered By dropdown filter works
- [ ] Quick filter checkboxes (Flagged, Normal, Abnormal) are mutually exclusive
- [ ] Apply Filters button triggers new search
- [ ] Filters combine correctly (AND logic)

### Batch Selection
- [ ] "Select All" checkbox selects/deselects all visible results on current page
- [ ] "Select Normal" button selects only results with isNormal=true on current page
- [ ] Selection count updates in real-time
- [ ] Selected rows are visually highlighted

### Batch Actions
- [ ] "Accept & Release Selected" validates and releases all selected results
- [ ] "Retest Selected" opens retest modal for all selected results
- [ ] Both batch action buttons disabled when no results selected
- [ ] Confirmation feedback after batch action completion

### Row Display
- [ ] Collapsed row shows: checkbox, QC indicator, lab number, patient ID/sex/age, test name, method, range, result, flags, entered by, row actions
- [ ] Patient name hidden in collapsed view (privacy)
- [ ] Result value highlighted if abnormal
- [ ] Entry timestamp shows who entered and when
- [ ] Row actions: Retest and Accept buttons

### Expanded Row
- [ ] Patient details banner shows full name, DOB, ID
- [ ] Entry info banner shows entered by, timestamp, method
- [ ] Method notes displayed if manual method
- [ ] Result value is editable
- [ ] Delta check alert displayed if threshold exceeded
- [ ] Interpretation displayed with label and text
- [ ] Notes section shows all notes if any exist

### Tabs
- [ ] Method & Reagents tab shows method and reagent lots used (read-only)
- [ ] History tab shows previous results with delta calculations
- [ ] QA/QC tab shows QC results and warnings

### Retest Modal
- [ ] Opens when Retest button clicked (single or batch)
- [ ] Displays count of results being sent for retest
- [ ] Reason field is required
- [ ] Cancel button closes modal without action
- [ ] Confirm button disabled until reason entered
- [ ] On confirm: status set to Pending, note added, history updated

### Result Editing
- [ ] Result value can be edited by validator
- [ ] Changes trigger re-evaluation of flags
- [ ] Edit is logged in audit trail

### Accept & Release
- [ ] Single result can be accepted via row action
- [ ] Multiple results can be accepted via batch action
- [ ] Status changes to "Released" after acceptance
- [ ] Results removed from validation queue after acceptance
- [ ] Success feedback displayed after acceptance

## Security Considerations

### RBAC Enforcement
- Page access restricted to users with validation role
- API endpoints verify validation permission before processing
- User ID logged with all actions

### Audit Trail
All actions are logged:
- Result viewed
- Result edited (old value, new value)
- Result accepted
- Result sent for retest (with reason)

### Data Integrity
- Original result values preserved in history when edited
- Retest reason is required and cannot be empty
- All timestamps use server time

## Future Enhancements (v2)

### Auto-Validation Rules
- Configure rules for automatic validation based on:
  - Result within normal range
  - QC passed
  - No delta check alert
  - No critical flags
- Auto-validated results marked differently in audit trail

### Validation Comments
- Optional comment field when accepting results
- Comments visible in result history

### Batch Review Mode
- Side-by-side comparison view for batch validation
- Quick accept/reject controls without expanding rows

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-19 | Casey Iiams-Hauser | Initial draft |
