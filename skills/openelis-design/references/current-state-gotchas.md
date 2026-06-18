# Current-State Gotchas — what's built vs. not built

> Read during `/specify` Stage 1 and `/analyze` cross-module pass. Prevents specs that
> assume capabilities the shipped app doesn't have. When a feature depends on a not-yet-
> built piece, declare it in the FRS **Dependencies** section (and a Feature Flag if gated).
>
> Re-verify against the live app/codebase before treating any line as settled; date each
> entry as you confirm it. Cross-check `references/admin-ia-inventory.md` for confirmed
> routes and `references/verified-data-models.md` for field-level shapes.

---

## Not built / partial — declare as a dependency before designing on top

- **EQA V2** — fully specced but **no V2 controller in code**. Build scheduled for the
  QA-menu sprint. EQA-touching specs should defer or gray-state until then.
- **Test → Reagent linkage** — reagents-as-inventory exist, but the Test↔Reagent linkage
  does **not**. A "Reagents" tab in Test Catalog needs the linkage built first.
- **Configurable Label Presets** — 4 hardcoded label sizes ship today; full user-
  configurable Label Preset Management does **not** exist. A Labels tab can pick from the 4,
  but a configurable preset admin is a separate FRS.
- **Critical result acknowledgment** — global "all criticals require ack + surface in alerts
  dashboard" is a queued idea, not built. Dependency for any home-page Attention feed.
- **External patient source** — `patientSearchURL` is admin-editable, but request/response
  format is **hardcoded in Java**. New endpoint types require engineering coordination.
- **Catalyst (LLM form builder)** — OGC-70 / OGC-113 are *future* LLM assistive layers, NOT
  near-term. Don't deprecate existing admin paths in favor of "Catalyst will do it."
- **Vector host index** — pending; needs a Jira story under OGC-527 (SILNAS Indonesia).

## Known broken / quirky in the live app (from QA, v3.2.1.x)

- **Menu Configuration parent route** `/MasterListsPage/menuConfiguration` renders blank
  (BUG-49) — navigate the 7 sub-routes directly.
- **Admin breadcrumb quirk** — SideNav says "Admin"; breadcrumbs say "Admin Management".
  Preserve this drift in specs that render breadcrumbs.
- **Legacy JSP pages** still back several areas: Provider (`/api/OpenELIS-Global/ProviderMenu`),
  Organization (`/api/OpenELIS-Global/Organization`), Reports (`/api/OpenELIS-Global/ReportPrint`),
  Dictionary (`/api/OpenELIS-Global/DictionaryMenu`). `/rest/provider`, `/rest/dictionary`,
  `/rest/organizationSearch` were never valid paths — don't design against them.
- **Calculated Values** correct endpoint is `/rest/test-calculations`; `/rest/calculatedValue`
  + `/rest/testCalculatedValue` 404 (BUG-46). No DELETE endpoint (consistent with No-Hard-Delete).

## Built / constraints to respect

- **No multitenancy** — single tenant per deployment. No site/lab/tenant selectors.
- **No hard delete** — Master List pages, Analyzer Types, External Connections use Active +
  Deactivate, not Delete. Reflex/Calc rules use Toggle + Active + Deactivate (no delete).
- **Domain enum** — strictly CLINICAL / ENVIRONMENTAL / VECTOR; no BOTH.
- **Analyzers module** — nested SideNav (Analyzers List, Analyzer Types, QC submenu, Add
  Analyzer form), not tabs; includes a Generic ASTM type. Routes `/analyzers`,
  `/analyzers/types`, `/analyzers/errors`.
- **Referral in-transit** — specimens-in-transit are covered by the activated
  `ReferralStatus` enum; canonical view `/SampleShipment/reference-lab-results`. Don't invent
  `Sample.location`.
- **Env/Vector order entry** — 4-step wizard; validator is final authority; anomalies = NCE.
  Vector pools arrive via FHIR referral; deconvolution uses aliquot numbering `LABNO.X-Y`.

## Verified data models (reuse, don't re-derive)
See `references/verified-data-models.md` — Application/Common Properties (61), Site
Information (29), Validation Config (4 charset), WorkPlan (3 booleans), Order & Patient
Entry (14+8), Menu Configuration (5 scopes), Test Notification (4 channels), Test Catalog
Alerts (authoring+delivery split).

---

## Maintenance
Re-confirm each "not built" line against current `develop` before each planning cycle, and
add a confirmation date. Promote new verified facts here as they surface in QA or design.
