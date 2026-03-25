# OpenELIS Global - Barcode Label Configuration v1
## Functional Requirements Specification

**Version:** 1.0  
**Date:** December 2025  
**Module:** Administration → Master Lists → Barcode Configuration  
**Route:** `/MasterListsPage#barcodeConfiguration`  
**Related:** Order Entry (Add Order step)

---

## 1. Overview

### 1.1 Purpose

Enhance the barcode label configuration and printing workflow to support additional label types (Freezer) and allow users to customize label quantities during order entry rather than relying solely on system defaults.

### 1.2 Problem Statement

Current limitations:
- **Fixed label types**: Only Order and Specimen labels are fully configurable; Block and Slide have dimensions only, no Freezer support
- **No user control at order entry**: Users cannot adjust label quantities when registering samples
- **Default-only printing**: System applies default counts without allowing per-order customization

### 1.3 Solution Summary

- Add Freezer label type to Barcode Configuration page
- Add default/max count settings for Block and Slide labels
- Add "Labels" section to Order Entry (Add Order step)
- Allow per-order/per-sample label quantity customization
- PDF-based printing after order save

### 1.4 Users

| Role | Benefits |
|------|----------|
| Lab Technician | Customize label counts per order, print specific label types |
| Pathology Staff | Generate block/slide/freezer labels at sample registration |
| Lab Administrator | Configure label types and defaults |

---

## 2. Barcode Configuration Page Updates

### 2.1 Current State

The Barcode Configuration page (`/MasterListsPage#barcodeConfiguration`) currently supports:
- **Order** labels (default count, max count, dimensions)
- **Specimen** labels (default count, max count, dimensions)
- **Block** labels (dimensions only)
- **Slide** labels (dimensions only)

### 2.2 Proposed Changes

Add **Freezer** label configuration and expand Block/Slide settings:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Number Bar Code Label                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Default Bar Code Labels                                                  │
│ Indicate the default number of bar code labels which should be printed  │
│ with every order and specimen.                                          │
│                                                                          │
│ Order              Specimen            Block              Slide          │
│ ┌────────────┐    ┌────────────┐     ┌────────────┐    ┌────────────┐   │
│ │     2      │    │     1      │     │     0      │    │     0      │   │
│ └────────────┘    └────────────┘     └────────────┘    └────────────┘   │
│                                                                          │
│ Freezer                                                                  │
│ ┌────────────┐                                                          │
│ │     0      │                                                          │
│ └────────────┘                                                          │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Maximum Bar Code Labels                                                  │
│ Indicate the maximum number of bar code labels that can be printed for  │
│ each order or specimen. Once the maximum has been reached, a user will  │
│ be unable to print additional labels.                                   │
│                                                                          │
│ Order              Specimen            Block              Slide          │
│ ┌────────────┐    ┌────────────┐     ┌────────────┐    ┌────────────┐   │
│ │    10      │    │     5      │     │    20      │    │    50      │   │
│ └────────────┘    └────────────┘     └────────────┘    └────────────┘   │
│                                                                          │
│ Freezer                                                                  │
│ ┌────────────┐                                                          │
│ │    10      │                                                          │
│ └────────────┘                                                          │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Bar Code Label Elements                                                  │
│ Check the box next to the optional elements that should appear on       │
│ bar code labels. Lab Number is always included.                         │
│                                                                          │
│ Mandatory Elements (all label types):                                   │
│ • Lab Number                                                            │
│                                                                          │
│ Optional Elements:                                                       │
│                                                                          │
│ Order Labels:                           Specimen Labels:                 │
│ ☐ Patient Name                          ☐ Patient Name                  │
│ ☐ Patient ID                            ☐ Patient ID                    │
│ ☐ Patient Date of Birth                 ☐ Patient Date of Birth         │
│ ☐ Site ID                               ☐ Collection Date and Time      │
│                                         ☐ Collected By                  │
│                                         ☐ Tests                         │
│                                         ☐ Patient Sex                   │
│                                                                          │
│ Block Labels:                           Slide Labels:                    │
│ ☐ Patient ID                            ☐ Patient ID                    │
│ ☐ Block ID                              ☐ Slide ID                      │
│ ☐ Specimen Type                         ☐ Stain Type                    │
│ ☐ Case Number                           ☐ Block ID                      │
│                                         ☐ Case Number                   │
│                                                                          │
│ Freezer Labels:                                                          │
│ ☐ Patient ID                                                            │
│ ☐ Storage Location                                                      │
│ ☐ Specimen Type                                                         │
│ ☐ Collection Date                                                       │
│ ☐ Expiry Date                                                           │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Dimensions Bar Code Label                                                │
│ Indicate the dimensions that bar code labels should conform to when     │
│ printing.                                                                │
│                                                                          │
│ Order                              Specimen                              │
│ Height ┌────────────┐             Height ┌────────────┐                 │
│        │   25.4     │                    │   25.4     │                 │
│        └────────────┘                    └────────────┘                 │
│        Enter values in: mm               Enter values in: mm            │
│ Width  ┌────────────┐             Width  ┌────────────┐                 │
│        │   76.2     │                    │   76.2     │                 │
│        └────────────┘                    └────────────┘                 │
│        Enter values in: mm               Enter values in: mm            │
│                                                                          │
│ Block                              Slide                                 │
│ Height ┌────────────┐             Height ┌────────────┐                 │
│        │   25.4     │                    │   12.7     │                 │
│        └────────────┘                    └────────────┘                 │
│        Enter values in: mm               Enter values in: mm            │
│ Width  ┌────────────┐             Width  ┌────────────┐                 │
│        │   76.2     │                    │   44.5     │                 │
│        └────────────┘                    └────────────┘                 │
│        Enter values in: mm               Enter values in: mm            │
│                                                                          │
│ Freezer                                                                  │
│ Height ┌────────────┐                                                   │
│        │   25.4     │                                                   │
│        └────────────┘                                                   │
│        Enter values in: mm                                              │
│ Width  ┌────────────┐                                                   │
│        │   50.8     │                                                   │
│        └────────────┘                                                   │
│        Enter values in: mm                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Order Entry - Labels Section

### 3.1 Location

Add new "Labels" section on the **Add Order** step (Step 4), positioned between the existing **ORDER** section and the **RESULT REPORTING** section.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Test Request                                                             │
│                                                                          │
│ [✓ Patient Info] [✓ Program Selection] [✓ Add Sample] [● Add Order]     │
│                                                                          │
│ ┌─ ORDER ───────────────────────────────────────────────────────────┐   │
│ │  Lab Number, Priority, Request Date, Received Date, Site, etc.    │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─ LABELS (NEW) ────────────────────────────────────────────────────┐   │
│ │  Configure label quantities for this order                        │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─ RESULT REPORTING ────────────────────────────────────────────────┐   │
│ │  ...                                                               │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 UI Design - Label Configuration

```
┌─────────────────────────────────────────────────────────────────────────┐
│ LABELS                                                                   │
│                                                                          │
│ Configure the number of labels to generate when this order is saved.    │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                     │ │
│ │  Item                    Order  Specimen  Block  Slide  Freezer    │ │
│ │  ─────────────────────────────────────────────────────────────────  │ │
│ │                                                                     │ │
│ │  📋 Order                [ 2 ]    —        —      —       —        │ │
│ │                                                                     │ │
│ │  ─────────────────────────────────────────────────────────────────  │ │
│ │                                                                     │ │
│ │  🧪 Sample 1 - Blood     —      [ 1 ]   [ 0 ]  [ 0 ]   [ 0 ]       │ │
│ │     (EDTA Tube)                                                     │ │
│ │                                                                     │ │
│ │  ─────────────────────────────────────────────────────────────────  │ │
│ │                                                                     │ │
│ │  🧪 Sample 2 - Tissue    —      [ 1 ]   [ 4 ]  [ 8 ]   [ 2 ]       │ │
│ │     (Formalin Container)                                            │ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Total Labels: Order: 2 | Specimen: 2 | Block: 4 | Slide: 8 | Freezer: 2│
│                                                                          │
│  ℹ️ Labels will be available to print after the order is saved and a    │
│     lab number is assigned.                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Behavior

| Element | Behavior |
|---------|----------|
| **Order row** | Only shows Order label count (other types N/A) |
| **Sample rows** | Shows Specimen, Block, Slide, Freezer counts |
| **Default values** | Pre-populated from Barcode Configuration defaults |
| **Number inputs** | Editable, validated against max limits |
| **Total Labels** | Live summary of all labels to be generated |
| **Save behavior** | Label quantities saved with order; printing offered after save |

**Important:** The lab number is not assigned until the order is saved. Therefore, label printing must occur AFTER the save dialog, not before.

### 3.4 Post-Save Label Printing

After the order is successfully saved and a lab number is assigned, the system presents a label printing dialog:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ✓ Order Saved Successfully                                               │
│                                                                          │
│ Lab Number: 24ORD00152                                                   │
│                                                                          │
│ ┌─ Print Labels ────────────────────────────────────────────────────┐   │
│ │                                                                    │   │
│ │  Each label type opens as a PDF in a new tab for printing.        │   │
│ │  Different sizes must be printed separately.                      │   │
│ │                                                                    │   │
│ │  Label Type              Qty       Size              Action       │   │
│ │  ─────────────────────────────────────────────────────────────────│   │
│ │  Order Labels             2        25.4 × 76.2 mm   [🖨️ Print]   │   │
│ │  Specimen Labels          2        25.4 × 76.2 mm   [🖨️ Print]   │   │
│ │  Block Labels             4        25.4 × 76.2 mm   [🖨️ Print]   │   │
│ │  Slide Labels             8        12.7 × 44.5 mm   [🖨️ Print]   │   │
│ │  Freezer Labels           2        25.4 × 50.8 mm   [🖨️ Print]   │   │
│ │                                                                    │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│                                                    [Done]                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.5 Print Handling

Each label type generates a **separate PDF** that opens in a new browser tab:
- User prints from the browser's native print dialog
- Different label sizes require different paper/stock, hence separate PDFs
- Freezer labels use more expensive cryogenic-resistant stock (smaller size)

| Print Action | Behavior |
|--------------|----------|
| **Print button (per type)** | Opens PDF in new tab with labels of that type |
| **Done** | Closes dialog; returns to Order View |
| **Reprint from Order View** | Same print buttons available on Order View page |

The PDF is sized to match the configured label dimensions, allowing the user to select the appropriate printer and paper in the browser print dialog.

---

## 4. Functional Requirements

### 4.1 Barcode Configuration

| ID | Requirement |
|----|-------------|
| BC-1 | System SHALL support Freezer label type with default count, max count, and dimensions |
| BC-2 | System SHALL support Block label default count and max count |
| BC-3 | System SHALL support Slide label default count and max count |
| BC-4 | System SHALL validate dimension values are positive numbers |
| BC-5 | System SHALL validate default count ≤ max count |

### 4.2 Order Entry Labels Section

| ID | Requirement |
|----|-------------|
| OE-1 | System SHALL display Labels section on Add Order step |
| OE-2 | System SHALL position Labels section between ORDER and RESULT REPORTING |
| OE-3 | System SHALL pre-populate label counts from Barcode Configuration defaults |
| OE-4 | System SHALL display one row for the Order with Order label count |
| OE-5 | System SHALL display one row per Sample with Specimen, Block, Slide, Freezer counts |
| OE-6 | User MAY edit label counts within allowed range (0 to max) |
| OE-7 | System SHALL display running total of labels by type |
| OE-8 | System SHALL save label quantities with order when Save is clicked |
| OE-9 | System SHALL NOT allow printing until order is saved and lab number assigned |

### 4.3 Post-Save Label Printing

| ID | Requirement |
|----|-------------|
| PS-1 | After successful order save, system SHALL display label printing dialog |
| PS-2 | Each label type SHALL have a Print button |
| PS-3 | Print button SHALL open a PDF in a new browser tab |
| PS-4 | PDF SHALL be sized to match configured label dimensions |
| PS-5 | User MAY close dialog without printing (print later from Order View) |
| PS-6 | System SHALL allow re-printing labels from Order View page |
| PS-7 | System SHALL track number of labels printed per order (for max limit enforcement) |

### 4.4 Label Content

| Label Type | Mandatory Elements | Optional Elements |
|------------|-------------------|-------------------|
| Order | Lab Number | Patient Name, Patient ID, Patient DOB, Site ID |
| Specimen | Lab Number | Patient Name, Patient ID, Patient DOB, Collection Date/Time, Collected By, Tests, Patient Sex |
| Block | Lab Number | Patient ID, Block ID, Specimen Type, Case Number |
| Slide | Lab Number | Patient ID, Slide ID, Stain Type, Block ID, Case Number |
| Freezer | Lab Number | Patient ID, Storage Location, Specimen Type, Collection Date, Expiry Date |

**Note:** Only the Lab Number is mandatory on all label types. All other fields are optional to support varying lab requirements and scenarios where certain data may not be available or appropriate to include.

---

## 5. Data Model Updates

### 5.1 site_information Updates

| Key | Type | Description |
|-----|------|-------------|
| `barcode.freezer.default` | Integer | Default freezer labels per sample |
| `barcode.freezer.max` | Integer | Maximum freezer labels per sample |
| `barcode.freezer.height` | Decimal | Freezer label height (mm) |
| `barcode.freezer.width` | Decimal | Freezer label width (mm) |
| `barcode.block.default` | Integer | Default block labels per sample |
| `barcode.block.max` | Integer | Maximum block labels per sample |
| `barcode.slide.default` | Integer | Default slide labels per sample |
| `barcode.slide.max` | Integer | Maximum slide labels per sample |

### 5.2 Order Label Request (Transient)

```typescript
interface OrderLabelRequest {
  orderId: string;
  orderLabels: number;
  samples: SampleLabelRequest[];
}

interface SampleLabelRequest {
  sampleId: string;
  specimenLabels: number;
  blockLabels: number;
  slideLabels: number;
  freezerLabels: number;
}
```

---

## 6. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/barcode/config` | Get barcode configuration |
| PUT | `/api/barcode/config` | Update barcode configuration |
| GET | `/api/barcode/print/{orderId}/{labelType}` | Generate PDF for label type (opens in new tab) |
| GET | `/api/barcode/print/{orderId}/{labelType}/{sampleId}` | Generate PDF for specific sample's labels |

---

## 7. Acceptance Criteria

### Barcode Configuration
- [ ] **AC-1**: Freezer label type appears on Barcode Configuration page
- [ ] **AC-2**: Freezer has default count, max count, height, and width settings
- [ ] **AC-3**: Block has default count and max count settings
- [ ] **AC-4**: Slide has default count and max count settings
- [ ] **AC-5**: Settings persist after save

### Order Entry Labels Section
- [ ] **AC-6**: Labels section appears on Add Order step
- [ ] **AC-7**: Labels section positioned between ORDER and RESULT REPORTING
- [ ] **AC-8**: Order row shows Order label count only
- [ ] **AC-9**: Sample rows show Specimen, Block, Slide, Freezer counts
- [ ] **AC-10**: Default values pre-populated from Barcode Configuration
- [ ] **AC-11**: User can edit counts within 0 to max range
- [ ] **AC-12**: Total labels summary updates in real-time
- [ ] **AC-13**: Label quantities saved with order on Save

### Post-Save Label Printing
- [ ] **AC-14**: After save, label printing dialog appears with assigned lab number
- [ ] **AC-15**: Each label type has a Print button that opens a PDF in a new browser tab
- [ ] **AC-16**: PDF is sized to match configured label dimensions
- [ ] **AC-17**: User can close dialog and print later from Order View
- [ ] **AC-18**: Labels can be reprinted from Order View page

---

## 8. Dependencies

| Dependency | Description |
|------------|-------------|
| PDF generation library | For generating label PDFs (e.g., iText, Apache PDFBox) |
| Barcode generation | For generating Code128/QR codes on labels |

---

## 9. Future Considerations (v2)

See separate FRS for Phase 2:
- Dynamic label presets (admin-configurable)
- Custom label names, contents, and dimensions
- Test catalog integration for default label counts per test
