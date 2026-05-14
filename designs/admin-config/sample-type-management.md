# OpenELIS Global - Sample Type Management
## Functional Requirements Specification

**Version:** 1.0  
**Date:** January 2026  
**Module:** Administration → Sample Type Management  
**Route:** `/admin/sample-type-management`

---

## 1. Overview

### 1.1 Purpose

The Sample Type Management module provides a centralized interface for laboratory administrators to configure and maintain sample types (specimen types) used throughout OpenELIS Global. This module consolidates sample type configuration, storage/disposal defaults, test associations, and WHONET code mapping into a unified management experience.

### 1.2 Scope

This specification covers:

- Sample type creation, editing, and deactivation
- Display order management for dropdowns and lists
- Bidirectional test association management
- Storage and disposal default configuration
- WHONET specimen code mapping for AMR surveillance exports

### 1.3 Key Users

| Role | Primary Activities |
|------|-------------------|
| Lab Administrator | Full CRUD operations, configuration management |
| Lab Manager | View and edit sample types, manage test associations |
| Quality Manager | Review storage/disposal requirements |
| Surveillance Officer | Configure WHONET mappings for exports |

---

## 2. Sample Type List View (Dashboard)

### 2.1 Route
`/admin/sample-type-management`

### 2.2 Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Sample Type Management                                    [+ Add Sample Type]│
│ Configure sample types, storage defaults, and test associations              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Search sample types...        ] [Status: All ▼] [Export] [Import]        │
├──────────────────────────────────────────────────────────────────────────────┤
│ □ │ Sample Type Name    │ Order │ WHONET │ Tests  │ Storage Default  │Status │
│───┼─────────────────────┼───────┼────────┼────────┼──────────────────┼───────│
│ □ │ Serum               │  (1)  │  bl    │ 87     │ 2-8°C • 72h      │Active │
│ □ │ Plasma (EDTA)       │  (2)  │  bl    │ 45     │ 2-8°C • 48h      │Active │
│ □ │ Plasma (Heparin)    │  (3)  │  bl    │ 23     │ 2-8°C • 48h      │Active │
│ □ │ Whole Blood         │  (4)  │  bl    │ 34     │ Room Temp • 24h  │Active │
│ □ │ Urine - Random      │  (5)  │  ur    │ 28     │ 2-8°C • 24h      │Active │
│ □ │ CSF                 │  (7)  │  cs    │ 12     │ Room Temp • 1h   │Active │
│ □ │ Synovial Fluid      │ (12)  │  sf    │  3     │ Room Temp • 1h   │Inact. │
└──────────────────────────────────────────────────────────────────────────────┘
│ Showing 12 of 12 sample types                           [< 1 2 3 ... >]      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Dashboard Columns

| Column | Description | Display |
|--------|-------------|---------|
| Checkbox | Row selection for bulk actions | Checkbox |
| Sample Type Name | Name as clickable link to editor | Link text |
| Display Order | Numeric order in circular badge | Badge (1), (2), etc. |
| WHONET Code | Mapped WHONET specimen code | Purple tag or "—" |
| Tests Assigned | Count of tests using this sample type | Blue badge "N tests" |
| Storage Default | Temperature and duration | "2-8°C • 72h" format |
| Status | Active/Inactive state | Green/Gray tag |
| Actions | Edit button, overflow menu | Icon buttons |

### 2.4 Toolbar Features

| Feature | Description |
|---------|-------------|
| Search | Filter by sample type name (case-insensitive) |
| Status Filter | All / Active / Inactive dropdown |
| Export | Export sample type configuration |
| Import | Import sample type configuration |
| Add Sample Type | Primary action button |

### 2.5 Bulk Actions

When one or more rows are selected:

| Action | Description |
|--------|-------------|
| Activate | Set selected sample types to active |
| Deactivate | Set selected sample types to inactive |
| Export Selected | Export only selected sample types |

### 2.6 Row Actions (Overflow Menu)

| Action | Description |
|--------|-------------|
| Edit | Open sample type editor |
| Duplicate | Create copy with "(Copy)" suffix |
| Activate/Deactivate | Toggle active status |
| Delete | Remove sample type (with confirmation) |

---

## 3. Sample Type Editor

### 3.1 Route
`/admin/sample-type-management/{id}/edit` or `/admin/sample-type-management/new`

### 3.2 Layout Structure

The editor uses a vertical tab navigation pattern with 5 tabs:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [← Back]  Edit: Serum                                    [Cancel] [Save]     │
│           Configure sample type properties                                    │
├────────────────┬─────────────────────────────────────────────────────────────┤
│                │                                                             │
│ 📄 Basic Info  │  [Tab Content Area]                                        │
│                │                                                             │
│ ↕️ Display     │                                                             │
│    Order       │                                                             │
│                │                                                             │
│ 🔬 Associated  │                                                             │
│    Tests       │                                                             │
│                │                                                             │
│ 🌡️ Storage &   │                                                             │
│    Disposal    │                                                             │
│                │                                                             │
│ 🔗 WHONET      │                                                             │
│    Mapping     │                                                             │
│                │                                                             │
└────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 4. Tab 1: Basic Info

### 4.1 Purpose
Define the sample type name, description, and active status.

### 4.2 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Sample Type Name | Text input | Yes | Display name (appears in order entry, results, reports) |
| Description | Text area | No | Optional notes or collection instructions |
| Active Status | Toggle | Yes | Controls visibility in order entry dropdowns |

### 4.3 Validation Rules

| Rule | Message |
|------|---------|
| Name is required | "Sample type name is required" |
| Name must be unique | "A sample type with this name already exists" |
| Name max length 100 chars | "Name cannot exceed 100 characters" |

### 4.4 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Basic Information                                           │
│ Define the sample type name and basic properties            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Sample Type Name *                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Serum                                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│ This name will appear in order entry, result entry, reports │
│                                                             │
│ Description                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Separated from clotted whole blood. Allow to clot for   │ │
│ │ 30 minutes before centrifugation.                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Active Status                                    [====] │ │
│ │ Inactive sample types won't appear in order entry       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Tab 2: Display Order

### 5.1 Purpose
Control the order in which sample types appear in dropdown menus and selection lists throughout the application.

### 5.2 Functionality

| Feature | Description |
|---------|-------------|
| Drag and Drop | Reorder items by dragging |
| Arrow Buttons | Move item up/down one position |
| Current Highlight | Currently edited sample type is highlighted |
| Active Only | Only active sample types shown in ordering list |

### 5.3 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Sample Type Display Order                                   │
│ Drag and drop to reorder how sample types appear            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⋮⋮  (1)  Serum                             [Current] ↑↓│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ⋮⋮  (2)  Plasma (EDTA)                               ↑↓│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ⋮⋮  (3)  Plasma (Heparin)                            ↑↓│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ⋮⋮  (4)  Whole Blood (EDTA)                          ↑↓│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ⋮⋮  (5)  Urine - Random                              ↑↓│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ This order determines appearance in order entry dropdowns.  │
│ Only active sample types are shown here.                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Tab 3: Associated Tests

### 6.1 Purpose
Manage the bidirectional relationship between sample types and tests. Tests can be added to or removed from a sample type directly from this interface.

### 6.2 Functionality

| Feature | Description |
|---------|-------------|
| View Associated Tests | List all tests currently using this sample type |
| Add Tests | Open modal to select and add tests |
| Remove Tests | Remove test association with confirmation |
| Search | Filter displayed tests by name, section, or LOINC |

### 6.3 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Associated Tests                              [+ Add Tests] │
│ Tests that use this sample type for ordering                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Note: Adding or removing tests here will update the     │ │
│ │ test's sample type assignment. Changes applied on save. │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [🔍 Search tests...                                       ] │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Glucose, Fasting                                        │ │
│ │ Chemistry • LOINC: 1558-6                 [Active]  🗑️  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Creatinine                                              │ │
│ │ Chemistry • LOINC: 2160-0                 [Active]  🗑️  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ BUN                                                     │ │
│ │ Chemistry • LOINC: 3094-0                 [Active]  🗑️  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 8 test(s) associated with this sample type                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Add Tests Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Add Tests to Sample Type                               [✕]  │
│ Select tests to associate with this sample type             │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search by test name, section, or LOINC...             ] │
├─────────────────────────────────────────────────────────────┤
│ 3 test(s) selected                        [Clear selection] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ☑ Hemoglobin A1c                                           │
│   Chemistry • LOINC: 4548-4                        [Active] │
│                                                             │
│ ☑ Lipid Panel                                              │
│   Chemistry • LOINC: 24331-1                       [Active] │
│                                                             │
│ ☐ Thyroid Panel                                            │
│   Chemistry • LOINC: 34530-6                       [Active] │
│                                                             │
│ ☑ Electrolytes                                             │
│   Chemistry • LOINC: 24326-1                       [Active] │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                    [Cancel] [Add 3 Test(s)] │
└─────────────────────────────────────────────────────────────┘
```

### 6.5 Remove Test Confirmation Modal

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Remove Test from Sample Type?                           │
│                                                             │
│ Are you sure you want to remove "Glucose, Fasting" from     │
│ this sample type? The test will no longer be associated     │
│ with this sample type for ordering.                         │
│                                                             │
│                              [Cancel] [Remove Test]         │
└─────────────────────────────────────────────────────────────┘
```

### 6.6 Business Rules

| Rule | Description |
|------|-------------|
| Bidirectional Update | Adding/removing a test updates the test's sample type field |
| No Orphan Tests | Tests must have at least one sample type (warning if removing last) |
| Batch Selection | Multiple tests can be added at once |
| Already Assigned | Tests already assigned to this sample type are excluded from add modal |

---

## 7. Tab 4: Storage & Disposal

### 7.1 Purpose
Configure default storage conditions and disposal requirements for samples of this type. These defaults apply to all tests using this sample type unless overridden at the test level.

### 7.2 Storage Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Storage Conditions | Dropdown with suggestions | No | Temperature requirements |
| Storage Duration | Number | No | Maximum time before testing |
| Storage Duration Unit | Select (Hours/Days/Weeks) | Conditional | Required if duration specified |

### 7.3 Storage Condition Suggestions

- 2–8°C (Refrigerated)
- -20°C (Frozen)
- -70°C (Ultra-frozen)
- Room Temperature (15–25°C)
- Protected from Light

### 7.4 Disposal Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Disposal Method | Select | No | How samples should be disposed |
| Disposal Timeframe | Number | No | Time after completion before disposal |
| Disposal Timeframe Unit | Select (Hours/Days/Weeks) | Conditional | Required if timeframe specified |
| Special Instructions | Text area | No | Additional handling notes (max 1000 chars) |

### 7.5 Disposal Methods

| Method | Description |
|--------|-------------|
| Biohazard Bin | Standard biohazard waste container |
| Incineration | High-temperature destruction |
| Chemical Deactivation | Chemical neutralization before disposal |
| Autoclave Sterilization | Steam sterilization before disposal |
| Standard Medical Waste | Non-hazardous medical waste |
| Sharps Container | For needles and sharp objects |

### 7.6 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Storage Conditions                                          │
│ Default storage requirements (can be overridden at test)    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Storage Conditions                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 2–8°C (Refrigerated)                                  ▼ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Storage Duration              Unit                          │
│ ┌───────────────────────┐     ┌───────────────────────────┐ │
│ │ 72                    │     │ Hours                   ▼ │ │
│ └───────────────────────┘     └───────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Disposal Requirements                                       │
│ Default disposal method and timeframe                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Disposal Method                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Biohazard Bin                                         ▼ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Special Instructions                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Protect from light. Do not freeze.                      │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Tab 5: WHONET Mapping

### 8.1 Purpose
Map the sample type to a WHONET specimen code for antimicrobial resistance (AMR) surveillance exports. Supports both standard WHONET codes and custom codes.

### 8.2 Functionality

| Feature | Description |
|---------|-------------|
| Select WHONET Code | Choose from list of standard codes |
| Add Custom Code | Create a new custom WHONET code |
| Search Codes | Filter code list by code or name |
| No Mapping Option | Explicitly exclude from WHONET exports |

### 8.3 Standard WHONET Specimen Codes

| Code | Name |
|------|------|
| bl | Blood |
| ur | Urine |
| sp | Sputum |
| cs | Cerebrospinal fluid |
| st | Stool/feces |
| wo | Wound |
| sf | Synovial fluid |
| ba | Bronchoalveolar lavage |
| pl | Pleural fluid |
| pf | Peritoneal fluid |
| ge | Genital |
| ti | Tissue |
| ey | Eye |
| ea | Ear |
| th | Throat |
| np | Nasopharynx |

### 8.4 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ WHONET Specimen Code Mapping                [+ Add New Code]│
│ Map to WHONET code for AMR surveillance exports             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✓ Currently mapped to "bl" (Blood)                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [🔍 Search WHONET codes...                                ] │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ○  —   No mapping (exclude from export)                 │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ● [bl] Blood                                            │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ○ [ur] Urine                                            │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ○ [sp] Sputum                                           │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ○ [cs] Cerebrospinal fluid                              │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ○ [af] Amniotic fluid                        [Custom]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ WHONET codes are used for AMR surveillance reporting.       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.5 Add WHONET Code Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Add New WHONET Code                                    [✕]  │
│ Create a custom WHONET specimen code                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ Custom Code                                          │ │
│ │ Custom codes may not be recognized by WHONET software.  │ │
│ │ Use standard WHONET codes when possible.                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Code *                                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ af                                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ 2-4 character code (lowercase)                              │
│                                                             │
│ Specimen Name *                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Amniotic fluid                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                       [Cancel] [Add Code]   │
└─────────────────────────────────────────────────────────────┘
```

### 8.6 Validation Rules

| Rule | Message |
|------|---------|
| Code is required | "Code is required" |
| Name is required | "Specimen name is required" |
| Code max 4 characters | "Code must be 4 characters or less" |
| Code must be unique | "This code already exists" |
| Code lowercase only | Code auto-converted to lowercase |

---

## 9. Data Model

### 9.1 Sample Type Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto | Primary key |
| name | String(100) | Yes | Display name |
| description | String(500) | No | Optional description |
| displayOrder | Integer | Yes | Sort order in dropdowns |
| active | Boolean | Yes | Active status (default: true) |
| whonetCode | String(4) | No | WHONET specimen code |
| storageConditions | String(100) | No | Storage temperature/conditions |
| storageDuration | Integer | No | Storage duration value |
| storageDurationUnit | Enum | No | Hours/Days/Weeks |
| disposalMethod | String(50) | No | Disposal method |
| disposalTimeframe | Integer | No | Disposal timeframe value |
| disposalTimeframeUnit | Enum | No | Hours/Days/Weeks |
| specialInstructions | String(1000) | No | Special handling instructions |
| createdAt | Timestamp | Auto | Creation timestamp |
| updatedAt | Timestamp | Auto | Last update timestamp |

### 9.2 Sample Type - Test Relationship

| Field | Type | Description |
|-------|------|-------------|
| sampleTypeId | UUID (FK) | Reference to sample type |
| testId | UUID (FK) | Reference to test |

---

## 10. Permissions

### 10.1 Permission Codes

| Code | Description |
|------|-------------|
| `sampleType.view` | View sample types |
| `sampleType.create` | Create new sample types |
| `sampleType.edit` | Edit existing sample types |
| `sampleType.delete` | Delete sample types |
| `sampleType.import` | Import sample type configuration |
| `sampleType.export` | Export sample type configuration |

### 10.2 Role Assignments

| Role | Permissions |
|------|-------------|
| Lab Administrator | All permissions |
| Lab Manager | view, edit |
| Quality Manager | view |
| Lab Technician | view |

---

## 11. Acceptance Criteria

### 11.1 Sample Type CRUD
- [ ] **AC-01**: Users can create a new sample type with required fields
- [ ] **AC-02**: Users can edit existing sample type properties
- [ ] **AC-03**: Users can activate/deactivate sample types
- [ ] **AC-04**: Inactive sample types do not appear in order entry dropdowns
- [ ] **AC-05**: Sample type names must be unique

### 11.2 Display Order
- [ ] **AC-06**: Users can reorder sample types via drag-and-drop
- [ ] **AC-07**: Users can reorder sample types via up/down buttons
- [ ] **AC-08**: Display order is reflected in all dropdowns

### 11.3 Test Associations
- [ ] **AC-09**: Users can view tests associated with a sample type
- [ ] **AC-10**: Users can add tests to a sample type
- [ ] **AC-11**: Users can remove tests from a sample type
- [ ] **AC-12**: Test association changes update the test's sample type field

### 11.4 Storage & Disposal
- [ ] **AC-13**: Users can configure storage conditions and duration
- [ ] **AC-14**: Users can configure disposal method and instructions
- [ ] **AC-15**: Defaults are inherited by tests unless overridden

### 11.5 WHONET Mapping
- [ ] **AC-16**: Users can map sample types to WHONET codes
- [ ] **AC-17**: Users can create custom WHONET codes
- [ ] **AC-18**: Unmapped sample types are excluded from WHONET exports
- [ ] **AC-19**: Custom codes are labeled as such in the UI

---

## 12. Related Specifications

| Document | Description |
|----------|-------------|
| **Test Catalog Management FRS** | Test configuration with sample type assignment |
| **WHONET Integration FRS** | Export functionality using specimen codes |
| **Sample Storage & Disposal FRS** | Detailed storage/disposal tracking |
| **Order Entry FRS** | Sample type selection during ordering |

---

## 13. Future Enhancements (Out of Scope v1)

1. **Sample Type Groups** - Group related sample types for easier management
2. **Collection Instructions** - Detailed patient collection instructions per sample type
3. **Container Requirements** - Specify required tubes/containers per sample type
4. **Volume Requirements** - Minimum/optimal sample volumes
5. **Rejection Criteria** - Define sample rejection rules per sample type
6. **Stability Matrix** - Define stability by analyte and storage condition
