# Admin IA & URL Inventory

> Read during `/specify` Stage 2 (IA Placement) and `/analyze` IA checks. This is a
> **self-contained snapshot** of confirmed admin routes so the skill no longer depends on
> the `openelis-test-catalog-qa` skill being loaded. Source: QA verification against the
> live app (v3.2.1.x). **Re-verify against `https://testing.openelis-global.org` before
> declaring a route in a spec** — versions drift.

---

## ⚠ Route pattern correction (important)

The live admin pages use a **path-segment** route, not a query string:

- ✅ Verified: `` `/MasterListsPage/<editorKey>` `` — e.g. `/MasterListsPage/commonproperties`
- ❌ Stale (older skill guidance): `/MasterListsPage?type=<editorKey>`

Also note the `editorKey` is the live identifier, which is **not always the feature's plain
name** — e.g. Application Properties → `commonproperties`, Site Information →
`SiteInformationMenu`. Copy the exact key from the table below, don't invent it.

---

## Confirmed admin routes (`/MasterListsPage/<editorKey>`)

| Admin page | editorKey (route) |
|---|---|
| Reflex Tests Management | `reflex` |
| Calculated Value Tests | `calculatedValue` |
| Analyzer Test Name | `AnalyzerTestName` |
| Lab Number Management | `labNumber` |
| Program Entry | `program` |
| EQA Program Management | `eqaProgram` |
| Provider Management | `providerMenu` |
| Barcode Configuration | `barcodeConfiguration` |
| List Plugins | `PluginFile` |
| Organization Management | `organizationManagement` |
| Result Reporting Configuration | `resultReportingConfiguration` |
| User Management | `userManagement` |
| Batch Test Reassignment | `batchTestReassignment` |
| Test Management | `testManagement` |
| Application Properties | `commonproperties` |
| Test Notification Configuration | `testNotificationConfigMenu` |
| Dictionary Menu | `DictionaryMenu` |
| Notify User | `NotifyUser` |
| Search Index Management | `SearchIndexManagement` |
| Logging Configuration | `loggingManagement` |
| Global Menu Configuration | `globalMenuManagement` |
| Billing Menu Configuration | `billingMenuManagement` |
| NonConformity Configuration | `NonConformityConfigurationMenu` |
| WorkPlan Configuration | `WorkPlanConfigurationMenu` |
| Site Information | `SiteInformationMenu` |
| Site Branding | `SiteBrandingMenu` |
| Language Management | `languageManagement` |
| Translation Management | `translationManagement` |
| Order Entry Configuration | `SampleEntryConfigurationMenu` |

**Legacy admin (JSP):** `/api/OpenELIS-Global/MasterListsPage` (opens the old JSP UI in a
new tab; orange header; "training installation" warning). Reference only — don't target for
new work.

## Admin SideNav grouping (live sub-item structure)

- **Menu Configuration (5):** Global Menu, Billing Menu, Non-Conform Menu, Patient Menu,
  Study Menu. *(Parent route `/MasterListsPage/menuConfiguration` renders blank — BUG-49 —
  navigate sub-routes directly.)*
- **General Configurations (9):** NonConformity, MenuStatement, WorkPlan, Site Information,
  Site Branding, Result Entry, Patient Entry, Printed Report, Order Entry, Validation
  Configuration.
- **Localization (2):** Language Management, Translation Management.

> The skill's **global admin IA buckets** for *new* placement are Config / Organization /
> Resources / Automation / Compliance (see `memory/design-addendum.md`). The groupings above
> are the live app's current sub-item structure — use them to find the closest neighbor, not
> as the canonical target taxonomy.

## Non-admin route patterns (for completeness)

- **Results:** `/AccessionResults`, `/ResultsByPatient`, `/ResultsByOrder`
- **Validation:** `/ResultValidation?type=routine|order`, `/AccessionValidation`
- **Workplan:** `/WorkPlanByTest?type=test`, `/WorkPlanByPanel?type=panel`, `/WorkPlanByTestSection`, `/WorkPlanByPriority?type=priority`
- **Reports:** `/Report?type=patient`; generation via JSP `/api/OpenELIS-Global/ReportPrint`
- **Referrals:** `/SampleShipment/reference-lab-results`
- **Analyzers:** `/analyzers`, `/analyzers/types`, `/analyzers/errors`
- **EQA:** `/EQADistribution`, `/EQAManagement`, `/EQAParticipants`, `/EQAResults`
- **Alerts:** `/Alerts` · **Inventory:** `/Inventory` · **Storage:** `/Storage`, `/Storage/samples` · **Aliquot:** `/Aliquot`
- **Orders:** `/ElectronicOrders`, `/SampleBatchEntrySetup`, `/PrintBarcode`
- **Pathology:** `/PathologyDashboard`, `/ImmunohistochemistryDashboard`, `/CytologyDashboard`
- **Audit:** `/AuditLog`, `/SystemLog`

## Breadcrumb quirk
SideNav reads "Admin"; breadcrumbs read "Admin Management". Preserve this drift in specs
that render breadcrumbs.

---

## Maintenance
Snapshot taken from QA Section 4 (v3.2.1.x). When the QA skill's confirmed-URL table
updates, re-sync this file. Flag any route you couldn't re-verify on the live instance.
