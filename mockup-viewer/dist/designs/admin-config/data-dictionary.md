# Data Dictionary Management Redesign

## Overview

Complete redesign of the Dictionary Menu (Data Dictionary) in OpenELIS Global. The data dictionary contains all coded values used throughout the system - rejection reasons, pathology diagnoses, stains, organisms, specimen adequacy indicators, and many more category-specific option lists.

**Target Release:** OpenELIS Global v3.2 (Q1 2026)

---

## Problem Statement

Current dictionary management has critical usability issues:
- Flat list of 700+ entries with no category filtering on the main view
- Hard to find entries within a specific category
- No import/export capability for bulk management
- No visibility into where entries are used
- Cannot easily add new categories for custom forms
- No duplicate detection when adding entries

---

## Solution

A redesigned Data Dictionary interface with:
- Category sidebar for quick filtering
- Dashboard view showing category counts
- Import/export by category or entire dictionary
- Category management (create, edit, deactivate)
- Usage tracking (used in X tests/records)
- Duplicate detection with fuzzy matching
- Hierarchical entries (parent/child relationships)

---

## Data Model

```sql
-- Dictionary Category
CREATE TABLE dictionary_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    parent_category_id INTEGER REFERENCES dictionary_category(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP,
    created_by INTEGER REFERENCES system_user(id)
);

CREATE INDEX idx_dict_cat_code ON dictionary_category(code);
CREATE INDEX idx_dict_cat_parent ON dictionary_category(parent_category_id);

-- Dictionary Entry (enhanced from existing)
CREATE TABLE dictionary_entry (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES dictionary_category(id),
    display_value VARCHAR(500) NOT NULL,
    code VARCHAR(100),
    local_abbreviation VARCHAR(100),
    loinc_code VARCHAR(50),
    snomed_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    parent_entry_id INTEGER REFERENCES dictionary_entry(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP,
    created_by INTEGER REFERENCES system_user(id),
    UNIQUE (category_id, code)
);

CREATE INDEX idx_dict_entry_category ON dictionary_entry(category_id);
CREATE INDEX idx_dict_entry_parent ON dictionary_entry(parent_entry_id);
CREATE INDEX idx_dict_entry_active ON dictionary_entry(is_active);

-- Dictionary Usage Tracking (materialized view or table)
CREATE MATERIALIZED VIEW dictionary_usage AS
SELECT 
    de.id AS entry_id,
    COUNT(DISTINCT t.id) AS test_count,
    COUNT(DISTINCT r.id) AS result_count
FROM dictionary_entry de
LEFT JOIN test_dictionary td ON de.id = td.dictionary_entry_id
LEFT JOIN test t ON td.test_id = t.id
LEFT JOIN result r ON de.id = r.dictionary_entry_id
GROUP BY de.id;

-- Dictionary Import Log
CREATE TABLE dictionary_import_log (
    id SERIAL PRIMARY KEY,
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    imported_by INTEGER REFERENCES system_user(id),
    file_name VARCHAR(255),
    category_id INTEGER REFERENCES dictionary_category(id),
    entries_created INTEGER DEFAULT 0,
    entries_updated INTEGER DEFAULT 0,
    entries_skipped INTEGER DEFAULT 0,
    errors TEXT,
    import_data JSONB
);
```

---

## Page Layout

### Structure
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Header: Data Dictionary                              [Import] [Export]  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                    â”‚                                                    â”‚
â”‚  Category Sidebar  â”‚  Main Content Area                                â”‚
â”‚                    â”‚  (Table with entries for selected category)        â”‚
â”‚  - Search          â”‚                                                    â”‚
â”‚  - Category List   â”‚  Toolbar: [Add Entry] Search | Status Filter      â”‚
â”‚    with counts     â”‚                                                    â”‚
â”‚                    â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  [+ Add Category]  â”‚  â”‚ Entry Table with sorting/pagination          â”‚  â”‚
â”‚                    â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                    â”‚                                                    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Category Sidebar

### Layout
- Fixed width (280px)
- Scrollable list
- Sticky header with search

### Header
- "Categories" title
- Search input to filter categories
- "+ Add Category" button at bottom

### Category List Item
Each category shows:
- Category name
- Entry count badge
- Active/Inactive indicator (if inactive)
- Expand/collapse for subcategories (if hierarchical)

### Selection Behavior
- Click category to filter main table
- "All Categories" option at top shows everything
- Selected category highlighted
- Badge updates when entries added/removed

### Example Categories
```
All Categories (744)
â”œâ”€ Clinical General (89)
â”œâ”€ Rejection Reasons (24)
â”œâ”€ Sample Sources (45)
â”œâ”€ Organisms (156)
â”‚  â”œâ”€ Bacteria (98)
â”‚  â”œâ”€ Viruses (32)
â”‚  â””â”€ Parasites (26)
â”œâ”€ Pathology - Conclusions (18)
â”œâ”€ Pathology - Pathologist Requests (12)
â”œâ”€ IHC Breast Cancer Report Intensity (6)
â”œâ”€ IHC Breast Cancer Report CerbB2 Pattern (5)
â”œâ”€ IHC Breast Cancer Report Molecular Subtype (4)
â”œâ”€ Cytology Specimen Adequacy - Satisfactory (8)
â”œâ”€ Stains (34)
â””â”€ ... more categories
```

---

## Main Content Area

### Toolbar
- "Add Entry" button (primary) - only when category selected
- Search input (filter within selected category)
- Status filter dropdown (All, Active, Inactive)
- Entry count display

### Entries Table

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| Display Value | flex | Yes | The dictionary entry text |
| Code | 100px | Yes | Short code (if any) |
| Local Abbr | 100px | Yes | Local abbreviation |
| LOINC | 100px | Yes | LOINC code mapping |
| SNOMED | 100px | Yes | SNOMED code mapping |
| Used In | 80px | Yes | Test/usage count |
| Status | 80px | No | Active/Inactive badge |
| Actions | 80px | No | Edit, More menu |

### Row Behavior
- Click row to open edit modal
- Inactive entries shown with gray background
- "Used In" shows count, clickable to see details

### Pagination
- Page size: 25, 50, 100
- Standard navigation controls

### Empty States
- No category selected: "Select a category from the sidebar to view entries"
- No entries in category: "No entries in this category. Add the first entry."
- No search results: "No entries match your search"

---

## Add/Edit Category Modal

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Category Name | Text | Yes | Full name (e.g., "Pathology - Conclusions") |
| Code | Text | Yes | Short code (e.g., "PATH-CONC"), unique |
| Description | Textarea | No | Purpose of this category |
| Parent Category | Dropdown | No | For hierarchical organization |
| Display Order | Number | No | Sort order in sidebar |
| Active | Toggle | Yes | Status |

### Validation
- Name and code required
- Code must be unique
- Cannot deactivate if entries are in use

---

## Add/Edit Entry Modal

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Category | Dropdown | Yes | Which category (pre-filled if adding from filtered view) |
| Display Value | Text | Yes | The entry text shown to users |
| Code | Text | No | Short code |
| Local Abbreviation | Text | No | Localized short form |
| LOINC Code | Text | No | LOINC mapping |
| SNOMED Code | Text | No | SNOMED-CT mapping |
| Parent Entry | Dropdown | No | For hierarchical entries within category |
| Display Order | Number | No | Sort order within category |
| Active | Toggle | Yes | Status |

### Duplicate Detection

When user enters Display Value or Code:

1. **Real-time check** within same category
2. **Exact match**: Block save, show existing entry
3. **Fuzzy match**: Warning with similar entries
4. **Cross-category match**: Info note (same value exists in other category)

#### Duplicate Warning UI
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âš ï¸  Similar entries found in this category                      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                 â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚ "INFLUENZA A DETECTED" - Active                         â”‚   â”‚
â”‚  â”‚     â†’ 92% match to "INFLUENZA VIRUS A DETECTED"         â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                                                 â”‚
â”‚  â–¡ I confirm this is a distinct entry                          â”‚
â”‚                                                                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Import/Export

### Export Options

#### Trigger
- "Export" button in header
- Also available from category context menu

#### Export Modal

**Scope Selection:**
- â—‹ All Categories (744 entries)
- â—‹ Selected Category: [Dropdown] (X entries)
- â—‹ Multiple Categories: [Multi-select]

**Format:**
- â—‹ CSV (spreadsheet compatible)
- â—‹ JSON (for reimport or API use)

**Options:**
- â–¡ Include inactive entries
- â–¡ Include usage statistics

**Preview:**
Shows first 5 rows of export data

#### CSV Format
```csv
category_code,category_name,entry_code,display_value,local_abbreviation,loinc_code,snomed_code,is_active,display_order
CG,Clinical General,INFL-A-DET,"INFLUENZA VIRUS A RNA DETECTED",,,,Y,1
CG,Clinical General,INFL-A-H1,"INFLUENZA VIRUS A/H1 RNA DETECTED",,,,Y,2
```

#### JSON Format
```json
{
  "exportDate": "2025-12-14T22:15:00Z",
  "categories": [
    {
      "code": "CG",
      "name": "Clinical General",
      "entries": [
        {
          "code": "INFL-A-DET",
          "displayValue": "INFLUENZA VIRUS A RNA DETECTED",
          "localAbbreviation": null,
          "loincCode": null,
          "snomedCode": null,
          "isActive": true,
          "displayOrder": 1
        }
      ]
    }
  ]
}
```

### Import Options

#### Trigger
- "Import" button in header

#### Import Modal - Step 1: Upload

**File Selection:**
- Drag-and-drop zone
- Browse button
- Accepts: .csv, .json

**Import Mode:**
- â—‹ Add new entries only (skip existing)
- â—‹ Update existing entries (match by code)
- â—‹ Add and update (recommended)

#### Import Modal - Step 2: Preview & Validate

**Validation Results:**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ“„ organisms.csv                                     45 entries â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                 â”‚
â”‚  âœ“ 38 new entries to add                                       â”‚
â”‚  âœ“ 5 existing entries to update                                â”‚
â”‚  âš  2 entries with warnings                                     â”‚
â”‚    - "E. coli" similar to existing "Escherichia coli"          â”‚
â”‚    - "Staph aureus" similar to existing "Staphylococcus aureus"â”‚
â”‚                                                                 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Preview:                                                        â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚ â”‚ Category      â”‚ Entry                    â”‚ Status         â”‚  â”‚
â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚ â”‚ Organisms     â”‚ Klebsiella pneumoniae    â”‚ âœ“ New          â”‚  â”‚
â”‚ â”‚ Organisms     â”‚ Pseudomonas aeruginosa   â”‚ âœ“ New          â”‚  â”‚
â”‚ â”‚ Organisms     â”‚ Escherichia coli         â”‚ âŸ³ Update       â”‚  â”‚
â”‚ â”‚ Organisms     â”‚ E. coli                  â”‚ âš  Duplicate?   â”‚  â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                                 â”‚
â”‚  â–¡ Skip entries with warnings                                  â”‚
â”‚  â–¡ Create new category if not exists                           â”‚
â”‚                                                                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### Import Modal - Step 3: Results

**Success Summary:**
```
Import Complete

âœ“ 38 entries created
âœ“ 5 entries updated  
âŠ˜ 2 entries skipped (duplicates)

[View Import Log]  [Done]
```

---

## Usage Details Modal

When user clicks "Used In" count:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Usage: "INFLUENZA VIRUS A RNA DETECTED"                    âœ•    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                 â”‚
â”‚  Used in 3 tests:                                              â”‚
â”‚                                                                 â”‚
â”‚  â€¢ Influenza A PCR (INFL-A-PCR)                               â”‚
â”‚  â€¢ Respiratory Panel (RESP-PANEL)                              â”‚
â”‚  â€¢ Viral Panel (VIRAL-PNL)                                     â”‚
â”‚                                                                 â”‚
â”‚  Found in 247 results (last 12 months)                         â”‚
â”‚                                                                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## API Endpoints

### Categories

```
GET    /api/dictionary-categories
       Query: search, includeInactive, parentId

GET    /api/dictionary-categories/{id}

POST   /api/dictionary-categories
       Body: { name, code, description, parentCategoryId, displayOrder, isActive }

PUT    /api/dictionary-categories/{id}

DELETE /api/dictionary-categories/{id}
       (Only if no entries or all entries inactive/unused)
```

### Entries

```
GET    /api/dictionary-entries
       Query: categoryId, search, status, limit, offset

GET    /api/dictionary-entries/{id}

POST   /api/dictionary-entries
       Body: { categoryId, displayValue, code, localAbbreviation, loincCode, snomedCode, parentEntryId, displayOrder, isActive }

PUT    /api/dictionary-entries/{id}

DELETE /api/dictionary-entries/{id}
       (Only if not used)

GET    /api/dictionary-entries/{id}/usage
       Returns: { testCount, resultCount, tests[] }

POST   /api/dictionary-entries/check-duplicates
       Body: { categoryId, displayValue, code }
       Response: { exactMatches[], fuzzyMatches[], crossCategoryMatches[] }
```

### Import/Export

```
GET    /api/dictionary/export
       Query: categoryIds[], format (csv|json), includeInactive

POST   /api/dictionary/import
       Body: multipart form with file
       Query: mode (add|update|both), skipWarnings, createCategories

GET    /api/dictionary/import-logs
       Query: limit, offset

GET    /api/dictionary/import-logs/{id}
```

---

## Acceptance Criteria

### Category Sidebar
- [ ] Shows all categories with entry counts
- [ ] Search filters category list
- [ ] Click category filters main table
- [ ] "All Categories" shows all entries
- [ ] Can create new category
- [ ] Can edit category
- [ ] Hierarchical categories expand/collapse

### Entries Table
- [ ] Displays entries for selected category
- [ ] Sortable columns
- [ ] Search within category
- [ ] Status filter works
- [ ] Pagination with configurable page size
- [ ] Shows usage count per entry
- [ ] Click row opens edit modal

### Add/Edit Entry
- [ ] All fields editable
- [ ] Category pre-selected when adding from filtered view
- [ ] Duplicate detection with fuzzy matching
- [ ] Cross-category duplicate info shown
- [ ] Confirmation required for similar entries
- [ ] Parent entry dropdown for hierarchy

### Import/Export
- [ ] Export all or by category
- [ ] CSV and JSON formats
- [ ] Import validates before processing
- [ ] Shows preview with validation results
- [ ] Handles duplicates per import mode
- [ ] Creates import log
- [ ] Option to create new categories on import

### Usage Tracking
- [ ] Shows test count per entry
- [ ] Click opens usage details modal
- [ ] Cannot delete entries in use

---

## Navigation

**Admin Menu Path:**
Administration â†’ Dictionary Menu

**Or:**
Administration â†’ General Configurations â†’ Dictionary Menu

---

## Permissions

| Action | Required Permission |
|--------|-------------------|
| View dictionary | `DICTIONARY_VIEW` |
| Create/edit entries | `DICTIONARY_EDIT` |
| Create/edit categories | `DICTIONARY_ADMIN` |
| Import dictionary | `DICTIONARY_IMPORT` |
| Export dictionary | `DICTIONARY_VIEW` |
| Delete entries | `DICTIONARY_DELETE` |

---

## Migration Notes

### From Existing System
1. Map existing "Dictionary Category" dropdown values to new category table
2. Migrate all dictionary entries with category relationships
3. Preserve dictionary numbers (if used for integrations)
4. Calculate initial usage counts

### Backward Compatibility
- Existing API endpoints should continue to work
- Dictionary numbers remain stable
- No breaking changes to result storage
