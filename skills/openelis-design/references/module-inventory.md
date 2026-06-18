# Module Inventory

> Read when a feature touches an existing module — check its pattern and Jira key so new
> work harmonizes with what's there. **DRAFT — sparse on purpose. Fill in module rows from
> the live app + repo as you touch each module; don't trust a row until verified.**

Columns:
- **Module** — the area as it appears in the app
- **SideNav location** — where it lives
- **URL pattern** — the route(s) it uses
- **Interaction pattern** — table+inline-edit / wizard / dashboard / workbench
- **Jira anchor** — umbrella epic or key story for this area
- **Notes** — gotchas, links to canonical FRS

| Module | SideNav location | URL pattern | Interaction pattern | Jira anchor | Notes |
|---|---|---|---|---|---|
| Analyzers | Admin → (Analyzers) | TODO verify | Nested SideNav list + Add form | TODO | Not tabs; Generic ASTM type; QC submenu |
| Test Catalog | Admin → Test Catalog Mgmt | TODO verify | Table + tabs | TODO | Reagents tab needs Test↔Reagent linkage (not built) |
| Reports | Reports | TODO verify | — | OGC-431 (Print Queue anchor) | Report Print Queue epic OGC-1031 + stories OGC-1032–1043 |
| Referrals | TODO | `/SampleShipment/reference-lab-results` | — | TODO | In-transit signal uses activated ReferralStatus enum |
| EQA | QA menu | TODO | — | TODO | V2 specced, no V2 controller yet |
| Application/Common Properties | Admin → Configuration | `/MasterListsPage?type=applicationProperties` | Table/form | TODO | 61 props, 7 domains |
| Order & Patient Entry | Admin → Configuration | TODO | Single merged page | TODO | 14 + 8 props; conditional fields grey out |

## Known program / umbrella epics (verify keys before linking)
- **OGC-527** — Environmental / Vector
- **OGC-899** — PNG / CPHL Phase II umbrella (linked-not-reparented)
- **OGC-1031** — Report Print Queue epic
- (others: OGC-354 Sample Collection, OGC-517 Results — verify)

## TODO (verify / expand)
- [ ] Fill every `TODO verify` URL from the live app.
- [ ] Add remaining modules (Patient Management, Workplan, Storage, Batch Entry, Barcode, FHIR, Dashboard).
- [ ] Confirm each Jira anchor key is current and not closed.
