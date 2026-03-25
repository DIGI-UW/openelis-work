# Lab Units Management Redesign

## Overview

Comprehensive redesign of the Lab Units (Laboratory Sections/Departments) management interface in OpenELIS Global. Consolidates all lab unit configuration into a unified editor with vertical tab navigation.

**Target Release:** OpenELIS Global v3.2 (Q1 2026)

---

## Problem Statement

Current lab units management is fragmented:
- Features separated across multiple screens
- No unified view of all items assigned to a lab unit
- Difficult to bulk reassign tests when reorganizing
- No clear relationship between lab units and programs/projects/workflows
- Missing import/export for configuration sharing

---

## Solution

A unified Lab Units management interface with:
- List view with drag-and-drop ordering
- Detail editor with vertical tabs
- Bulk assignment and reassignment tools
- Activation/deactivation with cascade prompts
- File-based import/export

---

## Lab Unit Editor Tabs

| Section | Tab | Description |
|---------|-----|-------------|
| **Configuration** | Basic Info | Name, code, description, display order, status |
| **Configuration** | Workflows | Custom workflows assigned to this lab unit |
| **Assignments** | Tests | Tests assigned to this lab unit |
| **Assignments** | Panels | Panels assigned to this lab unit |
| **Assignments** | Programs | Clinical programs with order entry forms |
| **Assignments** | Projects | Lab notebook projects |
| **Data** | Import/Export | File-based configuration transfer |

---

## List View

### Layout
- Full-width table with sortable columns
- Toolbar with filters and actions
- Pagination footer

### Toolbar
- "Add Lab Unit" button (primary)
- "Import" button (secondary)
- "Export" button (secondary)
- Search input (name/code)
- Status filter (All, Active, Inactive)
- Lab units count display

### Table Columns

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| Order | 80px | Yes | Display order number |
| Lab Unit Name | flex | Yes | Full name, clickable row to open editor |
| Code | 100px | Yes | Abbreviation (monospace) |
| Tests | 80px | Yes | Number of assigned tests |
| Panels | 80px | Yes | Number of assigned panels |
| Programs | 100px | Yes | Number of assigned programs |
| Workflows | 100px | Yes | Number of assigned workflows |
| Status | 100px | No | Active/Inactive badge |
| Actions | 80px | No | Edit button, More menu |

### Sorting Behavior
- Click column header to sort ascending
- Click again to toggle to descending
- Sort icon indicates current sort direction
- Default sort: Display Order ascending

### Row Behavior
- Entire row clickable to open editor
- Hover highlight on row
- Action buttons use stopPropagation to prevent row click

### Pagination
- Page size options: 25, 50, 100 (default 25)
- Navigation: First, Previous, numbered pages, Next, Last
- Status text: "Showing X to Y of Z lab units"
- Filters reset to page 1 when changed

---

## Basic Info Tab

### Fields

| Field | Description | Required |
|-------|-------------|----------|
| **Lab Unit Name** | Full name (e.g., "Clinical Chemistry") | Yes |
| **Code/Abbreviation** | Short code (e.g., "CHEM") | Yes |
| **Description** | Detailed description | No |
| **Display Order** | Numeric sequence for display | Yes (auto) |
| **Active** | Whether unit is active | Yes |
| **External ID** | For integration mapping | No |

### Localization
- Name and description support multiple languages
- Uses same fallback chain as test catalog

### Status Toggle
When toggling Active status:
- Show confirmation dialog with impact summary
- Count of affected tests, panels, programs, projects
- Option to cascade (deactivate all assigned items)
- Option to reassign items to another lab unit first

---

## Workflows Tab

### Purpose
Assign custom workflows that apply to this lab unit. Workflows control:
- Result entry process (single entry, dual entry, supervisor review)
- Validation requirements
- Auto-verification rules
- Turnaround time tracking

### Workflow Assignment
- List of available workflows
- Multi-select to assign
- One workflow can be marked as default
- Workflows can be shared across lab units or exclusive

### Display
Table showing assigned workflows:
- Workflow name
- Type (Result Entry, Validation, etc.)
- Default indicator
- Remove action

### Inline Workflow Reference
Link to Workflow management for creating/editing workflows (not inline creation - workflows are complex)

---

## Tests Tab

### Current Assignments
Table showing tests assigned to this lab unit:
- Test name
- Test code
- LOINC code
- Status (Active/Inactive)
- Primary indicator (if test belongs to multiple units)
- Actions: Remove, Set as Primary

### Bulk Actions Toolbar
- **Assign Tests**: Open test selector to add tests
- **Reassign Selected**: Move selected tests to another lab unit
- **Remove Selected**: Unassign selected tests (with confirmation)
- **Activate/Deactivate Selected**: Bulk status change

### Assign Tests Modal
- Search/filter available tests
- Multi-select with checkboxes
- Filter by: Currently unassigned, All tests, From specific unit
- Shows current assignment if test is already assigned elsewhere
- Confirmation prompt before assignment

### Reassign Tests Flow

1. Select tests to reassign (checkboxes)
2. Click "Reassign Selected"
3. **Reassignment Dialog:**
   ```
   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
   â”‚ Reassign 12 Tests                                       â”‚
   â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
   â”‚ You are about to reassign 12 tests from:                â”‚
   â”‚   Clinical Chemistry                                    â”‚
   â”‚                                                         â”‚
   â”‚ Select destination lab unit:                            â”‚
   â”‚ [Dropdown: Select lab unit...           â–¼]              â”‚
   â”‚                                                         â”‚
   â”‚ â˜‘ Keep reference to original unit (secondary)           â”‚
   â”‚                                                         â”‚
   â”‚ Tests to reassign:                                      â”‚
   â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
   â”‚ â”‚ â€¢ Glucose, Fasting (GLU)                            â”‚ â”‚
   â”‚ â”‚ â€¢ HbA1c (HBA1C)                                     â”‚ â”‚
   â”‚ â”‚ â€¢ Cholesterol, Total (CHOL)                         â”‚ â”‚
   â”‚ â”‚ â€¢ ... and 9 more                                    â”‚ â”‚
   â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
   â”‚                                                         â”‚
   â”‚ [Cancel]                      [Reassign Tests]          â”‚
   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
   ```
4. Confirm destination and options
5. Execute reassignment with success message

### Test Count Summary
Header shows: "47 tests assigned (42 active, 5 inactive)"

---

## Panels Tab

### Current Assignments
Table showing panels assigned to this lab unit:
- Panel name
- Panel code
- Test count (e.g., "8 tests")
- Status (Active/Inactive)
- Actions: View Tests, Remove

### Bulk Actions
- **Assign Panels**: Open panel selector
- **Reassign Selected**: Move to another lab unit
- **Remove Selected**: Unassign (with confirmation)

### Panel Assignment
Similar flow to tests:
- Search/filter panels
- Multi-select
- Shows which lab unit panel is currently assigned to
- Confirmation before assignment

### View Tests Expansion
Expandable row showing all tests in the panel with their status.

---

## Programs Tab

### Purpose
Clinical programs (HIV, TB, Malaria, etc.) that:
- Have custom order entry forms
- May have specific reporting requirements
- Are tracked for program-level analytics

### Current Assignments
Table showing programs assigned to this lab unit:
- Program name
- Program code
- Order entry form (linked)
- Patient count (active patients in program)
- Status
- Actions: Configure, Remove

### Assign Programs Modal
- List available programs
- Shows current lab unit assignment
- Multi-select
- Confirmation prompt

### Program Configuration
For each assigned program, configure:
- Default order entry form
- Required fields for this lab unit
- Auto-add tests (tests automatically added for program patients)

---

## Projects Tab

### Purpose
Lab notebook projects (research studies, QA projects) that:
- Have custom order entry screens
- Are tracked separately from clinical programs
- Have defined start/end dates
- May have specific consent requirements

### Current Assignments
Table showing projects assigned to this lab unit:
- Project name
- Project code
- Principal Investigator
- Status (Active/Completed/On Hold)
- Sample count
- Date range
- Actions: View Details, Remove

### Assign Projects Modal
- List available projects
- Filter by status
- Shows current assignment
- Multi-select with confirmation

### Project Details
Expandable section showing:
- Full project description
- Order entry form assigned
- Enrolled patients/samples
- Date range

---

## Import/Export Tab

### Export

**Export Options:**
- Lab unit configuration only
- Lab unit + test assignments
- Lab unit + all assignments (tests, panels, programs, projects, workflows)
- Multiple lab units (select which to export)

**Export Format:**
- JSON (machine-readable, for import)
- CSV (for review/documentation)

**Export Content:**
```json
{
  "exportVersion": "1.0",
  "exportDate": "2025-12-12T14:30:00Z",
  "labUnits": [
    {
      "code": "CHEM",
      "name": "Clinical Chemistry",
      "description": "...",
      "displayOrder": 1,
      "isActive": true,
      "tests": [
        { "code": "GLU", "loincCode": "1558-6", "isPrimary": true },
        { "code": "HBA1C", "loincCode": "4548-4", "isPrimary": true }
      ],
      "panels": [
        { "code": "BMP", "name": "Basic Metabolic Panel" }
      ],
      "programs": [
        { "code": "DM", "name": "Diabetes Management" }
      ],
      "workflows": [
        { "code": "DUAL_ENTRY", "isDefault": true }
      ]
    }
  ]
}
```

### Import

**Import Options:**
- Create new lab units only
- Update existing (match by code)
- Create new + update existing

**Import Validation:**
- Validate JSON structure
- Check for duplicate codes
- Verify referenced items exist (tests, panels, etc.)
- Preview changes before applying

**Import Preview:**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Import Preview                                          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ File: lab-units-export-2025-12-12.json                  â”‚
â”‚                                                         â”‚
â”‚ Changes to be applied:                                  â”‚
â”‚                                                         â”‚
â”‚ âœ“ CREATE: Molecular Biology (MOL)                       â”‚
â”‚   - 15 tests to assign                                  â”‚
â”‚   - 2 panels to assign                                  â”‚
â”‚                                                         â”‚
â”‚ âœ“ UPDATE: Clinical Chemistry (CHEM)                     â”‚
â”‚   - Add 3 tests                                         â”‚
â”‚   - Remove 1 panel                                      â”‚
â”‚                                                         â”‚
â”‚ âš  WARNING: 2 tests not found in system                  â”‚
â”‚   - PCR-COVID19                                         â”‚
â”‚   - PCR-FLU                                             â”‚
â”‚                                                         â”‚
â”‚ [Cancel]              [Import with Warnings]  [Import]  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Activation/Deactivation Flow

### Deactivate Lab Unit

When user clicks "Deactivate" or toggles status to inactive:

**Step 1: Impact Summary**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Deactivate Lab Unit                                     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ You are about to deactivate:                            â”‚
â”‚   Clinical Chemistry (CHEM)                             â”‚
â”‚                                                         â”‚
â”‚ This will affect:                                       â”‚
â”‚   â€¢ 47 tests                                            â”‚
â”‚   â€¢ 8 panels                                            â”‚
â”‚   â€¢ 3 programs                                          â”‚
â”‚   â€¢ 2 projects                                          â”‚
â”‚                                                         â”‚
â”‚ Deactivated lab units are hidden from order entry       â”‚
â”‚ but historical data is preserved.                       â”‚
â”‚                                                         â”‚
â”‚ What would you like to do with assigned items?          â”‚
â”‚                                                         â”‚
â”‚ â—‹ Keep assignments (items remain but unit is hidden)    â”‚
â”‚ â—‹ Deactivate all assigned items                         â”‚
â”‚ â—‹ Reassign items to another lab unit first              â”‚
â”‚                                                         â”‚
â”‚ [Cancel]                              [Continue]        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Step 2a: If "Reassign items first"**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Reassign Items Before Deactivation                      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Select destination for each item type:                  â”‚
â”‚                                                         â”‚
â”‚ Tests (47):                                             â”‚
â”‚ [Dropdown: Select lab unit...           â–¼]              â”‚
â”‚                                                         â”‚
â”‚ Panels (8):                                             â”‚
â”‚ [Dropdown: Select lab unit...           â–¼]              â”‚
â”‚                                                         â”‚
â”‚ Programs (3):                                           â”‚
â”‚ [Dropdown: Select lab unit...           â–¼]              â”‚
â”‚                                                         â”‚
â”‚ Projects (2):                                           â”‚
â”‚ [Dropdown: Select lab unit...           â–¼]              â”‚
â”‚                                                         â”‚
â”‚ [Back]              [Reassign and Deactivate]           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Step 2b: If "Deactivate all assigned items"**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âš  Confirm Bulk Deactivation                             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ This will deactivate:                                   â”‚
â”‚                                                         â”‚
â”‚   â€¢ Clinical Chemistry lab unit                         â”‚
â”‚   â€¢ 47 tests (will not appear in order entry)           â”‚
â”‚   â€¢ 8 panels (will not appear in order entry)           â”‚
â”‚   â€¢ 3 programs (patients can still be enrolled)         â”‚
â”‚   â€¢ 2 projects (existing samples preserved)             â”‚
â”‚                                                         â”‚
â”‚ This action can be reversed by reactivating the         â”‚
â”‚ lab unit and its items individually.                    â”‚
â”‚                                                         â”‚
â”‚ Type "DEACTIVATE" to confirm:                           â”‚
â”‚ [                                              ]        â”‚
â”‚                                                         â”‚
â”‚ [Cancel]                              [Deactivate All]  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Activate Lab Unit

When activating a previously deactivated lab unit:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Activate Lab Unit                                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ You are about to activate:                              â”‚
â”‚   Clinical Chemistry (CHEM)                             â”‚
â”‚                                                         â”‚
â”‚ Currently assigned items:                               â”‚
â”‚   â€¢ 47 tests (12 active, 35 inactive)                   â”‚
â”‚   â€¢ 8 panels (3 active, 5 inactive)                     â”‚
â”‚   â€¢ 3 programs (all active)                             â”‚
â”‚   â€¢ 2 projects (1 active, 1 completed)                  â”‚
â”‚                                                         â”‚
â”‚ Would you like to activate all inactive items?          â”‚
â”‚                                                         â”‚
â”‚ â—‹ Activate lab unit only                                â”‚
â”‚ â—‹ Activate lab unit and all inactive tests/panels       â”‚
â”‚                                                         â”‚
â”‚ [Cancel]                              [Activate]        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Data Model

### Core Tables

```sql
-- Lab Unit (may already exist, showing additions)
ALTER TABLE lab_unit ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE lab_unit ADD COLUMN IF NOT EXISTS external_id VARCHAR(50);
ALTER TABLE lab_unit ADD COLUMN IF NOT EXISTS description_key INTEGER REFERENCES localization(id);

-- Lab Unit Workflow Assignment
CREATE TABLE lab_unit_workflow (
    id SERIAL PRIMARY KEY,
    lab_unit_id INTEGER NOT NULL REFERENCES lab_unit(id),
    workflow_id INTEGER NOT NULL REFERENCES workflow(id),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (lab_unit_id, workflow_id)
);

-- Lab Unit Program Assignment
CREATE TABLE lab_unit_program (
    id SERIAL PRIMARY KEY,
    lab_unit_id INTEGER NOT NULL REFERENCES lab_unit(id),
    program_id INTEGER NOT NULL REFERENCES program(id),
    default_order_form_id INTEGER REFERENCES questionnaire(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (lab_unit_id, program_id)
);

-- Lab Unit Project Assignment
CREATE TABLE lab_unit_project (
    id SERIAL PRIMARY KEY,
    lab_unit_id INTEGER NOT NULL REFERENCES lab_unit(id),
    project_id INTEGER NOT NULL REFERENCES project(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (lab_unit_id, project_id)
);

-- Existing table for test assignment (likely exists)
-- test.lab_unit_id or test_lab_unit junction table

-- Existing table for panel assignment
-- panel.lab_unit_id or panel_lab_unit junction table
```

### Import/Export Audit

```sql
CREATE TABLE lab_unit_import_log (
    id SERIAL PRIMARY KEY,
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    imported_by INTEGER REFERENCES system_user(id),
    file_name VARCHAR(255),
    lab_units_created INTEGER DEFAULT 0,
    lab_units_updated INTEGER DEFAULT 0,
    tests_assigned INTEGER DEFAULT 0,
    panels_assigned INTEGER DEFAULT 0,
    warnings TEXT,
    import_data JSONB
);
```

---

## API Endpoints

### Lab Unit CRUD
- `GET /api/lab-units` - List with counts
- `GET /api/lab-units/{id}` - Get with all assignments
- `POST /api/lab-units` - Create
- `PUT /api/lab-units/{id}` - Update
- `DELETE /api/lab-units/{id}` - Soft delete

### Ordering
- `PUT /api/lab-units/reorder` - Update display order for multiple units

### Assignments
- `GET /api/lab-units/{id}/tests` - List assigned tests
- `POST /api/lab-units/{id}/tests` - Assign tests
- `DELETE /api/lab-units/{id}/tests` - Remove test assignments
- `POST /api/lab-units/{id}/tests/reassign` - Bulk reassign tests

- `GET /api/lab-units/{id}/panels` - List assigned panels
- `POST /api/lab-units/{id}/panels` - Assign panels
- `DELETE /api/lab-units/{id}/panels` - Remove panel assignments

- `GET /api/lab-units/{id}/programs` - List assigned programs
- `POST /api/lab-units/{id}/programs` - Assign programs
- `DELETE /api/lab-units/{id}/programs` - Remove program assignments

- `GET /api/lab-units/{id}/projects` - List assigned projects
- `POST /api/lab-units/{id}/projects` - Assign projects
- `DELETE /api/lab-units/{id}/projects` - Remove project assignments

- `GET /api/lab-units/{id}/workflows` - List assigned workflows
- `POST /api/lab-units/{id}/workflows` - Assign workflows
- `DELETE /api/lab-units/{id}/workflows` - Remove workflow assignments

### Status
- `POST /api/lab-units/{id}/activate` - Activate with options
- `POST /api/lab-units/{id}/deactivate` - Deactivate with options

### Import/Export
- `GET /api/lab-units/export` - Export selected units
- `POST /api/lab-units/import/validate` - Validate import file
- `POST /api/lab-units/import` - Execute import

---

## Acceptance Criteria

### List View
- [ ] Lab units displayed in sortable list
- [ ] Drag-and-drop reordering functional
- [ ] Display order persists and affects system-wide display
- [ ] Status filter (All/Active/Inactive) works
- [ ] Search by name or code works
- [ ] Quick summary panel shows counts and status

### Basic Info Tab
- [ ] All fields editable with validation
- [ ] Localized name/description supported
- [ ] Display order editable
- [ ] Status toggle shows confirmation dialog

### Tests Tab
- [ ] Assigned tests displayed in table
- [ ] Bulk assign tests functional
- [ ] Bulk reassign with confirmation prompt
- [ ] Reassignment shows destination selector
- [ ] Reassignment shows list of affected tests
- [ ] Remove tests with confirmation
- [ ] Test counts accurate in header

### Panels Tab
- [ ] Assigned panels displayed
- [ ] Bulk assign/reassign/remove functional
- [ ] View tests expansion works

### Programs Tab
- [ ] Assigned programs displayed
- [ ] Assign/remove programs functional
- [ ] Order entry form linkage visible

### Projects Tab
- [ ] Assigned projects displayed
- [ ] Assign/remove projects functional
- [ ] Project status and date range visible

### Workflows Tab
- [ ] Assigned workflows displayed
- [ ] Default workflow selectable
- [ ] Assign/remove workflows functional

### Activation/Deactivation
- [ ] Deactivate shows impact summary
- [ ] Option to keep assignments
- [ ] Option to deactivate all items
- [ ] Option to reassign before deactivating
- [ ] Reassignment allows per-type destination
- [ ] Confirmation required for bulk deactivation
- [ ] Activate shows option to activate inactive items

### Import/Export
- [ ] Export lab unit configuration to JSON
- [ ] Export includes test/panel/program assignments
- [ ] Export multiple units at once
- [ ] Import validates file before applying
- [ ] Import preview shows changes
- [ ] Import handles missing references with warnings
- [ ] Import log created for audit

---

## UI Navigation

**Menu Location:** Admin > Lab Unit Setup

**Breadcrumb:** Admin > Lab Unit Setup > [Lab Unit Name]

---

## Related Features

- **Test Catalog (OGC-173)**: Tests reference lab units; changes here affect test assignments
- **Order Entry Forms (OGC-113)**: Programs and projects have custom order entry screens
- **Workflows**: Custom workflows per lab unit for result entry/validation
