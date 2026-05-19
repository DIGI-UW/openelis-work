# OpenELIS Global — Barcode Labels v1: Freezer Labels & Order Entry Label Configuration

## Functional Requirements Specification

**Version:** 1.1 (cohesive rewrite + implementation gap analysis)
**Original Date:** December 2025
**Rewrite Date:** 2026-05-18
**Author:** Casey Iiams-Hauser (rewrite via Cowork)
**Module:** Administration → Master Lists → Barcode Configuration · Order Entry → Add Order step
**Route:** `/MasterListsPage#barcodeConfiguration`
**Jira:** [OGC-284](https://uwdigi.atlassian.net/browse/OGC-284) (Done — but with gaps; see §10)
**Successor:** [OGC-285](https://uwdigi.atlassian.net/browse/OGC-285) — Barcode Labels v2: Configurable Label Preset Management

---

## 1. Overview

### 1.1 Purpose

Enhance OpenELIS Global's barcode label configuration and printing workflow to:

1. Support a **Freezer** label type in addition to the four originally-shipped label types (Order, Specimen, Block, Slide).
2. Round out **Block** and **Slide** so they have full default-count and max-count settings (not just dimensions).
3. Allow technicians to **customize label quantities at Order Entry** instead of always taking the system default.
4. Print labels **after** the order is saved and a lab number is assigned, with a per-type print dialog that supports separate label stocks and skip-and-print-later.

### 1.2 Problem Statement

| Limitation | Impact |
|---|---|
| **Fixed label types** | Only Order and Specimen had default+max+dimensions configuration. Block and Slide had dimensions only. Freezer was not supported at all, so pathology and storage workflows could not generate the labels they needed. |
| **No user control at order entry** | The system applied default counts globally with no way to adjust per order. A technician registering a single specimen could not print extra storage labels without admin intervention. |
| **All-or-nothing printing** | All label types printed together as one job. Freezer labels — which use expensive cryogenic stock — were printed even when not needed, wasting consumables. |

### 1.3 Solution Summary

Three coordinated changes:

1. **Barcode Configuration admin page** — add Freezer settings (default, max, height, width) and round out Block + Slide with default and max counts.
2. **Order Entry Labels section** — new section on Step 4 of Add Order, pre-populated from defaults, editable per order/per sample, with a running total.
3. **Post-save print dialog** — after a lab number is assigned on save, surface a per-type print dialog with separate Print buttons (one PDF per type) and a Skip / Print Later option that mirrors to Order View.

### 1.4 Users

| Role | Benefits |
|---|---|
| Lab Technician | Customize label counts per order; print only the types needed for this specific case. |
| Pathology Staff | Generate block/slide/freezer labels at sample registration time. |
| Lab Administrator | Configure default and max counts for all five label types, including dimensions. |

---

## 2. Barcode Configuration Page Updates

### 2.1 Current State (pre-OGC-284)

The Barcode Configuration page at `/MasterListsPage#barcodeConfiguration` supported:

- **Order** labels — default count, max count, dimensions
- **Specimen** labels — default count, max count, dimensions
- **Block** labels — dimensions only
- **Slide** labels — dimensions only
- **Freezer** labels — not supported

### 2.2 Required Changes

Add **Freezer** label settings and round out Block + Slide:

| Setting | Order | Specimen | Block | Slide | Freezer |
|---|---|---|---|---|---|
| Default count | ✓ existing | ✓ existing | **add** | **add** | **add (new)** |
| Max count | ✓ existing | ✓ existing | **add** | **add** | **add (new)** |
| Height (mm) | ✓ existing | ✓ existing | ✓ existing | ✓ existing | **add (new)** |
| Width (mm) | ✓ existing | ✓ existing | ✓ existing | ✓ existing | **add (new)** |

### 2.3 Optional Content Fields (Label Elements)

Each label type has its own "Barcode Label Elements" checkbox list for optional content. Lab Number is always required (cannot be unchecked).

| Label Type | Mandatory | Optional |
|---|---|---|
| Order | Lab Number | Patient Name, Patient ID, Patient DOB, Site ID |
| Specimen | Lab Number | Patient Name, Patient ID, Patient DOB, Collection Date/Time, Collected By, Tests, Patient Sex |
| Block | Lab Number | Patient ID, Block ID, Specimen Type, Case Number |
| Slide | Lab Number | Patient ID, Slide ID, Stain Type, Block ID, Case Number |
| Freezer (new) | Lab Number | Patient ID, Storage Location, Specimen Type, Collection Date, Expiry Date |

### 2.4 Validation Rules

| Rule | Enforcement |
|---|---|
| Default count is a non-negative integer | Field-level validation on blur. |
| Max count is a positive integer | Field-level validation on blur. |
| Default ≤ Max | Cross-field validation on save. |
| Height and Width are positive decimals (mm) | Field-level validation. |

---

## 3. Order Entry — Labels Section

### 3.1 Location

A new **Labels** section on the Order Entry → Add Order step (Step 4), positioned between the existing **ORDER** section and the **RESULT REPORTING** section.

### 3.2 Layout

A single table:

| Row | Order col | Specimen col | Block col | Slide col | Freezer col |
|---|---|---|---|---|---|
| **Order** | NumberInput (default from config) | — | — | — | — |
| **Sample 1** (e.g., Blood / EDTA) | — | NumberInput | NumberInput | NumberInput | NumberInput |
| **Sample N** | — | NumberInput | NumberInput | NumberInput | NumberInput |
| **Total** | sum | sum | sum | sum | sum |

Cell defaults come from Barcode Configuration. Each cell is editable within `[0, max]` for that type.

Below the table: a summary line — "Total Labels: Order 2 · Specimen 2 · Block 4 · Slide 8 · Freezer 2".

Below the summary: an inline notification — "Labels will be available to print after the order is saved and a lab number is assigned."

### 3.3 Behavior

| Element | Behavior |
|---|---|
| Number inputs | Editable. Validated against max on blur. Range error renders inline. |
| Total row | Live sum, updates on every change. |
| Save behavior | Label quantities persist with the order. No printing happens on Step 4. |
| Lab number gate | Lab number is not assigned until Save; printing must occur after save. |

### 3.4 Post-Save Print Dialog

After a successful Save, the system displays a printing dialog showing:

- The assigned Lab Number.
- One row per label type with a non-zero count: type name, quantity, configured size, Print button.
- A `Skip — Print Later` option that closes the dialog and returns to Order View, where the same Print buttons remain available.

Each Print button opens a PDF in a new browser tab, sized to the configured dimensions for that type, allowing the user to select the appropriate printer and stock in the browser print dialog.

### 3.5 Why Separate Print Jobs

| Reason | Impact |
|---|---|
| Different sizes per type | A single PDF would force a one-size-fits-all paper stock. Separate PDFs let the user select different printers per type. |
| Expensive cryogenic stock for Freezer | Only print Freezer labels when actually needed, on a dedicated thermal printer if available. |
| Slide labels are narrow format | Often go to a dedicated label printer. |
| Reprint flexibility | A failed print on one type doesn't waste stock on others. |

---

## 4. Functional Requirements

### 4.1 Barcode Configuration

| ID | Requirement |
|---|---|
| BC-1 | System SHALL support Freezer label type with default count, max count, height, and width. |
| BC-2 | System SHALL support Block label default count and max count. |
| BC-3 | System SHALL support Slide label default count and max count. |
| BC-4 | System SHALL validate dimension values are positive decimals. |
| BC-5 | System SHALL validate default count ≤ max count. |
| BC-6 | System SHALL support Freezer-specific optional content fields (Patient ID, Storage Location, Specimen Type, Collection Date, Expiry Date). |

### 4.2 Order Entry Labels Section

| ID | Requirement |
|---|---|
| OE-1 | System SHALL display a Labels section on Add Order step. |
| OE-2 | System SHALL position the Labels section between ORDER and RESULT REPORTING. |
| OE-3 | System SHALL pre-populate label counts from Barcode Configuration defaults. |
| OE-4 | System SHALL display one row for the Order with Order label count only. |
| OE-5 | System SHALL display one row per Sample with Specimen / Block / Slide / Freezer columns. |
| OE-6 | User MAY edit label counts within `[0, max]`. |
| OE-7 | System SHALL display a running total of labels by type. |
| OE-8 | System SHALL save label quantities with the order on Save. |
| OE-9 | System SHALL NOT allow printing until the order is saved and a lab number is assigned. |

### 4.3 Post-Save Label Printing

| ID | Requirement |
|---|---|
| PS-1 | After successful order save, system SHALL display a printing dialog. |
| PS-2 | Each label type with a non-zero count SHALL have a Print button. |
| PS-3 | Print button SHALL open a PDF in a new browser tab. |
| PS-4 | PDF SHALL be sized to match the configured label dimensions. |
| PS-5 | User MAY close the dialog without printing and reprint later from Order View. |
| PS-6 | System SHALL allow reprinting from the Order View page. |
| PS-7 | System SHALL track labels printed per order for max-limit enforcement. |

---

## 5. Data Model

### 5.1 site_information Key Additions

| Key | Type | Description |
|---|---|---|
| `barcode.freezer.default` | Integer | Default freezer labels per sample |
| `barcode.freezer.max` | Integer | Max freezer labels per sample |
| `barcode.freezer.height` | Decimal | Freezer label height (mm) |
| `barcode.freezer.width` | Decimal | Freezer label width (mm) |
| `barcode.block.default` | Integer | Default block labels per sample |
| `barcode.block.max` | Integer | Max block labels per sample |
| `barcode.slide.default` | Integer | Default slide labels per sample |
| `barcode.slide.max` | Integer | Max slide labels per sample |

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

### 5.3 Order Label Persistence

Label quantities persist with the order so reprints from Order View use the originally-saved counts, not the latest defaults. Stored alongside the order as a JSON column or a denormalized `order_label_count` table — implementation choice left to engineering.

### 5.4 Print Tracking

To back **PS-7** (max-limit enforcement on reprint), the system tracks labels printed per order per type:

```sql
CREATE TABLE order_label_print_log (
  id            BIGSERIAL PRIMARY KEY,
  order_id      BIGINT NOT NULL,
  sample_id     BIGINT,                            -- null for Order-category labels
  label_type    VARCHAR(20) NOT NULL CHECK (label_type IN ('ORDER','SPECIMEN','BLOCK','SLIDE','FREEZER')),
  qty_printed   INTEGER NOT NULL CHECK (qty_printed >= 0),
  printed_by    BIGINT NOT NULL,                   -- user id
  printed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

A reprint that would push the cumulative `SUM(qty_printed)` per (order_id, sample_id, label_type) over the configured max blocks with an inline error.

---

## 6. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/barcode/config` | Read barcode configuration. |
| PUT | `/api/barcode/config` | Update barcode configuration. |
| GET | `/api/barcode/print/{orderId}/{labelType}` | Generate PDF for a label type for the order. |
| GET | `/api/barcode/print/{orderId}/{labelType}/{sampleId}` | Generate PDF for a label type, scoped to one sample. |

---

## 7. Acceptance Criteria

### Barcode Configuration
- [ ] **AC-1** — Freezer label type appears on the Barcode Configuration page.
- [ ] **AC-2** — Freezer has default count, max count, height, and width settings.
- [ ] **AC-3** — Block has default count and max count settings (in addition to dimensions).
- [ ] **AC-4** — Slide has default count and max count settings (in addition to dimensions).
- [ ] **AC-5** — All five label types have configurable optional content fields per §2.3.
- [ ] **AC-6** — Settings persist after Save.

### Order Entry Labels Section
- [ ] **AC-7** — Labels section appears on Add Order step (Step 4).
- [ ] **AC-8** — Labels section positioned between ORDER and RESULT REPORTING.
- [ ] **AC-9** — Order row shows Order label count only.
- [ ] **AC-10** — Sample rows show Specimen, Block, Slide, Freezer counts.
- [ ] **AC-11** — Default values pre-populated from Barcode Configuration.
- [ ] **AC-12** — User can edit counts within 0 to max range; out-of-range entries show inline error.
- [ ] **AC-13** — Total summary updates in real time.
- [ ] **AC-14** — Label quantities saved with the order on Save.

### Post-Save Label Printing
- [ ] **AC-15** — After save, a label printing dialog appears with the assigned lab number.
- [ ] **AC-16** — Each label type has its own Print button that opens a PDF in a new browser tab.
- [ ] **AC-17** — PDF is sized to match the configured label dimensions for that type.
- [ ] **AC-18** — User can close the dialog and print later from Order View.
- [ ] **AC-19** — Labels can be reprinted from Order View.
- [ ] **AC-20** — Reprint count is tracked; max enforcement prevents exceeding the configured max.

---

## 8. Dependencies

| Dependency | Status |
|---|---|
| PDF generation library | In production (used by existing label flow). |
| Barcode generation library | In production. |

---

## 9. Future Considerations

This v1 release covers fixed system label types. The Barcode Labels v2 release ([OGC-285](https://uwdigi.atlassian.net/browse/OGC-285)) adds:

- Admin-configurable dynamic label presets (custom names, dimensions, barcode style, content fields)
- Test Catalog integration — per-test default label counts
- Order Entry aggregation rules driven by tests-on-order

See `barcode-labels-v2.md` for the full v2 FRS.

---

## 10. Implementation Gap Analysis (May 2026)

> **Status:** OGC-284 was closed as **Done** in early 2026. A May 2026 audit confirms that only **part** of the FRS shipped to production. This section documents the gap precisely so a follow-up ticket can close it. The follow-up ticket is currently being scoped with Piotr; once filed it will be linked here.

### 10.1 What shipped ✅

| Section | Acceptance Criteria | Shipped? |
|---|---|---|
| §2 Barcode Configuration — Freezer settings | AC-1, AC-2 | ✅ Freezer default, max, height, width appear on the admin page and persist. |
| §2 Barcode Configuration — Block / Slide defaults & max | AC-3, AC-4 | ✅ Settings present on the admin page. |
| §2 Barcode Configuration — content fields | AC-5 | ✅ Per-type checkbox list works including the new Freezer fields. _(Verified at the admin surface; needs a confirmation pass that saved selections persist correctly across all five types in production data.)_ |

### 10.2 What did NOT ship ❌

| Section | Acceptance Criteria | Missing |
|---|---|---|
| §3.1–§3.3 Order Entry Labels section | AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14 | ❌ The legacy Order Entry → Add Order step does **not** render a Labels section. Quantities cannot be adjusted at order entry; system defaults are applied unconditionally. |
| §3.4 Post-save print dialog | AC-15, AC-16, AC-17, AC-18 | ❌ No post-save print dialog appears. Labels print as a single combined job at order save, not per type. The Skip / Print Later affordance does not exist. |
| §3.5 Per-type print PDFs | AC-16 (size match), AC-17 (size match) | ❌ A single PDF is generated for all types, sized to the Order label dimensions. Freezer labels (different stock, different size) cannot be printed correctly from Order Entry. |
| §6 API — per-type print | `/api/barcode/print/{orderId}/{labelType}` | ❌ Endpoint accepts only an orderId; type and sampleId scoping not implemented. |
| §7 Reprint from Order View | AC-19, AC-20 | ⚠️ Reprint exists but reuses the combined-PDF flow; per-type reprint is unavailable. |

### 10.3 New UI Order Entry (OGC-358) — Same Gap

The new sample-registration "Label & Store" step described in [OGC-358](https://uwdigi.atlassian.net/browse/OGC-358) is still backlog ("To be assigned"). Its acceptance criteria (LBL-2: "Print Labels section, same config as Step 1, including Freezer Labels") will need to inherit the same per-type quantity UI and post-save print dialog defined here. The gap-closing ticket SHOULD include an explicit inherited-AC line item on OGC-358 so parity is maintained when the new flow is built.

### 10.4 Impact

| Stakeholder | Impact |
|---|---|
| Pathology workflows | Cannot generate the expected Block / Slide / Freezer label counts at order entry without per-order admin intervention. |
| Freezer label workflows | Default freezer counts apply uniformly; expensive cryogenic stock is consumed even when not needed for the sample at hand. |
| Sites that adopted v1 expecting full functionality | Forced to manage label printing through Order View reprint flows, which were never designed as the primary surface. |

### 10.5 Recommended Resolution

**Owner:** TBD (pending Piotr's classification) · **Target version:** v1.1.x (next maintenance release) · **Size:** estimated L

A single follow-up ticket (Bug or Story — pending Piotr's classification) covering:

1. Restore the Labels section on Order Entry → Add Order Step 4 per §3.1–§3.3.
2. Implement the post-save print dialog per §3.4–§3.5 with per-type PDFs and Skip / Print Later.
3. Implement the per-type `/api/barcode/print/{orderId}/{labelType}` endpoint per §6.
4. Add Reprint-per-type capability on Order View, replacing the combined-PDF flow.
5. Add `order_label_print_log` schema per §5.4 to back PS-7 max-limit enforcement.
6. Add an inherited AC to OGC-358 so the new UI Label & Store step picks up the same behavior.

---

## 11. References

- [OGC-284 in Jira](https://uwdigi.atlassian.net/browse/OGC-284)
- [OGC-285 — Barcode Labels v2 in Jira](https://uwdigi.atlassian.net/browse/OGC-285)
- [OGC-358 — new UI Label & Store step](https://uwdigi.atlassian.net/browse/OGC-358)
- v1 mockup: `barcode-config.jsx`
- v2 FRS: `barcode-labels-v2.md`
- v2 mockup: `barcode-labels-v2.jsx`
- [BARCODE CONFIGURATION user guide on Confluence](https://uwdigi.atlassian.net/wiki/spaces/oeg/pages/452132880/BARCODE+CONFIGURATION) — admin documentation by Taib
