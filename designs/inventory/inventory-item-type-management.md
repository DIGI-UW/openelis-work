# Move "Type of Item" list from hard-coded values to the Data Dictionary

**Type:** Story
**Epic:** *(none — triage during sprint planning)*
**Labels:** `inventory`, `tech-debt`, `data-dictionary`, `Indonesia`
**Assignee:** Herman
**Priority:** Medium

---

## Summary

The "Type of Item" field on **Inventory Catalog → Item Add** is populated from a hard-coded list in the source. Admins cannot add, rename, or deactivate item types without a code change and redeploy. Move the list into the existing OpenELIS **Dictionary** so item types can be managed from **Admin → Dictionary Management**, the same way other admin-configurable lists are managed today.

## User Story

**As an** OpenELIS admin,
**I want** to manage the list of inventory item types from the Dictionary admin page,
**so that** I can add, rename, or deactivate item types as my lab's inventory needs change — without waiting for a developer to ship a code change.

## Background

The **Inventory Catalog** lets admins create inventory items with a "Type of Item" attribute (e.g., Reagent, Test Kit, Control, Consumable). The dropdown is currently driven by a hard-coded constant rather than a database-backed lookup.

OpenELIS already uses the `DICTIONARY` / `DICTIONARY_CATEGORY` pattern for analogous admin-managed lists (sample types, organization types, etc.), and **Dictionary Management** already supports add / edit / activate / deactivate. This story brings inventory item types under that same pattern — no new admin UI required.

## Acceptance Criteria

1. A new row exists in `DICTIONARY_CATEGORY` for inventory item types (e.g., `category_name = "inventoryItemType"`) with a localized display label.
2. Every hard-coded value currently in the source is seeded into `DICTIONARY` under the new category, preserving display order and current labels.
3. **Inventory Catalog → Item Add** loads the "Type of Item" options from the Dictionary REST endpoint, filtered by the new category — no hard-coded list remains in the front-end.
4. Selecting a type and saving an inventory item persists a reference to the dictionary entry; the same type displays correctly on subsequent reads and edits.
5. Adding a new entry under "Inventory Item Type" via **Admin → Dictionary Management** causes the new value to appear in the Item Add dropdown on the next page load — no code change, no redeploy.
6. Deactivating an entry stops it from appearing as a selectable option for new items, but inventory items already using that type continue to display their original label (no orphaned references).
7. Existing inventory item records continue to load, display, and save correctly after the migration runs — no data loss, no broken type references.
8. The dropdown label and dictionary entries respect the active locale, using the existing Dictionary localization mechanism.
9. The permission required to add / edit / deactivate inventory item types is the same as for other Dictionary entries — no new permission key.

## Technical Notes

### Data model investigation (first step)

Confirm how the type is currently stored on inventory items before writing the migration:

- **If** the type is a string column on `INVENTORY_ITEM` (or equivalent): add a Liquibase changeset that introduces an `inventory_item_type_id` FK to `DICTIONARY.id`, backfills from the existing string values, then drops the legacy column once integrity is verified.
- **If** it is already a FK to a small purpose-specific lookup table: migrate those rows into `DICTIONARY` under the new category and re-point the FK; deprecate the legacy table.

### Back-end

- Update the inventory item entity / DAO / service / controller to resolve item type via `DICTIONARY` instead of the hard-coded constant.
- Liquibase migration includes:
  - Insert into `DICTIONARY_CATEGORY`
  - Insert into `DICTIONARY` (one row per existing hard-coded value)
  - Schema change, backfill, and integrity check on `INVENTORY_ITEM`

### Front-end

- React form swaps the hard-coded `<SelectItem>` list for a fetch against the existing dictionary endpoint, filtered by the new category.
- Dropdown shows only `is_active = true` entries.
- Edit-form view of an existing item resolves the FK and displays the current label even if the underlying entry has since been deactivated.

### Out of scope

- A new CRUD UI for managing item types — the existing Dictionary Management page is the management surface.
- Migrating any other hard-coded inventory lists (units of measure, storage locations, etc.) — track those separately if needed.
- Any change to the inventory item record structure beyond the type-of-item field.

### Risks / dependencies

- Any reports, filters, imports, or APIs that reference inventory item type by string value must be updated to resolve via the dictionary.
- Customer deployments may have already locally edited the hard-coded list; confirm seed values match each active deployment before release, or provide a deployment-specific seed override.

## Definition of Done

- Liquibase migration runs cleanly against a fresh database and against a database with existing inventory data.
- All existing inventory items load and save without regression.
- A new entry added via Dictionary Management appears in the Item Add dropdown on next page load.
- A deactivated entry disappears from new selections but remains visible on existing items.
- Unit and integration tests cover the new dictionary lookup path.
- Admin guide / release notes updated to note that inventory item types are Dictionary-managed.
