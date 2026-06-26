# OpenELIS Admin — Pattern Library (Phase 4)

**Version:** 1.0
**Date:** 2026-04-20
**Baseline:** Pattern Audit v1.0, ratified by Casey 2026-04-20
**Framework:** Carbon Design System (@carbon/react)
**Status:** APPROVED — this is the canonical source for Phase 5 page design.

This library defines the 13 reusable interaction patterns that every admin page
in OpenELIS Global MUST use. Page designs in Phase 5 reference patterns by ID
(e.g. "Test Management uses P-01, P-02, P-05, P-10, P-11") rather than
re-specifying the same interaction twice.

Governance rule: any admin page that introduces a 14th pattern must first
propose it as an amendment to this library. No snowflakes.

---

## Contents

| ID    | Pattern                              | Status          |
|-------|--------------------------------------|-----------------|
| P-01  | Admin Table                          | Modernize       |
| P-02  | Inline row-expand edit               | Modernize       |
| P-03  | Create modal                         | Keep + tighten  |
| P-04  | Confirm-delete modal                 | Keep + tighten  |
| P-05  | Form validation (inline + banner)    | Modernize       |
| P-06  | Empty state                          | Modernize       |
| P-07  | Error state                          | Modernize       |
| P-08  | Loading skeleton                     | Modernize       |
| P-09  | Breadcrumb + page header             | Keep            |
| P-10  | Pagination                           | Modernize       |
| P-11  | Bulk row actions                     | Modernize       |
| P-12  | Import / export flow                 | Modernize       |
| P-13  | Permission gate wrapper              | Keep            |

---

## Global conventions

These apply to every pattern below.

**Carbon version:** @carbon/react ≥ 1.40, Carbon theme `g10` (light) with `g100`
(dark) variant available.

**i18n keys:** `admin.[bucket].[page].[identifier]`. Pattern-level generics use
`admin.common.[identifier]`. Never hardcode visible strings.

**Permission scopes:** only two are real — `ADMIN_MENU` and
`TEST_CATALOG_MANAGE`. Never introduce new scopes in a page design.

**Focus management:** every modal / dialog traps focus and restores focus to
the trigger on close. Every form submission with errors focuses the first
invalid field.

**Accessibility:** every pattern below meets WCAG 2.1 AA. Reviews run the
Carbon accessibility checker on each page in Phase 5.

**Testability:** every pattern includes acceptance criteria phrased as
`Given / When / Then` so QA can derive test cases mechanically.

---

## P-01 — Admin Table

**Purpose:** Present a list of admin records with search, sort, pagination, and
per-row actions. The default list container for every management page.

**When to use:**
- Any admin page whose job-to-be-done is "find a record and do something to it".
- Estimated row count > 10 at steady state.

**When NOT to use:**
- Single-record admin pages (e.g. Lab Identity, Site Branding) — those are forms, not lists.
- Workflows that are grid-first (e.g. Calendar Management) — use the specialized pattern in Phase 5.

**Anatomy (Carbon components):**
`TableContainer` → `TableToolbar` (`TableToolbarContent` + `TableToolbarSearch`
+ primary action `Button kind="primary"`) → `DataTable` → `TableHead` →
`TableBody` → `TableRow` (with optional `TableExpandRow` for P-02) → `Pagination` (P-10).

**Behavior rules:**
1. Search input is full-row — it matches every visible column, not just Name. Matching substrings render with a `<mark>`-style highlight.
2. Search is debounced 250ms; typing does not re-query on every keystroke.
3. Default sort is the first sortable column, ascending.
4. Column-header click toggles `asc → desc → unsorted` (Carbon default).
5. Row density is user-toggleable: compact / regular / comfortable. Default: regular. Preference persists in local storage keyed by page.
6. Column picker lets the user hide/show and reorder columns. Preference persists.
7. Rows are NOT clickable by default — click opens nothing unless the page explicitly enables row-click to expand (P-02).
8. Primary action button (e.g. "Add Provider") is top-right in the toolbar, always visible when the user has write permission (P-13).

**A11y requirements:**
- Table caption is the page H1 (visually hidden if redundant).
- Sortable column headers announce their sort state via `aria-sort`.
- Search input has `role="searchbox"` and `aria-label` matching placeholder.
- Highlighted match text is announced only on the first match per result set, not per keystroke.

**i18n keys:**
| Key                                         | Example                            |
|---------------------------------------------|------------------------------------|
| `admin.common.table.search.placeholder`     | "Search…"                          |
| `admin.common.table.search.ariaLabel`       | "Search records"                   |
| `admin.common.table.density.compact`        | "Compact"                          |
| `admin.common.table.density.regular`        | "Regular"                          |
| `admin.common.table.density.comfortable`    | "Comfortable"                      |
| `admin.common.table.columnPicker.label`     | "Columns"                          |
| `admin.[page].table.primaryAction`          | e.g. "Add provider"                |
| `admin.[page].table.columns.[colId]`        | per-column header text             |

**Props API — `<AdminTable>`:**
```ts
interface AdminTableProps<T> {
  id: string;                        // stable, used for column-pref storage
  rows: T[];
  columns: AdminTableColumn<T>[];
  isLoading?: boolean;               // triggers P-08 skeleton
  error?: Error | null;              // triggers P-07 banner
  emptyState: EmptyStateConfig;      // shape for P-06
  pagination?: PaginationConfig;     // P-10; omit = no pagination
  selection?: {                      // enables P-11
    selected: Set<string>;
    onSelect: (id: string) => void;
    onSelectAll: (ids: string[]) => void;
  };
  rowExpand?: (row: T) => ReactNode; // enables P-02
  primaryAction?: { label: string; onClick: () => void; perm: Scope };
  rowActions?: RowAction<T>[];
}
```

**Acceptance criteria:**
1. **Given** a table with 50 rows **when** the user types "jsm" in the search box **then** only rows matching "jsm" (case-insensitive) remain, with the match highlighted, after 250ms idle.
2. **Given** a table with columns A–F **when** the user opens the column picker and hides C **then** C is hidden and the preference survives page reload.
3. **Given** a user without `ADMIN_MENU` permission **when** the page loads **then** the primary action button is not rendered (P-13).
4. **Given** a table scrolled past the first viewport **when** the user scrolls horizontally **then** the header row stays sticky.

**Related:** P-02 (row-expand), P-06 (empty), P-07 (error), P-08 (loading), P-10 (pagination), P-11 (bulk), P-13 (permission).

---

## P-02 — Inline row-expand edit

**Purpose:** Edit an existing record without leaving the list. The default
edit interaction for forms with ≤ 4 sections or ≤ 8 fields.

**When to use:**
- Edit a single record and its fields fit within an expanded row tile.
- The user needs to see the surrounding list while editing (most admin cases).

**When NOT to use:**
- Forms with 5+ sections or 15+ fields → use full-page edit in Phase 5.
- Destructive-only flows → use P-04.
- Creating a new record (no row exists yet) → use P-03.

**Anatomy:**
`TableExpandRow` with `onExpand` toggling an expanded `Tile` below that row.
The tile contains a `Form` with fieldsets, validation per P-05, and a
sticky `Button` footer (Save / Cancel).

**Behavior rules:**
1. Only one row may be expanded at a time; expanding a second row auto-collapses the first. If the first has unsaved changes, prompt via P-04-style dialog ("Discard changes in row X?").
2. Entering edit focuses the first editable field.
3. `Cancel` collapses the row with no confirmation when the form is clean. When dirty, prompt "Discard changes?".
4. `Save` submits, shows inline per-field errors (P-05) if invalid, otherwise closes the expand with a `Toast` success (P-07 success kind).
5. Keyboard: `Esc` triggers Cancel; `Ctrl+S` triggers Save when the form is dirty.
6. The expanded row is a full-width `Tile` with consistent spacing: 16px padding, 24px between fieldsets.

**A11y requirements:**
- Expand chevron has `aria-expanded` and `aria-controls` on the expanded region.
- Expanded content has `role="region"` with `aria-label="Edit [record name]"`.
- Focus returns to the expand chevron on Cancel.
- Save success is announced via a `role="status"` live region.

**i18n keys:**
| Key                                         | Example             |
|---------------------------------------------|---------------------|
| `admin.common.edit.save`                    | "Save"              |
| `admin.common.edit.cancel`                  | "Cancel"            |
| `admin.common.edit.discardPrompt.title`     | "Discard changes?"  |
| `admin.common.edit.discardPrompt.body`      | "You have unsaved changes to [name]." |
| `admin.common.edit.savedToast`              | "Changes saved."    |

**Acceptance criteria:**
1. **Given** a row in an editable table **when** the user clicks the Edit icon **then** the row expands and focus lands on the first editable field.
2. **Given** an expanded row with unsaved changes **when** the user clicks Edit on another row **then** a "Discard changes?" dialog appears before either row collapses or expands.
3. **Given** an expanded edit form **when** the user presses Esc **and** the form is clean **then** the row collapses without prompting.
4. **Given** a successful save **when** the server returns 2xx **then** a success toast appears for 5 seconds, the row collapses, and the row's display values reflect the saved state.

**Related:** P-01, P-03, P-04, P-05.

---

## P-03 — Create modal

**Purpose:** Create a new record via a focused modal form. Used for all
"Add X" flows at the list level.

**When to use:**
- The create form fits comfortably in a modal (≤ 3 sections / ≤ 10 fields).
- Creating a single record at a time.

**When NOT to use:**
- Multi-record creation → use P-12 import flow.
- Create forms with 4+ sections → use a dedicated `/new` page in Phase 5.

**Anatomy:**
`Modal` (size `md` or `lg` depending on form length) with `ModalHeader` (title + close),
`ModalBody` (Carbon `Form`), `ModalFooter` (Secondary "Cancel", Primary "Create").

**Behavior rules:**
1. On open, focus moves to the first field.
2. Required-field validation runs on blur AND on submit (P-05).
3. Primary "Create" button is disabled until the minimum required set is valid (no need to click to discover missing fields).
4. `Esc` and outside-click attempt to close — **guarded** by a "Discard changes?" prompt if any field is dirty.
5. Submit calls the create API; on success the modal closes and the new row appears at the top of the table with a brief `Tag kind="green"` "New" marker (fades after 8 seconds).
6. On server error, the modal stays open and shows the error per P-05 / P-07.
7. Modal footer is NOT scrolled away — it remains sticky when the body overflows.

**A11y requirements:**
- `Modal` has `aria-labelledby` pointing at the header title.
- `Modal` traps focus until closed; focus restores to the primary action button that opened it.
- Error summary on submit is in a `role="alert"` region at the top of the `ModalBody`.

**i18n keys:**
| Key                                       | Example                     |
|-------------------------------------------|-----------------------------|
| `admin.[page].create.title`               | "Add provider"              |
| `admin.common.create.submit`              | "Create"                    |
| `admin.common.create.cancel`              | "Cancel"                    |
| `admin.common.create.discardPrompt.title` | "Discard changes?"          |

**Acceptance criteria:**
1. **Given** an open create modal **when** the user clicks outside the modal **and** at least one field is dirty **then** a "Discard changes?" dialog appears before the modal closes.
2. **Given** a create modal with required fields blank **when** the user tabs out of each **then** inline error text appears under each one and the Create button remains disabled.
3. **Given** a successful create response **when** the server returns 2xx **then** the modal closes, the new row appears at the top of the table, and a `Tag` marks it "New" for 8 seconds.
4. **Given** a 400 server response **when** the user had submitted **then** the modal stays open, the Create button re-enables, and a banner displays the server's error message with field-level errors merged.

**Related:** P-01, P-04, P-05.

---

## P-04 — Confirm-delete modal

**Purpose:** Guard destructive actions — delete, archive, deactivate — with an
explicit confirmation.

**When to use:**
- Any action the user cannot reverse from the UI.
- Any action that removes data visible to other users.

**When NOT to use:**
- Non-destructive saves (use P-02 or P-03 flows).
- Actions where undo is trivially available (use toast "Undo" instead, e.g. row hide).

**Anatomy:**
`Modal` with `danger` prop = `true`, title stating the action, body naming the
specific record, and footer buttons. For irreversible destructive actions
against records with downstream data (e.g. a Test with historical results),
include a **typed-match gate** — the user must type the record's primary label
to enable the Delete button.

**Behavior rules:**
1. Destructive action button has `kind="danger"` (red per Carbon).
2. Body includes the exact record identifier — never just "Are you sure?".
3. For **irreversible** actions against records with downstream dependencies: require typing the exact record name (case-sensitive match) before the Delete button enables. The match requirement is visible inline.
4. Default focused button on open is Cancel (not Delete) — prevents accidental Enter-commits.
5. On success, the row is removed with an undo-toast where possible (soft-delete records); for hard-delete, just a success toast.
6. Bulk delete reuses this pattern; the modal body lists the count + first N names ("Delete 12 providers including jsmith, kpatel, mwanja, …?").

**A11y requirements:**
- `Modal` has `role="alertdialog"` because the consequence is destructive.
- Typed-match input announces its validation state via `aria-invalid`.
- Focus lands on Cancel on open.

**i18n keys:**
| Key                                        | Example                                     |
|--------------------------------------------|---------------------------------------------|
| `admin.common.delete.title`                | "Delete [record]?"                          |
| `admin.common.delete.body`                 | "Delete [recordName]? This cannot be undone." |
| `admin.common.delete.typedMatch.label`     | "Type the record name to confirm"           |
| `admin.common.delete.confirm`              | "Delete"                                    |
| `admin.common.delete.cancel`               | "Cancel"                                    |
| `admin.common.delete.undoToast`            | "Deleted [name]. Undo"                      |

**Acceptance criteria:**
1. **Given** a delete confirmation modal **when** the user presses Enter without clicking **then** nothing destructive happens (focus is on Cancel).
2. **Given** a delete requiring typed-match **when** the user types a non-matching string **then** the Delete button remains disabled.
3. **Given** a successful soft-delete **when** the server returns 2xx **then** the row disappears and an Undo toast appears for 10 seconds; clicking Undo restores the row.
4. **Given** a bulk delete of 3+ records **when** the modal opens **then** the body lists the count and first 3 record names.

**Related:** P-01, P-11.

---

## P-05 — Form validation (inline + banner + focus)

**Purpose:** Report form errors clearly, accessibly, and actionably. Consistent
across every form in admin.

**When to use:** Every form — create, edit, config.

**Anatomy (three layers):**
1. **Inline per-field** — Carbon input's `invalid` + `invalidText` props.
2. **Summary banner** — `InlineNotification kind="error"` at top of form, listing each invalid field as an anchor link.
3. **Focus management** — on submit, focus the first invalid field.

**Behavior rules:**
1. Validation runs on blur for each field (not every keystroke).
2. Validation also runs on submit; the banner aggregates all errors.
3. Banner list items are real anchor links (`<a href="#field-id">`) that move focus to the corresponding field on click.
4. Submitting does NOT clear pre-filled valid fields.
5. Server-side errors are merged into the same display surface: if the server returns `{ field: "email", error: "already in use" }`, it renders under the `email` field AND in the banner list.
6. When all errors clear, the banner removes itself and the focus stays where the user last was.
7. Client-side types: required, format (email, date, integer range), length, and business rules (e.g. "End date after start date").

**A11y requirements:**
- Banner is `role="alert"` so it's announced immediately on submit.
- Inline errors use `aria-describedby` pointing to the error text.
- Invalid inputs have `aria-invalid="true"`.
- Anchors in the banner use `aria-label` like "Jump to [field name]".

**i18n keys:**
| Key                                          | Example                        |
|----------------------------------------------|--------------------------------|
| `admin.common.validation.banner.title`       | "Fix [N] errors to continue"   |
| `admin.common.validation.required`           | "This field is required"       |
| `admin.common.validation.email`              | "Enter a valid email"          |
| `admin.common.validation.integer`            | "Enter a whole number"         |
| `admin.common.validation.dateRange`          | "End date must be after start" |

**Acceptance criteria:**
1. **Given** a form with 3 required fields blank **when** the user clicks Submit **then** a banner appears listing 3 errors as anchor links, each invalid field shows inline error text, and focus moves to the first invalid field.
2. **Given** a banner with 3 error anchors **when** the user presses Enter on the second anchor **then** focus moves to the corresponding field and the field is visible in the viewport.
3. **Given** a form with a server error on "email" **when** the server responds **then** "email" shows inline error text AND appears in the banner.
4. **Given** all errors are resolved **when** the last invalid field passes validation on blur **then** the banner disappears.

**Related:** P-02, P-03, P-07.

---

## P-06 — Empty state

**Purpose:** When a table legitimately has zero records, give the user a clear
"what's next" instead of a blank grid.

**When to use:**
- Any list page that can legitimately be empty (first-time-use, new filter).
- Every `DataTable` surface — no exceptions.

**Anatomy:**
A Carbon `Tile` (or centered layout) inside the `TableContainer`, below the
table header. Contains: inline SVG illustration or Carbon icon, headline,
supporting text, optional primary action button.

**Behavior rules:**
1. Differentiate **first-time-use empty** (no records ever) from **filter empty** (records exist but search matches none). Copy and CTA differ:
   - First-time-use: "No providers yet" + "Add your first provider" button.
   - Filter empty: "No matches for '[query]'" + "Clear search" link.
2. Illustration is inline SVG, monochrome, ≤ 3KB. No external asset dependency.
3. Primary action button respects P-13 — hidden if the user lacks permission.
4. Empty-state height matches the equivalent table height (prevents layout jump as data loads).

**A11y requirements:**
- Headline uses `<h2>` for document structure.
- The whole tile is NOT announced as alert — it's normal content.
- SVG has `aria-hidden="true"` (decorative).

**i18n keys:**
| Key                                               | Example                            |
|---------------------------------------------------|------------------------------------|
| `admin.[page].empty.firstTime.title`              | "No providers yet"                 |
| `admin.[page].empty.firstTime.body`               | "Providers appear here after they're added." |
| `admin.[page].empty.firstTime.cta`                | "Add provider"                     |
| `admin.common.empty.filter.title`                 | "No matches for '[query]'"         |
| `admin.common.empty.filter.cta`                   | "Clear search"                     |

**Acceptance criteria:**
1. **Given** a fresh install with zero providers **when** the user opens the Provider Management page **then** the first-time-use empty state renders with an "Add provider" CTA.
2. **Given** a populated list **when** the user searches "xzxz" with no matches **then** the filter-empty state renders with "No matches for 'xzxz'" and a "Clear search" link.
3. **Given** a user without write permission **when** the first-time-use empty state renders **then** the primary CTA is hidden.

**Related:** P-01, P-13.

---

## P-07 — Error state

**Purpose:** Handle runtime failures (API 5xx, network, permission denial)
without dumping the user out of the app.

**Kinds:**
1. **Whole-page error** — API failed on page load. Keep nav shell; show banner + Retry in main content area.
2. **Per-record error** — save failed on one row. Show inline within the row.
3. **Session-expired** — token invalid. Attempt silent refresh; if that fails, show a modal offering re-sign-in without destroying the page context.

**Anatomy (whole-page):**
`InlineNotification kind="error"` at top of main content, with title,
description, Retry button, and support ID (request correlation ID from the
server response).

**Anatomy (per-record):**
Inline within the row — red `Tag` with "Save failed" + `Link` "Retry" +
`Tooltip` with the error detail.

**Behavior rules:**
1. Never show a raw server stack trace. Map server codes to friendly copy.
2. Always surface a support ID when available. Copy-to-clipboard on click.
3. Retry button re-executes the original request — do not re-mount the page.
4. Per-record errors do NOT block other rows. The table stays interactive.
5. Session-expired: first try silent token refresh (no UI). On refresh failure, show a `Modal` with "Session expired — sign in again" that re-auths without losing in-progress work.
6. Error banner persists until dismissed or the underlying condition resolves. Auto-dismiss is NOT allowed on errors.

**A11y requirements:**
- Error banners use `role="alert"`.
- Per-record error Tags are announced via `aria-live="polite"` regions.
- Retry button has clear `aria-label` when icon-only.

**i18n keys:**
| Key                                           | Example                                     |
|-----------------------------------------------|---------------------------------------------|
| `admin.common.error.page.title`               | "Couldn't load [thing]"                     |
| `admin.common.error.page.body`                | "Something went wrong. Try again or report this." |
| `admin.common.error.page.retry`               | "Try again"                                 |
| `admin.common.error.page.supportId`           | "Support ID: [id]"                          |
| `admin.common.error.row.saveFailed`           | "Save failed"                               |
| `admin.common.error.row.retry`                | "Retry"                                     |
| `admin.common.error.session.title`            | "Session expired"                           |
| `admin.common.error.session.reauth`           | "Sign in again"                             |

**Acceptance criteria:**
1. **Given** a 500 response on initial page load **when** the user opens the page **then** an error banner appears with a Retry button and a copyable support ID.
2. **Given** a row-level save 500 **when** the user saves a row **then** the row shows a red Tag "Save failed" with a Retry link; other rows remain interactive.
3. **Given** an expired session **when** the user interacts **then** silent refresh is attempted, then (if that fails) a modal offers re-sign-in without navigating away from the page.
4. **Given** any error banner **when** rendered **then** no raw stack trace is visible to the user.

**Related:** P-01, P-02, P-05.

---

## P-08 — Loading skeleton

**Purpose:** Indicate async loading without a blocking spinner. Makes first
paint feel faster because the structure is already in place.

**When to use:**
- Any list or card that takes > 200ms to load.
- Any form that hydrates from a remote fetch.

**When NOT to use:**
- Instant interactions (< 100ms perceived).
- Actions with unknown duration — use Carbon's inline spinner instead (e.g. running a long report).

**Anatomy:**
Carbon `DataTableSkeleton` for tables. `SkeletonText` / `SkeletonIcon` /
`SkeletonPlaceholder` for forms, headers, and custom layouts.

**Behavior rules:**
1. Skeleton shape matches the loaded content's shape (same column count, same row count default).
2. Minimum display time of 200ms — prevents a flash of skeleton for fast responses.
3. Replace skeleton with real data in one tick — no progressive row reveal.
4. If load takes > 5 seconds, swap skeleton for an info banner with "Still loading…" and keep waiting.
5. Skeleton does not block non-affected UI (e.g. top nav remains interactive).

**A11y requirements:**
- Skeleton regions use `aria-busy="true"` on their container.
- Screen readers should announce "Loading" once, not once per skeleton row.

**i18n keys:**
| Key                                   | Example        |
|---------------------------------------|----------------|
| `admin.common.loading.ariaLabel`      | "Loading…"     |
| `admin.common.loading.slow`           | "Still loading — check your connection." |

**Acceptance criteria:**
1. **Given** a table load **when** the fetch takes 300ms **then** a `DataTableSkeleton` with the correct column count renders, replaced by real rows when data arrives.
2. **Given** a fast load (< 100ms) **when** the fetch resolves **then** the skeleton does not flash (minimum display time enforced).
3. **Given** a slow load (> 5s) **when** the user is still waiting **then** an info banner "Still loading…" appears and the skeleton stays.

**Related:** P-01.

---

## P-09 — Breadcrumb + page header

**Purpose:** Tell the user where they are in admin and what this page is.

**When to use:** Every admin page.

**Anatomy:**
`Breadcrumb` row with 3–4 items (Home → Admin → Bucket → Page), then
`<h1>` page title, optional subtitle paragraph, optional trailing action row.

**Behavior rules:**
1. Breadcrumbs MUST reflect IA v2.3 buckets, not legacy sidenav groupings. The bucket link routes to the bucket landing page.
2. Home always routes to the app landing, not admin landing.
3. Current page's breadcrumb item is non-interactive (Carbon `isCurrentPage`).
4. Page H1 is the same string as the browser tab title (for orientation).
5. Optional subtitle is one sentence, ≤ 120 chars.
6. If the page has no list and only one action (e.g. Site Branding), the action can live in the header's trailing slot.

**A11y requirements:**
- `Breadcrumb` has `aria-label="Breadcrumb"`.
- Current page item uses `aria-current="page"`.
- Page H1 is unique on the page (no duplicates).

**i18n keys:**
| Key                                | Example                          |
|------------------------------------|----------------------------------|
| `nav.admin.root`                   | "Admin"                          |
| `nav.admin.[bucketId]`             | "Lab Setup" / "People & Access"  |
| `admin.[page].title`               | Page H1                          |
| `admin.[page].subtitle`            | Optional subtitle                |

**Acceptance criteria:**
1. **Given** the Calendar Management page **when** the user navigates to it **then** the breadcrumb reads `Home / Admin / Lab Setup / Calendar Management` and the H1 is "Calendar Management".
2. **Given** the breadcrumb **when** the user clicks "Lab Setup" **then** they navigate to the Lab Setup bucket landing page.
3. **Given** a page H1 **when** the user inspects the DOM **then** it is the only `<h1>` in the page.

**Related:** P-01.

---

## P-10 — Pagination

**Purpose:** Navigate large lists without infinite scrolling.

**When to use:** Every `DataTable` whose result set can exceed the initial
page size.

**Anatomy:** Carbon `Pagination` at the bottom of `TableContainer`.

**Behavior rules:**
1. Page size options: 10 / 25 / 50 / 100. Default 25.
2. Selected page size persists in local storage keyed by page ID.
3. Total count is displayed ("1–25 of 142"). Server returns the total count.
4. Page jump is keyboard-accessible — typing a page number focuses the input and pressing Enter navigates.
5. Changing page size preserves the first visible record in view where possible.
6. Pagination does NOT render if the total fits in the smallest page size (≤ 10 rows).

**A11y requirements:**
- `Pagination` is inside a `<nav aria-label="Pagination">` wrapper.
- Next / Previous buttons have explicit `aria-label` text.

**i18n keys:** all supplied by Carbon's locale; override via the `Pagination`
props if translation is needed beyond Carbon defaults.

**Acceptance criteria:**
1. **Given** a table with 142 rows and page size 25 **when** the user reads the pagination **then** it shows "1–25 of 142".
2. **Given** a user who sets page size to 100 on Provider Management **when** they return to the same page tomorrow **then** page size is still 100.
3. **Given** a table with 7 rows **when** the page renders **then** the Pagination component is not shown.

**Related:** P-01.

---

## P-11 — Bulk row actions

**Purpose:** Act on multiple selected rows in one operation — deactivate,
archive, export, delete.

**When to use:**
- Pages where a user would otherwise repeat the same action on many rows.
- Decided per-page in Phase 5; not every list needs bulk.

**When NOT to use:**
- Lists where each record needs per-row consideration (no sensible bulk action).

**Anatomy:**
Carbon `TableBatchActions` appears above the table when ≥ 1 row is selected.
Row checkboxes in leftmost column; header checkbox toggles all **visible** rows
(not all 142 rows).

**Behavior rules:**
1. Header checkbox selects only visible rows (current page). A banner line ("Select all 142 records across pages?") appears if the page-1 selection is "all".
2. Selection persists across sort and filter changes — the user's intent is preserved.
3. Batch-action bar shows selection count + primary action(s) + "Clear selection".
4. Actions that don't apply to every selected record auto-disable with a tooltip ("Can't archive: 2 selected records are already archived").
5. Destructive bulk actions route through P-04 with count + first-N names.
6. Available actions are permission-filtered (P-13).

**A11y requirements:**
- Selection announces count changes via `aria-live="polite"`.
- Batch-action bar is a single focusable region with explicit button labels.

**i18n keys:**
| Key                                              | Example                                     |
|--------------------------------------------------|---------------------------------------------|
| `admin.common.bulk.selectedCount`                | "[N] selected"                              |
| `admin.common.bulk.selectAllPages`               | "Select all [N] across pages"               |
| `admin.common.bulk.clear`                        | "Clear selection"                           |
| `admin.[page].bulk.[actionId]`                   | e.g. "admin.users.bulk.deactivate"          |

**Acceptance criteria:**
1. **Given** a table with 3 selected rows **when** the user views the toolbar **then** the batch-action bar shows "3 selected" with available actions.
2. **Given** 3 selected rows where 1 is already archived **when** the user views the Archive action **then** the button is disabled with an explanatory tooltip.
3. **Given** a batch delete of 3 rows **when** the user clicks Delete **then** the confirm modal (P-04) lists the count and first 3 record names.
4. **Given** the user re-sorts a column **when** they do so **then** the existing selection is preserved.

**Related:** P-01, P-04, P-13.

---

## P-12 — Import / export flow

**Purpose:** Import many records from CSV/XLSX safely — with preview, column
mapping, and dry-run. Highest-impact modernization in the audit.

**When to use:** Pages that need CSV/XLSX bulk load — Test Catalog, Dictionary,
Users, Providers, Organizations.

**Anatomy:** A 4-step wizard inside a `Modal` size `lg` or a full-page route
(designer decides per page). Steps:

1. **Upload** — Carbon `FileUploader` (drag-drop + click). Client-side checks: file type, size, row count, header row detection. Template-download link always visible.
2. **Map** — detected column names on the left, target fields on the right, with dropdowns to remap. Auto-suggest by name similarity.
3. **Preview (dry-run)** — first 20 rows rendered exactly as they would be imported. Per-row status: ✅ OK / ⚠️ Warning / ❌ Error with detail on hover. Summary: "243 OK, 4 errors, 3 warnings".
4. **Confirm** — explicit "Import N rows, skip M" button. Server commits in one transaction. Success shows results + "Download error log" for skipped rows.

**Behavior rules:**
1. Template download is always visible in steps 1 and 2, never "hidden in a help modal".
2. Import is atomic — either all valid rows commit or none (server-enforced).
3. Invalid rows are skipped with reasons returned; never block the import silently.
4. The mapping step persists the user's mapping for the next import on the same page (remembered by page ID).
5. Export uses the same column order as the active table view — what you see is what you export.
6. Large files (> 5 MB or > 10k rows) route to a background job with an in-app notification on completion.

**A11y requirements:**
- Step progress is a `<nav>` with `aria-current="step"` on the active step.
- Preview table is a proper `DataTable` with row statuses announced.
- FileUploader has keyboard parity with drag-drop (the standard Carbon behavior).

**i18n keys:**
| Key                                                | Example                              |
|----------------------------------------------------|--------------------------------------|
| `admin.[page].import.step.upload`                  | "Upload file"                        |
| `admin.[page].import.step.map`                     | "Map columns"                        |
| `admin.[page].import.step.preview`                 | "Preview"                            |
| `admin.[page].import.step.confirm`                 | "Confirm"                            |
| `admin.common.import.templateDownload`             | "Download template"                  |
| `admin.common.import.summary.ok`                   | "[N] OK"                             |
| `admin.common.import.summary.error`                | "[N] errors"                         |
| `admin.common.import.confirmButton`                | "Import [N], skip [M]"               |

**Acceptance criteria:**
1. **Given** a valid 50-row CSV **when** the user uploads **then** the mapping step shows detected columns next to target fields with auto-suggested mappings.
2. **Given** a CSV with 4 invalid rows **when** the user reaches Preview **then** the 4 rows are marked with ❌ and their error detail is visible on hover or expand.
3. **Given** the user confirms **when** the server commits **then** the valid rows are imported in one transaction, and a "Download error log" link is offered for skipped rows.
4. **Given** a 10k-row file **when** the user uploads **then** the import is routed to a background job and an in-app notification fires on completion.
5. **Given** an export trigger **when** the user exports **then** the CSV columns match the current table view's column order and visibility.

**Related:** P-01, P-05, P-07.

---

## P-13 — Permission gate wrapper

**Purpose:** Hide or disable UI the user cannot act on. Matches the binary
permission model ratified in IA v2.3.

**Scopes:** Exactly two — `ADMIN_MENU` and `TEST_CATALOG_MANAGE`. No new scopes.

**Anatomy:** A React component `<Permission>` that wraps any UI element.

**Props API:**
```ts
interface PermissionProps {
  scope: "ADMIN_MENU" | "TEST_CATALOG_MANAGE";
  mode?: "hide" | "disable";  // default: "hide"
  fallback?: ReactNode;       // optional replacement when hidden
  children: ReactNode;
}
```

**Behavior rules:**
1. Default mode is **hide**: the user shouldn't see what they can't act on.
2. **disable** is used only when the UI must remain visible for context (e.g. showing a disabled "Delete" button with a tooltip explaining the requirement).
3. `Permission` reads from a single `useCurrentUserPermissions()` hook — do not re-query per component.
4. Server-side enforcement is the source of truth. This wrapper is a UX layer; the server still must reject unauthorized mutations.
5. Route-level gating is separate — routes outside `ADMIN_MENU` return 403 at the router level, not via this wrapper.

**A11y requirements:**
- When `mode="disable"`, the wrapped element's `disabled` attribute is set and an `aria-describedby` points at an explanation.
- When `mode="hide"`, there is no DOM artifact — no empty div, no `display:none` with aria-hidden remnants.

**i18n keys:**
| Key                                           | Example                                      |
|-----------------------------------------------|----------------------------------------------|
| `admin.common.permission.disabledReason.adminMenu` | "Requires admin menu access"           |
| `admin.common.permission.disabledReason.testCatalog` | "Requires Test Catalog Management"  |

**Acceptance criteria:**
1. **Given** a user without `ADMIN_MENU` **when** the admin landing renders **then** no bucket tile is rendered (route-level gate, not this wrapper).
2. **Given** a user with `ADMIN_MENU` but not `TEST_CATALOG_MANAGE` **when** they view the admin landing **then** all buckets except Test Catalog are visible; Test Catalog is hidden.
3. **Given** a `<Permission scope="TEST_CATALOG_MANAGE" mode="disable">Edit</Permission>` **when** rendered for a non-permitted user **then** the Edit button is in the DOM but disabled with an explanatory tooltip.

**Related:** all patterns that include write actions.

---

## Cross-reference — which patterns each Phase 5 page needs

This is a planning hint, not a contract. Phase 5 page designs will confirm
actual usage.

| Page                       | Patterns used                                          |
|----------------------------|--------------------------------------------------------|
| Provider Management        | P-01, P-02, P-03, P-04, P-05, P-06, P-07, P-08, P-09, P-10, P-11, P-12, P-13 |
| User Management            | P-01, P-02, P-03, P-04, P-05, P-06, P-07, P-08, P-09, P-10, P-11, P-12, P-13 |
| Test Management            | P-01, P-02, P-03, P-04, P-05, P-06, P-07, P-08, P-09, P-10, P-11, P-12, P-13 |
| Dictionary Menu            | P-01, P-02, P-03, P-04, P-05, P-06, P-07, P-08, P-09, P-10, P-12, P-13       |
| Organization Management    | P-01, P-02, P-03, P-04, P-05, P-06, P-07, P-08, P-09, P-10, P-11, P-12, P-13 |
| Calendar Management        | P-05, P-06, P-07, P-08, P-09, P-13 (grid is page-specific) |
| Lab Identity (single-rec)  | P-05, P-07, P-08, P-09, P-13                           |
| Site Branding (single-rec) | P-05, P-07, P-08, P-09, P-13                           |
| Barcode Configuration      | P-01, P-02, P-05, P-07, P-08, P-09, P-13               |
| Lab Number Management      | P-01, P-02, P-05, P-07, P-08, P-09, P-13               |

---

## Governance

- **Source of truth:** this document. Any discrepancy between a page design and this library is resolved by updating the page design or proposing an amendment here.
- **Amendment process:** open a new section in `admin-patterns-audit.md` with the proposed pattern, run it past Casey, and only then add it here.
- **Deprecation:** patterns removed from this library must be absent from all Phase 5 designs.
- **Versioning:** this document is v1.0. Breaking changes → v2.0, additive → v1.x.

---

## Next

Phase 4 deliverables:
- `admin-pattern-library.md` — this document ✅
- `admin-pattern-library-preview.html` — Carbon reference gallery with 13 live demos and copy-paste snippets

On approval of both, Phase 4 is complete and Phase 5 page-by-page design
begins against this locked baseline.
