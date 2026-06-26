# FRS — Test Accreditation & Report Logo Threshold

**Feature:** Manage accrediting bodies and per-test accreditations from two dedicated Carbon `SideNav` submenu pages under Test Catalog Management; conditionally render per-body accreditation logos on patient result reports based on per-body thresholds.
**Owner:** Casey (caseyi@uw.edu)
**Date:** 2026-04-22
**Status:** Draft v4 — awaiting review. v4 drops the Manage Tests accreditation column from V1 scope and adds a per-body **logo visibility mode** (Any accredited test vs. Percentage threshold) to the Accrediting Bodies page.
**Supersedes:** v3 (added SideNav submenu pattern + two dedicated pages). v3 superseded v2 (single dashboard route with inner Tabs). v1 moved configuration out of Printed Report Config; v2 supported multiple bodies per test.
**Related patterns:** P-01 (Admin Table), P-02 (Inline row-expand edit), P-03 (Create modal), P-04 (Confirm-delete modal), P-05 (Form validation), P-06 (Empty state), P-09 (Breadcrumb + header), P-13 (Permission gate)

---

## 1. Overview

OpenELIS labs pursuing or maintaining accreditation (ISO 15189, SANAS, and regional equivalents) need to (a) model **which accrediting body** covers which tests, (b) keep track of accreditation **expirations** so renewals don't fall through the cracks, and (c) automatically render the relevant accreditation logo(s) on patient result reports when a meaningful portion of results on that report are covered.

Today, OpenELIS has no model for accrediting bodies or per-test accreditation state, so labs either hardcode a single logo on every report or skip it entirely.

This feature introduces two new admin pages under **Test Catalog Management**, surfaced as Carbon `SideNav` submenu items: **Accrediting bodies** (CRUD of bodies with logo + threshold) and **Test accreditations** (per-test assignments with expirations). Together these form the lab's accreditation dashboard: a QA lead can

- Create, edit, and deactivate **accrediting bodies**, each with its own logo and logo-threshold percentage.
- Assign an accrediting body (or multiple bodies, though typically one) to any test, with an expiration date per assignment.
- See at a glance which accreditations are **active**, **expiring soon**, or **expired**.

On patient report render, each configured body is evaluated **independently** against its own **logo visibility mode** — either "Any test on the report is accredited by this body" (the default, most forgiving) or "At least N% of tests on the report are accredited by this body" (stricter, when a lab needs to gate logos more tightly). Logos for qualifying bodies appear side-by-side in the report header, and a short notes line identifying the accrediting bodies is added to the report's notes section whenever ≥1 test on the report is accredited by any active body — regardless of that body's visibility mode.

The existing Test Catalog (Manage Tests) admin list is intentionally **not modified** in V1; accreditation is managed entirely from the Test accreditations page. A per-row badge on Manage Tests is deferred to a follow-up (see §12) — usage data from V1 will tell us whether the surface is worth the clutter.

## 2. User Stories

- As a **lab QA lead**, I want two dedicated admin pages — one for the set of accrediting bodies we hold, and one for the test-level accreditations — so I can manage our accredited scope from one place without hunting through unrelated settings.
- As a **lab QA lead**, I want to configure each accrediting body once — its name, logo, and logo-visibility rule (either "show whenever any test on the report is accredited by this body" or "show when ≥ N% of tests are accredited") — so accreditation branding lives next to the accreditation data, not buried in a print config page.
- As a **lab QA lead**, I want an at-a-glance view of expired and soon-to-expire accreditations so I can trigger renewal workflows before lapses affect reports.
- As a **lab director**, I want accreditation logos to appear on a patient report only when a meaningful portion of the tests on that specific report are covered by that body, so we don't mislead clinicians.
- As a **lab manager**, I want a short notes line on any report that includes accredited tests identifying which bodies accredit them, so clinicians and auditors have a text record alongside any logo.
- As a **lab director in a small lab**, I want a body's logo to appear on a report whenever any test on that report is accredited by that body (the common case), without having to reason about a percentage threshold.
- As a **lab director in a lab with mixed accredited/unaccredited scope**, I want a stricter percentage threshold on one specific body so the logo only appears when the report is predominantly covered — my accreditation auditor is picky about what reports count as "accredited."

## 3. Functional Requirements

### 3.1 Data model

**Table: `accrediting_body`** (new)

```
id                     (pk)
code                   VARCHAR   UNIQUE NOT NULL   -- short code, e.g. "ISO15189", "SANAS"
name                   VARCHAR          NOT NULL   -- display name
logo_path              TEXT             NULL       -- server-relative path to uploaded file
logo_visibility_mode   VARCHAR          NOT NULL DEFAULT 'ANY_ACCREDITED_TEST'
                                                       -- enum: 'ANY_ACCREDITED_TEST' | 'PERCENTAGE'
threshold_pct          SMALLINT         NOT NULL DEFAULT 80
                                                       -- used only when logo_visibility_mode = 'PERCENTAGE'
                                                       -- CHECK (0 <= threshold_pct <= 100)
display_order          SMALLINT         NOT NULL DEFAULT 0    -- ordering for side-by-side logo rendering
active                 BOOLEAN          NOT NULL DEFAULT TRUE
created_on / updated_on
```

Notes:
- New records default to `logo_visibility_mode = 'ANY_ACCREDITED_TEST'` (the lab-friendly default — logo appears whenever any test on a report is accredited by this body).
- `threshold_pct` is always stored (with default 80), but it is **ignored at render time** when the mode is `ANY_ACCREDITED_TEST`. This keeps the column simple and avoids nullability/state loss when a lab toggles the mode back and forth.

**Table: `test_accreditation`** (new)

```
id                     (pk)
test_id                (fk → test,               ON DELETE CASCADE)
accrediting_body_id    (fk → accrediting_body,   ON DELETE RESTRICT)
expires_on             DATE     NOT NULL
created_on / updated_on
UNIQUE (test_id, accrediting_body_id)
```

A test is "accredited by Body X" if and only if a `test_accreditation` row exists. `expires_on` is always present on a row. "Active" = `expires_on >= today` and the body is `active = true`.

The existing `test` table is **not** modified; there is no boolean on Test itself in this revision.

### 3.2 Navigation placement (FR-1 → FR-3)

| # | Requirement |
|---|---|
| FR-1 | Two new admin pages are added as submenu items under **Test Catalog Management** in the Carbon `SideNav`: **Accrediting bodies** and **Test accreditations**. Each is its own page (not a tab on a shared page). Breadcrumb prefix: `Admin › Test Catalog Management › {page}`. |
| FR-2 | Routes: `/admin/test-catalog/accreditation/bodies` (Accrediting bodies) and `/admin/test-catalog/accreditation/test-accreditations` (Test accreditations). No shared parent route — each submenu item navigates directly to its own page. |
| FR-3 | All controls on both pages require the existing `TEST_CATALOG_MANAGE` permission. No new permission scope is introduced (P-13). |

### 3.3 Accrediting Bodies page (FR-4 → FR-14)

| # | Requirement |
|---|---|
| FR-4 | A P-01 Admin Table lists all accrediting bodies, with columns: Code, Name, Logo (thumbnail), Logo visibility (mode summary — "Any accredited test" or "≥ N%"), # tests accredited, Status (Active / Inactive). |
| FR-5 | A toolbar primary action **"Add accrediting body"** opens a P-03 Create modal with fields: Code, Name, Logo upload, **Logo visibility** (radio group — see FR-8), Display order, Active toggle (defaults ON). |
| FR-6 | Rows are edited via P-02 inline row-expand. The expanded panel contains the same fields as the create modal plus a **Delete** button (P-04 confirm — disallowed if any `test_accreditation` rows reference it; a banner explains why). |
| FR-7 | Logo upload accepts PNG and SVG, up to 500 KB, minimum 64×64 px for raster. Invalid file → inline error under the uploader (P-05). |
| FR-8 | **Logo visibility** is a required radio group with two options: (a) **"Any test on the report is accredited by this body"** — the default for new bodies; (b) **"At least N% of tests on the report are accredited by this body"** — reveals a `NumberInput` 0–100, step 1, default 80. Only the percentage input for the selected mode is shown; the other is hidden. Helper copy explains each option in one sentence. See FR-29 for render semantics. |
| FR-9 | Display order is a `NumberInput` with helper text explaining its effect ("Lower numbers appear first (leftmost) on the report. Ties break alphabetically on Code."). Used to order logos side-by-side on the report header (ascending). Duplicates allowed; ties break on `code` ascending. |
| FR-10 | An inactive body does not contribute to threshold evaluation or logo rendering; its existing `test_accreditation` rows are preserved but ignored until re-activated. |
| FR-11 | `code` is unique and immutable after creation (shown read-only in the expand panel). `name`, logo, logo visibility mode + percentage, display order, and active are editable. |
| FR-12 | P-06 empty state: when no accrediting bodies exist, the page shows an illustration, the message "No accrediting bodies yet. Add one to start tracking accreditation.", and the "Add accrediting body" CTA. |
| FR-13 | Body creation, deletion, activation changes, and logo-visibility-mode changes are audit-logged (who, when, before → after). |
| FR-14 | The "# tests accredited" column is a live count of currently-active `test_accreditation` rows for that body (expiration in the future). The column header is sortable. |

### 3.4 Test Accreditations page (FR-15 → FR-24)

| # | Requirement |
|---|---|
| FR-15 | A P-01 Admin Table shows one row per (test × accrediting body) with columns: Test code, Test name, Section, Accrediting body, Expiration, Status tag (Active / Expiring ≤ 60d / Expired). |
| FR-16 | Default sort: Status (Expired → Expiring → Active), then Expiration ascending, so the QA lead lands on actionable rows. |
| FR-17 | Toolbar filters: **Status** (All / Active / Expiring ≤ 60 days / Expired), **Accrediting body** (All or pick one), **Section** (All or pick one). |
| FR-18 | Toolbar search filters by test code or test name substring. |
| FR-19 | Primary action **"Add accreditation"** opens a P-03 Create modal: select Test (ComboBox, search by code/name), select Accrediting body (Select), pick Expiration (DatePicker). Validates uniqueness on (test, body); if already exists, shows inline error linking to the existing row. |
| FR-20 | Rows are edited via P-02 inline row-expand with fields: Expiration (DatePicker) and a Delete button (P-04 confirm). Test and body are read-only on edit (to change body, delete and recreate). |
| FR-21 | A P-11 bulk row action **"Extend expiration"** lets the QA lead select multiple rows and push all expirations to the same new date (e.g., after a bulk renewal). |
| FR-22 | Expiration in the past is accepted at entry, but the row shows the Expired status tag immediately. A banner above the table shows a running count: "3 expired · 5 expiring in the next 60 days". |
| FR-23 | Deep link: `/admin/test-catalog/accreditation/test-accreditations?testId={id}` loads the page with the Test filter pre-applied to that test and any matching rows expanded. This URL pattern is supported for external bookmarks, audit-log links, and future integrations. Legacy URLs of the form `/admin/test-catalog/accreditation?testId={id}` redirect here. |
| FR-24 | Add / edit / delete operations are audit-logged. |

### 3.5 Test Catalog (Manage Tests) list — not modified in V1 *(deferred)*

The existing Test Catalog admin list is intentionally left unchanged for V1. No new "Accreditation" column, no row-level badges, and no deep link from Manage Tests rows are introduced. Rationale: the Test accreditations page itself already offers filter-by-test search + the `?testId=` deep link (FR-23), and labs validated in discovery that the Manage Tests row was a secondary surface, not a primary one. The previous draft's FR-25 / FR-26 / FR-27 are moved to §12 Follow-ups and will be revisited post-V1 with real usage data.

### 3.6 Patient report rendering (FR-28 → FR-36)

| # | Requirement |
|---|---|
| FR-28 | At report render time, for each **active** accrediting body, the service computes: `N_accredited_by_body = count of tests on this report with an active, non-expired accreditation by that body`; `N_total = count of tests on this report` (excluding cancelled / not-performed per FR-30). |
| FR-29 | A body's logo is rendered iff: the body is active AND has a logo uploaded AND `N_total > 0` AND the body's **logo visibility mode** gate passes. Gate semantics: (a) `ANY_ACCREDITED_TEST` passes iff `N_accredited_by_body >= 1`; (b) `PERCENTAGE` passes iff `(N_accredited_by_body / N_total) * 100 >= body.threshold_pct`. The two modes are evaluated per-body, independently — one body can be Any, another Percentage, on the same report. |
| FR-30 | "Tests on the report" = tests appearing in the report's result list. Cancelled and not-performed tests do not count in numerator or denominator. "Not expired" = `expires_on >= report_date` (render date, not sample-collection date). |
| FR-31 | Logos that render are displayed **side-by-side** in the report header's accreditation slot, ordered by `display_order` ascending (ties by `code`). |
| FR-32 | If no body qualifies, the slot is empty but preserved (no layout shift relative to qualifying reports). |
| FR-33 | A **notes line** is added to the report's notes section whenever ≥1 test on the report has any active, non-expired accreditation — **regardless of threshold**. Format: `Tests on this report are accredited by: {comma-separated body names}.` Only bodies with ≥1 accredited test contribute to the list. |
| FR-34 | The notes line omits expired and inactive-body accreditations. |
| FR-35 | If no accredited tests appear on the report, no notes line is added. |
| FR-36 | The report render reads accrediting body config and test accreditations at the start of render; changes made mid-render do not take effect until the next report. |

## 4. API Surface (sketch)

| Method | Path | Purpose | Permission |
|---|---|---|---|
| `GET` | `/api/admin/accrediting-bodies` | List all bodies incl. inactive; supports query `?activeOnly=true` | `TEST_CATALOG_MANAGE` |
| `POST` | `/api/admin/accrediting-bodies` | Create body (JSON) | `TEST_CATALOG_MANAGE` |
| `PATCH` | `/api/admin/accrediting-bodies/{id}` | Update body (JSON) | `TEST_CATALOG_MANAGE` |
| `DELETE` | `/api/admin/accrediting-bodies/{id}` | Delete (rejected if referenced) | `TEST_CATALOG_MANAGE` |
| `POST` | `/api/admin/accrediting-bodies/{id}/logo` | Upload/replace logo (multipart) | `TEST_CATALOG_MANAGE` |
| `DELETE` | `/api/admin/accrediting-bodies/{id}/logo` | Remove logo | `TEST_CATALOG_MANAGE` |
| `GET` | `/api/admin/test-accreditations` | List; supports `?status=`, `?bodyId=`, `?sectionId=`, `?testId=`, `?q=` | `TEST_CATALOG_MANAGE` |
| `POST` | `/api/admin/test-accreditations` | Create | `TEST_CATALOG_MANAGE` |
| `PATCH` | `/api/admin/test-accreditations/{id}` | Update (expiration only) | `TEST_CATALOG_MANAGE` |
| `DELETE` | `/api/admin/test-accreditations/{id}` | Delete | `TEST_CATALOG_MANAGE` |
| `POST` | `/api/admin/test-accreditations/bulk-extend` | Body: `{ ids: [...], new_expires_on: "YYYY-MM-DD" }` | `TEST_CATALOG_MANAGE` |
| `GET` | `/api/admin/accreditation-summary` | Returns counts per body + expiring/expired totals for the Test accreditations page summary banner | `TEST_CATALOG_MANAGE` |

The `POST /api/admin/accrediting-bodies` and `PATCH /api/admin/accrediting-bodies/{id}` payloads accept the new field `logo_visibility_mode` (enum: `ANY_ACCREDITED_TEST` | `PERCENTAGE`). When the mode is `ANY_ACCREDITED_TEST`, `threshold_pct` in the payload is accepted but ignored on render; when the mode is `PERCENTAGE`, `threshold_pct` is required and validated 0–100.

The report-rendering backend reads `accrediting_body` and `test_accreditation` directly — no new endpoint on the render path.

## 5. Validation Rules

- Body code: 2–16 chars, uppercase alphanumerics + `-`, unique, immutable after create.
- Body name: 1–120 chars.
- Logo visibility mode: must be one of `ANY_ACCREDITED_TEST` | `PERCENTAGE`. Defaults to `ANY_ACCREDITED_TEST` for new bodies.
- Threshold: integer 0–100 inclusive. Required and used at render when mode = `PERCENTAGE`; stored but render-ignored when mode = `ANY_ACCREDITED_TEST`.
- Logo file: PNG or SVG only, ≤ 500 KB, ≥ 64×64 px for raster; SVG size via bounding-box fallback.
- Test accreditation: (test, body) pair unique; expiration date required; expiration in the past allowed but surfaced via Expired status.
- Delete a body: disallowed while referenced by any `test_accreditation` row; banner explains.
- Delete a test that has `test_accreditation` rows: handled by `ON DELETE CASCADE` (rows follow the test).
- Threshold change on a body takes effect on the next report render; existing rendered PDFs are not regenerated.

## 6. Edge Cases

| Case | Expected behavior |
|---|---|
| Report with zero tests | No logos, no notes line (N_total = 0 gate, FR-29 / FR-33). |
| Report with accredited tests but body inactive | Body excluded from both logo evaluation and notes line. |
| Report with accredited tests all expired | No logo for that body; no notes-line contribution from that body. |
| Body with no logo uploaded, threshold met | Logo slot remains empty for that body; notes line still mentions the body (presence is data, not image). |
| Two bodies have identical display_order | Order by `code` ascending (FR-31 tiebreak). |
| User tries to add a duplicate (test × body) | Create modal shows inline error; no row created. |
| User changes body code (attempt) | Field is read-only on edit; not possible. |
| Delete attempt on a referenced body | Server returns 409; UI shows banner: "Cannot delete — N test accreditations reference this body. Remove them first." |
| QA lead bulk-extends expirations to a past date | Accepted (admin's choice); rows shown as Expired immediately. |
| Body in `ANY_ACCREDITED_TEST` mode with no qualifying tests on a report | Logo does not render (N_accredited_by_body = 0 fails the gate). Notes line also omits the body. |
| Body in `PERCENTAGE` mode with 100 threshold on a report where every test is accredited by that body | Logo renders (100% ≥ 100). |
| Body mode toggled from PERCENTAGE → ANY_ACCREDITED_TEST (existing threshold_pct preserved) | New render uses the `ANY_ACCREDITED_TEST` gate; the stored `threshold_pct` is ignored until mode flips back. |
| Report-render-time race with body deactivation | Render uses snapshot read at the start; an in-flight render doesn't flip mid-page. |

## 7. Out of Scope

- CSV import/export of accrediting bodies or test accreditations (explicitly dropped — accreditation state varies per lab and is kept UI-only).
- Logo rendering on reports other than patient result reports (referral, cumulative, audit).
- Automated renewal reminders / email notifications (labs can filter the Dashboard to "Expiring ≤ 60 days" for a manual pass; notifications can be a follow-up).
- Per-analyte or per-sample-type accreditation granularity.
- Historical "who accredited this test on date X" timeline beyond the audit log.
- Migration of existing deployments' accreditation data — labs start with no bodies and no test accreditations.
- Per-method accreditation (if Method A is accredited but Method B is not for the same test — deferred; would be a follow-up feature atop the Reporting Ranges by Method work).

## 8. Acceptance Criteria (traced to requirements)

1. [FR-1, FR-2] **Given** a user with `TEST_CATALOG_MANAGE`, **when** they open the admin SideNav under Test Catalog Management, **then** two submenu items are visible: "Accrediting bodies" and "Test accreditations". Clicking either navigates directly to its own page at `/admin/test-catalog/accreditation/bodies` or `/admin/test-catalog/accreditation/test-accreditations` respectively.
2. [FR-4, FR-5, FR-7, FR-8] **Given** the Accrediting bodies page, **when** the user creates a body "ISO 15189" with a 120 KB PNG logo, **then** the body appears in the table with the logo thumbnail, logo visibility showing "Any accredited test" (the default), and 0 tests accredited.
3. [FR-8] **Given** the body create or edit panel, **when** the user selects "At least N% of tests on the report are accredited by this body", **then** a percentage NumberInput is revealed (default 80); selecting "Any test on the report is accredited by this body" hides the percentage input. Only one of the two inputs is visible at a time.
4. [FR-6, FR-11] **Given** an existing body, **when** the user expands its row, **then** the Code field is read-only while Name, Logo, Logo visibility (mode + percentage), Display order, and Active are editable.
5. [FR-7] **Given** the body create modal, **when** the user uploads a 900 KB PNG, **then** an inline error "File exceeds 500 KB" appears and no upload is sent.
6. [FR-10] **Given** a body is active with a qualifying set of accredited tests on a report, **when** the admin deactivates the body and the next report renders, **then** the body's logo is not shown and the notes line excludes the body.
7. [FR-15, FR-16, FR-17] **Given** the Test accreditations page with 20 rows, **when** the user filters Status = "Expiring ≤ 60 days", **then** only rows whose `expires_on` is in 0–60 days are shown, sorted by `expires_on` ascending.
8. [FR-19] **Given** the Add accreditation modal, **when** the user picks a test already accredited by the chosen body, **then** an inline error appears: "This test is already accredited by that body" with a link to the existing row.
9. [FR-21] **Given** 5 test accreditations selected, **when** the user invokes "Extend expiration" and enters 2027-06-30, **then** all 5 rows update to `expires_on = 2027-06-30` and their status flips to Active.
10. [FR-23] **Given** an external bookmark `/admin/test-catalog/accreditation/test-accreditations?testId=123`, **when** the user follows the link, **then** the Test accreditations page loads with the test filter pre-applied and matching rows expanded. Legacy `/admin/test-catalog/accreditation?testId=123` redirects here and behaves identically.
11. [FR-29, FR-31] **Given** body "ISO 15189" in `PERCENTAGE` mode with threshold 80 and a logo, and a report with 5 tests of which 4 are accredited by ISO 15189, **when** the report renders, **then** its logo appears in the header accreditation slot. If body "SANAS" is in `ANY_ACCREDITED_TEST` mode and covers ≥ 1 test on the same report, its logo also appears, ordered by `display_order`.
12. [FR-29] **Given** body "ISO 15189" in `PERCENTAGE` mode with threshold 80 and a report where 3 of 5 tests are accredited by it (60%), **when** the report renders, **then** its logo is not shown. If the same body were in `ANY_ACCREDITED_TEST` mode, the logo *would* show (3 ≥ 1).
13. [FR-33, FR-34] **Given** a report with ≥1 ISO-15189-accredited test (not expired) and ≥1 SANAS-accredited test (expired), **when** the report renders, **then** the notes line reads "Tests on this report are accredited by: ISO 15189." — SANAS is omitted.
14. [FR-35] **Given** a report with no accredited tests, **when** it renders, **then** no accreditation notes line is added.
15. [FR-3] **Given** a user without `TEST_CATALOG_MANAGE`, **when** they attempt to navigate to either accreditation page, **then** access is refused consistent with other `TEST_CATALOG_MANAGE` pages.
16. [FR-13, FR-24] **Given** any create / edit / delete on either admin page (including a logo-visibility-mode change), **when** the action completes, **then** an audit log entry records user, timestamp, entity, and before / after values.

## 9. Localization Keys

| Key | English fallback |
|---|---|
| `admin.testCatalog.accred.nav.accreditationMenu` | "Accreditation" (optional sub-grouping label, if labs want to group the two items visually in the SideNav; skipped by default) |
| `admin.testCatalog.accred.nav.bodies` | "Accrediting bodies" (SideNav submenu item label) |
| `admin.testCatalog.accred.nav.accreditations` | "Test accreditations" (SideNav submenu item label) |
| `admin.testCatalog.accred.bodies.heading` | "Accrediting bodies" (page H2) |
| `admin.testCatalog.accred.bodies.desc` | "Create and manage accrediting bodies. Each body has its own logo and visibility rule applied to patient reports." |
| `admin.testCatalog.accred.accreditations.heading` | "Test accreditations" (page H2) |
| `admin.testCatalog.accred.accreditations.desc` | "Track and maintain accreditation coverage across the test catalog." |
| `admin.testCatalog.accred.bodies.addCta` | "Add accrediting body" |
| `admin.testCatalog.accred.bodies.col.code` | "Code" |
| `admin.testCatalog.accred.bodies.col.name` | "Name" |
| `admin.testCatalog.accred.bodies.col.logo` | "Logo" |
| `admin.testCatalog.accred.bodies.col.visibility` | "Logo visibility" |
| `admin.testCatalog.accred.bodies.col.visibilityAny` | "Any accredited test" (value shown in the column when mode = `ANY_ACCREDITED_TEST`) |
| `admin.testCatalog.accred.bodies.col.visibilityPct` | "≥ [N]%" (value shown when mode = `PERCENTAGE`, with the body's threshold interpolated) |
| `admin.testCatalog.accred.bodies.col.count` | "Tests accredited" |
| `admin.testCatalog.accred.bodies.col.status` | "Status" |
| `admin.testCatalog.accred.bodies.field.code` | "Code" |
| `admin.testCatalog.accred.bodies.field.name` | "Name" |
| `admin.testCatalog.accred.bodies.field.logo` | "Logo" |
| `admin.testCatalog.accred.bodies.field.logoHint` | "PNG or SVG, up to 500 KB, at least 64×64 px." |
| `admin.testCatalog.accred.bodies.field.visibility` | "Logo visibility" (radio group label) |
| `admin.testCatalog.accred.bodies.field.visibilityHelp` | "Choose when this body's logo appears on a patient report." |
| `admin.testCatalog.accred.bodies.field.visibilityAny` | "Any test on the report is accredited by this body" (option label for `ANY_ACCREDITED_TEST`) |
| `admin.testCatalog.accred.bodies.field.visibilityAnyHelp` | "Logo appears whenever at least one test on the report is accredited by this body. Use this for most labs." |
| `admin.testCatalog.accred.bodies.field.visibilityPct` | "At least [N]% of tests on the report are accredited by this body" (option label for `PERCENTAGE`) |
| `admin.testCatalog.accred.bodies.field.visibilityPctHelp` | "Logo only appears when the share of accredited tests on a report meets or exceeds this percentage." |
| `admin.testCatalog.accred.bodies.field.threshold` | "Threshold (%)" (label on the NumberInput shown inside the Percentage option) |
| `admin.testCatalog.accred.bodies.field.displayOrder` | "Display order" |
| `admin.testCatalog.accred.bodies.field.displayOrderHelp` | "Lower numbers appear first (leftmost) on the report. Ties break alphabetically on Code." |
| `admin.testCatalog.accred.bodies.field.active` | "Active" |
| `admin.testCatalog.accred.bodies.empty.title` | "No accrediting bodies yet" |
| `admin.testCatalog.accred.bodies.empty.body` | "Add an accrediting body to start tracking accreditation." |
| `admin.testCatalog.accred.bodies.deleteBlocked` | "Cannot delete — [N] test accreditations reference this body. Remove them first." |
| `admin.testCatalog.accred.accreditations.addCta` | "Add accreditation" |
| `admin.testCatalog.accred.accreditations.col.testCode` | "Code" |
| `admin.testCatalog.accred.accreditations.col.testName` | "Test" |
| `admin.testCatalog.accred.accreditations.col.section` | "Section" |
| `admin.testCatalog.accred.accreditations.col.body` | "Accrediting body" |
| `admin.testCatalog.accred.accreditations.col.expires` | "Expires" |
| `admin.testCatalog.accred.accreditations.col.status` | "Status" |
| `admin.testCatalog.accred.filter.status` | "Status" |
| `admin.testCatalog.accred.filter.body` | "Accrediting body" |
| `admin.testCatalog.accred.filter.section` | "Section" |
| `admin.testCatalog.accred.statusActive` | "Active" |
| `admin.testCatalog.accred.statusExpiring` | "Expiring [date]" |
| `admin.testCatalog.accred.statusExpired` | "Expired [date]" |
| `admin.testCatalog.accred.bulkExtend` | "Extend expiration" |
| `admin.testCatalog.accred.bulkExtendDialogTitle` | "Extend expiration for [N] accreditations" |
| `admin.testCatalog.accred.summary.expired` | "[N] expired" |
| `admin.testCatalog.accred.summary.expiring` | "[N] expiring in the next 60 days" |
| `admin.testCatalog.accred.addModal.title` | "Add test accreditation" |
| `admin.testCatalog.accred.addModal.test` | "Test" |
| `admin.testCatalog.accred.addModal.body` | "Accrediting body" |
| `admin.testCatalog.accred.addModal.expires` | "Expires on" |
| `admin.testCatalog.accred.addModal.duplicate` | "This test is already accredited by that body." |
| `report.accred.notesLine` | "Tests on this report are accredited by: [bodies]." |

## 10. Dependencies

- Existing admin layout shell (Carbon `SideNav`, breadcrumb, page header) for the two new routes. Adds two `SideNavMenuItem`s under the existing Test Catalog Management `SideNavMenu`.
- Existing audit log mechanism.
- Patient result report rendering service (backend) — reads new tables and applies FR-28 – FR-36 (including the per-body logo visibility mode branch in FR-29).
- Existing `TEST_CATALOG_MANAGE` permission scope. No new scopes.
- The existing Test Catalog (Manage Tests) admin page is **not** a dependency — V1 does not modify it (see §3.5).

## 11. Rollout

- On deploy, both new tables are empty. Patient report rendering sees zero bodies → no logos and no notes line; behavior is identical to pre-feature until a QA lead starts configuring bodies.
- No data migration required.
- No feature flag required — the feature is inert until the lab adds a body.

## 12. Follow-ups (deliberately deferred)

- **Accreditation column on Manage Tests** (was FR-25 / FR-26 / FR-27 in v3). Would add a per-row `Tag` showing each active body on the test and a deep link into the Test accreditations page. Moved out of V1 because (a) the Test accreditations page already offers filter-by-test search, and (b) discovery feedback said it's a secondary surface, not a primary one. Revisit post-V1 with real usage data — if labs are spending time there, the badge is worth adding; if they're not, skip it.
- Email / in-app reminders when an accreditation is within N days of expiring.
- Per-method accreditation (coordinate with the Reporting Ranges by Method feature).
- Logo rendering on non-patient reports.
- CSV import (revisit only if labs report friction with UI-only entry).
