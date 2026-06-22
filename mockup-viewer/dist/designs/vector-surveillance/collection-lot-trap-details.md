# Vector Collection Workflow — Trap Detail Fields

**Source ticket:** [OGC-777](https://uwdigi.atlassian.net/browse/OGC-777) — V-05a VectorSpecimen Trap-Detail Fields (STRETCH)
**Parent epic:** [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527)
**Host screen:** V-02 Vector Collection Workflow ([OGC-581](https://uwdigi.atlassian.net/browse/OGC-581), already ✅ Done)
**Consumed by:** [OGC-552](https://uwdigi.atlassian.net/browse/OGC-552) — S-06 LHU v2.0 Mode A "Penjebakan / Trap details" footnote + Sample Info block

---

## Overview

A small enhancement to the existing **CollectionLot** edit form (V-02 / OGC-581): four new optional fields capturing trap-deployment specifics required by WHO entomological surveillance protocols. None of the fields are required; labs without this granularity continue to use the form exactly as today. The LHU Mode A footnote auto-degrades when the fields are null.

The four new fields:

| Field | Type | Why |
| --- | --- | --- |
| `lure` | TEXT (free-form) | Trap attractant; noted for reproducibility per WHO. Free text rather than coded — lure isn't used for filtering or evaluation, just displayed in the LHU footnote, so admin reference data is unnecessary overhead. Labs write what they used (e.g., "BG-Lure", "CO₂", "octenol", "custom blend X"). |
| `deployment_start` | DATETIME | When the trap was set; combined with deployment_end gives true trap-nights for collection-density math |
| `deployment_end` | DATETIME | When the trap was retrieved |
| `storage_temperature_c` | DECIMAL (°C) | Chain-of-custody for downstream PCR; cold-chain breach affects RNA integrity |

## Status: stretch / sprint 955 buffer

Partner labs we've talked to report they don't yet capture this granularity in their day-to-day workflow. The story is queued as a "ready when labs are" upgrade — schema + UI land, fields stay null until lab practice catches up. LHU v2.0 Mode A footnote already accommodates this with auto-degrade behavior.

Reagan to confirm whether any deployment is actually asking for the fields — if yes, story moves out of stretch.

## Scope

* **In scope:** four new fields added to the existing CollectionLot edit form; reference data seed for the `lure` enum; backward-compatible NULL handling; LHU Mode A footnote consumes the populated values.
* **Out of scope:** no separate screen; no list view filtering by these fields (Vector Surveillance Reporting / OGC-585 may add filters later); no automated validation that deployment_end > deployment_start beyond a soft warning; no temperature-breach alerting (cold-chain integration would be a separate epic).

## Layout

The CollectionLot edit form gains one new sub-section **"Trap Configuration"** that groups the existing `trap_type` field with the four new ones. Other form sections (Sample, Site, Collector, Notes) are unchanged.

```
[Existing CollectionLot form sections above — Sample Info, Site, Collector, etc.]

╔══════════════════════════════════════════════════════════════════╗
║  Trap Configuration                                              ║
║  ──────────────────────────────────────────────────────────────  ║
║                                                                  ║
║  Trap Type *                       Lure                          ║
║  [BG-Sentinel             ▼]       [BG-Lure              ]       ║
║                                    e.g., BG-Lure, CO₂, octenol   ║
║                                                                  ║
║  Deployment Start                  Deployment End                ║
║  [2026-01-13]  [06:00 AM]         [2026-01-15]  [06:00 AM]       ║
║                                                                  ║
║  Storage Temperature                                             ║
║  [-20.0]  °C                                                     ║
║                                                                  ║
║  ⓘ All trap-configuration fields except Trap Type are optional.  ║
║    LHU Mode A footnote renders these when populated; absent      ║
║    fields are silently omitted.                                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

[Existing CollectionLot form sections below — Specimens table, Notes, etc.]
```

Notes on rendering:

* The five fields are grouped under one section header **"Trap Configuration"** so they cluster visually and are easy to skip if the lab doesn't capture them. Section title — no expansion/collapse in MVP (keeps the form simple).
* **Trap Type stays required** (existing OGC-581 behavior). The four new fields are optional.
* `Deployment Start / End` use a paired date + time input rather than a single DateTime picker — matches the OE convention for "when did this happen" timestamps where seconds rarely matter.
* `Storage Temperature` is a NumberInput with `°C` suffix; accepts negative values (specimens stored at -20°C, -80°C are common).
* The small `ⓘ` helper line at the bottom of the section is the only piece of guidance in MVP — no per-field tooltips. The LHU side does the inferring (renders the trap-detail footnote line only when any of the four fields is populated).

## Field spec

| Field | Component | Required | Default | Validation |
| --- | --- | --- | --- | --- |
| `trap_type` | Dropdown | Yes | (existing default) | (existing — from V-01 reference data via OGC-555) |
| `lure` | TextInput (free-form) | No | NULL | None. Helper text suggests common values (BG-Lure, CO₂, octenol). |
| `deployment_start` | DatePicker + TimePicker | No | NULL | Must be valid datetime; soft warning if `> deployment_end` |
| `deployment_end` | DatePicker + TimePicker | No | NULL | Must be valid datetime; soft warning if `< deployment_start` |
| `storage_temperature_c` | NumberInput (°C) | No | NULL | Decimal; accepts negative; sensible range -80 to +40 (soft warning outside) |

**Why lure is free text, not coded:**

`trap_type` is admin-managed reference data because it's used for filtering, aggregation, and decision-making (V-04 surveillance dashboards filter by trap type; MIR is computed per trap type). `lure` has none of those uses — it lives in one footnote line on the LHU. Building an admin entity (reference table + CRUD UI + permissions + i18n + tests) for a field that's just stored and displayed would be disproportionate. The principle: code it if you use it for logic; free-text it if you just store and display.

Cross-field rule:

* If `deployment_start` is populated, `deployment_end` should also be populated (and vice-versa). Soft warning (Carbon `InlineNotification` of kind `warning`) on save — not blocking.

## Data model (per OGC-777 AC, amended 2026-05-28)

* `collection_lot.lure` (TEXT, nullable, free-form)
* `collection_lot.deployment_start` (DATETIME, nullable)
* `collection_lot.deployment_end` (DATETIME, nullable)
* `collection_lot.storage_temperature_c` (DECIMAL, nullable)

API serializes all four on `CollectionLot` GET / POST / PATCH. Backward compatible: existing CollectionLot records default to NULL.

No V-01 reference data extension needed (the original AC called for a `lure` enum table seed; that's dropped per the free-text decision).

## i18n keys (new for this story)

| Key | EN |
| --- | --- |
| `vector.collectionLot.section.trapConfiguration` | Trap Configuration |
| `vector.collectionLot.lure` | Lure |
| `vector.collectionLot.lure.placeholder` | e.g., BG-Lure, CO₂, octenol |
| `vector.collectionLot.deploymentStart` | Deployment Start |
| `vector.collectionLot.deploymentEnd` | Deployment End |
| `vector.collectionLot.storageTemperatureC` | Storage Temperature |
| `vector.collectionLot.storageTemperatureC.unit` | °C |
| `vector.collectionLot.trapConfig.help` | All trap-configuration fields except Trap Type are optional. The LHU Mode A footnote renders these when populated; absent fields are silently omitted. |
| `vector.collectionLot.deploymentWindow.warning` | Deployment end is before deployment start. Confirm before saving. |

## States (mockup illustrates the first only per MVP scope)

1. **Default / fully populated** (in scope) — all four new fields filled. The KAN-accredited surveillance case that OGC-777 unlocks.
2. **All four fields blank** (in scope as the backward-compat default) — section renders with empty inputs; LHU Mode A footnote auto-omits the trap-details line.
3. **Partial population** (deferred) — e.g., only lure entered, deployment dates blank. Allowed; saves cleanly.
4. **Cross-field warning** (deferred) — deployment_end < deployment_start. InlineNotification kind=warning on save.

## Acceptance Criteria check (mockup → OGC-777)

| OGC-777 AC | Mockup demonstrates |
| --- | --- |
| Schema extend `collection_lot` with 4 new fields | Documented in §"Data model" |
| V-02 form: 4 fields added to CollectionLot edit form; all optional | Shown in §"Layout" |
| V-01 reference data extends `lure` enum table seed | Documented |
| API serializes all 4 fields | Documented |
| Backward compatible (existing LotCollections default NULL) | Documented |
| LHU Mode A footnote skips trap-detail line when all 4 are null | Inherits from LHU v2.0 §6.4 auto-degrade rule |
| i18n keys | Documented |

## Out of scope reminders (NOT in this mockup)

These are documented in OGC-777's "Out of scope" section and are NOT depicted here:

* Per-field tooltips or inline help (only the section-level ⓘ helper)
* Expand/collapse on the Trap Configuration section
* Hard validation that deployment_end > deployment_start (soft warning only)
* Temperature-breach alerting / cold-chain integration
* List-view filtering by trap details (defer to V-04 surveillance reporting)

## References

* [OGC-777](https://uwdigi.atlassian.net/browse/OGC-777) — this story
* [OGC-555](https://uwdigi.atlassian.net/browse/OGC-555) — V-01 reference data (host for `lure` enum extension)
* [OGC-581](https://uwdigi.atlassian.net/browse/OGC-581) — V-02 Vector Collection Workflow (host form)
* [OGC-552](https://uwdigi.atlassian.net/browse/OGC-552) — S-06 LHU v2.0 Mode A consumer
* `vector-lhu.md` v2.0 §5A + §6.4 — LHU Mode A trap-details footnote rendering
* WHO 2021 *Operational Manual on Aedes Surveillance* — reproducibility requirements for trap reporting
* LHU v2.0 upstream gap analysis (2026-05-26)
