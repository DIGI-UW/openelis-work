# Results Page Redesign - Requirements Specification

## Overview

Redesign of the Results Entry page to consolidate growing functionality, add interpretation workflow, surface QA/QC metadata, and unify search across multiple entry points.

## Current Pain Points

| Issue | Description |
|-------|-------------|
| **Fragmented Search** | Separate pages for searching by lab number, lab unit, patient, test/date/status |
| **Cluttered Interface** | Options added piecemeal have accumulated in expandable rows |
| **Missing Interpretations** | No way to select/enter clinical interpretations for results |
| **Hidden QA/QC Data** | Control results and flags not visible during result entry |
| **Program Context Missing** | EQA due dates and program metadata not displayed |

---

## Design Goals

1. **Unified Search** - Single search interface with smart parsing and filters
2. **Streamlined Primary View** - Keep familiar row-based worklist, declutter
3. **Interpretation Workflow** - Suggestions from test catalog + free text
4. **QA/QC Visibility** - Surface control status and flags prominently
5. **Program Context** - Display EQA, PT, and program metadata when relevant
6. **Deprioritize Infrequent Actions** - Referrals tucked away in tab

---

## Start State / Page Load Behavior

### Initial Page Load

When the Results Entry page first loads, **no results are displayed**. The page shows an empty state with clear instructions for the user to begin searching.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                                                             â”‚
â”‚                         ðŸ”                                                  â”‚
â”‚                                                                             â”‚
â”‚               Search for results to begin                                   â”‚
â”‚                                                                             â”‚
â”‚     Enter a lab number, patient name, or patient ID in the search box      â”‚
â”‚     above, or select a Lab Unit to view pending results.                   â”‚
â”‚                                                                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Rationale for Empty Start State

| Reason | Description |
|--------|-------------|
| **Performance** | Loading all pending results across all lab units on page load would be slow and resource-intensive |
| **User Intent** | Technicians typically arrive with a specific sample or patient in mind |
| **Reduced Noise** | Prevents information overload from displaying thousands of pending results |
| **Clear Action Path** | Empty state with instructions guides user to take explicit action |

### Triggering Results Load

Results are loaded when the user performs one of the following actions:

| Action | Behavior |
|--------|----------|
| **Search Query** | Enter text in search bar and press Enter or click Search |
| **Select Lab Unit** | Choose a lab unit from the dropdown filter |
| **Apply Advanced Filters** | Click "Apply Filters" in the advanced filter panel |

### Default Filter Values on Load

| Filter | Default Value | Notes |
|--------|---------------|-------|
| **Lab Unit** | None (blank) | Must be selected to load results |
| **Status** | Pending | Pre-selected but not applied until search/filter action |
| **Lab Number Range** | None | Empty fields |
| **Order Date Range** | None | Empty fields |
| **Tests / Panels** | All | No specific tests selected |

### Loading State

When results are being fetched:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                                                             â”‚
â”‚                         â—Œ Loading...                                        â”‚
â”‚                                                                             â”‚
â”‚               Fetching results for Hematology...                            â”‚
â”‚                                                                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### No Results Found State

When a search or filter returns zero results:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                                                             â”‚
â”‚                         ðŸ“‹                                                  â”‚
â”‚                                                                             â”‚
â”‚               No results found                                              â”‚
â”‚                                                                             â”‚
â”‚     No pending results match your search criteria.                          â”‚
â”‚     Try adjusting your filters or search terms.                             â”‚
â”‚                                                                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Persisting User Context

| Context | Persistence | Notes |
|---------|-------------|-------|
| **Lab Unit Selection** | Session | Persists until browser tab closed or user changes |
| **Search Query** | None | Cleared on page refresh |
| **Advanced Filters** | None | Reset to defaults on page refresh |
| **Expanded Row** | None | All rows collapse on page refresh |

### URL Parameters (Future Enhancement)

Support deep-linking with URL parameters to pre-populate search:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `labNumber` | `?labNumber=DEV01250000000001` | Pre-fill search with lab number |
| `patientId` | `?patientId=3456789` | Pre-fill search with patient ID |
| `labUnit` | `?labUnit=hematology` | Pre-select lab unit filter |
| `status` | `?status=pending` | Pre-select status filter |

This allows linking directly from other pages (e.g., Order Entry, Patient Chart) to the Results page with context pre-filled.

---

## Unified Search & Filters

### Smart Search Bar

Single search input that intelligently parses:
- **Lab Number** (also called Order Number) - e.g., `DEV01250000000000`
- **Patient Name** - e.g., `Smith, Jane` or `Jane Smith`
- **Patient ID** - e.g., `3456789`
- **Accession Number** - e.g., `001-1`

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ” Search by lab number, patient name/ID, or accession...                   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Quick Filters (Always Visible)

| Filter | Options | Default |
|--------|---------|---------|
| **Lab Unit** | Chemistry, Hematology, Microbiology, Serology, etc. | None (blank) |

**Note:** Lab Unit must be selected before results load. This prevents loading all results across all units and improves performance.

### Advanced Filters (Expandable Panel)

Toggle via "Advanced" button. Panel expands below quick filters.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ LAB NUMBER / RANGE                      ORDER DATE RANGE                    â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” to â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â” to â”Œâ”€â”€â”€â”€â”€â”€â”               â”‚
â”‚ â”‚ From...        â”‚    â”‚ To (optional)â”‚  â”‚      â”‚    â”‚      â”‚               â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”˜               â”‚
â”‚ Enter single lab number or range                                            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ TESTS / PANELS                          STATUS                              â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                      â”‚
â”‚ â”‚ [CBC Ã—] [WBC Ã—] Add...              â”‚ â”‚ Pending â–¾ â”‚                      â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                      â”‚
â”‚ Select multiple tests or panels                                             â”‚
â”‚                                                                             â”‚
â”‚                              [Clear All Filters]    [Apply Filters]         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Filter | Type | Default | Description |
|--------|------|---------|-------------|
| **Lab Number / Range** | Text (from/to) | None | Single lab number or range of lab numbers |
| **Order Date Range** | Date range (from/to) | None | Filter by order date range |
| **Tests / Panels** | Multi-select with search | All | Combined filter for tests and panels |
| **Status** | Dropdown | **Pending** | Filter by result status |

### Lab Number / Range Filter

Allows filtering by a single lab number or a range:

- **Single lab number**: Enter in "From" field only, leave "To" blank
- **Range**: Enter start in "From" and end in "To"
- Supports partial matching for convenience

```
Examples:
- Single:  From: DEV01250000000001  To: (blank)
- Range:   From: DEV01250000000001  To: DEV01250000000099
```

### Tests / Panels Multi-Select

Combined field that allows selection of multiple tests and/or panels:

- Type to search available tests and panels
- Panels shown in grouped section at top of dropdown
- Individual tests shown below panels
- Selected items appear as removable chips
- Selecting a panel includes all tests in that panel
- Can mix panel and individual test selections

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Search tests or panels...       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ PANELS                          â”‚
â”‚   Complete Blood Count (CBC)    â”‚
â”‚   Basic Metabolic Panel         â”‚
â”‚   Comprehensive Metabolic Panel â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ TESTS                           â”‚
â”‚   WBC                           â”‚
â”‚   RBC                           â”‚
â”‚   Hemoglobin                    â”‚
â”‚   Glucose                       â”‚
â”‚   Creatinine                    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Status Filter Options

| Value | Description |
|-------|-------------|
| Pending | Results awaiting entry (default) |
| All Status | Show all results regardless of status |
| Entered | Results entered but not validated |
| Awaiting Validation | Results waiting for supervisor review |
| Released | Results released to patient/provider |
| Cancelled | Cancelled results |

### Active Filter Display

Show active filters as removable chips:
```
Showing: [Status: Pending Ã—]  â€¢  127 results
```


## Results Table

### Column Layout

| Column | Width | Content |
|--------|-------|---------|
| **Expand/QC** | 60px | Chevron + QC status dot |
| **Sample/Patient** | 180px | Lab number, patient ID, sex, age (name hidden until expanded) |
| **Test** | 180px | Test name, sample type, program badge |
| **Analyzer** | 100px | Analyzer name with icon |
| **Range** | 100px | Normal range + unit |
| **Result** | 180px | Input field (numeric or select list) |
| **Status** | 80px | Status badge |
| **Flags** | 80px | Flag icons |
| **Actions** | 80px | Accept + Note button |

### Patient Privacy

In collapsed row view:
- Patient **name is hidden** - only shown when row is expanded
- Shows patient ID, sex, and **age** (calculated from DOB)
- Full patient details (name, DOB) displayed in expanded patient info banner

### Result Row States

| Status | Visual Treatment |
|--------|------------------|
| **Pending** | Default styling, awaiting result entry |
| **Entered** | Blue status badge, result entered but not validated |
| **Awaiting Validation** | Amber status badge, waiting for supervisor review |
| **Released** | Green status badge, result released to patient/provider |
| **Cancelled** | Gray status badge with strikethrough styling |

### Status Workflow

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”     Enter      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”    Validate   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Pending â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€>â”‚ Entered â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€>â”‚ Awaiting         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜               â”‚ Validation       â”‚
     â”‚                          â”‚                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     â”‚                          â”‚                             â”‚
     â”‚         Cancel           â”‚         Cancel              â”‚ Approve
     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”           â”‚
                                                  â–¼           â–¼
                                            â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                            â”‚ Cancelled â”‚ â”‚ Released â”‚
                                            â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Transition | Description |
|------------|-------------|
| Pending â†’ Entered | Result value entered |
| Entered â†’ Awaiting Validation | Tech submits for review (if validation required) |
| Entered â†’ Released | Direct release (if no validation required) |
| Awaiting Validation â†’ Released | Supervisor approves result |
| Any â†’ Cancelled | Result cancelled (e.g., wrong test, sample issue) |

### Additional Visual States

| State | Visual Treatment |
|-------|------------------|
| **Flagged** | Orange/red input border, flag icons |
| **Expanded** | Teal background highlight |

### QC Status Indicator

Small colored dot next to expand chevron:
- ðŸŸ¢ Green = QC Passed
- ðŸŸ¡ Yellow = QC Warning
- ðŸ”´ Red = QC Failed
- âšª Gray = No QC Data

### Flag Icons

| Flag | Icon | Color |
|------|------|-------|
| Above Normal | â†— TrendingUp | Orange |
| Below Normal | â†˜ TrendingDown | Yellow |
| Delta Check | âš  AlertTriangle | Red |
| Reagent Expiring | ðŸ§ª FlaskConical | Amber |
| Control Failed | âš  AlertCircle | Red |

---

## Expanded Detail Panel

When a row is expanded, show a tabbed interface with contextual information.

### Patient Info Banner

Displayed at the top of expanded panel, showing full patient details (hidden in collapsed view for privacy):

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ PATIENT              PATIENT ID       DOB            SEX      AGE           â”‚
â”‚ Test, Patient        3456789          01/11/2011     M        14 years      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Notes Section

Notes table displayed above Interpretation. Shows existing notes and allows adding new notes.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ’¬ Notes                                                                     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ DATE/TIME          AUTHOR       TYPE              NOTE                      â”‚
â”‚ 12/18/2025 09:45   J. Smith     [In Lab Only]     Sample hemolyzed, may...  â”‚
â”‚ 12/18/2025 10:15   M. Johnson   [Send with Result] Patient on anticoag...   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                              [ðŸ’¬ New Note]  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Note:** Notes section is always visible in expanded panel. "New Note" button at bottom right opens the note input form.

| Field | Description |
|-------|-------------|
| **Date/Time** | When note was added |
| **Author** | Who added the note |
| **Type** | "In Lab Only" or "Send with Result" |
| **Note** | Note body text |

#### Note Types (replaces internal/external)

| Type | Description |
|------|-------------|
| **In Lab Only** | Internal note visible only to lab staff (default) |
| **Send with Result** | Note included on result report sent to clinician/patient |

#### Adding Notes

- Click "New Note" button at bottom right of Notes section
- Note input form expands with radio buttons for type
- Select note type (defaults to "In Lab Only")
- Enter note text
- Click "Save Note" to save
- Click "Cancel" to close without saving

### Interpretation Section (Always Visible)

The interpretation section appears below notes. Clicking an interpretation option copies its text into the textarea.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ“„ Interpretation                                                               â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                                 â”‚
â”‚ AVAILABLE INTERPRETATIONS (click to use)    INTERPRETATION TEXT        [Clear] â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚ â”‚ âš¡ Suggested: [Diabetes Mellitus] âœ“     â”‚ â”‚ Fasting glucose â‰¥126 mg/dL is  â”‚â”‚
â”‚ â”‚    Fasting glucose â‰¥126 mg/dL is        â”‚ â”‚ consistent with diabetes       â”‚â”‚
â”‚ â”‚    consistent with diabetes mellitus... â”‚ â”‚ mellitus. Recommend            â”‚â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ confirmation with repeat       â”‚â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ fasting glucose or HbA1c.      â”‚â”‚
â”‚ â”‚ [Normal] GLU-NL (70-99)                 â”‚ â”‚ Clinical correlation advised.  â”‚â”‚
â”‚ â”‚    Fasting glucose within normal...     â”‚ â”‚                                â”‚â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚                                â”‚â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚ â”‚ [Impaired Fasting Glucose] GLU-IFG      â”‚                                    â”‚
â”‚ â”‚    Fasting glucose in prediabetic...    â”‚                                    â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                                    â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                                    â”‚
â”‚ â”‚ [Critical Value] GLU-CRIT (<50 or >400) â”‚                                    â”‚
â”‚ â”‚    CRITICAL VALUE - Immediate...        â”‚                                    â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                                    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Element | Description |
|---------|-------------|
| **Suggested Interpretation** | System-suggested interpretation with clinical description text |
| **Available Options** | Clinical interpretations with badges, codes, ranges, and description text |
| **Click to Select** | Clicking any option selects it and copies text to textarea |
| **Selected State** | Shows checkmark and highlighted border when selected |
| **Interpretation Text** | Multi-line textarea auto-populated on selection, editable |
| **Clear Button** | Clears textarea and deselects interpretation |

#### Clinical Interpretation Examples

Interpretations should include meaningful clinical context, not just high/low labels:

| Simple Label | Clinical Interpretation |
|--------------|------------------------|
| High | Leukocytosis, Diabetes Mellitus, Polycythemia |
| Low | Leukopenia, Mild Anemia, Hypoglycemia |
| Normal | Within normal limits with clinical context |
| Critical | Critical value requiring immediate notification |

#### Interpretation Workflow

1. **System Suggestion** - Based on entered result and configured interpretation ranges
2. **Click to Select** - Click any interpretation option to select it
3. **Auto-fill Text** - Clinical interpretation text automatically populates textarea
4. **Visual Feedback** - Selected option shows checkmark and highlighted border
5. **Free Text Override** - User can edit or replace interpretation text
6. **Clear Option** - Clear button resets selection and text

#### Interpretation Code Macros

The Interpretation Text field supports typing interpretation codes directly. Type a code and press space to expand it to the full interpretation text.

**Usage:** Type `WBC-NL` or `GLU-DM` in the textarea, press space â†’ code expands to full clinical interpretation text, and the corresponding interpretation option is auto-selected.

**Example Codes:**

| Code | Expansion |
|------|-----------|
| `WBC-NL` | White blood cell count within normal limits. No evidence of infection or hematologic abnormality. |
| `WBC-LEUK` | Elevated WBC count. May indicate infection, inflammation, stress response, or hematologic disorder. |
| `GLU-DM` | Fasting glucose â‰¥126 mg/dL is consistent with diabetes mellitus. Recommend confirmation with repeat fasting glucose or HbA1c. |
| `GLU-IFG` | Fasting glucose in prediabetic range. Recommend lifestyle modifications and periodic monitoring. |
| `RBC-ANEMOD` | RBC count slightly below reference range. Suggests mild anemia. |

**Note:** All interpretation codes defined in the Test Catalog are available as macros. Method codes (e.g., MAN-HEM, QNS) work only in the Method Details field.

### Program Banner (Conditional)

If result is associated with a program (EQA, PT), show banner below interpretation:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ“„ EQA Round 4                                        View Program Details â†’â”‚
â”‚    Due: 12/20/2025                                                          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Tab Structure

| Tab | Icon | Purpose | Priority |
|-----|------|---------|----------|
| **Method & Reagents** | FlaskConical | Select analyzer and reagent lots | Primary (Default) |
| **Order Info** | ClipboardList | Custom order fields from program | Secondary |
| **Attachments** | Paperclip | View/upload file attachments | Secondary |
| **History** | History | Previous results, delta check | Secondary |
| **QA/QC** | CheckCircle | Control results, flags, analyzer status | Secondary |
| **Referral** | Send | Refer to reference lab | Tertiary (infrequent) |

**Note:** Interpretation is displayed at the top of the expanded panel for easy access, above the program banner and tabs.

---

## Method & Reagents Tab (NEW)

This tab allows techs to document which method and reagent lots were used for the test.

### Method Selection

Two method options are always available:

| Method | Description |
|--------|-------------|
| **Manual** | Default option. Manual entry without analyzer. Includes optional text field for details. |
| **Analyzer** | Result from automated analyzer. Shows list of available analyzers when selected. |

**Behavior:**
- **Manual is always the default** when opening a result
- For **Analyzer Import** results: Automatically switches to Analyzer and pre-selects the import source
- Selecting Manual clears any analyzer selection
- **Method selection is required** but defaults to Manual

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Method                                                                       â”‚
â”‚                                                                              â”‚
â”‚ â—‰ Manual                                                          [default] â”‚
â”‚   Manual entry without analyzer                                              â”‚
â”‚                                                                              â”‚
â”‚ â—‹ Analyzer                                                                   â”‚
â”‚   Result from automated analyzer                                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Manual Method Details

When Manual is selected, an optional text field appears for entering method details.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Method Details (optional)                                                    â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ Enter details or type a macro code (e.g., MAN-HEM, QNS, CLOT)...       â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚ âš¡ Macro codes: Type a code and press space to expand.                      â”‚
â”‚    [MAN-HEM] [MAN-MICRO] [MAN-DIFF] [QNS] [CLOT] +4 more                   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### Macro Codes

The text field supports macro-style codes that expand to full text when followed by a space:

**Method Macros (for Method Details field only):**

| Code | Expansion |
|------|-----------|
| `MAN-HEM` | Manual count performed using hemocytometer with improved Neubauer chamber. |
| `MAN-MICRO` | Manual microscopic examination performed. |
| `MAN-DIFF` | Manual differential count performed on stained blood smear. |
| `MAN-RECOUNT` | Result verified by manual recount. |
| `MAN-DIL` | Sample diluted prior to manual count. |
| `QNS` | Quantity not sufficient for automated analysis. |
| `CLOT` | Sample contained clots, manual method required. |
| `LIPEMIC` | Lipemic sample, manual verification performed. |
| `HEMOLYZED` | Hemolyzed sample, result may be affected. |

**Usage:** Type the code in the Method Details field, then press space. The code will be replaced with the full text.

**Note:** Interpretation codes work separately in the Interpretation Text field (see Interpretation Section).

### Analyzer Selection

When Analyzer method is selected, displays analyzers linked to this test in the Test Catalog.

| Field | Description |
|-------|-------------|
| **Radio Selection** | Single selection from available analyzers |
| **Analyzer Name** | Display name of the analyzer |
| **Status** | Online / Offline / Available indicator |
| **Last Calibrated** | Date/time of last calibration |
| **QC Status** | Pass / Fail badge |

**Behavior:**
- Only shows analyzers linked to the specific test in Test Catalog
- Excludes "Manual" from analyzer list (Manual is a separate method)
- Analyzers with failed QC show warning but remain selectable (with confirmation)
- For **Analyzer Import** results: Pre-selected based on import source, editable
- For **Manual method switch to Analyzer**: No analyzer pre-selected; user must choose

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Select Analyzer                                                              â”‚
â”‚                                                                              â”‚
â”‚ â—‹ Sysmex XN-L                               [QC âœ“] [online]                 â”‚
â”‚   Last calibrated: 12/18/2025 06:00                                         â”‚
â”‚                                                                              â”‚
â”‚ â—‹ Sysmex XS-1000i                           [QC âœ“] [online]                 â”‚
â”‚   Last calibrated: 12/18/2025 05:45                                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Reagent Lot Selection

For each reagent linked to the test in the **Test Catalog**, display available lots with FIFO suggestion.

**Reagent Source:** Reagents are defined in the Test Catalog under the test's linked Method. Only reagents configured for the test appear here.

| Field | Description |
|-------|-------------|
| **Reagent Name** | Name of the reagent (from test method) |
| **Lot Number** | Lot identifier (monospace font) |
| **FIFO Suggested Badge** | Shows "FIFO Suggested" badge on oldest unexpired lot |
| **Expiring Badge** | Warning badge if lot expires within 7 days |
| **Expiration Date** | Lot expiration date |
| **Remaining** | Percentage of lot remaining |
| **Received Date** | Date lot was received (for FIFO ordering) |

**FIFO Logic:**
1. Lots sorted by received date (oldest first)
2. Oldest unexpired lot gets "FIFO Suggested" badge with highlighted border (teal dashed)
3. **No lot is pre-selected** - user must explicitly choose
4. Expired lots are grayed out and not selectable
5. Expiring lots (within 7 days) show amber warning badge

**Selection is optional** - results can be accepted without specifying reagent lots. FIFO suggestions are visually prominent to guide proper stock rotation.

**Visual States:**

| State | Border | Background | Notes |
|-------|--------|------------|-------|
| **FIFO Suggested** | Teal | Light teal | Default selection |
| **Expiring Soon** | Amber | Light amber | Warning badge shown |
| **Expired** | Red | Light red | Disabled, not selectable |
| **Normal** | Gray | White | Standard lot |
| **Selected** | Teal + ring | Light teal | User selection |

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Reagent Lots Used                                                           â”‚
â”‚                                                                             â”‚
â”‚ Cellpack DCL                                                                â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ â—‰ LOT-2024-0892  [FIFO] [Expiring]                                      â”‚ â”‚
â”‚ â”‚   Exp: 12/20/2024 â€¢ 15% remaining                                       â”‚ â”‚
â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”‚
â”‚ â”‚ â—‹ LOT-2024-1234                                                         â”‚ â”‚
â”‚ â”‚   Exp: 01/15/2025 â€¢ 85% remaining                                       â”‚ â”‚
â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”‚
â”‚ â”‚ â—‹ LOT-2024-1567                                                         â”‚ â”‚
â”‚ â”‚   Exp: 02/28/2025 â€¢ 100% remaining                                      â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                                                             â”‚
â”‚ Lysercell WNR                                                               â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ â—‰ LOT-2024-5678  [FIFO] [Expiring]                                      â”‚ â”‚
â”‚ â”‚   Exp: 12/25/2024 â€¢ 45% remaining                                       â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                                                             â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ âš¡ FIFO Suggestion: Oldest unexpired lots are pre-selected to ensure    â”‚ â”‚
â”‚ â”‚    proper stock rotation.                                                â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Footer Summary

Shows selected analyzer and reagent count:
```
Selected: Sysmex XN-L â€¢ 3 reagent lots
```

### Data Requirements

```typescript
interface AvailableAnalyzer {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'available';
  lastCalibrated?: string;
  qcStatus: 'pass' | 'warning' | 'fail' | 'none';
}

interface ReagentLot {
  lotNumber: string;
  received: string;      // Date received (for FIFO ordering)
  expires: string;       // Expiration date
  remaining: string;     // Percentage remaining
  fifoRank: number;      // 1 = oldest unexpired
  status: 'ok' | 'expiring-soon' | 'expired';
}

interface AvailableReagent {
  id: string;
  name: string;
  lots: ReagentLot[];
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tests/{testId}/analyzers` | Get analyzers linked to test |
| GET | `/api/tests/{testId}/reagents` | Get required reagents with available lots |
| GET | `/api/reagents/{reagentId}/lots` | Get available lots for reagent (FIFO ordered) |

---

## Order Info Tab (NEW)

Displays custom order information from the program fields. This includes up to 15 fields from order forms.

### Available Fields

| Field | Description |
|-------|-------------|
| **Ordering Clinician** | Name and contact info of ordering provider |
| **Department** | Ordering department |
| **Priority** | Routine, STAT, etc. (color-coded badge) |
| **Collection Date/Time** | When sample was collected |
| **Received Date/Time** | When sample was received in lab |
| **Fasting Status** | Patient fasting status |
| **Clinical History** | Relevant clinical information |
| **Diagnosis** | ICD codes and diagnosis |
| **Medication List** | Current medications |
| **Special Instructions** | Special handling or testing instructions |
| **Insurance Provider** | Insurance information |
| **Authorization Number** | Pre-authorization number |
| *(Additional fields)* | Up to 15 custom fields from program |

### Layout

Fields displayed in 3-column grid, with multi-line fields spanning 2 columns.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ORDERING CLINICIAN       DEPARTMENT           PRIORITY                      â”‚
â”‚ Dr. Sarah Williams       Internal Medicine    [Routine]                     â”‚
â”‚ +1 555-0123                                                                 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ COLLECTION DATE/TIME     RECEIVED DATE/TIME   FASTING STATUS               â”‚
â”‚ 12/18/2025 08:30        12/18/2025 09:00     Non-fasting                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ CLINICAL HISTORY                              DIAGNOSIS                     â”‚
â”‚ Annual checkup, patient reports fatigue       R53.83 - Other fatigue       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Data Source

Order info is populated from:
- Program-specific custom fields
- Order entry form data
- HL7 message data (OBR, ORC segments)

---

## Attachments Tab (NEW)

Allows viewing files attached at order entry and uploading new files to the result.

### Attachments Table

| Column | Description |
|--------|-------------|
| **File** | File name with type icon (PDF, image, etc.) |
| **Size** | File size (e.g., "245 KB") |
| **Source** | "Order Entry" or "Result Entry" badge |
| **Uploaded By** | User who uploaded the file |
| **Date** | Upload date/time |
| **Actions** | Download and Delete (if allowed) buttons |

### File Sources

| Source | Badge Color | Delete Allowed |
|--------|-------------|----------------|
| **Order Entry** | Purple | No - files from order cannot be deleted |
| **Result Entry** | Teal | Yes - lab staff can remove files they uploaded |

### Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Attachments                                                 [ðŸ“¤ Upload File]â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ FILE                    SIZE    SOURCE        UPLOADED BY   DATE    ACTIONS â”‚
â”‚ ðŸ“„ Requisition_Form.pdf 245 KB  [Order Entry] Order Entry   12/18   â¬‡       â”‚
â”‚ ðŸ–¼ Previous_Scan.jpg    1.2 MB  [Result Entry] J. Smith     12/18   â¬‡ ðŸ—‘    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ âš¡ Files attached at order entry cannot be deleted.                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Empty State

When no attachments exist:
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                              ðŸ“Ž No attachments                              â”‚
â”‚              Upload files or view attachments from order entry              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Supported File Types

- PDF documents
- Images (JPG, PNG, GIF)
- Office documents (DOC, DOCX, XLS, XLSX)
- Text files

### Actions

| Action | Icon | Description |
|--------|------|-------------|
| **Upload File** | Upload | Opens file picker to attach new file |
| **Download** | Download | Downloads the file |
| **Delete** | Trash | Removes file (only for Result Entry files) |

---

## History Tab

### Previous Results Table

| Column | Description |
|--------|-------------|
| **Date** | Result date |
| **Result** | Value + unit |
| **Status** | Normal/Abnormal badge |
| **Change** | % change from previous |

### Delta Check Alert

If delta check threshold exceeded, show alert banner:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âš  Delta Check Alert                                                         â”‚
â”‚   Change of +44.9% from previous value (98) exceeds threshold of 20%       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## QA/QC Tab

### Control Results Section

Display control results for the analyzer/test:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âœ“ Level 1         Value: 5.2  PASS â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ âœ“ Level 2         Value: 12.1 PASS â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Flags & Alerts Section

Display any active warnings:

| Alert Type | Visual |
|------------|--------|
| **Reagent Warning** | Amber banner with expiry info |
| **Analyzer Status** | Status indicator with last calibration |
| **Overall QC Status** | Summary badge (Pass/Warning/Fail) |

---

## Referral Tab

Deprioritized since infrequently used. Fields enabled only when "Refer this test" checkbox is selected.

### Fields

| Field | Type |
|-------|------|
| **Refer Checkbox** | Enable/disable referral fields |
| **Referral Reason** | Dropdown |
| **Institute** | Dropdown |
| **Test to Perform** | Dropdown (pre-filled with current test) |
| **Sent Date** | Date picker |

---

## Row Actions

### Inline Actions (Always Visible)

| Action | Icon | Description |
|--------|------|-------------|
| **Accept** | âœ“ Check | Accept result (validates required fields) |
| **Note** | ðŸ’¬ MessageSquare | Quick access to toggle note input (also available in Notes section) |

### Expanded Row Actions

| Action | Description |
|--------|-------------|
| **Accept Result** | Validate and accept result |

### Notes Button (in Notes Section)

The primary way to add notes is via the "New Note" button at the bottom right of the Notes section in the expanded panel.

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| **â†“ / â†‘** | Navigate between rows |
| **Enter** | Expand/collapse current row |
| **Tab** | Move to next input field |
| **Ctrl+Enter** | Accept current result |

---

## Data Requirements

### Result Object

```typescript
interface Result {
  id: string;
  labNumber: string;
  accession: string;
  patient: {
    name: string;
    id: string;
    dob: string;
    sex: 'M' | 'F' | 'O';
  };
  testDate: string;
  testName: string;
  testId: string;
  sampleType: string;
  normalRange: string;
  unit: string;
  result: string;
  status: 'pending' | 'entered' | 'awaiting-validation' | 'released' | 'cancelled';
  
  // Method Selection
  method: 'manual' | 'analyzer';         // Method type (defaults to 'manual')
  methodNotes?: string;                   // Optional notes/details for manual method
  
  // Analyzer & Reagent Selection (only when method === 'analyzer')
  analyzer?: string;                      // Selected analyzer name
  analyzerId?: string;                    // Selected analyzer ID
  selectedReagentLots?: {                 // Selected reagent lots
    reagentId: string;
    reagentName: string;
    lotNumber: string;
  }[];
  availableAnalyzers?: AvailableAnalyzer[];  // Loaded on expand
  availableReagents?: AvailableReagent[];    // Loaded on expand
  
  flags: Flag[];
  program?: {
    name: string;
    dueDate: string;
    type: 'eqa' | 'pt' | 'custom';
  };
  previousResults: PreviousResult[];
  suggestedInterpretation?: Interpretation;
  interpretationOptions: Interpretation[];
  selectedInterpretation?: Interpretation;
  interpretationText?: string;
  qcStatus: 'pass' | 'warning' | 'fail' | 'none';
  controlResults?: ControlResult[];
  deltaCheck?: DeltaCheck;
  reagentFlag?: string;
  analyzerFlag?: string;
  
  // Notes
  notes: Note[];
  
  // Attachments
  attachments: Attachment[];
  
  // Order Info (custom program fields)
  orderInfo?: {
    clinician?: string;
    clinicianPhone?: string;
    department?: string;
    priority?: string;
    collectionDate?: string;
    receivedDate?: string;
    clinicalHistory?: string;
    diagnosis?: string;
    fastingStatus?: string;
    medicationList?: string;
    specialInstructions?: string;
    insuranceProvider?: string;
    authorizationNumber?: string;
    // ... up to 15 custom fields
  };
}

interface Note {
  id: string;
  date: string;
  author: string;
  type: 'internal' | 'external';  // internal = "In Lab Only", external = "Send with Result"
  body: string;
}

interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'other';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  source: 'order' | 'result';  // order = from order entry, result = uploaded during result entry
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/results` | List results with filters |
| GET | `/api/results/{id}` | Get single result with full details |
| PUT | `/api/results/{id}` | Update result value |
| POST | `/api/results/{id}/accept` | Accept result |
| POST | `/api/results/{id}/reject` | Reject result |
| GET | `/api/results/{id}/history` | Get previous results |
| GET | `/api/results/{id}/qc` | Get QC data for result |
| POST | `/api/results/{id}/interpretation` | Save interpretation |
| POST | `/api/results/{id}/refer` | Create referral |
| GET | `/api/results/{id}/notes` | Get notes for result |
| POST | `/api/results/{id}/notes` | Add note to result |
| GET | `/api/results/{id}/attachments` | Get attachments for result |
| POST | `/api/results/{id}/attachments` | Upload attachment to result |
| DELETE | `/api/results/{id}/attachments/{attachmentId}` | Delete attachment (result entry only) |
| GET | `/api/macros` | Get all method macro codes with expansions |
| GET | `/api/tests/{testId}/interpretations` | Get interpretation codes for a test (usable as macros) |

### Query Parameters for Search

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Smart search query |
| `labUnit` | string | Filter by lab unit (required) |
| `labNumberFrom` | string | Filter by lab number range start |
| `labNumberTo` | string | Filter by lab number range end (optional) |
| `status` | string | Filter by status (default: pending) |
| `orderDateFrom` | date | Filter by order date range start |
| `orderDateTo` | date | Filter by order date range end |
| `testIds` | string[] | Filter by test ID(s) - supports multiple |
| `panelIds` | string[] | Filter by panel ID(s) - supports multiple |
| `page` | number | Page number |
| `pageSize` | number | Results per page (default 25) |

---

## Acceptance Criteria

### Unified Search
- [ ] Single search bar accepts lab number, patient name/ID, accession
- [ ] Quick filter for lab unit always visible (no "All" option)
- [ ] Lab unit must be selected before results load (blank by default)
- [ ] Advanced filters panel toggles via "Advanced" button
- [ ] Advanced filters include: Lab Number/Range, Order Date Range, Tests/Panels, Status
- [ ] Lab Number/Range supports single value or from/to range
- [ ] Tests/Panels is a multi-select field with search
- [ ] Tests/Panels dropdown shows panels grouped at top, tests below
- [ ] Selected tests/panels appear as removable chips
- [ ] Order Date Range supports from/to date selection
- [ ] Status filter defaults to "Pending"
- [ ] Active filters displayed as removable chips
- [ ] Result count displayed
- [ ] "Clear All Filters" resets to defaults
- [ ] "Apply Filters" applies filter changes

### Results Table
- [ ] Row displays sample info, test, analyzer, range, result input, status, flags, actions
- [ ] Patient name hidden in collapsed row (shows patient ID and age instead)
- [ ] Age calculated from DOB and displayed in collapsed view
- [ ] Full patient details (name, DOB) shown only when row expanded
- [ ] QC status indicator (colored dot) visible on each row
- [ ] Flag icons display with tooltips
- [ ] Result input adapts to test type (numeric input vs select list)
- [ ] Flagged results show highlighted input border
- [ ] Row expands on click to show detail panel

### Method & Reagents Tab
- [ ] Shows as default tab when row expanded
- [ ] Method selection shows "Manual" and "Analyzer" options
- [ ] "Manual" is selected by default
- [ ] Manual option shows optional "Method Details" text field
- [ ] Method details text field supports method macro code expansion (type code + space)
- [ ] Method macros include: MAN-HEM, MAN-MICRO, MAN-DIFF, QNS, CLOT, LIPEMIC, HEMOLYZED
- [ ] Method macros do NOT include interpretation codes
- [ ] Selecting "Analyzer" shows list of available analyzers
- [ ] Selecting "Manual" clears analyzer selection
- [ ] Analyzer list excludes "Manual" (Manual is now a separate method option)
- [ ] For analyzer imports, pre-selects Analyzer method and source analyzer
- [ ] Displays reagents linked to test (from Test Catalog) with available lot options
- [ ] Lots sorted by FIFO (oldest received first)
- [ ] Oldest unexpired lot shows "FIFO Suggested" badge with highlighted border
- [ ] No reagent lot pre-selected by default
- [ ] Expiring lots (within 7 days) show warning badge
- [ ] Expired lots grayed out and not selectable
- [ ] Info banner explains FIFO logic
- [ ] Footer shows selected method and reagent count
- [ ] Reagent selections are optional (not required to accept)

### Interpretation Section
- [ ] Appears below notes in expanded panel
- [ ] Shows system-suggested interpretation with clinical description text
- [ ] Lists all available interpretations with color badges, codes, ranges, and clinical text
- [ ] Interpretations include clinical context (e.g., "Diabetes Mellitus" not just "High")
- [ ] Clicking any interpretation option selects it and copies text to textarea
- [ ] Selected interpretation shows checkmark and highlighted border
- [ ] Multi-line textarea for interpretation text
- [ ] Auto-fills text from test catalog when interpretation clicked
- [ ] Interpretation text field supports interpretation code macros (type code + space)
- [ ] Typing interpretation code (e.g., WBC-NL, GLU-DM) and pressing space expands to full text
- [ ] Code expansion also auto-selects the matching interpretation option
- [ ] Interpretation codes do NOT work in Method Details field (those use method macros)
- [ ] User can edit or override interpretation text after selection
- [ ] Clear button resets selection and clears textarea
- [ ] Help text shows shortcut instructions for code expansion

### History Tab
- [ ] Shows previous results in table format
- [ ] Displays delta (% change) from previous
- [ ] Delta check alert banner when threshold exceeded
- [ ] "No previous results" empty state

### QA/QC Tab
- [ ] Displays control results with pass/fail status
- [ ] Shows reagent warnings (e.g., expiring)
- [ ] Shows analyzer status
- [ ] Overall QC status summary

### Referral Tab
- [ ] Checkbox to enable referral fields
- [ ] Fields disabled until checkbox selected
- [ ] Referral reason, institute, test, sent date fields

### Patient Info Banner
- [ ] Displays at top of expanded panel
- [ ] Shows patient name (hidden in collapsed view)
- [ ] Shows patient ID, DOB, sex, and calculated age

### Notes Section
- [ ] Notes section always visible in expanded panel
- [ ] Notes table shows date/time, author, type, and body
- [ ] Note type shown as "In Lab Only" or "Send with Result" badge
- [ ] "New Note" button at bottom right of notes section
- [ ] Clicking "New Note" expands note input form
- [ ] Note type radio buttons default to "In Lab Only"
- [ ] Can switch note type to "Send with Result"
- [ ] "Save Note" button saves new note
- [ ] "Cancel" button closes input without saving
- [ ] Empty state shows "No notes for this result"

### Order Info Tab
- [ ] Displays order information from program fields
- [ ] Shows up to 15 custom fields
- [ ] Includes clinician, department, priority, dates
- [ ] Shows clinical history, diagnosis, medications
- [ ] Fields displayed in 3-column grid layout

### Attachments Tab
- [ ] Shows list of files attached to order or result
- [ ] Table displays file name, size, source, uploaded by, date, actions
- [ ] File type icon shows (PDF, image)
- [ ] Source badge: "Order Entry" (purple) or "Result Entry" (teal)
- [ ] "Upload File" button at top right
- [ ] Download button for all files
- [ ] Delete button only for "Result Entry" files
- [ ] Order Entry files cannot be deleted
- [ ] Empty state with paperclip icon when no attachments
- [ ] Info banner explains file source rules

### Program Context
- [ ] Program banner displays below interpretation when result associated with EQA/PT
- [ ] Shows program name and due date
- [ ] Link to program details

### Actions
- [ ] Accept button in row accepts result
- [ ] Note button in row toggles note input (also available in Notes section)
- [ ] "New Note" button in Notes section opens note input
- [ ] "Accept Result" is the only bottom action (no Save Draft)

### Pagination
- [ ] Default 25 results per page
- [ ] Options for 50, 100 per page
- [ ] Page navigation controls
- [ ] Result count display

---

## Migration Notes

### From Current Design

| Current | New |
|---------|-----|
| Separate search pages | Unified search with filters |
| Methods dropdown in expanded row | Moved to test catalog configuration |
| Upload file button | Moved to separate import screen |
| Storage location in expanded row | Available in Order Info tab |
| Referral always visible | Moved to Referral tab (deprioritized) |
| Internal/External notes | Renamed to "In Lab Only" / "Send with Result" |
| Save Draft button | Removed - only Accept Result |
| Patient name always visible | Hidden until row expanded (privacy) |
| DOB shown | Age calculated and shown instead |

### New Features

- Interpretation selection and text (click to copy)
- QA/QC visibility (controls, flags)
- Program context banner
- Delta check alerts
- Previous results history
- Flag icons in main row
- Notes section (always visible with "New Note" button)
- Order Info tab with custom program fields
- Attachments tab (view order files, upload result files)
- Patient info banner (expanded view only)
- Patient privacy (name hidden until expanded)

---

## Future Considerations

1. **Bulk Actions** - Select multiple results for batch accept/reject
2. **Worklist Views** - Save custom filter combinations as named worklists
3. **Real-time Updates** - WebSocket for live result updates from analyzers
4. **Mobile Optimization** - Responsive design for tablet use at bench
5. **Audit Trail** - Full history of changes visible in expanded panel
