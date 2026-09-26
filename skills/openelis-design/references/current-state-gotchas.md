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

- **External patient source** — `patientSearchURL` is admin-editable, but request/response
  format is **hardcoded in Java**. New endpoint types require engineering coordination.
- **Catalyst (LLM form builder)** — OGC-70 / OGC-113 are *future* LLM assistive layers, NOT
  near-term. Don't deprecate existing admin paths in favor of "Catalyst will do it."
- **Per-result critical acknowledgment** — alert-level ack **is** built (see Built section);
  what is still missing is acknowledgment attached to an individual critical *result*. Declare
  only that narrow piece as a dependency for a home-page Attention feed (D-048).
- **Vector host index** — pending; needs a Jira story under OGC-527 (SILNAS Indonesia).
- **Home-dashboard domain filtering** — order entry is already domain-scoped (three
  domain-specific entry routes), and lab units pick up Domain via incoming test-catalog work,
  but **home-page/dashboard filtering by Domain (CLINICAL/ENVIRONMENTAL/VECTOR) is not built**.
  Treat any home/dashboard domain filter as a named dependency, not an existing capability.
  (Route triplet not re-verified against the live app this cycle — confirm before asserting.)

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

- **EQA V2 — BUILT** (verified 2026-08-01). `GET /rest/eqa/programs` 200,
  `/rest/eqa/programs/{id}/enrollments` 200, `/rest/eqa/my-programs` 200,
  `/rest/eqa/orders/summary` 200, `/rest/eqa/distributions` 200. Shipped routes:
  `/EQAManagement`, `/EQADistribution`, `/EQADistribution/create`, `/EQAMyPrograms`,
  `/EQAOrders`, `/EQAParticipants`, `/EQAResults`. Supersedes the old "no V2 controller"
  entry (D-045).
- **Test↔Reagent linkage — BUILT** (verified 2026-08-01). `GET /rest/test-catalog/{testId}/reagents`
  200; write paths `POST`/`DELETE /rest/test-catalog/{testId}/reagents[/{reagentId}]`.
  ⚠ `/rest/test-reagents` and `/rest/reagents` **404** — the linkage is nested under
  `test-catalog`, don't design against the flat paths (D-046).
- **Configurable Label Presets — BUILT** (verified 2026-08-01). Admin route
  `/MasterListsPage/labelPresets` with a real editor: preset name (≤120 chars),
  `heightMm`/`widthMm` (5–200mm), `admin.labelPresets.validation.*` i18n keys. Supersedes the
  "4 fixed presets" constraint (D-047, OGC-285).
- **Alert acknowledgment — BUILT** (verified 2026-08-01). `POST /rest/alerts/{id}/acknowledge`,
  `POST /rest/qc/violations/{id}/acknowledge`, `AlertAcknowledgeModal`, and the
  `acknowledgmentRequired` / `acknowledgedBy` / `acknowledgedDate` field set (D-048).
- **QA/QC module — BUILT.** `/rest/qc/dashboard/summary` 200; routes `/analyzers/qc/db`,
  `/analyzers/qc/control-lots(/new,/{id})`, `/analyzers/qc/rule-config`,
  `/analyzers/qc/charts/{analyzerId}`, `/analyzers/qc/instruments/{instrumentId}`.
- **No multitenancy** — single tenant per deployment. No site/lab/tenant selectors.
- **No hard delete** — Master List pages, Analyzer Types, External Connections use Active +
  Deactivate, not Delete. Reflex/Calc rules use Toggle + Active + Deactivate (no delete).
- **Domain enum** — strictly CLINICAL / ENVIRONMENTAL / VECTOR; no BOTH. Order entry is
  already domain-scoped (separate entry routes per domain); catalog/lab-unit Domain arrives via
  test-catalog work. See the home-dashboard domain-filtering gap above.
- **Analyzers module** — nested SideNav (Analyzers List, Analyzer Types, QC submenu, Add
  Analyzer form), not tabs; includes a Generic ASTM type. Full shipped route set (verified
  2026-08-01): `/analyzers`, `/analyzers/new`, `/analyzers/types`, `/analyzers/errors`,
  `/analyzers/custom-field-types`, `/analyzers/{id}/edit`, `/analyzers/{id}/mappings`,
  `/analyzers/{id}/qc-rules`, plus the `/analyzers/qc/*` subtree above. Note
  **`/analyzers/{id}/mappings` already exists** — the Analyzer Types & Mapping spec is
  extending a live route, not creating one.
- **Referral in-transit** — specimens-in-transit are covered by the activated
  `ReferralStatus` enum; canonical view `/SampleShipment/reference-lab-results`. Don't invent
  `Sample.location`.
- **Env/Vector order entry** — 4-step wizard; validator is final authority; anomalies = NCE.
  Vector pools arrive via FHIR referral; deconvolution uses aliquot numbering `LABNO.X-Y`.

## Route corrections — verified against the shipped SPA router 2026-08-01

Extracted from the live bundle's `Route,{path:...}` declarations on
`testing.openelis-global.org`. These correct long-standing errors carried in both this skill
and the QA suite catalog:

| Previously documented | Actually shipped | Note |
|---|---|---|
| `/Inventory` | **`/inventory`** | lowercase |
| `/Storage/samples` | **`/Storage/sample-items`** | plus `/Storage/{rooms,devices,shelves,racks,boxes}` (+ `/new`, `/{id}/edit`) |
| `/AuditLog`, `/SystemLog` | **`/AuditTrailReport`** | nav link is `/AuditTrailReport?type=system` |
| `/WorkPlanByTest`, `/WorkPlanByPanel`, `/WorkPlanByPriority` | **`/WorkplanByTest`, `/WorkplanByPanel`, `/WorkplanByPriority`** | lowercase `p` — but `/WorkPlanByTestSection` **keeps** the capital P (real inconsistency in the app) |
| `/ResultsByPatient`, `/ResultsByOrder`, `/LOINCManagement`, `/MasterListsPage/LOINCCodes` | — | **not routes at all**; drop them |
| `/MasterListsPage/menuConfiguration` | — | genuinely absent from the router — this *explains* the BUG-49 blank page |

Stale admin `editorKey`s also found (in `admin-ia-inventory.md`, now flagged there):
`eqaProgram`, `barcodeConfiguration`, `testManagement` are **not** in the shipped router
(the real key is `testManagementConfigMenu`). Admin pages are served under **two** prefixes:
`/MasterListsPage/<editorKey>` and `/admin/<editorKey>` (e.g. `/admin/languageManagement`,
`/admin/translationManagement`).

---

## Verified data models (reuse, don't re-derive)
See `references/verified-data-models.md` — Application/Common Properties (61), Site
Information (29), Validation Config (4 charset), WorkPlan (3 booleans), Order & Patient
Entry (14+8), Menu Configuration (5 scopes), Test Notification (4 channels), Test Catalog
Alerts (authoring+delivery split).

---

## Maintenance
Re-confirm each "not built" line against current `develop` before each planning cycle, and
add a confirmation date. Promote new verified facts here as they surface in QA or design.

- **2026-07-01 (monthly consolidation):** re-confirmed the not-built list against `develop`
  intent; no items graduated to built this cycle. Promoted the home-dashboard domain-filtering
  gap from auto-memory. Live-app route re-verification deferred (unattended run; instance gated
  at login) — routes carry their last-confirmed v3.2.1.x status.

- **2026-08-01 (monthly consolidation):** live-verified against `testing.openelis-global.org`
  (authenticated `POST /ValidateLogin?apiCall=true`, plus the shipped SPA router extracted
  from the bundle). **Four items graduated from not-built to BUILT** — EQA V2, Test↔Reagent
  linkage, configurable Label Presets, alert acknowledgment — superseding D-017/018/019 and
  adding D-048. Added a verified route-correction table; six previously-documented routes are
  wrong or nonexistent.

- **2026-09-02 (monthly consolidation):** constitution re-checked against upstream raw file —
  **still v1.11.0** (`Ratified 2025-10-30 | Last Amended 2026-07-15`), no change since the
  2026-08-01 sync; re-sync trigger did not fire. Verified OGC-657 (PR #3840) is closed/not
  merged via GitHub (see `spec-registry.md` 2026-09-02 note) — the Inventory redesign's
  Storage-model dependency is not delivered, correcting the prior "in PR #3840 (open)" note.
  No other route/data claims re-verified live this pass (see Section B — testing.openelis-global.org
  route re-verification deferred: authenticated session/JS execution blocked by tool-use policy in
  the unattended run; build hash cross-confirmed unchanged via the `openelis-qa-tracker` artifact's
  own 2026-09-01 drift check instead).
