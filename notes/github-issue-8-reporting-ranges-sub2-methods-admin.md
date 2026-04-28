# GitHub issue draft — Sub-2: Methods admin page (master catalog)

**Target repo:** `DIGI-UW/OpenELIS-Global-2`
**Suggested labels:** `feature`, `frontend`
**Parent:** link as sub-issue of the Reporting Ranges by Method parent issue
**Depends on:** Sub-1 (data model + API + plugin hook)

---

## Title

`[Feature] Reporting ranges by method: Methods admin page (SideNav submenu under Test Catalog)`

## Body

## Summary

Sub-issue 2 of the Reporting Ranges by Method epic. Build the **Methods** admin page — the master catalog of every method in the lab, added as a submenu item under **Test Catalog** in the Carbon `SideNav`. Admin CRUD for USER-sourced methods; MANUAL and PLUGIN rows are shown read-only (plugin rows tagged with the analyzer that registered them).

Depends on Sub-1's endpoints.

## Scope

### Route + nav

- New admin route `/admin/test-catalog/methods`.
- Breadcrumb: `Admin › Test Catalog › Methods`.
- Nav entry: a new `SideNavMenuItem` labeled **"Methods"** as a sibling under the existing **Test Catalog** `SideNavMenu`. Placement per admin IA v2-3 — sits alongside Test Management, Analyzer Test Name, Program Entry, Reflex Tests Management, Calculated Value Tests Management.
- Page header: breadcrumb + H2 "Methods" + descriptive sub-copy: "Master catalog of methods used by this lab. Plugin-registered methods are read-only; create and manage your own methods here."

### Admin Table (P-01)

Columns: **Name · Source · Used by N tests · Status** (Active / Inactive).

- Methods are identified by **Name** in every admin surface. The internal `method.code` (system-generated for USER methods, see Create modal below; plugin-supplied for PLUGIN methods; literal `MANUAL` for the seeded row) is **never displayed in this admin UI**. It still exists in the data model and is used for stable identifiers in CSV import/export, audit trails, and plugin namespacing — see parent FRS §3.1.
- **Source** renders as a Carbon `Tag`:
  - `Manual` — gray tag. Read-only row.
  - `User` — cyan tag. Editable row.
  - `<Analyzer name>` — warm-gray / teal tag (whichever is clearest against the Source filter). Read-only row. Analyzer name comes from the `method.analyzer_id` join — e.g. "GeneXpert", "Sysmex XN-550".
- **Used by N tests** is a numeric column with the count of `test_method` rows referencing this method.
- Sortable on Name, Source, Used by, Status.
- Toolbar primary CTA: **"Add method"** → P-03 Create modal. Button hidden for users without `TEST_CATALOG_MANAGE`.
- Filter bar:
  - Source filter: `All · Manual · User · Plugin`. When "Plugin" is selected, a secondary Carbon `Dropdown` lists registered analyzers and narrows to that analyzer's methods.
  - Search: `TextInput` over name substring.
- Empty state (P-06): illustration + "No methods yet. Manual is always available; add your own or configure an analyzer to register more." + CTA "Add method".

### Create modal (P-03) — USER methods only

Fields:
- **Name** — required, 1–120 chars. The primary identifier shown everywhere.
- **Description** — optional, Carbon `TextArea`, 0–500 chars. Helper copy: "What this method does, when to use it. Shown when picking a method on a test." Empty by default.
- **Active** — Carbon `Toggle`, defaults ON.

**Code is auto-assigned by the server** at create time as `METH-NNN` (zero-padded to 3 digits, monotonic across the lab — `METH-001`, `METH-002`, …). The code is not entered, displayed, or editable in the admin UI. Server is the source of truth for sequence assignment; UI does not preview or reserve the next code.

The created method has `source = 'USER'`. Success closes modal, appends the new row to the table, and emits a Carbon `InlineNotification` on success.

### Inline row-expand (P-02)

- **USER row expand** — editable. Name, Description, Active. Save / Cancel. No Code field rendered.
- **MANUAL row expand** — read-only. Shows the row plus copy: "System-provided default — always available on every test." If the seed migration carried a description, render it read-only beneath. No editable fields.
- **PLUGIN row expand** — read-only. Shows the row plus copy: "Registered by the [analyzer name] analyzer plugin." If the plugin published a description on registration, render it read-only beneath. Shows a small list of "Tests currently using this method" (first 10, with "+N more" if truncated) linking into each test's row in Test Management.

### Delete (P-04) — USER methods only

- **USER row** — delete button inside the row-expand.
  - If `Used by = 0`: button enabled; P-04 Confirm modal; on confirm, row removed and success toast.
  - If `Used by > 0`: button disabled with tooltip `"Used by [N] tests — remove from each test first"`. Tooltip lists the first 3 test codes + "and [N−3] more" when > 3.
- **MANUAL row** — no delete affordance rendered.
- **PLUGIN row** — no delete affordance rendered. Row-expand includes a helper tip: "To remove this method from the catalog, un-configure the [analyzer] analyzer."

### Permission gate (P-13)

- `TEST_CATALOG_MANAGE` required for all writes.
- Users lacking the scope: table renders, filter bar works, rows are expandable for read-only view, but the "Add method" CTA is hidden and every USER row's row-expand hides its edit/delete affordances (fields still render, but as read-only text).

### i18n keys

Use the keys listed in the parent FRS §9 (`admin.testCatalog.methods.*`). Key examples:

```
admin.testCatalog.nav.methods              "Methods"                         (SideNav item)
admin.testCatalog.methods.heading          "Methods"                         (page H2)
admin.testCatalog.methods.desc             "Master catalog of methods used by this lab. Plugin-registered methods are read-only; create and manage your own methods here."
admin.testCatalog.methods.addCta           "Add method"
admin.testCatalog.methods.col.name         "Name"
admin.testCatalog.methods.col.source       "Source"
admin.testCatalog.methods.col.usedBy       "Used by"
admin.testCatalog.methods.col.status       "Status"
admin.testCatalog.methods.source.manual    "Manual"
admin.testCatalog.methods.source.user      "User"
admin.testCatalog.methods.source.plugin    "Plugin: [analyzer]"
admin.testCatalog.methods.readOnly.plugin  "Registered by the [analyzer] analyzer plugin."
admin.testCatalog.methods.readOnly.manual  "System-provided default — always available on every test."
admin.testCatalog.methods.deleteBlockedUsage  "Used by [N] tests — remove from each test first."
admin.testCatalog.methods.field.name       "Name"
admin.testCatalog.methods.field.description       "Description"
admin.testCatalog.methods.field.descriptionHelp   "What this method does, when to use it. Shown when picking a method on a test."
admin.testCatalog.methods.field.active     "Active"
admin.testCatalog.methods.empty.title      "No methods yet"
admin.testCatalog.methods.empty.body       "Manual is always available. Add your own or configure an analyzer to register more."
```

## Existing mockup — reconcile before build

The admin menu redesign roadmap lists `designs/admin-config/methods` as an existing Carbon mockup. Before building, reconcile that mockup against this spec:

- If the existing mockup matches or can be adapted to the Source / Used by / Status columns and the read-only treatment of MANUAL and PLUGIN rows, reuse it as the starting point.
- If it substantially diverges (e.g. no source tagging, no plugin concept), replace it.

Either way, the final JSX must reference the parent FRS i18n keys and follow P-01 / P-02 / P-03 / P-04 / P-06 / P-13.

## Out of scope

- Per-test methods assignment UI — Sub-3.
- Per-method range editing — Sub-3.
- Plugin `MethodRegistry.register(...)` hook — Sub-1.
- Result-entry lookup — Sub-4.

## Acceptance criteria

1. **Given** `TEST_CATALOG_MANAGE`, **when** the user opens the admin `SideNav` and expands Test Catalog, **then** a "Methods" submenu item is visible. Clicking it navigates to `/admin/test-catalog/methods` and the page H2 reads "Methods".
2. **Given** a fresh deployment (only the seeded Manual method), **when** the user opens the page, **then** the Admin Table shows one row (Name "Manual", Source tag "Manual", Used by = N where N = total tests). No Code column is rendered. The P-06 empty-ish / hint state does not cover the seeded row.
3. **Given** the create modal, **when** the user enters Name `HPLC`, leaves Description empty, leaves Active ON, and submits, **then** a new row appears in the table with Name `HPLC`, Source tag "User". The server has assigned a `method.code` of the form `METH-NNN`; this code is not surfaced in the modal, the table, or the row-expand.
4. **Given** the create modal, **when** the user enters Name `HPLC` and a Description of 320 characters, **then** submit succeeds and the row-expand renders the Description read-only-when-collapsed and editable when expanded by a user with `TEST_CATALOG_MANAGE`. **When** the user enters a Description of 600 characters, **then** the field shows a P-05 inline validation error and submit is blocked.
5. **Given** a USER method with `Used by = 0`, **when** the user expands the row, clicks Delete, and confirms the P-04 modal, **then** the row is removed and a success toast is shown.
6. **Given** a USER method with `Used by = 3`, **when** the user expands the row, **then** the Delete button is disabled and a tooltip lists the 3 blocking test names.
7. **Given** a PLUGIN method, **when** the user expands the row, **then** the expand is read-only, shows the analyzer-name Tag, no fields are editable, no Delete button is rendered, and the helper text identifies the registering analyzer. If the plugin published a Description at registration time, it is rendered read-only.
8. **Given** a MANUAL method, **when** the user expands the row, **then** the expand is read-only, the Source tag reads "Manual", no fields are editable, and no Delete button is rendered.
9. **Given** the Source filter set to "Plugin" with a sub-filter "GeneXpert", **when** the user applies the filter, **then** only methods with `plugin_id` for that analyzer are shown.
10. **Given** a user without `TEST_CATALOG_MANAGE`, **when** they view the page, **then** the Add method CTA is absent, rows still expand but show no Save / Delete affordances, and all values are read-only.
11. **Given** any successful create / edit / delete, **when** the action completes, **then** the matching audit entry is visible via the existing audit log surface. The audit entry references the method by its system-generated `method.code` so the entry remains stable even if the user later renames the method.

## Design notes

- Follow the existing admin page shell: Carbon `SideNav` + breadcrumb + page header + content.
- Carbon `DataTable` with row-expand for P-02.
- Source column uses `Tag` with a per-source `type` mapping (gray for Manual, cyan for User, warm-gray for Plugin with analyzer name — final `type` choice confirmed in review against the existing admin pages' Tag palette).
- The design uses `@carbon/react` components only; no custom UI primitives.
- A Carbon JSX mockup (`reporting-ranges-by-method-mockup.jsx`) and a self-contained HTML preview (`reporting-ranges-by-method-preview.html`) are available on request — both cover the Methods admin page alongside the Sub-3 Test row-expand so the two surfaces can be reviewed together.
