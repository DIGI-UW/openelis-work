# Current-State Gotchas — what's built vs. not built

> Read during `/specify` Stage 1 and `/analyze` cross-module pass. Prevents specs that
> assume capabilities the shipped app doesn't have. When a feature depends on a not-yet-
> built piece, declare it in the FRS **Dependencies** section (and a Feature Flag if gated).
>
> **DRAFT — assembled from design-session findings; re-verify against the live app/codebase
> before treating any line as settled. Date each entry as you confirm it.**

---

## Not built / partial (declare as a dependency before designing on top)

- **EQA V2** — fully specced but **no V2 controller in code**. Build scheduled for the
  QA-menu sprint. EQA-touching specs should defer or gray-state until then.
- **Test → Reagent linkage** — reagents-as-inventory exist, but the Test↔Reagent linkage
  does **not**. A "Reagents" tab in Test Catalog needs the linkage built first.
- **Configurable Label Presets** — 4 hardcoded label sizes ship today; full user-
  configurable Label Preset Management does **not** exist. A Labels tab can pick from the 4,
  but a configurable preset admin is a separate FRS.
- **Critical result acknowledgment** — global "all criticals require ack + surface in alerts
  dashboard" is a queued idea, not built. Dependency for any home-page Attention feed.
- **External patient source** — `patientSearchURL` is admin-editable, but the request/
  response format is **hardcoded in Java**. New endpoint types require engineering
  coordination, not just config.
- **Catalyst (LLM form builder)** — OGC-70 / OGC-113 are *future* LLM assistive layers, NOT
  near-term. Don't deprecate existing admin paths in favor of "Catalyst will do it."

## Built / constraints to respect

- **No multitenancy** — single tenant per deployment. No site/lab/tenant selectors.
- **No hard delete** — Master List pages, Analyzer Types, External Connections all use
  Active + Deactivate, not Delete.
- **Admin breadcrumb quirk** — SideNav says "Admin"; breadcrumbs say "Admin Management".
  Preserve this drift in specs that render breadcrumbs.
- **Domain enum** — strictly CLINICAL / ENVIRONMENTAL / VECTOR; no BOTH.
- **Analyzers module** — nested SideNav (Analyzers List, Analyzer Types, QC submenu, Add
  Analyzer form), not tabs; includes a Generic ASTM type.

## Verified data models (specced; reuse rather than re-derive)

These were nailed down in prior design sessions — pull the field list from the relevant
FRS rather than re-inventing: Application/Common Properties (61 props, 7 domains), Site
Information (29 props), Validation Configuration (4 charset fields), WorkPlan Configuration
(3 booleans), Order & Patient Entry (14 + 8 props), Menu Configuration (5 scopes), Test
Notification (4 channels, 3-tier template fallback), Test Catalog Alerts (authoring +
delivery split).

---

## TODO (verify / expand)
- [ ] Re-confirm each "not built" line against current `develop` before each planning cycle.
- [ ] Add confirmation dates per entry.
- [ ] Cross-link to the canonical FRS for each verified data model.
