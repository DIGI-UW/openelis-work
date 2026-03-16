# OpenELIS Global - Pathology Case View Redesign
## Functional Requirements Specification

**Version:** 1.0  
**Date:** December 2025  
**Module:** Pathology → Case Detail View  
**Route:** `/PathologyCaseView/:caseId`

---

## 1. Overview

### 1.1 Problem Statement

The current Pathology Case View presents as one monolithic form, making it:
- Overwhelming for users who only handle specific workflow stages
- Unclear which sections are relevant to the current case status
- Difficult to track progress through the multi-stage workflow
- Easy to miss the report generation step, which is buried in the form

### 1.2 Solution Summary

Redesign the Case View with:
- **Anchored sidebar navigation** showing workflow stages with completion progress
- **Collapsible sections** that indicate why disabled stages aren't accessible yet
- **Separated Block and Slide management** tables instead of nested inline entry
- **Sticky footer action bar** with Save and Generate Report actions
- **Reports tab** displaying generated reports with download/print/email actions

### 1.3 Users

| Role | Primary Actions |
|------|-----------------|
| Lab Technician | Grossing, Block/Slide management, Staining, assign to Pathologist |
| Pathologist | Review slides, enter findings, conclusions, approve for release |
| Lab Manager | Full access, reassign cases, generate reports |

---

## 2. Layout Structure

### 2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header (existing OpenELIS header)                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Breadcrumb: Home / Pathology / Case 24TST000010                     │
│ Page Title: Pathology Case - [Lab Number]                           │
│ Patient: [Last Name, First Name] | DOB: [Date] | Gender: [M/F]      │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                      │
│   Sidebar    │              Main Content Area                       │
│   (240px)    │              (Scrollable)                            │
│              │                                                      │
│  - Case Info │  ┌─────────────────────────────────────────────┐    │
│  - Grossing  │  │ Section Content                              │    │
│  - Blocks    │  │ (Collapsible sections)                       │    │
│  - Slides    │  │                                              │    │
│  - Staining  │  └─────────────────────────────────────────────┘    │
│  - Review    │                                                      │
│  - Findings  │                                                      │
│  - Conclusion│                                                      │
│  - Reports   │                                                      │
│              │                                                      │
├──────────────┴──────────────────────────────────────────────────────┤
│ Sticky Footer Action Bar                                            │
│ [Discard Changes]                    [Save Progress] [Generate Report]│
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Sidebar Navigation

The sidebar is fixed/sticky and scrolls with the page. Each navigation item shows:
- Section name
- Progress indicator (e.g., "2/4 fields")
- Visual status icon (empty circle / partial fill / checkmark)
- **Pending request indicator** (orange badge with count if requests exist)

**Navigation Items:**
1. Case Information (read-only summary)
2. Grossing
3. Blocks *(shows badge if block requests pending)*
4. Slides *(shows badge if slide requests pending)*
5. Staining *(shows badge if stain requests pending)*
6. Pathologist Review
7. Findings & Conclusions
8. Reports

**Click behavior:** Smooth scroll to section anchor

**Pending Request Indicator:**
When pathologist requests exist for a section, display an orange notification badge:

```
┌─ Sidebar ────────────────────┐
│                              │
│  ✓ Case Information          │
│  ✓ Grossing           2/2    │
│  ◐ Blocks         ⚠1  1/3    │  ← Orange badge "⚠1" = 1 pending block request
│  ◐ Slides         ⚠2  3/5    │  ← Orange badge "⚠2" = 2 pending slide requests
│  ◐ Staining       ⚠1  4/5    │  ← Orange badge "⚠1" = 1 pending stain request
│  ○ Pathologist Review        │
│  ○ Findings & Conclusions    │
│  ○ Reports                   │
│                              │
└──────────────────────────────┘
```

**Badge Styling:**
- Background: Orange (#ff8f00)
- Text: White, bold
- Position: Between section name and progress
- Tooltip on hover: "X pending request(s) from pathologist"

### 2.3 Section States

| State | Visual Treatment |
|-------|------------------|
| **Active** | Expanded, fully interactive, blue left border |
| **Completed** | Collapsed by default, green checkmark, expandable |
| **Upcoming** | Collapsed, greyed out, shows prerequisite message |
| **Disabled** | Greyed out, tooltip explaining why (permissions/workflow) |
| **Has Pending Requests** | Orange badge with count, section name slightly highlighted |

**Upcoming Section Message Example:**
> "This section will be available after the case reaches 'Ready for Pathologist' status."

---

## 3. Section Specifications

### 3.1 Case Information (Read-Only Header)

Always visible at top of main content area. Not collapsible.

| Field | Source |
|-------|--------|
| Lab Number | Order |
| Request Date | Order |
| Patient Name | Patient |
| Date of Birth | Patient |
| Gender | Patient |
| Unit Number | Patient |
| Private Reference Number | Order |
| Referring Provider | Order |
| Specimen | Order |
| Specimen Type | Order |
| Nature/Site of Specimen | Order |
| Procedure Performed | Order |
| Provisional Clinical Diagnosis | Order |
| Previous Surgery / Treatment | Order |
| Clinical History | Order |
| Current Status | Case |
| Assigned Technician | Case |
| Assigned Pathologist | Case |

**Layout:** Three-column grid for efficient space use. Clinical fields (Diagnosis, History, Previous Treatment) span full width.

---

### 3.2 Grossing Section

**Status triggers:** Available immediately when case is created.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Status | Dropdown | Yes | Grossing → Processing → Cutting → Slicing → Staining → Ready for Pathologist |
| Assigned Technician | Dropdown/Autocomplete | No | Select user or leave for queue |
| Specimen Received Date | Date picker | Yes | When specimen arrived |
| Specimen Condition | Dropdown | No | Adequate / Compromised / Insufficient |
| Gross Description | Rich text (Quill) | No | Free-text description of specimen |
| Notes | Textarea | No | Internal notes |

**Progress calculation:** Count of required fields completed / total required fields

---

### 3.3 Blocks Section

**Status triggers:** Available after Grossing is saved.

**Layout:** Data table with bulk-add capability.

#### 3.3.1 Block and Slide Barcode Format

All blocks and slides use a hierarchical barcode format ensuring uniqueness across the system:

| Entity | Barcode Format | Example |
|--------|----------------|---------|
| Block | `{lab_number}.{block_id}` | `24TST000010.A1` |
| Slide | `{lab_number}.{block_id}.{slide_id}` | `24TST000010.A1.S001` |

**Barcode Specifications:**
- Format: Code 128 (default) or QR Code (configurable in Admin)
- The lab number component uses the Pathology case lab number
- Block IDs are unique within a case (A, B, C or A1, A2, B1, etc.)
- Slide IDs are sequential within a case (S001, S002, etc.)
- Maximum barcode length: 30 characters

#### 3.3.2 Block List Display

**Table Columns:**

| Column | Type | Description |
|--------|------|-------------|
| Block ID | Auto-generated | Sequential (A, B, C or 1, 2, 3) |
| Barcode | Auto-generated | `{lab_number}.{block_id}` format |
| Location | Text input | Storage location (e.g., "Rack 2, Slot 5") |
| Tissue Type | Typeahead + Add New | From dictionary (see below) |
| Created Date | Auto | Timestamp |
| Actions | Buttons | Print Label, Remove |

**Tissue Type Field Behavior:**
- Typeahead search: User types to filter existing dictionary values
- Dropdown shows matching results as user types (min 1 character)
- Results sourced from Dictionary Category: "Pathology - Tissue Types"
- **Add New option:** If no match found, show "+ Add '[typed value]' as new tissue type"
- Clicking "Add New" creates dictionary entry and selects it
- New entries require `dictionary.entry.create` permission; if user lacks permission, show "Request new tissue type from administrator"

**Actions:**
- **Add Block(s)** button opens modal:
  - Number to add (default 1, max 20)
  - Optional: pre-fill location pattern
- **Print Labels** dropdown for batch printing
- **Request Additional** button (orange outline, positioned right):
  - Opens Request Additional modal with type pre-set to "BLOCK"
  - Allows pathologists/users to request additional blocks from technicians
- **Remove** with confirmation (only if no slides attached, or warn)

**Progress calculation:** "X blocks added"

#### 3.3.3 Print Block Labels Modal

Accessed via "Print Labels" button in Blocks section header or row action menu.

```
┌─ Print Block Labels ────────────────────────────────────────────────┐
│                                                                     │
│  Case: 24TST000010 | Patient: DOE, JANE                             │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                     │
│  Select blocks to print:                                            │
│  [✓ Select All]  [Deselect All]                                     │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ ☑ │ Block │ Barcode           │ Tissue Type        │ Copies  │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ ☑ │ A1    │ 24TST000010.A1    │ Breast, LUQ        │ [1]     │  │
│  │ ☑ │ A2    │ 24TST000010.A2    │ Breast, LUQ        │ [1]     │  │
│  │ ☐ │ B1    │ 24TST000010.B1    │ Lymph node, axilla │ [1]     │  │
│  │ ☐ │ C1    │ 24TST000010.C1    │ Margin, superior   │ [1]     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│                                                                     │
│  Label Configuration                                                │
│                                                                     │
│  Label Preset:                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ [Block Label - Standard (1" x 0.5")                     ▼]  │   │
│  │  ○ Block Label - Standard (1" x 0.5")                       │   │
│  │  ○ Block Label - Large (1.5" x 0.75")                       │   │
│  │  ○ Freezer Block Label (1" x 0.375")                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Barcode Type:  (•) Code 128   ( ) QR Code                          │
│                                                                     │
│  Include on label:                                                  │
│  ☑ Patient Name        ☑ DOB           ☑ Tissue Type                │
│  ☑ Collection Date     ☐ Pathologist   ☑ Block ID                   │
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│                                                                     │
│  Preview:                                                           │
│  ┌─────────────────────────────────────┐                            │
│  │ ║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║║    │                            │
│  │ 24TST000010.A1                      │                            │
│  │ DOE, JANE  1965-07-22               │                            │
│  │ Breast, LUQ                         │                            │
│  └─────────────────────────────────────┘                            │
│                                                                     │
│  Total labels to print: 2                                           │
│                                                                     │
│                                    [Cancel]  [🖨 Print Labels]      │
└─────────────────────────────────────────────────────────────────────┘
```

**Label Presets:**
- Label presets are configured in Admin > Barcode Configuration > Label Presets
- Block and slide labels can have different default presets
- Presets define: dimensions, margins, font sizes, barcode size, content layout

---

### 3.4 Slides Section

**Status triggers:** Available after at least one Block exists OR independently.

**Layout:** Data table with bulk-add capability.

#### 3.4.1 Slide List Display

**Table Columns:**

| Column | Type | Description |
|--------|------|-------------|
| Slide ID | Auto-generated | Sequential (S001, S002, etc.) |
| Barcode | Auto-generated | `{lab_number}.{block_id}.{slide_id}` format |
| Source Block | Dropdown | Optional link to block |
| Location | Text input | Storage location |
| Stain Type | Dropdown | H&E, Special stains from dictionary |
| Scanned Image | File upload | Digital slide image |
| Created Date | Auto | Timestamp |
| Actions | Buttons | Print Label, View Image, Remove |

**Actions:**
- **Add Slide(s)** button opens modal:
  - Number to add (default 1, max 50)
  - Source block (optional, multi-select)
  - Default stain type
- **Print Labels** dropdown for batch printing
- **Upload Scanned Slides** - bulk file upload with auto-matching
- **Request Additional** button (orange outline, positioned right):
  - Opens Request Additional modal with type pre-set to "SLIDE"
  - Allows pathologists/users to request additional slides from technicians

**Progress calculation:** "X slides added"

#### 3.4.2 Print Slide Labels Modal

Accessed via "Print Labels" button in Slides section header, row action menu, or "Print Selected" button.

```
┌─ Print Slide Labels ────────────────────────────────────────────────┐
│                                                                     │
│  Case: 24TST000010 | Patient: DOE, JANE                             │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                     │
│  Select slides to print:                                            │
│  [✓ Select All]  [Deselect All]  Filter: [All Blocks ▼]             │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ ☑ │ Slide │ Barcode              │ Stain    │ Block │ Copies │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ ☑ │ S001  │ 24TST000010.A1.S001  │ H&E      │ A1    │ [1]    │  │
│  │ ☑ │ S002  │ 24TST000010.A1.S002  │ H&E      │ A1    │ [1]    │  │
│  │ ☐ │ S003  │ 24TST000010.A2.S003  │ H&E      │ A2    │ [1]    │  │
│  │ ☐ │ S004  │ 24TST000010.B1.S004  │ PAS      │ B1    │ [1]    │  │
│  │ ☐ │ S005  │ 24TST000010.B1.S005  │ Trichrome│ B1    │ [1]    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│                                                                     │
│  Label Configuration                                                │
│                                                                     │
│  Label Preset:                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ [Slide Label - Standard (1" x 0.375")                   ▼]  │   │
│  │  ○ Slide Label - Standard (1" x 0.375")                     │   │
│  │  ○ Slide Label - Wide (1.25" x 0.375")                      │   │
│  │  ○ Slide Label - Mini (0.75" x 0.25")                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Barcode Type:  (•) Code 128   ( ) QR Code   ( ) DataMatrix         │
│                                                                     │
│  Include on label:                                                  │
│  ☑ Patient Name        ☑ Stain Code       ☑ Block ID                │
│  ☐ DOB                 ☑ Collection Date  ☐ Tissue Type             │
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│                                                                     │
│  Preview:                                                           │
│  ┌─────────────────────────────────────┐                            │
│  │ ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌             │                            │
│  │ 24TST000010.A1.S001                 │                            │
│  │ DOE, JANE | H&E | A1                │                            │
│  └─────────────────────────────────────┘                            │
│                                                                     │
│  Total labels to print: 2                                           │
│                                                                     │
│                                    [Cancel]  [🖨 Print Labels]      │
└─────────────────────────────────────────────────────────────────────┘
```

**Slide Label Notes:**
- Slide labels are typically smaller than block labels due to limited surface area
- Stain code is often more important than full stain name on slide labels
- QR or DataMatrix codes work better for small labels
- Label presets configured in Admin > Barcode Configuration > Label Presets

#### 3.4.3 Upload Scanned Slides Modal

Accessed via "Upload Scanned Slides" button in Slides section header.

```
┌─ Upload Scanned Slides ─────────────────────────────────────────────┐
│                                                                     │
│  Case: 24TST000010 | Patient: DOE, JANE                             │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │     📁 Drag and drop slide images here                      │   │
│  │        or click to browse                                   │   │
│  │                                                             │   │
│  │     Supported formats: .svs, .ndpi, .tiff, .jpg, .png       │   │
│  │     Max file size: 2GB per file                             │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│                                                                     │
│  Auto-Match by Barcode: (•) Enabled  ( ) Disabled                   │
│  ℹ️ When enabled, files named with barcodes will auto-match         │
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│                                                                     │
│  Pending Uploads:                                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ File Name              │ Match       │ Status      │ Action   │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ 24TST000010.A.S001.svs │ ✓ S001      │ Ready       │ [×]      │  │
│  │ 24TST000010.A.S002.svs │ ✓ S002      │ Ready       │ [×]      │  │
│  │ slide_unknown.tiff     │ ⚠ Select ▼  │ Needs Match │ [×]      │  │
│  │                        │ ┌─────────┐ │             │          │  │
│  │                        │ │ S003    │ │             │          │  │
│  │                        │ │ S004    │ │             │          │  │
│  │                        │ │ S005    │ │             │          │  │
│  │                        │ └─────────┘ │             │          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│                                                                     │
│  ☐ Overwrite existing images if slide already has scan              │
│                                                                     │
│  3 files selected, 2 ready to upload                                │
│                                                                     │
│                         [Cancel]  [📤 Upload 2 Files]               │
└─────────────────────────────────────────────────────────────────────┘
```

**Upload Behavior:**
- Auto-match: Parses filename for barcode pattern (`{labno}.{blockid}.{slideid}`)
- Manual match: Dropdown shows unmatched slides for manual assignment
- Duplicate handling: Option to overwrite or skip existing scans
- Progress indicator shown during upload
- Success toast: "X slides uploaded successfully"

**Supported Formats:**
- Whole Slide Images: `.svs`, `.ndpi`, `.vsi`, `.scn`, `.mrxs`
- Standard Images: `.tiff`, `.tif`, `.jpg`, `.jpeg`, `.png`
- DICOM: `.dcm`

#### 3.4.4 View Digital Slide Modal

Accessed via "View" button in Slides table or clicking slide thumbnail.

```
┌─ Digital Slide Viewer ──────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─ Slide Details ────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │  Slide: S001                    Barcode: 24TST000010.A.S001             │ │
│  │  Block: A (Liver - Central)     Tissue: Liver - Central                 │ │
│  │                                                                         │ │
│  │  ┌─ Staining Information ─────────────────────────────────────────────┐ │ │
│  │  │ Stain Type    │ H&E (Hematoxylin & Eosin)                          │ │ │
│  │  │ Stain Status  │ ● Complete                                         │ │ │
│  │  │ Stained Date  │ 2024-08-08                                         │ │ │
│  │  │ Stained By    │ ELIS, Open                                         │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                         │ │
│  │  ┌─ Scan Information ─────────────────────────────────────────────────┐ │ │
│  │  │ Scanned Date  │ 2024-08-09 14:32                                   │ │ │
│  │  │ Scanner       │ Aperio AT2                                         │ │ │
│  │  │ Magnification │ 40x                                                │ │ │
│  │  │ File Size     │ 1.2 GB                                             │ │ │
│  │  │ Resolution    │ 98,304 × 65,536 px                                 │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ Image Viewer ───────────────────────────────────────────────────────────┐
│  │                                                                           │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  │                                                                     │ │
│  │  │                                                                     │ │
│  │  │                                                                     │ │
│  │  │                    [Whole Slide Image Preview]                      │ │
│  │  │                                                                     │ │
│  │  │                         🔬                                          │ │
│  │  │                                                                     │ │
│  │  │                                                                     │ │
│  │  │                                                                     │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │
│  │                                                                           │
│  │  ┌───────────────────────────────────────────────────────────────────┐   │
│  │  │ [−]  ────●──────────────────────────  [+]    Zoom: 4x             │   │
│  │  └───────────────────────────────────────────────────────────────────┘   │
│  │                                                                           │
│  │  [🔍 Fit to Screen]  [1:1 Actual Size]  [⛶ Full Screen]  [💾 Download]   │
│  │                                                                           │
│  └───────────────────────────────────────────────────────────────────────────┘
│                                                                             │
│  ┌─ Navigation ─────────────────────────────────────────────────────────────┐
│  │  [← Previous Slide (S002)]              [Next Slide (S003) →]            │
│  └───────────────────────────────────────────────────────────────────────────┘
│                                                                             │
│                                                               [Close]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Viewer Features:**
- **Pan & Zoom**: Click-drag to pan, scroll wheel or slider to zoom
- **Zoom Levels**: 1x, 2x, 4x, 10x, 20x, 40x (if available)
- **Fit to Screen**: Fits entire slide in viewport
- **Actual Size (1:1)**: Shows pixels at native resolution
- **Full Screen**: Expands viewer to full browser window
- **Download**: Downloads original scan file
- **Keyboard Navigation**: Arrow keys for pan, +/- for zoom

**Slide Details Panel:**
- Slide identification (ID, barcode, block)
- Staining information (type, status, date, technician)
- Scan metadata (date, scanner model, magnification, resolution)

**Navigation:**
- Previous/Next buttons cycle through case slides
- Keyboard shortcuts: Left/Right arrows (with Ctrl held)

**Integration Notes:**
- Uses OpenSeadragon or similar for WSI viewing (future enhancement)
- Falls back to static image display for non-WSI formats
- Thumbnail generated on upload for quick preview

#### 3.4.5 Multiple Scans per Slide

A slide may have multiple scans due to:
- Rescanning for improved quality
- Different focal planes (z-stack)
- Different magnification levels
- Scanner recalibration

When a slide has multiple scans, clicking "View" opens the **Select Scan Modal** before the viewer.

```
┌─ Select Scan to View ───────────────────────────────────────────────┐
│                                                                     │
│  Slide: S001 (24TST000010.A.S001)                                   │
│  Stain: H&E (Hematoxylin & Eosin)                                   │
│                                                                     │
│  This slide has 3 scans available. Select one to view:              │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │   │ Scanned           │ Scanner    │ Mag  │ Size   │ Notes    │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ ● │ 2024-08-10 09:15  │ Aperio AT2 │ 40x  │ 1.4 GB │ Rescan   │  │
│  │   │ (most recent)     │            │      │        │ quality  │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ ○ │ 2024-08-09 14:32  │ Aperio AT2 │ 40x  │ 1.2 GB │          │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ ○ │ 2024-08-09 11:05  │ Aperio AT2 │ 20x  │ 680 MB │ Initial  │  │
│  │   │                   │            │      │        │ scan     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ☐ Remember my selection for this slide                             │
│  ☐ Always open most recent scan (skip this dialog)                  │
│                                                                     │
│                              [Cancel]  [View Selected Scan]         │
└─────────────────────────────────────────────────────────────────────┘
```

**Select Scan Modal Behavior:**
- Scans listed in reverse chronological order (most recent first)
- Most recent scan pre-selected by default
- Radio button selection for single scan choice
- Optional notes column shows user-entered comments from upload
- "Remember selection" saves preference for this slide in current session
- "Always open most recent" sets user preference to skip modal

**Within the Viewer:**
When viewing a slide with multiple scans, the viewer shows a scan selector:

```
┌─ Scan Information ─────────────────────────────────────────────────┐
│ Viewing: Scan 1 of 3    [Switch Scan ▼]                            │
│ Scanned Date  │ 2024-08-10 09:15 (most recent)                     │
│ Scanner       │ Aperio AT2                                         │
│ Magnification │ 40x                                                │
│ File Size     │ 1.4 GB                                             │
│ Notes         │ Rescan - improved focus quality                    │
└────────────────────────────────────────────────────────────────────┘
```

The "Switch Scan" dropdown allows changing scans without closing the viewer.

---

### 3.5 Staining Section

**Status triggers:** Available when slides exist.

**Layout:** Summary cards + slides staining table + requests tables + ready for review button

**Summary Cards (4-column grid):**
| Card | Description |
|------|-------------|
| Complete | Count of slides with staining complete (green) |
| In Progress | Count of slides being stained (blue) |
| Pending | Count of slides waiting for staining (yellow) |
| Not Assigned | Count of slides without stain type (grey) |

**Slides Staining Table:**

| Column | Type | Description |
|--------|------|-------------|
| Checkbox | Checkbox | For bulk selection |
| Slide | Display | Slide ID |
| Block | Badge | Source block (if any) |
| Stain Type | Badge (purple) | Assigned stain type or "Not assigned" |
| Status | Badge | Complete / In Progress / Pending / Not Assigned |
| Stained Date | Date | When staining was completed |
| Actions | Buttons | Mark Complete (✅), Request Additional (+) |

**Bulk Actions:**
- **Apply Stain to Selected**: Opens modal to assign stain type to multiple slides at once
- **Select All Slides**: Selects all slides for bulk operation
- **Request Additional Stain**: Opens request modal for re-staining or new stains

#### 3.5.1 Pathologist Requests

Displays requests from pathologists for additional blocks, slides, or stains. These requests provide critical information to technicians.

**Pathologist Requests Table:**

| Column | Type | Description |
|--------|------|-------------|
| Request Date | Date | When request was made |
| Requested By | User | Pathologist who made request |
| Type | Badge | Block / Slide / Stain |
| Target | Badge | Block or Slide identifier (if applicable) |
| Details | Text | Stain type or request details |
| Notes | Text | Critical instructions (e.g., "thinner slices", "deeper sections") |
| Status | Badge | Pending / In Progress / Complete |
| Actions | Buttons | Mark In Progress, Mark Complete, Revert to Pending |

**Request Types:**
1. **Additional Block** - Request new block from specimen
2. **Additional Slide** - Request new slide from existing block (with notes like "thinner slices", "deeper sections")
3. **Additional Stain** - Request specific stain on existing slide

**Status Toggle Behavior:**
- Clicking status cycles: Pending → In Progress → Complete
- **Revert to Pending** button available on Complete items (for misclicks)
- Status changes are logged with timestamp and user

```
┌─ Pathologist Requests ──────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Date       │ By          │ Type  │ Target │ Details    │ Notes          ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ 2024-08-10 │ Dr. Mboule  │ Slide │ A      │ —          │ Thinner slices ││
│  │            │             │       │        │            │ (3μm instead   ││
│  │            │             │       │        │            │ of 5μm)        ││
│  │            │             │       │        │            │ ⚠ Pending      ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ 2024-08-10 │ Dr. Mboule  │ Stain │ S001   │ Reticulin  │ Assess fibrosis││
│  │            │             │       │        │            │ ⚠ Pending      ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ 2024-08-09 │ Dr. Mboule  │ Block │ —      │ —          │ Need margin    ││
│  │            │             │       │        │            │ tissue         ││
│  │            │             │       │        │            │ ✓ Complete     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.5.2 Request Additional Item Modal

Accessed via "Request Additional" button (pathologist role) or row action on slide/block.

```
┌─ Request Additional Item ───────────────────────────────────────────────────┐
│                                                                             │
│  Request Type *                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ( ) Additional Block   ( ) Additional Slide   (•) Additional Stain  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  Target *                              [Auto-populated if context exists]   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [S001 - H&E - Block A                                           ▼]  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ℹ️ For Additional Block, select source specimen area                       │
│  ℹ️ For Additional Slide, select source block                               │
│  ℹ️ For Additional Stain, select target slide                               │
│                                                                             │
│  Stain Type (for Additional Stain only)                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [Reticulin                                                      ▼]  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Notes / Instructions *                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [Thinner slices needed - 3μm instead of standard 5μm             ]  │   │
│  │ [                                                                 ]  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  💡 Provide specific instructions for the technician                        │
│                                                                             │
│  Priority                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ( ) Normal   (•) Urgent   ( ) STAT                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                        [Cancel]  [Submit Request]           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Auto-population Rules:**
- If opened from a slide row action → Target auto-populated with that slide
- If opened from a block row action → Target auto-populated with that block
- If opened from section header → Target dropdown starts empty
- Request Type defaults based on context (Stain if from slide, Slide if from block)

**Stain Types (Dictionary: "Pathology - Stain Types"):**
- H&E (Hematoxylin & Eosin)
- PAS (Periodic Acid-Schiff)
- Masson Trichrome
- Reticulin
- Iron (Prussian Blue)
- Congo Red
- Oil Red O
- Giemsa
- Gram
- Ziehl-Neelsen (AFB)
- Mucicarmine
- Alcian Blue
- Elastic (EVG)
- Silver (GMS)
- *(Additional types configurable via dictionary)*

**Progress calculation:** "X/Y complete" based on slide staining status

---

### 3.6 Pathologist Review Section

**Status triggers:** Case status = "Ready for Pathologist" or later.

**Collapsed state message:** "This section will be available after staining is complete and the case is assigned to a pathologist."

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Assigned Pathologist | Dropdown/Autocomplete | Yes | Select pathologist or queue |
| Review Started Date | Date picker (auto) | No | When pathologist opens |
| Technique Used | Multi-select + Add New | No | From dictionary with add capability |
| Additional Requests | Button | No | Opens Request Additional modal |
| Request Status | Per-request dropdown | No | Open / In Progress / Completed |
| Refer to Immunohistochemistry | Checkbox + dropdown | No | Checkbox enables test selection |

**Technique Used Field (Dictionary: "Pathology - Techniques"):**
- Multi-select dropdown pulling from data dictionary
- Each technique has a **short code** and **full name** (e.g., "HE" → "H&E (Hematoxylin & Eosin)")
- User can type either short code or full name to search
- Common values: HE (H&E), IHC, SS (Special Stains), FS (Frozen Section), MOL (Molecular), FC (Flow Cytometry), FISH, PCR

**Add New Technique:**
- If user types a value not in dictionary, show "+ Add [value]" option
- Opens inline form to enter:
  - Short Code (required, 2-6 characters)
  - Full Name (required)
  - ☐ Do not save for future cases (checkbox)
- If "Do not save" is checked: technique added to current case only, not saved to dictionary
- If unchecked: technique saved to dictionary for future use

```
┌─ Add New Technique ─────────────────────────────────────────────────────────┐
│                                                                             │
│  Short Code *        Full Name *                                            │
│  ┌──────────┐       ┌───────────────────────────────────────────────────┐  │
│  │ EM       │       │ Electron Microscopy                               │  │
│  └──────────┘       └───────────────────────────────────────────────────┘  │
│                                                                             │
│  ☐ Do not save for future cases (one-time use for this case only)          │
│                                                                             │
│                                              [Cancel]  [Add Technique]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Assignment Options:**
- Select specific pathologist from dropdown
- Leave blank to send to pathologist queue

**Progress calculation:** Required fields + request statuses

---

### 3.7 Findings & Conclusions Section

**Status triggers:** Pathologist Review section has assigned pathologist.

**Collapsed state message:** "This section will be available after a pathologist is assigned to the case."

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Gross Exam Findings | Rich text + Macros | Yes for release | Macroscopic observations |
| Microscopy Exam Findings | Rich text + Macros | Yes for release | Microscopic observations |
| Diagnosis | Multi-select + Add New | Yes for release | From dictionary with linked ICD-10/SNOMED codes |
| Text Conclusion | Rich text + Macros | No | Narrative conclusion |
| ICD-10 Codes | Auto-populated | No | Linked from selected diagnoses |
| SNOMED Codes | Auto-populated | No | Linked from selected diagnoses |

#### 3.7.0 Diagnosis Field with Linked Codes

The Diagnosis field provides multi-select typeahead with ICD-10 and SNOMED codes linked in the dictionary.

**Diagnosis Entry:**
- Search by diagnosis name, ICD-10 code, or SNOMED code
- Example: typing "C22.0" finds "Hepatocellular carcinoma"
- Example: typing "adeno" finds all adenocarcinoma variants
- Each selected diagnosis displays as a tag with its ICD-10 code badge

**Diagnosis Dictionary Structure:**
```
┌─ Diagnosis Entry ───────────────────────────────────────┐
│ Name: Hepatocellular carcinoma                          │
│ ICD-10: C22.0                                           │
│ SNOMED: 25370001                                        │
└─────────────────────────────────────────────────────────┘
```

**Selected Diagnosis Display:**
```
┌─ Diagnosis (search by name, ICD-10, or SNOMED code) ────────────────────────┐
│                                                                             │
│  [Hepatocellular carcinoma [C22.0] ×]  [Chronic inflammation [K29.5] ×]    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Type to search...                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Linked Codes Display:**
```
┌─ Linked Codes (auto-populated from selected diagnoses) ─────────────────────┐
│                                                                             │
│  ICD-10 Code(s)                      │  SNOMED Code(s)                      │
│  ┌─────────────────────────────────┐ │  ┌─────────────────────────────────┐ │
│  │ [C22.0] Hepatocellular carci... │ │  │ [25370001] Hepatocellular ca...│ │
│  │ [K29.5] Chronic inflammation    │ │  │ [84499006] Chronic inflammat...│ │
│  └─────────────────────────────────┘ │  └─────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Add New Diagnosis:**
- If search term doesn't match existing entries, show "+ Add to dictionary" option
- New diagnoses added without codes; codes can be added later via Administration

#### 3.7.1 Text Macros System

Text fields (Gross Description in Grossing, Gross Exam Findings, Microscopy Exam Findings, Text Conclusion, Review Notes) support macros for rapid text entry.

**Macro Features:**
- Each macro has a **short code** and **expanded text**
- User types short code (e.g., ".nmi") and presses Tab or Space to expand
- Macros can also be inserted via dropdown menu (📋 icon next to field)
- Macros support placeholder variables: `{specimen}`, `{site}`, `{size}`, `{date}`

**Macro Scope:**
- **My Macros**: Created by current user, editable/deletable
- **Shared Macros**: Created by other users and shared, can be disabled (not deleted)
- **System Macros**: Pre-configured by admin, can be disabled (not deleted)

**Macro Field UI:**
```
┌─ Microscopic Description ───────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ The specimen shows [type ".nmi" + Tab to insert macro]             │   │
│  │                                                                     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Quick insert: [.nmi] [.chronic] [.adequat] [.hcc] [.adeno] [Show all ▼] [⚙️ Manage] │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Quick-Insert Macro Bar:**
- Shows up to 5 most-used macros as clickable pills below text field
- Single-click inserts macro text immediately
- "Show all ▼" expands full searchable macro list inline
- "⚙️ Manage" opens Manage Macros modal
- Macros also expandable by typing code + Tab/Space in text field

**Expanded Macro List (inline):**
```
┌─ Quick insert: [.nmi] [.chronic] [.adequat] [Hide all ▲] [⚙️ Manage] ───────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search macros...                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ .nmi     No malignancy identified in the examined...   [Dr. Mboule]│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ .chronic Sections show chronic inflammatory...         [Dr. Mboule]│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ .hcc     Hepatocellular carcinoma, [grade]...          [Dr. Smith] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Review Notes Field:**
- Macro code expansion enabled (type code + Tab to expand)
- No quick-insert UI shown (subtle "(supports macro codes)" hint in label)
- All macro types available for expansion

#### 3.7.2 Manage Macros Modal

Accessed via "⚙️ Manage" button. Allows viewing, creating, editing, and deleting/disabling macros.

```
┌─ Manage Macros ─────────────────────────────────────────────────────────────┐
│                                                                             │
│  [+ Create New Macro]                                                       │
│                                                                             │
│  ┌─ Tabs ───────────────────────────────────────────────────────────────┐  │
│  │ [My Macros (5)]  [Shared Macros (12)]  [System Macros (8)]           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ── My Macros ──────────────────────────────────────────────────────────    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Code   │ Preview                                    │ Actions        │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ .nmi   │ No malignancy identified in the examined...│ [Edit] [Delete]│  │
│  │ .chronic│ Sections show chronic inflammatory...     │ [Edit] [Delete]│  │
│  │ .adequat│ The specimen is adequate for evaluation...│ [Edit] [Delete]│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ── Shared/System Macros (on their respective tabs) ────────────────────    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Code   │ Preview                      │ Owner      │ Status          │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ .hcc   │ Hepatocellular carcinoma...  │ Dr. Smith  │ ✓ Enabled [Disable]│
│  │ .adeno │ Adenocarcinoma...            │ Dr. Chen   │ ✗ Disabled [Enable]│
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                                              [Close]        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Create/Edit Macro Modal:**
```
┌─ Create New Macro ──────────────────────────────────────────────────────────┐
│                                                                             │
│  Short Code * (starts with period, e.g., ".nmi")                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ .nmi                                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Macro Text *                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ No malignancy identified in the examined sections. The tissue       │   │
│  │ shows normal histological architecture with no evidence of          │   │
│  │ dysplasia or neoplastic changes.                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Available placeholders: {specimen}, {site}, {size}, {date}                 │
│                                                                             │
│  Sharing                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ (•) Keep private (only I can use this macro)                        │   │
│  │ ( ) Share with all users                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                              [Cancel]  [Save Macro]         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Macro Permissions:**
- **My Macros**: Full control (create, edit, delete)
- **Shared Macros**: View, use, enable/disable for self (cannot edit/delete others' macros)
- **System Macros**: View, use, enable/disable for self (cannot edit/delete)

**Diagnosis Field (Dictionary: "Pathology - Diagnoses"):**
- Multi-select dropdown pulling from data dictionary
- Searchable with typeahead
- **Add New Diagnosis**: If user types a value not in dictionary, show "+ Add [value] to dictionary" option
- Adding new diagnosis saves to dictionary for future use
- Can select multiple diagnoses for complex cases

```
┌─ Diagnosis ─────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [×] Adenocarcinoma, moderately differentiated                   ▼ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Search: [hepatocellular______________________________________]             │
│                                                                             │
│  Matching results:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ☐ Hepatocellular carcinoma                                         │   │
│  │  ☐ Hepatocellular carcinoma, fibrolamellar variant                  │   │
│  │  ☐ Hepatocellular adenoma                                           │   │
│  │  ────────────────────────────────────────────────────────────────   │   │
│  │  + Add "Hepatocellular carcinoma, clear cell variant" to dictionary │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Common Diagnoses (examples in dictionary):**
- Adenocarcinoma (various differentiations)
- Squamous cell carcinoma
- Chronic inflammation
- Acute inflammation
- Benign neoplasm
- Malignant neoplasm
- No malignancy identified
- Insufficient for diagnosis
- *(Additional diagnoses configurable via dictionary)*

**Progress calculation:** Count of required fields for release completed

---

### 3.8 Reports Section

**Status triggers:** Always visible, but Generate Report only enabled when Findings & Conclusions required fields are complete.

**Layout:** Tab-style view within the section.

**Report List Table:**

| Column | Type | Description |
|--------|------|-------------|
| Report # | Auto | Version number |
| Generated Date | Timestamp | When created |
| Generated By | User | Who created |
| Type | Badge | Draft / Final |
| Actions | Buttons | View, Download, Print, Email, Re-generate |

**Report Preview:**
- Embedded PDF viewer (iframe or react-pdf)
- Full-screen view option

**Actions:**
- **View**: Opens report in preview pane
- **Download**: Downloads PDF
- **Print**: Opens print dialog
- **Email**: Opens modal to select recipient(s) and send
- **Re-generate**: Creates new version with current data (confirms overwrite warning)

**Empty State:** "No reports generated yet. Complete the Findings & Conclusions section to generate a report."

---

## 4. Sticky Footer Action Bar

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Discard Changes]                    [Save Progress] [Generate Report]│
└─────────────────────────────────────────────────────────────────────┘
```

**Left side:**
- **Discard Changes** (ghost/tertiary button): Reverts unsaved changes, requires confirmation

**Right side:**
- **Save Progress** (secondary button): Saves all entered data, shows success toast
- **Ready for Pathologist Review** (secondary/warning button): Transitions case to pathologist queue
- **Generate Report** (primary button): Enabled only when required fields complete

### 4.1 Ready for Pathologist Review Button

Located in footer between Save Progress and Generate Report.

**Visual States:**
- **With pending requests**: Orange background (#ff8f00), shows ⚠ icon and badge count
- **No pending requests**: Green outline (#198038), shows ✓ icon

**Button Behavior:**
- Shows warning icon (⚠) and count badge if pending pathologist requests exist
- Clicking with pending requests shows confirmation dialog
- Clicking without pending requests immediately unlocks pathologist sections

**Confirmation Dialog (when pending requests exist):**

```
┌─ Outstanding Requests ──────────────────────────────────────────────────────┐
│                                                                             │
│  ⚠ There are 2 pending requests that have not been completed:               │
│                                                                             │
│  • Additional Slide from Block A (thinner slices)                           │
│  • Additional Stain: Reticulin on S001                                      │
│                                                                             │
│  Are you sure you want to mark this case as ready for review?               │
│  The pathologist will see these as incomplete.                              │
│                                                                             │
│                      [Cancel]  [Mark Ready Anyway]  [Complete Requests]     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Dialog Actions:**
- **Cancel**: Close dialog, no changes
- **Mark Ready Anyway**: Proceed with outstanding requests (logged), unlock pathologist sections
- **Complete Requests**: Close dialog, scroll to requests table in Staining section

**On Successful Transition:**
1. Case status updated to "Ready for Pathologist Review"
2. Pathologist Review section unlocked and expanded
3. Findings & Conclusions section unlocked
4. Success toast: "Case is now ready for pathologist review"
5. Sidebar updates to show sections as available

**Generate Report behavior:**
1. Validates all required fields for release
2. If validation fails: Shows inline errors, scrolls to first error
3. If validation passes: Generates PDF, adds to Reports section, scrolls to Reports
4. Shows success toast: "Report generated successfully"

**Unsaved changes warning:**
- Footer shows subtle indicator when unsaved changes exist
- Browser beforeunload warning if navigating away with unsaved changes

---

## 5. Data Model Updates

### 5.1 Existing Entities (No Changes)

- PathologyCase

### 5.2 Updated Entities

**PathologyBlock:**
| Field | Type | Description |
|-------|------|-------------|
| barcode | String | Auto-generated: `{lab_number}.{block_id}` |
| block_id | String | User-friendly ID (A1, A2, B1, etc.) |
| tissue_type | String | FK to dictionary entry |
| location | String | Storage location |
| created_at | Timestamp | When block was created |
| created_by | UUID | FK to user who created block |

**PathologySlide:**
| Field | Type | Description |
|-------|------|-------------|
| barcode | String | Auto-generated: `{lab_number}.{block_id}.{slide_id}` |
| slide_id | String | User-friendly ID (S001, S002, etc.) |
| block_id | UUID (FK) | Reference to source block (nullable) |
| stain_type | String | FK to dictionary entry |
| stain_status | Enum | NOT_ASSIGNED, PENDING, IN_PROGRESS, COMPLETE |
| stained_date | Date | When staining was completed |
| stained_by | String | FK to user who performed staining |
| preferred_scan_id | UUID (FK, nullable) | User's preferred scan for this slide |

**SlideScan (NEW):**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| slide_id | UUID (FK) | Reference to parent slide |
| image_path | String | Path to scanned slide image file |
| thumbnail_path | String (nullable) | Path to generated thumbnail |
| scanned_date | Timestamp | When slide was scanned |
| uploaded_date | Timestamp | When file was uploaded |
| uploaded_by | UUID (FK) | User who uploaded the scan |
| scanner_model | String (nullable) | Scanner device used |
| magnification | String (nullable) | Scan magnification (e.g., "40x") |
| resolution | String (nullable) | Image resolution (e.g., "98304x65536") |
| file_size | Long | File size in bytes |
| notes | String (nullable) | User-entered notes (e.g., "Rescan - better focus") |
| is_active | Boolean | Whether scan is available (false if deleted) |

**Notes on Multiple Scans:**
- A slide can have multiple SlideScan records
- Scans are displayed in reverse chronological order (most recent first)
- The `preferred_scan_id` on PathologySlide stores user's preferred scan
- If no preference set, the most recent scan is used as default
- Deleting a scan sets `is_active = false` rather than hard deleting

### 5.3 New Fields

**PathologyCase:**
| Field | Type | Description |
|-------|------|-------------|
| grossing_completed_date | Timestamp | When grossing was marked complete |
| staining_completed_date | Timestamp | When staining was marked complete |
| review_started_date | Timestamp | When pathologist opened case |

**PathologyReport:**
| Field | Type | Description |
|-------|------|-------------|
| version_number | Integer | Sequential version |
| report_type | Enum | DRAFT, FINAL |
| emailed_to | JSON | Array of email addresses sent to |
| emailed_date | Timestamp | When last emailed |

### 5.4 New Entities

**PathologyTechnique (Dictionary Entry):**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| short_code | String | 2-6 character code (e.g., "HE", "IHC") |
| full_name | String | Full technique name |
| is_active | Boolean | Whether available in dropdown |
| created_by | UUID | FK to user who created |
| created_date | Timestamp | When created |

**PathologyCaseTechnique (Join table for case-specific techniques):**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| case_id | UUID | FK to PathologyCase |
| technique_id | UUID (nullable) | FK to PathologyTechnique (null if one-time) |
| one_time_short_code | String (nullable) | For "do not save" techniques |
| one_time_full_name | String (nullable) | For "do not save" techniques |
| added_by | UUID | FK to user |
| added_date | Timestamp | When added to case |

**PathologyTextMacro:**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| short_code | String | Trigger code (e.g., ".nmi", ".chronic") |
| macro_text | Text | Expanded text content |
| field_type | Enum | GROSS, MICROSCOPY, CONCLUSION, ALL |
| owner_id | UUID | FK to user who created |
| owner_type | Enum | USER, SYSTEM |
| is_shared | Boolean | If true, visible to all users |
| created_date | Timestamp | When created |
| updated_date | Timestamp | Last modified |

**PathologyMacroUserStatus (Per-user enable/disable for shared/system macros):**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| macro_id | UUID | FK to PathologyTextMacro |
| user_id | UUID | FK to user |
| is_enabled | Boolean | Whether user has this macro enabled |
| disabled_date | Timestamp (nullable) | When disabled |

**PathologistRequest:**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| case_id | UUID | FK to PathologyCase |
| request_type | Enum | BLOCK, SLIDE, STAIN |
| target_type | Enum (nullable) | BLOCK, SLIDE (what the request targets) |
| target_id | UUID (nullable) | FK to Block or Slide |
| stain_type | String (nullable) | FK to dictionary entry (for STAIN requests) |
| notes | Text | Critical instructions (e.g., "thinner slices 3μm") |
| priority | Enum | NORMAL, URGENT, STAT |
| requested_by | UUID | FK to user (pathologist) |
| requested_date | Timestamp | When request was created |
| status | Enum | PENDING, IN_PROGRESS, COMPLETE |
| status_changed_date | Timestamp | When status was last changed |
| status_changed_by | UUID | FK to user who changed status |
| completed_date | Timestamp (nullable) | When request was fulfilled |
| completed_by | UUID (nullable) | FK to user who fulfilled |
| result_block_id | UUID (nullable) | FK to newly created block (if applicable) |
| result_slide_id | UUID (nullable) | FK to newly created slide (if applicable) |

**Request Type Details:**
- **BLOCK**: Request additional block from specimen. Target is optional (specimen area in notes).
- **SLIDE**: Request additional slide from block. Target is the source block.
- **STAIN**: Request specific stain on existing slide. Target is the slide, stain_type required.

**Status Transitions:**
- PENDING → IN_PROGRESS (tech starts working)
- IN_PROGRESS → COMPLETE (tech finishes)
- COMPLETE → PENDING (revert for misclick/error)
- All transitions logged with timestamp and user

---

## 6. API Endpoints

### 6.1 Existing (Update as needed)

- `GET /api/pathology/case/{id}` - Full case data
- `PUT /api/pathology/case/{id}` - Update case
- `POST /api/pathology/case/{id}/blocks` - Add blocks
- `POST /api/pathology/case/{id}/slides` - Add slides

### 6.2 New Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pathology/case/{id}/blocks/bulk` | Add multiple blocks |
| POST | `/api/pathology/case/{id}/slides/bulk` | Add multiple slides |
| PUT | `/api/pathology/case/{id}/slides/bulk-stain` | Apply stain to multiple slides |
| PUT | `/api/pathology/slide/{slideId}/stain-status` | Update single slide stain status |
| GET | `/api/pathology/case/{id}/requests` | Get all pathologist requests for case |
| GET | `/api/pathology/case/{id}/requests/pending` | Get pending requests grouped by type |
| POST | `/api/pathology/case/{id}/requests` | Create new pathologist request |
| PUT | `/api/pathology/request/{requestId}` | Update request (status, notes) |
| PUT | `/api/pathology/request/{requestId}/status` | Update request status only |
| PUT | `/api/pathology/request/{requestId}/revert` | Revert completed request to pending |
| POST | `/api/pathology/case/{id}/ready-for-review` | Mark case ready for pathologist review |
| POST | `/api/pathology/case/{id}/report/generate` | Generate new report |
| POST | `/api/pathology/case/{id}/report/{reportId}/email` | Email report |
| GET | `/api/pathology/case/{id}/progress` | Get section completion status with pending counts |
| POST | `/api/pathology/blocks/print-labels` | Generate block labels (batch) |
| POST | `/api/pathology/slides/print-labels` | Generate slide labels (batch) |
| GET | `/api/admin/label-presets` | Get configured label presets |
| GET | `/api/admin/label-presets/{type}` | Get presets by type (block/slide) |
| POST | `/api/pathology/slides/upload-scans` | Upload scanned slide images (multipart) |
| POST | `/api/pathology/slide/{slideId}/upload-scan` | Upload scan for single slide |
| GET | `/api/pathology/slide/{slideId}/scans` | Get all scans for slide (sorted by date desc) |
| GET | `/api/pathology/slide/{slideId}/scan/{scanId}` | Get specific scan metadata and image URL |
| GET | `/api/pathology/slide/{slideId}/thumbnail` | Get thumbnail for most recent/preferred scan |
| PUT | `/api/pathology/slide/{slideId}/preferred-scan` | Set user's preferred scan for slide |
| DELETE | `/api/pathology/scan/{scanId}` | Soft-delete a scan (set is_active = false) |
| GET | `/api/pathology/scan/{scanId}/tiles/{z}/{x}/{y}` | Get WSI tile for specific scan |
| GET | `/api/pathology/techniques` | Get all active techniques from dictionary |
| POST | `/api/pathology/techniques` | Add new technique to dictionary |
| POST | `/api/pathology/case/{id}/techniques` | Add technique(s) to case |
| POST | `/api/pathology/case/{id}/techniques/one-time` | Add one-time technique (not saved to dictionary) |
| GET | `/api/pathology/macros` | Get all macros (user's own + shared + system) |
| GET | `/api/pathology/macros/user` | Get current user's macros only |
| POST | `/api/pathology/macros` | Create new macro |
| PUT | `/api/pathology/macro/{macroId}` | Update macro (owner only) |
| DELETE | `/api/pathology/macro/{macroId}` | Delete macro (owner only) |
| PUT | `/api/pathology/macro/{macroId}/share` | Share macro with all users |
| PUT | `/api/pathology/macro/{macroId}/unshare` | Unshare macro |
| PUT | `/api/pathology/macro/{macroId}/enable` | Enable shared/system macro for current user |
| PUT | `/api/pathology/macro/{macroId}/disable` | Disable shared/system macro for current user |
| GET | `/api/pathology/macros/field/{fieldType}` | Get macros for specific field type |

---

## 7. Permissions

| Permission | Roles | Actions |
|------------|-------|---------|
| pathology.case.view | Technician, Pathologist, Manager | View case details |
| pathology.case.grossing | Technician, Manager | Edit grossing section |
| pathology.case.blocks | Technician, Manager | Manage blocks |
| pathology.case.slides | Technician, Manager | Manage slides |
| pathology.case.staining | Technician, Manager | Edit staining section |
| pathology.case.review | Pathologist, Manager | Edit pathologist review |
| pathology.case.findings | Pathologist, Manager | Edit findings/conclusions |
| pathology.case.report | Pathologist, Manager | Generate/manage reports |
| pathology.case.assign | Manager | Reassign technician/pathologist |
| pathology.requests.create | Pathologist, Manager | Create block/slide/stain requests |
| pathology.requests.update | Technician, Manager | Update request status |
| pathology.requests.revert | Technician, Pathologist, Manager | Revert completed request to pending |
| pathology.case.ready-for-review | Technician, Manager | Mark case ready for pathologist review |
| pathology.labels.print | Technician, Pathologist, Manager | Print block/slide labels |
| pathology.slides.upload | Technician, Manager | Upload scanned slides |
| pathology.slides.view | Technician, Pathologist, Manager | View digital slides |
| pathology.macros.create | Pathologist, Manager | Create personal macros |
| pathology.macros.share | Pathologist, Manager | Share macros with all users |
| pathology.macros.system | Admin | Create/edit system macros |
| pathology.techniques.create | Pathologist, Manager | Add new techniques to dictionary |
| admin.labels.manage | Manager, Admin | Configure label presets |

---

## 8. Acceptance Criteria

- [ ] **AC-1**: Page loads with sidebar showing all sections with progress indicators
- [ ] **AC-2**: Clicking sidebar item smooth-scrolls to section
- [ ] **AC-3**: Upcoming sections show collapsed with prerequisite message
- [ ] **AC-4**: Completed sections show green checkmark, are expandable
- [ ] **AC-5**: Progress indicators show "X/Y fields" format
- [ ] **AC-6**: Blocks can be added in bulk (1-20 at a time)
- [ ] **AC-7**: Slides can be added in bulk (1-50 at a time)
- [ ] **AC-8**: Slides can exist without block association
- [ ] **AC-9**: Save Progress saves all sections, shows toast
- [ ] **AC-10**: Generate Report only enabled when required fields complete
- [ ] **AC-11**: Generated reports appear in Reports section with actions
- [ ] **AC-12**: Report preview displays inline PDF viewer
- [ ] **AC-13**: Email action opens modal with recipient selection
- [ ] **AC-14**: Unsaved changes show warning on navigation
- [ ] **AC-15**: Sections respect user permissions (hide/disable unauthorized)
- [ ] **AC-16**: Staining section shows summary cards with status counts
- [ ] **AC-17**: Staining table shows all slides with stain type and status
- [ ] **AC-18**: Multiple slides can be selected for bulk stain application
- [ ] **AC-19**: "Apply Stain to Selected" modal allows selecting stain type and initial status
- [ ] **AC-20**: Individual slides can be marked as staining complete
- [ ] **AC-21**: "Request Additional Stain" creates new stain request
- [ ] **AC-22**: Stain requests can target either blocks or slides
- [ ] **AC-23**: Stain requests table shows pending requests with mark complete action
- [ ] **AC-24**: Tissue Type field uses typeahead with add-new capability
- [ ] **AC-25**: Blocks display auto-generated barcode in `{lab_number}.{block_id}` format
- [ ] **AC-26**: Slides display auto-generated barcode in `{lab_number}.{block_id}.{slide_id}` format
- [ ] **AC-27**: Print Labels button opens modal for batch label printing
- [ ] **AC-28**: Print Labels modal shows selectable list of blocks/slides with checkboxes
- [ ] **AC-29**: Print Labels modal allows configuring copies per item
- [ ] **AC-30**: Print Labels modal shows label preset dropdown from Admin configuration
- [ ] **AC-31**: Print Labels modal allows selecting barcode type (Code 128, QR, DataMatrix)
- [ ] **AC-32**: Print Labels modal shows real-time preview of label layout
- [ ] **AC-33**: Row action menu includes individual "Print Label" option
- [ ] **AC-34**: Labels include configurable fields (Patient Name, DOB, Tissue Type, etc.)
- [ ] **AC-35**: Upload Scanned Slides modal accepts drag-and-drop file upload
- [ ] **AC-36**: Auto-match parses barcode from filename and matches to slide
- [ ] **AC-37**: Manual match dropdown allows assigning unmatched files to slides
- [ ] **AC-38**: Upload progress indicator shows during file upload
- [ ] **AC-39**: Slides table shows scan indicator (thumbnail or icon) for scanned slides
- [ ] **AC-40**: View Digital Slide modal displays slide details and staining information
- [ ] **AC-41**: View Digital Slide modal shows scan metadata (date, scanner, magnification)
- [ ] **AC-42**: Image viewer supports pan and zoom controls
- [ ] **AC-43**: Previous/Next navigation cycles through case slides
- [ ] **AC-44**: Download button allows downloading original scan file
- [ ] **AC-45**: Full screen mode expands viewer to browser window
- [ ] **AC-46**: Slides with multiple scans show scan count badge in table
- [ ] **AC-47**: Clicking View on slide with multiple scans opens Select Scan modal
- [ ] **AC-48**: Select Scan modal lists scans in reverse chronological order (most recent first)
- [ ] **AC-49**: Most recent scan is pre-selected by default in Select Scan modal
- [ ] **AC-50**: User can set preferred scan for a slide
- [ ] **AC-51**: "Always open most recent" preference skips Select Scan modal
- [ ] **AC-52**: Viewer shows "Switch Scan" dropdown when slide has multiple scans
- [ ] **AC-53**: Switching scans in viewer updates image without closing modal
- [ ] **AC-54**: Sidebar shows orange badge with count for sections with pending requests
- [ ] **AC-55**: Badge tooltip shows "X pending request(s) from pathologist"
- [ ] **AC-56**: Pathologist can create requests for additional blocks with notes
- [ ] **AC-57**: Pathologist can create requests for additional slides with notes (e.g., "thinner slices")
- [ ] **AC-58**: Pathologist can create requests for additional stains
- [ ] **AC-59**: Request Additional modal auto-populates target when opened from row action
- [ ] **AC-60**: Request type defaults based on context (Stain from slide, Slide from block)
- [ ] **AC-61**: Pathologist Requests table displays all request types (Block/Slide/Stain)
- [ ] **AC-62**: Request status can be changed: Pending → In Progress → Complete
- [ ] **AC-63**: Completed requests can be reverted to Pending (for misclicks)
- [ ] **AC-64**: Status changes are logged with timestamp and user
- [ ] **AC-65**: "Ready for Pathologist Review" button visible in sticky footer (between Save Progress and Generate Report)
- [ ] **AC-66**: Button shows warning icon (⚠) and count when pending requests exist
- [ ] **AC-67**: Clicking button with pending requests shows confirmation dialog
- [ ] **AC-68**: Dialog lists all pending requests with details
- [ ] **AC-69**: "Mark Ready Anyway" proceeds despite pending requests (logged)
- [ ] **AC-70**: "Complete Requests" scrolls to requests table
- [ ] **AC-71**: Clicking Ready for Review unlocks Pathologist Review section
- [ ] **AC-72**: Clicking Ready for Review unlocks Findings & Conclusions section
- [ ] **AC-73**: Unlocked Pathologist Review section shows pathologist assignment and review fields
- [ ] **AC-74**: Pathologist can request additional blocks/slides/stains from the Review section
- [ ] **AC-75**: Request priority (Normal/Urgent/STAT) is displayed and sortable
- [ ] **AC-76**: Technique(s) Used field pulls options from "Pathology - Techniques" dictionary
- [ ] **AC-77**: User can select multiple techniques as tags
- [ ] **AC-78**: Typing a technique not in dictionary shows "+ Add to dictionary" option
- [ ] **AC-79**: Adding new technique saves to dictionary for future use
- [ ] **AC-80**: Diagnosis field pulls options from "Pathology - Diagnoses" dictionary
- [ ] **AC-81**: User can select multiple diagnoses as tags
- [ ] **AC-82**: Diagnosis field is searchable with typeahead
- [ ] **AC-83**: Typing a diagnosis not in dictionary shows "+ Add to dictionary" option
- [ ] **AC-84**: Adding new diagnosis saves to dictionary for future use
- [ ] **AC-85**: Techniques can be searched by short code or full name
- [ ] **AC-86**: Adding new technique requires short code (2-6 chars) and full name
- [ ] **AC-87**: "Do not save for future cases" adds technique to case only without saving to dictionary
- [ ] **AC-88**: Text fields show "Insert Macro" dropdown and "Manage Macros" button
- [ ] **AC-89**: Typing macro short code + Tab/Space expands macro text
- [ ] **AC-90**: Insert Macro dropdown shows My Macros, Shared Macros, and System Macros
- [ ] **AC-91**: User can create new macro with short code, text, and sharing option
- [ ] **AC-92**: User can edit and delete their own macros
- [ ] **AC-93**: User can enable/disable shared and system macros (not delete)
- [ ] **AC-94**: Disabled macros don't appear in Insert Macro dropdown
- [ ] **AC-95**: Macro placeholders ({specimen}, {site}, etc.) are replaced on insert
- [ ] **AC-96**: Manage Macros modal shows tabs for My/Shared/System macros
- [ ] **AC-97**: Quick-insert macro bar shows up to 5 macro buttons below text fields
- [ ] **AC-98**: Single-click on macro button inserts text immediately
- [ ] **AC-99**: "Show all" expands searchable macro list inline
- [ ] **AC-100**: Review Notes field supports macro code expansion (no UI shown)
- [ ] **AC-101**: Blocks section shows "Request Additional" button
- [ ] **AC-102**: Slides section shows "Request Additional" button
- [ ] **AC-103**: Request Additional from Blocks pre-populates type as "BLOCK"
- [ ] **AC-104**: Request Additional from Slides pre-populates type as "SLIDE"
- [ ] **AC-105**: Diagnosis field searchable by name, ICD-10 code, or SNOMED code
- [ ] **AC-106**: Selected diagnoses display ICD-10 code badge
- [ ] **AC-107**: Linked Codes section auto-populates from selected diagnoses
- [ ] **AC-108**: ICD-10 codes display with diagnosis name in Linked Codes section
- [ ] **AC-109**: SNOMED codes display with diagnosis name in Linked Codes section
- [ ] **AC-110**: Grossing section Gross Description has macro quick-insert bar
- [ ] **AC-111**: Review Notes has macro quick-insert bar

---

## 9. Wireframes

### 9.1 Overall Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ≡  Système d'Information Électronique de Laboratoire    🔍 🔔 👤 ❓        │
├────────────────────────────────────────────────────────────────────────────┤
│ Home / Pathology / 24TST000010                                             │
│ Pathology Case - 24TST000010                                               │
│ Patient: BISS, SEE | DOB: 1985-03-15 | M | Status: PROCESSING              │
├───────────────┬────────────────────────────────────────────────────────────┤
│               │                                                            │
│ CASE PROGRESS │  ┌─ Case Information ─────────────────────────────────┐   │
│               │  │ Lab #: 24TST000010    Request: 2024-08-07          │   │
│ ○ Case Info   │  │ Specimen: Tissue Biopsy   Provider: Dr. Smith      │   │
│ ◐ Grossing    │  │ Clinical Hx: Rule out malignancy                   │   │
│   2/4 fields  │  └────────────────────────────────────────────────────┘   │
│ ◐ Blocks      │                                                            │
│   3 added     │  ┌─ Grossing ──────────────────────────────────── ▼ ──┐   │
│ ○ Slides      │  │                                                    │   │
│   0 added     │  │  Status: [Processing ▼]  Technician: [Select... ▼] │   │
│ ○ Staining    │  │                                                    │   │
│ ○ Review      │  │  Received: [2024-08-07]  Condition: [Adequate ▼]   │   │
│   locked      │  │                                                    │   │
│ ○ Findings    │  │  Gross Description:                                │   │
│   locked      │  │  ┌─────────────────────────────────────────────┐  │   │
│ ○ Reports     │  │  │ B B I U  │ Irregular tissue fragment...     │  │   │
│               │  │  └─────────────────────────────────────────────┘  │   │
│               │  │                                                    │   │
│               │  └────────────────────────────────────────────────────┘   │
│               │                                                            │
│               │  ┌─ Blocks ───────────────────────────────────── ▼ ──┐   │
│               │  │ [+ Add Block(s)]  [Print Selected]                 │   │
│               │  │ ┌──────┬───────────┬───────────┬─────────────────┐│   │
│               │  │ │ □ ID │ Location  │ Tissue    │ Actions         ││   │
│               │  │ ├──────┼───────────┼───────────┼─────────────────┤│   │
│               │  │ │ □ A  │ Rack 2-5  │ Liver     │ 🏷️ Print  🗑️   ││   │
│               │  │ │ □ B  │ Rack 2-6  │ Liver     │ 🏷️ Print  🗑️   ││   │
│               │  │ │ □ C  │ Rack 2-7  │ Margin    │ 🏷️ Print  🗑️   ││   │
│               │  │ └──────┴───────────┴───────────┴─────────────────┘│   │
│               │  └────────────────────────────────────────────────────┘   │
│               │                                                            │
├───────────────┴────────────────────────────────────────────────────────────┤
│ ⚠ Unsaved changes        [Discard Changes]    [Save Progress] [Generate]  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Locked Section Example

```
┌─ Pathologist Review ──────────────────────────────────────── 🔒 ──┐
│                                                                    │
│  ℹ️ This section will be available after staining is complete     │
│     and the case is assigned to a pathologist.                     │
│                                                                    │
│     Current status: PROCESSING                                     │
│     Required status: READY_PATHOLOGIST                             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 9.3 Reports Section

```
┌─ Reports ─────────────────────────────────────────────────── ▼ ──┐
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ # │ Generated        │ By           │ Type  │ Actions      │  │
│  ├───┼──────────────────┼──────────────┼───────┼──────────────┤  │
│  │ 2 │ 2024-08-15 14:30 │ Dr. Mboule   │ Final │ 👁️ ⬇️ 🖨️ ✉️ │  │
│  │ 1 │ 2024-08-14 09:15 │ Dr. Mboule   │ Draft │ 👁️ ⬇️ 🖨️ ✉️ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ Report Preview ───────────────────────────────────────────┐  │
│  │                                                             │  │
│  │  ┌───────────────────────────────────────────────────────┐ │  │
│  │  │              PATHOLOGY REPORT                         │ │  │
│  │  │                                                       │ │  │
│  │  │  Patient: BISS, SEE                                   │ │  │
│  │  │  Lab Number: 24TST000010                              │ │  │
│  │  │  ...                                                  │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  │                                           [Full Screen 🔲] │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 10. Admin Configuration: Label Presets

Label presets are configured in Admin > Barcode Configuration and shared across Pathology and IHC modules.

### 10.1 Block Label Presets

| Preset Name | Dimensions | Default Use |
|-------------|------------|-------------|
| Block Label - Standard | 1" x 0.5" | General tissue blocks |
| Block Label - Large | 1.5" x 0.75" | Large cassettes |
| Freezer Block Label | 1" x 0.375" | Cryostat blocks |

### 10.2 Slide Label Presets

| Preset Name | Dimensions | Default Use |
|-------------|------------|-------------|
| Slide Label - Standard | 1" x 0.375" | General histology slides |
| Slide Label - Wide | 1.25" x 0.375" | Extended info labels |
| Slide Label - Mini | 0.75" x 0.25" | Small slides |

### 10.3 Barcode Types

| Type | Best For | Notes |
|------|----------|-------|
| Code 128 | Block labels | Default, widely supported |
| QR Code | Blocks or slides | More data capacity |
| DataMatrix | Slide labels | Compact, good for small labels |

### 10.4 Configurable Label Fields

Each preset can include/exclude the following fields:
- Patient Name
- Date of Birth
- Tissue Type
- Collection Date
- Pathologist Name
- Block/Slide ID
- Stain Code (slides only)

### 10.5 Cross-Module Consistency

The barcode format and label printing functionality described here applies identically to:
- **Pathology Case View** (this document)
- **Immunohistochemistry Case View** (see OGC-265)

Both modules use the same Admin configuration for label presets.

---

## 11. Future Enhancements (Out of Scope v1)

1. **Digital pathology integration** - View slides in embedded viewer (OpenSeadragon)
2. **Voice dictation** - Speech-to-text for findings entry
3. **AI-assisted diagnosis** - Suggest conclusions based on findings text
4. **Template support** - Save/load finding templates
5. **Collaborative review** - Multiple pathologists, comments
6. **Audit trail visualization** - Timeline view of all changes

---

## 12. Related Specifications

- **Immunohistochemistry Case View** - Similar redesign with additional IHC-specific fields
- **Cytology Case View** - Similar redesign for cytology workflow
- **Pathology Dashboard** - Links to this case view

