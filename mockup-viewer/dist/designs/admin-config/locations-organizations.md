# Locations & Organizations: Functional Requirements Specification

**Version:** 0.3 (post-analyze, ready for handoff)
**Date:** 2026-09-28
**Author:** Casey Iiams-Hauser, Director of Product
**Status:** Draft, awaiting review
**Supersedes:** `designs/admin-config/organizations-management.md` (Region/District/Facility/Ward spec, which assumed separate tables that do not exist)
**Related:** S-02 Sampling Site Registry (OGC-531, under OGC-527), Catalog CSV import (OGC-1194, PR #4329), Address hierarchy configuration loader, Environmental and Vector Order Entry v4
**Jira:** [OGC-1363](https://uwdigi.atlassian.net/browse/OGC-1363)
**Decisions:** D-106 to D-112 (decision log)
**Preview:** `locations-organizations.html`

---

## Lab Context

### Current State

Every OpenELIS deployment needs a list of the places it deals with: the geographic areas patients live in (for example province, district, sub-district, village), the facilities that send samples (hospitals, clinics, health centres), the wards or departments inside those facilities, the reference laboratories samples are referred to, and, for environmental and vector work, the sampling sites where water, soil or mosquito traps are collected.

Today these live in two places. Facilities, wards and geographic areas are all "organizations" and are edited one at a time on **Admin → Organization Management**, a flat table that can only be searched by name. Sampling sites are edited separately under **Vector Surveillance Setup → Sampling Sites**, which has a much richer form (site type, GPS coordinates, contact person, location lookup). Geographic areas can only be loaded in bulk from a CSV file that a server administrator places in the configuration folder before the system first starts. There is no bulk path for facilities, wards or sites at all.

### Pain

- An implementer bringing up a generic (non-country-configured) install for a district with 140 health centres types each one by hand, then types each centre's wards by hand, on a form where "Active" is a free-text box expecting "Y" or "N".
- When the Ministry of Health issues an updated facility list (new facilities, renamed ones, closed ones), there is no way to apply it. Someone compares spreadsheets by eye and edits records one by one, and closed facilities stay selectable in order entry because nobody finds them.
- Geographic areas added after install need a server administrator and a restart, so labs live with a stale village list.
- The list cannot be filtered by kind, so finding "all referral labs" or "all inactive clinics" means paging through everything. Codes that reporting relies on (facility codes in national reports) are stored but not visible or searchable anywhere.
- Adding a ward means opening the ward as its own organization and picking its parent facility from a list, instead of adding it from the facility.
- Facilities have no GPS coordinates, so maps and outbreak signals can place a mosquito trap but not the clinic that sent a patient sample.

### What Changes

One admin menu, **Locations & Organizations**, holds every place the lab deals with. An admin can move between organizations, sampling sites and geographic areas, filter by organization type, location, category and active status, and search by name, code or any identifier. A facility's wards and departments are listed under it and added in place. Every record, whether a clinic or a mosquito trap, gets the same fuller profile: code, location, address, GPS, contact.

The Ministry's updated facility list is uploaded as a CSV file. OpenELIS shows exactly what will happen before anything is saved: 12 new, 31 updated, 4 to be deactivated because they are no longer on the list, 2 that need a decision because the name matches two existing records. The admin resolves those two, applies, and the closed facilities disappear from order entry the same day. History is kept, because nothing is deleted and existing records keep their internal identity, so past orders still point at the same facility. Generic-distro installs and post-install changes use the same file format the startup loader uses for configured distributions. Every change records who made it, when, and what it was before, and the referral labs the lab depends on show when their next review is due, so the ISO 15189 assessor's questions about location data and referral labs have answers on screen.

---

## Overview

Locations & Organizations replaces Organization Management and absorbs the Sampling Sites admin page. It is built on the existing Organization record. Sampling sites become Organizations of a new "Sampling site" type, with their site-only details (site type, subtype, environmental zone) kept in the existing sampling-site record linked one-to-one. Every kind of record therefore shares one list, one search, one code and active model, one detail form and one CSV import. The sampling site's richer profile (GPS, contact person, description, location lookup) is used as the template for every kind.

The feature adds:

1. Filterable, searchable lists by kind, organization type and status, with code visible and searchable.
2. Inline editing, with wards (wards, departments) managed from their parent facility.
3. A unified detail form built on the sampling site form.
4. A GUI import that matches the configuration loader's file format, with two modes, **Add & update** and **Replace**, a preview before apply, and a decision queue for ambiguous matches.
5. Export in the import format.
6. Usage counts and a guard before deactivating anything still in use.
7. Any number of identifiers per record, each with a label the admin types (for example "DHIS2 ID", "CLIA"), with one marked as the reporting code.
8. Referral-lab approval, accreditation and review tracking (ISO 15189 clause 6.8).
9. Undo a deactivation.
10. A change history per record (who, when, old and new values), for ISO 15189 traceability.
11. Facility category and ownership, ward / dept service type for AMR reporting, and keyboard and screen-reader support.

Items considered and deliberately left for later are listed under **Deferred** at the end.

### Navigation & URL

- **SideNav placement:** `Admin → Locations & Organizations`, in the global **Organization** bucket (D-010), in the slot Organization Management occupies today. Submenu items, in order: **Organizations**, **Sampling Sites**, **Geographic Areas**, **Import / Export**. Wards have no menu item of their own: a ward always belongs to an organization, so wards live inside their organization's row on the Organizations page. The **Sampling Sites** item under Vector Surveillance Setup is removed.
- **Breadcrumb:** `Home / Admin Management / Locations & Organizations / <view>` (keeps the shipped "Admin Management" crumb label, D-013)
- **URL routes:**

| View | Route |
|---|---|
| Organizations (landing page) | `/MasterListsPage/locations` |
| Sampling Sites | `/MasterListsPage/locations/sites` |
| Geographic Areas | `/MasterListsPage/locations/areas` |
| Import / Export | `/MasterListsPage/locations/import` |

- **Deep links:** list filters are encoded in the query string (`?type=<typeId>,<typeId>&status=active|inactive|all&q=<text>&page=<n>`). An expanded record is `?id=<organizationId>`. Pasting a URL restores the same view.
- **Redirects:**

| Old route | New route |
|---|---|
| `/MasterListsPage/organizationManagement` | `/MasterListsPage/locations` |
| `/MasterListsPage/organizationEdit?ID=<id>` | the matching view with `?id=<id>` expanded (`ID=0` opens Add) |
| `/MasterListsPage/vectorSurveillanceSetup/sampling-sites` | `/MasterListsPage/locations/sites` |

---

## User Stories

1. As an **Admin** bringing up a new install, I want to upload the national facility list, with its wards, as a CSV file so that I don't key in hundreds of records by hand.
2. As an **Admin**, I want to apply the Ministry's updated facility list in Replace mode so that new facilities are added, renamed ones are updated without losing their history, and closed ones are deactivated and stop appearing in order entry.
3. As an **Admin**, I want to filter by organization type and active status and search by name or code so that I can find "all inactive referral labs" or facility "PMGH" in seconds.
4. As an **Admin**, I want to add a ward or department directly from its facility so that wards are always attached to the right parent.
5. As an **Admin** for an environmental or vector lab, I want sampling sites managed with the same tools as facilities (codes, filters, import, export) so that site lists stay current without a separate process.
6. As an **Admin** acting as quality manager before an ISO 15189 assessment, I want to see who changed each organization and when, and which referral labs are due for review, so that I can show the assessor that our location data is controlled.

---

## Functional Requirements

### A. Record model and kinds

| ID | Requirement | Notes |
|---|---|---|
| FR-A1 | Every record in this menu is an Organization. Its **kind** is derived from its organization type(s): **Geographic area** (a type with a hierarchy level), **Ward** (type `dept`; a ward, department or clinic inside a facility. Labelled "Ward / Dept" in the UI so it is not confused with Lab Units, which are test sections, or with a geographic level called "ward"), **Sampling site** (new type "Sampling site"), **Facility** (any other type, e.g. `referring clinic`, referral lab). | Kind is a display grouping over existing types, not a new stored field. |
| FR-A2 | A record may carry more than one organization type, as today (e.g. a hospital that is both a referring clinic and a referral lab). The Sampling site type cannot be combined with a geographic-area type or the `dept` type, and a geographic-area type cannot be combined with any other type. | Validation on save and on import. |
| FR-A3 | Each sampling site is an Organization of type "Sampling site", linked one-to-one to its sampling-site record, which keeps site type, subtype, environmental zone and existing links to vector collections and orders. Existing sampling sites are backfilled with a linked Organization at migration (code, name, active, contact, phone, GPS copied; parent = current location). | Orders keep referencing the sampling-site id; nothing downstream is rewired. |
| FR-A4 | Parent rules: a **Ward's** parent must be a Facility (required). A **Facility's** or **Sampling site's** parent, shown as **Location**, is an optional Geographic area. A **Geographic area's** parent must be an area exactly one hierarchy level above it (required except at level 1). | Matches how referring-site departments and the address hierarchy already work. |
| FR-A5 | Internal identity (Organization id and FHIR UUID) never changes through edit or import. Codes and names can change without breaking links from orders, patients, referrals or FHIR exchange. | Match key rules are in section F. |

### B. Lists, filters and search

| ID | Requirement | Notes |
|---|---|---|
| FR-B0 | **Page explainers.** Under each page title, one short paragraph says what the page holds, in plain words (texts in the Localization table under `help.locations.page.*`). **Organizations**: the health facilities and laboratories the lab works with, which send patient samples or receive referred ones, with their wards / depts. **Sampling Sites**: fixed places in the environment where non-patient samples are collected (water source, mosquito trap, air monitor, soil plot); a site does not order tests, it records where a sample was taken. **Geographic Areas**: the country's administrative divisions, used for patient addresses and to place organizations and sites. On Organizations and Sampling Sites, a collapsed **"Organization or sampling site: which do I need?"** panel compares the two side by side (people vs environment; orders and receives reports vs fixed collection spot tracked over time), with PNG-style examples of each, the tip that a water tank at a hospital is a sampling site placed in the same area as the hospital, and a link to the other page. | Answers the most common setup question before it becomes a support ticket. |
| FR-B1 | Each list view shows a server-paged DataTable, 25 rows by default, with page sizes 25, 50 and 100. | Replaces client-side paging over one server page. |
| FR-B2 | Columns: **Name**, **Code** (the reporting code, section I), **Type** (tags, one per organization type, with the facility category underneath in small text), **Location**, **Wards / Depts** (Organizations view only: count of active wards / depts), **In use** (count of orders referencing the record), **Active** (toggle) and **Actions** (Edit). **Location** shows the full area path top-down in one consistent form (`Southern Region / National Capital District / Moresby South`) with the most specific area in bold and its level as a small label ("District"). Sorting by Location sorts by that full path, so records group by region, then province, then district, whatever depth each record was placed at. Sampling Sites view swaps Wards / Depts for **Site type**. Referral labs whose review is overdue show a red **Review overdue** tag next to the name (section J). | Active state is always text plus colour ("Active" / "Inactive" beside the toggle), never colour alone, and never "Y"/"N". |
| FR-B3 | **Search** matches, case-insensitively, anywhere in name, reporting code, any other identifier value (section I), short name, or a former name (from history, section K). It is debounced (300 ms) and resets to page 1. An exact identifier match is listed first; a match on a former name or a non-reporting identifier says so under the row ("Formerly Nine Mile Clinic", "DHIS2 ID Rp1k2mPqH3x"). | |
| FR-B4 | **Type filter**: a filterable MultiSelect of organization types available in the current view. Selected types show as removable tags with their names, never as a bare count. Multiple types are OR-combined, and combined with Location, Category, Ownership, Status and Search by AND. On Organizations, **Category** and **Ownership** filters (MultiSelect, section C) and a **Review overdue** quick filter (referral labs, section J) sit beside it. | Not shown on Geographic Areas, which uses the tree (FR-B7). |
| FR-B4a | **Location filter** (Organizations and Sampling Sites): a ComboBox over geographic areas, searchable by name or code, each option showing its path and level. Choosing an area shows every record placed in that area **or anywhere beneath it** (choosing Morobe Province includes records placed at Lae district and at Lae Urban LLG). The chosen area shows as a removable tag with its path. | One filter works whatever depth records were placed at. |
| FR-B5 | **Status filter**: Active (default), Inactive, All. Deactivated records are hidden by default (D-002). | |
| FR-B6 | The **Organizations** page lists facilities, laboratories and other organizations as rows. Wards are never top-level rows: they appear only in their organization's expanded row (section D), and the Type filter does not offer the `dept` type. Search also matches ward names and codes and returns the parent organization, auto-expanded, with the matching ward highlighted. | Wards always belong to an organization. |
| FR-B7 | **Geographic Areas** shows the hierarchy as a **nested tree table**. Each row is indented under its parent and shows Name, Code, Level (e.g. Province), count of child areas, Active toggle and actions. Rows expand and collapse; children load on expand, so a country with tens of thousands of villages stays fast. Level 1 loads expanded one level by default. **Search** shows every match *in context*: its ancestors are expanded and shown, and the match is highlighted, so "Lae Urban" appears under Momase / Morobe / Lae. **Row actions are visible, with no overflow menu:** an **Active** toggle (turning it off deactivates the area; blocked with an explanation while active areas, organizations or sites are inside it; turning it on is blocked while its parent is inactive), **Edit** (expands the row inline to name and code; a rename is recorded in history and the old name still matches in search), and, on every active row above the lowest level, an add button named for the level below ("+ Province" on a region, "+ District" on a province, "+ LLG" on a district). The add button opens a new inline row directly under the parent, indented one level, with Name (required) and Code, and the parent expands so the new area appears in place. "+ Add Region" in the toolbar adds a top-level area. | Replaces a flat level-by-level list: the nesting is the point. |
| FR-B8 | When a search finds nothing in the current view but matches records in another view, the empty state names them with links ("2 matches in Sampling Sites"), so a code lookup never needs to know the record's kind. | Replaces a separate "All" view. |
| FR-B9 | Empty states: no records at all ("No facilities yet. Add one, or import a file."), with **Add** and **Import** actions. No matches ("No records match these filters.") with a **Clear filters** action. Loading shows a DataTable skeleton. | |
| FR-B10 | **Row actions are visible, with no overflow menu, on every page** (Organizations, Sampling Sites, Geographic Areas, and ward / dept rows): an **Active** toggle and an **Edit** button. Turning the toggle off runs the deactivation guard (FR-E2) and offers Undo (FR-E4); turning it on is blocked while the parent is inactive (FR-E3). Edit expands the row inline (D-005). Geographic Areas rows also carry the add-sub-area button (FR-B7); **Move** for a ward / dept is offered inside its edit mode (FR-D3). Bulk actions on selected rows: **Deactivate**, **Reactivate**, **Export selected**. No Delete action exists anywhere (D-002). | One pattern across the menu. |

### C. Editing (inline)

| ID | Requirement | Notes |
|---|---|---|
| FR-C1 | Only the row's **Edit** button expands it inline to the detail form (D-005); clicking elsewhere on the row does not, so scrolling and selecting never open a form by accident. Only one row is expanded at a time. Unsaved changes prompt before collapsing or leaving the page. A long form (an organization with its wards / depts) shows **jump links** to its sections at the top and keeps a **sticky Save / Cancel bar** at the bottom of the viewport while any part of the form is on screen. | |
| FR-C2 | **Add** (toolbar) opens the same form as a new inline row at the top of the table, with the kind preset from the view (Facility on Organizations, Sampling site on Sampling Sites, the selected level on Geographic Areas). | |
| FR-C3 | The form is built from the sampling-site form and shows the sections relevant to the kind. **Identity:** Name (required); Short name; Organization type(s) (required; filterable MultiSelect with labelled tags); for organizations, **Category** and **Ownership** (single selects from admin-managed lists: for example Category = National referral hospital, Provincial hospital, District hospital, Health centre, Urban clinic, Aid post, Laboratory; Ownership = Government, Church, Private, NGO, Other); Description (for sites, with the helper "Include directions so someone else can find the exact spot"). (Active status is the row's toggle, not a form field; new records start active.) **Identifiers** (section I). **Location:** a Location ComboBox (typeahead, D-007) whose options show the full path and level, with the helper "Pick the most specific area you know. A district is fine if you don't know the LLG."; the existing address search that fills it; Street address, City, State/Province, Postal code; GPS latitude and longitude in decimal degrees (WGS84). **Contact:** Contact name, Phone, Email, Website. **Referral laboratory** (records with a referral-lab type; section J). **Site details** (Sampling site only): Site type, Subtype, Environmental zone. **Wards / Depts** (organizations only; section D). A **History** button in the form footer opens the record's history (section K). | Geographic areas show Name, Code and Parent only. |
| FR-C4 | Validation, inline on the field. Name required. An identifier value is unique among records of the same kind with the same identifier label (section I). GPS latitude between -90 and 90 and longitude between -180 and 180, decimal degrees. Email format. Parent required and of the right kind per FR-A4. Duplicate name within the same type and same parent is a warning ("Another active organization named '9 Mile Urban Clinic' exists here"), not a block. | |
| FR-C5 | Save writes the record and shows a success notification. On a version conflict (another admin saved first), the form keeps the user's input and shows the other admin's changes so the user can reapply. | Existing optimistic-lock behaviour, surfaced properly. |

### D. Wards under facilities

| ID | Requirement | Notes |
|---|---|---|
| FR-D1 | An organization's expanded row lists its wards / depts as inline rows: Name, Code, **Service type**, Contact name, Phone, Email, GPS, In use, Active toggle, Edit. Inactive wards / depts are hidden unless the list's Status filter includes Inactive. **Service type** (required for new wards / depts, select): Inpatient, Outpatient, Intensive care, Emergency, Maternity, Laboratory, Other. It maps to the WHONET / GLASS location-type codes that antimicrobial resistance surveillance exports need (mapping owned by M-09 WHONET Export). | Service type lets AMR reports split inpatient from outpatient isolates without a separate mapping step. |
| FR-D2 | **Add ward / dept** inserts a new inline row (Name and Service type required; Code, Contact name, Phone, Email, GPS optional). The ward / dept is saved with type `dept` and this organization as parent, and is active. Several can be added before saving. | Replaces creating a ward as a standalone organization. |
| FR-D2a | **GPS: own, else inherited.** A ward / dept has optional GPS latitude and longitude of its own (for example a clinic on a separate campus). When they are blank it uses its parent organization's coordinates, shown in the ward row as grey "inherited" values ("-9.4705, 147.1597 inherited from Port Moresby General Hospital"). Clearing a ward's own GPS returns it to inheriting. Moving a ward that inherits gives it the new parent's coordinates; a ward with its own GPS keeps it. Address is always the parent's. Contact name, phone and email are the ward's own, blank until set (no copy from the parent). | Maps and M-16 cluster detection read the ward's own GPS if set, else the parent's. |
| FR-D3 | A ward / dept row shows an Active toggle and Edit. In edit mode it can be renamed, recoded, given contact details and its own GPS, or **moved** to another organization (Move opens an organization ComboBox). Moving keeps the ward / dept's identity and its order history. | |
| FR-D4 | Order entry's referring-site department picker shows only active wards of the selected facility. | Existing behaviour, confirmed with inactive wards hidden. |

### E. Deactivation and usage guard

| ID | Requirement | Notes |
|---|---|---|
| FR-E1 | Deactivate and Reactivate are available per row and in bulk. Deactivated records are hidden from every picker in order entry, patient entry, referral and vector/environmental collection. They still display by name on existing orders, results and reports, and this is intended: history must show where a sample actually came from. The UI says so wherever deactivation happens: in the deactivate confirmation, on the Inactive status tag's tooltip, and as helper text when the Status filter is set to Inactive or All ("Inactive records are hidden from order entry and other pickers. They still appear on existing orders and reports."). | |
| FR-E2 | Before deactivating a record that is **in use** (open orders not yet finalised reference it) or that has **active children** (wards, child areas, or sites located in it), a confirmation modal lists the counts ("Kisenyi HC has 14 open orders and 3 active wards") and offers **Deactivate facility only** or **Deactivate facility and its 3 wards**. Children are never deactivated silently. | Destructive confirm, a permitted modal (D-005). |
| FR-E3 | Reactivating a ward, child area or site whose parent is inactive is blocked, with the message "Reactivate <parent> first." | |
| FR-E4 | **Undo after deactivation.** Every deactivation from a toggle (single or bulk, after any confirmation) shows a notification with an **Undo** link for 10 seconds ("Kilakila Clinic deactivated. Undo"). Undo reactivates exactly what was deactivated, including children deactivated with it, and both actions appear in history. | Protects against a stray click in a long table. |

### F. Import (CSV)

| ID | Requirement | Notes |
|---|---|---|
| FR-F1 | **Import / Export** accepts one or more CSV files. It uses the configuration import framework the catalog import uses (OGC-1194), with three import areas: **organizations** (facilities, wards, sampling sites), **address-hierarchy levels** and **address-hierarchy values** (existing formats, unchanged). Each file's area is inferred from its name (`organizations-*.csv`, `*-levels.csv`, `*-values.csv`) and can be changed before preview. Areas load in dependency order: levels, then values, then organizations. | The same files dropped in the configuration folder at startup load the same way. One mechanism. |
| FR-F2 | Each list view's **Import** button opens this page with that view's area preselected. | |
| FR-F3 | **Mode** (required, chosen before preview): **Add & update**: add new records, update matched ones, leave everything else alone. **Replace**: as Add & update, plus deactivate existing records the file does not include, within this scope: (a) **only the organization types that appear in the file** (a sites-only file cannot deactivate a facility); (b) for **wards / depts**, only under organizations that have **at least one ward / dept row in the file** (a file listing two new wards at Port Moresby General Hospital replaces Port Moresby General Hospital's wards and no one else's); (c) never records from the facility registry (section H). Once files are added, the Replace option states this scope for the actual file in plain words, for example: "This file has Referring clinic and Ward / Dept rows. Referral labs, sampling sites and geographic areas will not change. Wards / depts will only be replaced at Port Moresby General Hospital and Gerehu General Hospital." | Replace deactivates. It never deletes. |
| FR-F4 | **Matching** each row to an existing record, in order: (1) **Any identifier** (section I): the reporting `code`, or any `identifier:<label>` column (for example `identifier:DHIS2 ID`), when an existing record of the same kind has that label and value. (2) Otherwise **Name**, within the same type and, for wards and areas, the same parent. Case-insensitive, surrounding spaces ignored, repeated spaces collapsed. Former names (from history) and remembered aliases also match. (3) No match: a **new** record. (4) Two or more matches, or identifiers pointing at two different records: the row goes to the **decision queue** (FR-F8). A matched record keeps its internal id and FHIR UUID. | Codes are for reporting. Identity is internal. |
| FR-F5 | Updating a matched record: a non-blank cell overwrites the stored value, and a blank cell leaves the stored value unchanged. A blank code never clears an existing code. `active=N` deactivates. In Replace mode, a matched record that is inactive and whose row does not say `active=N` is **reactivated**. | Same blank-cell rule as the catalog loader. |
| FR-F6 | **Preview** evaluates every row against current data without saving anything and shows: totals per area (New, Updated, Unchanged, Reactivated, Deactivated, Needs decision, Rejected); a filterable row list; field-level before/after for updated rows; the full list of records Replace will deactivate, by name, code, location and in-use count, with in-use ones flagged and the ward scope restated; possible renames (FR-F12); and rejected rows with line number and reason. | The preview is the outcome, not an estimate. |
| FR-F7 | Row rejection reasons: missing name or type; unknown organization type; a geographic-area level used as a type in an organizations file ("Geographic areas are imported with the geographic levels and areas files"); parent not found; parent of the wrong kind; invalid GPS; identifier value duplicated inside the file for the same label; a type combination that FR-A2 forbids. A rejected row is skipped and the rest of the file can still be applied. | |
| FR-F8 | **Decision queue**: each ambiguous row shows the candidate records (name, code, location or parent, status, in use) and the choices **Use this record**, **Create new**, or **Skip row**. **Remember this name** (optional) stores the choice as an alias so the same spelling resolves automatically next time. Apply is enabled only when every queued row, and every possible rename (FR-F12), has a decision. | Reuses `unresolved_reference` / `reference_alias` from OGC-1194. |
| FR-F12 | **Possible renames.** A row that would create a **new** record is paired with an existing record of the same type, in the same location (or under the same parent, for wards / depts), whose name is similar (after normalising case and spacing: one name contains the other, or they share at least 60% of their words) and that the file does not otherwise match. In Replace mode this catches the case where a rename would otherwise create a new record and deactivate the old one. Each pair is shown side by side with the choices **Same place, renamed** (update the existing record with the row, keeping its history; the default is not preset) or **Different places** (create the new record; in Replace mode the existing one is deactivated). In Add & update mode the same check flags possible duplicates. | Prevents splitting a facility's order history across two records. |
| FR-F9 | **Apply** requires a confirmation that restates the counts. In Replace mode it also requires ticking "I understand N records will be deactivated". Apply saves per record, reports the final counts, and offers **Download result report** (CSV of every row with its outcome). | |
| FR-F10 | Every preview and apply is recorded as an import run (who, when, files, mode, counts), listed as **Recent imports** on the page with its result report downloadable. | Existing `configuration_import_run`. |
| FR-F11 | Records from the facility registry are excluded from Replace deactivation and marked **Registry** in lists and in the preview. Rows that change a registry-supplied field on a registry record are flagged in the preview: "Will be overwritten by the next registry sync". | See section H. |

### G. Export and template

| ID | Requirement | Notes |
|---|---|---|
| FR-G1 | **Export** on any list exports the rows matching the current filters (all pages) in the import format of that area: organizations CSV for facilities, wards and sites; flattened address-hierarchy values CSV (with `Name%Code`) for geographic areas. | Round trip: export, edit, re-import in Replace mode. |
| FR-G2 | **Download template** gives the header row of each area's format with one example row, and a short column guide. | |
| FR-G3 | Exports include inactive records only when the Status filter includes them, and always include the `active` column. | |

### H. Facility registry (when configured)

Some deployments sync facilities from a national facility registry (for example GOFR) over FHIR on a schedule (`org.openelisglobal.facilitylist.fhirstore`; every 10 days by default). When the sync is on, the registry is the source of truth for the records it supplies. This menu is then mainly for deployments with no registry, and for local extras the registry does not hold (wards / depts, sampling sites, a private clinic the registry has not listed yet).

| ID | Requirement | Notes |
|---|---|---|
| FR-H1 | Registry records carry a **Registry** tag in every list and in the tree. Hovering it explains: "Comes from the facility registry. The registry is the source of truth for this record." | |
| FR-H2 | When a user edits a registry record, the form shows a warning notification above the fields: "This record comes from the facility registry. Changes to fields the registry supplies (such as name, code, type, location, address and active status) will be overwritten on the next sync. To change them for good, update the registry. Wards / depts and other local details you add here are kept." Registry-supplied fields show a small "From registry" marker. Editing is allowed, not blocked. | Explain, don't lock. |
| FR-H3 | Deactivating a registry record shows the same explanation in the confirmation, since the next sync may reactivate it. | |
| FR-H4 | Adding a new organization while the sync is on is allowed and creates a local record (no Registry tag). If a later sync brings in a record with the same code, or the same name in the same location, it is listed in the next import-run report as a possible duplicate for an admin to resolve. | Local extras stay local. |

### I. Identifiers

Modelled the way FHIR models them: a record has any number of identifiers, each a label (FHIR `Identifier.type.text`) and a value.

| ID | Requirement | Notes |
|---|---|---|
| FR-I1 | The form's **Identifiers** section lists the record's identifiers as inline rows: **Label** (free text, required; a ComboBox that suggests labels already used on other records, such as "DHIS2 ID", "National facility code", "CLIA", and accepts a new one), **Value** (required), and a **Reporting code** radio. **Add identifier** adds a row; **Remove** removes one. | No admin-managed list of identifier types. |
| FR-I2 | Exactly one identifier is marked the **reporting code**. It is what lists, search results, exports and printed reports show as **Code**. A record may have no identifiers; then Code shows "none". | |
| FR-I3 | A value must be unique among records of the same kind that carry an identifier with the same label (case-insensitive). A clash is an inline error naming the other record. | |
| FR-I4 | At migration, each existing code becomes an identifier labelled "Code" and marked as the reporting code; each existing CLIA number becomes an identifier labelled "CLIA". There is no separate CLIA field. | |
| FR-I5 | Identifiers export and import as one CSV column per label (`identifier:<label>`), and export to FHIR as `Identifier` with `type.text` = label; the reporting code is marked `use = official`. | Matches the FHIR facility sync's shape. |

### J. Referral laboratories

A referral laboratory is an externally provided service under ISO 15189:2022 clause 6.8: the lab must choose it, evaluate it, and review it on a schedule.

| ID | Requirement | Notes |
|---|---|---|
| FR-J1 | Records with a referral-lab type have a **Referral laboratory** form section: Approval status (Approved, Under evaluation, Suspended, Not approved; required), Accreditation body, Accreditation number, Accreditation expiry date, Last review date, Next review due (date), Review notes. | |
| FR-J2 | Lists show a red **Review overdue** tag when Next review due has passed, and an amber **Accreditation expired** tag when the expiry date has passed. A quick filter lists only overdue or expired referral labs. | |
| FR-J3 | Approval status, review and accreditation changes are recorded in history (section K), so the lab can show an assessor when each lab was last evaluated and by whom. | |

### K. History

ISO 15189:2022 clauses 7.11 (information management) and 8.4 (records) require that changes to lab information are traceable: who changed what, when, and from what value. They do not require a stated reason for changes to reference data like this, so none is asked for.

| ID | Requirement | Notes |
|---|---|---|
| FR-K1 | Every create, edit, activate / deactivate, move, identifier change, referral-lab review change, import-run change and registry sync change writes a history entry: date and time, user (or "Import run #N" / "Registry sync"), action, and each field's old and new value. | Reuse OpenELIS's existing audit history for audited tables where it covers this (developer to confirm). |
| FR-K2 | **History** in the form footer opens the record's history inline as a timeline, newest first, filterable by action. Each import-run entry links to its run in Recent imports. | |
| FR-K3 | History is read-only and kept for as long as the record exists (records are never deleted). Former names are derived from history and used by search and import matching, so a renamed record is still found by its old name. | |

### L. Accessibility

| ID | Requirement | Notes |
|---|---|---|
| FR-L1 | Geographic Areas tree rows are reachable by keyboard: each row is focusable and exposes its level and expanded state; Up and Down move between rows, Right expands, Left collapses (or moves to the parent), Enter opens Edit. | WCAG 2.1 AA |
| FR-L2 | Every toggle, button and checkbox in a row has an accessible name that includes the record ("Active, Port Moresby General Hospital", "Edit Port Moresby General Hospital"). Status, overdue and registry markers are text plus colour, never colour alone. All text meets 4.5:1 contrast. | WCAG 2.1 AA |
| FR-L3 | Notifications with Undo stay visible at least 10 seconds and until focus leaves them, and are announced to screen readers. | WCAG 2.2.1 Timing adjustable |

### M. Organizations CSV format

One file can hold facilities, wards and sampling sites together. Columns are addressed by header name; order does not matter; unknown columns are ignored with a warning.

| Column | Required | Meaning |
|---|---|---|
| `type` | Yes | Organization type name(s), separated by `;` (e.g. `referring clinic;referral lab`, `dept`, `sampling site`) |
| `name` | Yes | Display name |
| `code` | No | The reporting code (an identifier labelled "Code" unless the record's reporting identifier has another label) |
| `shortName` | No | Existing short name / prefix |
| `parentCode`, `parentName`, `parentType` | Wards: yes; others: no | The parent. Matched by `parentCode`, else by `parentName` within `parentType`. For facilities and sites, the parent is a geographic area. |
| `active` | No | `Y` / `N`, default `Y` for new rows |
| `streetAddress`, `city`, `state`, `zipCode` | No | Address |
| `gpsLatitude`, `gpsLongitude` | No | Decimal degrees |
| `contactName`, `phone`, `email`, `internetAddress` | No | Contact |
| `identifier:<label>` | No | One column per identifier label, for example `identifier:DHIS2 ID`, `identifier:CLIA`. Used for matching and stored as identifiers (section I). A label not yet used is created. |
| `category`, `ownership` | No | Organizations: values from the admin-managed lists (FR-C3) |
| `serviceType` | Wards / depts: yes for new rows | Inpatient, Outpatient, Intensive care, Emergency, Maternity, Laboratory, Other |
| `siteType`, `subtype`, `environmentalZone`, `description` | No | Sampling sites (`description` allowed for any kind) |
| `approvalStatus`, `accreditationBody`, `accreditationNumber`, `accreditationExpiry`, `lastReviewDate`, `nextReviewDue` | No | Referral laboratories (section J); dates as `YYYY-MM-DD` |

For ward / dept rows (`type` = `dept`), `contactName`, `phone`, `email`, `gpsLatitude` and `gpsLongitude` apply to the ward; blank GPS means the ward inherits its parent's. Address columns are ignored with a warning, because a ward always uses its parent's address. Exports leave inherited GPS and address blank for wards.

Example:

```
type,code,name,identifier:DHIS2 ID,category,ownership,serviceType,parentCode,parentName,parentType,active,gpsLatitude,gpsLongitude,contactName,phone
referring clinic;referral lab,PMGH,Port Moresby General Hospital,Rp1k2mPqH3x,National referral hospital,Government,,NCD-MS,,,Y,-9.4705,147.1597,Dr. Anna Kila,+675 324 8200
dept,PMGH-OPD,Outpatient Department,,,,Outpatient,PMGH,,,Y,,,Sister Ruth Moi,+675 324 8210
dept,PMGH-MAT,Maternity Ward,,,,Maternity,PMGH,,,Y,,,,
sampling site,VT-LAE-03,Bumbu Settlement light trap,,,,,,Lae Urban,LLG,Y,-6.7160,147.0010,John Wari,+675 7123 4567
```

---

## Information & Data

**Organization** (existing): id, FHIR UUID, name, short name, code (exists, currently hidden in the UI), active flag (stored `Y`/`N`), parent organization, organization types (many), street address, city, state, zip code, phone, email, internet address, CLIA number (kept in the database but no longer shown: see Dependencies). Lifecycle: active, then deactivated, then reactivated. Never deleted.

**Organization type** (existing): name, description, hierarchy level (set for geographic-area levels). Existing type names relied on in code: `referring clinic`, `dept`, `Health Region`, `Health District`, plus the level types created by the address-hierarchy loader.

**Sampling site** (existing `vector_sampling_site`): code, name, site type, subtype, contact name, contact phone, GPS latitude/longitude, environmental zone, description, location (`location_org_id`), source, active. After this feature, its shared fields are read from and written to its linked Organization. Site type, subtype and environmental zone stay on the site record.

**Import run and decision queue** (existing, from OGC-1194): `configuration_import_run`, `unresolved_reference`, `reference_alias`.

**In use** (derived, not stored): number of orders whose referring organization, referring department, or sampling site is this record, split into open (not finalised) and total.

**New information** (all declared in Dependencies): identifiers (label, value, reporting-code flag); category and ownership lists and their values on organizations; ward / dept service type; referral-lab approval, accreditation and review fields; record history entries.

Uniqueness: identifier value unique within its label and kind. Name is not unique (warning only).

---

## Access

- **Who can use it:** users with the existing **Admin** role, as today for Organization Management and Sampling Sites. Users without Admin do not see the menu, and its routes redirect to the admin home.
- **Who can do what:** Admin can view, add, edit, deactivate, reactivate, import (both modes), resolve decisions, view history and export. There is no read-only variant in this release.

---

## Localization

Keys follow `[category].[feature].[identifier]` under the `locations` feature namespace. Existing `organization.*` and `vector.admin.samplingSite.*` field labels are reused where the meaning is identical (listed as "reuse").

| Key | English fallback | Context |
|---|---|---|
| `sidenav.label.admin.locations` | Locations & Organizations | SideNav group, breadcrumb |
| `sidenav.label.admin.locations.organizations` | Organizations | SideNav item, page title |
| `help.locations.page.organizations` | Organizations are the health facilities and laboratories your lab works with: the hospitals, clinics and health centres that send you patient samples, and the laboratories you refer samples to. Wards and departments inside an organization are listed under it. Organizations appear in order entry as the requesting site and in referrals as the destination lab. | Organizations page explainer |
| `help.locations.page.sites` | Sampling sites are fixed places in the environment where samples are collected that do not come from a patient: a water source, a mosquito trap, an air monitor, a soil plot. A site does not order tests. It records where a sample was taken, so results can be compared over time at the same spot. Each site sits in a geographic area and can have its own GPS point and contact person. | Sampling Sites page explainer |
| `help.locations.page.areas` | Geographic areas are the administrative divisions of the country, for example Region, Province, District and LLG. They are used for patient addresses and to say where each organization and sampling site is. Most deployments load them once from the national list, then add or correct areas here. To add an area inside another one, use the + button on the parent row: "+ District" on Morobe Province adds a district in Morobe. Use "+ Add Region" at the top for a new top-level area. | Geographic Areas page explainer |
| `label.locations.column.active` | Active | Column (toggle), every list |
| `label.locations.column.actions` | Actions | Column, every list |
| `button.locations.area.addChildLevel` | + {level} | Tree row button (level below) |
| `help.locations.page.import` | Load or update organizations, wards / depts, sampling sites and geographic areas from CSV files, in the same format the system uses at installation. Nothing is saved until you review the preview and apply it. | Import / Export page explainer |
| `label.locations.page.compare` | Organization or sampling site: which do I need? | Collapsed comparison panel |
| `help.locations.page.compare.org` | Add an organization when samples come from people seen there, when it orders tests or receives reports or referred samples, or when it has wards or departments that request tests. | Comparison: organization column |
| `help.locations.page.compare.site` | Add a sampling site when samples come from the environment (water, soil, air or insects), when you collect at the same fixed spot again and again, or when you want results for that spot over time, on a map. | Comparison: site column |
| `help.locations.page.compare.tip` | A water tank at a hospital is still a sampling site: the hospital is an organization, and the tank is a site placed in the same area. | Comparison footer |
| `sidenav.label.admin.locations.sites` | Sampling Sites | SideNav item, page title |
| `sidenav.label.admin.locations.areas` | Geographic Areas | SideNav item, page title |
| `sidenav.label.admin.locations.import` | Import / Export | SideNav item, page title |
| `label.locations.kind.facility` | Facility | Kind label |
| `label.locations.kind.ward` | Ward / Dept | Kind label (deployments can rename it in Translation Management, e.g. where "Ward" is also a geographic level) |
| `help.locations.ward` | Wards, departments or clinics inside this organization | Wards / Depts section helper |
| `label.locations.ward.inheritedGps` | {lat}, {lng} inherited from {parent} | Ward / dept GPS placeholder |
| `help.locations.ward.gps` | Leave blank to use {parent}'s location | Ward / dept GPS helper |
| `warning.locations.import.wardAddressIgnored` | Line {line}: address is ignored for wards / depts, which use their organization's address | Import warning |
| `message.locations.search.elsewhere` | {count} matches in {view} | Empty state link |
| `button.locations.area.expandAll` | Expand all | Tree toolbar |
| `button.locations.area.collapseAll` | Collapse all | Tree toolbar |
| `message.locations.area.searchContext` | {count} matches, shown with the areas they sit in | Tree search footer |
| `label.locations.kind.site` | Sampling site | Kind label |
| `label.locations.kind.area` | Geographic area | Kind label |
| `label.locations.column.name` | Name | Column |
| `label.locations.column.code` | Code | Column / field |
| `label.locations.column.type` | Type | Column |
| `label.locations.column.wards` | Wards / Depts | Column |
| `label.locations.column.location` | Location | Column |
| `label.locations.filter.location` | Location | Filter (includes areas beneath) |
| `help.locations.field.location` | Pick the most specific area you know. A district is fine if you don't know the LLG. | Location field helper |
| `help.locations.status.inactive` | Inactive records are hidden from order entry and other pickers. They still appear on existing orders and reports. | Status filter helper, tag tooltip |
| `warning.locations.registry.edit` | This record comes from the facility registry. Changes to fields the registry supplies will be overwritten on the next sync. To change them for good, update the registry. Wards / depts and other local details you add here are kept. | Registry record form |
| `label.locations.registry.field` | From registry | Field marker |
| `label.locations.import.replaceScope` | This file has {types} rows. {untouched} will not change. Wards / depts will only be replaced at {parents}. | Replace scope sentence |
| `label.locations.import.rename.title` | Possible renames | Preview panel |
| `label.locations.import.rename.same` | Same place, renamed | Rename choice |
| `label.locations.import.rename.different` | Different places | Rename choice |
| `warning.locations.import.registryOverwrite` | Will be overwritten by the next registry sync | Preview row flag |
| `label.locations.column.inUse` | In use | Column |
| `label.locations.column.level` | Level | Column (areas) |
| `label.locations.column.children` | Child areas | Column (areas) |
| `label.locations.column.siteType` | Site type | Column (sites) |
| `label.locations.status.active` | Active | Tag / filter |
| `label.locations.status.inactive` | Inactive | Tag / filter |
| `label.locations.status.all` | All | Filter |
| `label.locations.source.registry` | Registry | Tag for facility-registry records |
| `label.locations.filter.type` | Type | Filter label |
| `label.locations.filter.status` | Status | Filter label |
| `label.locations.filter.clear` | Clear filters | Button |
| `placeholder.locations.search` | Search by name, code or any identifier | Search |
| `placeholder.locations.area.search` | Search areas by name or code | Tree search |
| `label.locations.filter.reviewOverdue` | Referral labs overdue for review or with expired accreditation only | Quick filter (Organizations) |
| `label.locations.filter.category.all` | All categories | Filter placeholder |
| `label.locations.filter.ownership.all` | All ownership | Filter placeholder |
| `button.locations.history.hide` | Hide history | Form footer |
| `label.locations.history.allChanges` | All changes | History filter |
| `help.locations.history.readOnly` | Read-only. Kept for as long as the record exists. | History panel |
| `help.locations.identifiers` | Type any label, or pick one already used. The reporting code shows as Code in lists, exports and reports. Every identifier is searchable and used to match import rows. | Identifiers helper |
| `help.locations.field.gps` | Decimal degrees, WGS84 | GPS helper |
| `button.close` | Close | Row action while expanded (existing key) |
| `button.locations.add` | Add | Toolbar |
| `button.locations.import` | Import | Toolbar |
| `button.locations.export` | Export | Toolbar |
| `button.locations.deactivate` | Deactivate | Row / bulk |
| `button.locations.reactivate` | Reactivate | Row / bulk |
| `button.locations.exportSelected` | Export selected | Bulk |
| `button.locations.addWard` | Add ward / dept | Organization expanded row |
| `button.locations.moveWard` | Move | Ward / dept edit mode |
| `label.locations.section.identity` | Identity | Form section |
| `label.locations.section.location` | Location | Form section |
| `label.locations.section.contact` | Contact | Form section |
| `label.locations.section.site` | Site details | Form section |
| `label.locations.section.wards` | Wards / Depts | Form section |
| `label.locations.field.location` | Location | Parent field for facilities and sites |
| `label.locations.field.gpsLatitude` | GPS latitude | Field |
| `label.locations.field.gpsLongitude` | GPS longitude | Field |
| `label.locations.field.contactName` | Contact name | Field |
| `label.locations.field.description` | Description | Field |
| (reuse) `organization.organizationName`, `organization.short.CI`, `organization.streetAddress`, `organization.city`, `organization.internetaddress` | | Existing fields |
| (reuse) `vector.admin.samplingSite.type`, `vector.admin.samplingSite.subtype`, `vector.admin.samplingSite.addressSearch.placeholder` | | Existing site fields |
| `error.locations.gps.range` | Enter decimal degrees: latitude -90 to 90, longitude -180 to 180 | Validation |
| `error.locations.parent.kind` | A ward's parent must be a facility | Validation |
| `warning.locations.name.duplicate` | Another active {kind} named "{name}" exists | Validation warning |
| `message.locations.empty.none` | No records yet. Add one, or import a file. | Empty state |
| `message.locations.empty.filtered` | No records match these filters. | Empty state |
| `message.locations.deactivate.inUse` | {name} has {open} open orders and {children} active {childKind}. | Guard modal |
| `button.locations.deactivate.only` | Deactivate {name} only | Guard modal |
| `button.locations.deactivate.withChildren` | Deactivate {name} and its {count} {childKind} | Guard modal |
| `error.locations.reactivate.parentInactive` | Reactivate {parent} first. | Reactivate block |
| `label.locations.import.mode` | Import mode | Import |
| `label.locations.import.mode.merge` | Add & update | Import mode |
| `help.locations.import.mode.merge` | Add new records and update matching ones. Nothing else changes. | Import mode help |
| `label.locations.import.mode.replace` | Replace | Import mode |
| `help.locations.import.mode.replace` | Also deactivate records of the types in this file that the file does not include. Nothing is deleted. | Import mode help |
| `label.locations.import.area` | Area | File row |
| `label.locations.import.area.organizations` | Facilities, wards & sites | Area |
| `label.locations.import.area.levels` | Geographic levels | Area |
| `label.locations.import.area.values` | Geographic areas | Area |
| `button.locations.import.preview` | Preview | Import |
| `button.locations.import.apply` | Apply | Import |
| `label.locations.import.outcome.new` | New | Preview totals |
| `label.locations.import.outcome.updated` | Updated | Preview totals |
| `label.locations.import.outcome.unchanged` | Unchanged | Preview totals |
| `label.locations.import.outcome.reactivated` | Reactivated | Preview totals |
| `label.locations.import.outcome.deactivated` | Deactivated | Preview totals |
| `label.locations.import.outcome.decision` | Needs decision | Preview totals |
| `label.locations.import.outcome.rejected` | Rejected | Preview totals |
| `label.locations.import.decision.use` | Use this record | Decision |
| `label.locations.import.decision.new` | Create new | Decision |
| `label.locations.import.decision.skip` | Skip row | Decision |
| `label.locations.import.decision.remember` | Remember this name | Decision |
| `label.locations.import.confirm.replace` | I understand {count} records will be deactivated | Apply confirmation |
| `button.locations.import.report` | Download result report | Result |
| `label.locations.import.recent` | Recent imports | Run history |
| `button.locations.template` | Download template | Import page |
| `label.locations.section.identifiers` | Identifiers | Form section |
| `label.locations.identifier.label` | Label | Identifiers row (free text with suggestions) |
| `label.locations.identifier.value` | Value | Identifiers row |
| `label.locations.identifier.reporting` | Reporting code | Identifiers row radio |
| `button.locations.identifier.add` | Add identifier | Identifiers section |
| `error.locations.identifier.duplicate` | {label} {value} is already used by {name} | Validation |
| `label.locations.field.category` | Category | Field, filter |
| `label.locations.field.ownership` | Ownership | Field, filter |
| `label.locations.field.serviceType` | Service type | Ward / dept column |
| `help.locations.field.siteDescription` | Include directions so someone else can find the exact spot | Site description helper |
| `label.locations.section.referral` | Referral laboratory | Form section |
| `label.locations.referral.approval` | Approval status | Field |
| `label.locations.referral.approved` | Approved | Option |
| `label.locations.referral.evaluation` | Under evaluation | Option |
| `label.locations.referral.suspended` | Suspended | Option |
| `label.locations.referral.notApproved` | Not approved | Option |
| `label.locations.referral.accreditationBody` | Accreditation body | Field |
| `label.locations.referral.accreditationNumber` | Accreditation number | Field |
| `label.locations.referral.accreditationExpiry` | Accreditation expiry | Field |
| `label.locations.referral.lastReview` | Last review date | Field |
| `label.locations.referral.nextReview` | Next review due | Field |
| `label.locations.referral.notes` | Review notes | Field |
| `label.locations.referral.overdue` | Review overdue | List tag |
| `label.locations.referral.expired` | Accreditation expired | List tag |
| `message.locations.undo.deactivated` | {name} deactivated. | Undo notification |
| `button.locations.undo` | Undo | Undo notification |
| `button.locations.history` | History | Form footer |
| `label.locations.history.title` | History of {name} | History panel |
| `label.locations.history.formerly` | Formerly {name} | Search result note, order display |
| `label.locations.form.jump` | Jump to | Form section links |

---

## Dependencies

New data and capabilities, declared per design-addendum MUST A:

1. **Organization: new attributes** `gps_latitude`, `gps_longitude`, `contact_name`, `description`. (Phone, email and address already exist.)
2. **Organization type "Sampling site"** (new seeded type).
3. **Sampling site → Organization link:** `vector_sampling_site.organization_id` (one-to-one), plus a migration that creates and links an Organization for each existing site. The overlapping site columns (code, name, active, contact, phone, GPS, location) move to the Organization or are kept in sync until retired. Developer's call, but reads must come from one place.
4. **Identifier uniqueness within label and kind**, enforced by the service on save and import (FR-I3). Organization `code` exists but is not unique today; the migration reports existing collisions for an admin to fix rather than altering data.
5. **Source marker for facility-registry records:** a way to tell that an Organization came from the scheduled FHIR facility-list sync (`org.openelisglobal.facilitylist.fhirstore`), so Replace can exclude it (FR-F11). Could be a stored source value or derived from the FHIR identifier system. Developer's call.
6. **Organizations import area:** a new CSV handler on the shared catalog loader base (`AbstractCatalogCsvHandler`), reachable from startup configuration, the reload API and this page. **Replace mode** is new to the framework.
7. **Address-hierarchy handlers on the import page:** the two existing handlers exposed through the import page's preview/apply with file-scoped reload (`ConfigurationReloadOptions`, built in #4329).
8. **Server-side filtered paging** for organizations by type, status and search (current endpoints page but only filter by name).
9. **CLIA number becomes an identifier** labelled "CLIA" (FR-I4). The UI drops the separate CLIA field; the column stays in the database until nothing reads it.
10. **"In use" counts** query (open and total orders per organization and per sampling site).
11. **Identifiers:** an identifier table (record, label, value, reporting-code flag); migration moves each existing code in as "Code" (reporting) and each CLIA number in as "CLIA".
12. **Category and ownership** lists (admin-managed, with code systems) and the two attributes on Organization.
13. **Ward / dept service type** attribute with a WHONET / GLASS mapping (coordinate with M-01 department `whonet_code` and M-09).
14. **Referral-lab fields:** approval status, accreditation body / number / expiry, last review, next review due, review notes.
15. **History** covering every change listed in FR-K1, including import runs and registry syncs (reuse the existing audit history where possible).

## Coordination (overlaps)

- **S-02 Sampling Site Registry (OGC-531):** this feature moves the site admin page and changes where shared site fields are stored. S-02's site fields and order-entry site picker behaviour are unchanged.
- **Catalog CSV import (OGC-1194):** shares the import framework, run history and decision queue. Replace mode and the organizations area are additions that must not change catalog-area behaviour.
- **Address hierarchy loader:** GUI and startup must produce identical results for the same file.
- **Downstream consumers of deactivation:** order entry referring site and department pickers, e-order requester lookup, patient address entry, referral organization lists, vector/environmental collection site picker, M-16 cluster detection (reads site coordinates, and gains facility coordinates), environmental dashboard.
- **M-01 / M-09 (AMR reference data, WHONET export):** consume ward / dept service type instead of a separate department mapping.
- **Environmental and Vector Order Entry v4:** a sample's origin can be a sampling site or a location from this menu (D-101). Its standing agreements live on the requester (D-103), so this form will gain a **Standing agreement** section owned by that spec; build the form so sections can be added per organization type. Its site "system / permit ID" should be stored as an identifier (label "Permit ID") under section I rather than as a new site column.
- **Docs:** the published Organization Management manual page must be re-captured, and the Sampling Sites manual content moved.

---

## Acceptance Criteria

1. The SideNav shows `Locations & Organizations` with Organizations, Sampling Sites, Geographic Areas and Import / Export; the old Organization Management and Vector Sampling Sites routes redirect as specified; each route restores its filters from the URL.
2. With Type = `referral lab` and Status = Inactive, only inactive referral labs are listed, and the selected type shows as a named tag.
3. Searching "PMGH" lists the facility with that code first. Searching a ward's name returns its organization, expanded, with the ward highlighted. No ward appears as a top-level row.
4. No screen offers Delete. Deactivating a facility with open orders shows the guard with the correct counts, and "facility only" leaves its wards active.
5. Adding two wards / depts from an organization's expanded row saves them with type `dept` and that organization as parent, and they appear in order entry's department picker for it. A ward without its own GPS shows the parent's as inherited and takes the new parent's when moved; a ward with its own GPS keeps it.
6. After migration, every existing sampling site has a linked Organization with the same code, name, status and location, and existing vector orders still open with the same site.
7. Importing the example file in Add & update mode on a system that already has `PMGH` updates it (keeping its id), creates the rest, and changes nothing else.
8. Importing a sites-only file in Replace mode deactivates sites not in the file and leaves every facility, ward / dept and area untouched.
9. A row without a code whose name matches two existing facilities appears in the decision queue. Apply stays disabled until it is decided. "Remember this name" resolves the same spelling automatically on the next import.
10. Preview saves nothing: record counts and values are identical before and after a preview.
11. A blank cell in an updated row leaves the stored value unchanged. `active=N` deactivates. In Replace mode an inactive matched record is reactivated.
12. Exporting a filtered list and re-importing the unedited file in Replace mode yields 0 new, 0 updated, 0 deactivated.
13. Uploading the existing Indonesia `*-levels.csv` and `*-values.csv` files on a generic install creates the same areas the startup loader creates.
14. Every visible string uses the keys in the Localization table.

15. A Replace file with two ward / dept rows for Port Moresby General Hospital deactivates only Port Moresby General Hospital's unlisted wards / depts; wards / depts at every other organization are unchanged.
16. A Replace file row "Tokarara Urban Clinic" (no code) in the same district as the unmatched "Tokarara Clinic" appears as a possible rename; choosing "Same place, renamed" updates Tokarara Clinic's name and keeps its id and history.
17. With the facility-registry sync on, editing a Registry record shows the overwrite explanation, and Replace never deactivates it.
18. Filtering Organizations by Location = Morobe Province lists records placed at Morobe Province, Lae district and Lae Urban LLG; sorting by Location groups them together.
19. An organization with identifiers labelled "DHIS2 ID" and "CLIA" shows both in Identifiers, with the reporting code shown as Code in the list; searching the DHIS2 ID value finds it; typing a new label ("Provincial code") saves it and it is then suggested on other records.
20. An import row with only `identifier:DHIS2 ID` matches the organization that has that DHIS2 ID.
21. A referral lab with Next review due in the past shows Review overdue in the list, and the "overdue or expired only" filter lists it.
22. History for a record lists every change with user, time, and old and new values; a renamed record is still found by its old name.
23. Deactivating with the toggle shows an Undo link; Undo reactivates the record and any children deactivated with it.
24. The Geographic Areas tree can be expanded, collapsed and navigated with the keyboard alone, and a screen reader announces each row's level and expanded state.
25. Clicking a row outside its Edit button does not expand it; the expanded form keeps Save / Cancel visible while scrolling.

---

## Out of Scope

- Editing organization types themselves (names, adding new types other than the seeded Sampling site type). Category and ownership lists are managed with the existing dictionary / list tools.
- Locking fields on facility-registry records (they are explained, excluded from Replace deactivation, and overwritten by the next sync).
- Map views of any kind; site photos or attachments.
- Clearing a stored value through import (clear it in the form).
- A read-only role for this menu.

---

## Deferred

Considered, judged worth doing later, and deliberately not part of this build. Each would be its own ticket.

| Item | Why it waits |
|---|---|
| **Merging duplicate records** (keep one, re-point orders, wards / depts and identifiers, keep old names as aliases) | Highest-value follow-up, but the most expensive piece: it re-points orders across several tables. The import rename check (FR-F12) stops new duplicates meanwhile. |
| **Undo an import** | Preview, scoped Replace and the deactivation Undo link cover most mistakes. Needs before-values stored per run. |
| **GPS plausibility check** (map, outside-the-country warning, swap latitude / longitude) | Needs a country outline per deployment. Range validation stays. |
| **Effective-dated area changes** (reports show the name and parent in effect on the sample date; area split / merge / bulk move) | Touches every report that groups by area. Renames are in history meanwhile. |
| **Referral picker warnings** in the referral workflow (unapproved / overdue labs flagged or hidden) | Another module owns that screen; the overdue tag here delivers most of the value. |
| **Bulk edit** of Location, Category, Ownership | Convenience; import covers bulk changes. |
| **Names in other languages** for organizations, sites and areas | No current deployment has asked. |
| **Counts of organizations and sites per area** in the tree | Needs per-area count queries; the Location filter answers the same question. |
| **Full FHIR / IHE mCSD mapping spec** beyond identifiers | The facility registry sync already reads this shape; spec it when a write-back or exchange use case appears. |
