# Report Management — Functional Requirements Specification

> **In plain language (for the dev):** Every report OpenELIS prints (the patient result report, etc.)
> is rendered from a template (a `.jrxml` file) that's effectively baked into the code — and there's no
> screen where an admin can see or change which template a site uses. This adds a **Report Management**
> admin page: see every report, see which template renders it and whether it's the shipped default or a
> custom override, pick a bundled variant (e.g. patient report Letter vs A4), upload your own template,
> preview it, and **revert to the shipped default anytime** — exactly like resetting a plugin to its
> defaults. The one hard dependency: the report engine must resolve templates *from this registry*
> instead of hard-coded paths (FR-9) — flagged as engineering coordination, so v1 anchors on the
> patient report and lists the rest read-only until their resolution is config-driven.

**Feature:** Admin registry to choose, version, and override the templates OpenELIS uses to render reports
**Status:** Draft v1.0
**Date:** 2026-07-01
**Model:** Plugin-with-shipped-defaults — the product bundles default report templates; deployments layer their choices/overrides on top and can always revert to the shipped default
**Governing decisions:** D-002 (no hard delete — shipped defaults can never be destroyed), D-009 (reuse existing data), D-010 (admin IA buckets), D-012 (path-segment route), D-022 (hard-coded resolution is an engineering-coordination dependency), D-024 (no emoji in outputs)
**Related:** Patient Report Redesign (patient_letter.jrxml / patient_a4.jrxml + Printed Report config: paper size, accreditation logo position); Report Print Queue (OGC-1031); Test Accreditation epic

---

## Lab Context

### Current State

Every printed thing OpenELIS produces — the patient result report a clinician receives, a
non-conformance report, a workplan — is rendered from a **template**. The templates are JasperReports
files (`.jrxml`), and today they are effectively baked into the product: the patient report renders
from `patient_letter.jrxml` or `patient_a4.jrxml`, and which one is used is decided by a single
paper-size setting on the Printed Report configuration page. There is a small amount of per-report
configuration (paper size; and, from the patient-report redesign, where the accreditation logo sits)
but there is **no place** where an administrator can see the full set of reports the system produces,
see which template renders each one, choose a different bundled variant, or supply a template of their
own. A deployment that wants a different patient-report layout files a code change.

Every OpenELIS release ships a set of default templates — think of them like the defaults a plugin
ships with: sensible, ready to use out of the box, and updated when you upgrade.

### Pain

A lab in Indonesia wants its national logo and a Bahasa footer on the patient report; a lab in
Madagascar wants a slightly different results layout. Today each of these is a source change to a
JRXML file, rebuilt and redeployed per deployment — so the templates fork across deployments, nobody
can tell from the running app which template a given site is actually using, and an upgrade that
improves the shipped patient report silently either overwrites a site's customization or gets skipped
to preserve it. When someone asks "which patient-report template is this site on, and is it the
current one or an old custom copy?", there is no screen that answers it — an engineer has to inspect
the deployment. And because the choice lives in code, a lab administrator who is perfectly capable of
picking "use the A4 accredited layout" cannot do it themselves.

### What Changes

A **Report Management** admin page lists every report the system produces and, for each, shows which
template is currently active, whether that template is the **shipped default** or a **custom override**
the deployment supplied, and the version. For each report the administrator can choose the active
template from the bundled variants (e.g., the patient report's Letter vs A4 accredited layouts),
supply a custom template as an override, or **revert to the shipped default** at any time — the
bundled default is never lost, exactly like resetting a plugin to its defaults. Per-report settings
that already exist (paper size, accreditation logo position) surface here as that report's settings
instead of living on a separate, disconnected page. After this ships, "which template is this site on?"
is a question the running app answers, upgrades cleanly update shipped defaults while leaving custom
overrides intact and clearly flagged, and a lab admin can set their patient-report template without an
engineer.

---

## Navigation & URL

- **SideNav placement:** `Admin → Configuration → Report Management`. It joins the Configuration
  bucket alongside the existing General Configuration pages. The existing **Printed Report**
  configuration (paper size, accreditation logo position) is **absorbed into** each report's settings
  here (FR-6); the standalone Printed Report page either redirects here or is retired in a follow-up
  (reconciliation note below).
- **Breadcrumb (list):** `Home / Admin Management / Configuration / Report Management`
- **Breadcrumb (report detail):** `Home / Admin Management / Configuration / Report Management / {Report Name}`
- **URL route (list):** `/MasterListsPage/reportManagement` — path-segment style per D-012, matching
  the admin shell (verify the exact `editorKey` against the live app before build).
- **URL route (per-report):** the per-report settings open via **inline row expansion** on the list
  (D-005), so no separate route is required for v1. A deep-linkable per-report route
  (`/MasterListsPage/reportManagement/{reportKey}`) is a v2 nicety, not required now.

> **Breadcrumb label quirk (D-013):** SideNav reads "Admin"; the first breadcrumb reads "Admin
> Management". Preserved.

---

## Overview

A single admin registry of report definitions. Each row is a report the system produces; expanding a
row exposes: the **active template** (with a Shipped-default / Custom badge and version), a
**template source selector** (shipped default variant vs custom override), the report's existing
**per-report settings** (paper size, accreditation logo position where applicable), an **upload** for
a custom template, a **Preview / test-render** action, and **Revert to shipped default**. The page is
read-mostly at the top level and edited inline per report.

This FRS covers the **management surface** and the **shipped-default + override model**. It depends on
an engine capability — resolving "which template renders report type X" from this registry rather than
from hard-coded paths — which is called out as a named engineering dependency (FR-9), consistent with
how OpenELIS treats other hard-coded-resolution points (D-022).

---

## User Stories

1. **As a lab administrator**, I want to see every report the system produces and which template
   renders each, so I finally have one screen that answers "what is this site actually printing?".
2. **As a lab administrator**, I want to set the patient report's template — choosing a bundled
   variant (Letter / A4 / accredited) or uploading our own — without filing a code change.
3. **As a lab administrator**, I want to revert any report to its shipped default in one click, so an
   experiment with a custom template is never a one-way door.
4. **As an upgrade admin**, I want an upgrade to refresh shipped default templates while leaving my
   custom overrides in place and clearly flagged, so improvements arrive without clobbering my
   customizations and without silently reverting them.
5. **As a QA engineer / trainer**, I want to test-render a report with sample data before making a
   template active, so a broken template never reaches a clinician's hands.

---

## Functional Requirements

### FR-1 — Report registry list

The page renders a Carbon `DataTable` of report definitions. Columns:

| Column | Content |
|---|---|
| Report | Human name (e.g. "Patient Result Report", "Non-Conformance Report") |
| Category | Grouping tag (Clinical / Operational / Quality / Administrative) — a Carbon `Tag` |
| Active template | The template currently rendering this report (name + version) |
| Source | Carbon `Tag`: **Shipped default** (`gray`) or **Custom** (`blue`) |
| Status | `Tag`: Active (`green`) / Overridden (`blue`) — reflects whether a custom override is in force |
| — | Row expand chevron (opens per-report settings, FR-3) |

The list is populated from the **existing catalog of reports OpenELIS ships** (see FR-9 dependency —
the report inventory is enumerated from the existing report engine, not invented here). A search box
filters by report name/category (Carbon `TableToolbarSearch`).

### FR-2 — Report categories (grouping only)

Reports are grouped by category for scanability: **Clinical** (patient result report, etc.),
**Operational** (workplan, print-queue outputs), **Quality** (non-conformance, EQA where applicable),
**Administrative** (audit/config exports). Category is display-only grouping; it does not gate
behavior. The exact category assignment per report is confirmed against the shipped report inventory
(FR-9), not hardcoded speculatively here.

### FR-3 — Per-report settings (inline row expansion)

Expanding a report row reveals its settings in an inline `Tile` (D-005 — inline expansion, not a
modal, not a separate page). Contents:

1. **Active template** — name, version, and a Shipped-default/Custom badge.
2. **Template source selector** (FR-4).
3. **Bundled variants** — when the shipped default offers variants (e.g., Patient Report: Letter / A4;
   with/without accreditation block), a selector to choose the active variant.
4. **Per-report settings** (FR-6) — the report's own knobs (paper size, accreditation logo position
   where applicable), reused from the existing Printed Report config.
5. **Custom template upload** (FR-5).
6. **Preview / test-render** (FR-7).
7. **Revert to shipped default** (FR-8).

### FR-4 — Template source selector (shipped default ↔ custom)

A Carbon `RadioButtonGroup` per report:

- **Shipped default** (default selection) — render from the bundled template. When selected, the
  bundled-variant selector (FR-3.3) is enabled.
- **Custom override** — render from a template the deployment uploaded (FR-5). When selected, the
  custom template is used until the admin reverts.

Switching source is a saved change (with a confirmation when switching *away* from a custom template
that has unsaved implications — see FR-8 for revert semantics). Switching source never deletes the
custom upload; it deactivates it (D-002 — the override is retained and can be re-selected).

### FR-5 — Custom template upload (override)

- A `FileUploader` accepts a template file (`.jrxml`) as a **custom override** for the report.
- On upload, the system validates the file is well-formed and **parameter-compatible** with what the
  report's bean populator supplies (FR-9 dependency): a custom template that references parameters the
  engine doesn't populate is rejected with a clear error listing the missing/unknown parameters — it
  is **not** made active.
- A validated custom template becomes selectable as the "Custom override" source; it does **not**
  auto-activate — the admin must select Custom source and Save.
- Uploaded custom templates are retained (versioned by upload timestamp + uploader); replacing a
  custom template keeps the prior one in history (no hard delete, D-002).

> **Scope guard:** uploading a template that needs *new* data the report doesn't currently populate is
> **out of scope** and rejected at validation — arbitrary new report content requires a bean-populator
> change (engineering), consistent with D-022. This feature swaps/selects templates that consume the
> **existing** parameter set; it does not turn report authoring into a no-code free-for-all.

### FR-6 — Absorb existing per-report settings

The settings that today live on the standalone **Printed Report** configuration page are surfaced as
the relevant report's per-report settings here, reusing the existing config keys — no new config
model:

- **Paper size** (Letter / A4) — reuses the existing `printedReport` paper-size config; for the
  patient report this also selects the corresponding bundled JRXML variant (`patient_letter` /
  `patient_a4`), reconciling the two concepts into one control.
- **Accreditation logo position** (Top / Bottom, default Bottom) — reuses
  `printedReport.accreditationLogoPosition` from the patient-report redesign round-5 work.

These render only for reports they apply to (the patient report). Other reports show only the settings
they actually have.

### FR-7 — Preview / test-render

A **Preview** action renders the report with **sample/mock data** (or a chosen recent accession where
the engine supports it) using the currently-selected template + settings, and returns a PDF the admin
can inspect **before** making the template active. Preview never affects live data and never changes
the active template — it is a dry run. If the render fails (bad template, missing parameter), the
error is shown inline with the failure reason rather than a broken PDF.

### FR-8 — Revert to shipped default

A **Revert to shipped default** button per report:

- Sets the source back to Shipped default and re-selects the current release's bundled template.
- Opens a confirmation `Modal` (a state change with print-output consequences): "Revert {Report} to
  the shipped default template? Your custom template is kept and can be re-selected later."
- Never destroys the custom upload (D-002) — it is deactivated and remains in the report's template
  history.

### FR-9 — Engine template resolution (named dependency)

For this registry to have effect, the report engine must resolve the template for a report type **from
this registry** (active source + variant + settings) rather than from a hard-coded file path. This is
an engineering-coordination dependency, in the same spirit as D-022 (the external-patient-source
format is hard-coded in Java):

- The report inventory (FR-1) and each report's parameter contract (FR-5 validation) come from the
  existing report engine — **enumerated at build**, not invented in this spec.
- v1 may ship the **management + shipped-default selection** for the reports whose resolution is
  already (or easily made) config-driven — the **patient report is the anchor** because its
  paper-size/variant resolution is already partly config-driven. Reports whose resolution is still
  hard-coded are listed read-only ("managed in code — not yet configurable") until the engine supports
  registry resolution for them. This keeps v1 honest and shippable.

### FR-10 — Upgrade behavior (shipped defaults refresh, overrides preserved)

On upgrade:

- Shipped default templates are refreshed to the new release's versions (the bundled set updates with
  the app, like plugin defaults).
- Reports on **Shipped default** source pick up the new default automatically.
- Reports on **Custom override** source keep their custom template and are flagged with a notice on
  the row: "A newer shipped default is available for this report. You are on a custom override." so the
  admin can compare (FR-7 preview) and decide — never a silent overwrite, never a silent revert.

### FR-11 — Audit trail

Each change writes an `audit_trail` row (reuse existing config audit pattern):

| Action | Payload summary |
|---|---|
| `REPORT_TEMPLATE_SOURCE_CHANGED` | `{report_key, from: SHIPPED\|CUSTOM, to: SHIPPED\|CUSTOM, actor}` |
| `REPORT_TEMPLATE_VARIANT_CHANGED` | `{report_key, from_variant, to_variant, actor}` |
| `REPORT_TEMPLATE_UPLOADED` | `{report_key, filename, uploader}` |
| `REPORT_TEMPLATE_REVERTED` | `{report_key, actor}` |
| `REPORT_SETTING_CHANGED` | `{report_key, setting, from, to, actor}` |

### FR-12 — i18n keys

| Key | English fallback |
|---|---|
| `breadcrumb.configuration` | Configuration |
| `admin.reports.title` | Report Management |
| `admin.reports.list.column.report` | Report |
| `admin.reports.list.column.category` | Category |
| `admin.reports.list.column.activeTemplate` | Active template |
| `admin.reports.list.column.source` | Source |
| `admin.reports.list.column.status` | Status |
| `admin.reports.source.shipped` | Shipped default |
| `admin.reports.source.custom` | Custom |
| `admin.reports.status.active` | Active |
| `admin.reports.status.overridden` | Overridden |
| `admin.reports.category.clinical` | Clinical |
| `admin.reports.category.operational` | Operational |
| `admin.reports.category.quality` | Quality |
| `admin.reports.category.administrative` | Administrative |
| `admin.reports.detail.activeTemplate.label` | Active template |
| `admin.reports.detail.source.label` | Template source |
| `admin.reports.detail.source.shipped` | Shipped default |
| `admin.reports.detail.source.custom` | Custom override |
| `admin.reports.detail.variant.label` | Layout variant |
| `admin.reports.detail.settings.label` | Report settings |
| `admin.reports.detail.paperSize.label` | Paper size |
| `admin.reports.detail.accreditationLogoPosition.label` | Accreditation logo position |
| `admin.reports.detail.upload.label` | Upload custom template (.jrxml) |
| `admin.reports.detail.upload.invalid` | This template references parameters the report does not provide: {list}. It was not activated. |
| `admin.reports.detail.upload.success` | Custom template validated. Select "Custom override" and Save to use it. |
| `admin.reports.detail.preview` | Preview with sample data |
| `admin.reports.detail.preview.failed` | Preview failed: {reason} |
| `admin.reports.detail.revert` | Revert to shipped default |
| `admin.reports.revert.modal.title` | Revert to shipped default? |
| `admin.reports.revert.modal.body` | Revert {report} to the shipped default template? Your custom template is kept and can be re-selected later. |
| `admin.reports.revert.modal.confirm` | Revert |
| `admin.reports.revert.modal.cancel` | Cancel |
| `admin.reports.upgrade.newDefaultAvailable` | A newer shipped default is available for this report. You are on a custom override. |
| `admin.reports.notConfigurable` | Managed in code — not yet configurable |
| `admin.reports.save` | Save |
| `admin.reports.saved` | Report settings saved |

---

## Permissions & Audit

- **Role attachment:** the existing **Admin** role bundle (and specifically the existing
  "Configuration" admin access used by the current Printed Report page) grants Report Management. No
  new permission keys (D-006). A non-admin does not see the page.
- **Audit events:** per FR-11. No read auditing.

---

## Data Model

### Existing entities reused

- **Report definitions / report engine inventory** — the set of reports OpenELIS renders; enumerated
  from the existing engine (FR-9). Reused, not invented.
- **`printedReport.*` config** — existing key-value config for paper size and accreditation logo
  position; reused as per-report settings (FR-6).
- **JRXML templates** — existing `.jrxml` bundled files (`patient_letter.jrxml`, `patient_a4.jrxml`,
  etc.); shipped defaults.
- **`audit_trail`** — reused for FR-11 events.

### New data (declared dependencies, per D-009)

| Entity | Purpose | Notes |
|---|---|---|
| `report_template_config` | One row per report type: active source (SHIPPED/CUSTOM), active variant key, and FK to the active custom template when source=CUSTOM | New registry table. Small (one row per report type). |
| `report_custom_template` | Uploaded custom templates: report_key, filename, stored blob/path, uploader, upload timestamp, active flag | New. Retains history (no hard delete). |

Both are **new** and declared here as named dependencies — they don't exist today. The registry is the
persistence behind FR-1/FR-4/FR-5; the engine-resolution change (FR-9) is what makes the registry take
effect.

---

## Dependencies

1. **Report engine template resolution (FR-9)** — the engine must resolve templates from
   `report_template_config` rather than hard-coded paths. This is the critical enabling dependency; v1
   scopes to the reports where this is feasible (patient report anchor). **Engineering coordination
   required** — same class of constraint as D-022.
2. **Report inventory + per-report parameter contracts** — enumerated from the existing engine; drives
   the FR-1 list and FR-5 upload validation.
3. **Patient Report Redesign** — supplies `patient_letter`/`patient_a4` variants and the
   `printedReport.accreditationLogoPosition` setting reused in FR-6.
4. **Printed Report configuration page** — its settings are absorbed here (FR-6); coordinate the
   redirect/retire (reconciliation below).
5. **Report Print Queue (OGC-1031)** — unaffected; it consumes whatever template this registry makes
   active. Note the relationship so the two don't diverge on "which template rendered this job".

---

## Reconciliation with existing config

- The standalone **Printed Report** configuration page (paper size, accreditation logo position) is
  **absorbed** into the patient report's per-report settings here (FR-6). To avoid two places editing
  the same keys, the standalone page redirects to Report Management (or is retired) in a follow-up;
  until then, both edit the same underlying `printedReport.*` keys so they can't diverge. Flag this as
  a coordinated cutover, not a silent duplicate surface.

---

## Non-Functional Requirements

- **Performance:** the registry is tiny (one row per report type, ~dozens of rows); list render is
  trivial. Preview render (FR-7) is bounded by JasperReports render time for one report — run async
  with a loading state if it exceeds ~2s.
- **Safety:** a custom template can never silently reach production — it must pass parameter validation
  (FR-5) and be explicitly selected + saved; Preview (FR-7) lets the admin verify first.
- **Upgrade safety:** shipped-default refresh must never overwrite a custom override (FR-10).
- **i18n:** all strings keyed with English fallbacks (Constitution Principle VII).

---

## Out of Scope (this FRS)

- **No-code / visual report authoring** — this manages and swaps templates that consume the existing
  parameter set; authoring new report content or new parameters is a bean-populator (engineering) task
  and out of scope (D-022 precedent). A future Catalyst module (D-023) may assist authoring; do not
  design around it here.
- **New report types** — this registry manages the reports the engine already produces; adding a brand
  new report is a separate build.
- **Per-user or per-role template selection** — template choice is per-deployment (single-tenant,
  D-001); no per-site or per-tenant template matrix.
- **Scheduling / delivery** — how/when a report is generated and sent is the Report Print Queue
  (OGC-1031) and notification systems, unchanged here.
- **Deep-linkable per-report route** — v2 nicety (FR-3 uses inline expansion for v1).

---

## Acceptance Criteria

- [ ] **AC-1** Report Management lists every report the engine produces, with Category, Active template, Source (Shipped/Custom), and Status
- [ ] **AC-2** The list is searchable by report name/category
- [ ] **AC-3** Expanding a row shows per-report settings inline (not a modal, not a separate page)
- [ ] **AC-4** Template source selector offers Shipped default (default) and Custom override; shipped is preselected when no override exists
- [ ] **AC-5** Bundled-variant selector appears for reports with variants (patient report: Letter / A4) and selects the active variant
- [ ] **AC-6** Paper size and accreditation logo position surface as the patient report's settings, editing the existing `printedReport.*` keys (no duplicate config model)
- [ ] **AC-7** Uploading a custom `.jrxml` validates parameter-compatibility; incompatible templates are rejected with the missing/unknown parameter list and not activated
- [ ] **AC-8** A validated custom template does not auto-activate; the admin must select Custom source and Save
- [ ] **AC-9** Preview renders the selected template with sample data to PDF without changing the active template or touching live data; render failures show the reason inline
- [ ] **AC-10** Revert to shipped default confirms via modal, restores the shipped template, and retains (does not delete) the custom template
- [ ] **AC-11** No hard-delete of any shipped default or custom template exists (D-002)
- [ ] **AC-12** On upgrade, Shipped-default reports pick up the new default; Custom-override reports keep their template and show the "newer shipped default available" notice
- [ ] **AC-13** Reports whose engine resolution is still hard-coded render read-only with "Managed in code — not yet configurable"
- [ ] **AC-14** All changes write the FR-11 audit events
- [ ] **AC-15** All strings i18n-wrapped per FR-12
- [ ] **AC-16** Access is the existing Configuration admin capability; no new permission keys

---

## Open Questions

1. **Custom template storage** — DB blob vs filesystem path? *Recommendation:* store in DB
   (`report_custom_template`) so it survives redeploys and is included in backups, consistent with a
   single-tenant deployment that expects config to travel with the database. Confirm with engineering.
2. **Which reports are config-driven at v1?** — depends on the engine-resolution work (FR-9).
   *Recommendation:* anchor v1 on the patient report (already partly config-driven) and list the rest
   read-only; expand coverage as resolution is made config-driven. Confirm the exact v1 set at
   `/breakdown`.
3. **Locale-specific templates** — should a deployment be able to select a different template per
   locale (e.g., a Bahasa patient report layout)? *Recommendation:* out of scope for v1 (variant
   selection covers paper size, not locale); revisit if a deployment needs distinct per-locale layouts
   beyond what i18n string substitution already handles.
