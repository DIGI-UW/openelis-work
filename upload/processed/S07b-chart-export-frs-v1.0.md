# S-07b — Chart PNG & Dashboard PDF Export
## Addendum to S-07: Environmental Dashboard & Trend Analysis (OGC-553)
### Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-20
**Status:** Draft for Review
**Addendum to:** [S-07 FRS — Environmental Dashboard & Trend Analysis](./S07-environmental-dashboard-frs-v1.0.md) / [OGC-553](https://uwdigi.atlassian.net/browse/OGC-553)
**Parent epic:** [OGC-527 — Environmental & Vector Testing Module](https://uwdigi.atlassian.net/browse/OGC-527)
**Source requirement:** PRD v0.5 §3.5: "Export of curve charts and map visualizations in PNG and PDF formats."

---

## 1. Overview

This addendum extends S-07 to add chart and dashboard export capabilities. The dashboard already supports CSV export of the exceedance table (S-07 §5.7). S-07b adds two complementary export paths:

- **Per-chart PNG download** — each chart panel exposes a download button on hover, allowing analysts to extract individual visualizations for reports and presentations.
- **Full-dashboard PDF export** — a toolbar action generates a single PDF capturing the entire dashboard in its current filtered state (date range, site selection, standard) for regulatory submissions and management reporting.

### 1.1 What this addendum adds

| Area | New capability |
|------|---------------|
| Per-chart PNG | Hover button on each chart panel triggers client-side SVG → PNG download |
| Full-dashboard PDF | Toolbar button opens config modal → server-side PDF generation |
| Export naming | Standardized file naming: site code, date range, export type |
| PDF page layout | One chart per page; cover page with filter metadata; footer with lab name + timestamp |
| Progress feedback | Inline progress indicator during PDF generation; success/error notification |
| Permission | New `ROLE_ENV_EXPORT` permission gates both export actions |

### 1.2 What this addendum does NOT change

- Chart types, data, or filtering logic — unchanged (S-07 §5.1–§5.6)
- CSV exceedance table export — unchanged (S-07 §5.7)
- Map visualization export — out of scope for S-07b (S-07 contains no geographic map component; if a map panel is added in a future sprint, the full-dashboard PDF mechanism extends to it automatically)

---

## 2. User Stories

- **US-01** — As an environmental analyst, I want to download a PNG of any individual chart so that I can paste it directly into a regulatory submission report without screenshotting.
- **US-02** — As a lab manager, I want to export the full dashboard as a PDF in its current filtered state so that I can share a snapshot of site compliance with stakeholders who do not have system access.
- **US-03** — As an analyst, I want the exported PDF to include the active filter context (site, date range, compliance standard) so that the reader knows exactly what data the charts represent.

---

## 3. Functional Requirements

### 3.1 Per-Chart PNG Export

**FR-01** — Each chart panel on the ENV dashboard MUST display a **Download PNG** icon button when the user hovers over the panel header. The button is always visible (not hover-only) on touch devices.

**FR-02** — Clicking Download PNG MUST capture the chart's rendered SVG (including axes, legend, reference lines, and title) and download it as a PNG file without any server round-trip.

**FR-03** — PNG export applies to all recharts-based panels in S-07:
- Compliance Rate Trend (multi-site line chart)
- Site Drill-Down (per-parameter line chart)
- Site Comparison (bar chart)

**FR-04** — The exported PNG file name MUST follow the format:
`ENV_[ChartType]_[SiteCode-or-ALL]_[YYYY-MM-DD].png`
Examples: `ENV_ComplianceTrend_ALL_2026-04-20.png`, `ENV_DrillDown_SITE-042_2026-04-20.png`

**FR-05** — PNG resolution MUST be at minimum 1200 × 800 px at 144 dpi (2× the screen render) to produce a usable print-quality image.

**FR-06** — The chart title, active filter context (site name and date range), and the lab name MUST be rendered into the PNG image itself, not just in the filename.

### 3.2 Full-Dashboard PDF Export

**FR-07** — The dashboard toolbar MUST include an **Export Dashboard PDF** button (secondary, with a Document icon) that opens the PDF configuration modal.

**FR-08** — The PDF configuration modal MUST display and allow the user to edit before generation:

| Field | Default | Notes |
|-------|---------|-------|
| Report title | "Environmental Compliance Dashboard" | Free-text, max 120 chars |
| Prepared by | Logged-in user's display name | Editable |
| Active filters (read-only) | Current site, date range, standard | Shown for confirmation; not editable here |
| Page layout | A4 Portrait | Fixed for v1.0 |
| Include cover page | Toggle, default ON | Shows lab name, logo, filter metadata, generation timestamp |
| Include exceedance table | Toggle, default ON | Appends the exceedance DataTable as the final page |

**FR-09** — On confirmation, the client MUST POST the current dashboard state (active filter parameters + chart data snapshot) to the server export endpoint. PDF generation MUST be handled server-side.

**FR-10** — The PDF MUST contain:
1. **Cover page** (if enabled): lab name, report title, prepared by, generation timestamp (UTC + local timezone offset), active filters
2. **One page per chart** in dashboard display order: Compliance Rate Trend → Site Drill-Down (if a site is selected) → Site Comparison
3. **Exceedance table page** (if enabled): full exceedance DataTable matching the active filter
4. **Footer on every page**: lab name · page N of M · "Generated by OpenELIS Global"

**FR-11** — During PDF generation the modal MUST show an inline progress indicator (`ProgressBar` indeterminate). The Export button becomes disabled. Generation MUST complete within 30 seconds; if it times out, the system MUST return an error notification.

**FR-12** — On success, the PDF MUST be downloaded automatically (`Content-Disposition: attachment`). The modal closes and an inline success notification appears in the dashboard toolbar area.

**FR-13** — On failure, the modal remains open and displays an inline error notification with the reason. The Export button re-enables.

**FR-14** — The PDF file name MUST follow the format:
`ENV_Dashboard_[SiteCode-or-ALL]_[DateRange].pdf`
Example: `ENV_Dashboard_SITE-042_2025-05-01_2026-04-20.pdf`

### 3.3 Permission

**FR-15** — Both PNG and PDF export actions MUST require the `ROLE_ENV_EXPORT` permission. Users without this permission MUST NOT see the Download PNG button or the Export Dashboard PDF button.

---

## 4. Data Model

No new persistent entities. The PDF export endpoint accepts a transient request payload:

```json
POST /api/v1/env-dashboard/export-pdf
{
  "title": "Environmental Compliance Dashboard",
  "preparedBy": "Siti Nurhaliza",
  "filters": {
    "siteId": 42,
    "dateFrom": "2025-05-01",
    "dateTo": "2026-04-20",
    "standardId": 7
  },
  "includeCoverPage": true,
  "includeExceedanceTable": true
}
```

Response: `application/pdf` binary stream.

---

## 5. API

### 5.1 PDF export endpoint

```
POST /api/v1/env-dashboard/export-pdf
Authorization: Bearer [token] — requires ROLE_ENV_EXPORT
Content-Type: application/json
Response 200: application/pdf (Content-Disposition: attachment; filename="ENV_Dashboard_…pdf")
Response 400: { "error": "export.invalidFilters" }
Response 403: { "error": "export.forbidden" }
Response 504: { "error": "export.timeout" } — if generation exceeds 30 s
```

### 5.2 PNG export

Client-side only — no API endpoint. Uses the recharts SVG DOM reference and `canvas` API to serialize the rendered chart to a PNG blob, then triggers a browser download via a temporary `<a>` element.

---

## 6. UI Changes (Addendum to S-07 UI)

### 6.1 Chart panel hover controls

Each chart tile gains a floating action row in the top-right corner, visible on hover (always visible on touch):

```
[ ⬇ PNG ]   (Icon button with tooltip "Download PNG")
```

The button uses Carbon `IconButton` (ghost, size sm) with the `Download` icon.

### 6.2 Dashboard toolbar extension

The existing toolbar (which currently has filter controls and the overflow menu for CSV export) gains a new button to the right of the filter controls:

```
[ 📄 Export PDF ]   (Secondary button with Document icon)
```

### 6.3 PDF configuration modal

Standard Carbon `Modal` (medium width). Contains the fields listed in FR-08, a `ProgressBar` (hidden until generation starts), and footer buttons: **Cancel** (ghost) · **Export PDF** (primary).

### 6.4 Post-export inline notification

After successful PDF download, a `green` `InlineNotification` appears in the toolbar area:
> "Dashboard exported successfully — ENV_Dashboard_SITE-042_2025-05-01_2026-04-20.pdf"

Auto-dismisses after 6 seconds.

---

## 7. Business Rules

**BR-01** — PNG export captures the chart exactly as rendered on screen, including any active reference lines, legend selections, and zoom state.

**BR-02** — PDF export captures the dashboard state at the moment the Export button is clicked. Subsequent filter changes do not affect an in-progress export.

**BR-03** — The Site Drill-Down chart page is only included in the PDF if a site is currently selected (drill-down is active). If no site is selected, this page is omitted.

**BR-04** — PNG export is entirely client-side and does not require network connectivity beyond the initial page load.

**BR-05** — The server-side PDF renderer uses the same data already loaded in the current session (passed in the request payload) — it does not re-query the database. This ensures the PDF matches exactly what the user sees.

---

## 8. Localization

| i18n Key | English Fallback |
|----------|-----------------|
| `envDashboard.export.png.button` | Download PNG |
| `envDashboard.export.png.tooltip` | Download this chart as a PNG image |
| `envDashboard.export.pdf.button` | Export PDF |
| `envDashboard.export.pdf.modal.title` | Export Dashboard PDF |
| `envDashboard.export.pdf.modal.reportTitle` | Report Title |
| `envDashboard.export.pdf.modal.preparedBy` | Prepared By |
| `envDashboard.export.pdf.modal.activeFilters` | Active Filters |
| `envDashboard.export.pdf.modal.coverPage` | Include Cover Page |
| `envDashboard.export.pdf.modal.exceedanceTable` | Include Exceedance Table |
| `envDashboard.export.pdf.modal.confirm` | Export PDF |
| `envDashboard.export.pdf.generating` | Generating PDF… |
| `envDashboard.export.pdf.success` | Dashboard exported successfully — {filename} |
| `envDashboard.export.pdf.error` | Export failed — {reason} |
| `envDashboard.export.pdf.timeout` | Export timed out. Please try again or reduce the date range. |

---

## 9. Security & Permissions

| Permission Key | Scope |
|----------------|-------|
| `ROLE_ENV_EXPORT` | Download per-chart PNG and trigger full-dashboard PDF export |

- PNG export is entirely client-side; no server data is transmitted beyond what is already rendered.
- PDF export payload contains only filter parameters and display metadata — no raw result records are transmitted in the request body (the server re-fetches using the filter params with the user's session token).
- Exported PDFs are not stored server-side; they are streamed directly to the browser.

---

## 10. Acceptance Criteria

**PNG export**
- [ ] Download PNG button appears on hover for each chart panel (Compliance Trend, Drill-Down, Site Comparison)
- [ ] PNG downloads without a server round-trip
- [ ] Exported image is ≥ 1200 × 800 px and includes chart title, active filters, and lab name
- [ ] File name follows `ENV_[ChartType]_[SiteCode]_[Date].png` format
- [ ] Button is hidden for users without `ROLE_ENV_EXPORT`

**PDF export**
- [ ] Export Dashboard PDF button appears in the toolbar
- [ ] Clicking it opens the configuration modal with pre-filled title, prepared-by, and read-only active filters
- [ ] PDF is generated server-side and downloaded automatically on success
- [ ] PDF contains cover page, one page per active chart, and exceedance table (when toggles are ON)
- [ ] Each PDF page has a footer with lab name, page N of M, and "Generated by OpenELIS Global"
- [ ] Progress indicator shows during generation; Export button is disabled while generating
- [ ] Success inline notification shows filename after download
- [ ] Error notification shows if generation fails or times out (> 30 s)
- [ ] File name follows `ENV_Dashboard_[SiteCode]_[DateRange].pdf` format
- [ ] Button and modal are hidden for users without `ROLE_ENV_EXPORT`

---

## 11. Dependencies & Cross-References

| Item | Relationship |
|------|-------------|
| S-07 (OGC-553) | Parent spec — this addendum extends §5 toolbar and chart panel UI |
| S-07 CSV export (§5.7) | Pre-existing export — unchanged; PDF export complements it |
| recharts `ResponsiveContainer` | PNG export uses SVG ref from existing chart components |
| Server-side PDF library | iText / OpenPDF (Java) recommended; headless Chrome alternative if chart fidelity required |
| `ROLE_ENV_EXPORT` | New permission key — must be added to role management admin page |
