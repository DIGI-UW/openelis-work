# Locations & Organizations: Slicing Guide

**Mockup:** `locations-organizations-mockup.jsx`
**Preview:** `locations-organizations-preview.html`
**FRS:** `locations-organizations-frs.md` (v0.3)
**Total versions:** 4
**Total slices:** 10 (one PR each)
**Reference points:** 63 (for human planning only; the agent pipeline sizes by reviewable PR)
**Status:** Suggested, non-binding. The developer owns the final slicing.

## Handoff ticket

**Type:** Epic (several routes, new data model: identifiers, site to organization link, new attributes, a new import area)
**Title:** Locations & Organizations admin menu
**Description summary:** One admin menu for the places a lab works with: facilities and their wards / depts, sampling sites and geographic areas, with codes, search, filters, a GUI CSV import that matches the startup loader, and deactivation instead of delete.
**Parent / linked program epic:** to be confirmed at ticket time
**Labels:** to be confirmed at ticket time

## How to read this

Each slice is a vertical cut a lab admin can use once it merges: backend, migration and UI ship together. Slices are ordered so none depends on a later one. Localization keys and access rules are inside every slice (the FRS Localization and Access sections), not separate work. The acceptance criteria listed are the FRS numbers a reviewer and CI check for that PR.

## v1: Manage organizations and their wards

| # | Slice (what the admin can do) | Points | FRs | ACs | Data / backend in the same PR |
|---|---|---|---|---|---|
| 1 | Find any organization in the new menu | 8 | FR-A1, FR-A4, FR-B0, FR-B1, FR-B2 (without Review overdue tag), FR-B3 (name, code, short name, ward names), FR-B4, FR-B4a, FR-B5, FR-B6 (read-only wards), FR-B8, FR-B9 | 1, 2, 3, 18 | New SideNav group, routes and redirects; server-side filtered paging (Dep 8); in-use counts (Dep 10) |
| 2 | Edit, add and deactivate an organization inline | 8 | FR-B10, FR-C1, FR-C2, FR-C3 (Identity, Location, Contact sections), FR-C4 (without identifier rules), FR-C5, FR-E1 to FR-E4, FR-L2, FR-L3 | 4, 23, 25 | New attributes GPS, contact name, description (Dep 1); category and ownership lists (Dep 12); change entries written to the existing audit history (Dep 15, write side) |
| 3 | Add, edit and move wards / depts under an organization | 5 | FR-D1 to FR-D4, FR-D2a | 5 | Service type attribute and WHONET / GLASS mapping (Dep 13, coordinate with M-01 / M-09) |

**v1 total:** 21 points. Slightly over 20; slices 1 and 2 are tightly coupled (the list is not useful to admins without edit). Over-capacity: justified, or move slice 3 to v2.

## v2: Identifiers, sampling sites and geographic areas

| # | Slice | Points | FRs | ACs | Data / backend in the same PR |
|---|---|---|---|---|---|
| 4 | Give any record labelled identifiers and a reporting code | 5 | FR-I1 to FR-I5, FR-C4 (identifier uniqueness), FR-B3 (identifier search) | 19 | Identifier table and migration of Code and CLIA (Dep 4, 9, 11); FHIR `Identifier` mapping |
| 5 | Manage sampling sites in the same menu | 8 | FR-A2, FR-A3, FR-C3 (Site details), FR-B2 (Site type column) | 6 | Sampling site organization type (Dep 2); `vector_sampling_site.organization_id` and backfill migration (Dep 3); old sampling-sites route redirects; Permit ID stored as an identifier (Env/Vector v4) |
| 6 | Browse and edit geographic areas as a tree | 5 | FR-B7, FR-L1 | 24 | Lazy child loading endpoint; add-sub-area inline rows |

**v2 total:** 18 points.

## v3: Traceability and referral labs

| # | Slice | Points | FRs | ACs | Data / backend in the same PR |
|---|---|---|---|---|---|
| 7 | See a record's history and find it by a former name | 3 | FR-K1 to FR-K3, FR-B3 (former names) | 22 | History read endpoint over the audit entries written since slice 2 (Dep 15, read side) |
| 8 | Track referral labs' approval and review dates | 5 | FR-J1 to FR-J3, FR-B2 (Review overdue tag), FR-B4 (overdue quick filter) | 21 | Referral-lab fields (Dep 14) |

**v3 total:** 8 points. Under 10: could fold into v2 or v4 if capacity allows.

## v4: Import and export

| # | Slice | Points | FRs | ACs | Data / backend in the same PR |
|---|---|---|---|---|---|
| 9 | Export a list and import a CSV in Add & update mode with preview | 8 | FR-F1, FR-F2, FR-F4 to FR-F8, FR-F10, FR-G1 to FR-G3, section M | 7, 9, 10, 11, 13, 20 | Organizations import area on `AbstractCatalogCsvHandler` (Dep 6); address-hierarchy handlers on the page (Dep 7); reuse `unresolved_reference`, `reference_alias`, `configuration_import_run` |
| 10 | Replace a set of records from a file, safely, with the facility registry respected | 8 | FR-F3, FR-F9, FR-F11, FR-F12, FR-H1 to FR-H4 | 8, 12, 15, 16, 17 | Replace mode in the framework (Dep 6); registry source marker (Dep 5) |

**v4 total:** 16 points.

AC-14 (every string uses the Localization keys) applies to every slice.

## Coverage check

- Every FR in the FRS appears in at least one slice: ✅ (A1 to A5 across 1, 5; B0 to B10 across 1, 2, 4, 5, 6, 7, 8; C1 to C5 in 2, 4, 5; D in 3; E in 2; F in 9, 10; G in 9; H in 10; I in 4; J in 8; K in 7; L1 in 6, L2 and L3 in 2; M in 9). FR-A5 (internal identity never changes) is enforced from slice 2 onward and tested in slices 9 and 10.
- Every dependency (1 to 15) is built in a slice: ✅
- Every acceptance criterion (1 to 25) maps to a slice: ✅
- Every page in the mockup is built by a slice: Organizations (1 to 4, 7, 8), Sampling Sites (5), Geographic Areas (6), Import / Export (9, 10): ✅
- Every slice is titled around what the admin can do, not a technical layer: ✅
- Cross-cutting concerns folded into their slice: Localization ✅ (per slice); Access ✅ (admin roles per the FRS Access section, on every slice that changes data)

## Sequencing notes

- Slice 2 starts writing history so that nothing edited before slice 7 is missing from the timeline.
- Slice 4 before slice 9: import matching uses identifiers.
- Slice 5 before slice 10: Replace scope reasons about sampling sites as an organization type.
- The Env/Vector Order Entry v4 standing-agreement form section plugs into the form built in slice 2; build form sections so one can be added per organization type.
- Docs: the Organization Management manual page is re-captured after slice 2 merges; the Sampling Sites manual content moves after slice 5.
