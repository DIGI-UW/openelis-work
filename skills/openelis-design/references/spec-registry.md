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
| Test Catalog Alerts | per-test alert rules | Test Catalog → Alerts tab | **Critical Acknowledgment**, Test Notification delivery | Test Notification system | Critical-result ack feed | ? | specced |
| Analyzer Types & Mapping | Analyzer, AnalyzerType/profile, Test dictionary | `/analyzers`, `/analyzers/types` | value/select-list maps, **Deactivate** | Test catalog (dictionary) | analyzer result import | ? | specced |
| QA Dashboard / TAT | TAT metrics (Average only v1) | QA menu | **TAT threshold model** | — | **Home-page Attention/TAT (must reuse)** | ? | specced (v1) |
| Referral redesign | Referral, ReferralStatus enum, SampleShipment | `/SampleShipment/reference-lab-results` | **ReferralStatus** in-transit signal | FHIR referral | shipment tracking | ? | specced |
| EQA V2 | EQA program/participant/result | `/EQADistribution`, `/EQAManagement` | EQA badges | **EQA V2 controller (NOT built)** | EQA participant oversight (separate lane) | ? | specced, blocked |
| Report Print Queue | report jobs/queue | `/Report`, JSP `/ReportPrint` | print presets | — | report delivery | OGC-1031 (+1032–1043), anchor OGC-431 | specced |
| Label Presets | label preset (4 fixed) | Labels tab | print layout | configurable-preset mgmt (NOT built) | barcode/label printing | ? | partial |
| Critical Result Acknowledgment | result ack flag | Alerts dashboard, result views | **Critical Acknowledgment**, alerts feed | — | Test Catalog Alerts, home Attention feed | ? | idea/global TODO |
| Reagent ↔ Test linkage | Reagent, Test | Test Catalog → Reagents tab | inventory | **Test↔Reagent linkage (NOT built)** | reagent inventory | ? | blocked |
| Env/Vector order entry | Sample, Order (4-step wizard), aliquot LABNO.X-Y | order entry wizard | Domain (ENV/VECTOR), NCE, validator-final | FHIR referral (vector pools) | validation, deconvolution | OGC-527 | specced |
| Vector host index | host index | ? | Domain VECTOR | Env/Vector order entry | — | OGC-527 (story pending) | idea |

## High-overlap hotspots (watch these)
- **Critical Acknowledgment** — touched by Test Catalog Alerts, Critical Result Ack, and the
  home Attention feed. Design once, reference everywhere.
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
