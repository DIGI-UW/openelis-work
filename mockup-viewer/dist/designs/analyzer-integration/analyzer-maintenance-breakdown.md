# Instruments: Maintenance, Certificates and Service Status: Slicing Guide (non-binding suggestion for the developer)

**Mockup:** `analyzer-maintenance.jsx` (default export `InstrumentsList`; named exports `MaintenancePage`, `InstrumentFieldOnResult`)
**FRS:** `analyzer-maintenance.md` (v2.0, 2026-10-21)
**Preview:** `analyzer-maintenance-preview.html`
**Pipeline assumption:** Claude Code (agentic) implementer, so slices are sized to **one reviewable PR each** (D-026), not to story points. Points are given only as a human-team fallback.
**Total slices:** 6
**Human-team fallback:** 3 versions, roughly 50 points, 3 sprints

The developer slices the work. This guide is the suggested order; every slice is a user-facing capability, dependency-ordered, and covered by FRS acceptance criteria. It replaces nothing: v1.0 of this feature was never sliced or built.

## Handoff ticket (Epic)

**Title:** Instruments: maintenance, certificates and service status (connected and not connected), with holds on results from unfit instruments
**Description summary:** Every instrument the lab uses is in one register; maintenance events carry calibration certificates; required checks per instrument and failed controls give each instrument a service status (In service, Restricted, Out of service) that Runs uses to hold results.
**Parent / linked program epic:** existing links kept (relates to OGC-899 PNG/CPHL Phase II, OGC-896, OGC-897); new link to OGC-1200 (Runs) and OGC-428 (Analyzer Manual QC).
**Why Epic, not Story:** three screens, new information (maintenance events, required checks, locks, instrument attributes), a daily evaluator, and a cross-feature contract with Runs.

## v1: One register and a maintenance log with certificates

**Fallback estimate:** 16 points

| Slice | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| 1. Lab manager sees every instrument, connected or not, in one list, and adds a balance or pipette that has no interface | 8 | FR-A1 to FR-A5; Navigation & URL (menu relabelled Instruments, Maintenance added, D-360 amends D-069) | New instrument attributes (Dependency 2), Dictionary `INSTRUMENT_KIND` (Dependency 7); Deactivate not delete (D-002); `analyzer.add.*`, `analyzer.field.*`, `analyzer.connection.*` keys; menu keys keep names, English value becomes "Instruments"; `analyzer:manage` for add and edit, `analyzer:view` for the list. Service status column shows In service for all until slice 3 |
| 2. Tech logs a calibration with its certificate number and PDF, and a second person verifies it | 8 | FR-B1 to FR-B8 | Maintenance event record (Dependency 1) with the v2.0 certificate attributes; attachment pattern (D-086, Dependency 6); audit `eventLogged / eventUpdated / eventVerified / eventArchived / eventUnarchived`; verifier cannot be performer or logger; NEW privileges `analyzer:log_maintenance`, `analyzer:verify_maintenance`. `EQUIPMENT_MAINTENANCE_DUE` alert from the event's next due date as v1.0 specified |

Result after v1: the assessor's question "show me this balance's certificate" is answered from OpenELIS. Nothing is held yet.

## v2: Required checks and service status

**Fallback estimate:** 18 points

| Slice | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| 3. Quality officer sets required checks per instrument, and the instrument shows Out of service when a check lapses, is in progress or fails, or when someone takes it out | 13 (split if human team: 3a checks and states 8, 3b status, reasons and manual out 5) | FR-C1 to FR-C5, FR-D1 to FR-D7, FR-F4 | Required check information (Dependency 3); one server-side status with reasons (D-361), never derived on a screen; daily recalculation plus recalculation on every relevant save; `INSTRUMENT_OUT_OF_SERVICE` alert (Dependency 8) to Home and the Management Dashboard; manual note in the `note` table; NEW privilege `analyzer:set_service_status`; audit `checkAdded / checkUpdated / statusChanged / takenOutOfService / returnedToService` |
| 4. Tech sees each instrument's status where they pick it for a result, and a test can require the instrument to be named | 5 | FR-F2, FR-F3 | **Reuses the Results Entry instrument field** (Results Entry v4 D4); adds the status tag and the inline will-be-held warning only. "Record the instrument used" setting lives in the Test Catalog QC section and is owned by Runs FR-H1; build it here if Runs slice 12 is later. `analyzer.picker.*` keys |

Result after v2: every instrument has a visible, auditable status, and staff are warned before they produce a result on an unfit one. Holds arrive with Runs.

## v3: Locks after failed controls

**Fallback estimate:** 16 points

| Slice | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| 5. A failed control locks that test on that instrument until a control for it passes again | 8 | FR-E1 to FR-E5, FR-F5 | Lock information and evaluator (Dependency 4), fed by run control verdicts (Runs FR-G7), Westgard rejections (`qc_rule_violation`, rejection rules only) and Analyzer Manual QC periodic checks (OGC-428, when built); no manual release; QC dashboard shows open locks; audit `lockSet / lockLifted`. Reverses OGC-428 BR-AQC-005 (D-364): add the supersession note to OGC-428 in the same PR |
| 6. Results from an out-of-service instrument or a locked test are held on the worklist with the reason | 8 | FR-F1 | **Built as Runs slice 12** (Runs FR-C8, FR-C9). Listed here so the Instruments epic is not called done before the hold exists. Needs Runs slices 1 and 4 |

Result after v3: SENAITE parity on instrument validity, with OpenELIS's per-test scope and an audited override (Accept despite with an NCE).

## Coverage check

- Every FR from the FRS appears in at least one slice: yes. FR-A1 to A5 (1), B1 to B8 (2), C1 to C5 (3), D1 to D7 (3), E1 to E5 (5), F1 (6, via Runs), F2 and F3 (4), F4 (3), F5 (5).
- Every UI element in the mockup is built by at least one slice: yes. Instruments list with Connection, Service status and Next due columns, filters and Show deactivated (1); Add a not-connected instrument inline row (1); Maintenance page scope filter, summary strip, event table with Certificate column and Has certificate filter, Log new event row with certificate fields, expanded event detail with Verify and Archive (2); status panel with reasons, Take out of service and Return to service, Required checks table and Add check row (3); instrument field with status tags and will-be-held warning (4); Open run link on a lock reason (5).
- Every slice is titled and scoped around user value, not a technical layer: yes.
- Cross-cutting concerns folded into their user-facing slice: localization per slice; access per slice with the nominated privileges named where they are introduced.
- Dependencies honored: slice 2 needs slice 1's register; slice 3 needs slice 2's events; slice 4 needs slice 3's status; slice 5 needs Runs slice 4 (run-linked control verdicts); slice 6 is Runs slice 12. No slice needs a later slice.

## Notes for the implementer

- **One status, computed once.** Service status and its reasons come from one server-side evaluator (FR-D5, D-361). The list, the status panel, the instrument picker, Runs, Alerts and the dashboard all read it. If a screen starts deriving status from dates, stop.
- **Two statuses, never one.** `Analyzer.status` (SETUP, VALIDATION, ACTIVE, ERROR_PENDING, OFFLINE, INACTIVE) is the connection lifecycle and keeps its meaning. Service status is new information beside it (FR-D6). Do not add values to the connection enum.
- **The v1.0 data model is not direction.** v1.0 prescribed an `EquipmentMaintenanceLog` table and referred to `Analyzer.type` and `Analyzer.location`, which are not on the entity at develop `965d6d1`. v2.0 describes information only; storage is yours to decide. Record the decision in the PR.
- **Certificates are events.** A certificate is a maintenance event with a number, issuer, PDF and valid-until date (D-362). No separate certificate table or page.
- **Locks are not releasable.** There is no "release lock" endpoint or button (FR-E4). The only way past a held result is Runs' Accept despite with an NCE.
- **Coordinate.** OGC-1200 (Runs: slice 6 and the control verdict feed), OGC-1148 (Test Catalog QC section: the "Record the instrument used" setting), OGC-428 (BR-AQC-005 reversed), OGC-897 and OGC-896 (alert consumers).
- **i18n.** Constitution Principle VII: run `npm run i18n:find` before minting any key; the menu keys keep their names and only their values change, in every shipped locale.
