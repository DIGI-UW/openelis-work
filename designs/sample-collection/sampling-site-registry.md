# S-02: Sampling Site Registry
## Functional Requirements Specification

**Version:** 1.0
**Status:** Ready for Implementation
**Date:** 2026-04-02
**Module:** Sample Collection (Environmental LIMS)
**Related FRS:** S-01 (Compliance Standards), Sample Collection FRS (ORD-2, ORD-3, ORD-11, XC-2, CFG-1)
**Jira:** [OGC-531](https://uwdigi.atlassian.net/browse/OGC-531) (under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))

---

## 1. Header & Document Information

### 1.1 Document Purpose
This FRS specifies the complete functional requirements for S-02: Sampling Site Registry, an environmental LIMS feature that enables laboratory administrators to register, maintain, and reuse sampling site records across multiple laboratory orders. The Sampling Site Registry is the environmental analog to the Patient Registry (S-01), allowing environmental and vector control laboratories to manage locations where environmental samples are collected.

### 1.2 Audience
- Product Managers (OpenELIS Global)
- Frontend & Backend Developers
- QA/Testing Engineers
- Laboratory Administrators (end-users)
- System Implementers

### 1.3 Related Modules & Standards
- **S-01 FRS:** Compliance Standards Registry — Standards linked to orders, not sites
- **Sample Collection FRS:** ORD-2 (Environmental Workflow), ORD-3 (Workflow Toggle), ORD-11 (Inline Create Pattern), XC-2 (Unified Search Pattern), CFG-1 (Lab Unit Configuration)
- **Organizations Management:** Location hierarchy (Region/District/Town-Village)
- **Compliance Standards:** Sites do not auto-link; standards selected at order entry time only

---

## 2. Problem Statement

### 2.1 Current Challenges
Environmental and vector control laboratories require flexible, repeatable tracking of sampling locations across multiple test orders. Currently, there is no standardized method to:
- Register and maintain reusable sampling site records
- Classify sites by type (water source, air monitoring, vector trap, soil/sediment, other)
- Track spatial information (GPS, elevation, regional hierarchy)
- Search and retrieve sites quickly during order entry
- Import/export site data for bulk management and backup
- Link site metadata (contact info, environmental zone, last collection date) to operational workflows

### 2.2 Impact
Without a Sampling Site Registry:
- Laboratory staff must manually re-enter location information for each order, increasing data entry errors
- No standardized site classification, making data analysis and compliance reporting difficult
- Spatial and geographic context is lost or inconsistent across orders
- Bulk site updates or migrations require manual effort
- Environmental risk assessment and site monitoring history cannot be easily retrieved

### 2.3 Opportunity
A centralized, searchable Sampling Site Registry will:
- Accelerate order entry by allowing quick site selection (matching Patient Registry patterns)
- Ensure consistent site naming and classification
- Enable geographic and environmental analysis across orders
- Support regulatory compliance and audit trails
- Facilitate data sharing and bulk operations via import/export

---

## 3. Goals

### 3.1 Primary Goals
1. **Enable fast, consistent site selection during order entry** — Users can search existing sites or create new ones inline, following the same pattern as patient search/create (XC-2, ORD-11).
2. **Provide centralized site management** — Administrators have a dedicated registry page to CRUD, filter, and manage all sampling sites.
3. **Support rich site metadata** — Sites store type, location hierarchy, GPS, contact info, and operational metrics (last collection, total collections).
4. **Enable bulk operations** — CSV import/export for site migration, backup, and bulk updates.
5. **Ensure role-based access control** — Permission keys for view, create, edit, deactivate, import, export.
6. **Maintain operational awareness** — Track last collection date and total collections per site.

### 3.2 Secondary Goals
1. Support environmental zone classification for risk assessment
2. Integrate with the existing location hierarchy (Region/District/Town-Village) — **must reuse the same geographic unit configuration and data source as Patient Entry** (see Implementation Note below)
3. Enable site deactivation without deletion (soft delete pattern)
4. Provide read-only site history (creation, last modified dates)
5. Support flexible site type taxonomy with free-text subtypes

---

## 4. Non-Goals

### 4.1 Out of Scope
1. **Automatic compliance standard mapping** — Sites do not auto-link to standards; compliance standards are selected manually at order entry (per S-01 FR-4-001).
2. **GPS validation or mapping integration** — Latitude/longitude are stored but not validated against external map services. No embedded maps in this release.
3. **Site visit or sample chain-of-custody tracking** — This feature tracks only the site record; sample collection logistics are handled by the Sample Collection FRS (ORD-2).
4. **Environmental monitoring alerts or thresholds** — Sites store metadata only; monitoring logic is out of scope.
5. **Advanced spatial analysis (e.g., radius search, geohashing)** — Search is text-based only; geographic filters are basic (Region/District).
6. **Site photo/media attachment** — Attachments are not supported in this release.
7. **Historical site modification audit log** — Only creation and last modified timestamps are stored.

---

## 5. Functional Requirements

### 5.1 Site Registry List (Admin-Facing CRUD Page)

#### FR-5.1.1: Registry Page Navigation & Layout
**ID:** FR-5.1.1
**Priority:** P0
**Requirement:**
The Sampling Site Registry list shall be accessible via the main navigation menu at `Sample Collection → Site Registry`. The page shall follow the sidebar + DataTable layout pattern established by the Organizations Management module, consisting of:
- **Left Sidebar (200px fixed):** Collapsible filter and hierarchy section with Region dropdown, District typeahead (ComboBox), Town-Village typeahead (ComboBox); checkbox filters for Site Type and Active status; collapse/expand toggle
- **Main Content Area:** Searchable DataTable with site records, action buttons, and pagination
- **Top Toolbar:** Title, Search box, "New Site" button, "Import" button, "Export" button

**Acceptance Criteria:**
- [ ] Page loads with sidebar collapsed by default on mobile (<768px), expanded on desktop
- [ ] Sidebar can be toggled open/closed without page reload
- [ ] Main content reflows correctly when sidebar is toggled
- [ ] All filter state is preserved when toggling sidebar (no filter reset)
- [ ] Breadcrumb navigation shows: "Sample Collection > Site Registry"

---

#### FR-5.1.2: DataTable Display & Columns
**ID:** FR-5.1.2
**Priority:** P0
**Requirement:**
The main DataTable shall display sampling sites with the following columns (in order):
1. **Code** (String, left-aligned) — Site code, e.g., "WS-001", "AT-003"
2. **Name** (String, left-aligned) — Display name, truncated to 50 chars with ellipsis on overflow
3. **Type** (Enum, center-aligned) — Site type with i18n key `openELIS.site.type.{WATER_SOURCE|AIR_MONITORING|VECTOR_TRAP|SOIL_SEDIMENT|OTHER}`
4. **Subtype** (String, left-aligned) — Free-text subtype or "—" if empty
5. **Location** (String, left-aligned) — Concatenated "Region / District / Town-Village" or "—" if not set
6. **Active** (Boolean, center-aligned) — Badge green/red for Active/Inactive
7. **Last Collection** (DateTime, right-aligned) — Date in format "YYYY-MM-DD" or "Never" if null
8. **Total Collections** (Integer, center-aligned) — Count of linked orders
9. **Actions** (Fixed, right-aligned) — Buttons for View, Edit, Deactivate/Reactivate, Delete (with modal confirmation)

**Acceptance Criteria:**
- [ ] DataTable renders all 9 columns with correct alignment
- [ ] Code column is sortable (A-Z, Z-A)
- [ ] Name column is sortable alphabetically
- [ ] Type column shows i18n-translated labels
- [ ] Active badge displays correct color (green for Active, red for Inactive)
- [ ] Last Collection date shows "Never" for null values
- [ ] Total Collections shows "0" if no linked orders
- [ ] Actions buttons are disabled for rows without `site.registry.edit` permission
- [ ] Delete button shows confirmation modal with site code and name
- [ ] Rows are clickable (except in action column) to open site detail view

---

#### FR-5.1.3: Search & Filter Functionality
**ID:** FR-5.1.3
**Priority:** P0
**Requirement:**
The registry list shall support multiple search and filter mechanisms:
- **Text Search Box** (top toolbar) — Searches across Site Code, Name, and Subtype fields in real-time; debounced at 300ms
- **Sidebar Filters:**
  - **Region Dropdown** — Multi-select, populated from location hierarchy; filter by parent region
  - **District Typeahead (ComboBox)** — Typeahead search input populated by selected Region; user types to filter matching districts; cascading from Region selection
  - **Town-Village Typeahead (ComboBox)** — Typeahead search input populated by selected District; cascading from District selection
  - **Site Type Checkboxes** — Multi-select checkboxes for WATER_SOURCE, AIR_MONITORING, VECTOR_TRAP, SOIL_SEDIMENT, OTHER
  - **Active Status Checkbox** — Filter by isActive=true (checked) or isActive=false (unchecked) or both (both checked)
- **Search & Filter Logic** — All filters are AND-combined with text search (e.g., "code=WS* AND region=DKI AND siteType=WATER_SOURCE")
- **Reset Button** — Clear all filters and search box; restore view to all active sites

**Acceptance Criteria:**
- [ ] Text search is case-insensitive and debounced at 300ms
- [ ] Search results update without full page reload
- [ ] Region dropdown shows all available regions from location hierarchy
- [ ] District typeahead is empty until Region is selected; then filters matching districts as user types
- [ ] Town-Village typeahead is empty until District is selected; filters as user types
- [ ] Site Type checkboxes display i18n-translated labels
- [ ] Active Status filter shows three states: Active Only, Inactive Only, All (both checked)
- [ ] Filters are applied immediately (no Apply button required)
- [ ] Reset button clears all filters and displays all active sites
- [ ] URL query params reflect active filters (for bookmarking)
- [ ] Sidebar filters are sticky across page navigation (stored in session)

---

#### FR-5.1.4: Pagination & Sorting
**ID:** FR-5.1.4
**Priority:** P0
**Requirement:**
The DataTable shall support server-side pagination and sorting:
- **Page Size Options** — 10, 25, 50, 100 items per page (default 25)
- **Pagination Controls** — Previous/Next buttons, current page indicator (e.g., "Page 1 of 45"), jump-to-page input
- **Default Sorting** — Sort by Site Code ascending (A-Z)
- **Multi-Column Sort** — Shift+Click to add secondary sort (e.g., Code ASC, Name ASC)
- **Persistent Sorting** — Sort state preserved in URL query params and across page navigation

**Acceptance Criteria:**
- [ ] Page size selector shows 10, 25, 50, 100 options
- [ ] Default page size is 25 items
- [ ] Previous button is disabled on page 1
- [ ] Next button is disabled on last page
- [ ] Current page indicator shows correct page and total pages
- [ ] Jump-to-page input accepts numeric input; invalid input shows error tooltip
- [ ] Column headers are clickable to sort (single click = ASC, double click = DESC)
- [ ] Sort indicator (arrow icon) shows direction on sorted column
- [ ] Shift+Click adds secondary sort; UI shows sort order (1, 2, 3...)
- [ ] Sorting works server-side; large datasets load quickly without UI lag

---

### 5.2 Site Detail / Edit

#### FR-5.2.1: Inline Row Expansion (Detail View)
**ID:** FR-5.2.1
**Priority:** P0
**Requirement:**
Clicking anywhere on a site row in the DataTable SHALL expand an inline detail panel below that row (accordion-style — only one row expanded at a time; clicking another row collapses the previous). The expanded panel shows all site fields in a two-column layout:

- **Left Column (60%):**
  - Site Code + Name (heading)
  - Type (colored Tag) + Subtype
  - Location: Region > District > Town-Village
  - Address
  - Description (read-only text block)
  - Environmental Zone
  - Contact Person + Phone
- **Right Column (40%):**
  - GPS: Latitude, Longitude, Elevation (monospace, read-only)
  - Map placeholder (gray box with coordinates pin)
  - Collection History: Last Collection Date, Total Collections, "View Orders" link
  - FHIR Sync: Resource ID, Last Sync, Status badge, Server
  - Source badge: LOCAL or HUB (with locked icon for HUB)
  - Timestamps: Created, Last Modified

- **Action Bar (bottom of expanded panel):**
  - **LOCAL sites:** [Edit] [Deactivate/Reactivate] buttons
  - **HUB sites:** [Create Local Copy] button (see FR-5.2.4), no Edit button (read-only). Tooltip: "This site is managed by the FHIR server. Create a local copy to make changes."
  - [Close] button to collapse the panel

**Acceptance Criteria:**
- [ ] Clicking a row expands inline detail panel below the row (no page navigation)
- [ ] Only one row can be expanded at a time (accordion behavior)
- [ ] Clicking an already-expanded row collapses it
- [ ] Detail panel renders all fields with correct labels (i18n keys `openELIS.site.*`)
- [ ] Read-only fields are displayed as text (no input controls)
- [ ] Geographic fields (Lat/Long/Elevation) show "—" if null
- [ ] Contact fields show "—" if null or empty
- [ ] Last Collection Date shows "Never" if null
- [ ] Total Collections shows "0" if null
- [ ] Active badge displays green for Active, gray for Inactive
- [ ] HUB sites show locked icon and "Managed by FHIR server" label; Edit button is absent
- [ ] LOCAL sites show Edit button (if `site.registry.edit` permission)
- [ ] Deactivate/Reactivate button visible for LOCAL sites (if `site.registry.deactivate` permission)
- [ ] HUB sites show [Create Local Copy] button instead of Edit
- [ ] Expand/collapse transitions are smooth (200ms)

---

#### FR-5.2.2: Edit Site Details (Inline)
**ID:** FR-5.2.2
**Priority:** P0
**Requirement:**
Clicking the [Edit] button on an expanded LOCAL site row SHALL transform the detail panel into an inline edit form (in-place, not a separate page or modal). The following fields become editable:
- **Code** (String, required, regex: `^[A-Z0-9][A-Z0-9\-]{0,19}$`) — Unique site code; validated on blur and submit
- **Name** (String, required, max 255 chars) — Display name
- **Type** (Enum, required) — Dropdown with WATER_SOURCE, AIR_MONITORING, VECTOR_TRAP, SOIL_SEDIMENT, OTHER
- **Subtype** (String, optional, max 100 chars) — Free-text subtype (Well, River, etc.)
- **Region** (Dropdown, optional) — Parent region from location hierarchy
- **District** (Typeahead/ComboBox, optional, cascading from Region) — Parent district; user types to filter matching districts from the location hierarchy
- **Town-Village** (Typeahead/ComboBox, optional, cascading from District) — Town or village name; user types to filter
- **Address** (String, optional, max 255 chars) — Street address or description
- **Latitude** (Decimal, optional, range -90 to 90) — GPS latitude; validated on blur
- **Longitude** (Decimal, optional, range -180 to 180) — GPS longitude; validated on blur
- **Elevation** (Decimal, optional) — Elevation in meters; no range validation
- **Description** (TextArea, optional, max 1000 chars) — Free-text site description
- **Environmental Zone** (Dropdown, optional) — Urban, Suburban, Rural, Industrial, Agricultural, Protected
- **Contact Person** (String, optional, max 100 chars)
- **Contact Phone** (String, optional, max 20 chars; regex: `^[\+\d\s\(\)\-]{0,20}$`) — Phone number with optional +, spaces, parentheses, hyphens
- **isActive** (Checkbox, optional) — Activate/deactivate site without deletion

**Validation Rules:**
- Code must be unique across all sites (checked server-side; inline check may show "Code already exists")
- Code is case-sensitive
- Latitude/Longitude must be valid decimal numbers within ranges
- Phone number format is optional but must match regex if provided
- At least Code and Name are required
- Empty optional fields are allowed

**Acceptance Criteria:**
- [ ] Edit form renders all editable fields with correct i18n labels
- [ ] Code field shows validation error "Code already exists" if duplicate (debounced check)
- [ ] Code field shows validation error "Invalid format" if regex fails
- [ ] Name field is required; empty submission shows "This field is required"
- [ ] Type dropdown shows i18n-translated options
- [ ] Region dropdown populates from location hierarchy
- [ ] District typeahead is empty until Region is selected; then filters as user types (min 1 character)
- [ ] Town-Village typeahead cascades from District; filters as user types
- [ ] Latitude field validates range -90 to 90; out-of-range shows error "Must be between -90 and 90"
- [ ] Longitude field validates range -180 to 180; out-of-range shows error "Must be between -180 and 180"
- [ ] Phone field validates regex on blur; invalid format shows "Invalid phone number"
- [ ] Form has "Save" and "Cancel" buttons
- [ ] Save button is disabled while form is submitting or has validation errors
- [ ] Cancel button returns to detail view without saving
- [ ] On successful save, detail view is displayed with success toast "Site updated successfully"
- [ ] lastModified timestamp is updated on save
- [ ] Edit form is not accessible without `site.registry.edit` permission (404 or redirect)

---

#### FR-5.2.3: Deactivate/Reactivate Site
**ID:** FR-5.2.3
**Priority:** P1
**Requirement:**
Users with `site.registry.deactivate` permission shall be able to deactivate and reactivate sites without deletion. Deactivation is a soft delete (row remains in database with isActive=false). Deactivated sites are excluded from default searches and dropdowns in order entry.

**Deactivation Behavior:**
- Clicking "Deactivate" shows confirmation modal: "Deactivate site [Code]? This site will no longer appear in searches. X orders are linked to this site."
- User must confirm to proceed
- On confirmation, isActive is set to false; site disappears from default registry view
- Toast message: "Site deactivated successfully"

**Reactivation Behavior:**
- Deactivated sites are visible in the registry list only if the "Inactive Only" filter is selected
- Clicking "Reactivate" on an inactive site (visible via filter) sets isActive=true
- No confirmation modal required for reactivation
- Toast message: "Site reactivated successfully"

**Acceptance Criteria:**
- [ ] Deactivate button appears on detail view if user has `site.registry.deactivate` permission
- [ ] Deactivate modal shows site code, name, and count of linked orders
- [ ] Deactivate modal shows Cancel and Confirm buttons
- [ ] Confirm button triggers backend update (isActive=false)
- [ ] After deactivation, site is hidden from registry list (unless "Inactive Only" filter applied)
- [ ] Reactivate button appears on inactive site detail view
- [ ] Reactivate is immediate (no confirmation modal)
- [ ] After reactivation, site is visible in default registry view
- [ ] Deactivated sites are excluded from dropdown searches in order entry (ORD-2 environment workflow)
- [ ] isActive status is reflected in registry list (Active/Inactive badge)

---

#### FR-5.2.4: Fork-on-Edit for HUB Sites (Create Local Copy)
**ID:** FR-5.2.4
**Priority:** P0
**Requirement:**
HUB-sourced sites (synced from the consolidated FHIR server) are **read-only** in the local instance. If a user needs to modify a HUB site, they must create a local copy. This "fork-on-edit" pattern prevents local changes from being silently overwritten on the next FHIR sync.

**Trigger:** Clicking [Create Local Copy] on an expanded HUB site row.

**Workflow:**
1. System displays an inline confirmation panel (not a modal) within the expanded row:
   - Header: "Create Local Copy of [Site Code]?"
   - Explanation text: "This will create a new LOCAL site with a copy of all data from this HUB site. The HUB original will be deactivated so it no longer appears in searches. Your local copy can be freely edited."
   - New Code field: pre-filled with `{original-code}-LOCAL` (editable — user can change)
   - Checkbox (checked by default): "Deactivate the HUB original ([original-code])"
   - Buttons: [Cancel] [Create Local Copy]
2. On confirmation:
   - A new site record is created with `source=LOCAL`, copying all field values from the HUB site
   - The new site gets the user-specified code (default: `{original-code}-LOCAL`)
   - If the checkbox is checked, the HUB original is set to `isActive=false`
   - The new LOCAL copy is set to `isActive=true`
   - The expanded row switches to show the new LOCAL site in edit mode
   - Toast: "Local copy created. You can now edit this site."
3. The HUB original remains in the database (deactivated) for audit trail and FHIR sync continuity
4. Future FHIR syncs will NOT reactivate the deactivated HUB site (deactivation is a local override)

**Acceptance Criteria:**
- [ ] [Create Local Copy] button appears on HUB site expanded detail (not on LOCAL sites)
- [ ] Clicking [Create Local Copy] shows inline confirmation panel (not a modal)
- [ ] Confirmation panel pre-fills new code as `{code}-LOCAL`
- [ ] New code field is editable and validates uniqueness
- [ ] "Deactivate HUB original" checkbox is checked by default
- [ ] On confirm: new LOCAL site created with all fields copied
- [ ] On confirm with checkbox checked: HUB original set to isActive=false
- [ ] New LOCAL site opens in inline edit mode immediately
- [ ] Toast message confirms the action
- [ ] HUB original remains in database for audit (visible via Inactive filter)
- [ ] Deactivated HUB sites are NOT reactivated by subsequent FHIR syncs
- [ ] The FHIR sync system respects local deactivation overrides (stores a `locallyDeactivated=true` flag)
- [ ] Orders previously linked to the HUB site continue to reference the original HUB record (no data loss)
- [ ] Creating a local copy requires `site.registry.create` AND `site.registry.deactivate` permissions

---

### 5.3 Inline Site Search & Create in Order Entry

#### FR-5.3.1: Environmental Workflow Site Search
**ID:** FR-5.3.1
**Priority:** P0
**Requirement:**
When entering an order with workflow type set to "Environmental" (ORD-3), Step 1 (ORD-2: Enter Order) shall display a **Site Search** section replacing the Patient Search section. This section follows the same search interaction pattern as XC-2 (Unified Search Pattern):

**Layout:**
- Section title: "Select Sampling Site" (i18n key: `openELIS.order.selectSamplingSite`)
- Search input field with placeholder "Search by site code or name..."
- Search button (or auto-search on Enter/blur)
- Results table (if search performed) or empty state
- "New Site" button below search controls (secondary action)

**Search Behavior:**
- Text search input accepts partial matches on Code and Name (case-insensitive)
- Search button triggers backend search (no auto-search on keystroke; manual trigger or auto-trigger on blur with 300ms debounce)
- Results table shows columns: Code, Name, Type, Location (Region/District), Last Collection
- Results are filtered to isActive=true only (deactivated sites excluded)
- Maximum 50 results displayed; if >50 matches, "Show more results" link or pagination
- Rows are selectable (radio button or click to select)
- "Select" button appears below results; clicking selects the site and displays read-only site card

**Selected Site Card:**
- Read-only display of selected site Code, Name, Type, and Location
- "Change Site" button to return to search (deselect and re-open search)
- Site selection is sticky across order entry steps (not cleared on navigation)

**Acceptance Criteria:**
- [ ] Site Search section appears when workflow type = Environmental
- [ ] Search input accepts text input
- [ ] Search button triggers backend search without full page reload
- [ ] Results table displays max 50 sites (with pagination or "show more" if >50)
- [ ] Results are filtered to isActive=true (no inactive/deactivated sites)
- [ ] Code and Name columns are sortable in results
- [ ] Results can be selected via radio button or row click
- [ ] "Select" button is disabled until a site is selected
- [ ] Selected site card displays Code, Name, Type, and Location
- [ ] Selected site card has "Change Site" button to re-open search
- [ ] Site selection persists across order entry steps (not cleared on step navigation)
- [ ] Empty search result shows "No sites found. Click 'New Site' to create one." message
- [ ] Site Search section is not displayed if workflow type != Environmental (hidden or removed)

---

#### FR-5.3.2: Inline Site Create in Order Entry
**ID:** FR-5.3.2
**Priority:** P0
**Requirement:**
When entering an order with workflow type = Environmental, users without a matching site can create a new site inline (not in a modal, matching ORD-11 pattern). Clicking "New Site" button opens an inline create form below the search controls.

**Inline Create Form:**
- Same editable fields as FR-5.2.2 (Edit Site Details), minus the isActive checkbox (new sites default to isActive=true)
- Form layout: 2-column or 1-column depending on screen size
- Fields displayed in this order:
  1. Code (required)
  2. Name (required)
  3. Type (required)
  4. Subtype (optional)
  5. Region (optional, cascading)
  6. District (Typeahead/ComboBox, optional, cascading from Region)
  7. Town-Village (optional)
  8. Address (optional)
  9. Latitude (optional)
  10. Longitude (optional)
  11. Elevation (optional)
  12. Environmental Zone (optional)
  13. Description (optional)
  14. Contact Person (optional)
  15. Contact Phone (optional)

**Form Validation:**
- Same validation rules as FR-5.2.2
- Code uniqueness checked server-side; inline validation shows "Code already exists"
- Submit button is disabled if Code or Name are empty, or if validation errors present

**Form Submission:**
- "Create & Select" button (primary) — Creates site and auto-selects it (same as manual selection in FR-5.3.1)
- "Cancel" button — Closes inline form and returns to search controls without creating site
- On successful creation, inline form closes, selected site card displays, toast message "Site created successfully"

**Acceptance Criteria:**
- [ ] "New Site" button is visible when workflow type = Environmental
- [ ] Clicking "New Site" opens inline form without modal overlay
- [ ] Inline form displays all 15 fields with correct i18n labels
- [ ] Code field shows duplicate validation "Code already exists"
- [ ] Name field is required
- [ ] Type field is required
- [ ] Region dropdown and District typeahead cascade correctly (District filters as user types)
- [ ] Latitude/Longitude/Elevation validate numeric ranges
- [ ] Phone field validates regex format
- [ ] "Create & Select" button is disabled until Code and Name are provided
- [ ] On successful creation, site is auto-selected and selected site card displays
- [ ] Toast message "Site created successfully" appears
- [ ] New site is created with isActive=true by default
- [ ] New site is immediately available for selection and in registry list
- [ ] Cancel button closes form without creating site; search controls remain visible

---

### 5.4 Import & Export

#### FR-5.4.1: CSV Import
**ID:** FR-5.4.1
**Priority:** P1
**Requirement:**
Users with `site.registry.import` permission can import sampling sites from a CSV file via the "Import" button in the registry toolbar. The import flow follows the same pattern as Organizations Management import.

**Import Flow:**
1. Click "Import" button → Opens file picker dialog
2. Select CSV file (max 10MB, .csv extension only)
3. Preview & Validation Screen:
   - Display uploaded file name and row count
   - Show first 10 rows in a preview table
   - Run backend validation on all rows (no row skipped):
     - Check required fields (Code, Name, Type)
     - Check Code uniqueness (flag duplicates within file and against existing database)
     - Check Type enum validity
     - Check regex patterns (Code, Phone)
     - Check decimal ranges (Latitude, Longitude)
   - Display validation report: "X rows valid, Y rows with errors"
   - For each error row, show row number, field name, error message (e.g., "Row 5: Code 'INVALID@' does not match pattern")
   - Show summary: "Ready to import X sites" or "Fix Y errors before importing"
4. Import Button (enabled if all rows valid):
   - Clicking triggers batch creation on backend
   - Shows progress toast: "Importing 50 sites..."
   - On completion, show success toast: "Imported 50 sites successfully" and refresh registry list
5. Cancel Button:
   - Closes import flow without importing anything

**CSV Template:**
Template download available on import dialog. Fields (in order):
```
code,name,type,subtype,regionCode,districtCode,townVillage,address,latitude,longitude,elevation,environmentalZone,description,contactPerson,contactPhone
```

**Field Mapping:**
- `code` → Site Code (required, unique, regex)
- `name` → Name (required, max 255)
- `type` → Site Type (required, enum: WATER_SOURCE, AIR_MONITORING, VECTOR_TRAP, SOIL_SEDIMENT, OTHER)
- `subtype` → Subtype (optional, max 100)
- `regionCode` → Region Code from location hierarchy (optional, must exist in DB)
- `districtCode` → District Code from location hierarchy (optional, must exist and be child of regionCode)
- `townVillage` → Town/Village (optional, max 100)
- `address` → Address (optional, max 255)
- `latitude` → Latitude (optional, decimal -90 to 90)
- `longitude` → Longitude (optional, decimal -180 to 180)
- `elevation` → Elevation (optional, decimal)
- `environmentalZone` → Zone (optional, enum: Urban, Suburban, Rural, Industrial, Agricultural, Protected)
- `description` → Description (optional, max 1000)
- `contactPerson` → Contact Name (optional, max 100)
- `contactPhone` → Contact Phone (optional, max 20, regex validated)

**Acceptance Criteria:**
- [ ] Import button is visible only to users with `site.registry.import` permission
- [ ] File picker accepts .csv files only
- [ ] File size limit enforced (max 10MB)
- [ ] Preview shows file name, row count, and first 10 rows
- [ ] Validation runs on all rows before import
- [ ] Code uniqueness validated against existing database
- [ ] Type enum validated; invalid type shows error
- [ ] Latitude/Longitude ranges validated; out-of-range shows error
- [ ] Phone regex validated if provided
- [ ] Error report shows row number and field error messages
- [ ] Import button disabled if any validation errors
- [ ] Import creates sites in batch (single transaction or rollback on error)
- [ ] On success, toast shows count of imported sites
- [ ] Registry list is refreshed after import
- [ ] Cancel closes import flow without importing

---

#### FR-5.4.2: CSV Export
**ID:** FR-5.4.2
**Priority:** P1
**Requirement:**
Users with `site.registry.export` permission can export sampling sites to CSV via the "Export" button in the registry toolbar. Export includes all sites matching current filters (if filters applied) or all sites (if no filters).

**Export Flow:**
1. Click "Export" button → Show export options dialog
2. Options:
   - "Export all sites" (radio button, default) — Export all sites in database
   - "Export filtered results" (radio button) — Export sites matching current filter/search
   - File format: CSV (default; no other formats in this release)
3. Click "Export" button in dialog → Backend generates CSV file
4. Browser downloads file: `sampling-sites-YYYYMMDD-HHMMSS.csv`

**CSV Output Format:**
- Header row with column names (same as template: code, name, type, subtype, regionCode, districtCode, townVillage, address, latitude, longitude, elevation, environmentalZone, description, contactPerson, contactPhone)
- Data rows: one site per row, all fields in order
- Encoding: UTF-8
- Line terminator: LF (Unix style)
- Empty fields: blank (no placeholder text)
- Date/DateTime fields: ISO 8601 format (YYYY-MM-DD HH:MM:SS) — not included in export, but could be added for future auditing

**Acceptance Criteria:**
- [ ] Export button is visible only to users with `site.registry.export` permission
- [ ] Export dialog shows "Export all" and "Export filtered" radio options
- [ ] "Export all" is default
- [ ] "Export filtered" exports only sites matching active filters/search
- [ ] CSV file is generated with correct column headers
- [ ] Data rows contain all site fields in correct order
- [ ] File name includes timestamp (YYYYMMDD-HHMMSS)
- [ ] File is UTF-8 encoded
- [ ] Empty fields are blank (not "null" or "—")
- [ ] File downloads to user's default download folder
- [ ] Large exports (>10k rows) complete without timeout

---

### 5.5 Permissions & Access Control

#### FR-5.5.1: Permission Keys
**ID:** FR-5.5.1
**Priority:** P0
**Requirement:**
The following permission keys shall be defined and enforced throughout the Sampling Site Registry:

| Permission Key | Description | Scope |
|---|---|---|
| `site.registry.view` | View sampling site registry list and site details | Registry list, detail view, site search in order entry |
| `site.registry.create` | Create new sampling sites | Inline create in order entry (FR-5.3.2), registry list (future: dedicated create form) |
| `site.registry.edit` | Edit existing site details (Code, Name, Type, Location, Contact, etc.) | Site detail view edit form (FR-5.2.2) |
| `site.registry.deactivate` | Deactivate and reactivate sites (soft delete pattern) | Site detail view deactivate/reactivate buttons (FR-5.2.3) |
| `site.registry.import` | Import sites from CSV | Registry toolbar Import button (FR-5.4.1) |
| `site.registry.export` | Export sites to CSV | Registry toolbar Export button (FR-5.4.2) |

**Permission Enforcement:**
- Permission checks occur server-side on all endpoints
- UI elements (buttons, forms) are hidden/disabled if user lacks permission
- Attempting to access edit/delete/import/export endpoints without permission returns HTTP 403 Forbidden
- View permission is required to access registry list and site detail (enforced at page/route level)

**Acceptance Criteria:**
- [ ] All 6 permission keys are defined in authorization system
- [ ] View permission hides registry page if user lacks `site.registry.view`
- [ ] Create button is hidden if user lacks `site.registry.create`
- [ ] Edit form is inaccessible (404 or redirect) if user lacks `site.registry.edit`
- [ ] Deactivate button is hidden if user lacks `site.registry.deactivate`
- [ ] Import button is hidden if user lacks `site.registry.import`
- [ ] Export button is hidden if user lacks `site.registry.export`
- [ ] API endpoints enforce permissions server-side (no client-side bypass)
- [ ] HTTP 403 Forbidden is returned for unauthorized API calls

---

#### FR-5.5.2: Default Role Assignments
**ID:** FR-5.5.2
**Priority:** P1
**Requirement:**
Default role assignments (to be configured by system administrator):
- **Lab Administrator Role** — All permissions (view, create, edit, deactivate, import, export)
- **Lab Technician Role** — view, create (inline in order entry only)
- **Lab Analyst Role** — view (read-only access to registry and site search)
- **Anonymous/Guest** — No permissions (registry page not accessible)

*Note: Actual role assignment logic is out of scope for this FRS; implemented via authorization module (S-01 or similar).*

**Acceptance Criteria:**
- [ ] Default roles are configurable by system administrator
- [ ] Lab Administrator has all 6 permissions by default
- [ ] Lab Technician has view and create by default
- [ ] Lab Analyst has view only by default
- [ ] Permissions can be overridden per user if needed (future enhancement)

---

### 5.6 Cross-Cutting Requirements

#### FR-5.6.1: Internationalization (i18n)
**ID:** FR-5.6.1
**Priority:** P0
**Requirement:**
All user-facing labels, buttons, messages, and enums in the Sampling Site Registry shall use i18n keys with the prefix `openELIS.site.*`. All text shall be translatable without code changes.

**i18n Key Structure:**
- `openELIS.site.registry.title` — "Sampling Site Registry"
- `openELIS.site.registry.description` — "Manage sampling sites for environmental orders"
- `openELIS.site.code` — "Site Code"
- `openELIS.site.name` — "Site Name"
- `openELIS.site.type` — "Site Type"
- `openELIS.site.type.WATER_SOURCE` — "Water Source"
- `openELIS.site.type.AIR_MONITORING` — "Air Monitoring"
- `openELIS.site.type.VECTOR_TRAP` — "Vector Trap"
- `openELIS.site.type.SOIL_SEDIMENT` — "Soil/Sediment"
- `openELIS.site.type.OTHER` — "Other"
- `openELIS.site.subtype` — "Subtype"
- `openELIS.site.region` — **Do not hardcode.** Must read from the same configured label used by Patient Entry for the top-level geographic unit (may be "Region", "Province", "State", etc. depending on deployment).
- `openELIS.site.district` — **Do not hardcode.** Must read from the same configured label used by Patient Entry for the second-level geographic unit (may be "District", "County", "Sub-county", etc.).
- `openELIS.site.townVillage` — **Do not hardcode.** Must read from the same configured label used by Patient Entry for the third-level geographic unit (may be "Town/Village", "Camp/Commune", etc.).
- `openELIS.site.address` — "Address"
- `openELIS.site.latitude` — "Latitude"
- `openELIS.site.longitude` — "Longitude"
- `openELIS.site.elevation` — "Elevation (m)"
- `openELIS.site.description` — "Description"
- `openELIS.site.environmentalZone` — "Environmental Zone"
- `openELIS.site.environmentalZone.URBAN` — "Urban"
- `openELIS.site.environmentalZone.SUBURBAN` — "Suburban"
- `openELIS.site.environmentalZone.RURAL` — "Rural"
- `openELIS.site.environmentalZone.INDUSTRIAL` — "Industrial"
- `openELIS.site.environmentalZone.AGRICULTURAL` — "Agricultural"
- `openELIS.site.environmentalZone.PROTECTED` — "Protected"
- `openELIS.site.contactPerson` — "Contact Person"
- `openELIS.site.contactPhone` — "Contact Phone"
- `openELIS.site.active` — "Active"
- `openELIS.site.inactive` — "Inactive"
- `openELIS.site.lastCollectionDate` — "Last Collection Date"
- `openELIS.site.totalCollections` — "Total Collections"
- `openELIS.site.source` — "Source"
- `openELIS.site.source.LOCAL` — "Local"
- `openELIS.site.source.HUB` — "Hub"
- `openELIS.site.actions` — "Actions"
- `openELIS.site.action.view` — "View"
- `openELIS.site.action.edit` — "Edit"
- `openELIS.site.action.deactivate` — "Deactivate"
- `openELIS.site.action.reactivate` — "Reactivate"
- `openELIS.site.action.delete` — "Delete"
- `openELIS.site.action.newSite` — "New Site"
- `openELIS.site.action.import` — "Import"
- `openELIS.site.action.export` — "Export"
- `openELIS.site.action.search` — "Search"
- `openELIS.site.action.select` — "Select"
- `openELIS.site.action.cancel` — "Cancel"
- `openELIS.site.action.save` — "Save"
- `openELIS.site.message.created` — "Site created successfully"
- `openELIS.site.message.updated` — "Site updated successfully"
- `openELIS.site.message.deactivated` — "Site deactivated successfully"
- `openELIS.site.message.reactivated` — "Site reactivated successfully"
- `openELIS.site.message.deleted` — "Site deleted successfully"
- `openELIS.site.message.imported` — "Imported {count} sites successfully"
- `openELIS.site.message.noResults` — "No sites found. Click 'New Site' to create one."
- `openELIS.site.validation.codeRequired` — "Site code is required"
- `openELIS.site.validation.codeInvalid` — "Site code must start with alphanumeric and contain only alphanumeric, hyphens (max 20 chars)"
- `openELIS.site.validation.codeDuplicate` — "Site code already exists"
- `openELIS.site.validation.nameRequired` — "Site name is required"
- `openELIS.site.validation.typeRequired` — "Site type is required"
- `openELIS.site.validation.latitudeInvalid` — "Latitude must be between -90 and 90"
- `openELIS.site.validation.longitudeInvalid` — "Longitude must be between -180 and 180"
- `openELIS.site.validation.phoneInvalid` — "Phone number format is invalid"

**Acceptance Criteria:**
- [ ] All UI text uses i18n keys (no hardcoded English strings)
- [ ] All enum labels are translated via i18n keys
- [ ] i18n messages support placeholders (e.g., {count})
- [ ] UI renders in all supported languages without code changes
- [ ] Translation files are maintained separate from code

---

#### FR-5.6.2: Error Handling & User Feedback
**ID:** FR-5.6.2
**Priority:** P0
**Requirement:**
All user actions shall provide clear feedback via toast messages, inline validation errors, or modals:

**Toast Messages (auto-dismiss after 5 seconds):**
- Success: "Site created/updated/deleted/deactivated/reactivated/imported successfully"
- Error: "Failed to [action]. [Error message]" (e.g., "Failed to delete site. Site is referenced by 5 active orders.")

**Inline Validation Errors:**
- Displayed below form field on blur or submit
- Red text or error icon
- Error message uses i18n keys (e.g., `openELIS.site.validation.codeInvalid`)

**Modals:**
- Confirmation modals for destructive actions (Delete, Deactivate, Import)
- Error modals for unexpected server errors (e.g., 500 Server Error)
- Modal has title, message, and action buttons (Confirm, Cancel)

**HTTP Error Handling:**
- 400 Bad Request — Show validation error message from server
- 403 Forbidden — Show "You do not have permission to perform this action"
- 404 Not Found — Show "Site not found" and redirect to registry list
- 409 Conflict — Show "Site code already exists" or "Site has been modified by another user"
- 500 Server Error — Show "An unexpected error occurred. Please try again or contact support."

**Acceptance Criteria:**
- [ ] All success actions show toast with i18n message
- [ ] All form errors show inline validation message with i18n key
- [ ] Destructive actions show confirmation modal with site code/name
- [ ] Destructive actions show count of linked orders if applicable
- [ ] Server errors show user-friendly message (not raw exception)
- [ ] Error messages are dismissible (close button or auto-dismiss)
- [ ] Toast and error messages use i18n keys, not hardcoded text

---

#### FR-5.6.3: Loading States & Performance
**ID:** FR-5.6.3
**Priority:** P1
**Requirement:**
Long-running operations shall display loading indicators to prevent user confusion:
- **DataTable Loading** — Skeleton loaders or spinner while fetching sites (max 2 seconds)
- **Search Loading** — Spinner while searching (debounced at 300ms; only shown if search takes >500ms)
- **Form Submission** — Button disabled and spinner while submitting (no double-submit)
- **Import Progress** — Progress bar showing "Importing 50 of 100 sites..."
- **Export Progress** — Toast "Exporting sites..." while generating CSV

**Performance Targets:**
- Registry list loads within 2 seconds for <10k sites
- Search returns results within 1 second for <50 matches
- Import processes 1000 sites within 10 seconds
- Export generates CSV for 10k sites within 5 seconds

**Acceptance Criteria:**
- [ ] DataTable shows skeleton loaders while fetching
- [ ] Search shows spinner only if taking >500ms
- [ ] Form submit button is disabled while submitting
- [ ] Import shows progress bar with site count
- [ ] Export shows progress toast
- [ ] All operations complete within performance targets
- [ ] No "stuck" loading states (timeout after 30 seconds)
- [ ] User can cancel long-running operations (import, export)

---

#### FR-5.6.4: Accessibility (WCAG 2.1 Level AA)
**ID:** FR-5.6.4
**Priority:** P1
**Requirement:**
The Sampling Site Registry shall comply with WCAG 2.1 Level AA accessibility standards:
- Semantic HTML (proper heading hierarchy, form labels, button types)
- Keyboard navigation (Tab, Shift+Tab, Enter, Escape, Arrow keys for dropdowns)
- Color contrast (4.5:1 for text, 3:1 for UI components)
- ARIA labels and roles for screen readers (DataTable, modals, popovers)
- Focus indicators (visible outline on keyboard navigation)
- Form field labels linked via `<label for>` or ARIA
- Error messages associated with form fields via ARIA-describedby

**Keyboard Shortcuts:**
- Tab — Navigate through form fields and buttons
- Shift+Tab — Navigate backward
- Enter — Submit form, trigger action (button, link)
- Escape — Close modal, cancel form, clear search
- Arrow Up/Down — Navigate dropdown options, DataTable rows (if selectable)

**Acceptance Criteria:**
- [ ] Page has proper heading hierarchy (H1, H2, H3)
- [ ] Form labels are associated with inputs via `<label for>` or ARIA
- [ ] Buttons have descriptive text (no icon-only buttons without aria-label)
- [ ] Focus indicator is visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] DataTable is keyboard navigable (Tab, Arrow keys)
- [ ] Modals trap focus (Tab cycles within modal)
- [ ] Dropdowns are keyboard navigable (Arrow keys, Enter to select)
- [ ] Error messages are associated with form fields
- [ ] Page is navigable without mouse
- [ ] Automated accessibility audit (e.g., axe DevTools) shows no Level A or AA violations

---

### 5.7 Data Validation

#### FR-5.7.1: Field-Level Validation
**ID:** FR-5.7.1
**Priority:** P0
**Requirement:**
All form fields shall be validated according to the rules below:

| Field | Required | Type | Rules | Error Message |
|---|---|---|---|---|
| Code | Yes | String | Max 20, regex `^[A-Z0-9][A-Z0-9\-]{0,19}$`, unique | "Code is required" / "Code format invalid" / "Code already exists" |
| Name | Yes | String | Max 255 | "Name is required" / "Name too long (max 255)" |
| Type | Yes | Enum | WATER_SOURCE, AIR_MONITORING, VECTOR_TRAP, SOIL_SEDIMENT, OTHER | "Site type is required" |
| Subtype | No | String | Max 100 | "Subtype too long (max 100)" |
| Region | No | String | Must exist in location hierarchy or be empty | "Region not found" |
| District | No | String | Must be child of selected Region or be empty | "District not found or not in selected region" |
| Town-Village | No | String | Max 100 | "Town/Village too long (max 100)" |
| Address | No | String | Max 255 | "Address too long (max 255)" |
| Latitude | No | Decimal | Range -90 to 90 | "Latitude must be between -90 and 90" |
| Longitude | No | Decimal | Range -180 to 180 | "Longitude must be between -180 and 180" |
| Elevation | No | Decimal | No range limit, null allowed | None |
| Environmental Zone | No | Enum | Urban, Suburban, Rural, Industrial, Agricultural, Protected | "Invalid zone" |
| Description | No | Text | Max 1000 | "Description too long (max 1000)" |
| Contact Person | No | String | Max 100 | "Contact person too long (max 100)" |
| Contact Phone | No | String | Max 20, regex `^[\+\d\s\(\)\-]{0,20}$` | "Phone number format invalid" |

**Validation Timing:**
- Client-side validation: On blur (for single fields) and on submit (for all fields)
- Server-side validation: On all API requests (create, update, import)
- Uniqueness check (Code): Server-side only; inline check may be debounced (300ms)

**Acceptance Criteria:**
- [ ] Required fields show error if empty on blur or submit
- [ ] Code validation checks format and uniqueness
- [ ] Type dropdown only allows valid enum values
- [ ] Latitude/Longitude show error if out of range
- [ ] Phone shows error if regex invalid
- [ ] Error messages use i18n keys
- [ ] All validation errors are cleared when user corrects field
- [ ] Submit button is disabled if any validation errors present
- [ ] Server validates all fields; client validation is UX-only (can't bypass server validation)

---

## 6. Data Model

### 6.1 SamplingSite Entity

```
Entity: SamplingSite

Attributes:
  id (UUID, auto-generated, PK)
    Description: Internal identifier
    Immutable: true
    Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

  code (String, max 20, required, unique)
    Description: Unique site code
    Pattern: ^[A-Z0-9][A-Z0-9\-]{0,19}$
    Example: "WS-001", "AT-003", "MOSQUITO-TRAP-01"
    Immutable: false (editable, but uniqueness re-checked)

  name (String, max 255, required)
    Description: Display name
    Example: "Sungai Ciliwung - Manggarai", "SD Negeri 1 Well", "Air Monitoring Station - Jakarta North"
    Immutable: false

  siteType (Enum, required)
    Description: Classification of site type
    Values: WATER_SOURCE | AIR_MONITORING | VECTOR_TRAP | SOIL_SEDIMENT | OTHER
    Example: WATER_SOURCE
    Immutable: false

  subtype (String, max 100, optional)
    Description: Free-text subtype or category
    Example: "River", "Well", "Mosquito Trap (Light Trap)", "School"
    Immutable: false

  regionCode (String, optional, FK)
    Description: Parent region from location hierarchy
    References: Location.code (type=REGION)
    Example: "DKI", "BALI"
    Immutable: false

  districtCode (String, optional, FK)
    Description: Parent district from location hierarchy
    References: Location.code (type=DISTRICT, parent=regionCode)
    Example: "JAKARTA_SOUTH", "BADUNG"
    Immutable: false

  townVillage (String, max 100, optional)
    Description: Town or village name (not a strict hierarchy reference; free text)
    Example: "Manggarai", "Pondok Kelapa", "Ubud"
    Immutable: false

  address (String, max 255, optional)
    Description: Street address or detailed location description
    Example: "Jalan Ciliwung, beside wastewater treatment plant, 50m downstream"
    Immutable: false

  latitude (Decimal, optional, range -90 to 90)
    Description: GPS latitude coordinate
    Example: -6.212345
    Precision: 8 decimal places (approx 1.1mm accuracy)
    Immutable: false

  longitude (Decimal, optional, range -180 to 180)
    Description: GPS longitude coordinate
    Example: 106.789012
    Precision: 8 decimal places
    Immutable: false

  elevation (Decimal, optional)
    Description: Elevation in meters above sea level
    Example: 50.5
    Unit: meters
    Immutable: false

  description (Text, max 1000, optional)
    Description: Free-text site description (notes, hazards, access info, etc.)
    Example: "Downstream of industrial zone. Access via East Gate. Bring waders. Contact site manager before 10 AM."
    Immutable: false

  environmentalZone (String, optional)
    Description: Zone classification for environmental context
    Values: Urban | Suburban | Rural | Industrial | Agricultural | Protected
    Example: "Industrial"
    Immutable: false

  contactPerson (String, max 100, optional)
    Description: Name of site contact or custodian
    Example: "Ibu Siti", "Pak Bambang"
    Immutable: false

  contactPhone (String, max 20, optional)
    Description: Phone number of site contact
    Pattern: ^[\+\d\s\(\)\-]{0,20}$
    Example: "+62-21-1234567", "0812-3456-7890"
    Immutable: false

  isActive (Boolean, required, default=true)
    Description: Active/inactive status; inactive sites are soft-deleted
    Immutable: false

  source (Enum, read-only)
    Description: Origin of site record (LOCAL or HUB-synced)
    Values: LOCAL | HUB
    Default: LOCAL
    Immutable: true

  createdDate (DateTime, auto-generated, read-only)
    Description: Timestamp when site was created
    Format: ISO 8601 (YYYY-MM-DD HH:MM:SS)
    Example: "2026-04-02 14:30:15"
    Immutable: true

  lastModified (DateTime, auto-updated, read-only)
    Description: Timestamp of last modification
    Format: ISO 8601
    Immutable: false (updated on each edit)

  lastCollectionDate (DateTime, read-only)
    Description: Timestamp of most recent sample collection at this site
    Computed: MAX(Order.collectionDate) where Order.site.id = this.id AND Order.status = COMPLETED
    Format: ISO 8601 or "Never" if no completed orders
    Immutable: true (computed)

  totalCollections (Integer, read-only, default=0)
    Description: Count of completed orders linked to this site
    Computed: COUNT(Order) where Order.site.id = this.id AND Order.status = COMPLETED
    Immutable: true (computed)
```

### 6.2 Relationships

**SamplingSite ↔ Order (Sample Collection)**
- One site can be linked to many orders
- One order has exactly one site (if workflow = Environmental) or one patient (if workflow = Clinical)
- Relationship: One-to-Many (1:N)
- Foreign Key: Order.siteId → SamplingSite.id
- Cascade Rules: Site deletion is prevented if linked to active orders; deactivation allowed

**SamplingSite ↔ Location (Region/District/Town-Village)**
- SamplingSite.regionCode → Location.code (where Location.type = REGION)
- SamplingSite.districtCode → Location.code (where Location.type = DISTRICT and parent.id = regionCode)
- Relationship: Many-to-One (N:1)
- Cascade Rules: No cascade delete (location hierarchy is independent)

> **IMPLEMENTATION NOTE — Reuse Patient Entry Geographic Infrastructure:**
> The geographic unit hierarchy (Region, District, Town-Village) used by the Sampling Site Registry **MUST** be the same data source, configuration, and UI components already used by the Patient Entry form. Specifically:
> - The Region dropdown and District/Town-Village typeaheads must query the **same `addresshierarchy` tables and API endpoints** that populate the patient address fields (Region, District, Town/Camp-Commune).
> - The geographic unit labels displayed in the Site Registry (column headers, filter labels, form labels) must use the **same i18n keys** as Patient Entry so that implementations that rename "Region" to "Province" or "State" see consistent labels across both modules.
> - The cascading logic (Region populates District options, District populates Town-Village options) must use the **same service layer** — do not create a separate location lookup service for sites.
> - If the OpenELIS instance has configured additional or fewer geographic levels (e.g., some deployments use Province → County → Sub-county), the Site Registry must respect that configuration identically to how Patient Entry does.
> - The Organizations Management module (Administration → Organizations Management) is the master configuration interface for this hierarchy. Sites reference records from that same hierarchy via `regionCode` and `districtCode` foreign keys.

### 6.3 Computed Fields

**lastCollectionDate:**
- Query: SELECT MAX(createdDate) FROM Order WHERE siteId = ? AND status = 'COMPLETED'
- Cached: Updated when order status changes to COMPLETED
- Display: ISO 8601 date or "Never"

**totalCollections:**
- Query: SELECT COUNT(*) FROM Order WHERE siteId = ? AND status = 'COMPLETED'
- Cached: Updated when order status changes to COMPLETED
- Display: Integer count

---

## 7. Navigation & Screen Inventory

### 7.1 Navigation Structure

```
Main Navigation Tree:
  Sample Collection
    ├── Site Registry (new page) [site.registry.view permission]
    │   ├── [List view with filters, search, import/export]
    │   ├── [Detail view with edit/deactivate/delete actions]
    │   └── [Inline site create during order entry]
    │
    ├── Orders (existing)
    │   ├── Enter Order
    │   │   └── Step 1: Select Workflow → Workflow = Environmental
    │   │       └── Site Search & Create (in ORD-2) [site.registry.view, site.registry.create permissions]
    │   │
    │   └── Order List (existing)
    │
    └── [Other existing pages]
```

### 7.2 Screen Inventory

| Screen ID | Name | Route | Purpose | Permissions Required |
|---|---|---|---|---|
| SITE-LIST | Sampling Site Registry | `/sample-collection/site-registry` | List, filter, search, inline detail expansion, CRUD sites, FHIR sync | `site.registry.view` |
| SITE-DETAIL | Site Detail (Inline Expansion) | (expanded row within SITE-LIST) | View site details, edit in-place, activate/deactivate, fork HUB sites | `site.registry.view` + edit actions |
| SITE-EDIT | Site Edit Form | In-page form (not separate route) | Inline edit form on detail view | `site.registry.edit` |
| SITE-SEARCH-ORDER | Site Search in Order Entry | Embedded in ORD-2 step | Search/create site during environmental order entry | `site.registry.view`, `site.registry.create` |
| SITE-IMPORT | Import Sites | Modal/dialog in SITE-LIST | Import CSV file with validation preview | `site.registry.import` |
| SITE-EXPORT | Export Sites | Modal/dialog in SITE-LIST | Export sites to CSV | `site.registry.export` |

### 7.3 Breadcrumb Navigation

- Registry List: `Sample Collection > Site Registry`
- Site Detail: `Sample Collection > Site Registry > {Site Code}`
- Site Edit: `Sample Collection > Site Registry > {Site Code} > Edit`

---

## 8. Interaction Patterns

### 8.1 Search Pattern (XC-2 Unified Search)
**Applies to:** FR-5.3.1 (Inline Site Search in Order Entry)

```
Interaction Flow:
1. User lands on Site Search section
2. User enters text in search input (Code or Name)
3. User clicks "Search" button or presses Enter
   → Backend searches sites (Code, Name partial match, isActive=true only)
   → Results displayed in table (max 50 rows)
4. User clicks a row to select (radio button or row highlight)
5. "Select" button enables
6. User clicks "Select" button
   → Site is selected and "read-only selected site card" displays
   → Search input and results table are hidden or cleared
7. User can click "Change Site" on selected card to re-open search and select different site

Error Handling:
- Empty search: "Enter site code or name to search"
- No results: "No sites found. Click 'New Site' to create one."
- Server error: "Search failed. Please try again."
```

### 8.2 Inline Create Pattern (ORD-11 Analog)
**Applies to:** FR-5.3.2 (Inline Site Create in Order Entry)

```
Interaction Flow:
1. User is in Site Search section (FR-5.3.1)
2. User clicks "New Site" button
   → Inline create form appears below search controls (no modal)
   → Form fields populate with empty values
3. User fills form fields (Code, Name, Type required; others optional)
4. User clicks "Create & Select" button
   → Form is validated client-side (required fields, patterns, ranges)
   → On validation error, field shows inline error message
   → Submit button disabled until errors cleared
5. On successful validation, form submitted to backend
   → "Importing 1 site..." progress toast
   → Backend creates site (server-side validation)
6. On success:
   → Inline form closes
   → New site is auto-selected
   → Selected site card displays
   → Toast "Site created successfully"
7. On error:
   → Form remains open
   → Server error message displays (e.g., "Code already exists")
8. User can click "Cancel" to close form without creating site
```

### 8.3 CRUD Pattern (Registry Management)
**Applies to:** FR-5.1 (Registry List) and FR-5.2 (Site Detail/Edit)

```
Read (View List):
- User navigates to `/sample-collection/site-registry`
- List page loads with filters (Region, District, Type, Active status)
- DataTable displays all active sites (50 default) with pagination
- User can search, filter, sort, and paginate

Read (View Detail):
- User clicks site row in list (not action column)
- Detail page loads showing all site fields (read-only)
- User can view metadata (created date, last modified, last collection, total collections)

Create:
- User clicks "New Site" button in registry toolbar
- [Future] Dedicated create form opens (out of scope for Phase 1; inline create in order entry only)

Update (Edit):
- User clicks "Edit" button in detail view
- Inline form appears with all editable fields (Code, Name, Type, etc.)
- User modifies fields (client-side validation on blur)
- User clicks "Save" button (disabled if validation errors)
- Form submitted to backend (server-side validation)
- On success: Detail view refreshes, toast "Site updated successfully"
- On error: Form displays error message, user can correct and re-submit

Delete:
- User clicks "Delete" button in detail view
- Confirmation modal: "Delete site [Code]? X orders are linked."
- User clicks "Confirm" to proceed
- Site is permanently deleted (no soft delete for delete action)
- On success: Redirected to registry list, toast "Site deleted successfully"

Deactivate (Soft Delete):
- User clicks "Deactivate" button in detail view
- Confirmation modal: "Deactivate site [Code]? X orders are linked. This site will no longer appear in searches."
- User clicks "Confirm"
- Site.isActive = false
- Site disappears from registry list (unless "Inactive" filter applied)
- Toast "Site deactivated successfully"

Reactivate:
- User filters registry list to "Inactive Only"
- User clicks "Reactivate" button on inactive site detail view
- No confirmation modal
- Site.isActive = true
- Toast "Site reactivated successfully"
- Site now appears in default registry list
```

### 8.4 Import/Export Pattern
**Applies to:** FR-5.4 (Import/Export)

```
Import Flow:
1. User clicks "Import" button in registry toolbar
2. File picker dialog opens (native browser file input)
3. User selects CSV file (max 10MB, .csv only)
4. Preview & Validation Screen displays:
   - File name, row count, first 10 rows in table
   - Backend validation runs on all rows (Code uniqueness, required fields, enum values, patterns, ranges)
   - Validation report: "X rows valid, Y rows with errors"
   - Error rows show row number, field, error message
5. If all rows valid:
   - "Import" button enabled
   - User clicks "Import" → Progress toast "Importing 50 sites..."
   - Backend batch creates sites (transaction or rollback on error)
   - On success: Toast "Imported 50 sites successfully", registry list refreshes
6. If errors present:
   - "Import" button disabled
   - User can edit CSV file and re-upload, or dismiss import
7. User clicks "Cancel" to dismiss import without importing

Export Flow:
1. User clicks "Export" button in registry toolbar
2. Export options dialog shows:
   - "Export all sites" (radio, default)
   - "Export filtered results" (radio)
3. User selects option and clicks "Export"
4. Backend generates CSV (encoding UTF-8, line terminator LF)
5. Browser downloads file: `sampling-sites-YYYYMMDD-HHMMSS.csv`
   - Column order: code, name, type, subtype, regionCode, districtCode, townVillage, address, latitude, longitude, elevation, environmentalZone, description, contactPerson, contactPhone
```

---

## 9. Acceptance Criteria (Checkbox Format)

### 9.1 Functional Acceptance Criteria

#### Site Registry List (FR-5.1)
- [ ] Registry page accessible at `/sample-collection/site-registry`
- [ ] Sidebar displays Region dropdown with District and Town-Village typeaheads (ComboBox) with cascading logic
- [ ] DataTable displays all 9 columns with correct alignment and sortability
- [ ] Search box accepts text and searches Code/Name with 300ms debounce
- [ ] Site Type checkboxes filter by multiple types (AND combined)
- [ ] Active Status filter shows three states (Active Only, Inactive Only, All)
- [ ] Reset button clears all filters and displays all active sites
- [ ] Pagination works (Previous/Next, page size selector, jump-to-page)
- [ ] Default sort is Code ascending
- [ ] Shift+Click adds secondary sort
- [ ] URL query params reflect active filters (bookmarkable)
- [ ] Filters are sticky across navigation (session storage)
- [ ] Registry list only shows sites with isActive=true by default
- [ ] Inactive sites visible only when "Inactive Only" or "All" filter selected

#### Site Detail & Edit (FR-5.2)
- [ ] Clicking site row opens detail view (read-only)
- [ ] All site fields displayed with i18n labels
- [ ] Read-only fields show as text (no input controls)
- [ ] Null fields show "—" or "Never" (for dates)
- [ ] Active badge shows green/red for Active/Inactive
- [ ] Edit button visible only with `site.registry.edit` permission
- [ ] Deactivate button visible only with `site.registry.deactivate` permission
- [ ] Delete button shows confirmation modal with site code and linked order count
- [ ] Edit form renders all editable fields
- [ ] Code field validates uniqueness (inline check debounced)
- [ ] Code field validates format (regex ^[A-Z0-9][A-Z0-9\-]{0,19}$)
- [ ] Name field required; empty submission shows error
- [ ] Type dropdown shows i18n-translated options
- [ ] Region dropdown and District/Town-Village typeaheads cascade correctly
- [ ] Latitude range validated (-90 to 90)
- [ ] Longitude range validated (-180 to 180)
- [ ] Phone number format validated (regex)
- [ ] Save button disabled while submitting or validation errors present
- [ ] Cancel button returns to detail view without saving
- [ ] lastModified timestamp updates on successful save
- [ ] Success toast "Site updated successfully" appears after save

#### Site Deactivation (FR-5.2.3)
- [ ] Deactivate button shows confirmation modal
- [ ] Modal displays site code, name, and linked order count
- [ ] Confirmation sets isActive=false
- [ ] Toast "Site deactivated successfully" appears
- [ ] Deactivated site disappears from default registry list
- [ ] Deactivated site visible when "Inactive Only" filter applied
- [ ] Reactivate button appears on inactive site detail
- [ ] Reactivate is immediate (no confirmation modal)
- [ ] Toast "Site reactivated successfully" appears after reactivate

#### Site Search in Order Entry (FR-5.3.1)
- [ ] Site Search section appears when workflow = Environmental
- [ ] Site Search section hidden when workflow != Environmental
- [ ] Search input accepts text for Code and Name
- [ ] Search button triggers backend search
- [ ] Results table displays Code, Name, Type, Location, Last Collection (max 50 rows)
- [ ] Results filtered to isActive=true only
- [ ] Empty search shows "No sites found..." message
- [ ] Sites can be selected via row click or radio button
- [ ] "Select" button enables/disables based on selection
- [ ] Selected site card displays Code, Name, Type, Location
- [ ] Selected site card shows "Change Site" button
- [ ] Site selection persists across order entry steps

#### Site Create in Order Entry (FR-5.3.2)
- [ ] "New Site" button visible in Site Search section
- [ ] Clicking "New Site" opens inline create form
- [ ] Inline form displays all 15 fields
- [ ] Code field validates uniqueness (debounced server check)
- [ ] Name field required
- [ ] Type field required
- [ ] Region dropdown and District/Town-Village typeaheads cascade correctly
- [ ] Latitude/Longitude/Elevation validate numeric ranges
- [ ] Phone validates regex format
- [ ] "Create & Select" button disabled until Code and Name provided
- [ ] On successful creation, inline form closes
- [ ] Created site is auto-selected and selected card displays
- [ ] Toast "Site created successfully" appears
- [ ] New site has isActive=true by default
- [ ] Cancel button closes form without creating

#### Import Sites (FR-5.4.1)
- [ ] Import button visible only with `site.registry.import` permission
- [ ] File picker accepts .csv files only
- [ ] File size limit enforced (max 10MB)
- [ ] Preview shows file name, row count, first 10 rows
- [ ] Backend validation runs on all rows (no row skipped)
- [ ] Code uniqueness validated (against existing DB and duplicates in file)
- [ ] Type enum validated; invalid type shows error
- [ ] Latitude/Longitude ranges validated
- [ ] Phone regex validated
- [ ] Error report shows row number and field error message
- [ ] Import button disabled if any validation errors
- [ ] Import creates sites in batch (atomic transaction or rollback)
- [ ] Success toast shows count of imported sites
- [ ] Registry list refreshes after import
- [ ] Cancel closes import without importing

#### Export Sites (FR-5.4.2)
- [ ] Export button visible only with `site.registry.export` permission
- [ ] Export dialog shows "Export all" and "Export filtered" radio options
- [ ] "Export all" is default
- [ ] "Export filtered" exports only sites matching active filters
- [ ] CSV file generated with correct column headers
- [ ] Data rows contain all fields in correct order
- [ ] File name includes timestamp (YYYYMMDD-HHMMSS)
- [ ] CSV encoding is UTF-8
- [ ] Empty fields are blank (not "null" or "—")
- [ ] File downloads to user's default download folder

#### Permissions & Access Control (FR-5.5)
- [ ] All 6 permission keys defined (view, create, edit, deactivate, import, export)
- [ ] View permission hides registry page if user lacks permission
- [ ] Create button hidden if user lacks `site.registry.create`
- [ ] Edit form inaccessible if user lacks `site.registry.edit` (404 or redirect)
- [ ] Deactivate button hidden if user lacks `site.registry.deactivate`
- [ ] Import button hidden if user lacks `site.registry.import`
- [ ] Export button hidden if user lacks `site.registry.export`
- [ ] API endpoints enforce permissions server-side
- [ ] HTTP 403 Forbidden returned for unauthorized API calls

#### Internationalization (FR-5.6.1)
- [ ] All UI text uses i18n keys (no hardcoded English strings)
- [ ] All enum labels translated via i18n keys
- [ ] i18n messages support placeholders (e.g., {count})
- [ ] UI renders correctly in all supported languages

#### Error Handling (FR-5.6.2)
- [ ] Success actions show toast with i18n message
- [ ] Form errors show inline validation with i18n key
- [ ] Destructive actions show confirmation modal with site details
- [ ] Server errors show user-friendly message (not raw exception)
- [ ] Error messages dismissible
- [ ] HTTP 400, 403, 404, 409, 500 errors handled gracefully

#### Loading States (FR-5.6.3)
- [ ] DataTable shows skeleton loaders while fetching
- [ ] Search shows spinner only if taking >500ms
- [ ] Form submit button disabled while submitting
- [ ] Import shows progress bar
- [ ] Export shows progress toast
- [ ] All operations complete within performance targets

#### Accessibility (FR-5.6.4)
- [ ] Page has proper heading hierarchy (H1, H2, H3)
- [ ] Form labels associated with inputs via `<label for>` or ARIA
- [ ] Focus indicator visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] DataTable keyboard navigable (Tab, Arrow keys)
- [ ] Modals trap focus
- [ ] Dropdowns keyboard navigable
- [ ] Error messages associated with form fields
- [ ] Page navigable without mouse
- [ ] Automated accessibility audit shows no Level A or AA violations

#### Data Validation (FR-5.7)
- [ ] Code field required, max 20, unique, format regex validated
- [ ] Name field required, max 255
- [ ] Type field required, enum validated
- [ ] Subtype max 100
- [ ] Region/District must exist in location hierarchy
- [ ] Latitude range -90 to 90
- [ ] Longitude range -180 to 180
- [ ] Environmental Zone enum validated
- [ ] Description max 1000
- [ ] Contact Person max 100
- [ ] Contact Phone max 20, format regex validated
- [ ] All validation errors shown inline with i18n message
- [ ] Submit button disabled if any validation errors
- [ ] Server-side validation enforced on all API requests

### FHIR Location Sync
- [ ] Creating a local site pushes a FHIR Location resource to the HAPI FHIR server within 30 seconds
- [ ] Updating a local site pushes the updated Location resource
- [ ] FHIR Location includes correct identifier (site code), type (site type CodeSystem), position (GPS), address, contact, and partOf (region reference)
- [ ] Polling pulls new/updated Location resources from FHIR server into local registry as HUB-sourced sites
- [ ] HUB-sourced sites are read-only in the local UI (edit/deactivate disabled, locked icon shown)
- [ ] Sync status indicator on registry list header shows last sync time and pending/failed count
- [ ] "Sync Now" button triggers immediate pull (requires `site.registry.import` permission)
- [ ] Conflict detection: same site code on local + FHIR server flags for admin resolution
- [ ] `fhirResourceId` and `lastSyncTimestamp` stored and displayed in site detail view
- [ ] FHIR Location example (WS-001 Sungai Ciliwung) round-trips correctly: local → FHIR → remote instance → local

---

## 10. Integration Points

### 10.1 Dependencies on Other FRS

**S-01 FRS (Compliance Standards Registry)**
- Sites do NOT auto-link to compliance standards
- Standards are selected manually at order entry time (per S-01 FR-4-001)
- Standards selection is independent of site selection

**Sample Collection FRS References:**
- **ORD-2 (Enter Order, Step 1)** — Environmental workflow displays Site Search (FR-5.3.1)
- **ORD-3 (Workflow Toggle)** — Determines whether to show Patient Search or Site Search
- **ORD-11 (Inline Create Pattern)** — Site create form follows same pattern as patient inline create
- **XC-2 (Unified Search Pattern)** — Site search follows same interaction pattern as patient search
- **CFG-1 (Lab Unit Configuration)** — Lab unit config may include default site type or region filters (future enhancement)

**Organizations Management Module**
- Location hierarchy (Region/District/Town-Village) is reused
- Sites link to location records via regionCode and districtCode foreign keys
- Location hierarchy is maintained independently; no cascading changes

### 10.2 API Endpoints

**Note:** Endpoint URLs and HTTP methods are to be defined in detailed API specification (out of scope for this FRS).

**Core CRUD Endpoints:**
- GET `/api/sites` — List sites with filters, search, pagination, sorting
- GET `/api/sites/{siteId}` — Get site details
- POST `/api/sites` — Create new site
- PUT `/api/sites/{siteId}` — Update site details
- DELETE `/api/sites/{siteId}` — Permanently delete site
- PATCH `/api/sites/{siteId}/deactivate` — Set isActive=false
- PATCH `/api/sites/{siteId}/reactivate` — Set isActive=true

**Search & Lookup Endpoints:**
- GET `/api/sites/search?q={query}` — Search sites by code or name (for order entry)
- GET `/api/sites/by-location?regionCode={code}&districtCode={code}` — Find sites by location

**Import/Export Endpoints:**
- POST `/api/sites/import` — Import CSV file (multipart/form-data)
- POST `/api/sites/import/validate` — Validate CSV before import (preview screen)
- GET `/api/sites/export?format=csv&filters={json}` — Export sites to CSV

**Permission Checks:**
- All endpoints enforce permission keys server-side
- Missing permission returns HTTP 403 Forbidden

### 10.3 Database Schema

**Tables (simplified DDL):**

```sql
CREATE TABLE sampling_sites (
  id UUID PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  site_type VARCHAR(50) NOT NULL,
  subtype VARCHAR(100),
  region_code VARCHAR(50),
  district_code VARCHAR(50),
  town_village VARCHAR(100),
  address VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  elevation DECIMAL(8, 2),
  description TEXT,
  environmental_zone VARCHAR(50),
  contact_person VARCHAR(100),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  source VARCHAR(10) DEFAULT 'LOCAL',
  fhir_resource_id VARCHAR(100),
  last_sync_timestamp TIMESTAMP,
  created_date TIMESTAMP NOT NULL,
  last_modified TIMESTAMP NOT NULL,
  FOREIGN KEY (region_code) REFERENCES locations(code) WHERE type='REGION',
  FOREIGN KEY (district_code) REFERENCES locations(code) WHERE type='DISTRICT',
  INDEX idx_code (code),
  INDEX idx_name (name),
  INDEX idx_site_type (site_type),
  INDEX idx_region_code (region_code),
  INDEX idx_is_active (is_active)
);

-- Computed fields (derived from orders table, not stored)
-- lastCollectionDate: SELECT MAX(created_date) FROM orders WHERE site_id = ? AND status = 'COMPLETED'
-- totalCollections: SELECT COUNT(*) FROM orders WHERE site_id = ? AND status = 'COMPLETED'
```

### 10.4 FHIR Location Integration (Consolidated HAPI FHIR Server)

Sampling sites SHALL be represented as **FHIR R4 Location** resources and synchronized bidirectionally with the consolidated HAPI FHIR server. This enables site data to flow between OpenELIS instances, EMRs, and national registries (e.g., SILNAS) via standard FHIR interfaces.

#### 10.4.1 FHIR Location Resource Mapping

| SamplingSite Field | FHIR Location Element | Notes |
|---|---|---|
| `id` | `Location.id` | UUID, server-assigned |
| `code` | `Location.identifier[0].value` | System = `http://openelis-global.org/fhir/site-code` |
| `name` | `Location.name` | Required |
| `siteType` | `Location.type[0].coding[0]` | CodeSystem = `http://openelis-global.org/fhir/site-type`; codes: `water-source`, `air-monitoring`, `vector-trap`, `soil-sediment`, `other` |
| `subtype` | `Location.type[0].text` | Free-text display of subtype (e.g., "River", "BG-Sentinel") |
| `regionCode` | `Location.partOf` → Reference(Location) | Points to parent Region Location resource |
| `districtCode` | (derived from partOf chain) | Region→District hierarchy via partOf references |
| `townVillage` | `Location.address.city` | Town/village name |
| `address` | `Location.address.text` | Full address string |
| `latitude` | `Location.position.latitude` | Decimal |
| `longitude` | `Location.position.longitude` | Decimal |
| `elevation` | `Location.position.altitude` | Meters above sea level |
| `description` | `Location.description` | Free text |
| `environmentalZone` | `Location.extension[zone]` | Extension URL: `http://openelis-global.org/fhir/ext/environmental-zone` |
| `contactPerson` | `Location.contact[0].name.text` | Site custodian name |
| `contactPhone` | `Location.contact[0].telecom[0].value` | Phone |
| `isActive` | `Location.status` | `active` / `inactive` |
| `source` | `Location.meta.source` | `LOCAL` = local origin; `HUB` = synced from consolidated server |

#### 10.4.2 Synchronization Requirements

| ID | Pri | Requirement | Acceptance Criteria |
|----|-----|-------------|---------------------|
| FHIR-1 | **P0** | When a SamplingSite is created or updated locally, the system SHALL push the corresponding FHIR Location resource to the consolidated HAPI FHIR server. | Location resource created/updated on FHIR server within 30 seconds of local save. HTTP 200/201 response logged. |
| FHIR-2 | **P0** | The system SHALL periodically poll the HAPI FHIR server for new or updated Location resources with the site-type CodeSystem and merge them into the local site registry with `source=HUB`. | Polling interval configurable (default: 5 minutes). New remote sites appear in local registry. Updated remote sites reflect changes locally. |
| FHIR-3 | **P0** | HUB-sourced sites (synced from FHIR server) SHALL be read-only in the local UI. Users cannot edit or deactivate HUB sites — only the source system can modify them. | HUB sites display a locked icon and "Managed by [source]" label. Edit/Deactivate buttons disabled for HUB sites. |
| FHIR-4 | **P0** | Each site record SHALL store a `fhirResourceId` (the FHIR server's Location.id) and `lastSyncTimestamp` for conflict detection. | Fields stored in database. Displayed in site detail view under a "FHIR Sync" section. |
| FHIR-5 | P1 | The Site Registry list page SHALL display a sync status indicator showing last successful sync timestamp and any pending/failed syncs. | Sync indicator in registry header: green "Synced [timestamp]" or yellow "Pending (N)" or red "Failed (N)". |
| FHIR-6 | P1 | The system SHALL support a manual "Sync Now" action on the Site Registry page that triggers an immediate pull from the FHIR server. | "Sync Now" button in registry toolbar. Triggers immediate poll. Shows progress indicator. Requires `site.registry.import` permission. |
| FHIR-7 | P1 | Conflict resolution: if the same site code exists both locally and on the FHIR server, the system SHALL flag the conflict and present it to the admin for resolution (keep local, accept remote, or merge). | Conflict list accessible from sync status indicator. Each conflict shows both versions side-by-side. Admin resolves per-conflict. |

#### 10.4.3 FHIR API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/fhir/Location` | GET | Search locations by type, name, identifier, partOf |
| `/fhir/Location/{id}` | GET | Read single location |
| `/fhir/Location` | POST | Create new location |
| `/fhir/Location/{id}` | PUT | Update existing location |
| `/fhir/Location?_type=http://openelis-global.org/fhir/site-type\|*` | GET | Query all sampling sites (filtered by CodeSystem) |

#### 10.4.4 FHIR Location Example

```json
{
  "resourceType": "Location",
  "id": "site-ws-001",
  "identifier": [{
    "system": "http://openelis-global.org/fhir/site-code",
    "value": "WS-001"
  }],
  "status": "active",
  "name": "Sungai Ciliwung — Manggarai",
  "description": "Downstream monitoring point on Ciliwung River near Manggarai floodgate",
  "type": [{
    "coding": [{
      "system": "http://openelis-global.org/fhir/site-type",
      "code": "water-source",
      "display": "Water Source"
    }],
    "text": "River"
  }],
  "address": {
    "city": "Manggarai",
    "district": "Jakarta Selatan",
    "state": "DKI Jakarta",
    "country": "ID"
  },
  "position": {
    "latitude": -6.2088,
    "longitude": 106.8456
  },
  "contact": [{
    "name": { "text": "Budi Santoso" },
    "telecom": [{ "system": "phone", "value": "+62 812 3456 7890" }]
  }],
  "partOf": { "reference": "Location/region-dki-jakarta" },
  "extension": [{
    "url": "http://openelis-global.org/fhir/ext/environmental-zone",
    "valueString": "Urban"
  }],
  "meta": {
    "source": "LOCAL",
    "lastUpdated": "2026-04-02T10:30:00Z"
  }
}
```

### 10.5 Audit & Compliance

**Audit Trail:**
- createdDate and lastModified timestamps are stored automatically
- User ID (who created/modified) is NOT stored in this release (future enhancement)
- Deletion audit: Deleted site records are not logged; consider soft delete (deactivation) for audit trails

**Compliance Integration:**
- Sites reference S-01 Compliance Standards indirectly via Order (sample collection orders link site + standards)
- No direct linking of site to standards in this FRS
- Site data (code, type, location) is used for traceability and reporting

---

## 11. Success Metrics

### 11.1 User Adoption Metrics
1. **Site Registry Utilization**
   - Target: 80% of environmental orders use a site from registry (vs. manual entry)
   - Measurement: COUNT(orders WHERE siteId IS NOT NULL AND workflow='ENVIRONMENTAL') / COUNT(orders WHERE workflow='ENVIRONMENTAL')

2. **Inline Site Creation**
   - Target: 30% of new sites created inline during order entry (vs. pre-registration)
   - Measurement: COUNT(sites WHERE source='CREATED_AT_ORDER_ENTRY') / COUNT(sites WHERE source IN ('CREATED_AT_ORDER_ENTRY', 'REGISTRY_ENTRY'))

3. **Import Adoption**
   - Target: 90% of bulk site operations use import (vs. manual entry)
   - Measurement: Bulk operation volume (>10 sites at once) via import / total bulk operations

### 11.2 Data Quality Metrics
1. **Completeness**
   - Target: 95% of sites have location (region, district)
   - Measurement: COUNT(sites WHERE region_code IS NOT NULL) / COUNT(sites)

2. **Code Uniqueness**
   - Target: 100% of site codes are unique
   - Measurement: COUNT(DISTINCT code) = COUNT(sites)

3. **Geospatial Coverage**
   - Target: 70% of sites have valid latitude/longitude
   - Measurement: COUNT(sites WHERE latitude IS NOT NULL AND longitude IS NOT NULL) / COUNT(sites)

### 11.3 Performance Metrics
1. **Page Load Time**
   - Target: Registry list loads within 2 seconds for <10k sites
   - Measurement: Page load time (browser DevTools, synthetic monitoring)

2. **Search Latency**
   - Target: Search returns results within 1 second
   - Measurement: API response time for search endpoint

3. **Import Performance**
   - Target: Import processes 1000 sites within 10 seconds
   - Measurement: Import batch job execution time

### 11.4 User Experience Metrics
1. **Error Rate**
   - Target: <2% of form submissions fail validation
   - Measurement: Failed submissions / total submissions

2. **Abandonment Rate**
   - Target: <10% of users abandon site creation after starting
   - Measurement: Started inline creates / completed creates

3. **Support Tickets**
   - Target: <5 support tickets per 1000 users per month related to site registry
   - Measurement: Support ticket volume

---

## 12. Open Questions & Decisions

### 12.1 Unresolved Design Questions

1. **Site Code Auto-Generation**
   - Question: Should site codes be auto-generated based on a template (e.g., "WS-001" for WATER_SOURCE), or manually entered?
   - Options:
     - A) Auto-generate with pattern (requires pattern config per org)
     - B) Manual entry only (user must enter unique code)
     - C) Both (suggest auto-generated code, allow override)
   - **Decision:** [TBD] To be decided by product team and implementer

2. **Site Deactivation vs. Hard Delete**
   - Question: Is soft delete (deactivation) sufficient, or do we need both soft and hard delete?
   - Current Design: Only soft delete (deactivate/reactivate)
   - **Rationale:** Preserves historical data and linked orders; hard delete can be added in future if needed
   - **Decision:** Confirmed as soft delete only (hard delete is "Delete" button as shown in FR-5.2.2)

3. **Compliance Standards Auto-Linking**
   - Question: Should sites auto-link to compliance standards based on siteType and location?
   - Options:
     - A) No auto-linking; manual selection at order entry (current design, per S-01 FR-4-001)
     - B) Default standards per site type; override at order entry
     - C) Recommended standards based on location + type
   - **Decision:** No auto-linking (per S-01 FR-4-001); manual selection only

4. **Site Hierarchies & Grouping**
   - Question: Should sites be grouped into "Site Projects" or "Site Campaigns"?
   - Example: All water samples from a river cleanup project linked to a campaign
   - Options:
     - A) No grouping in Phase 1; sites are flat list
     - B) Add site_project_id foreign key for grouping
     - C) Use tags or custom attributes
   - **Decision:** No grouping in Phase 1; can be added in Phase 2 if needed

5. **Photo/Media Attachments**
   - Question: Should sites support photo attachments (e.g., site condition photos)?
   - Options:
     - A) No attachments (out of scope)
     - B) Single photo per site
     - C) Multiple attachments (documents, photos, diagrams)
   - **Decision:** No attachments in Phase 1 (out of scope per 4.1)

6. **Real-Time Collaboration**
   - Question: Should multiple users be able to edit the same site simultaneously, or is lock-based editing required?
   - Options:
     - A) Lock-based (edit lock expires after 5 minutes)
     - B) Last-write-wins (concurrent edits, last save overrides)
     - C) Conflict detection (warn if site modified by another user since load)
   - **Decision:** [TBD] Conflict detection recommended; to be specified in detailed design

7. **Site Type Extensibility**
   - Question: Are siteType enum values fixed, or can org admins add custom types?
   - Options:
     - A) Fixed enum (WATER_SOURCE, AIR_MONITORING, etc.)
     - B) Enum + OTHER with free-text subtype (current design)
     - C) Fully customizable types (org-specific)
   - **Decision:** Fixed enum + OTHER + free-text subtype (balanced flexibility)

8. **Import Duplicate Handling**
   - Question: How should duplicate codes in import file be handled?
   - Options:
     - A) Reject entire import if any duplicates
     - B) Skip duplicate rows (warn user)
     - C) Update existing sites if code matches
   - **Decision:** Reject entire import if duplicate codes found (per validation FR-5.4.1); can be enhanced to merge/update in Phase 2

### 12.2 Implementation Decisions to Finalize

1. **Site Code Pattern/Validation**
   - Current Regex: `^[A-Z0-9][A-Z0-9\-]{0,19}$`
   - Is this pattern acceptable, or should it allow lowercase, underscores, etc.?
   - **Decision:** [TBD]

2. **Cascade Delete Behavior**
   - If site is deleted, what happens to linked orders?
   - Options:
     - A) Prevent deletion if linked orders exist (current assumption)
     - B) Cascade delete orders (dangerous)
     - C) Orphan orders (set order.siteId = null)
   - **Decision:** Prevent deletion if linked orders exist (safest)

3. **Search Debounce Timing**
   - Current: 300ms debounce on search input
   - Is this acceptable, or should it be faster (200ms) or slower (500ms)?
   - **Decision:** [TBD] 300ms is reasonable default

4. **Page Size Default**
   - Current: 25 items per page
   - Should this be configurable per user?
   - **Decision:** 25 items default; configurable in org settings (future)

5. **Timezone Handling**
   - Site timestamps (createdDate, lastModified, lastCollectionDate) are stored in UTC
   - Should display use user's local timezone or UTC?
   - **Decision:** [TBD] Recommend local timezone display with timezone indicator

6. **Geospatial Precision**
   - Latitude/Longitude stored as DECIMAL(10,8) / DECIMAL(11,8) (8 decimal places = ~1.1mm accuracy)
   - Is this precision necessary, or can we reduce to 6 decimal places (~0.1m accuracy)?
   - **Decision:** [TBD] 8 decimal places recommended for environmental sampling; higher precision may not be needed

### 12.3 Future Enhancements (Post-Phase 1)

1. **Advanced Geospatial Features**
   - Map-based site visualization and search
   - Radius search (find all sites within X km of coordinate)
   - Boundary/zone filtering (e.g., all sites in protected area)

2. **Site History & Audit**
   - Full audit trail of site modifications (who, when, what changed)
   - Site status history (e.g., "Sampling started on 2026-04-01, ended on 2026-06-30")

3. **Site Categorization & Grouping**
   - Site projects/campaigns
   - Sampling protocols per site (linked to S-01 compliance standards)
   - Custom site attributes (key-value pairs)

4. **Integration with Mapping Services**
   - Google Maps / OpenStreetMap embedding
   - GPS coordinates validation against map services
   - Address geocoding

5. **Environmental Monitoring Alerts**
   - Threshold alerts (e.g., "No samples collected from this site in 30 days")
   - Site condition alerts (linked to field observations)

6. **Data Quality & Reporting**
   - Site completeness score (% of fields filled)
   - Geographic coverage heatmap
   - Sampling frequency analytics per site

7. **Bulk Site Operations**
   - Batch edit (update multiple sites)
   - Merge duplicate sites
   - Archive old sites

8. **Mobile Field Data Collection**
   - Mobile app for on-site sampling data entry (linked to SamplingSite)
   - Photo/media capture at collection time

---

## Appendix A: i18n Key Reference

**Complete i18n key mapping for implementation:**

```
openELIS.site.registry.title = "Sampling Site Registry"
openELIS.site.registry.description = "Manage environmental sampling locations"
openELIS.site.registry.breadcrumb = "Site Registry"

openELIS.site.code = "Site Code"
openELIS.site.name = "Site Name"
openELIS.site.type = "Site Type"
openELIS.site.type.WATER_SOURCE = "Water Source"
openELIS.site.type.AIR_MONITORING = "Air Monitoring"
openELIS.site.type.VECTOR_TRAP = "Vector Trap"
openELIS.site.type.SOIL_SEDIMENT = "Soil/Sediment"
openELIS.site.type.OTHER = "Other"

openELIS.site.subtype = "Subtype"
openELIS.site.region = "Region"
openELIS.site.district = "District"
openELIS.site.townVillage = "Town/Village"
openELIS.site.address = "Address"
openELIS.site.latitude = "Latitude"
openELIS.site.longitude = "Longitude"
openELIS.site.elevation = "Elevation (m)"
openELIS.site.description = "Description"
openELIS.site.environmentalZone = "Environmental Zone"
openELIS.site.environmentalZone.URBAN = "Urban"
openELIS.site.environmentalZone.SUBURBAN = "Suburban"
openELIS.site.environmentalZone.RURAL = "Rural"
openELIS.site.environmentalZone.INDUSTRIAL = "Industrial"
openELIS.site.environmentalZone.AGRICULTURAL = "Agricultural"
openELIS.site.environmentalZone.PROTECTED = "Protected"

openELIS.site.contactPerson = "Contact Person"
openELIS.site.contactPhone = "Contact Phone"
openELIS.site.active = "Active"
openELIS.site.inactive = "Inactive"
openELIS.site.lastCollectionDate = "Last Collection Date"
openELIS.site.totalCollections = "Total Collections"
openELIS.site.source = "Source"
openELIS.site.source.LOCAL = "Local"
openELIS.site.source.HUB = "Hub"
openELIS.site.createdDate = "Created Date"
openELIS.site.lastModified = "Last Modified"

openELIS.site.actions = "Actions"
openELIS.site.action.view = "View"
openELIS.site.action.edit = "Edit"
openELIS.site.action.save = "Save"
openELIS.site.action.cancel = "Cancel"
openELIS.site.action.deactivate = "Deactivate"
openELIS.site.action.reactivate = "Reactivate"
openELIS.site.action.delete = "Delete"
openELIS.site.action.newSite = "New Site"
openELIS.site.action.import = "Import"
openELIS.site.action.export = "Export"
openELIS.site.action.search = "Search"
openELIS.site.action.select = "Select"
openELIS.site.action.changeSite = "Change Site"

openELIS.site.message.created = "Site created successfully"
openELIS.site.message.updated = "Site updated successfully"
openELIS.site.message.deleted = "Site deleted successfully"
openELIS.site.message.deactivated = "Site deactivated successfully"
openELIS.site.message.reactivated = "Site reactivated successfully"
openELIS.site.message.imported = "Imported {count} sites successfully"
openELIS.site.message.noResults = "No sites found. Click 'New Site' to create one."
openELIS.site.message.notFound = "Site not found"

openELIS.site.validation.codeRequired = "Site code is required"
openELIS.site.validation.codeInvalid = "Site code must start with alphanumeric and contain only alphanumeric characters and hyphens (max 20 chars)"
openELIS.site.validation.codeDuplicate = "Site code already exists"
openELIS.site.validation.nameRequired = "Site name is required"
openELIS.site.validation.nameTooLong = "Site name is too long (max 255 characters)"
openELIS.site.validation.typeRequired = "Site type is required"
openELIS.site.validation.latitudeInvalid = "Latitude must be between -90 and 90"
openELIS.site.validation.longitudeInvalid = "Longitude must be between -180 and 180"
openELIS.site.validation.phoneInvalid = "Phone number format is invalid"
openELIS.site.validation.regionNotFound = "Region not found"
openELIS.site.validation.districtNotFound = "District not found in selected region"

openELIS.site.filter.region = "Filter by Region"
openELIS.site.filter.district = "Filter by District"
openELIS.site.filter.townVillage = "Filter by Town/Village"
openELIS.site.filter.siteType = "Filter by Site Type"
openELIS.site.filter.activeStatus = "Active Status"
openELIS.site.filter.reset = "Reset Filters"
openELIS.site.filter.activeOnly = "Active Only"
openELIS.site.filter.inactiveOnly = "Inactive Only"
openELIS.site.filter.all = "All"

openELIS.site.import.title = "Import Sites"
openELIS.site.import.uploadFile = "Select CSV File"
openELIS.site.import.selectFile = "Choose File"
openELIS.site.import.maxSize = "Max file size: 10 MB"
openELIS.site.import.preview = "Preview"
openELIS.site.import.validation = "Validation"
openELIS.site.import.validationResults = "{valid} rows valid, {invalid} rows with errors"
openELIS.site.import.proceed = "Import {count} sites"
openELIS.site.import.downloadTemplate = "Download CSV Template"

openELIS.site.export.title = "Export Sites"
openELIS.site.export.allSites = "Export all sites"
openELIS.site.export.filteredResults = "Export filtered results"
openELIS.site.export.format = "Format: CSV"
```

---

## Appendix B: CSV Import/Export Template

**sampling-sites-template.csv**
```
code,name,type,subtype,regionCode,districtCode,townVillage,address,latitude,longitude,elevation,environmentalZone,description,contactPerson,contactPhone
WS-001,Sungai Ciliwung - Manggarai,WATER_SOURCE,River,DKI,JAKARTA_SOUTH,Manggarai,"Jalan Ciliwung, beside wastewater treatment plant",-6.212345,106.789012,50.5,Industrial,"Downstream of industrial zone. Access via East Gate. Bring waders.",Ibu Siti,+62-21-1234567
WS-002,SD Negeri 1 Well,WATER_SOURCE,Well,DKI,JAKARTA_CENTRAL,Pondok Kelapa,Jalan Pendidikan No. 5,-6.150123,106.850456,30.0,Suburban,"School well. Contact Pak Bambang before 10 AM.",Pak Bambang,0812-3456-7890
AT-001,Air Monitoring Station - Jakarta North,AIR_MONITORING,Fixed Station,DKI,JAKARTA_NORTH,Pluit,"Jalan Penjaringan, rooftop of building 5",-6.110234,106.780567,15.0,Urban,"Fixed station on rooftop. Contact building maintenance.",,
VT-001,Mosquito Trap - School Zone A,VECTOR_TRAP,"Mosquito Trap (Light Trap)",BALI,BADUNG,Ubud,"Seminyak area, near school",-8.680912,115.170234,50.0,Urban,"Light trap, emptied twice weekly.",Ibu Rina,+62-361-223344
```

---

**End of FRS Document**

**Document Version:** 1.0
**Last Updated:** 2026-04-02
**Status:** Ready for Development
