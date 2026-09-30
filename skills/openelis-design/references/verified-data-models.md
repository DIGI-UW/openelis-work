# Verified Data Models

> Read during `/specify` Stage 1 and `/analyze` Pass G (Invented Data). These data models
> were field-verified in prior design sessions and/or against the live app. **Reuse these
> field lists — do not re-derive or invent.** When a feature touches one of these areas,
> pull the canonical field list from the area's FRS rather than guessing.
>
> Enforces design-addendum MUST A (reuse existing data; never invent domain concepts).

---

## Configuration / admin entities

| Area | Verified shape | Notes / gotchas |
|---|---|---|
| **Application / Common Properties** | 61 properties grouped into 7 domains; ~10 booleans (cross-cutting with Feature Flags) | UI title is "Common Properties" but standardize on "Application Properties". Live route `/MasterListsPage/commonproperties` |
| **Site Information** | 29 properties | C039 `patientSearchPassword` needs `PasswordInput`; C041 `bannerHeading` needs multi-locale editor; `TrainingInstallation` is destructive. Live route `/MasterListsPage/SiteInformationMenu` |
| **Validation Configuration** | 4 charset fields only: firstName, lastName, patientId, userName | Admins currently edit blind (audit C051 High) — key fix is a live "try a value" preview per charset |
| **WorkPlan Configuration** | 3 booleans: nextVisit, results, subject (on workplan) | Fix = live workplan preview showing columns conditionally. Live route `/MasterListsPage/WorkPlanConfigurationMenu` |
| **Order & Patient Entry** | 14 Order Entry + 8 Patient Entry = 22 properties | Merged into one page for B.2; conditional fields grey out when parent toggle is off |
| **Menu Configuration** | 5 scopes; 4 have trees of varying depth, Billing is URL+toggle only | Per-node "Side Nav Active" checkbox; "Show Child Elements" expand/collapse toggle. Parent route `/MasterListsPage/menuConfiguration` renders blank (BUG-49) — use the 7 sub-routes directly |
| **Patient Entry Configuration** | Flat name/description/value table (radio-select + Modify): allow duplicate national IDs, allow duplicate subject number, default nationality (must match the nationality list), National ID required, `patientGpsCaptureEnabled`, Patient ID required, Subject number required, `supportPatientNationality`, `useNewAddressHierarchy` | Route `/MasterListsPage/PatientConfigurationMenu` (in the shipped router 2026-10-01). Seen live on v3.2.1.11, 2026-07-17; property list not re-checked since. Order Entry Configuration is the sibling `SampleEntryConfigurationMenu`; the Order & Patient Entry redesign merges the two |
| **Dictionary** | Controlled response lists are **Category → Entry** (+ Is Active Y/N, local abbreviation, LOINC code); Add / Modify / **Deactivate**, no delete | Route `/MasterListsPage/DictionaryMenu`. **The** mechanism for admin-managed picklist options; don't invent a parallel list entity. Seen live 2026-07-17 |
| **Patient form** | `/PatientManagement` ("Add Or Modify Patient"; search then New Patient). **Edit and view are the same screen** (no separate read-only view). Sections: Patient Information, Emergency Contact, Additional Information (address search, Health Region, Health District, education, marital status, nationality, occupation, target disease programme, custom notes 0/255), Identification Documents | Route `/PatientManagement/:patientId` in the router 2026-10-01. Sections seen live 2026-07-17 (v3.2.1.11) |
| **Address hierarchy labels** | Site Information: "Address line 1/2/3 label" and **"Geographic Unit 1 Label" (e.g. Region) / "Geographic Unit 2 Label" (e.g. District)**; values come from Organization data (parent-org hierarchy); gated by `useNewAddressHierarchy`; FHIR `Patient.address` | Region/District are address-hierarchy fields, **not a Dictionary category**. Locations & Organizations (OGC-1363) redesigns where the values are managed. Seen live 2026-07-17 |
| **Validation charset / RETROCI study forms** | `useRetroCIStudyForms` flag gates hardcoded ARV/EID/VL/Indeterminate forms; off by default | Study Menu Configuration retires entirely under this flag |

## Notification / alerting

| Area | Verified shape | Notes |
|---|---|---|
| **Test Notification** | 4 channels (Patient Email, Patient SMS, Provider Email, Provider SMS); 3-tier template fallback (channel→test→system); 4 substitution variables; BCC on Provider Email only | Live route `/MasterListsPage/testNotificationConfigMenu` — per-test × 4-channel matrix |
| **Test Catalog Alerts** | per-test rule authoring; delivery via the Test Notification system; per-rule ack toggle couples to Critical Acknowledgment | Authoring + delivery are split concerns |

## Cross-cutting patterns

- **Feature Flags (admin MVP):** introduced as a 10th tab in Application Settings (hybrid
  auto-aggregate + curated dictionary). Menu Config = navigation-scoped flags.
- **External patient source:** `patientSearchURL` is admin-editable, but request/response
  format is hardcoded in Java — new endpoint types need engineering coordination.
- **Domain enum:** strictly CLINICAL / ENVIRONMENTAL / VECTOR — no BOTH, anywhere.

## Test Catalog core model (source-verified 2026-07-14, develop)

> Full reference with ER diagram, consumption traces, and decision table:
> **`references/test-catalog-data-model.md`** — read it before any Test / Panel /
> Sample Type / Lab Unit design work. Headlines:

| Area | Verified shape | Notes / gotchas |
|---|---|---|
| **Test** (`TEST`) | single `LOINC` col; `DOMAIN` varchar(20) NOT NULL CHECK CLINICAL/ENVIRONMENTAL/VECTOR (OGC-936, merged); **no sample-type column** | Specimen lives only in `SAMPLETYPE_TEST`; "one specimen per test" is an app write-path convention, not schema |
| **Panel** (`PANEL`) | name(20), description(60), single loinc(10), localization, sort_order, is_active | **No code, lab-unit, sample-type, or domain column** — panel domain is a proposed migration |
| **PanelItem** (`PANEL_ITEM`) | panel FK, test FK, sort_order + legacy `TEST_LOCAL_ABBREV`, `METHOD_NAME` | No per-test LOINC; no unique (panel_id,test_id) |
| **TypeOfSample** (`TYPE_OF_SAMPLE`) | description(20), legacy `DOMAIN` varchar(1) ('H' convention), local_abbrev unique, is_active, sort_order | Legacy 1-char domain ≠ new enum — migration needed for single-domain decision |
| **TypeOfSampleTest** (`SAMPLETYPE_TEST`) | sample_type_id, test_id, display_order (OGC-938/985) | m:n-capable, **no unique pair constraint**; unmapped legacy `is_panel` col in DB. App keeps exactly 1 row per test |
| **TypeOfSamplePanel** (`SAMPLETYPE_PANEL`) | sample_type_id, panel_id | **Still live**: order-entry panel list + e-order panel→sample-type resolution consume it; UI ignores it but backend must keep it synced |
| **TestSection / Lab Unit** (`TEST_SECTION`) | name(20), description(60), org FK, is_external, **parent self-FK (hierarchy)**, sort_order, **domain** (CLINICAL / ENVIRONMENTAL / VECTOR, default CLINICAL; OGC-1020, verified on develop 2026-09-29) | One domain per lab unit (D-120) |
| **TestSampleHandling** (`test_sample_handling`) | 1:1 with test (unique FK); storage condition/duration/flags, disposal method/timeframe/unit, notes; JSONB history table | Authoritative per-test store (OGC-938 changesets); sample-type disposal text is design-proposed only |
| **LOINC routing** | `getActiveTestsByLoinc` = catalog-wide first active match, `.get(0)` in analyzer + e-order + FHIR intake | Only `LabOrderSearchProvider` disambiguates by sample type; panel LOINC matched at intake too |

---


## Microbiology (verified on develop 2026-09-29)

| Entity | Verified shape | Notes / gotchas |
|---|---|---|
| **MicroCaseOrderDetail** (`micro_case_order_detail`) | culture_purpose, patient origin, admission date, number_of_sets, clinical history, antibiotic exposure | **Dual owner:** either an order-level draft row (`sample_id` unique, `case_id` null) or a per-case row (`case_id` unique) copied at routing; CHECK exactly one is set (changeset 082). Microbiology v2: purpose per case defaulting from the draft (D-137) |
| **CriticalCallback** (`critical_callback`) | result_id (NOT NULL), analysis_id, result_value (copied from the result), logged_by, logged_at, recipient_name, status (CONFIRMED, REACHED_NO_READBACK, UNABLE_TO_REACH) | **Write guard:** the REST controller rejects a result not at or beyond its catalog critical limits (400); metrics count only those. Microbiology v2 FR-18.2a adds a criticality source for rule-flagged criticals |
| **MicroCaseInoculation** (`micro_case_inoculation`) | container_identifier (NOT NULL), media (NOT NULL, free text), incubation and atmosphere (free text), source_inoculation_id (subculture parent), activity_id | Medium is free text today; Microbiology v2 FR-05.1b makes it an Inventory item and lot (D-147). Reagent lots chosen on the inoculation are linked through `micro_inventory_usage_link` with context `CULTURE_SETUP` (AST uses `AST_SETUP`) |
| **InventoryItem** (`inventory_item`) | code, name, item_type (enum `ItemType`: REAGENT, RDT, CARTRIDGE, HIV_KIT, SYPHILIS_KIT; DB `chk_item_type` CHECK), category (free text), units, lots with status (ACTIVE, IN_USE, EXPIRED, CONSUMED, DISPOSED, QUARANTINED) and QC status | A new item type needs the enum, the CHECK constraint and the item form's type label. Microbiology v2 adds `MICROBIOLOGY_MEDIUM` (FR-05.1d) with a Tracked flag: not tracked items have no lots (D-164); culture rows record the lot but never change stock (D-169) |

## Maintenance
Each row should cite its canonical FRS. When a new feature's data model gets verified, add
a row here so the next `/specify` reuses it. Cross-check `current-state-gotchas.md` for
what's built vs. not before relying on a row.

- **2026-10-01 (monthly consolidation):** added Patient Entry Configuration, Dictionary, Patient
  form and Address hierarchy labels, promoted from a 2026-07-17 live grounding pass (auto-memory).
  Routes re-confirmed in the shipped router today; field lists carry their July date.
