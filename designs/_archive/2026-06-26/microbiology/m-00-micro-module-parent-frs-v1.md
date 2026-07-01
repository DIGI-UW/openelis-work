# M-00 Microbiology Module — Parent Specification

**Version:** 1.0
**Date:** 2026-05-15
**Module:** Microbiology (top-level)
**Status:** Draft — anchors the M-01 through M-12 bundle.
**Companion docs:** `amr-design-critique-v1.md`, `amr-micro-narrative-v1-for-devs.md`, `amr-crosswalk-working.md`, `whonet-export-design-review-v1.md`, `amr-pre-frs-planning-v1.md`

This is the spine spec. Every other M-* spec in the bundle references back to this doc for the glossary, the data model overview, the RBAC matrix, the phase plan, the out-of-scope statement, and the cross-cutting constraints. Read this first, then go to the spec that matches the work you're doing.

---

## 1. Overview

### 1.1 Purpose

The OpenELIS Global Microbiology Module is a new top-level area of the application that supports bacterial culture, isolate identification, antimicrobial susceptibility testing (AST), expert review, structured reporting, and surveillance export (WHONET). It models a workflow that does not fit the existing OpenELIS "Sample → Analysis → Result" pattern: micro is multi-day, multi-isolate, narrative-heavy, and produces variable numbers of results per Sample.

The module replaces the v1.1 AMR FRS trio (AMR Configuration, Microbiology Case Workbench, WHONET Integration) which was correctly scoped but structurally monolithic. The new bundle decomposes into thirteen smaller, composable specs (M-01 through M-12 plus M-NFR), each addressing one well-bounded concern.

### 1.2 Scope

**In scope for Phase 1A (4-month target, 5-month max):**

Bacterial micro workflow end-to-end: order entry hook, culture setup, incubation tracking, positive detection (analyzer-ingested or manual), Gram stain and isolate management, organism identification (manual, automated via VITEK 2, or analyzer-ingested), AST setup and result entry (manual or analyzer-ingested), interpretation against versioned CLSI / EUCAST breakpoint tables, supervisor review, preliminary and final report release, amendment workflow, structured critical-result acknowledgment with Alerts Dashboard integration, audit trail across all surfaces, Test → Reagent lot linkage (general OE foundation, parallel track), and macro-based text-shortcut typing for clinical narrative.

**In scope for Phase 1B (3-4 months after 1A):**

Expert Rules Engine with built-in rules (MRSA inference, D-test required, ESBL screen and confirm, cascade reporting, intrinsic resistance verification); WHONET Export Generator with code mapping admin; Hub Subscription for breakpoint and reference-data updates; additional analyzer profiles (BD Phoenix, Sensititre, BACTEC, MALDI-TOF); FHIR push for micro reports; AST Run QC integration.

**Out of scope** — see Section 7.

### 1.3 Users

| Role | Primary actions |
|------|-----------------|
| Microbiology Technician | Culture setup, subculture, Gram stain, organism ID, manual AST entry, preliminary report release |
| Microbiology Supervisor | Review results, approve interpretations, release final reports, authorize amendments, manage cases |
| Lab Manager | Full access; configure AMR reference data, AST panels, culture protocols, breakpoint catalog versions, macros |
| Medical Technologist | Interface with analyzers, verify automated results, troubleshoot integration issues |
| Surveillance Officer | Generate WHONET exports, validate dedup, manage code mappings (Phase 1B) |
| System Administrator | All permissions; user role assignments; analyzer profile management |

### 1.4 Module organization

The Micro Module appears in the OpenELIS sidenav as a new top-level item under the Patient Tests section. Within Micro, the sidenav submenu lists:

```
Microbiology
├── Pending Cultures           (M-07 Worklist — incubation, subculture)
├── AST Worklist               (M-07 Worklist — susceptibility testing queue)
├── Microbiology Dashboard     (M-07 Worklist — manager view, Phase 1B if 1A capacity tight)
└── Case Search                (M-04 — search across all cases)
```

Admin areas live under the Admin top-level (per `feedback_admin_ia_vs_editor_ia`):

```
Admin
├── Microbiology Reference Data   (M-01)
│   ├── Organism Master
│   ├── Antibiotic Master
│   ├── AST Panels
│   └── Culture Protocols
├── Breakpoint Catalog            (M-02)
├── Macro Library                 (M-08)
├── Hub Subscription              (M-10, Phase 1B)
├── WHONET Mapping                (M-09, Phase 1B)
└── Test → Reagent Linkage        (M-12; cross-cutting, lives in Test Catalog admin actually — see M-12 spec)
```

Per `feedback_openelis_sidenav_submenus`: all multi-view sections use sidenav submenus, not in-page Carbon Tabs.

---

## 2. Glossary

Vocabulary used across the M-* bundle. Each term is bolded the first time it appears in any spec.

| Term | Definition |
|------|------------|
| **Case** | Container for a single Sample's entire micro workup, from arrival through final report. One Case per micro Sample. Has a stage (lifecycle position), assigned tech, culture protocol, and timeline of events. |
| **Isolate** | A distinct organism identified from a Sample. Zero, one, or many per Case. Has organism (FK to Organism Master), significance, AST history. |
| **AST Run** | A single susceptibility test event: one Isolate × one AST Panel × one Date × one Method × one Breakpoint Standard × one Tech. Has many AST Results (one per antibiotic tested). |
| **AST Result** | One antibiotic's susceptibility result within an AST Run. Carries MIC value, MIC unit, zone diameter, interpretation (S/I/R), override flag, and breakpoint version. Stored in the existing `result` table via the multi-reading mechanism (per crosswalk Q2). |
| **Breakpoint** | Threshold value (MIC or zone diameter) that defines S/I/R interpretation for one (antibiotic, organism, breakpoint-standard-version) combination. |
| **Breakpoint Standard** | A reference dataset (CLSI M100, EUCAST clinical breakpoints) consisting of many Breakpoints. Versioned (CLSI M100 2024, EUCAST v14.0). |
| **Expert Rule** | A definition that fires on AST Run state changes and either modifies results (MRSA inference forces beta-lactams to R), flags conditions (ESBL screen positive), or controls reporting (cascade suppression). Phase 1B. |
| **Cascade Reporting** | A reporting rule that only displays second-tier antibiotics when first-tier are all R. Common for urines. Phase 1B. |
| **WHONET** | Both a software product (Windows DB tool for AMR surveillance) and a file format (CSV/TXT export from labs to country reference labs). The module's surveillance export targets the file format. |
| **GLASS** | WHO Global Antimicrobial Resistance and Use Surveillance System. National-level program that consumes aggregated WHONET data. **Not directly addressed by this module** — OpenELIS is single-tenant; aggregation across labs happens centrally outside OE. |
| **Hub** | Central repository (managed externally) that supplies updates to the Breakpoint Catalog, Organism Master, Antibiotic Master, and WHONET code tables. OE pulls; never pushes. |
| **Macro** | A typing shortcut: type `.code`, get expanded text. Cross-cutting OE feature with Micro as the first consumer. |
| **Critical Result** | A clinically actionable finding requiring immediate notification to the ordering provider. In Micro: positive blood culture Gram stain (sterile site), CSF positivity, CRE, MRSA from sterile site, VRE, AFB-positive sputum (per lab SOP). |
| **Preliminary Report** | A report released before the workup is complete (typically on positive Gram stain). Updated by amendment when more information is available. |
| **Final Report** | A signed report released after supervisor review. Immutable once released; updates require amendment. |
| **Amendment** | A new version of a released report. Original is preserved; delta is shown to clinical reader. |
| **Significance** | Clinical assessment of whether an isolate represents real infection. Values: SIGNIFICANT, NOT_SIGNIFICANT, PROBABLE_CONTAMINANT, COLONIZER, INDETERMINATE. |
| **First Isolate** | The earliest isolate of a given organism from a given patient within a dedup window (default 7 days). Surveillance concept — only first isolates count in resistance trending. |
| **Phenotype Flag** | A categorical resistance characteristic (MRSA, ESBL, CRE, VRE, MDR, XDR, PDR) derived from AST results by the Expert Rules engine. Carried in WHONET exports as separate columns. |

---

## 3. Data model overview

This is the canonical sketch. Each spec elaborates its corner.

### 3.1 New tables introduced by the M-* bundle

```
sample (existing)
   │
   │ 1:1 post-save hook when sample.program = MICROBIOLOGY
   ▼
micro_case
   ├── case_id (PK)
   ├── sample_id (FK to sample)
   ├── stage (enum: RECEIVED, INOCULATING, INCUBATING, POSITIVE_SIGNAL,
   │          GROWTH_DETECTED, ORGANISM_ID, AST_IN_PROGRESS, READY_REVIEW,
   │          PRELIM_REPORTED, FINAL_REPORTED, NO_GROWTH_FINAL,
   │          REJECTED_AT_ACCESSIONING, CANCELLED_PRE_INOCULATION,
   │          CANCELLED_POST_INOCULATION, CANCELLED_POST_POSITIVE,
   │          LOST_SPECIMEN, LOST_SPECIMEN_POSITIVE, AMENDED)
   ├── culture_protocol_id (FK to culture_protocol — M-01)
   ├── assigned_tech_user_id (FK to user)
   ├── patient_origin_code (FK to coded vocabulary)
   ├── department_code (FK to coded vocabulary)
   ├── ward (free-text or coded)
   ├── number_of_sets (int, e.g. blood culture set count)
   ├── is_screening_culture (bool)
   ├── clinical_history (text, macro-enabled)
   ├── antibiotic_exposure (bool)
   ├── critical_value_notify (bool)
   ├── created_at, created_by
   └── audit columns
   │
   │ 1:N
   ▼
micro_case_inoculation
   ├── inoculation_id (PK)
   ├── case_id (FK)
   ├── media_type (FK to media catalog)
   ├── lot_number (FK to qc_lot — M-12 via reagent linkage)
   ├── bottle_id or plate_id
   ├── inoculated_at, inoculated_by
   └── notes
   │
   │ feeds into
   ▼
micro_timeline_event
   ├── event_id (PK)
   ├── case_id (FK)
   ├── isolate_id (FK, nullable — some events are Case-level not Isolate-level)
   ├── event_type (enum: INOCULATION, POSITIVE_SIGNAL, GRAM_STAIN,
   │                    PLATE_READING, SUBCULTURE, ORGANISM_ID_PRELIM,
   │                    ORGANISM_ID_FINAL, AST_SETUP, AST_RESULT_RECEIVED,
   │                    EXPERT_RULE_DECISION, REPORT_RELEASED,
   │                    AMENDMENT_RELEASED, GENERAL_NOTE, etc.)
   ├── event_at, event_by
   ├── notes (text, macro-enabled)
   ├── linked_run_id (FK to ast_run, nullable)
   └── linked_event_id (FK to analyzer_event, nullable)
   
micro_isolate
   ├── isolate_id (PK)
   ├── case_id (FK)
   ├── isolate_number (int, 1..n within Case)
   ├── organism_id (FK to organism_master — M-01; nullable until identified)
   ├── id_method (enum: MANUAL_BIOCHEM, VITEK_2, MALDI_TOF, PCR, OTHER)
   ├── id_confidence_pct (numeric, nullable)
   ├── whonet_code (denormalized from organism_master for export speed)
   ├── significance (enum)
   ├── gram_stain_observation (text, macro-enabled)
   ├── colony_morphology (text, macro-enabled)
   ├── preliminary_id_notes (text, macro-enabled)
   ├── final_id_notes (text, macro-enabled)
   ├── clinical_notes (text, macro-enabled)
   ├── version (int, incremented on reidentification)
   ├── previous_version_id (FK to self, nullable)
   ├── created_at, created_by, last_updated_at, last_updated_by
   └── audit columns

micro_ast_run
   ├── run_id (PK)
   ├── case_id (FK)
   ├── isolate_id (FK to specific isolate VERSION — handles reidentification correctly)
   ├── ast_panel_id (FK to ast_panel — M-01)
   ├── breakpoint_standard_id (FK to breakpoint_standard — M-02)
   ├── breakpoint_version (denormalized for snapshot)
   ├── method (enum: VITEK_2, BD_PHOENIX, SENSITITRE, DISK_DIFFUSION, ETEST, BROTH_MICRODILUTION, MANUAL)
   ├── status (enum: PENDING_SETUP, IN_PROGRESS, READING, COMPLETE, QC_FAILED, RERUN_REQUIRED)
   ├── analyzer_card_id (nullable, instrument-side identifier)
   ├── reagent_lot_id (FK to qc_lot — M-12)
   ├── started_at, started_by
   ├── completed_at
   └── audit columns
   │
   │ 1:N AST results go to existing result table (per crosswalk Q2)
   ▼
result (existing OE table — extended via existing multi-reading mechanism)
   ├── result_id (PK)
   ├── (existing columns)
   ├── micro_ast_run_id (FK, nullable — only set for AST results)
   ├── antibiotic_id (FK to antibiotic_master, nullable — only set for AST results)
   └── ... uses existing multi-reading for MIC value, MIC unit, zone diameter,
       interpretation, override flag, breakpoint version

micro_ast_override (audit)
   ├── override_id (PK)
   ├── result_id (FK to result — the AST result row that was overridden)
   ├── original_interpretation (S/I/R)
   ├── override_interpretation (S/I/R)
   ├── original_mic, original_zone (preserved)
   ├── rule_id (FK to expert_rule_definition, nullable — null for manual overrides)
   ├── rule_version (nullable, snapshotted at override time)
   ├── justification (text, macro-enabled)
   ├── overridden_at, overridden_by
   └── audit columns

micro_critical_notification (M-11 polymorphic table replacing existing aspirational table)
   ├── notification_id (PK)
   ├── target_type (enum: RESULT, CASE, ISOLATE, SAMPLE)
   ├── target_id (FK to corresponding entity)
   ├── notified_at, notified_by
   ├── clinician_name, clinician_phone, clinician_email
   ├── message (text, macro-enabled)
   ├── acknowledged_at, acknowledged_by
   └── audit columns

analyzer_event (M-04 — new channel parallel to result ingestion)
   ├── event_id (PK)
   ├── analyzer_id (FK to analyzer profile)
   ├── event_type (enum: POSITIVE_SIGNAL, NEGATIVE_AT_DAY_N, BOTTLE_LOADED,
   │                    BOTTLE_REMOVED, CARD_LOADED, CARD_COMPLETE,
   │                    QC_PASS, QC_FAIL, MAINTENANCE_DUE, REAGENT_LOW)
   ├── source_id (analyzer-side identifier, e.g., bottle ID or card ID)
   ├── payload (JSON)
   ├── received_at
   ├── resolved_at (when downstream handler consumed)
   └── status (PENDING, HANDLED, FAILED)
```

### 3.2 Reference data tables (M-01)

```
organism_master
   ├── organism_id (PK)
   ├── scientific_name
   ├── common_name (nullable)
   ├── whonet_code (3-5 char)
   ├── organism_group_id (FK to organism_group)
   ├── gram_stain (enum)
   ├── morphology (enum)
   ├── oxygen_requirement (enum)
   ├── clinical_significance_default (enum)
   ├── default_ast_panel_id (FK to ast_panel)
   ├── active (bool)
   ├── notes
   └── audit columns

organism_group
   ├── group_id (PK)
   ├── name (Enterobacterales, Staphylococcus, etc.)
   ├── description
   └── audit columns

organism_intrinsic_resistance (junction)
   ├── organism_id (FK)
   ├── antibiotic_id (FK)
   └── notes

antibiotic_master
   ├── antibiotic_id (PK)
   ├── name
   ├── whonet_code (3 char)
   ├── antibiotic_class
   ├── route (enum: ORAL, IV, BOTH)
   ├── active (bool)
   └── audit columns

ast_panel
   ├── panel_id (PK)
   ├── name
   ├── code
   ├── target_organism_group_id (FK, nullable — panel applies broadly if null)
   ├── target_specimen_type_id (FK, nullable — panel applies to all if null)
   ├── version (int, incremented on panel changes)
   ├── active (bool)
   └── audit columns

ast_panel_antibiotic (junction)
   ├── panel_id (FK)
   ├── antibiotic_id (FK)
   ├── tier (int: 1 = first-line, 2 = second-line, 3 = third-line — drives cascade reporting)
   ├── report_default (enum: ALWAYS, CASCADE, SUPPRESS_UNLESS_R)
   └── (panel_id, antibiotic_id) unique

culture_protocol
   ├── protocol_id (PK)
   ├── name
   ├── code
   ├── default_media_list (JSON or junction table)
   ├── default_incubation_hours
   ├── default_temperature_c
   ├── default_atmosphere (enum: AEROBIC, ANAEROBIC, CO2, MICROAEROPHILIC)
   ├── max_incubation_days (e.g. 5 for blood culture)
   ├── active (bool)
   └── audit columns
```

### 3.3 Breakpoint Catalog (M-02)

```
breakpoint_standard
   ├── standard_id (PK)
   ├── name (CLSI M100, EUCAST Clinical)
   ├── publisher (CLSI, EUCAST)
   ├── version_year (2024, 2025, etc.)
   ├── version_label (CLSI_M100_2024, EUCAST_v14_0)
   ├── effective_from, effective_to (nullable)
   ├── is_active (bool — at most one active per publisher per lab default)
   └── audit columns

breakpoint
   ├── breakpoint_id (PK)
   ├── standard_id (FK)
   ├── organism_id (FK, nullable — applies broadly if null)
   ├── organism_group_id (FK, nullable — applies to group if set)
   ├── antibiotic_id (FK)
   ├── specimen_type_filter (FK, nullable — e.g., urine-specific breakpoints)
   ├── method (DISK_DIFFUSION, MIC)
   ├── susceptible_threshold (numeric)
   ├── intermediate_threshold (numeric, nullable for S/R-only)
   ├── resistant_threshold (numeric)
   ├── notes
   └── audit columns
```

### 3.4 Macro Library (M-08)

```
macro
   ├── macro_id (PK)
   ├── trigger_code (text, 2-15 chars, starts with `.`)
   ├── expansion (text, max 500 chars)
   ├── category (enum: clinical, gramStain, colony, culture, organisms, ast, reporting, timeline)
   ├── description (nullable)
   ├── active (bool)
   ├── seeded (bool — distinguish system defaults from lab additions)
   └── audit columns
```

### 3.5 Test → Reagent Linkage (M-12)

```
test_reagent_link
   ├── link_id (PK)
   ├── test_id (FK to test catalog)
   ├── reagent_id (FK to reagent inventory)
   ├── required (bool — must be selected at result entry vs. optional)
   ├── consumption_unit (e.g., 1 card per AST Run)
   └── audit columns
```

---

## 4. Permissions

Per `feedback_openelis_admin_permissions`: admin menu is binary in OE today (all or nothing except Test Catalog Management). The Micro Module respects that — micro-related admin pages appear under the existing Admin top-level, gated by the existing admin permission. Within Micro itself, there are role-based actions per Section 1.3.

### 4.1 Permission codes

| Code | Description |
|------|-------------|
| `micro.case.view` | View Micro Cases |
| `micro.case.create` | Create new Cases (triggered by Sample save; rarely manual) |
| `micro.case.edit` | Edit Case details (stage transitions, timeline events) |
| `micro.isolate.create` | Create Isolates within a Case |
| `micro.isolate.edit` | Edit Isolates |
| `micro.isolate.reidentify` | Change `organism_id` on a finalized Isolate (creates new version) |
| `micro.ast.setup` | Set up new AST Runs |
| `micro.ast.enter` | Enter AST Results manually |
| `micro.ast.override` | Override an AST interpretation (with justification) |
| `micro.report.preliminary` | Release Preliminary Reports |
| `micro.report.final` | Release Final Reports |
| `micro.report.amend` | Amend a Final Report |
| `micro.worklist.view` | View Pending Cultures and AST Worklists |
| `micro.expert.review` | Make Expert Review decisions (Phase 1B) |
| `micro.expert.config` | Configure Expert Rule definitions (Phase 1B) |
| `micro.ref.view` | View AMR Reference Data |
| `micro.ref.manage` | Add/edit/delete organism / antibiotic / panel / protocol records |
| `micro.breakpoint.view` | View Breakpoint Catalog |
| `micro.breakpoint.manage` | Manage Breakpoint Catalog (versions, imports, active selection) |
| `micro.macro.view` | View Macro Library |
| `micro.macro.manage` | Manage Macro Library |
| `micro.hub.manage` | Manage Hub Subscription (Phase 1B) |
| `micro.surveillance.export` | Generate WHONET exports (Phase 1B) |
| `micro.surveillance.mapping` | Manage WHONET code mappings (Phase 1B) |
| `critical.notify.create` | Log a critical-result notification (used by Micro; also by other modules) |
| `critical.notify.acknowledge` | Acknowledge an open critical-result notification |
| `critical.notify.view` | View critical-notification audit log |

### 4.2 Role assignment matrix

| Role | Cases | Isolates | AST | Reports | Worklists | Reference Data | Expert | Macros | Surveillance |
|------|-------|----------|-----|---------|-----------|----------------|--------|--------|--------------|
| Micro Tech | V, E | V, C, E | V, S, E | V, P | V | V | V, R | V | — |
| Micro Supervisor | V, E | V, C, E, R | V, S, E, O | V, P, F, A | V | V | V, R, D | V | V |
| Lab Manager | V, E | V, C, E, R | V, S, E, O | V, P, F, A | V | V, M | V, R, D, C | V, M | V, X, M |
| Medical Tech | V, E | V, C, E | V, S, E | V, P | V | V | V | V | — |
| Surveillance Officer | V | V | V | V | — | V | — | V | V, X, M |
| System Admin | V, E | V, C, E, R | V, S, E, O | V, P, F, A | V | V, M | V, R, D, C | V, M | V, X, M |

Legend: V=View, C=Create, E=Edit, R=Reidentify, S=Setup, O=Override, P=Preliminary release, F=Final release, A=Amend, M=Manage, X=Export, D=Decide on flag.

---

## 5. State machine — Case stages

Detailed in M-04. Summary diagram for orientation:

```
[Sample created with program=MICROBIOLOGY]
                │
                ▼
            RECEIVED
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
   INOCULATING       REJECTED_AT_
        │            ACCESSIONING (terminal)
        ▼
    INCUBATING ──────────────────────────────────┐
        │                                          │
        │ analyzer event POSITIVE_SIGNAL           │
        │ OR manual plate reading shows growth     │
        │                                          │ no growth after
        ▼                                          │ max_incubation_days
   POSITIVE_SIGNAL                                 │
        │                                          ▼
        ▼                                  NO_GROWTH_FINAL ──┐
   GROWTH_DETECTED                                            │
        │                                                     │
        ▼                                                     │ late slow
   ORGANISM_ID                                                │ grower revives
        │                                                     │ to POSITIVE_SIGNAL
        ▼                                                     │
   AST_IN_PROGRESS                                            │
        │                                                     │
        ▼                                                     │
   READY_REVIEW                                               │
        │                                                     │
        ▼                                                     │
   PRELIM_REPORTED                                            │
        │                                                     │
        ▼                                                     │
   FINAL_REPORTED ◀──────────────────────────────────────────┘
        │
        │ amendment workflow
        ▼
   AMENDED (returns to FINAL_REPORTED on each amendment cycle)


Terminal alternative branches (any non-terminal stage above can transition):

   ── on cancellation pre-inoculation ──▶ CANCELLED_PRE_INOCULATION (terminal)
   ── on cancellation post-inoculation ─▶ CANCELLED_POST_INOCULATION (terminal)
   ── on cancellation post-positive ────▶ CANCELLED_POST_POSITIVE (terminal)
   ── on lost specimen pre-positive ────▶ LOST_SPECIMEN (terminal)
   ── on lost specimen post-positive ───▶ LOST_SPECIMEN_POSITIVE (terminal)
```

Every transition is auditable. M-04 §State Transitions enumerates triggers, allowed roles, side effects per transition.

---

## 6. Phase plan

### 6.1 Phase 1A (Months 0-4, ships at month 4-5)

Eleven modules ship as a coordinated release. Pre-track: M-12 Test→Reagent Linkage starts before Sprint 1.

| Module | Sprint anchor |
|--------|---------------|
| M-12 Test→Reagent Linkage | Pre-track (Months -1 to 2) |
| M-00 Module Parent | Specs locked Sprint 1 |
| M-NFR Non-Functional Requirements | Specs locked Sprint 1 |
| M-11 Critical-Result Acknowledgment | Schema Sprint 1-2; UI Sprint 3-4 |
| M-01 Reference Data | Sprints 3-4 |
| M-02 Breakpoint Catalog | Sprints 3-4 |
| M-08 Macro Library | Sprints 3-5 |
| M-03 Order Entry Hook | Sprint 5 |
| M-04 Case Workbench Core | Sprints 3-10 (largest module) |
| M-05 AST Entry & Interpretation | Sprints 7-9 |
| M-07 Worklists | Sprints 7-10 |
| Analyzer integration | Sprints 9-11 |
| Pilot + integration testing | Sprint 11-12 |

### 6.2 Phase 1B (Months 5-8, ships month 7-8)

| Module | Notes |
|--------|-------|
| M-06 Expert Rules Engine | Built-in rules: MRSA inference, D-test, ESBL screen/confirm, cascade, intrinsic resistance |
| M-09 WHONET Export | Per `whonet-export-design-review-v1.md` |
| M-10 Hub Subscription | Unified admin: breakpoints + WHONET codes + organism/antibiotic updates |
| Additional analyzer profiles | BD Phoenix, Sensititre, BACTEC, MALDI-TOF |
| FHIR push for micro reports | Reuse `FRS_FHIR_Outbound_Push` infrastructure |
| AST Run QC integration | Run-QC organism results gating release |

### 6.3 Phase 2 and beyond

- Antibiogram generation (cumulative susceptibility reports per organism over time window)
- Scheduled WHONET export (auto-monthly)
- Outbreak detection (unusual resistance pattern alerts)
- Mycobacteriology module (M-14)
- Fungal mold module (M-15)
- Parasitology module (M-16)
- Reference lab referral workflow
- Stewardship feedback loops to prescribers
- Multi-method AST comparison view
- Mobile bottle barcode scanning
- Image attachments (plate photos, Gram stain photos)
- User-specific personal macros
- Custom report builder for micro

---

## 7. Out of scope (Phase 1, explicit)

The module deliberately does NOT include:

- **Mycobacteriology / TB workflow** — fundamentally different timeline (weeks not days) and methods (MGIT, GeneXpert MTB/RIF, line probe assays). Future M-14.
- **Fungal molds** — different incubation, morphology-based ID. Yeasts piggyback on Case shape; molds don't. Future M-15.
- **Parasitology** — morphology-based, not culture-based. Different result shape entirely. Future M-16.
- **Antibiogram generation** — cumulative susceptibility reports. Phase 3 candidate.
- **GLASS direct submission** — single-tenancy makes OE unable to aggregate across labs. Aggregation is a central activity outside OE.
- **Real-time outbreak detection** — pattern-based alerts across recent isolates. Phase 4+.
- **Image attachments** — plate photos, Gram stain photos. UI surface design deferred. Phase 3+.
- **Mobile bottle barcode scanning** — requires mobile companion app. Phase 3+.
- **Multi-site config sharing** — Hub Subscription is read-only updates from a central repository, not multi-write.
- **AI-assisted organism ID** — suggest organism from colony morphology. Phase 4+.
- **AI-assisted rule creation** — suggest expert rules from data. Phase 4+.
- **User-specific personal macros** — sites use site-wide macros in Phase 1; per-user is an amplifier.
- **Custom report builder for micro** — Phase 1 ships fixed Jasper template.
- **Stewardship feedback loops to prescribers** — feed AST patterns back to clinicians. Phase 4+.
- **Multi-method AST comparison view** — side-by-side disk diffusion vs. VITEK on same isolate. Phase 4+.
- **Trend / temporal resistance reports beyond WHONET** — Phase 3+.
- **Direct DHIS2 / national surveillance integrations beyond WHONET file export** — WHONET is the Phase 1B mechanism.
- **HL7 v2 message-based external integration** — FHIR is the integration target.
- **Custom analyzer protocols beyond the specced set** — Phase 1A: BacT/Alert + VITEK 2; Phase 1B: BD Phoenix, Sensititre, BACTEC, MALDI-TOF; others later.
- **Reference lab referral workflow** — sending an isolate to a higher-tier lab when local can't ID. Phase 3+.

---

## 8. Cross-cutting constraints (NFRs)

See M-NFR for the dedicated spec. Cross-cuts that every M-* spec must honor:

- **Single-tenancy.** Per `project_no_multitenancy`, no multi-site or aggregator features in any spec.
- **Sidenav submenus, not in-page tabs.** Per `feedback_openelis_sidenav_submenus`.
- **Carbon for React.** All UI uses `@carbon/react` components and design tokens. Hand-rolled primitives are not acceptable.
- **Reuse existing OE data elements where possible.** Per `feedback_reuse_existing_data_elements`. New entities are introduced only where the existing model genuinely doesn't fit.
- **i18n keys follow `module.surface.element` pattern.** Per crosswalk Q10.
- **Offline degrades gracefully.** Per NFR-01 in M-NFR.
- **Audit immutable.** Per NFR-03.
- **WCAG 2.1 AA.** Per NFR-04.
- **Critical findings plug into the polymorphic critical-notification mechanism.** Per M-11.
- **Versioning rules.** Per crosswalk Q4: reference data versioned; results snapshot version at write; reidentification triggers selective re-evaluation, not auto.

---

## 9. v1.1 → v2 (M-*) diff map

Tracking what survives, dies, renames, or splits from the v1.1 trio (AMR Configuration FRS v1.1, Microbiology Case Workbench FRS v1.1, WHONET Integration FRS v1.1).

| v1.1 source | Section | Destination in M-* | Change |
|-------------|---------|---------------------|--------|
| AMR Config v1.1 | §2 Organism Master | M-01 §2 | **Survives.** Mostly verbatim with WHONET code clarifications and intrinsic-resistance pattern. |
| AMR Config v1.1 | §3 Antibiotic Master | M-01 §3 | **Survives.** Verbatim. |
| AMR Config v1.1 | §4 Breakpoint Tables | M-02 entirely | **Splits.** Promoted to own spec with versioning rules. |
| AMR Config v1.1 | §5 AST Panels | M-01 §4 | **Survives.** Adds versioning per panel. |
| AMR Config v1.1 | §6 Expert Rules | M-06 entirely | **Splits.** Phase 1B; own engine spec. |
| AMR Config v1.1 | §7 Reporting Rules | M-06 §Cascade and §Selective | **Merges into M-06.** |
| AMR Config v1.1 | §8 Culture Protocols | M-01 §5 | **Survives.** Light renaming. |
| AMR Config v1.1 | §9 Hub Subscription | M-10 entirely | **Splits.** Unified admin in own spec. Phase 1B. |
| AMR Config v1.1 | §10 Macro Library | M-08 entirely | **Splits.** Cross-cutting feature; promoted to own spec. |
| AMR Config v1.1 | §11 Test Catalog Integration | M-01 cross-ref + Test Catalog v2.5 | **Survives.** Reference rather than restated. |
| AMR Config v1.1 | §12 Permissions | M-00 §4 + per-module RBAC | **Splits.** Master matrix in M-00; per-module specifics in each spec. |
| Workbench v1.1 | §1 Overview | M-00 §1 + narrative | **Replaced.** New narrative + M-00 supersede the old overview. |
| Workbench v1.1 | §2 Dashboard | M-07 §4 Dashboard | **Survives.** Phase 1B (slippable from 1A). |
| Workbench v1.1 | §3 Pending Cultures Worklist | M-07 §2 | **Survives** with refinements (stage detail like "Day 2 of 5", row highlighting rules). |
| Workbench v1.1 | §4 AST Worklist | M-07 §3 | **Survives** with refinements (flag-count column, status filters). |
| Workbench v1.1 | §5 Order Entry hook | M-03 entirely | **Splits.** Owned by OE team, not Micro. Tightens scope. |
| Workbench v1.1 | §6 Macros | M-08 | **Merged into M-08.** |
| Workbench v1.1 | §7 Case Detail layout | M-04 §3 | **Survives** with sidenav fixes (per `feedback_openelis_sidenav_submenus`). |
| Workbench v1.1 | §8 Timeline | M-04 §4 | **Survives.** Adds new event types per state machine. |
| Workbench v1.1 | §9 Isolates | M-04 §5 + reidentification versioning | **Survives** with versioning addition. |
| Workbench v1.1 | §10 AST Results | M-05 entirely | **Splits.** Multi-reading-on-result data model per crosswalk Q2. |
| Workbench v1.1 | §11 Expert Review | M-06 | **Phase 1B.** |
| Workbench v1.1 | §12 Final Report | M-04 §7 | **Survives.** Adjusts preliminary-release gate (Gram-stain-sufficient per narrative critique). |
| Workbench v1.1 | §13 Footer Action Bar | M-04 §8 | **Survives.** |
| Workbench v1.1 | §14 Permissions | M-00 §4 + M-04 §RBAC | **Splits.** |
| WHONET v1.1 | §1 Overview | M-09 §1 | **Survives.** |
| WHONET v1.1 | §2 Code Management | M-09 §2 | **Survives** with admin expansions (patient type, department, breakpoint standard codes, phenotype codes added). |
| WHONET v1.1 | §3 Export Generation | M-09 §3 | **Survives** with major expansions per `whonet-export-design-review-v1.md` (dedup parameters, validation pass, phenotype columns, lab profile file). |
| WHONET v1.1 | §4 Export Format | M-09 §4 | **Survives** with full column enumeration. |
| WHONET v1.1 | §5 Preview | M-09 §5 | **Survives.** |
| WHONET v1.1 | §6 Scheduled Export | M-09 §6 | **Survives.** Phase 2 in 1B sub-phase. |
| WHONET v1.1 | §7 Permissions | M-00 §4 + M-09 §9 | **Splits.** |

**What dies:**

- "Direct GLASS submission" references — removed per single-tenancy.
- "Multi-site config sharing" references — removed per single-tenancy.
- "Future Enhancement #11: GLASS direct API" — removed.
- The single-monolithic-FRS structure of v1.1 — replaced by 13 composable specs.

**New concepts not in v1.1:**

- Polymorphic critical-notification table (M-11).
- Cross-cutting Test → Reagent linkage (M-12).
- Analyzer event channel (M-04 §Analyzer Events; supporting M-05).
- Phenotype flag columns in WHONET export (M-09 §3.5).
- Reidentification versioning (M-04 §5).
- Workflow unhappy paths as explicit state transitions (M-04 §State Machine).
- Versioning rules for reference data and rule sets (M-00 §8, M-02, M-06).
- Quality threshold validation in WHONET export (M-09 §5).

---

## 10. Acceptance Criteria — M-00 itself

M-00 is a doc spec; its acceptance criteria are about clarity rather than UI/data:

- **AC-01**: Glossary covers every term used in any other M-* spec
- **AC-02**: Data model overview names every new entity introduced by the bundle and indicates which spec owns each
- **AC-03**: Phase plan lists every module in Phase 1A and Phase 1B with sprint anchors
- **AC-04**: Out-of-scope statement is exhaustive enough that no Phase 1 stakeholder can be surprised by a missing feature
- **AC-05**: RBAC matrix covers every action across the bundle
- **AC-06**: v1.1 → v2 diff map covers every section of all three v1.1 FRS documents
- **AC-07**: Cross-cutting constraints reference NFR-* in M-NFR
- **AC-08**: All references to other M-* specs use stable identifiers (M-NN §Section)

---

## 11. i18n keys (M-00 surface)

M-00 has no UI of its own, but contributes baseline strings for the module-level navigation and shared error / status messages:

| Key | English value | Used in |
|-----|---------------|---------|
| `micro.module.title` | Microbiology | Sidenav top-level |
| `micro.module.subtitle` | Bacterial culture, identification, and susceptibility testing | Module landing card |
| `micro.nav.pendingCultures` | Pending Cultures | Sidenav |
| `micro.nav.astWorklist` | AST Worklist | Sidenav |
| `micro.nav.dashboard` | Dashboard | Sidenav |
| `micro.nav.caseSearch` | Case Search | Sidenav |
| `micro.case.label` | Microbiology Case | Page header pattern |
| `micro.isolate.label` | Isolate | Generic isolate label |
| `micro.ast.run.label` | AST Run | Generic AST run label |
| `micro.error.permission` | You do not have permission for this action | Cross-cutting error |
| `micro.error.staleState` | This Case has been updated by another user; please refresh | Cross-cutting error |
| `micro.error.qcLotLocked` | The selected reagent lot is locked by QC | Cross-cutting error |
| `micro.success.saved` | Saved successfully | Cross-cutting success |
| `micro.confirm.terminal` | This action moves the Case to a terminal state and cannot be undone. Continue? | Cross-cutting confirmation |

---

## 12. References

- **Pre-FRS planning:** `amr-pre-frs-planning-v1.md`
- **Critique:** `amr-design-critique-v1.md`
- **Narrative:** `amr-micro-narrative-v1-for-devs.md`
- **Crosswalk:** `amr-crosswalk-working.md`
- **WHONET export design review:** `whonet-export-design-review-v1.md`
- **OpenELIS Test Catalog v2.5:** `test-catalog-requirements-v2.5.md` (referenced for AMR sub-section)
- **OpenELIS Style Guide:** `openelis-style-guide-v1-foundations.md` and `openelis-style-guide-v2-patterns-inventory.md`
- **QA Pillar narrative (sibling format):** `qa-qc-narrative-v3-for-devs.md`
