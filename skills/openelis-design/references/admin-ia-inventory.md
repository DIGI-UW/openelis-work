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
| Analyzer Test Name | `AnalyzerTestName` — ⚠ not found in the router strings 2026-10-01 (UNVERIFIED: may be built dynamically); confirm before citing |
| Lab Number Management | `labNumber` |
| Program Entry | `program` |
| ~~EQA Program Management~~ | ~~`eqaProgram`~~ — ⚠ **not in the shipped router**; EQA is its own module, now at **`/qa/eqa/*`** (old `/EQAManagement` redirects; router 2026-10-01) |
| Provider Management | `providerMenu` |
| ~~Barcode Configuration~~ | ~~`barcodeConfiguration`~~ — **redirects to `labelPresets`** (router, 2026-10-01); cite Label Presets |
| List Plugins | `PluginFile` — ⚠ not found in the router strings 2026-10-01 (UNVERIFIED); confirm before citing |
| Organization Management | `organizationManagement` |
| Result Reporting Configuration | `resultReportingConfiguration` |
| User Management | `userManagement` |
| Batch Test Reassignment | `batchTestReassignment` |
| Test Management | `testManagementConfigMenu` — ⚠ corrected 2026-08-01 (bare `testManagement` is not a route) |
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

### Admin editorKeys in the shipped router but not in the table above (2026-10-01)

Read from bundle `index-DDcS0cc-.js`. Page titles were not checked (no login), so only the keys
are asserted; name the page from the live SideNav when you cite one.

- **Test catalog:** `TestCatalogList` (entity lists, e.g. `?entity=labunits|panels|sampletypes`),
  `TestCatalogEditor/:testId` (+ `/group/:ids/:section`, `/panel/:panelId/:section`), `TestCatalog`,
  `CatalogImport` (CSV import, OGC-1194), `LabUnitManagement/:labUnitId`, `SampleTypeEditor/:sampleTypeId`,
  `TestActivation`, `TestOrderability`, `ResultSelectListAdd`, and the legacy wizard families
  `Test*`, `TestSection*`, `Panel*`, `SampleType*`, `Method*`, `Uom*`, `SelectListRenameEntry`.
- **Configuration:** `PatientConfigurationMenu`, `ValidationConfigurationMenu`,
  `ResultConfigurationMenu`, `PrintedReportsConfigurationMenu`, `MenuStatementConfigMenu`,
  `SampleAcceptanceChecklist`, `calendarManagement`, `testNotificationConfig`,
  `notificationTriggerConfig`, `labelPresets`.
- **Menus:** `patientMenuManagement`, `studyMenuManagement`, `nonConformityMenuManagement` (the
  menuConfiguration parent is still absent, BUG-49).
- **Organizations and people:** `organizationEdit`, `userEdit`, `providerTitleMenu` (provider titles,
  OGC-1223).
- **Environmental and vector setup:** `environmental`, `vector`, `clinical`, `all`, `sampling-sites`,
  `trap-types`, `species`, `vectorSurveillanceSetup`, `manual-entry-fields`, `ComplianceStandardsAdmin`.
- **Integrations and operations:** `externalConnections`, `externalConnectionEdit`,
  `stuckAnalyzerEvents`, `dataExportStatus`, `DatabaseCleaning`.
- **Microbiology:** `MicrobiologyReference/:section/:detailId`.

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
- **Validation:** `/ResultValidation`, `/ResultValidationByTestDate`, `/AccessionValidation`, `/AccessionValidationRange`, `/validation`
- **Workplan:** `/WorkplanByTest`, `/WorkplanByPanel`, `/WorkplanByPriority`, **`/WorkPlanByTestSection`** (⚠ only this one has a capital `P` — a real inconsistency in the app)
- **Reports:** `/Report`, `/RoutineReport`, `/RoutineReports`, `/StudyReport`, `/StudyReports`, `/TATReport`; generation via JSP `/api/OpenELIS-Global/ReportPrint`
- **Referrals:** `/SampleShipment`, `/SampleShipment/:tab`, `/SampleShipment/{receive,create-box,reports,settings}`, `/SampleShipment/box/:boxId`, `/ReferredOutTests`
- **Analyzers:** `/analyzers`, `/analyzers/new`, `/analyzers/types`, `/analyzers/types/:profileId/mapping` (new), ~~`/analyzers/errors`~~ (retired 2026-09-24), `/analyzers/custom-field-types`, `/analyzers/:id/{edit,mappings,qc-rules}`, `/analyzers/qc/{db,rule-config,control-lots,control-lots/new,control-lots/:id,charts/:analyzerId,instruments/:instrumentId}`
- **EQA:** now **`/qa/eqa/*`** (see `current-state-gotchas.md` 2026-10-01 table); the old `/EQAManagement`, `/EQADistribution`, `/EQAMyPrograms`, `/EQAOrders`, `/EQAParticipants`, `/EQAResults` are redirects
- **Quality:** `/qa/overview`, `/qa/qc/*`, `/qa/qi/*`, `/qa/qms/*` (2026-10-01)
- **Microbiology:** `/MicrobiologyWorklist`, `/MicrobiologyCaseView/:caseId` · **Vector:** `/vector/deconvolution`, `/vector/identification`, `/VectorManualEntry`, `/VectorSurveillanceReport` · **Environmental:** `/EnvironmentalDashboard`
- **Alerts:** `/Alerts` · **Inventory:** `/inventory` (⚠ lowercase) · **Aliquot:** `/Aliquot` · **Freezer:** `/FreezerMonitoring`
- **Storage:** `/Storage` + `/Storage/:resource` where resource is `sample-items|inventory-lots|rooms|devices|shelves|racks|boxes` (2026-10-01; inventory lots joined Storage), and `/Storage/sample-items`, `/Storage/sample-items/:id/manage-location` (⚠ **`/Storage/samples` is not a route**)
- **Orders/Results:** `/ElectronicOrders`, `/SampleBatchEntrySetup`, `/PrintBarcode`, `/SamplePatientEntry`, `/SampleEdit`, `/ModifyOrder`, `/SampleManagement`, `/order`, `/result`, `/Results`, `/LogbookResults`, `/AccessionResults`, `/PatientResults(/:patientId)`, `/RangeResults`, `/StatusResults`, `/AnalyzerResults`
- **Order wizard steps:** `<base>/enter`, `<base>/collect`, `<base>/label`, `<base>/qa`
- **Patient:** `/PatientManagement/:patientId?`, `/PatientHistory`, `/PatientMerge`
- **Pathology:** `/PathologyDashboard`, `/CytologyDashboard`, `/ImmunohistochemistryDashboard` (+ `…CaseView/:sampleId` for each)
- **NCE:** `/NceDashboard`, `/ReportNonConformingEvent`, `/ViewNonConformingEvent`, `/NCECorrectiveAction`
- **NoteBook:** `/NoteBookDashboard`, `/NoteBookEntryForm(/:notebookid)`, `/NoteBookInstanceEntryForm/:notebookid`, `/NoteBookInstanceEditForm/:notebookentryid`, `/NotebookSampleOrder/:notebookId(/:notebookEntryId)`
- **Generic/Program:** `/GenericSample/{Order,Edit,Import,Results}`, `/genericProgram`, `/programView/:programSampleId`
- **Audit:** `/AuditTrailReport` (nav link `?type=system`) — ⚠ `/AuditLog` and `/SystemLog` are **not routes**
- **Not routes at all (previously listed here in error):** `/ResultsByPatient`, `/ResultsByOrder`, `/LOINCManagement`, `/MasterListsPage/LOINCCodes`, `/Inventory` (capital I), `/Storage/samples`, `/MasterListsPage/menuConfiguration` (its absence is what makes BUG-49 render blank)

## Breadcrumb quirk
SideNav reads "Admin"; breadcrumbs read "Admin Management". Preserve this drift in specs
that render breadcrumbs.

---

## Two admin prefixes
Admin pages ship under **both** `/MasterListsPage/<editorKey>` **and** `/admin/<editorKey>`.
`languageManagement` and `translationManagement` are linked from the nav as
`/admin/languageManagement` and `/admin/translationManagement`. Check which prefix the nav
uses before declaring a route.

---

## Maintenance
**Re-verified 2026-08-01** against `testing.openelis-global.org` by extracting the shipped
SPA router (`Route,{path:…}`) and the SideNav `link:` map from the live bundle, then probing
the REST surface with an authenticated session. This is a stronger check than HTTP status —
a React SPA returns 200 for any path, so status codes cannot confirm a frontend route.
Three admin `editorKey`s were found stale and are struck through above; the non-admin
sections were rewritten from the router output. Repeat this extraction each cycle rather
than re-checking routes by hand.

**Re-read 2026-10-01** from bundle `index-DDcS0cc-.js` (route strings and `Redirect` pairs, no login).
Added the untabled editorKeys above, marked `barcodeConfiguration` as a redirect to `labelPresets`,
moved EQA to `/qa/eqa/*`, and flagged `AnalyzerTestName` and `PluginFile` as not found (unverified,
not asserted removed). Nested routes built at runtime (for example the per-analyzer
`/analyzers/:id/...` pages) don't appear as literal strings, so their absence from the bundle scan
proves nothing.
