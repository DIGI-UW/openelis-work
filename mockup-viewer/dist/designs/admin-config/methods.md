# Methods Management Redesign

## Overview

Comprehensive redesign of the Methods management interface in OpenELIS Global. Methods define the procedures/techniques used to perform laboratory tests and can be linked to instruments, reagents, SOPs, and assigned to multiple tests.

**Target Release:** OpenELIS Global v3.2 (Q1 2026)

---

## Problem Statement

Current methods management lacks:
- Centralized view of method-test associations
- Ability to bulk assign methods to panel tests
- SOP document management
- Clear linkage to instruments and reagents
- Lab unit filtering for large installations
- Proper deactivation workflow with reassignment options

---

## Solution

A unified Methods management interface with:
- List view with lab unit filtering
- Detail editor with comprehensive configuration
- Bulk assignment to tests and panels
- SOP document uploads
- Instrument and reagent linkage
- Deactivation with test reassignment workflow

---

## Data Model

```sql
-- Method (may already exist, showing full structure)
CREATE TABLE method (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    reference_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP,
    created_by INTEGER REFERENCES system_user(id)
);

-- Method Lab Unit Assignment
CREATE TABLE method_lab_unit (
    id SERIAL PRIMARY KEY,
    method_id INTEGER NOT NULL REFERENCES method(id),
    lab_unit_id INTEGER NOT NULL REFERENCES lab_unit(id),
    UNIQUE (method_id, lab_unit_id)
);

-- Method Instrument Assignment
CREATE TABLE method_instrument (
    id SERIAL PRIMARY KEY,
    method_id INTEGER NOT NULL REFERENCES method(id),
    instrument_id INTEGER NOT NULL REFERENCES instrument(id),
    is_primary BOOLEAN DEFAULT FALSE,
    UNIQUE (method_id, instrument_id)
);

-- Method Reagent Assignment
CREATE TABLE method_reagent (
    id SERIAL PRIMARY KEY,
    method_id INTEGER NOT NULL REFERENCES method(id),
    reagent_id INTEGER NOT NULL REFERENCES reagent(id),
    usage_notes TEXT,
    UNIQUE (method_id, reagent_id)
);

-- Method SOP Documents
CREATE TABLE method_document (
    id SERIAL PRIMARY KEY,
    method_id INTEGER NOT NULL REFERENCES method(id),
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50), -- SOP, Reference, Training, etc.
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    version VARCHAR(50),
    effective_date DATE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER REFERENCES system_user(id)
);

-- Test Method Assignment (likely exists)
CREATE TABLE test_method (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    method_id INTEGER NOT NULL REFERENCES method(id),
    is_default BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    UNIQUE (test_id, method_id)
);
```

---

## Method Editor Tabs

| Section | Tab | Description |
|---------|-----|-------------|
| **Configuration** | Basic Info | Name, code, description, status, lab units |
| **Configuration** | Documents | SOP uploads and reference materials |
| **Associations** | Tests | Tests using this method, bulk assignment |
| **Associations** | Instruments | Linked analyzers/instruments |
| **Associations** | Reagents | Linked reagent kits |

---

## List View

### Layout
- Full-width table with sortable columns
- Toolbar with filters and actions
- Pagination footer

### Toolbar
- "Add Method" button (primary)
- Search input (name/code)
- Lab Unit filter dropdown
- Status filter (All, Active, Inactive)
- Methods count display

### Table Columns

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| Method Name | flex | Yes | Full method name, clickable row to open editor |
| Code | 100px | Yes | Method code (monospace) |
| Lab Units | 200px | No | Badges (max 2 visible, then "+X more") |
| Tests | 80px | Yes | Number of tests using this method |
| Instruments | 100px | Yes | Number of linked instruments |
| Docs | 80px | Yes | Number of attached documents |
| Status | 100px | No | Active/Inactive badge |
| Actions | 80px | No | Edit button, More menu |

### Sorting Behavior
- Click column header to sort ascending
- Click again to toggle to descending
- Sort icon indicates current sort direction
- Default sort: Method Name ascending

### Row Behavior
- Entire row clickable to open editor
- Hover highlight on row
- Action buttons use stopPropagation to prevent row click

### Pagination
- Page size options: 25, 50, 100 (default 25)
- Navigation: First, Previous, numbered pages, Next, Last
- Status text: "Showing X to Y of Z methods"
- Filters reset to page 1 when changed

---

## Basic Info Tab

### Fields

| Field | Description | Required |
|-------|-------------|----------|
| **Method Name** | Full name (e.g., "ELISA - HIV 1/2 Antibody") | Yes |
| **Code** | Short code (e.g., "ELISA-HIV") | Yes |
| **Description** | Detailed description of the method | No |
| **Reference URL** | External documentation link | No |
| **Lab Units** | Which lab units use this method | Yes (at least 1) |
| **Active** | Whether method is active | Yes |

### Lab Units Assignment
- Multi-select dropdown or checkbox list
- At least one lab unit required
- Determines where method appears in filters

### Status Toggle
When deactivating, triggers deactivation workflow (see below).

---

## Documents Tab

### Purpose
Upload and manage SOP documents and reference materials for the method.

### Document List
Table showing uploaded documents:
- Document name (link to download)
- Type badge (SOP, Reference, Training, Other)
- Version
- Effective date
- File size
- Uploaded by / date
- Actions: Download, Edit, Delete

### Upload Document Modal

**Fields:**
- File upload (drag-and-drop or browse)
- Document Name (auto-filled from filename, editable)
- Document Type dropdown:
  - SOP (Standard Operating Procedure)
  - Reference
  - Training Material
  - Validation Report
  - Other
- Version (e.g., "1.0", "2.1")
- Effective Date (date picker)
- Notes (optional)

**Supported formats:** PDF, DOC, DOCX, XLS, XLSX, PNG, JPG

### Document Versioning
- Multiple versions of same document allowed
- Latest version highlighted
- Version history accessible

---

## Tests Tab

### Purpose
View and manage which tests use this method, and bulk assign to additional tests.

### Current Assignments
Table showing tests using this method:
- Test name
- Test code
- Sample type
- Is Default badge (if this is the default method for the test)
- Lab unit
- Actions: Remove, Set as Default (if not already)

### Summary Header
"This method is assigned to X tests (default for Y tests)"

### Bulk Actions

**Assign to Tests Button**
Opens modal to select individual tests:
- Search/filter available tests
- Filter by lab unit
- Filter by: All tests, Tests without methods, Tests in same lab unit
- Multi-select with checkboxes
- Option: "Set as default method for selected tests"
- Confirm to assign

**Assign to Panel Button**
Opens modal to assign method to all tests in a panel:
- Panel selector dropdown
- Shows preview: "This will add the method to X tests"
- Lists the tests that will be affected
- Option: "Set as default method for these tests"
- Confirm to assign

### Assignment Preview
Before confirming bulk assignment:
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Assign Method to Panel                                  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Panel: Basic Metabolic Panel (BMP)                      â”‚
â”‚                                                         â”‚
â”‚ This will add "ELISA - HIV 1/2 Antibody" to 8 tests:    â”‚
â”‚                                                         â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ âœ“ Glucose, Fasting (already assigned)               â”‚ â”‚
â”‚ â”‚ + Sodium                                            â”‚ â”‚
â”‚ â”‚ + Potassium                                         â”‚ â”‚
â”‚ â”‚ + Chloride                                          â”‚ â”‚
â”‚ â”‚ + CO2                                               â”‚ â”‚
â”‚ â”‚ + BUN                                               â”‚ â”‚
â”‚ â”‚ + Creatinine                                        â”‚ â”‚
â”‚ â”‚ + Calcium                                           â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                                         â”‚
â”‚ â˜‘ Set as default method for these tests                 â”‚
â”‚                                                         â”‚
â”‚ [Cancel]                              [Assign to Panel] â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Instruments Tab

### Purpose
Link instruments/analyzers that can perform this method.

### Linked Instruments Table
- Instrument name
- Instrument code
- Type/model
- Primary indicator (star icon if primary)
- Status
- Actions: Remove, Set as Primary

### Add Instrument Button
Opens modal to select instruments:
- Search available instruments
- Filter by lab unit
- Multi-select
- Option to set one as primary

### Primary Instrument
- One instrument can be marked as primary
- Primary used as default when creating worklists
- Star icon indicates primary

---

## Reagents Tab

### Purpose
Link reagent kits used by this method.

### Linked Reagents Table
- Reagent name
- Reagent code/catalog number
- Manufacturer
- Usage notes
- Current stock status (if inventory module enabled)
- Actions: Edit Notes, Remove

### Add Reagent Button
Opens modal to select reagents:
- Search reagent catalog
- Filter by type
- Multi-select
- Optional usage notes per reagent

### Usage Notes
Per-reagent notes for method-specific instructions:
- Dilution ratios
- Volume requirements
- Special handling

---

## Deactivation Workflow

### Trigger
User clicks "Deactivate" or toggles status to inactive.

### Step 1: Impact Summary
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âš  Deactivate Method                                     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ You are about to deactivate:                            â”‚
â”‚   ELISA - HIV 1/2 Antibody (ELISA-HIV)                  â”‚
â”‚                                                         â”‚
â”‚ This method is currently assigned to:                   â”‚
â”‚   â€¢ 12 tests (default method for 8 tests)               â”‚
â”‚   â€¢ 3 instruments                                       â”‚
â”‚   â€¢ 5 reagents                                          â”‚
â”‚                                                         â”‚
â”‚ What would you like to do with assigned tests?          â”‚
â”‚                                                         â”‚
â”‚ â—‹ Leave tests without this method                       â”‚
â”‚   (Tests will have one fewer method option)             â”‚
â”‚                                                         â”‚
â”‚ â—‹ Reassign tests to a different method                  â”‚
â”‚   (Select replacement method)                           â”‚
â”‚                                                         â”‚
â”‚ [Cancel]                              [Continue]        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Step 2: Reassignment (if selected)
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Reassign Tests to New Method                            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Select replacement method:                              â”‚
â”‚ [Dropdown: Select method...                         â–¼]  â”‚
â”‚                                                         â”‚
â”‚ Tests to reassign (12):                                 â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ â˜‘ HIV 1/2 Antibody (default)                        â”‚ â”‚
â”‚ â”‚ â˜‘ HIV Confirmatory (default)                        â”‚ â”‚
â”‚ â”‚ â˜‘ HIV Rapid Test (default)                          â”‚ â”‚
â”‚ â”‚ â˜‘ Hepatitis B Surface Antigen                       â”‚ â”‚
â”‚ â”‚ ... and 8 more                                      â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                                         â”‚
â”‚ â˜‘ Transfer "default method" status to new method        â”‚
â”‚                                                         â”‚
â”‚ [Back]                    [Reassign and Deactivate]     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Step 3: Confirmation
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Confirm Deactivation                                    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ The following actions will be performed:                â”‚
â”‚                                                         â”‚
â”‚ âœ“ Deactivate method: ELISA - HIV 1/2 Antibody           â”‚
â”‚ âœ“ Reassign 12 tests to: Chemiluminescence Immunoassay   â”‚
â”‚ âœ“ Transfer default status for 8 tests                   â”‚
â”‚                                                         â”‚
â”‚ Instrument and reagent links will be preserved but      â”‚
â”‚ the method will not appear in active method lists.      â”‚
â”‚                                                         â”‚
â”‚ [Cancel]                              [Deactivate]      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## API Endpoints

### Method CRUD
- `GET /api/methods` - List with filtering
- `GET /api/methods/{id}` - Get with associations
- `POST /api/methods` - Create
- `PUT /api/methods/{id}` - Update
- `POST /api/methods/{id}/deactivate` - Deactivate with options

### Lab Unit Assignment
- `GET /api/methods/{id}/lab-units`
- `PUT /api/methods/{id}/lab-units` - Set lab units

### Test Assignment
- `GET /api/methods/{id}/tests` - List assigned tests
- `POST /api/methods/{id}/tests` - Assign to tests
- `POST /api/methods/{id}/tests/panel/{panelId}` - Assign to panel tests
- `DELETE /api/methods/{id}/tests/{testId}` - Remove from test

### Instruments
- `GET /api/methods/{id}/instruments`
- `POST /api/methods/{id}/instruments`
- `DELETE /api/methods/{id}/instruments/{instrumentId}`
- `PUT /api/methods/{id}/instruments/{instrumentId}/primary`

### Reagents
- `GET /api/methods/{id}/reagents`
- `POST /api/methods/{id}/reagents`
- `PUT /api/methods/{id}/reagents/{reagentId}` - Update usage notes
- `DELETE /api/methods/{id}/reagents/{reagentId}`

### Documents
- `GET /api/methods/{id}/documents`
- `POST /api/methods/{id}/documents` - Upload
- `GET /api/methods/{id}/documents/{docId}/download`
- `PUT /api/methods/{id}/documents/{docId}` - Update metadata
- `DELETE /api/methods/{id}/documents/{docId}`

---

## Acceptance Criteria

### List View
- [ ] Methods displayed with lab unit badges
- [ ] Lab unit filter works
- [ ] Status filter works
- [ ] Search by name/code works
- [ ] Quick summary shows accurate counts
- [ ] Edit navigates to editor

### Basic Info Tab
- [ ] All fields editable
- [ ] Lab unit multi-select works
- [ ] At least one lab unit required
- [ ] Status toggle triggers deactivation workflow

### Documents Tab
- [ ] Document list displays correctly
- [ ] Upload modal accepts supported formats
- [ ] Document type dropdown works
- [ ] Version and effective date saved
- [ ] Download works
- [ ] Delete with confirmation

### Tests Tab
- [ ] Assigned tests displayed
- [ ] Default method indicator shown
- [ ] Remove assignment works
- [ ] Set as default works
- [ ] Assign to Tests modal filters correctly
- [ ] Assign to Panel shows preview
- [ ] "Set as default" option works for bulk assign
- [ ] Panel assignment adds to existing (doesn't replace)

### Instruments Tab
- [ ] Linked instruments displayed
- [ ] Add instrument modal works
- [ ] Primary indicator shown
- [ ] Set as primary works
- [ ] Remove with confirmation

### Reagents Tab
- [ ] Linked reagents displayed
- [ ] Add reagent modal works
- [ ] Usage notes editable
- [ ] Remove with confirmation

### Deactivation
- [ ] Impact summary shows correct counts
- [ ] "Leave without method" option works
- [ ] "Reassign" option shows method selector
- [ ] Test selection for reassignment works
- [ ] Default status transfer option works
- [ ] Confirmation shows summary
- [ ] Audit log records deactivation

---

## Navigation

**Menu Location:** Admin > Method Setup

**Breadcrumb:** Admin > Method Setup > [Method Name]

---

## Related Features

- **Test Catalog (OGC-173)**: Methods tab in test editor references this
- **Instrument Management**: Instruments linked to methods
- **Reagent/Inventory**: Reagents linked to methods
- **Lab Units (OGC-189)**: Methods filtered by lab unit
