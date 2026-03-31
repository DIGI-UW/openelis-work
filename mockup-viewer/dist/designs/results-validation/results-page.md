# Results Entry Page Redesign
## Functional Requirements Specification — v2.0

**Version:** 2.1
**Date:** 2026-03-30
**Status:** Draft for Review
**Jira:** [TBD — assign on story creation]
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Test Catalog, Order Entry, Validation, Reagent Inventory, EQA/Program Management

---

## Table of Contents

1. Overview & Problem Statement
2. Design Goals
3. Start State / Page Load Behavior
4. Unified Search & Filters
5. Results Table
6. Expanded Detail Panel
7. Method & Reagents Tab
8. Order Info Tab
9. Attachments Tab
10. History Tab
11. QA/QC Tab
12. Referral Tab
13. Row Actions & Keyboard Navigation
14. Data Requirements & API Endpoints
15. Business Rules
16. Localization (i18n)
17. Validation Rules
18. Security & Permissions
19. Acceptance Criteria
20. Migration Notes
21. Admin Configuration — Results Entry

---

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
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         🔍                                                  │
│                                                                             │
│               Search for results to begin                                   │
│                                                                             │
│     Enter a lab number, patient name, or patient ID in the search box      │
│     above, or select a Lab Unit to view pending results.                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         ◌ Loading...                                        │
│                                                                             │
│               Fetching results for Hematology...                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### No Results Found State

When a search or filter returns zero results:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         📋                                                  │
│                                                                             │
│               No results found                                              │
│                                                                             │
│     No pending results match your search criteria.                          │
│     Try adjusting your filters or search terms.                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔍 Search by lab number, patient name/ID, or accession...                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Quick Filters (Always Visible)

| Filter | Options | Default |
|--------|---------|---------|
| **Lab Unit** | Chemistry, Hematology, Microbiology, Serology, etc. | None (blank) |

**Note:** Lab Unit must be selected before results load. This prevents loading all results across all units and improves performance.

### Advanced Filters (Expandable Panel)

Toggle via "Advanced" button. Panel expands below quick filters.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAB NUMBER / RANGE                      ORDER DATE RANGE                    │
│ ┌────────────────┐ to ┌──────────────┐  ┌──────┐ to ┌──────┐               │
│ │ From...        │    │ To (optional)│  │      │    │      │               │
│ └────────────────┘    └──────────────┘  └──────┘    └──────┘               │
│ Enter single lab number or range                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ TESTS / PANELS                          STATUS                              │
│ ┌─────────────────────────────────────┐ ┌───────────┐                      │
│ │ [CBC ×] [WBC ×] Add...              │ │ Pending ▾ │                      │
│ └─────────────────────────────────────┘ └───────────┘                      │
│ Select multiple tests or panels                                             │
│                                                                             │
│                              [Clear All Filters]    [Apply Filters]         │
└─────────────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────┐
│ Search tests or panels...       │
├─────────────────────────────────┤
│ PANELS                          │
│   Complete Blood Count (CBC)    │
│   Basic Metabolic Panel         │
│   Comprehensive Metabolic Panel │
├─────────────────────────────────┤
│ TESTS                           │
│   WBC                           │
│   RBC                           │
│   Hemoglobin                    │
│   Glucose                       │
│   Creatinine                    │
└─────────────────────────────────┘
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
Showing: [Status: Pending ×]  •  127 results
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
| **Actions** | 80px | Save + Note button |

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
┌─────────┐     Enter      ┌─────────┐    Validate   ┌──────────────────┐
│ Pending │ ──────────────>│ Entered │ ─────────────>│ Awaiting         │
└─────────┘                └─────────┘               │ Validation       │
     │                          │                    └────────┬─────────┘
     │                          │                             │
     │         Cancel           │         Cancel              │ Approve
     └──────────────────────────┴─────────────────┐           │
                                                  ▼           ▼
                                            ┌───────────┐ ┌──────────┐
                                            │ Cancelled │ │ Released │
                                            └───────────┘ └──────────┘
```

| Transition | Description |
|------------|-------------|
| Pending → Entered | Result value entered |
| Entered → Awaiting Validation | Tech submits for review (if validation required) |
| Entered → Released | Direct release (if no validation required) |
| Awaiting Validation → Released | Supervisor approves result |
| Any → Cancelled | Result cancelled (e.g., wrong test, sample issue) |

### Additional Visual States

| State | Visual Treatment |
|-------|------------------|
| **Flagged** | Orange/red input border, flag icons |
| **Expanded** | Teal background highlight |

### QC Status Indicator

Small colored dot next to expand chevron:
- 🟢 Green = QC Passed
- 🟡 Yellow = QC Warning
- 🔴 Red = QC Failed
- ⚪ Gray = No QC Data

### Flag Icons

All badges render in the Flags column and may appear simultaneously. They are additive — multiple badges can coexist on a single row.

| Badge | Display | Color | Tooltip |
|-------|---------|-------|---------|
| **H** (above normal) | Bold letter | Red | "Above normal range" |
| **L** (below normal) | Bold letter | Blue | "Below normal range" |
| **Δ** (delta check) | Greek letter | Amber | "Delta check threshold exceeded" |
| **C** (critical/panic) | Filled pill | Orange | "Critical/panic value — acknowledgment required" |
| **!** (invalid range) | Filled pill | Dark red | "Outside physiologically valid range" |
| **NCE** (non-conformity) | Outlined pill | Teal (open) / Gray (closed) | NCE number · category / subcategory · severity · status |

The C and ! badges are derived dynamically from the result value and the test's range configuration. The NCE badge is driven by the presence of one or more linked NCE records on the result.

---

## Expanded Detail Panel

When a row is expanded, show a tabbed interface with contextual information.

### Patient Info Banner

Displayed at the top of expanded panel, showing full patient details (hidden in collapsed view for privacy):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PATIENT              PATIENT ID       DOB            SEX      AGE           │
│ Test, Patient        3456789          01/11/2011     M        14 years      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Notes Section

Notes table displayed above Interpretation. Shows existing notes and allows adding new notes.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💬 Notes                                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ DATE/TIME          AUTHOR       TYPE              NOTE                      │
│ 12/18/2025 09:45   J. Smith     [In Lab Only]     Sample hemolyzed, may...  │
│ 12/18/2025 10:15   M. Johnson   [Send with Result] Patient on anticoag...   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                              [💬 New Note]  │
└─────────────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 📄 Interpretation                                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ AVAILABLE INTERPRETATIONS (click to use)    INTERPRETATION TEXT        [Clear] │
│ ┌─────────────────────────────────────────┐ ┌─────────────────────────────────┐│
│ │ ⚡ Suggested: [Diabetes Mellitus] ✓     │ │ Fasting glucose ≥126 mg/dL is  ││
│ │    Fasting glucose ≥126 mg/dL is        │ │ consistent with diabetes       ││
│ │    consistent with diabetes mellitus... │ │ mellitus. Recommend            ││
│ └─────────────────────────────────────────┘ │ confirmation with repeat       ││
│ ┌─────────────────────────────────────────┐ │ fasting glucose or HbA1c.      ││
│ │ [Normal] GLU-NL (70-99)                 │ │ Clinical correlation advised.  ││
│ │    Fasting glucose within normal...     │ │                                ││
│ └─────────────────────────────────────────┘ │                                ││
│ ┌─────────────────────────────────────────┐ └─────────────────────────────────┘│
│ │ [Impaired Fasting Glucose] GLU-IFG      │                                    │
│ │    Fasting glucose in prediabetic...    │                                    │
│ └─────────────────────────────────────────┘                                    │
│ ┌─────────────────────────────────────────┐                                    │
│ │ [Critical Value] GLU-CRIT (<50 or >400) │                                    │
│ │    CRITICAL VALUE - Immediate...        │                                    │
│ └─────────────────────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
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

**Usage:** Type `WBC-NL` or `GLU-DM` in the textarea, press space → code expands to full clinical interpretation text, and the corresponding interpretation option is auto-selected.

**Example Codes:**

| Code | Expansion |
|------|-----------|
| `WBC-NL` | White blood cell count within normal limits. No evidence of infection or hematologic abnormality. |
| `WBC-LEUK` | Elevated WBC count. May indicate infection, inflammation, stress response, or hematologic disorder. |
| `GLU-DM` | Fasting glucose ≥126 mg/dL is consistent with diabetes mellitus. Recommend confirmation with repeat fasting glucose or HbA1c. |
| `GLU-IFG` | Fasting glucose in prediabetic range. Recommend lifestyle modifications and periodic monitoring. |
| `RBC-ANEMOD` | RBC count slightly below reference range. Suggests mild anemia. |

**Note:** All interpretation codes defined in the Test Catalog are available as macros. Method codes (e.g., MAN-HEM, QNS) work only in the Method Details field.

### Program Banner (Conditional)

If result is associated with a program (EQA, PT), show banner below interpretation:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📄 EQA Round 4                                        View Program Details →│
│    Due: 12/20/2025                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────────────────┐
│ Method                                                                       │
│                                                                              │
│ ◉ Manual                                                          [default] │
│   Manual entry without analyzer                                              │
│                                                                              │
│ ○ Analyzer                                                                   │
│   Result from automated analyzer                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Manual Method Details

When Manual is selected, an optional text field appears for entering method details.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Method Details (optional)                                                    │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Enter details or type a macro code (e.g., MAN-HEM, QNS, CLOT)...       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ⚡ Macro codes: Type a code and press space to expand.                      │
│    [MAN-HEM] [MAN-MICRO] [MAN-DIFF] [QNS] [CLOT] +4 more                   │
└─────────────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────────────────┐
│ Select Analyzer                                                              │
│                                                                              │
│ ○ Sysmex XN-L                               [QC ✓] [online]                 │
│   Last calibrated: 12/18/2025 06:00                                         │
│                                                                              │
│ ○ Sysmex XS-1000i                           [QC ✓] [online]                 │
│   Last calibrated: 12/18/2025 05:45                                         │
└─────────────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────────────────┐
│ Reagent Lots Used                                                           │
│                                                                             │
│ Cellpack DCL                                                                │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ◉ LOT-2024-0892  [FIFO] [Expiring]                                      │ │
│ │   Exp: 12/20/2024 • 15% remaining                                       │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ ○ LOT-2024-1234                                                         │ │
│ │   Exp: 01/15/2025 • 85% remaining                                       │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ ○ LOT-2024-1567                                                         │ │
│ │   Exp: 02/28/2025 • 100% remaining                                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ Lysercell WNR                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ◉ LOT-2024-5678  [FIFO] [Expiring]                                      │ │
│ │   Exp: 12/25/2024 • 45% remaining                                       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚡ FIFO Suggestion: Oldest unexpired lots are pre-selected to ensure    │ │
│ │    proper stock rotation.                                                │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Footer Summary

Shows selected analyzer and reagent count:
```
Selected: Sysmex XN-L • 3 reagent lots
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
┌─────────────────────────────────────────────────────────────────────────────┐
│ ORDERING CLINICIAN       DEPARTMENT           PRIORITY                      │
│ Dr. Sarah Williams       Internal Medicine    [Routine]                     │
│ +1 555-0123                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ COLLECTION DATE/TIME     RECEIVED DATE/TIME   FASTING STATUS               │
│ 12/18/2025 08:30        12/18/2025 09:00     Non-fasting                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ CLINICAL HISTORY                              DIAGNOSIS                     │
│ Annual checkup, patient reports fatigue       R53.83 - Other fatigue       │
└─────────────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────────────────┐
│ Attachments                                                 [📤 Upload File]│
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE                    SIZE    SOURCE        UPLOADED BY   DATE    ACTIONS │
│ 📄 Requisition_Form.pdf 245 KB  [Order Entry] Order Entry   12/18   ⬇       │
│ 🖼 Previous_Scan.jpg    1.2 MB  [Result Entry] J. Smith     12/18   ⬇ 🗑    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ⚡ Files attached at order entry cannot be deleted.                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State

When no attachments exist:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              📎 No attachments                              │
│              Upload files or view attachments from order entry              │
└─────────────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠ Delta Check Alert                                                         │
│   Change of +44.9% from previous value (98) exceeds threshold of 20%       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## QA/QC Tab

### Control Results Section

Display control results for the analyzer/test:

```
┌─────────────────────────────────────┐
│ ✓ Level 1         Value: 5.2  PASS │
├─────────────────────────────────────┤
│ ✓ Level 2         Value: 12.1 PASS │
└─────────────────────────────────────┘
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
| **Save Result** | ✓ Check | Visible only when status is Entered. Saves result value and sends to Validation queue. |

### Expanded Row Actions

| Action | Description |
|--------|-------------|
| **Save Result** | Save the entered result value and move it to the Validation queue (status → Awaiting Validation). Acceptance by a validator happens on the separate Validation page. |

### Notes Button (in Notes Section)

The primary way to add notes is via the "New Note" button at the bottom right of the Notes section in the expanded panel.

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| **↓ / ↑** | Navigate between rows |
| **Enter** | Expand/collapse current row |
| **Tab** | Move to next input field |
| **Ctrl+Enter** | Save current result (sends to Validation queue) |

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

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/results` | List results with filters | `results.view` |
| GET | `/api/results/{id}` | Get single result with full details | `results.view` |
| PUT | `/api/results/{id}` | Update result value | `results.modify` |
| POST | `/api/results/{id}/save` | Save result value — moves status to Awaiting Validation | `results.modify` |
| POST | `/api/results/{id}/nce` | File NCE and cancel result | `results.modify` |
| GET | `/api/results/{id}/history` | Get previous results | `results.view` |
| GET | `/api/results/{id}/qc` | Get QC data for result | `results.view` |
| POST | `/api/results/{id}/interpretation` | Save interpretation | `results.modify` |
| POST | `/api/results/{id}/refer` | Create referral | `results.refer` |
| GET | `/api/results/{id}/notes` | Get notes for result | `results.view` |
| POST | `/api/results/{id}/notes` | Add note to result | `results.notes.add` |
| GET | `/api/results/{id}/attachments` | Get attachments for result | `results.view` |
| POST | `/api/results/{id}/attachments` | Upload attachment to result | `results.attachments.upload` |
| DELETE | `/api/results/{id}/attachments/{attachmentId}` | Delete attachment (result entry only) | `results.attachments.delete` |
| GET | `/api/macros` | Get all method macro codes with expansions | `results.view` |
| GET | `/api/tests/{testId}/interpretations` | Get interpretation codes for a test (usable as macros) | `results.view` |
| GET | `/api/tests/{testId}/analyzers` | Get analyzers linked to test | `results.view` |
| GET | `/api/tests/{testId}/reagents` | Get required reagents with available lots | `results.view` |

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
- [ ] "Save Result" (blue) shown in Actions column for first entry when a value is present **[BR-018]**
- [ ] "Modify Result" (outline blue) shown for Awaiting Validation; opens expanded panel **[BR-018]**
- [ ] "Modify Result" (outline amber) shown for Released; opens expanded panel **[BR-018]**
- [ ] No button shown when result field is empty **[BR-018]**
- [ ] Released amber confirmation banner blocks modification fields until confirmed **[BR-018]**
- [ ] Reason for modification textarea required for all modifications before save enabled **[BR-018]**
- [ ] Modification reason auto-saved as internal note with prefix "[Modification reason]" **[BR-018]**
- [ ] Saving first entry moves status to Awaiting Validation **[BR-013]**
- [ ] Modifying queued or released result returns status to Awaiting Validation **[BR-018]**
- [ ] "New Note" button in Notes section opens inline note input

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
| Save Draft / Accept buttons | Replaced with single "Save Result" action that sends to Validation queue |
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

### Cross-Module Harmonization Note

The note types "In Lab Only" and "Send with Result" replace the legacy "Internal" / "External" terminology. **All other modules that display or create notes (Validation, Order Entry, Patient Chart) must adopt this same terminology** to ensure UI consistency. This rename should be tracked as a separate harmonization task and applied to the Validation page FRS (validation-page-requirements-v2.1-stage1.md) and any other affected specs.

---

## Business Rules

**BR-001:** Results MUST NOT load on page entry until the user explicitly triggers a search via lab unit selection, search query submission, or filter application. Passive page load must show the empty start state.

**BR-002:** Lab Unit selection MUST be a required pre-condition before any result set is loaded. Results from all lab units must never be loaded simultaneously.

**BR-003:** The Lab Unit selection MUST persist for the duration of the browser session. It resets only on tab close or explicit user change.

**BR-004:** Patient name MUST NOT be displayed in the collapsed row view. Only patient ID, sex, and calculated age (from DOB) are shown. Full patient details (name, DOB) are revealed only when the row is expanded.

**BR-005:** Age MUST be calculated dynamically from the patient's date of birth at display time, not stored as a static value.

**BR-006:** The Method field defaults to "Manual" when a result row is first expanded. It switches to "Analyzer" automatically only when the result was imported from an analyzer integration.

**BR-007:** Reagent lot selection is optional. A result MUST be acceptable without specifying reagent lots. The FIFO suggestion is a visual guide, not a required field.

**BR-008:** FIFO reagent suggestion MUST select the oldest unexpired lot (by received date) for each reagent. Expired lots MUST be excluded from selection. Lots expiring within 7 days MUST display an amber "Expiring" warning badge.

**BR-009:** If a user attempts to select an analyzer with a failed QC status, the system MUST present a confirmation dialog before allowing the selection to proceed.

**BR-010:** Notes default to type "In Lab Only". The user must explicitly select "Send with Result" to change visibility. "In Lab Only" notes MUST NOT appear on patient-facing result reports.

**BR-011:** Files attached at Order Entry (source = `order`) MUST NOT be deletable from the Results Entry screen, regardless of user role. Only files uploaded during Results Entry (source = `result`) may be deleted.

**BR-012:** The delta check threshold is configured per-test in the Test Catalog. When the absolute percentage change from the most recent previous result exceeds this threshold, a delta check alert MUST be displayed in the History tab.

**BR-013:** The Save Result action MUST validate that a result value has been entered before proceeding. If the result field is empty, the action must be blocked and an inline error displayed. Saving a result sets its status to Awaiting Validation — final acceptance is performed by a validator on the Validation page, not on Results Entry.

**BR-014:** Interpretation codes typed in the Method Details field MUST NOT expand. Method macros typed in the Interpretation Text field MUST NOT expand. Each field only recognizes its own code set.

**BR-015 — Result Range Tiers:** Each test in the Test Catalog defines up to three numeric range bands. Results are visually classified into one of four tiers on the Results Entry page, evaluated in priority order:

| Tier | Trigger condition | Visual | Action required |
|------|-------------------|--------|-----------------|
| **Normal** | Value within normal range | No highlight | None |
| **Abnormal** | Outside normal range but within critical range | Yellow background / yellow border on input | None — H/L flag displayed |
| **Critical** | Outside critical (panic) range but within valid range | Orange background / orange border on input; "C" badge in flags column | Tech must click **I Acknowledge** before Save is enabled |
| **Invalid** | Outside physiologically valid range | Dark red background; "!" badge in flags column | Dark red warning banner displayed; result should not be saved until verified |

The three range types stored in the Test Catalog per test are:
- `normalRange` — expected reference interval for the population (e.g., 4.00–10.00 x10⁹/L for WBC)
- `criticalRange` (panic range) — values requiring immediate physician notification (e.g., <2.0 or >30.0 x10⁹/L for WBC)
- `validRange` — physiologically possible range; values outside this indicate instrument error (e.g., 0.1–100.0 x10⁹/L for WBC)

**BR-016 — Critical Value Acknowledgment:** When a result value falls in the critical tier, the Save Result button MUST be disabled. A bright orange banner MUST be displayed stating the critical value, the specific condition (e.g., "Critical hyperkalemia — K⁺ > 6.5 mmol/L"), and a mandatory notification reminder. The tech MUST click the "I Acknowledge" button to confirm physician notification has been or will be made before the Save button becomes active. The acknowledgment is reset if the result value is modified after acknowledging.

**BR-017 — Invalid Range Warning:** When a result value falls outside the valid (physiological) range, a dark red warning banner MUST be displayed below the action bar. The banner text must identify the value, the valid range, and instruct the technician to verify and repeat analysis. The Save button is NOT blocked for invalid-range values (so the tech can still correct the entry), but the banner serves as a strong visual alert.

**BR-018 — Result Modification Workflow:** Saving a result value that has previously been saved (status = Awaiting Validation or Released) is treated as a modification, not a first entry. The following rules apply:

| Condition | Button label | Additional requirement |
|-----------|--------------|------------------------|
| Result has no prior saved value (status = Pending or Entered) | **Save Result** | None |
| Result already saved, not yet validated (status = Awaiting Validation) | **Modify Result** | Reason for modification note required |
| Result has been validated (status = Released) | **Modify Result** (amber) | Confirmation acknowledgment + reason note required |

**Modify Result — Awaiting Validation:** An informational banner is shown in the expanded panel notifying the tech they are modifying a queued result. A "Reason for modification" textarea is shown and must be filled before the Modify Result button is active. On submission, the reason is automatically appended to the result's internal notes as an audit entry and the result remains in the Awaiting Validation queue.

**Modify Result — Released:** A full-width amber warning banner is shown at the top of the expanded panel stating the result has been validated and may have been reported to the clinician. The tech must explicitly click "I understand — proceed" before the modification fields appear. A reason note is then required, as above. On submission the result is returned to Awaiting Validation status for re-approval by a validator.

**BR-019 (renumbered from previous BR-019) — Non-Conformity Flag:** [unchanged]

**BR-020 — Search Input:** The search bar placeholder text MUST indicate that barcode scanning is supported, in addition to manual text entry. Barcode scanners typically operate as keyboard wedge devices and populate the search field directly on scan.

**BR-019 — Non-Conformity Flag:** A result that has one or more associated NCE records MUST display a teal "NCE" badge in the Flags column of the results table. The badge MUST be present regardless of the NCE's status (open or closed) and regardless of whether the result itself is cancelled. Hovering the badge MUST show a tooltip containing the NCE number, category, subcategory, severity, and status. When an NCE is closed, the badge MUST render in a muted gray style to distinguish resolved events from open ones. The NCE badge co-exists with all other flags (H, L, Δ, C, !) — it is additive, not replacing any existing flag.

The NCE badge applies in the following scenarios:
- A result has a pre-existing NCE filed against the sample or order (imported from NCE module linkage)
- The tech files a new NCE via the "Report Non-Conformity" inline form during Results Entry (the badge appears immediately after submission without a page reload)

---

## Localization (i18n)

All UI text is externalized via `t(key, fallback)`. The following keys must be added to the OpenELIS message properties files. Key convention: `[category].[feature].[identifier]`.

### Page Structure

| i18n Key | Default English Text |
|----------|----------------------|
| `heading.results.pageTitle` | Results Entry |
| `heading.results.pageSubtitle` | Enter and manage test results |
| `heading.results.resultCount` | results found |

### Search & Filters

| i18n Key | Default English Text |
|----------|----------------------|
| `label.results.search` | Search |
| `placeholder.results.search` | Search or scan barcode — lab number, patient ID, test name… |
| `label.results.labUnit` | Lab Unit |
| `placeholder.results.labUnit` | Select Lab Unit... |
| `button.results.search` | Search |
| `button.results.advanced` | Filters |
| `button.results.clearFilters` | Clear |
| `button.results.applyFilters` | Apply Filters |
| `label.results.filter.labNumberFrom` | Lab Number From |
| `placeholder.results.filter.labNumberFrom` | e.g., DEV0125... |
| `label.results.filter.labNumberTo` | Lab Number To |
| `placeholder.results.filter.labNumberTo` | To (optional) |
| `label.results.filter.dateFrom` | Date From |
| `label.results.filter.dateTo` | Date To |
| `label.results.filter.testSection` | Test Section |
| `label.results.filter.status` | Status |
| `label.results.filter.allStatuses` | All Statuses |
| `label.results.filter.pending` | Pending |
| `label.results.filter.entered` | Entered |

### Empty & Loading States

| i18n Key | Default English Text |
|----------|----------------------|
| `heading.results.emptyState` | Search to View Results |
| `message.results.emptyState` | Select a lab unit or enter a search term to view pending results. |
| `message.results.loading` | Loading results... |
| `message.results.noResults` | No results found matching your criteria. |

### Results Table Headers

| i18n Key | Default English Text |
|----------|----------------------|
| `label.results.table.samplePatient` | Sample / Patient |
| `label.results.table.test` | Test |
| `label.results.table.analyzer` | Analyzer |
| `label.results.table.range` | Range |
| `label.results.table.result` | Result |
| `label.results.table.status` | Status |
| `label.results.table.flags` | Flags |
| `placeholder.results.table.resultInput` | Enter result |
| `label.results.flag.aboveNormal` | Above normal range |
| `label.results.flag.belowNormal` | Below normal range |
| `label.results.flag.deltaCheck` | Delta check threshold exceeded |
| `label.results.flag.critical` | Critical/panic value — acknowledgment required |
| `label.results.flag.invalid` | Outside physiologically valid range |
| `label.results.flag.nce` | NCE |
| `label.results.range.abnormal` | Abnormal |
| `label.results.range.critical` | Critical |
| `label.results.range.invalid` | Invalid |
| `heading.results.critical.title` | Critical Value — Physician Notification Required |
| `message.results.critical.body` | Per laboratory policy, the responsible clinician must be notified before or upon result reporting. |
| `button.results.critical.acknowledge` | I Acknowledge |
| `message.results.critical.acknowledged` | Critical value acknowledged — clinician notification confirmed. You may now save. |
| `heading.results.invalid.warning` | Result outside valid range |
| `message.results.invalid.body` | Verify the result and repeat analysis if necessary. Do not report until confirmed. |

### Status Badge Labels

| i18n Key | Default English Text |
|----------|----------------------|
| `label.results.status.pending` | Pending |
| `label.results.status.entered` | Entered |
| `label.results.status.awaitingValidation` | Awaiting Validation |
| `label.results.status.released` | Released |
| `label.results.status.cancelled` | Cancelled |

### Patient Info Banner

| i18n Key | Default English Text |
|----------|----------------------|
| `label.results.patient.patient` | Patient |
| `label.results.patient.patientId` | Patient ID |
| `label.results.patient.dob` | DOB |
| `label.results.patient.sex` | Sex |
| `label.results.patient.age` | Age |
| `label.results.patient.ageYears` | years |

### Notes Section

| i18n Key | Default English Text |
|----------|----------------------|
| `heading.results.notes` | Notes |
| `label.results.notes.dateTime` | Date/Time |
| `label.results.notes.author` | Author |
| `label.results.notes.type` | Type |
| `label.results.notes.note` | Note |
| `label.results.notes.inLabOnly` | In Lab Only |
| `label.results.notes.sendWithResult` | Send with Result |
| `button.results.notes.newNote` | New Note |
| `label.results.notes.newNote` | New Note |
| `button.results.notes.saveNote` | Save Note |
| `button.results.notes.cancel` | Cancel |
| `placeholder.results.notes.text` | Enter note... |
| `message.results.notes.empty` | No notes for this result. |

### Interpretation Section

| i18n Key | Default English Text |
|----------|----------------------|
| `heading.results.interpretation` | Interpretation |
| `label.results.interpretation.available` | Available Interpretations |
| `label.results.interpretation.clickToUse` | (click to use) |
| `label.results.interpretation.suggested` | Suggested: |
| `label.results.interpretation.selected` | ✓ Selected |
| `label.results.interpretation.text` | Interpretation Text |
| `button.results.interpretation.clear` | Clear |
| `placeholder.results.interpretation.text` | Click an interpretation option, or type a code (e.g., WBC-NL) and press space to expand... |
| `message.results.interpretation.shortcutHint` | Shortcut: Type an interpretation code and press space to expand. |

### Method & Reagents Tab

| i18n Key | Default English Text |
|----------|----------------------|
| `label.results.method.title` | Method |
| `label.results.method.manual` | Manual |
| `label.results.method.manualDescription` | Manual entry without analyzer |
| `label.results.method.manualDefault` | default |
| `label.results.method.analyzer` | Analyzer |
| `label.results.method.analyzerDescription` | Result from automated analyzer |
| `label.results.method.details` | Method Details |
| `label.results.method.detailsOptional` | (optional) |
| `placeholder.results.method.details` | Enter details or type a macro code (e.g., MAN-HEM, QNS, CLOT)... |
| `message.results.method.macroHint` | Macro codes: Type a code and press space to expand. |
| `label.results.analyzer.select` | Select Analyzer |
| `label.results.reagent.title` | Reagent Lots Used |
| `label.results.reagent.fifoSuggested` | FIFO Suggested |
| `label.results.reagent.expiring` | Expiring |
| `message.results.reagent.fifoHint` | Lots marked "FIFO Suggested" are the oldest unexpired lots. Select them to ensure proper stock rotation. |

### Tab Labels

| i18n Key | Default English Text |
|----------|----------------------|
| `label.results.tab.method` | Method & Reagents |
| `label.results.tab.orderInfo` | Order Info |
| `label.results.tab.attachments` | Attachments |
| `label.results.tab.history` | History |
| `label.results.tab.qaqc` | QA/QC |
| `label.results.tab.referral` | Referral |

### Attachments Tab

| i18n Key | Default English Text |
|----------|----------------------|
| `heading.results.attachments` | Attachments |
| `button.results.attachments.upload` | Upload File |
| `label.results.attachments.file` | File |
| `label.results.attachments.size` | Size |
| `label.results.attachments.source` | Source |
| `label.results.attachments.uploadedBy` | Uploaded By |
| `label.results.attachments.date` | Date |
| `label.results.attachments.actions` | Actions |
| `label.results.attachments.orderEntry` | Order Entry |
| `label.results.attachments.resultEntry` | Result Entry |
| `message.results.attachments.empty` | No attachments |
| `message.results.attachments.emptyHint` | Upload files or view attachments from order entry |
| `message.results.attachments.orderEntryNotice` | Files attached at order entry are marked "Order Entry" and cannot be deleted. |

### History Tab

| i18n Key | Default English Text |
|----------|----------------------|
| `heading.results.history` | Previous Results |
| `label.results.history.date` | Date |
| `label.results.history.result` | Result |
| `label.results.history.status` | Status |
| `label.results.history.change` | Change |
| `heading.results.deltaCheck` | Delta Check Alert |
| `message.results.deltaCheck` | Change of {change} from previous value ({previous}) exceeds threshold of {threshold} |
| `message.results.history.empty` | No previous results for this test |

### QA/QC Tab

| i18n Key | Default English Text |
|----------|----------------------|
| `heading.results.qaqc.controlResults` | Control Results |
| `heading.results.qaqc.selectedMethod` | Selected Method |
| `label.results.qaqc.status.pass` | QC Status: Passed |
| `message.results.qaqc.allPass` | All controls within acceptable range |
| `label.results.qaqc.online` | Online |
| `label.results.qaqc.offline` | Offline |
| `label.results.qaqc.manualEntry` | Manual entry |

### Actions & Row Footer

| i18n Key | Default English Text |
|----------|----------------------|
| `button.results.save` | Save Result |
| `button.results.addNote` | Note |
| `label.results.footer.method` | Method: |
| `label.results.footer.reagentLots` | reagent lots |
| `label.results.footer.noReagentLots` | No reagent lots |
| `label.results.footer.selectAnalyzer` | Select analyzer |

### Pagination

| i18n Key | Default English Text |
|----------|----------------------|
| `label.results.pagination.showing` | Showing |
| `label.results.pagination.to` | to |
| `label.results.pagination.of` | of |
| `label.results.pagination.results` | results |
| `label.results.pagination.show` | Show |
| `label.results.pagination.perPage` | per page |
| `button.results.pagination.previous` | Previous |
| `button.results.pagination.next` | Next |

---

## Validation Rules

| Field | Rule | Error i18n Key |
|-------|------|----------------|
| **Result Value** | Required before Save | `error.results.resultRequired` |
| **Result Value (numeric)** | Must be a valid number when test type is numeric | `error.results.resultNumeric` |
| **Lab Unit** | Required to trigger search (cannot search without selecting lab unit OR entering a query) | `error.results.labUnitRequired` |
| **Lab Number Range** | If "To" is provided, "From" is required | `error.results.labNumberFromRequired` |
| **Lab Number Range** | "To" value must be ≥ "From" value | `error.results.labNumberRangeInvalid` |
| **Order Date Range** | If "To" is provided, "From" is required | `error.results.dateFromRequired` |
| **Order Date Range** | "To" date must be ≥ "From" date | `error.results.dateRangeInvalid` |
| **Note Text** | Required if Add Note form is open and Save is clicked | `error.results.noteTextRequired` |
| **Interpretation Code Macro** | If typed code does not match any known code, it stays as plain text (no error, silent non-match) | — |
| **Referral Reason** | Required when "Refer this test" checkbox is checked | `error.results.referralReasonRequired` |
| **Referral Institute** | Required when "Refer this test" checkbox is checked | `error.results.referralInstituteRequired` |

---

## Security & Permissions

All write operations require explicit permission key enforcement at both UI layer (hide or disable control) and API layer (HTTP 403 for unauthorized requests).

| Action | Required Permission Key | UI Behavior if Denied | API Response if Denied |
|--------|------------------------|-----------------------|------------------------|
| View results list | `results.view` | Results Entry page hidden from menu | HTTP 403 |
| Enter / update result value | `results.modify` | Result input field read-only | HTTP 403 on PUT |
| Save result (send to Validation) | `results.modify` | Save button hidden | HTTP 403 on POST `/save` |
| Save interpretation | `results.modify` | Interpretation section read-only | HTTP 403 on POST `/interpretation` |
| Add note | `results.notes.add` | "New Note" button hidden | HTTP 403 on POST `/notes` |
| Upload attachment | `results.attachments.upload` | "Upload File" button hidden | HTTP 403 on POST `/attachments` |
| Delete attachment (result entry only) | `results.attachments.delete` | Delete button hidden | HTTP 403 on DELETE `/attachments/{id}` |
| Refer test to reference lab | `results.refer` | Referral tab hidden | HTTP 403 on POST `/refer` |

### Role Defaults

| Role | Default Permissions |
|------|---------------------|
| Lab Technician | `results.view`, `results.modify`, `results.notes.add`, `results.attachments.upload` |
| Lab Supervisor | All above + `results.refer`, `results.attachments.delete` |
| Lab Manager | All permissions |
| System Administrator | All permissions |

**Note:** Role defaults are configurable per-site. The above represents the recommended baseline configuration.

---

## Acceptance Criteria

### Unified Search
- [ ] Single search bar accepts lab number, patient name/ID, accession **[Search]**
- [ ] Quick filter for lab unit always visible (no "All" option) **[Search]**
- [ ] Lab unit must be selected before results load (blank by default) **[BR-002]**
- [ ] Advanced filters panel toggles via "Advanced" button **[Search]**
- [ ] Advanced filters include: Lab Number/Range, Order Date Range, Tests/Panels, Status **[Search]**
- [ ] Lab Number/Range supports single value or from/to range **[Search]**
- [ ] Tests/Panels is a multi-select field with search **[Search]**
- [ ] Tests/Panels dropdown shows panels grouped at top, tests below **[Search]**
- [ ] Selected tests/panels appear as removable chips **[Search]**
- [ ] Order Date Range supports from/to date selection **[Search]**
- [ ] Status filter defaults to "Pending" **[Search]**
- [ ] Active filters displayed as removable chips **[Search]**
- [ ] Result count displayed **[Search]**
- [ ] "Clear All Filters" resets to defaults **[Search]**
- [ ] "Apply Filters" applies filter changes **[Search]**

### Results Table
- [ ] Row displays sample info, test, analyzer, range, result input, status, flags, actions **[Table]**
- [ ] Patient name hidden in collapsed row (shows patient ID and age instead) **[BR-004]**
- [ ] Age calculated from DOB and displayed in collapsed view **[BR-005]**
- [ ] Full patient details (name, DOB) shown only when row expanded **[BR-004]**
- [ ] QC status indicator (colored dot) visible on each row **[Table]**
- [ ] Flag icons display with tooltips **[Table]**
- [ ] Result input adapts to test type (numeric input vs select list) **[Table]**
- [ ] Flagged results show highlighted input border **[Table]**
- [ ] Abnormal result (outside normal range): yellow border on input, yellow cell background **[BR-015]**
- [ ] Critical result (outside panic range): orange border, orange cell background, "C" badge in Flags column **[BR-015]**
- [ ] Invalid result (outside valid range): dark red border, dark red cell background, "!" badge in Flags column **[BR-015]**
- [ ] Critical value acknowledgment banner shown in expanded panel; Save button disabled until "I Acknowledge" clicked **[BR-016]**
- [ ] Acknowledgment resets when result value is changed after acknowledging **[BR-016]**
- [ ] Invalid range warning banner shown in dark red in expanded panel; Save button NOT blocked **[BR-017]**
- [ ] NCE badge (teal, outlined) shown in Flags column when result has one or more linked NCEs **[BR-019]**
- [ ] NCE badge tooltip shows NCE number, category, subcategory, severity, and status **[BR-019]**
- [ ] NCE badge renders in muted gray when NCE status is "closed" **[BR-019]**
- [ ] NCE badge appears immediately after tech files an NCE via the inline form, without page reload **[BR-019]**
- [ ] NCE badge coexists with H, L, Δ, C, and ! badges in the same Flags cell **[BR-019]**
- [ ] Row expands on click to show detail panel **[Table]**

### Method & Reagents Tab
- [ ] Shows as default tab when row expanded **[BR-006]**
- [ ] Method selection shows "Manual" and "Analyzer" options **[Method]**
- [ ] "Manual" is selected by default **[BR-006]**
- [ ] Manual option shows optional "Method Details" text field **[Method]**
- [ ] Method details text field supports method macro code expansion (type code + space) **[BR-014]**
- [ ] Selecting "Analyzer" shows list of available analyzers **[Method]**
- [ ] Selecting "Manual" clears analyzer selection **[Method]**
- [ ] Analyzer with failed QC shows confirmation dialog before selection **[BR-009]**
- [ ] Displays reagents linked to test with available lot options **[Method]**
- [ ] Lots sorted by FIFO (oldest received first) **[BR-008]**
- [ ] Oldest unexpired lot shows "FIFO Suggested" badge **[BR-008]**
- [ ] Expiring lots (within 7 days) show warning badge **[BR-008]**
- [ ] Expired lots not selectable **[BR-008]**
- [ ] Reagent selections are optional (not required to accept) **[BR-007]**

### Interpretation Section
- [ ] Appears below notes in expanded panel **[Interpretation]**
- [ ] Shows system-suggested interpretation **[Interpretation]**
- [ ] Lists all available interpretations with color badges, codes, ranges **[Interpretation]**
- [ ] Clicking any interpretation option selects it and copies text to textarea **[Interpretation]**
- [ ] Interpretation text field supports interpretation code macros **[BR-014]**
- [ ] Clear button resets selection and clears textarea **[Interpretation]**

### Notes Section
- [ ] Notes section always visible in expanded panel **[Notes]**
- [ ] Notes table shows date/time, author, type, and body **[Notes]**
- [ ] Note type shown as "In Lab Only" or "Send with Result" badge **[BR-010]**
- [ ] "New Note" button at bottom right of notes section **[Notes]**
- [ ] Note type defaults to "In Lab Only" **[BR-010]**
- [ ] "Save Note" and "Cancel" buttons functional **[Notes]**
- [ ] Empty state shows "No notes for this result" **[Notes]**

### Attachments Tab
- [ ] Source badge: "Order Entry" (purple) or "Result Entry" (teal) **[Attachments]**
- [ ] Delete button only for "Result Entry" files **[BR-011]**
- [ ] Order Entry files cannot be deleted — button hidden **[BR-011]**
- [ ] Upload, Download, and Delete actions functional **[Attachments]**

### History Tab
- [ ] Shows previous results in table format **[History]**
- [ ] Displays delta (% change) from previous **[History]**
- [ ] Delta check alert banner when threshold exceeded **[BR-012]**

### Actions
- [ ] "Save Result" button validates result value is entered before proceeding **[BR-013]**
- [ ] Saving result moves status to Awaiting Validation — no accept action exists on this page **[BR-013]**
- [ ] "Save Result" is the only bottom action (no Save Draft, no Accept) **[Actions]**

### Non-Functional
- [ ] All UI strings wrapped in `t(key, fallback)` — no hardcoded English strings in JSX
- [ ] All i18n keys listed in this Localization section are present in the message properties file
- [ ] Results list loads within 3 seconds for a lab unit with up to 500 pending results
- [ ] Row expansion loads method/reagent/QC data within 1 second (lazy-loaded on expand)
- [ ] Permissions enforced at API layer — all write endpoints return HTTP 403 for unauthorized users
- [ ] Feature tested with French locale to verify no layout breakage from longer strings
- [ ] WCAG 2.1 AA compliance verified: keyboard navigation, screen reader labels, color contrast
- Order Info tab with custom program fields
- Attachments tab (view order files, upload result files)
- Patient info banner (expanded view only)
- Patient privacy (name hidden until expanded)

---

## Admin Configuration — Results Entry

This section specifies configuration options accessible via **Admin → General Configuration → Results Entry Configuration**. These settings control behavior of the Results Entry page at the site level and do not require a code deployment to change.

---

### Setting: Show Patient Name in Results List

**Config key:** `results.entry.showPatientName`
**Type:** Boolean (toggle)
**Default:** `false`
**Scope:** Site-wide (applies to all users at the site)
**Location in Admin UI:** Admin › General Configuration › Results Entry Configuration

#### Description

Controls whether the patient's full name is visible in the **collapsed row** of the Results Entry table. This setting addresses the fact that different lab environments have different privacy postures:

- High-privacy environments (shared screens, open lab floors, accreditation requirements) should leave this **off** — the collapsed row shows patient ID, sex, and calculated age only.
- Labs where patient name is essential for rapid identification during bench work may turn this **on**.

Regardless of this setting, the patient's full name is **always visible** in the expanded detail panel (PatientBanner) when a row is opened, as that view is intended for single-sample focused review.

#### Behavior When Off (Default)

The collapsed table row shows:
```
DEV01250000000000
ID 3456789 · M · 14y
```

No patient name is visible. The tech can confirm identity by expanding the row if needed.

#### Behavior When On

The collapsed table row shows:
```
DEV01250000000000
Test, Patient
```

The patient's full name (Last, First format) is shown instead of the ID + sex + age line. Both the lab number and patient name are visible to anyone who can see the screen.

#### Rationale

| Concern | Notes |
|---------|-------|
| **ISO 15189 / HIPAA** | Some accreditation bodies and data protection laws restrict PII display in shared-screen or multi-user workstation environments. The off default protects most installations. |
| **Operational efficiency** | For labs where techs know their patients (e.g. small clinics), having the name visible speeds up triage without requiring an expand. |
| **Consistency** | Other OpenELIS views (Sample Reception, Validation) surface patient name more prominently; this setting brings Results Entry into alignment for labs that prefer it. |

#### Admin UI Specification

Location: **Admin › General Configuration › Results Entry Configuration**

```
Results Entry Configuration
───────────────────────────────────────────────────────

Display Options
  ┌───────────────────────────────────────────────────────────────────┐
  │  Show patient name in results list                          ● Off │
  │  When off, the collapsed row shows patient ID, sex, and age.      │
  │  The full name is always shown in the expanded detail panel.      │
  └───────────────────────────────────────────────────────────────────┘

                                           [ Cancel ]  [ Save Settings ]
```

Component: `Toggle` (`@carbon/react`) with helper text.

#### Implementation Notes

| Item | Detail |
|------|--------|
| **Config storage** | `site_information` table, key `results.entry.showPatientName`, value `true`/`false` |
| **API endpoint** | `GET /rest/siteInformation` returns this key alongside other site settings |
| **Frontend read** | On Results Entry page load, read config from site info API; store in page-level state |
| **Re-render scope** | Changing this setting requires a page reload to take effect (not real-time) |
| **Audit trail** | Admin save events for site configuration are already logged by the existing site info audit mechanism — no additional logging needed |
| **i18n key** | `admin.config.resultsEntry.showPatientName` |

#### Acceptance Criteria

- [ ] Setting toggle visible at Admin › General Configuration › Results Entry Configuration
- [ ] Default value is `false` (patient name hidden) for all new installations
- [ ] When `false`: collapsed row shows `ID [id] · [sex] · [age]y` — no name
- [ ] When `true`: collapsed row shows patient full name (Last, First)
- [ ] Expanded panel PatientBanner always shows full name regardless of setting
- [ ] Search by patient name in the search bar works regardless of setting
- [ ] Setting persists across page reloads and user sessions
- [ ] Change to setting takes effect after page reload (no live update required)
- [ ] Setting is site-wide — no per-user or per-role override in this version

---

## Future Considerations

1. **Bulk Actions** - Select multiple results for batch accept/reject
2. **Worklist Views** - Save custom filter combinations as named worklists
3. **Real-time Updates** - WebSocket for live result updates from analyzers
4. **Mobile Optimization** - Responsive design for tablet use at bench
5. **Per-role patient name visibility** - Allow role-based override of the `showPatientName` setting (e.g. supervisors always see names, bench techs do not)
5. **Audit Trail** - Full history of changes visible in expanded panel
