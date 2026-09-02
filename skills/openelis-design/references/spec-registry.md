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
downstream (affected by this) ←. **Docs:** `—` specced only · `pending` Epic created/shipping,
Feature Doc owed · `N/A` Docs N/A ticked · `<pageId>` published Confluence manual page
(see `references/docs-spine.md`).

| Feature | Entities touched | Routes / pages | Shared concepts | Upstream deps (→) | Downstream deps (←) | Jira | Docs | Status |
|---|---|---|---|---|---|---|---|---|
| Application/Common Properties | ApplicationProperty (61) | `/MasterListsPage/commonproperties` | Feature Flags, booleans | — | Feature Flags tab; many features read props | ? | — | built/redesign specced |
| Site Information | SiteInformation (29) | `/MasterListsPage/SiteInformationMenu` | multi-locale banner, PasswordInput | — | Site Branding | ? | — | specced |
| Validation Configuration | validation charset (4) | `/MasterListsPage` (General Config → Validation) | charset rules | — | Patient/Order entry validation | ? | — | specced |
| WorkPlan Configuration | workplan booleans (3) | `/MasterListsPage/WorkPlanConfigurationMenu` | workplan columns | — | Workplan operational views | ? | — | specced |
| Order & Patient Entry config | OrderEntry (14) + PatientEntry (8) props | `/MasterListsPage/SampleEntryConfigurationMenu` | conditional field toggles | Validation Config (charset) | Order entry wizard | ? | — | specced |
| Menu Configuration | menu nodes (5 scopes) | `/MasterListsPage/*MenuManagement` (sub-routes) | Side Nav Active toggle, Feature Flags | — | every SideNav-placed feature | OGC-556 | — | specced |
| Test Notification | notification config (4 channels) | `/MasterListsPage/testNotificationConfigMenu` | template fallback, substitution vars | — | Test Catalog Alerts (delivery) | ? | — | built/specced |
| Test Catalog Alerts | per-test alert rules | Test Catalog → Alerts tab | **Critical Acknowledgment**, Test Notification delivery | Test Notification system | Critical-result ack feed | ? | — | specced |
| Analyzer Types & Mapping | Analyzer, AnalyzerType/profile (NEW), Test + result options + LOINC, Lab unit, pending/unmapped queue, QC codes | `/analyzers/types`, `/analyzers/{id}/mappings`, `/analyzers/types/{typeId}`, inline setup in `/analyzers` | value/select-list maps, **Deactivate**, LOINC 1:1 match, **search ComboBox**, **Alerts** + critical-ack, `ANALYZER_*` audit, learn-from-traffic | Test catalog (dictionary/LOINC); pending-queue (extend); **Alerts ack model (critical-ack, not built)** | Analyzer Maintenance (shared `/analyzers/{id}` namespace); Mgmt Dashboard OGC-897; Home OGC-896; Quality Control | ? | — | specced |
| Analyzer Maintenance & Service | Analyzer, **EquipmentMaintenanceLog (NEW)**, StorageRoom, Dictionary (event types), Alert | `/analyzers/maintenance`, `/analyzers/{id}/configuration` (+ old admin redirect) | **Alerts** (`EQUIPMENT_MAINTENANCE_DUE`), Dictionary-extensible types, Deactivate, verifiedBy (ISO 15189) | Analyzers IA baseline (D-027); Alert entity | Mgmt Dashboard OGC-897 (equipment cards); Home OGC-896 (Lab Snapshot) | ? | — | specced |
| QA Dashboard / TAT | TAT metrics (Average only v1) | QA menu | **TAT threshold model** | — | **Home-page Attention/TAT (must reuse)** | ? | — | specced (v1) |
| Referral redesign | Referral, ReferralStatus enum, SampleShipment | `/SampleShipment/reference-lab-results` | **ReferralStatus** in-transit signal | FHIR referral | shipment tracking | OGC-796 | pending (OGC-1113) | specced |
| EQA V2 | EQA program/participant/result | `/EQADistribution`, `/EQAManagement` | EQA badges | **EQA V2 controller (NOT built)** | EQA participant oversight (separate lane) | ? | — | specced, blocked |
| Report Print Queue | report jobs/queue | `/Report`, JSP `/ReportPrint` | print presets | — | report delivery | OGC-1031 (+1032–1043), anchor OGC-431 | — | specced |
| Label Presets | LabelPreset (configurable) | `/labelPresets`, Test Catalog Labels section | per-sample presets, allow_override | — | Test Catalog Labels (FR-66/67), Order Entry Labels | OGC-285 (spec v2.5) / OGC-284 | — | built + spec evolving |
| Critical Result Acknowledgment | result ack flag | Alerts dashboard, result views | **Critical Acknowledgment**, alerts feed | — | Test Catalog Alerts, home Attention feed | ? | — | idea/global TODO |
| Reagent ↔ Test linkage | Reagent, Test | Test Catalog → Reagents tab | inventory | **Test↔Reagent linkage (NOT built)** | reagent inventory | ? | — | blocked |
| Inventory redesign | InventoryItem, InventoryLot, InventoryTransaction, InventoryUsage (+ type tag, UPC, reorder horizon, per-item lead time, consumption mean+SD) | `/inventory`, `/inventory/receive`, `/inventory/reports` | **sample Storage model (OGC-657)**, Test↔Reagent link (auto-consume), **Alerts** (ack-to-quiet, D-042), OGC-436 forecast | sample Storage model — OGC-657 **PR #3840 CLOSED, NOT MERGED 2026-08-09** (occupant_type on sample_storage_assignment/movement, shared LocationPickerModal — verified via GitHub 2026-09-02; no successor PR found, `mergeable_state: blocked`); Test↔Reagent link (built) | multi-lab oversight = external BI via FHIR (D-041), not in-app | OGC-657 (PR #3840); OGC-658 closed superseded (D-038); OGC-436 | — | FRS v1.3 draft |
| Env/Vector order entry | Sample, Order (4-step wizard), aliquot LABNO.X-Y | order entry wizard | Domain (ENV/VECTOR), NCE, validator-final | FHIR referral (vector pools) | validation, deconvolution | OGC-527 | — | specced |
| Test Catalog Completion v2 | Test, TestResultComponent, test_result options, SAMPLETYPE_TEST, result_limits, variant-link (NEW datum), test_label_preset_link | `/admin/TestCatalogList`, `/MasterListsPage/TestCatalogEditor/*` | Domain enum, LOINC routing, Deactivate, completeness gate, catalog health | delivered OGC-949 editor; Label Preset Mgmt (built); OGC-285 Labels contract | order entry (grouped list), e-order intake (variant link), sample-type + panel + lab-unit specs | OGC-949 family | — | specced (passed /analyze 2026-07-14) |
| Sample Type Management v2.1 | TypeOfSample, SAMPLETYPE_TEST (read), terminology store (NEW) | `/admin/TestCatalogList?entity=sampletypes` | Domain enum (migration), read-only Associated Tests, WHONET | shell contexts; domain migration | order entry sample-type menu | OGC-296, OGC-538 | — | specced + mockup |
| Panel Management v2.2 | Panel, PanelItem, SAMPLETYPE_PANEL (sync), terminology store (NEW) | `/admin/TestCatalogList?entity=panels` | Domain enum (migration), derived sample types, LOINC routing | panel.domain migration; OGC-949 shell | order entry panel list, FHIR intake | OGC-224, OGC-1140 | — | specced + mockup |
| Lab Units Management v2.0 | TestSection (TEST_SECTION) | `/admin/TestCatalogList?entity=labunits` | Domain enum (migration; OGC-361 NOT on develop), read-only Associated Tests | shell contexts; TEST_SECTION domain migration (reconcile OGC-361) | workplans, result-entry grouping | OGC-189, OGC-290, OGC-361 | — | specced + mockup |
| Analyzer Results Lab Unit Access | Analyzer (`test_unit_ids`), AnalyzerTestMapping, Test → TestSection, **UserLabUnitRoles / LabUnitRoleMap**, SystemModuleUrl | `/AnalyzerResults?id=<analyzerId>` (+ legacy `?type=`), `/rest/AnalyzerResults`, generated **Results ▸ Analyzer** menu entries, `/analyzers` list column; gallery `analyzer-integration` | **lab-unit-scoped Results rights** (`getUserTestSections`, `AllLabUnits` sentinel, `REQUIRE_LAB_UNIT_AT_LOGIN`), Access Denied state, menu filtering, backfill migration, labels-not-counts | **OGC-1057 (lab-unit picker on analyzer form — blocks)**; OGC-1151 (shared menu-filter mechanism) | **OGC-1137** (inherits the rule); OGC-288 (hosts hidden-rows notice); RBAC revamp | OGC-1178 | pending | specced + mockup |
| Vector host index | host index | ? | Domain VECTOR | Env/Vector order entry | — | OGC-527 (story pending) | — | idea |

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
- **TAT threshold model** — QA Dashboard owns it; home-page TAT must reuse (D-015).
- **Feature Flags / Menu Config** — cut across Application Properties, Menu Configuration,
  and every SideNav-placed feature.
- **`/MasterListsPage/*`** — the admin shell; many config specs share it, so route/editorKey
  collisions and shared SideNav placement need coordination.
- **Domain enum** — every catalog/order feature; never BOTH (D-004).

---

## Maintenance
`/specify` adds a row as a closing step (entities, routes, shared concepts, deps). The
monthly consolidation task reconciles the registry against new FRSs and fills `?` cells.
Confirm `built`/`blocked` status against `current-state-gotchas.md`.

## 2026-09-02 (monthly consolidation)
- **Inventory redesign row corrected**: its upstream dependency OGC-657 was recorded as
  "in PR #3840 (open)" — verified against GitHub this cycle and the PR is actually **closed,
  not merged** (closed 2026-08-09, `mergeable_state: blocked`), with no successor PR found.
  The Inventory FRS's `sample Storage model` dependency is therefore **not delivered**;
  treat the FRS's "Status: v1.3 draft" as blocked on that dependency until a new PR lands.
  Flagging for Casey rather than guessing at a successor branch.
- No new FRS rows added this cycle (no new `/specify` output since the last pass). `?` Jira
  cells left as-is — no confirmed values surfaced.
