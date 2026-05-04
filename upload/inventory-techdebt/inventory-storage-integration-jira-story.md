# Inventory: wire lots into Storage Management — lift the Order Entry storage modal

**Jira:** [OGC-657](https://uwdigi.atlassian.net/browse/OGC-657)
**Type:** Story
**Epic:** *(none — triage during sprint planning)*
**Labels:** `inventory`, `tech-debt`, `storage`, `Indonesia`
**Assignee:** Herman Muhereza
**Priority:** Medium
**Breaking change:** Yes — Inventory has no users yet, treated as a clean break.

---

## Summary

OpenELIS already has a working storage hierarchy and a storage modal in **Order Entry**. The Inventory module currently has a non-functional storage skeleton. This story **deletes that skeleton outright** and replaces it with the Order Entry storage modal lifted directly, attached at the **lot** level — every inventory lot lives at one storage location. A new **Location** column lands on the Inventory lot dashboard. The Sample Storage map remains sample-only.

## User Story

**As a** lab manager,
**I want** to assign each inventory lot a storage location using the same modal we already use in Order Entry, and see that location next to each lot's current quantity on the inventory dashboard,
**so that** I can tell at a glance where every lot is stored and move lots between locations using a flow my team already knows.

## Background

The Inventory module today has scaffolding for storage that does not work. Rather than diagnose and repair it, this story removes it cleanly and connects inventory lots to the existing sample storage hierarchy. The reusable component is the storage modal already used in Order Entry. Lift that modal directly — same code, same styling, same behavior — and bind it to the inventory lot entity. This keeps storage UX consistent across Sample, Order Entry, and Inventory in a single shared component.

## Acceptance Criteria

1. **Skeleton removed.** The non-functional inventory storage skeleton (any related fields, tables, controllers, JSX) is deleted in this story — one Liquibase changeset drops the dead schema. No audit of the broken behavior; no migration of legacy values.
2. **Lot-level location.** Every inventory **lot** record gains exactly one FK to the storage location entity already used by samples. Inventory items themselves do not carry a storage FK — only lots do. No parallel inventory-only storage table is created.
3. **Storage modal lifted from Order Entry.** Inventory Catalog → Item Add / Edit invokes the **same storage modal component used in Order Entry** to assign a location to each lot. No new picker is built; no parallel implementation is forked. If the Order Entry modal is currently coupled to order-entry concepts, it is generalized with an "occupant type" prop rather than duplicated.
4. **Location column on the Inventory dashboard.** A new **Location** column is added to the Inventory lot dashboard immediately to the right of **Current Quantity**, sourced from the lot's storage FK and showing the location label (or "Not assigned" if unset).
5. **Sample Storage map view is unchanged.** Inventory lots do not appear there. That view remains sample-only.
6. **Transfer action.** The existing "move to another location" action used for samples is available for inventory lots from the Inventory dashboard (row action or in-cell action on the Location column) and reuses the same modal and audit-trail flow.
7. **Permissions.** Assigning, viewing, and moving an inventory lot's storage location use the same permission keys as the equivalent sample storage actions. No new permission keys.
8. **Localization.** All new labels (Location column header, modal copy, confirmation copy) follow the existing i18n key pattern with translation entries for active deployment locales.
9. **Empty / error states.** If a lot has no location assigned, the dashboard cell shows "Not assigned". If no storage hierarchy is configured yet, the modal shows the same empty state Order Entry already renders.

## Technical Notes

### Data model

- The storage FK lives on the **inventory lot** entity (e.g., `INVENTORY_ITEM_LOT.storage_location_id`). It references the same storage location table samples use. No parallel inventory-only storage table.
- **Dependency to confirm:** if inventory lots are not yet modeled as a distinct entity in the current schema, that gap is a prerequisite. Flag at kickoff and either fold in or split into a small prep story before this one starts.

### Front-end

- Lift the storage modal component from Order Entry as-is. If currently coupled to order-entry-specific concepts, extract a generalized version with an "occupant type" prop rather than duplicating it.
- Inventory Catalog → Item Add / Edit invokes the modal once per lot.
- The Inventory lot dashboard gains a **Location** column to the right of **Current Quantity**.
- The transfer action is invoked from the Inventory dashboard and reuses the existing modal flow.
- The Sample Storage map view is **not modified**.

## Out of scope

- Quantity-by-location splits for a single lot.
- Bulk move of many lots at once.
- Storage hierarchy admin (creating fridges / racks / shelves) — already covered by existing Storage admin pages.
- Item-type management and inventory item primary key changes — tracked in companion story OGC-658.

## Risks / dependencies

- Order Entry storage modal must be cleanly extractable. If tightly coupled to order-entry data, plan a small refactor to generalize before integrating with inventory; preferable to forking.
- Lot entity must exist in schema — see *Data model* dependency note above.
- Any reports, filters, imports, or APIs that currently reference the broken storage skeleton must be updated as part of this story.

## Definition of Done

- Liquibase migration runs cleanly on a fresh database; the broken skeleton is gone in one changeset and the new lot → storage FK is in place.
- Inventory lots can be assigned a storage location via the lifted Order Entry modal and persist correctly.
- The Inventory lot dashboard shows a **Location** column to the right of **Current Quantity**, populated from the lot's storage FK.
- The transfer action moves an inventory lot between locations from the Inventory dashboard and writes an audit entry consistent with sample moves.
- The Sample Storage map view is unchanged.
- No parallel inventory storage code remains in the schema or front-end.
- Unit and integration tests cover lot assignment, dashboard column rendering, and lot transfer.
- Release notes call out the breaking change and the new lot-level storage model.

## Related

- Companion story: OGC-658 — *Inventory Catalog cleanup: Item Type CRUD + code-based item primary key.* Independent — can ship in either order.
- Replaces the storage scope of OGC-642 (closed as superseded).
