# Module Inventory

> Read when a feature touches an existing module — check its pattern, route, and Jira
> anchor so new work harmonizes with what's there. Routes here are cross-checked against
> `references/admin-ia-inventory.md` (verified live). Re-verify Jira keys before linking;
> a key can be closed or re-parented.

| Module | SideNav / route | Interaction pattern | Jira anchor | Notes |
|---|---|---|---|---|
| Analyzers | `/analyzers`, `/analyzers/types`, `/analyzers/errors` | Nested SideNav list + Add form | — | Not tabs; Generic ASTM type; QC submenu |
| Test Catalog (Test Management) | `/MasterListsPage/testManagement` | Table + rename cards | — | Reagents tab needs Test↔Reagent linkage (not built) |
| Reflex Tests | `/MasterListsPage/reflex` | Rule Card (Toggle + Active + Deactivate) | — | POST `/rest/reflexrule`; "Over All Option" ANY/ALL required |
| Calculated Values | `/MasterListsPage/calculatedValue` | Rule Card | — | Endpoint `/rest/test-calculations`; no DELETE |
| Application/Common Properties | `/MasterListsPage/commonproperties` | Key-value table | — | 61 props, 7 domains (see verified-data-models) |
| Site Information | `/MasterListsPage/SiteInformationMenu` | Config table | — | 29 props; TrainingInstallation destructive |
| Menu Configuration | `/MasterListsPage/menuConfiguration` (parent blank — use sub-routes) | Tree + per-node toggle | OGC-556 (admin-menu i18n, Mozzy) | 5 scopes; Billing is URL+toggle only |
| WorkPlan Configuration | `/MasterListsPage/WorkPlanConfigurationMenu` | Config form | — | 3 booleans |
| Test Notification | `/MasterListsPage/testNotificationConfigMenu` | Per-test × 4-channel matrix | — | 3-tier template fallback |
| Reports | `/Report?type=...`; JSP `/api/OpenELIS-Global/ReportPrint` | — | **OGC-1031** Report Print Queue epic (+ OGC-1032–1043); anchor OGC-431 | `/rest/report/*` is not the gen endpoint |
| Referrals | `/SampleShipment/reference-lab-results` | — | — | In-transit signal via activated ReferralStatus enum |
| EQA | `/EQADistribution`, `/EQAManagement`, `/EQAParticipants` | Dashboard + tables | — | V2 specced, no V2 controller yet |
| Alerts | `/Alerts` | Dashboard (4 cards + filters + table) | — | Dependency for Critical-result ack feed |
| Order & Patient Entry config | `/MasterListsPage/SampleEntryConfigurationMenu` | Single merged page | — | 14 + 8 props; conditional fields grey out |
| Storage | `/Storage`, `/Storage/samples` | — | — | — |
| Inventory | `/Inventory` (Dashboard/Catalog/Reports tabs) | Tabs | — | Reports generate endpoint not deployed (BUG-45) |

## Known program / umbrella epics (verify keys before linking)
- **OGC-527** — Environmental / Vector (vector host index story lands here)
- **OGC-899** — PNG / CPHL Phase II umbrella (linked-not-reparented; PNG/Phase2 labels)
- **OGC-1031** — Report Print Queue epic (stories OGC-1032–1043; anchor OGC-431 rebuilt)
- **OGC-556** — admin-menu i18n scope (owner: Mozzy Mutesa)
- (verify: OGC-354 Sample Collection, OGC-517 Results)

## Team Jira handles
Herbert Yiga, Mozzy Mutesa (accountIds in memory `reference_openelis_team`).

---

## Maintenance
Fill any `—` Jira anchor as work gets organized. Add remaining modules (Patient Management,
Workplan operational, Batch Entry, Barcode, FHIR, Dashboard, Pathology). Confirm each anchor
key is current and open.
