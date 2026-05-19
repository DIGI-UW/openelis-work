# OpenELIS Global — Barcode Labels v1: Order & Specimen Label Configuration

## Functional Requirements Specification

**Version:** 1.2 (scope-narrowed to Order + Specimen; Block / Slide / Freezer migrate to OGC-285)
**Original Date:** December 2025
**Rewrite Date:** 2026-05-18
**Author:** Casey Iiams-Hauser (rewrite via Cowork)
**Module:** Administration → Master Lists → Barcode Configuration
**Route:** `/MasterListsPage#barcodeConfiguration`
**Jira:** [OGC-284](https://uwdigi.atlassian.net/browse/OGC-284) (Done — superseded by OGC-285; see §10)
**Successor:** [OGC-285](https://uwdigi.atlassian.net/browse/OGC-285) — Barcode Labels v2: Configurable Label Preset Management

---

## 1. Overview

### 1.1 Purpose

Establish OpenELIS Global's baseline barcode-label configuration: a minimal admin page that lets a lab administrator set the default count, max count, dimensions, and optional content for the two label types every deployment uses — **Order** and **Specimen**.

Any additional label types a site needs (Block, Slide, Freezer, custom presets) are out of scope here and ship through the configurable Label Preset system in **[OGC-285](https://uwdigi.atlassian.net/browse/OGC-285) — Barcode Labels v2**, which lets admins activate, rename, or extend label presets without code changes.

### 1.2 Problem Statement

| Limitation | Impact |
|---|---|
| **Hard-coded label-type list** | The original admin page hard-coded every label type (Order, Specimen, Block, Slide, Freezer) as a permanent column. Any site without pathology or storage workflows still saw the unused types. Sites that needed a sixth type had no way to add one. |
| **Same admin page mixed required and rarely-used types** | The page was crowded with Block / Slide / Freezer columns that only a minority of deployments configured, making the common Order / Specimen workflow harder to scan. |

### 1.3 Solution Summary

Two coordinated changes, split across two tickets:

1. **v1 (this FRS, OGC-284) — Barcode Configuration admin page.** The admin page is intentionally minimal: it configures **only the two system-default label types, Order and Specimen** (default count, max count, dimensions, optional content fields). This is the baseline every OpenELIS deployment needs.
2. **v2 ([OGC-285](https://uwdigi.atlassian.net/browse/OGC-285)) — everything else.** Block, Slide, Freezer, and any other site-specific label types ship as **seeded Label Presets** that admins activate on the new Label Presets admin page if they need them. The Order Entry Labels section (per-order quantity entry) and the post-save print dialog (per-type PDFs) also ship as part of OGC-285, not here.

The split reflects Casey's decision (May 2026): keep v1 flexible — show only Order and Specimen by default, and let admins add additional label types and per-order quantities through v2 rather than baking a fixed five-type list into the platform.

### 1.4 Users

| Role | Benefits |
|---|---|
| Lab Administrator | Configure default count, max count, dimensions, and optional content for the Order and Specimen label types every deployment uses. |
| Lab Technician | Print Order and Specimen labels at the per-order default unless a max increase is needed; v2 adds the per-order quantity controls. |

---

## 2. Barcode Configuration Page (Order + Specimen Only)

### 2.1 Scope

The Barcode Configuration page at `/MasterListsPage#barcodeConfiguration` configures the two system-default label types every OpenELIS deployment uses:

- **Order** labels — one or more per order
- **Specimen** labels — one or more per specimen container

All other label types (Block, Slide, Freezer, site-specific) are managed in **OGC-285 → Label Presets** and are not configurable here.

### 2.2 Settings Matrix

| Setting | Order | Specimen |
|---|---|---|
| Default count | ✓ | ✓ |
| Max count | ✓ | ✓ |
| Height (mm) | ✓ | ✓ |
| Width (mm) | ✓ | ✓ |

### 2.3 Optional Content Fields (Label Elements)

Each label type has its own "Barcode Label Elements" checkbox list for optional content. Lab Number is always required (cannot be unchecked).

| Label Type | Mandatory | Optional |
|---|---|---|
| Order | Lab Number | Patient Name, Patient ID, Patient DOB, Site ID |
| Specimen | Lab Number | Patient Name, Patient ID, Patient DOB, Collection Date/Time, Collected By, Tests, Patient Sex |

### 2.4 Validation Rules

| Rule | Enforcement |
|---|---|
| Default count is a non-negative integer | Field-level validation on blur. |
| Max count is a positive integer | Field-level validation on blur. |
| Default ≤ Max | Cross-field validation on save (Order and Specimen). |
| Height and Width are positive decimals (mm) | Field-level validation. |

---

## 3. Order Entry — Labels Section (Shipping in OGC-285)

The Order Entry Labels section (per-order quantity entry on Add Order Step 4) and the post-save print dialog (per-type PDFs with editable quantities) **ship as part of [OGC-285 — Barcode Labels v2](https://uwdigi.atlassian.net/browse/OGC-285)**. Until v2 lands, order save continues to print labels through the existing combined-PDF flow.

See `barcode-labels-v2.md` §3 (Enhanced Order Entry) and §4 (Post-Save Print Dialog) for the full design. The v2 post-save dialog supports **editable quantities inline** so a technician who entered the wrong count at order entry can correct it in the dialog before pressing Print.

---

## 4. Functional Requirements

### 4.1 Barcode Configuration

| ID | Requirement |
|---|---|
| BC-1 | System SHALL support Order and Specimen label types with default count, max count, height, and width. |
| BC-2 | System SHALL validate dimension values are positive decimals. |
| BC-3 | System SHALL validate default count ≤ max count for both Order and Specimen. |

### 4.2 Order Entry & Post-Save Printing

Covered by OGC-285. See `barcode-labels-v2.md` §4 for the Enhanced Order Entry FRs and §5 for the post-save print dialog FRs (including editable per-row quantities).

---

## 5. Data Model

### 5.1 site_information Keys (Order + Specimen)

The Barcode Configuration page reads and writes the existing `site_information` keys for Order and Specimen. No new keys are introduced by v1.

| Key | Type | Description |
|---|---|---|
| `barcode.order.default` | Integer | Default order labels per order |
| `barcode.order.max` | Integer | Max order labels per order |
| `barcode.order.height` | Decimal | Order label height (mm) |
| `barcode.order.width` | Decimal | Order label width (mm) |
| `barcode.specimen.default` | Integer | Default specimen labels per specimen |
| `barcode.specimen.max` | Integer | Max specimen labels per specimen |
| `barcode.specimen.height` | Decimal | Specimen label height (mm) |
| `barcode.specimen.width` | Decimal | Specimen label width (mm) |

> **Note on legacy keys.** Earlier builds of OGC-284 also persisted `barcode.{block,slide,freezer}.*` keys. Those keys remain readable in production but are not editable on the v1 admin page; they migrate to `label_preset` rows at the OGC-285 cut-over (see §10).

### 5.2 Per-Order Label Persistence & Print Tracking

The transient per-order label request, persistent per-order label quantities, and `order_label_print_log` schema move to OGC-285 along with the Order Entry section that produces them. See `barcode-labels-v2.md` §6 (Data Model).

---

## 6. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/barcode/config` | Read barcode configuration (Order + Specimen settings). |
| PUT | `/api/barcode/config` | Update barcode configuration (Order + Specimen settings). |

Per-preset print endpoints (`/api/barcode/print/{orderId}/{presetId}`) are introduced by OGC-285. See `barcode-labels-v2.md` §7.

---

## 7. Acceptance Criteria

### Barcode Configuration (Order + Specimen)
- [ ] **AC-1** — Order and Specimen each have configurable default count, max count, height, and width on the admin page.
- [ ] **AC-2** — Order and Specimen each have configurable optional content fields per §2.3.
- [ ] **AC-3** — Validation prevents default > max for both Order and Specimen, and rejects non-positive dimensions; errors render inline.
- [ ] **AC-4** — Settings persist after Save and are reflected on subsequent label print jobs.

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

## 10. Implementation History & v2 Migration (May 2026)

> **Status:** OGC-284 was closed as **Done** in early 2026. A May 2026 audit reviewed what shipped against the original FRS scope. The remaining FRS surfaces are not being filed as a v1 follow-up — they are picked up natively by **[OGC-285 — Barcode Labels v2](https://uwdigi.atlassian.net/browse/OGC-285)**, which is a better home for them than retrofitting v1.

### 10.1 What shipped under OGC-284

| Surface | Outcome |
|---|---|
| Order + Specimen default count, max count, dimensions, content fields | ✅ Shipped as documented in §2. Persisted in `site_information` under `barcode.order.*` and `barcode.specimen.*`. |
| Block + Slide default and max counts | ✅ Settings landed on the Barcode Configuration page in early 2026. Persisted in `site_information` under `barcode.{block,slide}.*`. |
| Freezer label type (default, max, height, width, content fields) | ✅ Settings landed on the Barcode Configuration page in early 2026. Persisted in `site_information` under `barcode.freezer.*`. |
| Combined-PDF print at order save | ✅ Continues to work as-is (all label types printed together as one job, sized to the Order label dimensions). |

### 10.2 Superseded by OGC-285 (v2)

The following surfaces from the original v1 FRS are **not being filed as a v1 follow-up ticket**. They ship as part of **[OGC-285 — Barcode Labels v2](https://uwdigi.atlassian.net/browse/OGC-285)**:

| Original v1 surface | OGC-285 disposition |
|---|---|
| Block / Slide / Freezer settings on the admin page | Migrate from the v1 Barcode Configuration page into v2 **Label Presets** as seeded presets (`p-ffpe`, `p-slide`, `p-cryo`, etc.). Admins activate them on the Label Presets admin page if their deployment needs them; sites that don't need pathology or storage labels simply leave them inactive. |
| Order Entry → Add Order Step 4 Labels section (per-row, per-type quantity entry) | Built as part of v2's **Enhanced Order Entry** view, with quantities driven by Test Catalog linkage and editable per row. |
| Post-save print dialog with per-type Print buttons + Skip / Print Later | Built as part of v2's **Enhanced Order Entry** view; sized per active preset; supports editable quantities at the dialog so a tech can correct counts before printing. |
| Per-type PDF endpoint (`/api/barcode/print/{orderId}/{labelType}`) | Built under OGC-285 as `/api/barcode/print/{orderId}/{presetId}` (preset-scoped instead of fixed-type-scoped). |
| Per-type reprint on Order View | Built under OGC-285 alongside the per-preset Print buttons. |

### 10.3 Inherited acceptance criteria

The new sample-registration "Label & Store" step described in [OGC-358](https://uwdigi.atlassian.net/browse/OGC-358) is still backlog. Its label-printing acceptance criteria (LBL-2) are picked up by OGC-285's Enhanced Order Entry view, which the new UI flow will consume directly — no separate inherited-AC entry is needed.

### 10.4 Impact

| Stakeholder | Impact |
|---|---|
| Sites that use only Order + Specimen labels | None — the v1 admin page covers their full configuration need. |
| Pathology / storage sites | Continue to use the existing combined-PDF print path until OGC-285 ships. Block, Slide, and Freezer settings remain editable through the legacy `site_information` keys but no longer appear on the v1 admin page. |

### 10.5 Disposition

- **OGC-284 stays Done.** v1.2 of this FRS narrows its admin-page scope to Order + Specimen to match what the platform should expose at the baseline level.
- **Legacy `site_information.barcode.{block,slide,freezer}.*` keys remain in production** and continue to drive the existing combined-PDF print until OGC-285 migrates them into `label_preset` rows.
- **Users continue to use the existing combined-PDF print** at order save until v2 ships the per-type post-save dialog with editable quantities.
- **No v1 follow-up ticket required.** The remaining v1 FRS surfaces are tracked under OGC-285.

---

## 11. References

- [OGC-284 in Jira](https://uwdigi.atlassian.net/browse/OGC-284) — this ticket (Done; v1 baseline configuration)
- [OGC-285 — Barcode Labels v2 in Jira](https://uwdigi.atlassian.net/browse/OGC-285) — successor; carries the Block / Slide / Freezer presets, Order Entry Labels section, and post-save print dialog
- [OGC-358 — new UI Label & Store step](https://uwdigi.atlassian.net/browse/OGC-358) — consumes the v2 Enhanced Order Entry view
- v1 mockup: `barcode-config.jsx`
- v2 FRS: `barcode-labels-v2.md`
- v2 mockup: `barcode-labels-v2.jsx`
- [BARCODE CONFIGURATION user guide on Confluence](https://uwdigi.atlassian.net/wiki/spaces/oeg/pages/452132880/BARCODE+CONFIGURATION) — admin documentation by Taib
