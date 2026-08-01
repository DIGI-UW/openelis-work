# Spec Registry — overlap & dependency index

> One row per feature/FRS. `/crosscheck` reads this to answer three questions about a new
> design: **who else touches this?** (overlap), **what must exist first / what breaks
> downstream?** (dependencies), and **which siblings share this concept?** (harmonization).
>
> The overlap signal is mechanical: if two rows share an **entity**, a **route/page**, or a
> **shared concept**, they overlap and should be coordinated. Keep entity/route names exact
> (match `verified-data-models.md` and `admin-ia-inventory.md`) so matching works.
>
> **Seeded from known work — partial on purpose.** Columns marked `?` need confirmation.
> Add a row whenever `/specify` produces a new FRS.

Legend — **Status:** built / specced / draft / idea. **Deps:** upstream (must exist first) →,
downstream (affected by this) ←.

| Feature | Entities touched | Routes / pages | Shared concepts | Upstream deps (→) | Downstream deps (←) | Jira | Status |
|---|---|---|---|---|---|---|---|
| Application/Common Properties | ApplicationProperty (61) | `/MasterListsPage/commonproperties` | Feature Flags, booleans | — | Feature Flags tab; many features read props | ? | built/redesign specced |
| Site Information | SiteInformation (29) | `/MasterListsPage/SiteInformationMenu` | multi-locale banner, PasswordInput | — | Site Branding | ? | specced |
| Validation Configuration | validation charset (4) | `/MasterListsPage` (General Config → Validation) | charset rules | — | Patient/Order entry validation | ? | specced |
| WorkPlan Configuration | workplan booleans (3) | `/MasterListsPage/WorkPlanConfigurationMenu` | workplan columns | — | Workplan operational views | ? | specced |
| Order & Patient Entry config | OrderEntry (14) + PatientEntry (8) props | `/MasterListsPage/SampleEntryConfigurationMenu` | conditional field toggles | Validation Config (charset) | Order entry wizard | ? | specced |
| Menu Configuration | menu nodes (5 scopes) | `/MasterListsPage/*MenuManagement` (sub-routes) | Side Nav Active toggle, Feature Flags | — | every SideNav-placed feature | OGC-556 | specced |
| Test Notification | notification config (4 channels) | `/MasterListsPage/testNotificationConfigMenu` | template fallback, substitution vars | — | Test Catalog Alerts (delivery) | ? | built/specced |
| Test Catalog Alerts | per-test alert rules | Test Catalog → Alerts tab | **Critical Acknowledgment**, Test Notification delivery | Test Notification system; alert ack (built, D-048) | Critical-result ack feed | ? | specced |
| Analyzer Types & Mapping | Analyzer, AnalyzerType/profile (NEW), Test + result options + LOINC, Lab unit, pending/unmapped queue, QC codes | `/analyzers/types`, `/analyzers/{id}/mappings`, `/analyzers/types/{typeId}`, inline setup in `/analyzers` | value/select-list maps, **Deactivate**, LOINC 1:1 match, **search ComboBox**, **Alerts** + critical-ack, `ANALYZER_*` audit, learn-from-traffic | Test catalog (dictionary/LOINC); pending-queue (extend); **Alerts ack model (critical-ack, not built)** | Analyzer Maintenance (shared `/analyzers/{id}` namespace); Mgmt Dashboard OGC-897; Home OGC-896; Quality Control | ? | specced |
| Analyzer Maintenance & Service | Analyzer, **EquipmentMaintenanceLog (NEW)**, StorageRoom, Dictionary (event types), Alert | `/analyzers/maintenance`, `/analyzers/{id}/configuration` (+ old admin redirect) | **Alerts** (`EQUIPMENT_MAINTENANCE_DUE`), Dictionary-extensible types, Deactivate, verifiedBy (ISO 15189) | Analyzers IA baseline (D-027); Alert entity | Mgmt Dashboard OGC-897 (equipment cards); Home OGC-896 (Lab Snapshot) | ? | specced |
| QA Dashboard / TAT | TAT metrics (Average only v1) | QA menu | **TAT threshold model** | — | **Home-page Attention/TAT (must reuse)** | ? | specced (v1) |
| Referral redesign | Referral, ReferralStatus enum, SampleShipment | `/SampleShipment/reference-lab-results` | **ReferralStatus** in-transit signal | FHIR referral | shipment tracking | ? | specced |
| EQA V2 | EQA program/participant/enrollment/order/result | `/EQAManagement`, `/EQADistribution(/create)`, `/EQAMyPrograms`, `/EQAOrders`, `/EQAParticipants`, `/EQAResults` | EQA badges; enrollment model | — (controller now shipped) | EQA participant oversight (separate lane) | ? | **built** (verified 2026-08-01, D-045) |
| Report Print Queue | report jobs/queue | `/Report`, JSP `/ReportPrint` | print presets | — | report delivery | OGC-1031 (+1032–1043), anchor OGC-431 | specced |
| Label Presets | LabelPreset (name, heightMm, widthMm) | `/MasterListsPage/labelPresets`; Test Catalog Labels tab | print layout, preset reuse | — | barcode/label printing; Test Catalog Labels tab | OGC-285 | **built** (verified 2026-08-01, D-047) |
| Critical Result Acknowledgment | result ack flag | Alerts dashboard, result views | **Critical Acknowledgment**, alerts feed | alert-level ack **built** (`/rest/alerts/{id}/acknowledge`) — only per-**result** ack missing | Test Catalog Alerts, home Attention feed | ? | partial (D-048) |
| Reagent ↔ Test linkage | Reagent, Test, InventoryItem(REAGENT) | Test Catalog → Reagents tab; `GET/POST/DELETE /rest/test-catalog/{testId}/reagents` | inventory; auto-consume derivation (D-037) | — | reagent inventory; Inventory redesign | ? | **built** (verified 2026-08-01, D-046) |
| Env/Vector order entry | Sample, Order (4-step wizard), aliquot LABNO.X-Y | order entry wizard | Domain (ENV/VECTOR), NCE, validator-final | FHIR referral (vector pools) | validation, deconvolution | OGC-527 | specced |
| Vector host index | host index | ? | Domain VECTOR | Env/Vector order entry | — | OGC-527 (story pending) | idea |
| Inventory redesign | InventoryItem/Lot/Transaction/Usage (+ free-form type tag, UPC, reorder horizon, per-item lead time, consumption mean+SD) | `/inventory`, `/inventory/receive`, `/inventory/reports`; `/rest/inventory/items`, `/rest/inventory-storage-locations` | sample **Storage model** (OGC-657), **Test↔Reagent link**, **Alerts** (ack-to-quiet D-042), OGC-436 forecast | sample Storage model (OGC-657); Test↔Reagent linkage (now built, D-046) | Reagent forecasting OGC-436; Alerts | OGC-657; OGC-658 (closed, D-038) | FRS v1.3 draft |
| QA/QC (Westgard) | ControlLot, QcRuleConfig, QcViolation, Instrument | `/analyzers/qc/{db,control-lots,rule-config,charts/:analyzerId,instruments/:instrumentId}`; `/rest/qc/*` | Alerts + **violation acknowledge**, analyzer↔test mapping | Analyzers IA (D-027) | Analyzer Types & Mapping; Mgmt Dashboard | OGC-41 | **built** (verified 2026-08-01) |
| Test catalog data model | Test, SAMPLETYPE_TEST, SAMPLETYPE_PANEL, test_sample_handling, Domain columns | `/MasterListsPage/TestCatalogEditor/:testId?/:section?` (+ `/group/:ids/:section?`), `/MasterListsPage/TestCatalogList` | specimen-is-identity (D-028), panel sample types (D-029), Domain propagation (D-030), storage ownership (D-031), variant links (D-033), result types (D-034) | Domain columns on Panel/TestSection + TypeOfSample migration **not built** (D-030) | every catalog/order feature | OGC-936; OGC-361 (Done-but-absent, D-032) | partial |

## High-overlap hotspots (watch these)
- **Alerts page + AlertType/acknowledgment model** — now a four-way shared sink: Critical
  Result Ack, Test Catalog Alerts, Analyzer Types & Mapping (unmapped codes/results), and
  Analyzer Maintenance (`EQUIPMENT_MAINTENANCE_DUE`), plus the home Attention feed. Design the
  AlertType taxonomy + ack model **once**; note the critical-ack direction isn't built yet.
- **Analyzers module IA + per-analyzer route namespace** — Analyzer Types & Mapping and
  Analyzer Maintenance both extend `/analyzers/{id}/<subpage>` and the Analyzers SideNav group,
  written independently. Governed by D-027; both specs must converge on one route map before
  `/breakdown`.
- **Critical Acknowledgment** — touched by Test Catalog Alerts, Critical Result Ack, the home
  Attention feed, and analyzer unmapped-code alerting. Design once, reference everywhere.
  **The alert-level ack model now ships** (`/rest/alerts/{id}/acknowledge`, `AlertAcknowledgeModal`,
  `acknowledgmentRequired`) — compose from it rather than re-specifying it; only per-**result**
  critical ack is still a dependency (D-048). Acknowledge-to-quiet for persistent operational
  criticals is D-042.
- **TAT threshold model** — QA Dashboard owns it; home-page TAT must reuse (D-015).
- **Feature Flags / Menu Config** — cut across Application Properties, Menu Configuration,
  and every SideNav-placed feature.
- **`/MasterListsPage/*`** — the admin shell; many config specs share it, so route/editorKey
  collisions and shared SideNav placement need coordination.
- **Domain enum** — every catalog/order feature; never BOTH (D-004). Only the **Test** domain
  column is built (OGC-936); Panel + TestSection columns and the TypeOfSample migration are
  **unbuilt** and each FRS declares its own migration (D-030).
- **Sample Storage model** — shared by the Storage module (`/Storage/*` subtree), the Inventory
  redesign (D-035), and per-specimen disposal (D-031). One hierarchy, no parallel trees.

---

## Maintenance
`/specify` adds a row as a closing step (entities, routes, shared concepts, deps). The
monthly consolidation task reconciles the registry against new FRSs and fills `?` cells.
Confirm `built`/`blocked` status against `current-state-gotchas.md`.

**2026-08-01 (monthly consolidation):** added three rows (Inventory redesign, QA/QC Westgard,
Test catalog data model). Flipped **EQA V2**, **Label Presets** and **Reagent↔Test linkage**
from blocked/partial to **built** against live verification, and Critical Result Ack from
idea to partial. Filled the Label Presets Jira cell (OGC-285) and the QA/QC cell (OGC-41).
Remaining `?` cells are genuinely unknown Jira keys, not unchecked ones.
