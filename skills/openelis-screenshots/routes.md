# OpenELIS SPA route reference

Live nav dump from `testing.openelis-global.org` (v3.2.1.10), captured 2026-06-23. All routes load
via `page.goto(route)` (status 200). Use these in `scripts/author-doc-specs.mjs` steps.

## Orders & samples
- `/Dashboard` — Home
- `/SamplePatientEntry` — Add Order (patient + sample entry)
- `/GenericSample/Order` — Create Order · `/GenericSample/Edit` — Edit Order · `/GenericSample/Import` — Import Samples
- `/GenericSample/Results` — **Enter Results**
- `/order` — order workflow dashboard · `/order/enter` · `/order/collect` · `/order/label` · `/order/qa`
- `/SampleBatchEntrySetup` — Batch Order Entry · `/PrintBarcode` — Barcode · `/Aliquot` — Aliquot
- `/ElectronicOrders` — Incoming (FHIR) orders · `/StudyElectronicOrders`

## Patient
- `/PatientManagement` — Add/Edit Patient · `/PatientHistory` — Patient History · `/PatientMerge` — Merge

## Results & validation
- `/LogbookResults?type=` — by Unit · `/PatientResults` — by Patient · `/AccessionResults` — by Order
- `/RangeResults` — by Range · `/StatusResults?blank=true` — by Test/Date/Status · `/ReferredOutTests` — Referred Out
- `/ResultValidation?type=&test=` — Validation (Routine) · `/AccessionValidation` — by Order
- `/AccessionValidationRange` — by Range · `/ResultValidationByTestDate` — by Date

## Storage & freezer
- `/Storage/sample-items` · `/Storage/rooms` · `/Storage/devices` · `/Storage/shelves` · `/Storage/racks` · `/Storage/boxes`
- `/FreezerMonitoring?tab=0..4` — Dashboard / Corrective Actions / Historical Trends / Reports / Settings
- `/SampleShipment` — Sample Shipment (referrals)

## Analyzers & QC
- `/analyzers` — Analyzers List · `/analyzers/errors` — Error Dashboard · `/analyzers/types` — Analyzer Types
- `/analyzers/qc/db` — QC Dashboard · `/analyzers/qc/rule-config` — Rule Configuration · `/analyzers/qc/control-lots` — Control Lots

## Non-conforming events
- `/NceDashboard` — All NCEs · `/ReportNonConformingEvent` — Report NCE · `/ViewNonConformingEvent` · `/NCECorrectiveAction` — Corrective Actions

## EQA
- `/EQAManagement` — Programs · `/EQAParticipants` · `/EQADistribution` — Distributions · `/EQAResults` — Results & Analysis
- `/EQAOrders` — Orders · `/EQAMyPrograms` — My Programs

## Pathology
- `/PathologyDashboard` · `/ImmunohistochemistryDashboard` · `/CytologyDashboard`

## Workplan
- `/WorkPlanByTest?type=test` · `/WorkPlanByPanel?type=panel` · `/WorkPlanByTestSection?type=` · `/WorkPlanByPriority?type=priority`

## Other
- `/NotebookDashboard` — Electronic lab notebook · `/inventory` — Inventory Management · `/Alerts` — Alerts
- `/TATReport` — Turn Around Time · `/AuditTrailReport?type=system|order` — Audit trail
- `/MasterListsPage` — **Admin** (Organizations and other master lists live under here)
- Reports: `/Report?type=<patient|indicator|routine>&report=<id>` (many; see the full nav dump in
  `OpenELIS QA/docs-media/_explore/nav.json`)

> To refresh this map, re-run the explorer: a spec that `goto('/')` then `$$eval('a[href]', ...)`
> and writes `docs-media/_explore/nav.json` (see git history of `tests/docs/_explore.spec.ts`).
