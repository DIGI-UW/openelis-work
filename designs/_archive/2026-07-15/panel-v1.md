# Panel Management Redesign

## Overview

Comprehensive redesign of the Panel management interface in OpenELIS Global. Panels are predefined groups of tests that are ordered together, with configurable display order and panel-specific LOINC codes for each test.

**Target Release:** OpenELIS Global v3.2 (Q1 2026)
**Version:** 1.2 (2026-04-23)
**Related Modules:** Test Catalog, Results Entry, Vector Testing & Identification (V-03, OGC-583)

### Change Log
- **v1.2 (2026-04-23):** Removed `ALL` from `panelDomain` enum. Every panel must be explicitly assigned to exactly one domain (CLINICAL, ENVIRONMENTAL, or VECTOR). Default changed from ALL to CLINICAL. Domain routing is determined by the assigned lab unit's domain — the order entry UI never needs a panel from a different domain. Vector Config tab is now shown only when domain = VECTOR (not "VECTOR or ALL").
- **v1.1 (2026-04-17):** Added `panelDomain` field and conditional Vector Configuration section to Basic Info tab. Vector panels are now a configuration step within the unified Panel editor — no separate VectorTestPanel entity. Adds Domain column and Domain filter to list view.

---

## Problem Statement

Current panel management lacks:
- Easy configuration of test order within panels
- Panel-specific LOINC codes for tests
- Drag-and-drop reordering
- Bulk import/export capabilities
- Clear association with lab units and sample types

---

## Solution

A unified Panel management interface with:
- List view with filtering by lab unit and status
- Detail editor with test assignment and ordering
- Panel-specific LOINC codes per test
- Drag-and-drop and numeric ordering
- Bulk import/export with panel selection

---

## Data Model

```sql
-- Panel (may already exist, showing full structure)
CREATE TABLE panel (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    loinc_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    -- v1.1: domain classification
    panel_domain VARCHAR(20) NOT NULL DEFAULT 'CLINICAL',  -- CLINICAL | ENVIRONMENTAL | VECTOR
    vector_organism_group_id INTEGER REFERENCES vector_group(id),  -- nullable; filter hint for VECTOR panels
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP,
    created_by INTEGER REFERENCES system_user(id)
);

-- Panel Lab Unit Assignment
CREATE TABLE panel_lab_unit (
    id SERIAL PRIMARY KEY,
    panel_id INTEGER NOT NULL REFERENCES panel(id),
    lab_unit_id INTEGER NOT NULL REFERENCES lab_unit(id),
    UNIQUE (panel_id, lab_unit_id)
);

-- Panel Sample Type Assignment
CREATE TABLE panel_sample_type (
    id SERIAL PRIMARY KEY,
    panel_id INTEGER NOT NULL REFERENCES panel(id),
    sample_type_id INTEGER NOT NULL REFERENCES sample_type(id),
    UNIQUE (panel_id, sample_type_id)
);

-- Panel Test Assignment
CREATE TABLE panel_test (
    id SERIAL PRIMARY KEY,
    panel_id INTEGER NOT NULL REFERENCES panel(id),
    test_id INTEGER NOT NULL REFERENCES test(id),
    panel_loinc_code VARCHAR(20),  -- Panel-specific LOINC for this test
    display_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE (panel_id, test_id)
);

-- Panel Import Log
CREATE TABLE panel_import_log (
    id SERIAL PRIMARY KEY,
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    imported_by INTEGER REFERENCES system_user(id),
    file_name VARCHAR(255),
    panels_created INTEGER DEFAULT 0,
    panels_updated INTEGER DEFAULT 0,
    panels_skipped INTEGER DEFAULT 0,
    warnings TEXT,
    import_data JSONB
);
```

---

## Panel Editor Tabs

| Section | Tab | Description |
|---------|-----|-------------|
| **Configuration** | Basic Info | Name, code, description, LOINC, domain, lab units, sample types, status |
| **Configuration** | Tests | Test assignment with ordering and panel-specific LOINC codes |
| **Configuration** | Vector Config | Organism group filter — **conditional: only shown when Panel Domain = VECTOR** |

---

## List View

### Layout
- Full-width table with sortable columns
- Toolbar with filters and actions
- Pagination footer

### Toolbar
- "Add Panel" button (primary)
- "Import/Export" button (secondary)
- Search input (name/code/LOINC)
- Lab Unit filter dropdown
- **Domain filter dropdown** (All Domains, Clinical, Environmental, Vector)
- Status filter (All, Active, Inactive)
- Panels count display

### Table Columns

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| Panel Name | flex | Yes | Full name, clickable row to open editor |
| Code | 100px | Yes | Panel code (monospace) |
| LOINC | 100px | Yes | Panel LOINC code |
| Tests | 80px | Yes | Number of tests in panel |
| Domain | 120px | Yes | Tag: CLINICAL (blue) / ENVIRONMENTAL (teal) / VECTOR (purple) |
| Lab Units | 200px | No | Badges (max 2 visible, then "+X more") |
| Sample Types | 200px | No | Badges (max 2 visible, then "+X more") |
| Status | 100px | No | Active/Inactive badge |
| Actions | 80px | No | Edit button, More menu |

### Sorting Behavior
- Click column header to sort ascending
- Click again to toggle to descending
- Sort icon indicates current sort direction
- Default sort: Panel Name ascending

### Row Behavior
- Entire row clickable to open editor
- Hover highlight on row
- Action buttons use stopPropagation to prevent row click

### Pagination
- Page size options: 25, 50, 100 (default 25)
- Navigation: First, Previous, numbered pages, Next, Last
- Status text: "Showing X to Y of Z panels"
- Filters reset to page 1 when changed

---

## Basic Info Tab

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Panel Name** | Text | Yes | Full name (e.g., "Complete Blood Count") |
| **Code** | Text | Yes | Short code (e.g., "CBC"), unique |
| **LOINC Code** | Text | No | Panel LOINC (e.g., "58410-2") |
| **Description** | Textarea | No | Detailed description |
| **Panel Domain** | Select | Yes | CLINICAL / ENVIRONMENTAL / VECTOR. Default: CLINICAL. Controls where this panel appears at order entry. Selecting VECTOR reveals the Vector Config tab. |
| **Lab Units** | Multi-select | Yes | At least one required |
| **Sample Types** | Multi-select | No | Valid sample types for this panel |
| **Active** | Toggle | Yes | Status |

### Panel Domain Behavior

| Domain value | Appears at order entry for |
|---|---|
| CLINICAL | Clinical-domain orders only |
| ENVIRONMENTAL | Environmental-domain orders only |
| VECTOR | Vector-domain orders only |

Domain is resolved automatically from the lab unit assigned to the order — no domain picker is shown to the user. The panel ComboBox is pre-filtered to only show panels matching the resolved domain. Changing a panel's domain does **not** affect existing orders that already used it; the filter applies only at time of new order entry panel selection.

### Lab Units Section
- Checkbox grid of available lab units
- At least one required
- Determines where panel appears in order entry

### Sample Types Section
- Multi-select dropdown or checkbox list
- Optional but recommended
- Used for validation during order entry

---

## Tests Tab

### Layout
- Header with test count and action buttons
- Sortable test list with drag-and-drop
- Each test row shows order, name, code, panel LOINC, actions

### Test List Table

| Column | Width | Description |
|--------|-------|-------------|
| Drag Handle | 40px | Grip icon for drag-and-drop |
| Order | 60px | Editable number input |
| Test Name | flex | Test name (link to test) |
| Test Code | 100px | Monospace |
| Test LOINC | 100px | From test definition (read-only, gray) |
| Panel LOINC | 120px | Editable - panel-specific LOINC |
| Actions | 80px | Remove button |

### Ordering Behavior

**Drag-and-Drop:**
- Grab handle on left of each row
- Visual indicator during drag
- Auto-renumbers on drop

**Numeric Entry:**
- Direct edit of order number
- Tab to move between fields
- Auto-reorders list when focus leaves field
- Handles duplicates by shifting others

### Add Tests Modal

**Search/Filter:**
- Search input for test name/code
- Lab unit filter dropdown
- Sample type filter dropdown

**Test List:**
- Checkbox multi-select
- Shows tests not already in panel
- Each row: checkbox, name, code, LOINC, sample type

**On Add:**
- New tests added to end of list
- Order numbers assigned sequentially
- Panel LOINC defaults to empty (user must enter)

### Panel LOINC Entry
- Inline editable field
- Shows placeholder if empty: "Enter LOINC"
- Can differ from test's own LOINC code
- Used for panel-specific reporting

### Remove Test
- Click X button on row
- No confirmation needed (can re-add)
- List renumbers automatically

---

## Vector Config Tab

> **Conditional visibility:** This tab is only shown when Panel Domain = VECTOR. It is hidden for CLINICAL and ENVIRONMENTAL panels.

This tab lets coordinators attach vector-specific metadata to a panel, enabling smarter filtering and auto-suggestion at order entry for VECTOR-domain orders.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Organism Group** | ComboBox | No | Optional filter hint — e.g., MOSQUITO, TICK, RODENT. When set, this panel is suggested first at order entry when the CollectionLot's organism group matches. No hard constraint; any active VECTOR panel remains selectable. |

### Organism Group Behavior at Order Entry

When a VECTOR-domain order is being created and a CollectionLot is linked:
1. The panel ComboBox shows all active panels with domain = VECTOR
2. Panels whose `vectorOrganismGroup` matches the lot's organism group are sorted to the top and shown with a "Suggested for [group]" label
3. All other VECTOR panels remain selectable

This is a suggestion only — it does not hide or block selection of non-matching panels.

### Empty State

When Panel Domain is CLINICAL or ENVIRONMENTAL, this tab is hidden. If domain is later changed to VECTOR, any previously saved organism group value is restored.

---

## Import/Export

### Trigger
"Import/Export" button in list view toolbar opens modal.

### Export Tab

**Panel Selection:**
- Checkbox list of all panels
- "Select All" / "Deselect All" buttons
- Search/filter panels
- Shows panel name, code, test count

**Export Options:**
- Format: JSON (for import) or CSV (for review)
- Include: Panel config only, or Panel + test assignments

**Export Button:**
- Disabled if no panels selected
- Downloads file immediately

### Import Tab

**File Upload:**
- Drag-and-drop zone
- Accepts JSON files only
- Shows file name after selection

**Import Mode:**
- Create new panels only
- Update existing panels only
- Both (create and update)

**Validation Preview:**
After file selected, show:
- Panels to CREATE (new codes)
- Panels to UPDATE (existing codes)
- Panels to SKIP (errors)
- Warnings (e.g., unknown test codes)

**Import Button:**
- Disabled if file invalid
- Shows summary after import

### JSON Export Format

```json
{
  "exportDate": "2025-01-15T10:30:00Z",
  "exportedBy": "admin",
  "panels": [
    {
      "code": "CBC",
      "name": "Complete Blood Count",
      "loincCode": "58410-2",
      "description": "Standard complete blood count panel",
      "labUnits": ["Hematology"],
      "sampleTypes": ["Whole Blood EDTA"],
      "isActive": true,
      "tests": [
        {
          "testCode": "WBC",
          "displayOrder": 1,
          "panelLoincCode": "6690-2"
        },
        {
          "testCode": "RBC",
          "displayOrder": 2,
          "panelLoincCode": "789-8"
        },
        {
          "testCode": "HGB",
          "displayOrder": 3,
          "panelLoincCode": "718-7"
        }
      ]
    }
  ]
}
```

### CSV Export Format

For review purposes, flattened format:

| Panel Code | Panel Name | Panel LOINC | Test Order | Test Code | Test Name | Panel Test LOINC |
|------------|------------|-------------|------------|-----------|-----------|------------------|
| CBC | Complete Blood Count | 58410-2 | 1 | WBC | White Blood Cell Count | 6690-2 |
| CBC | Complete Blood Count | 58410-2 | 2 | RBC | Red Blood Cell Count | 789-8 |
| CBC | Complete Blood Count | 58410-2 | 3 | HGB | Hemoglobin | 718-7 |

---

## API Endpoints

### Panel CRUD
- `GET /api/panels` - List with filtering
- `GET /api/panels/{id}` - Get with tests
- `POST /api/panels` - Create
- `PUT /api/panels/{id}` - Update
- `DELETE /api/panels/{id}` - Soft delete (deactivate)

### Lab Units & Sample Types
- `GET /api/panels/{id}/lab-units`
- `PUT /api/panels/{id}/lab-units`
- `GET /api/panels/{id}/sample-types`
- `PUT /api/panels/{id}/sample-types`

### Tests
- `GET /api/panels/{id}/tests` - List tests with order and panel LOINC
- `POST /api/panels/{id}/tests` - Add tests
- `PUT /api/panels/{id}/tests` - Update all (order, panel LOINC)
- `PUT /api/panels/{id}/tests/{testId}` - Update single test
- `DELETE /api/panels/{id}/tests/{testId}` - Remove test
- `PUT /api/panels/{id}/tests/reorder` - Reorder tests

### Import/Export
- `POST /api/panels/export` - Export selected panels
  - Request: `{ panelIds: [1,2,3], format: "json"|"csv", includeTests: true }`
- `POST /api/panels/import/validate` - Validate import file
- `POST /api/panels/import` - Execute import
  - Request: `{ mode: "create"|"update"|"both", data: {...} }`

---

## Acceptance Criteria

### List View
- [ ] Panels displayed with test counts
- [ ] Lab unit filter works
- [ ] Status filter works
- [ ] Search by name/code works
- [ ] Quick summary shows panel details
- [ ] Duplicate action creates copy

### Basic Info Tab
- [ ] All fields editable
- [ ] LOINC code field available
- [ ] Lab unit multi-select (at least one required)
- [ ] Sample type multi-select works
- [ ] Status toggle works

### Tests Tab
- [ ] Tests displayed in order
- [ ] Drag-and-drop reordering works
- [ ] Order number editing works
- [ ] Auto-renumbering on reorder
- [ ] Panel LOINC editable per test
- [ ] Test LOINC shown (read-only)
- [ ] Add Tests modal filters correctly
- [ ] Remove test works

### Import/Export
- [ ] Export modal shows panel selection
- [ ] Select All / Deselect All work
- [ ] JSON export includes all data
- [ ] CSV export is flat format
- [ ] Import validates file
- [ ] Preview shows create/update/skip
- [ ] Import modes work correctly
- [ ] Import log created

---

## Navigation

**Menu Location:** Admin > Panel Setup

**Breadcrumb:** Admin > Panel Setup > [Panel Name]

---

## Related Features

- **Test Catalog (OGC-173)**: Tests can be part of multiple panels
- **Lab Units (OGC-189)**: Panels filtered by lab unit
- **Order Entry**: Panels appear based on lab unit and sample type
- **Methods (OGC-214)**: Methods can be assigned to panel tests
