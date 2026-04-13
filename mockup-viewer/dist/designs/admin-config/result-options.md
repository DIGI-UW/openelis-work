# Result Options Management Redesign

## Overview

Redesign of Result Options (select list values) management in OpenELIS Global. Result options are shared references used across multiple tests, with favorite sets enabling quick assignment of common option groups.

**Target Release:** OpenELIS Global v3.2 (Q1 2026)

---

## Problem Statement

Current result options management lacks:
- Easy way to reuse common option sets (Pos/Neg/Ind, blood types, etc.)
- Duplicate detection when creating new options
- Quick copy from existing test configurations
- Personal shortcuts for frequently used sets

---

## Solution

A unified Result Options management system with:
- Master list of all result options (standalone admin page)
- Favorite sets (global and personal) for quick assignment
- Copy from test functionality
- Duplicate detection with fuzzy matching
- Integration with Test Editor Results tab

---

## Data Model

```sql
-- Result Option (shared reference)
CREATE TABLE result_option (
    id SERIAL PRIMARY KEY,
    display_value VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    concept_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP,
    created_by INTEGER REFERENCES system_user(id)
);

-- Result Option Dictionary Mapping
CREATE TABLE result_option_dictionary_mapping (
    id SERIAL PRIMARY KEY,
    result_option_id INTEGER NOT NULL REFERENCES result_option(id),
    dictionary_type VARCHAR(50) NOT NULL,  -- SNOMED, LOINC, HL7, etc.
    dictionary_code VARCHAR(100) NOT NULL,
    dictionary_display VARCHAR(200),
    is_primary BOOLEAN DEFAULT FALSE,
    UNIQUE (result_option_id, dictionary_type, dictionary_code)
);

-- Test Result Option Assignment (existing, showing structure)
CREATE TABLE test_result_option (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    result_option_id INTEGER NOT NULL REFERENCES result_option(id),
    display_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE (test_id, result_option_id)
);

-- Favorite Set (collection of result options)
CREATE TABLE result_option_favorite_set (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_global BOOLEAN DEFAULT FALSE,
    owner_id INTEGER REFERENCES system_user(id),  -- NULL if global
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP,
    created_by INTEGER REFERENCES system_user(id)
);

-- Favorite Set Items
CREATE TABLE result_option_favorite_set_item (
    id SERIAL PRIMARY KEY,
    favorite_set_id INTEGER NOT NULL REFERENCES result_option_favorite_set(id),
    result_option_id INTEGER NOT NULL REFERENCES result_option(id),
    display_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE (favorite_set_id, result_option_id)
);
```

---

## Result Options Admin Page

### Layout
- Full-width table with sortable columns
- Toolbar with filters and actions
- Pagination footer

### Toolbar
- "Add Result Option" button (primary)
- Search input (display value/code)
- Status filter (All, Active, Inactive)
- Result options count display

### Table Columns

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| Display Value | flex | Yes | The value shown to users |
| Code | 100px | Yes | Short code (monospace) |
| Concept ID | 120px | Yes | Internal concept identifier |
| Dictionaries | 200px | No | Badges for mapped dictionaries (SNOMED, LOINC, etc.) |
| Used By | 80px | Yes | Number of tests using this option |
| Status | 100px | No | Active/Inactive badge |
| Actions | 80px | No | Edit button, More menu |

### Sorting Behavior
- Click column header to sort ascending
- Click again to toggle to descending
- Default sort: Display Value ascending

### Row Actions
- Edit: Open result option editor modal
- View Tests: Show list of tests using this option
- Deactivate/Activate: Toggle status
- Delete: Only if not used by any test

---

## Add/Edit Result Option Modal

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Display Value** | Text | Yes | Value shown in dropdowns (e.g., "Positive") |
| **Code** | Text | Yes | Short code (e.g., "POS"), unique |
| **Concept ID** | Text | No | Internal concept identifier |
| **Active** | Toggle | Yes | Status |

### Dictionary Mappings Section
Table of mappings with:
- Dictionary Type dropdown (SNOMED-CT, LOINC Answer, HL7, Custom)
- Dictionary Code input
- Dictionary Display input
- Primary toggle (one per dictionary type)
- Add/Remove buttons

### Duplicate Detection

When user enters Display Value or Code:

1. **Real-time check** as user types (debounced)
2. **Exact match**: Block save, show existing option
3. **Fuzzy match**: Show warning with similar options
4. **Inactive match**: Offer to reactivate instead of creating new

#### Duplicate Warning UI

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âš ï¸  Similar result options already exist                    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                             â”‚
â”‚  We found options that may be duplicates:                   â”‚
â”‚                                                             â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚ â—‹  "Positive" (POS) - Active - Used by 47 tests     â”‚   â”‚
â”‚  â”‚     â†’ 98% match to your entry "POSITIVE"            â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚ â—‹  "Pos" (P) - Inactive                              â”‚   â”‚
â”‚  â”‚     â†’ 75% match to your entry "POSITIVE"            â”‚   â”‚
â”‚  â”‚     [Reactivate this option]                         â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                                             â”‚
â”‚  â–¡ I confirm this is a new, distinct concept               â”‚
â”‚                                                             â”‚
â”‚  [Cancel]                              [Create Anyway]      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### Matching Rules
- **Exact match**: Same display value (case-insensitive) or same code
- **Fuzzy match**: Levenshtein distance â‰¤ 2, or contains match, or common abbreviations
- **Common abbreviations**: POS/Positive, NEG/Negative, IND/Indeterminate, etc.

---

## Favorite Sets Management

### Access
- Tab or section within Result Options admin page
- Also accessible from Test Editor when assigning result options

### Layout
Two sections:
1. **Global Favorites** - Available to all users
2. **My Favorites** - Personal to current user

### Favorite Set List

Each row shows:
- Set name
- Description (truncated)
- Option count
- Options preview (first 3 values, then "+X more")
- Actions: Edit, Duplicate, Delete

### Create/Edit Favorite Set Modal

#### Fields

| Field | Type | Required | Scope |
|-------|------|----------|-------|
| **Name** | Text | Yes | e.g., "Qualitative Standard" |
| **Description** | Textarea | No | e.g., "Standard Pos/Neg/Ind for qualitative tests" |
| **Global** | Toggle | No | Admin only - makes visible to all users |

#### Result Options Section
- Search/filter to find options
- Add button to include option
- Drag-and-drop or numeric ordering
- Remove button per option

#### Quick Actions
- "Add from existing test" - Opens test picker, imports that test's options
- "Add all selected" - Bulk add from search results

---

## Test Editor Integration

### Location
Results Tab â†’ Select List section (when result type is Select List)

### Current Options Table

| Column | Width | Description |
|--------|-------|-------------|
| Drag Handle | 40px | Reorder |
| Order | 60px | Editable number |
| Display Value | flex | Option display value |
| Code | 100px | Option code |
| Actions | 80px | Remove button |

### Toolbar Actions

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Result Options                                            3 options â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ [+ Add Options â–¼]  [Copy from Test]  [Save as Favorite]           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### Add Options Dropdown Menu

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ â˜… GLOBAL FAVORITES              â”‚
â”‚   â”œâ”€ Qualitative Standard       â”‚
â”‚   â”œâ”€ Blood Type ABO             â”‚
â”‚   â””â”€ Reactive/Non-Reactive      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ â˜† MY FAVORITES                  â”‚
â”‚   â”œâ”€ HIV Results                â”‚
â”‚   â””â”€ Gram Stain Results         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ ðŸ” Search All Options...        â”‚
â”‚ + Create New Option...          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Copy from Test Modal

1. **Test Search**
   - Search by test name or code
   - Filter by lab unit
   - Show test's current result options in preview

2. **Preview & Confirm**
   - Show options that will be copied
   - Option to adjust order before applying
   - Warning if any options already assigned to current test

3. **Apply**
   - Adds references to same result options
   - Preserves order from source test
   - Skips duplicates (already assigned)

### Save as Favorite Modal

When user clicks "Save as Favorite":
- Name input (required)
- Description input (optional)
- Global toggle (admin only)
- Preview of options to be saved
- Save button

---

## Search All Options Modal

### Layout
- Search input with real-time filtering
- Filter by status (All, Active, Inactive)
- Multi-select checkbox list
- Selected count display
- Add Selected button

### Option List Columns
- Checkbox
- Display Value
- Code
- Status badge
- Used by X tests

### Behavior
- Checkboxes for multi-select
- Options already assigned to test are disabled with "Already added" note
- "Add Selected" adds all checked options to test
- New options added to end of list

---

## API Endpoints

### Result Options CRUD

```
GET    /api/result-options
       Query: search, status, usedByTestId, limit, offset
       
GET    /api/result-options/{id}

POST   /api/result-options
       Body: { displayValue, code, conceptId, isActive, dictionaryMappings[] }
       Response: { id, ...fields, duplicateWarnings[] }

PUT    /api/result-options/{id}
       Body: { displayValue, code, conceptId, isActive, dictionaryMappings[] }

DELETE /api/result-options/{id}
       (Only if usedByCount = 0)

POST   /api/result-options/check-duplicates
       Body: { displayValue, code }
       Response: { exactMatches[], fuzzyMatches[], inactiveMatches[] }
```

### Favorite Sets

```
GET    /api/result-option-favorite-sets
       Query: includeGlobal=true, includePersonal=true
       
GET    /api/result-option-favorite-sets/{id}

POST   /api/result-option-favorite-sets
       Body: { name, description, isGlobal, items[{ resultOptionId, displayOrder }] }

PUT    /api/result-option-favorite-sets/{id}

DELETE /api/result-option-favorite-sets/{id}
```

### Test Result Options

```
GET    /api/tests/{testId}/result-options

POST   /api/tests/{testId}/result-options
       Body: { resultOptionId, displayOrder }

PUT    /api/tests/{testId}/result-options/{resultOptionId}
       Body: { displayOrder }

DELETE /api/tests/{testId}/result-options/{resultOptionId}

POST   /api/tests/{testId}/result-options/bulk
       Body: { items[{ resultOptionId, displayOrder }] }

POST   /api/tests/{testId}/result-options/copy-from/{sourceTestId}

PUT    /api/tests/{testId}/result-options/reorder
       Body: { orderedIds[] }
```

---

## Acceptance Criteria

### Result Options Admin Page
- [ ] Table displays all result options with sorting and pagination
- [ ] Search filters by display value and code
- [ ] Status filter works correctly
- [ ] Can create new result option with duplicate checking
- [ ] Can edit existing result option
- [ ] Can deactivate/activate result option
- [ ] Can only delete options not used by any test
- [ ] Shows count of tests using each option

### Duplicate Detection
- [ ] Real-time checking as user types
- [ ] Exact match blocks creation
- [ ] Fuzzy match shows warning with similar options
- [ ] Inactive matches offer reactivation option
- [ ] User must confirm to create despite warnings
- [ ] Case-insensitive matching

### Favorite Sets
- [ ] Can create global favorite sets (admin only)
- [ ] Can create personal favorite sets
- [ ] Can edit favorite set name, description, options
- [ ] Can reorder options within set
- [ ] Can delete favorite sets
- [ ] Global favorites visible to all users
- [ ] Personal favorites only visible to owner

### Test Editor Integration
- [ ] Shows current result options with order
- [ ] Can add from global favorites dropdown
- [ ] Can add from personal favorites dropdown
- [ ] Can search and add individual options
- [ ] Can copy options from another test
- [ ] Can save current options as favorite set
- [ ] Can reorder via drag-and-drop or number input
- [ ] Can remove options

---

## Navigation

**Admin Menu Path:**
Administration â†’ Test Management â†’ Result Options

**Test Editor Path:**
Test Catalog â†’ [Select Test] â†’ Edit â†’ Results Tab â†’ Select List Options

---

## Permissions

| Action | Required Permission |
|--------|-------------------|
| View result options | `RESULT_OPTIONS_VIEW` |
| Create/edit result options | `RESULT_OPTIONS_EDIT` |
| Delete result options | `RESULT_OPTIONS_DELETE` |
| Manage global favorites | `RESULT_OPTIONS_ADMIN` |
| Manage personal favorites | `RESULT_OPTIONS_VIEW` |
| Assign options to tests | `TEST_CATALOG_EDIT` |
