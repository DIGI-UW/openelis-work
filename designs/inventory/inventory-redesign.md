# OpenELIS Inventory — Module Redesign
## Functional Requirements Specification — v1.9

**Version:** 1.9
**Date:** 2026-07-22
**Status:** Draft for Review
**Jira:** OGC-438 (rescoped as the Stock-view slice of this module; not yet edited in Jira)
**Technology:** Java Spring Framework, Carbon React
**Related (verified 2026-07-22):**
- **OGC-657** (Story, *In Progress*) — wires inventory lots into the **shared sample Storage model** (deletes the inventory storage skeleton, reuses the Order Entry storage modal). **This FRS depends on it; it is not re-specced here.**
- **OGC-658** (Story) — Item-Type CRUD (`inventory_item_type` table). **Replaced/closed** by this redesign: item type becomes a free-form tag, not a managed entity (§4.2). Close with a supersession note so it doesn't draw effort. (Its separate generated-item-`code` idea may be revisited within the redesign if wanted.)
- **OGC-1052** (Bug, Backlog) — raw i18n key `label.button.action` shows on Inventory tables; **mooted** by this redesign's string replacement.
- **OGC-992** (Story, Backlog, epic OGC-762) — Link Reagent modal; harmonize the reagent-linking pattern.
- **OGC-457** (Story, Backlog) — Blood Bank Blood-Unit Inventory; **separate domain**, harmonize patterns only.
- **OGC-436** (Epic, Ready) — national forecasting engine; upstream/coordinate on shared projection logic.
- **Results Entry reagent-usage capture** (`results-page-reagent-usage` v1 interim + v2.1 full) — **owns point-of-consumption**: it captures reagent lot usage at result entry with **earliest-expiry (FEFO) "use oldest unexpired first" marking** (labelled "FIFO Suggested" there), writes `ReagentConsumptionEvent` (source `RESULT_ENTRY`), deducts inventory, and feeds forecasting. **This module coordinates with it — it does not define a parallel consumption or FEFO model.** Depends on **m-12 Test→Reagent linkage (OGC-784)** for the per-test reagent list.
- OGC-642 is Done-but-superseded (split into OGC-657 + OGC-658) — cite 657/658, not 642.

**Supersedes:** `FRS_Reagent_Forecasting_Facility_View.md` (all versions).

---

## Changelog

**v1.9 (2026-07-22)** — `/analyze` cleanup: fixed the data-model row to say **median** center (was "mean," contradicting FR-2/6a); standardized on **FEFO / earliest-expiry** naming (noting Results Entry labels it "FIFO Suggested"); removed stale "item-type management"/"horizon"/"reorder list" wording after the tag & lead-time reversals; added status-label i18n keys (Adequate/Building data); preview: fixed a seed row so badge↔suggestion agree, removed dead sparkline CSS.

**v1.8 (2026-07-22)** — Coordination + remaining friction folded in:
- **Consumption & FEFO are owned by the Results Entry reagent-usage design** (v1/v2.1): it captures usage at result entry (`ReagentConsumptionEvent`), applies FIFO "use oldest first," deducts inventory, feeds forecasting. Inventory **consumes those events and shows the same FEFO marking — no parallel model** (FR-8c, FR-6-fefo; Related + §9). Depends on m-12 Test→Reagent linkage (OGC-784).
- **Item tags edited as chips** (FR-8b-ii); **bulk "mark selected as ordered" + export** on Reorder suggestions (FR-20b); **per-location quantities** in the row + location filter (FR-6b); **CSV import that reuses the Test Catalog importer** (template → validate/preview → commit, idempotent) + scan-to-create for cold start (FR-1a-import); **access granularity** split (everyday vs governance) noted within D-006 (§3, §9).

**v1.7 (2026-07-22)** — Receive scan-first fast path (FR-9): with a scanner, scan into the first field → item identified, lot & expiry auto-filled (GS1) → **quantity is the only thing left to type**. Manual entry is the fallback. (Preview also: fixed the reorder banner rendering dark; it now uses the light inline-notification style.)

**v1.6 (2026-07-22)** — Tag tooling (now that type is a tag): **multi-select tag filter** with label chips (FR-1b); a **lightweight tag directory** — see all tags with usage counts, create inline, and **deactivate/reactivate** duplicates/obsolete tags without losing history (FR-8b-i). Governance only — not the removed behaviour-bearing item-type entity.

**v1.5 (2026-07-22)** — Self-learning lead time + reorder simplification:
- **Reorder look-ahead collapses onto each item's own lead time** (not a separate global horizon): "Reorder soon" = projected to hit threshold within its effective lead time (+ optional safety buffer) — FR-20a.
- **Effective lead time is tiered (set → observed → default)** so order-by is always meaningful and never blank, showing which tier it used — FR-3.
- **Lead time is learned from history** (median of order→receipt cycles) and suggested in the item editor; "mark as ordered" is now timestamped to enable it; never silently overwrites a set value — FR-3a/FR-21.
- **"Reorder list" renamed "Reorder suggestions"** (advisory, doesn't place an order) — FR-20; and the recent-usage sparkline replaced by a **median daily-use** figure — FR-6a; projection central rate pinned to the **median** — FR-2/FR-8.

**v1.4 (2026-07-22)** — Localization vocabulary-reuse pass (`openelis-ui-vocabulary`): reconciled §7 against the live `en.json` (7,201 keys). The shipped Inventory module already owns `inventory.*`/`stock.*`/`lot.*`/`catalog.item.*`/`usage.*`/`adjustment.*`/`disposal.*` — the FRS now **reuses those keys** (Lot Number, Expiration Date, Current Quantity, Manufacturer, Low Stock Threshold, Record Usage, Adjust Quantity, Dispose Lot, Usage History, Acknowledge, Export CSV, etc.) instead of minting a parallel `inventory.items.*` set. Only decision-support-specific strings are NEW; "Catalog Number" and "Show deactivated" flagged PROMOTE to `common.*`. Constitution Principle VII.

**v1.3 (2026-07-22)** — Frequency-weighted friction pass + honest projections:
1. **Search & filter on the board** (FR-1b) — every per-item action starts with finding the item; large-catalog requirement, not a nicety.
2. **Row action menu** (FR-1c) and **search-first quick-log** (FR-22a) — the frequent actions (receive stock, record usage, adjust) no longer require scrolling to and expanding the row.
3. **Run-out shown as a ±1SD window, not a single date** (FR-2); order-by uses the conservative early end (FR-3). Data model carries a consumption mean+SD distribution.
4. **Recent-usage drill-in** (FR-6a) so a doubted projection can be checked.
5. **Count mode scopeable to a location/section and commits only touched rows** (FR-8a).
6. **Barcode scan for receive & count** (FR-9b) — stop hand-keying lots/expiries.
7. **Responsive to tablet** for the walk-around tasks (FR-32); Reports may stay desktop.
8. **Item type is now a free-form tag**, not a managed entity (FR-8b) — no `inventory_item_type` table, no "manage types" surface; track-lots moves to the item and auto-consume is derived from the Test↔Reagent link (FR-8c). Supersedes the v1.2 "types in-context" decision and **replaces OGC-658** (closed as superseded 2026-07-22).
9. **UPC/GTIN on catalog items** (FR-9c) → receiving a known item is scan-product, scan-lot, enter-quantity. **Lead time is explicitly local per lab** (FR-3). **Reorder = threshold + look-ahead**, one rule shared with the board's Reorder now/soon badges (FR-20a). *(Look-ahead later collapsed onto each item's own lead time — v1.5.)*

**v1.2 (2026-07-22)** — Consolidation to reduce segmentation:
1. **Stock and Catalog merged into one Items board** — the item list *is* the catalog (define/edit items here) *and* the live stock board. The orphaned Catalog surface is gone; "define a thing" and "watch a thing" live together.
2. **Count is a mode on the Items board**, not a separate view — toggle Count mode and on-hand cells become count entry (expected/discrepancy inline), commit as one session. The standalone Counts view is retired.
3. **Item types managed in-context** on the Items board (inline "+ add type" + a lightweight "Manage types" panel) — the separate Admin → General Configuration → Inventory surface is dropped. Same configurable-types substance (OGC-658), surfaced inside Inventory.
4. **Adjust** and **Record usage** are row actions, not nav items.
5. **IA drops to three surfaces: Items · Receive · Reports.**

**v1.1 (2026-07-22)** — Design-review decisions folded in:
1. **Storage** reuses the shared sample Storage model (Decision 1 / OGC-657) — no parallel inventory storage tree.
2. **Projections always show their basis** and hedge when data is stale or link-coverage is incomplete — never a bare confident date (Decision 2).
3. **Reorder list + "mark as ordered"** close the "order-by" dead-end (Decision 3).
4. **"Record usage"** (a manual *consumption* event) keeps non-auto-consume items honest (Decision 4).
5. **Alerts acknowledge-to-quiet** — only unaddressed criticals stay in the banner; mirrors the existing critical-result acknowledgment (Decision 5; refines P-16 for persistent operational alerts).
6. **Count vs Adjust vocabulary clarified**: "Count" = make the system match the shelf (one concept, two entry points); "Adjust stock…" = reason-coded change (damage/disposal/loss). Retires the jargon "adjust lot" and the redundant "correct count."
7. **User guidance layer** added (per-view purpose lines, empty states with recovery hints, action helper text).
8. **Fix-its**: count mode can add an unlisted item; trend suppressed/labelled under a low-volume threshold and computed on a spike-dampened basis; cold-start falls back to simple threshold status; kit-vs-test unit shown consistently with opened-kit short-expiry surfaced.
9. **Roadmap / Part 2** added: push inventory to the **central FHIR repo via FHIR transactions**; the multi-lab oversight view is a downstream **external BI dashboard (Superset/Power BI)**, not an OpenELIS surface.

**v1.0 (2026-07-22)** — Initial module redesign.

---

## Lab Context

### Current State

Laboratory consumables — test cartridges, rapid test kits, reagents — arrive at the lab in periodic deliveries, each box carrying lot numbers and expiry dates. Today lab staff track what they have on paper stock cards or a personal spreadsheet: one line per delivery, minus signs for usage, a monthly physical count to true things up. OpenELIS has an Inventory page (Dashboard/Catalog/Reports tabs), but it is not part of anyone's daily routine: its reports don't generate (BUG-45), its item types are fixed in code, and it displays stock numbers without answering the question staff actually have. Meanwhile OpenELIS itself already records every test run on the instruments — the single best source of consumption data in the building — and the paper system can't see it.

### Pain

Stock-outs are discovered when someone reaches for a cartridge and the shelf is empty: patients are turned away or samples shipped elsewhere until an emergency order lands, which in remote provinces can take weeks. The reverse also happens — labs over-order to be safe and cartridges expire unopened on the shelf. Seasonal swings make both worse: when malaria season kicks in, consumption can rise 40% in a month, and a stock level that looked comfortable in June is a stock-out in August. The monthly count is an afternoon of transcription, and the figures relayed up to national programs are 2–4 weeks stale on arrival. When a manufacturer recalls a lot, finding whether the lab has it — and which results used it — means digging through paper.

### What Changes

Inventory becomes a page lab staff actually open. The landing view answers the real question directly: for each item, not just "12 on hand" but "**runs out around Aug 3 — order by Jul 25**," computed from actual test activity and adjusted when usage trends up or down — and shown with the date it's based on, so staff can see when the picture is going stale. When a delivery arrives, receiving it is a rapid repeated entry. Expiring lots are flagged before they expire, with oldest-first guidance at the point of use. The monthly count becomes a mode on that same board — flip it on and update counts right where the stock already is. When something's genuinely running low, the tech can build a reorder list and mark items as ordered so the page stops nagging about problems already in hand. And every screen tells the user, in a line, what it's for and what to do next.

---

## 1. Executive Summary

This feature redesigns the OpenELIS Inventory module as a **decision-support surface** for facility lab staff. Two principles govern it: **(1)** the user should never do math or transcription to know whether they're about to run out, and the surface never states a projection more confidently than its data supports; **(2)** keeping the data true should cost seconds, not afternoons, and the interface should always make clear what the user is meant to do. The module has three surfaces — an **Items board** (the catalog and the live stock in one, with an in-place Count mode and in-context tag management), **Receive**, and **Reports**. It builds on the shipped inventory backend (items, lots, usage, transactions, alerts), the **shared sample Storage model** (via OGC-657), and the Test↔Reagent link. OpenELIS is single-tenant: the module shows this lab's stock only. National/multi-lab oversight is served downstream — OpenELIS pushes inventory to the central FHIR repository (Part 2), and an external BI dashboard (Superset/Power BI) provides the cross-lab view; there is no multi-lab surface inside OpenELIS.

---

## 2. User Stories

- As a **lab technician**, I want to see when each item will run out and by when I'd need to order — with a hint of how current that estimate is — so that I can act before the shelf is empty and know when to trust the number.
- As a **lab technician**, I want to record an arriving delivery lot-by-lot in seconds, so that the system reflects reality without slowing down my bench work.
- As a **lab technician**, I want to record usage for items the instruments don't track automatically, so that their projections stay real between counts.
- As a **lab technician**, I want the system to warn me which lots expire soonest and which to open first, so that stock isn't wasted and expired materials never reach testing.
- As a **lab manager**, I want a physical count mode I can walk the shelf with, so that the monthly count takes minutes and discrepancies are visible immediately.
- As a **lab manager**, I want usage trends beside run-out projections, so that seasonal surges inform ordering before they become stock-outs.
- As a **lab manager**, I want reorder suggestions I can mark as ordered, so that acting on a shortage is one step and the page stops alarming about it once handled.
- As a **lab manager**, I want to tag items freely and keep the tag list tidy (deactivate duplicates), so that grouping and filtering fit my lab without a rigid, admin-managed type list.

---

## 3. Roles & Access

Access is governed by the **Inventory entry in the RBAC** — no new permission keys (decision D-006).

| User | Capability |
|---|---|
| Role includes Inventory | Sees Inventory in the sidebar; full use of the Items board (view, define/edit items, count mode, adjust, record usage, manage tags, build reorder suggestions, acknowledge alerts), Receive, and Reports |
| Role does not include Inventory | Inventory not shown; direct navigation shows the standard access-denied page |

Item-type (tag) management is in-context on the Items board (§4.2); it does not require a separate administrative role or surface.

**Access — kept at the level of "can you reach the surface," not per-action keys (D-006):**
- **Recording reagent usage at result entry** is available to **anyone with results-page access** (`results.modify`) — if you can enter results, you can record a reagent against them. There is **no separate reagent/inventory permission** for this (matches the Results Entry reagent-usage design). That is the intended granularity; don't add a key for it.
- **The Inventory board's own actions** (view, receive, count, adjust, manual record-usage, mark-ordered) ride the **Inventory bundle** — reach the board, use it.
- **Governance actions** (deactivate items/tags, edit reorder thresholds/lead times, bulk import) are higher-trust; where the role model allows they MAY sit with a manager/admin bundle, but if it can't express that split we accept coarser access rather than invent per-action keys.

---

## 4. Functional Requirements

### 4.1 Items board (catalog + live stock — the default and primary surface)

The Items board is one list that is simultaneously **the catalog** (the items the lab has defined and chooses to track) and **the live stock board** (how much of each is on hand and when it runs out). Defining an item and monitoring it are the same object at different depths — they are not separate screens.

**FR-1:** The Items board MUST show one row per active inventory item (Carbon DataTable) with: item name, item type, quantity on hand, usage trend, **projected run-out date**, **order-by date**, status, an **on-order** indicator when applicable, and last count date. Deactivated items are hidden by default with a "Show deactivated" affordance (P-02).

**FR-1a (define/edit items — the catalog):** The board MUST provide **"New item"** to *define a new kind of inventory item* (a catalog entry), and an **"Edit item details"** affordance in the row expansion, opening a fuller item-definition editor: name, **type tag(s)** (free-form, typeahead — FR-8b), manufacturer, catalog number, **UPC/GTIN (product barcode)** (FR-9c), low-stock threshold, expiration-alert days, lead time, a **track-lots** property (FR-8c), and (where relevant) compatible analyzers and tests-per-kit. The UPC MAY itself be captured by scanning the product barcode while defining the item. There is no auto-consume field — it is derived from the Test↔Reagent link. The definition editor is a panel/side-form (not a cramped inline field set), while the row expansion itself stays light (lots + quick actions). This surface replaces the retired standalone Catalog tab.

**FR-1a-import (CSV seed — mirror the Test Catalog importer):** For a fresh deployment, defining every item by hand is a wall of typing. The catalog MUST offer a **CSV import** that **reuses the Test Catalog's import pattern/component** for consistency (and to avoid building a second importer): a **downloadable template**, upload, **row-level validation with a preview** showing what will be created/updated and per-row errors before anything is written, then **commit**. Columns: name, tag(s), UPC/GTIN, manufacturer, reorder threshold, lead time, track-lots (and optional catalog number, units). Import is **idempotent** — matching on UPC (or name) **updates** an existing item rather than duplicating it, so a corrected file can be re-imported safely. Deactivation is not done via import (that's the tag/item deactivate affordance). Scanning an unknown UPC during receive/new-item also offers create-with-UPC-prefilled (FR-9c). Cold-start is a first-run hump; the shared CSV importer + scan-to-create are how a lab gets over it.

Naming rule (avoids a real point of confusion): **"New item" defines a *kind* of thing; it never means "add stock."** Adding stock of an item that already exists is **"Receive stock"** (FR-9a), and a whole delivery is the **Receive** surface (§4.3). Defining, receiving, counting, and adjusting are four distinct verbs, each meaning exactly one thing.

**FR-1b (find fast — search & filter):** The board MUST provide a **text search** (item name/catalog number/tag) and **filters** for **tag (multi-select), status, and storage location** that narrow the list in place. The tag filter is **multi-select** because an item can carry several tags; selected tags render as removable chips with their labels visible (P-08 — show labels, not a bare count), and an item matches if it carries any selected tag. This is a hard requirement, not a nicety: every per-item action begins with locating the item, and production catalogs run to hundreds of items (D-007). Search/filter state SHOULD persist within the session.

**FR-1c (act without hunting — row actions inline):** Each row MUST expose its common actions — **Receive stock**, **Record usage**, **Adjust stock…** — from a compact per-row action menu (Carbon `OverflowMenu`) available on the collapsed row, so the frequent actions do not require expanding the row first. Expanding remains available for lots and full detail.

**FR-2 (projection as an honest range, not a false-precise date):** The run-out projection MUST be expressed as a **window** — the ±1 standard-deviation range of the run-out given the variability of recent consumption (e.g. "runs out ~Jul 24–Aug 2"), **not a single date**. The **central consumption rate is the median** daily use over the window (robust to one-off spikes — not the mean); the window expresses its variability. The width of the window is itself the honesty signal: steady consumption yields a tight window, erratic consumption a wide one. The projection MUST display **its basis** — e.g. "based on usage through {date}." When the newest consumption record is stale (no usage in a configurable number of days) **or** the item's Test↔Reagent link coverage is incomplete, the surface MUST **hedge** — widen or downgrade to a "watch — data may be stale" state — rather than present a confident window. The surface MUST NOT show a projection it cannot stand behind.

**FR-3 (order-by, from an effective lead time that is never just a guess):** Order-by date = the **early (conservative) end** of the run-out window (FR-2) minus the item's **effective lead time**. Effective lead time resolves in tiers so order-by is **always available** (never blank, never fabricated):
1. **Set** — the value the lab entered for this item (authoritative).
2. **Observed** — if unset, the **median observed lead time** learned from this item's own order→receipt history (FR-3a).
3. **Default** — if neither exists, a global instance default (e.g. 30 days), clearly marked as a placeholder.

The order-by MUST show **which tier it used** — e.g. "order by Jul 25 · 14d (set)" / "…~18d (observed)" / "…30d (default — set to improve)". Lead time is set per item in the catalog (New item / Edit item details, FR-1a), **local to the lab** (single-tenant; never a shared/seeded attribute — the same item takes different times to arrive at different labs). An item's reorder status comes from the single reorder model (FR-20a): **Reorder now** when on-hand is at/below its reorder threshold; **Reorder soon** when projected to reach it within its effective lead time.

**FR-3a (learn the real lead time — don't make staff guess):** The system MUST estimate each item's lead time from its own history — the elapsed time from **marked-as-ordered** (FR-21, timestamped) to the next **receipt** of that item — as a **median over recent cycles** (spike-robust). When an observed estimate exists and the value is unset or materially different, the item editor MUST surface it as a **suggestion** ("Observed lead time ~18 days from your last 3 deliveries — use this?") the user can accept (which writes the set value) or dismiss. The system MUST NOT silently overwrite a user-set lead time — it suggests; the user decides. This makes the feature meaningful for labs that never fill lead time in: it fills itself from what actually happens.

**FR-4 (sort & status):** Rows default-sort by urgency (CRITICAL, then LOW, then ascending run-out date); column sorting remains available. Status uses Carbon Tag kinds per the style guide (P-15).

**FR-5 (alerting — acknowledge to quiet):** When an item is CRITICAL, it appears in a page-level error banner **only while unaddressed**. An item leaves the banner when it is **marked as ordered** (§4.5) or **acknowledged** — using the same acknowledgment pattern as critical-result alerts (acknowledge with optional comment) — moving to a calm "known / on order" state that remains visible in the table. A newly-arising CRITICAL still breaks through. CRITICAL items also post to the existing **Alerts** module. (Refines P-16: non-dismissible was correct for transient criticals; persistent operational criticals use acknowledge-to-quiet.)

**FR-6 (row expansion):** A row expands inline (P-05) to show its **lots** — lot number, expiry, quantity, lot status, QC status, and **storage location from the shared sample Storage model** (OGC-657) — with the earliest-expiring usable lot marked "**use first**." The expansion offers the row actions: **"Receive stock"** (FR-9a, add more of this existing item), **"Adjust stock…"** (§4.4, reason-coded), **"Record usage"** (§4.6), and **"Edit item details"** (FR-1a). Counting is done via Count mode (FR-8a), not a per-row count action. No "adjust lot" jargon.

**FR-6-fefo (one earliest-expiry (FEFO) model, owned at the bench):** The "use first" marking sorts by **earliest expiry (FEFO)** — by expiry date, **not receipt order**. It MUST be the **same rule the Results Entry reagent-usage design applies at consumption** (which surfaces it as "FIFO Suggested" — same intent: oldest *unexpired* lot first). Inventory displays it; Result Entry enforces it where a reagent is actually used. Both MUST sort by expiry, not receipt date, and there MUST NOT be two divergent rules — this is where waste is actually prevented (the bench), so Inventory's badge and the result-entry suggestion agree by construction. *(Coordination: confirm the Results Entry design sorts by expiry.)*

**FR-6a (see the working — median daily use):** The row expansion MUST show a **median daily-use figure** over the trailing window (e.g. "median 3 tests/day, last 30 days") so a user who doubts a projection can see the number behind it. Use the **median, not the mean** — one outbreak day should not distort it. Do **not** render a sparkline/mini-chart here; at this size it adds visual clutter without adding decision value. (A fuller usage history can live in the existing `lot.details` usage tab.)

**FR-8a (Count mode — on the Items board, not a separate view):** The board MUST offer a **Count mode** toggle. In Count mode, each row's on-hand becomes a count-entry field showing **expected vs counted** with the discrepancy highlighted; for lot-tracked items counts are entered per lot in the expansion. Count mode MUST be **scopeable to a storage location/section** (using the same location filter as FR-1b), because a physical count is walked one shelf or fridge at a time — counting the whole catalog at once is neither how it's done nor safe. **Only rows the user actually enters a count for are committed** — untouched rows are left unchanged (no accidental zeroing). The user MAY **add an item found on the shelf but not listed**, MAY **scan a lot barcode** (FR-9b) instead of finding the row, and MAY be prompted to **dispose** an expired lot rather than count it. Confirming commits one auditable **count session** (existing ADJUSTMENT transactions) and stamps each counted item's "last count" date. A session is abandonable with no partial effect.

**FR-6b (on-hand is a total, but location is visible):** The on-hand figure is the sum across the item's lots, but the row expansion MUST show **per-location quantities** (from each lot's storage location), and the board MUST be **filterable by location**, so a tech working at one fridge can see what is actually *there* rather than only a facility-wide total. (Multi-location labs otherwise read the sum as "what's on this shelf" and are misled.)

**FR-7 (cold start & insufficient data):** An item with too little consumption history MUST NOT show a fabricated date. Instead it shows a simple **threshold-based status** (from the item's low-stock threshold) with the note that a run-out projection will appear once enough usage is recorded. This keeps day-one and new-item rows useful rather than a wall of dashes.

**FR-8 (trend integrity):** The trend indicator shows direction and magnitude (e.g. "▲ 40% / 30d") computed on a **median (spike-dampened) basis**, so a single outbreak-day surge does not dominate. For low-volume items below a configurable minimum, the trend is suppressed and labelled "low volume" rather than reporting a noisy percentage. A user MAY mark a consumption day as a one-off anomaly to exclude it (this mark is the seed of the future expert-input channel, §8).

### 4.2 Item type (a tag, not a managed entity)

**FR-8b (type is a free-form tag):** Item "type" is **metadata — a tag — not a curated entity.** There is no `inventory_item_type` table with behaviour/code/PK. In the item editor, type is a **typeahead that suggests existing tags and lets the user add a new one inline** if it isn't found. An item MAY carry more than one tag (e.g. `cartridge` + `HIV`). Tags are used only for grouping, filtering (FR-1b), and reporting. *(This supersedes the earlier "item types managed in-context" decision and **replaces OGC-658** — see §9. A curated type entity carried nothing that couldn't move elsewhere; FR-8c relocates the two behaviours it used to hold.)*

**FR-8b-ii (an item's tags are edited as chips, not one field):** In the item editor an item's tags MUST be managed as **add/remove chips** — a typeahead adds a tag (suggesting existing ones, add-new inline), each applied tag shows as a removable chip. A single text field is wrong because an item can carry several tags (P-08 — show labels).

**FR-8b-i (lightweight tag directory — governance, not a managed entity):** Because tags are free-form, the module MUST give a light way to keep them tidy — this is metadata governance (a directory), **not** the behaviour-bearing item-type entity that was removed:
- **See them all:** a **"Manage tags"** view/panel listing every tag with its **usage count** (how many items carry it), so duplicates and one-offs are visible.
- **Create:** new tags are added **inline at point of use** (item editor) and MAY also be added from the directory.
- **Deactivate / reactivate (no hard delete, D-002):** a tag can be **deactivated** to curb sprawl — it stops being **suggested** for new tagging and drops out of filter options by default, but **items already carrying it keep it** (nothing is stripped or destroyed); a **"show deactivated"** toggle reveals them, and deactivation is reversible. This is how a lab consolidates `glove` vs `gloves` without losing history.
- Renaming a tag is out of v1 scope (deactivate the dupe + retag is the v1 path); note as a possible enhancement.

**FR-8c (the two behaviours that used to hang on "type"):**
- **Track lots?** is a **per-item property** (a cartridge tracks lots; a box of gloves does not), set in the item editor (FR-1a) — not a property of a tag.
- **Auto-consume is derived, not set:** an item is auto-consumed from test activity exactly when it has an active **Test↔Reagent link** (`test_reagent_link`). There is no auto-consume flag. Items without a link decrease via **record usage** (§4.6), count mode, and adjustments — and the projection basis (FR-2) reflects that ("based on recorded usage / count history").
- **Where auto-consume events come from:** the deduction happens at **result entry**, owned by the Results Entry reagent-usage design — it writes a `ReagentConsumptionEvent` (which maps to the inventory `CONSUMPTION`/`InventoryUsage` record) when a result is saved, and credits back on void/downward edit. This Inventory module **consumes those events; it does not re-implement consumption capture at the bench.** Manual "record usage" (§4.6) covers items/tests not yet linked. **Access for recording usage at result entry is simply results-page access (`results.modify`) — no separate reagent permission** (§3).

### 4.3 Receive (adding stock — two entry points)

Receiving has two entry points, mirroring how counting works (a full surface plus a per-row shortcut), so the common "just got more of one item" case is one click and the periodic "whole delivery" case has a dedicated flow:

**FR-9a (per-row "Receive stock" — the common case):** Each item row MUST offer **"Receive stock"** (from the row action menu, FR-1c) to add more of *that existing item*: quantity, and — if the type tracks lots — lot number and expiry (and optional storage location). Saving records a RECEIPT and immediately updates the board's on-hand and projection. This is the everyday path and MUST NOT require opening the full Receive surface or defining anything new.

**FR-9b (scan, don't type):** Receiving and counting MUST support **barcode scan** of a lot (populating lot number and, where encoded, expiry — reusing `InventoryLot.barcode` and OpenELIS's existing barcode support), so staff are not hand-keying long lot numbers and dates off the box. Manual entry remains available as a fallback. Rationale: hand-typed lots/expiries are the slowest, most error-prone step, and expiry errors corrupt FEFO ordering and alerts.

**FR-9c (UPC on the catalog item → two-scan receive):** An item MAY store a **UPC/GTIN** (the manufacturer product barcode identifying the *kind* of item — distinct from a lot barcode, which identifies a *specific* lot). When present, receiving becomes **scan product → scan lot → enter quantity**: the first scan matches the item by UPC (no searching/typing the item), the second fills lot + expiry (FR-9b), then quantity. (Where the lot label is a GS1‑128 that encodes GTIN + lot + expiry together, a single scan MAY satisfy both steps.) If a scanned UPC matches no item, the system offers to define a new item (FR-1a) with the UPC pre-filled. Assumes the lab has a barcode reader; manual selection/entry remains the fallback.

**FR-9 (Receive surface — a whole delivery):** The Receive surface MUST support rapid repeated entry across many items. **When a scanner is available, scanning is the primary path: a scan into the first field identifies the item and — for a GS1 lot label — fills lot + expiry, leaving quantity as the only required entry (scan → type quantity → add → scan next).** Manual entry (item typeahead P-09, lot, expiry, optional location) is the fallback. Either way it's save-and-next in one action, with the running list of just-received lines visible and editable on the same screen. It is kept as a distinct surface because entering a multi-item delivery is ergonomically different from the single-item shortcut.

**FR-10:** For item types that don't track lots, receiving asks only item + quantity (lot/expiry fields don't appear).

**FR-11:** Receiving a lot already past expiry MUST warn but not block (labs legitimately receive short-dated stock); the lot is flagged expiring/expired immediately.

**FR-12:** An item not yet in the catalog MUST be reachable from within the flow via a clearly-labelled link to catalog management (not an inline full-item-creation form, C2); on return the user resumes the delivery without losing entered lines.

**FR-13:** Each received line records a receipt transaction (existing RECEIPT type) and immediately updates the Items board's quantities and projections.

### 4.4 Adjust stock (reason-coded row action)

**FR-19:** "Adjust stock…" MUST let a user change a lot's quantity for a **reason that is not a recount** — damage, spillage, disposal/expiry write-off, transfer out — selected from a reason picker mapped to the existing transaction types (ADJUSTMENT / DISPOSAL). It is distinct from Count (which reconciles to a physical count) and from normal test consumption. Guidance on the control states: *"Use Count if you recounted the shelf; use Adjust to record damage, disposal, or loss."*

### 4.5 Reorder suggestions & "mark as ordered"

**FR-20:** From the Items board the user MUST be able to open **Reorder suggestions** — the items that need ordering, each with a suggested quantity — viewable on screen, printable, and exportable (CSV). It is **named "suggestions," not "list/order," deliberately: it is advisory and does not create or place an order.** OpenELIS does not place orders in v1.

**FR-20a (what counts as "needs ordering" — threshold + each item's own lead time):** An item is in Reorder suggestions when **either**:
- (a) on-hand is **at or below its reorder threshold** (the item's low-stock/reorder point — the existing `low_stock_threshold`), **or**
- (b) it is **projected to reach that threshold within its own effective lead time** (FR-3), using the conservative (early) end of the median-based projection (FR-2) — i.e. you'd need to order now for it to arrive before you cross the line.

Using **each item's effective lead time as its look-ahead** (rather than one global horizon) means a slow-to-arrive item flags earlier than a fast one — which is what the user actually needs. A single optional **safety buffer** (extra days, instance-set, small default) MAY widen (b) uniformly for a margin of caution. Items without enough history to project (cold start, FR-7) qualify on test (a) alone. The user MAY add any item manually. This is the **same rule that drives the board's Reorder now / Reorder soon badges** (now = test a; soon = test b), so suggestions and badges always agree. A static "below threshold now" list was rejected because it ignores items visibly about to cross the line before resupply could arrive.

**FR-20b (bulk, because one order covers many items):** Reorder suggestions MUST support **multi-select with a bulk "Mark selected as ordered"** (and bulk export of the selected set), so placing one order across a dozen items is a single action, not a dozen. Per-item mark-as-ordered (FR-21) remains for one-offs.

**FR-21:** The user MUST be able to **mark an item as ordered** (optionally with a note/expected date). The mark records an **ordered-at timestamp** — this is what lets the system learn the real lead time (FR-3a) from the gap to the next receipt. An on-ordered item shows an on-order indicator (FR-1), is quieted from the CRITICAL banner (FR-5), and its projection MAY note that resupply is expected. Marking-as-ordered is reversible.

### 4.6 Record usage (manual consumption)

**FR-22:** For item types that are not auto-consumed via the Test↔Reagent link (or where the user needs to log off-system use), the user MUST be able to **record usage** — item, quantity, done — which posts a **CONSUMPTION** transaction (not an ADJUSTMENT), so manual usage feeds the same run-out and trend history as automatic consumption. The distinction matters: consumption feeds demand/forecast; an adjustment is a correction and does not.

**FR-22a (quick-log — the fast path for a frequent action):** Because manual usage can happen many times a shift, there MUST be a **search-first quick-log** reachable directly from the board (a persistent "Log usage" affordance): type the item, enter a quantity, submit — without first scrolling to and expanding the row. This is the same CONSUMPTION action as FR-22, optimized for repetition.

### 4.7 Reports

**FR-23:** Reports MUST provide four basic reports, each filterable by date range and item type, viewable on-screen and exportable as CSV: **Received** (by item/lot), **Consumed** (by item), **Stock on hand** (as of date, with lots and expiry), and **Expiring** (lots expiring within a chosen window).

**FR-24:** Report generation MUST work (replacing the broken generate endpoint, BUG-45) and render with the module's i18n strings — resolving the raw-key class of bug (OGC-1052) by string replacement across the module. Reports are scoped to this instance only (D-001).

### 4.8 Navigation & IA

**FR-28:** SideNav: **Inventory → Items / Receive / Reports** (submenus per D-003, replacing the current in-page tabs). Count is a **mode on the Items board** (FR-8a), not a nav item; tag management is **in-context** on the board (FR-8b-i), not under Admin. Breadcrumbs Home-first. Routes extend the existing `/inventory` route (`/inventory` = Items, `/inventory/receive`, `/inventory/reports`) — deep-linkable, verified against the live app during implementation.

### 4.9 User guidance (so users know what to do)

**FR-29:** Every surface MUST carry a one-line **purpose statement** telling the user what it is for and the primary action (e.g. Items: *"What you have and what to reorder. Add or edit items here; flip Count mode to reconcile the shelf."*).

**FR-30:** Every list/table MUST have an **empty state** that says what's missing and how to recover (style-guide §8.3 recovery-hint pattern) — e.g. the Items board with no items: *"No inventory items yet. Add an item to start tracking it, then receive stock."*

**FR-31:** Actions MUST use plain, self-explanatory labels with helper text where a choice is non-obvious (the Count-vs-Adjust guidance in FR-19 is the canonical example). No unexplained domain jargon on controls.

**FR-32 (works at the shelf — responsive):** The **Items board (incl. Count mode) and Receive** MUST be usable on a **tablet** held at the shelf/fridge, not only a desktop — these are walk-around tasks performed away from a desk. Layout MUST reflow to tablet widths (single-column, touch-sized targets) rather than assuming ≥1280px. Reports MAY remain desktop-oriented.

---

## 5. Data: existing vs new

**Existing (verified against `DIGI-UW/OpenELIS-Global-2` develop, 2026-07-22)** — the module builds on: `InventoryItem`, `InventoryLot` (lot status, QC status), `InventoryUsage` (analysis-linked), inventory transactions (RECEIPT / CONSUMPTION / ADJUSTMENT / DISPOSAL / OPENING / QC_TEST / MANUAL), the inventory alerts service, the Test↔Reagent linkage (`test_reagent_link`), and the OGC-436 forecasting engine. **Storage: the shared sample Storage model** — a lot's location is a reference into the same storage hierarchy samples use (OGC-657, in progress); the redesign does **not** define an inventory-specific storage table.

**New, named data (Dependencies — the only genuinely new elements):**

| Element | What it is | Ticket |
|---|---|---|
| Item **type tag(s)** | Free-form tag(s) on the item (no `inventory_item_type` table, no managed entity); typeahead suggests existing tags, add-inline if missing; used for grouping/filtering/reporting only (FR-8b) | this FRS (replaces OGC-658) |
| Per-item **track-lots** property | Whether this item tracks lots/expiry — an item property, not a type's (FR-8c) | this FRS |
| **Effective lead time** (tiered: set → observed → default) | Drives order-by + reorder-soon look-ahead. **Set** = per-item catalog value (local to the lab); **Observed** = median of order→receipt cycles (FR-3a); **Default** = global instance placeholder. Order-by shows which tier it used (FR-3) | this FRS |
| **Ordered-at timestamp** on the on-order state | Recorded by mark-as-ordered (FR-21); paired with the next receipt to compute observed lead time | this FRS |
| **Observed lead time** (derived) | Median elapsed order→receipt per item over recent cycles; surfaced as a suggestion, never a silent overwrite (FR-3a) | this FRS |
| Global default lead time + optional safety buffer (instance settings) | Placeholder lead time when none set/observed; buffer widens reorder-soon (FR-3/FR-20a) | this FRS |
| **UPC/GTIN** on the item | Manufacturer product barcode identifying the *kind* of item; enables scan-to-identify on receive (FR-9c). Distinct from `InventoryLot.barcode` (a specific lot) | this FRS |
| Consumption rate distribution (median + dispersion) | Over the trailing window, per item — the **median daily use drives the central estimate** (spike-robust) and its **dispersion drives the run-out window** (FR-2). Not a single stored date, not the mean | this FRS + OGC-436 coordination |
| Run-out **window** + order-by | Derived from the distribution above: ±1SD range for run-out; order-by = early-end minus lead time (FR-3) | this FRS |
| Count session | Groups a physical count's adjustments into one auditable event; commits only touched rows | this FRS |
| "On order" state | Marks an item as ordered (note/expected date); quiets alerts, shows on-order | this FRS |
| Manual consumption entry | A user-recorded CONSUMPTION transaction for non-auto-consume items (reuses existing transaction type) | this FRS |

Storage location reuses the shared model (no new element). Where this spec and OGC-436's engine meet (generalizing projections beyond cartridges), that is a declared coordination point, not a unilateral change.

**FHIR alignment (constraint on concept shape; see §8 for the Part-2 build).** Concepts SHOULD map to HL7 FHIR supply resources so the central-repo push and future OpenLMIS interop are mapping exercises, not redesigns:

| Module concept | FHIR resource |
|---|---|
| Inventory item (catalog definition) | `InventoryItem` (+ `Medication`-style definition where relevant) |
| A received delivery / lot receipt | `SupplyDelivery` |
| A reorder / request (future) | `SupplyRequest` |
| On-hand snapshot / count | `InventoryReport` |

---

## 6. Business Rules

**BR-1 (single-tenant):** The module shows this instance's stock only — no facility selectors or cross-lab views (D-001). Cross-lab visibility is served downstream (§8), not by an OpenELIS surface.

**BR-2 (projections never overstate):** A firm run-out date is shown only when backed by sufficient, sufficiently-fresh history; otherwise the surface hedges (FR-2) or shows threshold status (FR-7). The basis is always visible; trend adjustment is transparent.

**BR-3 (expired/quarantined excluded):** Expired or quarantined lots are excluded from usable stock in all projections and count expectations.

**BR-4 (oldest-first):** Wherever lots are listed, the earliest-expiring usable lot is marked "use first." The system guides; it does not block using another lot.

**BR-5 (auditability):** Every stock movement is a transaction with user and timestamp (existing model). Counts group their adjustments into one auditable session. Consumption (auto or manual) and adjustments are distinct transaction types.

**BR-6 (no hard delete):** Items and item types deactivate; lots move through lifecycle statuses (P-18).

**BR-7 (kit vs test unit):** Where an item is a multi-test kit, on-hand, consumption, and projections MUST use a single consistent unit and label it; an opened kit's shortened effective expiry (existing `calculated_expiry_after_opening`) MUST be surfaced, not hidden.

---

## 7. Localization

Per Constitution Principle VII (Key Reuse & Hygiene) and the `openelis-ui-vocabulary` step, this table was reconciled against the live `en.json` (`DIGI-UW/OpenELIS-Global-2` develop, 7,201 keys, checked 2026-07-22). **Key finding: the shipped Inventory module already owns a rich vocabulary** (`inventory.*`, `stock.*`, `lot.*`, `catalog.item.*`, `usage.*`, `adjustment.*`, `disposal.*`). The redesign **extends those namespaces and reuses existing keys** — it does **not** mint a parallel `inventory.items.*` set. Status column: **REUSE** (existing key, use exact English) / **NEW** (genuinely-new English, domain-namespaced) / **PROMOTE** (needed generically; add a `common.*` and repoint).

### Reuse (existing keys — do not re-mint)

| UI text | Key | Status |
|---|---|---|
| Inventory | `sidenav.label.inventory` / `banner.menu.inventory` | REUSE |
| Dashboard / Catalog / Reports (if tabs referenced) | `inventory.tab.*` | REUSE |
| Reports | `common.reports` | REUSE |
| Lot Number | `lot.number` | REUSE |
| Expiration Date | `lot.expirationDate` | REUSE |
| Calculated Expiry (opened-kit) | `lot.calculatedExpiry` | REUSE |
| Current Quantity (on-hand) | `lot.currentQuantity` | REUSE (display "on hand" concept as Current Quantity / Available) |
| Stock Level / Available | `stock.level` / `stock.available` | REUSE |
| Storage Location | `lot.storageLocation` / `common.storageLocation` | REUSE |
| Receipt Date | `lot.receiptDate` | REUSE |
| Barcode | `lot.barcode` | REUSE |
| QC Status / Status | `lot.qcStatus` / `common.status` | REUSE |
| Item Name / Item Type / Category / Units | `catalog.item.name` / `.type` / `.category` / `.units` | REUSE |
| Manufacturer | `catalog.item.manufacturer` | REUSE |
| Low Stock Threshold | `catalog.item.lowStockThreshold` | REUSE (this *is* the reorder threshold, FR-20a) |
| Reorder Level / Reorder Quantity | `catalog.item.reorderLevel` / `.reorderQuantity` | REUSE |
| Compatible Analyzers / Tests Per Kit | `catalog.item.compatibleAnalyzers` / `.testsPerKit` | REUSE |
| Deactivate (+ confirm/implications) | `common.deactivate` / `catalog.item.deactivate.*` | REUSE |
| Record Usage / Quantity Used | `usage.record.button` / `usage.quantityUsed` | REUSE (the module frames "consumption" as **Usage**) |
| Usage History (recent-usage drill-in, FR-6a) | `lot.details.tab.usage` | REUSE |
| Adjust Quantity / Reason for Adjustment | `adjustment.button` / `adjustment.reason` | REUSE (Adjust stock, FR-19) |
| Dispose Lot / Disposal Reason | `disposal.button` / `disposal.reason` | REUSE (FR-8a expired-lot path) |
| Receive New Inventory Lot | `lot.form.title.add` | REUSE (Receive, §4.3) |
| Expiring / Expired | `stock.status.expiring` / `stock.status.expired` | REUSE |
| Search by item name or lot number | `inventory.search.placeholder` | REUSE (FR-1b search) |
| Filter by Status / Filter by Type | `inventory.filter.status` / `inventory.filter.type` | REUSE (FR-1b; "type" filter now filters by tag) |
| From / To | `common.from` / `to.title` | REUSE |
| Export CSV | `reports.tat.exportCsv` | REUSE |
| Acknowledge | `alerts.acknowledge.button` | REUSE (FR-5 ack-to-quiet) |
| days | `label.days` | REUSE (lead time, buffer) |
| Save / Cancel / Confirm / Actions / Date / Notes / New / Edit | `common.*` | REUSE |

### New (genuinely-new English — domain-namespaced under `inventory.*`)

| UI text | Key | Status |
|---|---|---|
| Items (board title) | `inventory.board.title` | NEW |
| What you have and what to reorder… (purpose line) | `inventory.board.purpose` | NEW |
| Runs out {early}–{late} (±1SD window) | `inventory.projection.window` | NEW |
| based on usage through {date} | `inventory.projection.basis` | NEW |
| Watch — usage data may be out of date | `inventory.projection.stale` | NEW |
| Projection appears once enough usage is recorded | `inventory.projection.insufficient` | NEW |
| Low volume | `inventory.projection.lowVolume` | NEW |
| Usage trend | `inventory.projection.trend` | NEW |
| Order by | `inventory.orderBy.label` | NEW |
| {n}d (set) / ~{n}d (observed) / {n}d (default — set to improve) | `inventory.orderBy.leadSet` / `.leadObserved` / `.leadDefault` | NEW |
| Lead time (days) | `inventory.item.leadTime` | NEW |
| Observed lead time ~{n} days from your last {c} deliveries — use this? | `inventory.item.leadTime.observedSuggest` | NEW |
| Safety buffer (days) | `inventory.reorder.buffer` | NEW |
| Reorder now / Reorder soon / Adequate / Building data | `inventory.reorderStatus.now` / `.soon` / `.adequate` / `.buildingData` | NEW (decision-support framing; distinct from `stock.status.*`) |
| Reorder suggestions | `inventory.reorder.suggestions` | NEW |
| Mark as ordered / On order | `inventory.reorder.markOrdered` / `.onOrder` | NEW |
| Receive stock (per-row) | `inventory.receiveStock.button` | NEW |
| Scan product / Scan lot | `inventory.scan.product` / `.lot` | NEW (unless `barcode.*` scan verbs fit — verify) |
| UPC / product barcode | `inventory.item.upc` | NEW |
| Type (tag) / Add "{value}" as a new tag | `inventory.item.tag` / `.tag.add` | NEW |
| Manage tags / Tag / Items ({count}) / Deactivate / Show deactivated tags | `inventory.tags.manage` / `.tags.tag` / `.tags.usage` / `.tags.deactivate` / `.tags.showDeactivated` | NEW |
| Filter by tag | `inventory.filter.tag` | NEW |
| Track lots & expiry | `inventory.item.trackLots` | NEW |
| Count mode / Confirm count / only rows you enter are saved | `inventory.count.mode` / `.confirm` / `.touchedOnly` | NEW |
| Add an item not on the list | `inventory.count.addUnlisted` | NEW |
| Use first (FEFO) | `inventory.lot.useFirst` | NEW |
| Reorder now — will run out before resupply (banner) | `inventory.alert.reorderNow` | NEW |
| New item / Define a kind of item you stock | `inventory.item.new` / `.new.helper` | NEW |
| No inventory items yet. Add an item… (empty state) | `inventory.board.empty` | NEW |

### Promote (needed generically; add to `common.*`)

| UI text | Proposed key | Status |
|---|---|---|
| Catalog Number | `common.catalogNumber` | PROMOTE (no existing key; likely wanted elsewhere) |
| Show deactivated | `common.showDeactivated` | PROMOTE (generic list affordance, D-002 pattern) |

Guidance strings (Adjust-vs-Count helper, receive helpers) reuse the shipped `usage.*`/`adjustment.*` helper texts where they fit; new guidance is domain-namespaced. This reconciliation also resolves the OGC-1052 raw-key class by using resolved keys throughout.

---

## 8. Roadmap — Part 2 and beyond (named, out of v1 scope)

- **Push inventory to the central FHIR repository via FHIR transactions.** OpenELIS already syncs resources to the consolidated store via its subscriber; inventory rides the same rail using the FHIR supply resources in §5. This is the interoperability backbone.
- **Multi-lab oversight is a downstream external BI dashboard** (Superset / Power BI or similar) consuming the central FHIR data — **not** a screen in OpenELIS. OpenELIS stays single-tenant; the national picture is assembled outside it.
- **Ordering / request workflow** (`SupplyRequest`) — turn the advisory reorder list into actual requests; natural point for OpenLMIS interop.
- **Expert demand input** — let staff tell the system about a known upcoming change (season/campaign) via a demand multiplier for a window, or a manual rate override with an expiry, clearly badged. The one-off anomaly mark in FR-8 is the first primitive of this channel.
- **Unit-of-measure conversion** for consumables received in cases/boxes.

---

## 9. Risks / Open Questions

- **Auto-consume coverage drives projection quality.** If Test↔Reagent links aren't configured or tests are entered late, projections lean on the FR-2 hedge and manual usage (FR-22). Rollout should include a link-coverage check; low coverage is a data-quality risk, surfaced honestly, not hidden.
- **Lead-time accuracy — now self-correcting.** Rather than trusting a static entry, the system learns the real lead time from each item's order→receipt history (FR-3a, median) and suggests it; unfilled items fall back to observed, then a flagged global default. Remaining watch: the observed estimate needs a few completed cycles to stabilize, and depends on staff using "mark as ordered" — surface low confidence until enough cycles exist, and treat the default as a clearly-labelled placeholder.
- **Barcode & tablet now in scope (were previously deferred).** FR-9b (scan) and FR-32 (responsive) were reconsidered rather than quietly dropped, because they land on the highest-frequency physical tasks (receive, count). Confirm the deployment's scanners/tablets and OpenELIS's barcode support cover the lot-label formats in use.
- **±1SD window needs enough history to be meaningful.** With sparse data the SD is unstable; below the FR-7 history threshold, show threshold status rather than a misleadingly tight or absurdly wide window.
- **Single-tenant oversight — resolved, not deferred.** No multi-lab OpenELIS surface by design; the national view is the §8 FHIR-fed BI dashboard. Pressure-test against PNG/CPHL's deployment model to confirm no lab needs an in-OpenELIS cross-site view before that dashboard exists.
- **OGC-657 timing.** This FRS depends on the shared-storage wiring (OGC-657, in progress). Confirm it has merged before building the storage-dependent parts of the row expansion.
- **Item type → tag reverses a prior decision and closes OGC-658.** The v1.2 "types managed in-context" decision and OGC-658 (the `inventory_item_type` CRUD) are superseded by type-as-tag (FR-8b/8c). Action: close OGC-658 with a supersession note; log the reversal in the decision log. Migration note: the existing five enum values become seeded tags on existing items so nothing is lost.
- **Consumption/FEFO ownership (coordination, not duplication).** Point-of-consumption reagent usage and FIFO live in the Results Entry reagent-usage design (v1/v2.1, dep m-12/OGC-784). Inventory consumes those events and mirrors the FEFO marking. Confirm the event shape (`ReagentConsumptionEvent` ↔ inventory `CONSUMPTION`/`InventoryUsage`) is shared, and that void/downward-edit credit-backs reconcile with the projection.
- **Access granularity vs D-006 — mostly settled.** The common path is simple: recording reagent usage = results-page access; using the board = the Inventory bundle. The only open question is whether *governance* actions (deactivate, thresholds, import) can sit with a manager bundle in the current role model; if not, accept coarser access rather than mint per-action keys. Raise with the RBAC owner.
- **Tag sprawl — mitigated.** Free tags can drift ("glove" vs "gloves"); the typeahead suggests existing tags first, and the tag directory (FR-8b-i) surfaces usage counts and lets a lab deactivate duplicate/obsolete tags without losing history. Watch that deactivation UX stays lightweight (governance, not the old managed-entity).
- **One-board density.** The Items board carries a lot (catalog + stock + count mode + actions). Watch that Count mode stays a clearly separated state so the board doesn't feel overloaded; validate in usability review.

---

## 10. Out of Scope (deferred, named)

Ordering/request workflow (Part 2) · OpenLMIS / FHIR supply interop beyond the central-repo push (Part 2) · in-OpenELIS multi-lab/oversight surface (served by external BI) · unit-of-measure conversion · SMS notification (OGC-437's lane) · storage-location *management* (OGC-657/Storage module owns it — this module displays and assigns lot locations, doesn't manage the hierarchy) · blood-product inventory (OGC-457's domain) · forecasting-model changes beyond trend adjustment + spike dampening · expert demand input (Part 2; anomaly-mark primitive is in scope).

---

## 11. Acceptance Criteria (user-level)

- [ ] The **Items board** is one list that is both the catalog and live stock: a user can define/edit an item and see its run-out/order-by/status in the same place — there is no separate Catalog surface
- [ ] **"New item"** clearly defines a *kind* of item (catalog entry) and is worded so it is not mistaken for adding stock; adding more of an existing item is **"Receive stock"** on the row, and a whole delivery is the Receive surface
- [ ] A user receives more of one existing item via the row's **"Receive stock"** (quantity + lot/expiry if lot-tracked) without opening the full Receive surface or defining anything new
- [ ] A user can **search and filter** the board (name, type, status, location) and finds an item in a large catalog without scrolling
- [ ] The common actions (**Receive stock, Record usage, Adjust**) are reachable from a per-row action menu without expanding the row
- [ ] A **quick-log** (search item → quantity → submit) records usage from the board without locating and expanding the row
- [ ] Opening Inventory, a technician sees which items run out soonest, shown as a **run-out window (±1SD range), not a single date**, plus the order-by date and the date the estimate is based on
- [ ] A steady item shows a tight window and an erratic item a wide one; order-by is derived from the window's early (conservative) end
- [ ] A projection with stale or under-linked data shows a "watch — data may be out of date" state, never a confident window
- [ ] An item with no lead time shows the run-out window only and prompts to set a lead time; it never shows a fabricated order-by
- [ ] Expanding a row shows **recent usage (last 30 days)** so the projection can be checked
- [ ] **Count mode** can be scoped to a storage location/section and commits only the rows the user actually counted
- [ ] Lots can be **scanned** (barcode) on receive and count instead of hand-typing lot number/expiry, with manual entry as fallback
- [ ] An item can store a **UPC/GTIN**, so receiving a known item is **scan product → scan lot → enter quantity**; an unknown UPC offers to create the item with the UPC pre-filled
- [ ] The Items board, Count mode, and Receive are usable on a **tablet** at the shelf (responsive, touch targets), not desktop-only
- [ ] An item trending up shows the trend (spike-dampened) and an accordingly earlier run-out; a low-volume item shows "low volume," not a noisy percentage
- [ ] A new/low-history item shows threshold status with a "projection appears later" note, not a dash
- [ ] CRITICAL items appear in the banner only while unaddressed; marking as ordered or acknowledging quiets them (same pattern as critical-result ack) and they still show in the table; they also appear in Alerts
- [ ] A user opens **Reorder suggestions** (suggested quantities) from the board, prints/exports it, and marks items as ordered
- [ ] A user records usage for a non-auto-consume item (row action) and its projection updates (recorded as consumption, not adjustment)
- [ ] Expanding a row shows lots with expiry, status, QC, storage location (shared sample Storage model), and "use first"; the row offers "Adjust stock…", "Record usage", and "Edit item details"
- [ ] **Count mode** on the board turns on-hand cells into count entry, shows expected/discrepancy inline, lets the user add an item found but not listed, prompts disposal for expired lots, and commits as one confirmed count session — with no separate Counts screen
- [ ] Receiving a 5-lot delivery takes under 2 minutes and updates the board immediately; a non-lot type asks only item + quantity; an unlisted item is reachable without losing entered lines
- [ ] "Adjust stock…" records a reason-coded change (damage/disposal/loss), distinct from a count
- [ ] Each report renders and exports CSV for a chosen date range; no raw i18n keys anywhere (OGC-1052 class gone)
- [ ] Item **type is a free-form tag**: the editor's type field is a typeahead that suggests existing tags and adds a new one inline; there is no `inventory_item_type` entity; an item may carry more than one tag
- [ ] The board's **tag filter is multi-select** (chips with labels, P-08); an item matches any selected tag; search also matches tags
- [ ] A **Manage tags** view lists every tag with its usage count; tags can be **created** (inline at point of use and here) and **deactivated/reactivated** (no hard delete) — a deactivated tag stops being suggested/offered but existing items keep it; a "show deactivated" toggle reveals them
- [ ] An item's tags are edited as **add/remove chips** (typeahead to add, × to remove), not a single field
- [ ] **Consumption/FEFO come from Result Entry:** auto-consume is the `ReagentConsumptionEvent` written at result entry (deduct + credit-back), and the "use first" marking is the same FIFO rule the Results Entry design applies — Inventory shows it, Result Entry enforces it; no parallel model
- [ ] **Reorder suggestions supports multi-select** with "Mark selected as ordered" and export of the selected set
- [ ] The row expansion shows **per-location quantities** and the board can **filter by location**, so on-hand isn't misread as "what's on this shelf"
- [ ] The catalog offers a **CSV import that reuses the Test Catalog import pattern** (download template → upload → row validation + preview → commit; idempotent update-on-match) to seed a fresh deployment; scanning an unknown UPC offers create-with-UPC-prefilled
- [ ] **Recording reagent usage at result entry needs only results-page access** (`results.modify`) — no separate reagent/inventory permission; anyone who can enter results can record a reagent
- [ ] The Inventory board rides the Inventory bundle; governance actions (deactivate, thresholds, import) may sit with a manager bundle where the model allows — no per-action keys invented
- [ ] **Track-lots is a per-item property** and **auto-consume is derived** from the Test↔Reagent link (no auto-consume field anywhere)
- [ ] **Lead time is entered locally per item** by the lab and is never assumed from a shared catalog
- [ ] **Reorder suggestions** includes items **at/below their reorder threshold** and items **projected to reach it within their own effective lead time** (+ optional safety buffer); cold-start items qualify on threshold alone; manual adds allowed — and the board's Reorder now/soon badges use the same rule
- [ ] **Effective lead time** resolves set → observed → default, and order-by always shows which tier it used; an unfilled item still gets a meaningful order-by
- [ ] The item editor **suggests an observed lead time** learned from order→receipt history ("~18d from your last 3 deliveries — use this?"); it never silently overwrites a set value
- [ ] Every surface shows a one-line purpose; every empty list explains what to do next; no unexplained jargon on any control
- [ ] All strings render via i18n keys; no facility/site selector anywhere
