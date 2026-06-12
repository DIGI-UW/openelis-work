# M-00 Microbiology Module — Parent Specification

**Version:** 2.0 (consolidated — folds review edits inline; no separate addendum)
**Date:** 2026-06-05
**Module:** Microbiology (top-level)
**Status:** Draft — anchors the M-01 through M-12 bundle.
**Companion docs:** `amr-design-critique-v1.md`, `amr-micro-narrative-v1-for-devs.md`, `amr-crosswalk-working.md`, `whonet-export-design-review-v1.md`, `amr-pre-frs-planning-v1.md`

> This FRS is self-contained. It folds the cross-cutting principles established in the AMR design review — **no per-case ownership (shared state-driven queue)**, **reuse of existing OE elements** (culture protocol→Method; reflex/test-rules engine drives the cascade; NCE + sample-rejection for specimen-lost; Case Timeline reuses History/Note; concurrency reuses optimistic locking), **inline interactions not modals (Principle 3)**, and the **test-designation reconciliation** (Culture-workflow attribute) as an open cross-spec item — **inline** below (see new §8.1–§8.3). There is no separate edits/addendum document. M-00's glossary, RBAC matrix, and phase plan are unchanged in structure.

This is the spine spec. Every other M-* spec in the bundle references back to this doc for the glossary, the data model overview, the RBAC matrix, the phase plan, the out-of-scope statement, and the cross-cutting constraints. Read this first, then go to the spec that matches the work you're doing.

---

## 1. Overview

### 1.1 Purpose

The OpenELIS Global Microbiology Module is a new top-level area of the application that supports bacterial culture, isolate identification, antimicrobial susceptibility testing (AST), expert review, structured reporting, and surveillance export (WHONET). It models a workflow that does not fit the existing OpenELIS "Sample → Analysis → Result" pattern: micro is multi-day, multi-isolate, narrative-heavy, and produces variable numbers of results per Sample.

The module replaces the v1.1 AMR FRS trio (AMR Configuration, Microbiology Case Workbench, WHONET Integration) which was correctly scoped but structurally monolithic. The new bundle decomposes into smaller, composable specs (M-01 through M-14 plus M-NFR), each addressing one well-bounded concern. The bundle now also includes **M-13 Antibiogram** (cumulative susceptibility reporting) and **M-14 Mycobacteriology / TB**, both promoted into scope as planned modules (see §6 phase plan and §7).

Although the Case workbench is a new surface, the module is built to **reuse existing OpenELIS infrastructure wherever it fits** rather than inventing parallel mechanisms — see §8.2 for the consolidated reuse principles established in design review.

### 1.2 Scope

**In scope for Phase 1A (4-month target, 5-month max):**

Bacterial micro workflow end-to-end: order entry hook, culture setup, incubation tracking, positive detection (analyzer-ingested or manual), Gram stain and isolate management, organism identification (manual, automated via VITEK 2, or analyzer-ingested), AST setup and result entry (manual or analyzer-ingested), interpretation against versioned CLSI / EUCAST breakpoint tables, supervisor review, preliminary and final report release, amendment workflow, structured critical-result acknowledgment with Alerts Dashboard integration, audit trail across all surfaces, Test → Reagent lot linkage (general OE foundation, parallel track), and macro-based text-shortcut typing for clinical narrative.

**In scope for Phase 1B (3-4 months after 1A):**

Expert Rules Engine with built-in rules (MRSA inference, D-test required, ESBL screen and confirm, cascade reporting, intrinsic resistance verification); WHONET Export Generator with code mapping admin (now **including TB**, M-09 §4.5); Hub Subscription for breakpoint and reference-data updates; additional analyzer profiles (BD Phoenix, Sensititre, BACTEC, MALDI-TOF); FHIR push for micro reports; AST Run QC integration.

**Planned scope (post-1B; now in scope as planned modules):**

- **M-13 Antibiogram** — cumulative susceptibility reporting (per-organism %S over a time window). Previously listed as out of scope; now a planned module.
- **M-14 Mycobacteriology / TB** — the TB workflow (AFB smear, culture, species ID, phenotypic DST against WHO critical concentrations, molecular resistance via GeneXpert MTB/RIF and line probe assays), feeding M-02's critical-concentration interpretation and M-09's WHONET TB export. Previously out of scope; now a planned module.

> **Final planned piece (still being specified).** Centralized **GLASS reporting** — WHONET aggregation across labs plus a **consolidated-FHIR** central-reporting path — is the last planned piece of the program and is being specified separately. It is not designed in this bundle; single-tenancy keeps cross-lab aggregation outside OpenELIS (see §7, glossary GLASS).

**Out of scope** — see Section 7.

### 1.3 Users

| Role | Primary actions |
|------|-----------------|
| Microbiology Technician | Culture setup, subculture, Gram stain, organism ID, manual AST entry, preliminary report release |
| Microbiology Supervisor | Review results, approve interpretations, release final reports, authorize amendments, manage cases |
| Lab Manager | Full access; configure AMR reference data, AST panels, culture protocols (as Methods), breakpoint catalog versions, macros |
| Medical Technologist | Interface with analyzers, verify automated results, troubleshoot integration issues |
| Surveillance Officer | Generate WHONET exports, validate dedup, manage code mappings (Phase 1B) |
| System Administrator | All permissions; user role assignments; analyzer profile management |

### 1.4 Module organization

The Micro Module appears in the OpenELIS sidenav as a new top-level item under the Patient Tests section. Within Micro, the sidenav submenu lists:

```
Microbiology
├── Worklist                   (M-07 — shared, state-driven queue; Cultures / AST grain toggle)
├── Case Search                (M-04 — search across all cases)
└── Antibiogram                (M-13 — cumulative susceptibility reports; planned module)
```

> **TB (M-14)** reuses the same Worklist + Case surfaces with a TB grain/lifecycle rather than a separate top-level area; its extended (weeks-long) timeline, AFB/culture/DST steps, and molecular-flag capture are detailed in the M-14 spec. **Antibiogram (M-13)** adds a reporting surface listed above.

> **How the system knows which workflow to use (the bacterial-vs-TB decision).** There is no clerk choice and no separate "TB module" the user navigates to. The ordered **test** carries a **`workflow_type`** on its Culture-workflow attribute — `BACTERIOLOGY` or `MYCOBACTERIOLOGY_TB` (`MYCOLOGY` reserved). The single M-03 trigger resolver (`resolveMicroCaseTrigger`, M-03 §2.1a) reads it and instantiates the matching **Case profile** (M-04 bacterial sections vs M-14 TB sections), **breakpoint family** (CLSI/EUCAST clinical MIC vs WHO-TB critical concentrations, M-02), **culture-protocol Method**, reflex variant, and **WHONET flavor** (M-09). One protocol per Case (A-MIX), so a specimen that needs both routine culture *and* TB is ordered as two tests → two Cases (one M-04, one M-14). This is the authoritative "which workflow" rule for the whole module.

> **Folded review decision (D0 / shared-queue, see §8.1).** The earlier three-surface split (Pending Cultures, AST Worklist, Microbiology Dashboard) collapses into a **single shared Worklist** with a culture/AST grain toggle; the former dashboard's content (resistance hits, recent activity) folds into that page. There is **no per-case owner**, so there is no "My cases" surface. A dedicated read-only manager dashboard may return later as an optional view for larger deployments, but it is not a core Phase-1A surface.

Admin areas live under the Admin top-level (per `feedback_admin_ia_vs_editor_ia`):

```
Admin
├── Microbiology Reference Data   (M-01)
│   ├── Organism Master
│   ├── Antibiotic Master
│   ├── AST Panels
│   └── Culture Protocols (as Methods — A-REUSE-1)
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
| **Case** | Container for a single Sample's entire micro workup, from arrival through final report. One Case per micro Sample. Has a stage (lifecycle position), a culture protocol (= the test's default **Method**, see A-REUSE-1), and a timeline of events. **No per-case owner** — accountability is per-action (§8.1). |
| **Isolate** | A distinct organism identified from a Sample. Zero, one, or many per Case. Has organism (FK to Organism Master), significance, AST history. |
| **AST Run** | A single susceptibility test event: one Isolate × one AST Panel × one Date × one Method × one Breakpoint Standard × one Tech. Has many AST Results (one per antibiotic tested). |
| **AST Result** | One antibiotic's susceptibility result within an AST Run. Carries MIC value, MIC unit, zone diameter, interpretation (S/I/R), override flag, and breakpoint version. Stored in the existing `result` table via the multi-reading mechanism (per crosswalk Q2). |
| **Breakpoint** | Threshold value (MIC or zone diameter) that defines S/I/R interpretation for one (antibiotic, organism, breakpoint-standard-version) combination. |
| **Breakpoint Standard** | A reference dataset (CLSI M100, EUCAST clinical breakpoints) consisting of many Breakpoints. Versioned (CLSI M100 2024, EUCAST v14.0). |
| **Method (culture protocol)** | The existing OE `method` entity ("how a test is performed"). A culture protocol is modeled as a **Method** with a small culture-params extension (incubation hours/temp/atmosphere, subculture-at hours), not a new `culture_protocol` master (A-REUSE-1). Tests link to it via `test_method`; the order-time default culture protocol = the test's default Method. |
| **Culture-workflow attribute** | A first-class per-test Test-Catalog attribute (distinct from the AMR/WHONET flag) that, when set, makes ordering the test create a Microbiology Case and appear in the Worklist. The authoritative Case-creation trigger (see the open cross-spec item, §8.3). |
| **Expert Rule** | A definition that fires on AST Run state changes and either modifies results (MRSA inference forces beta-lactams to R), flags conditions (ESBL screen positive), or controls reporting (cascade suppression). Emits orders through the existing reflex/test-rules action API (§8.2). Phase 1B. |
| **Reflex / Test-Rules engine** | The existing OE rules engine (`Rule {type:reflex, conditionTree, actions}` → `OrderAction`). It drives the micro **what-to-order-next cascade** — positive → Organism ID → AST → confirmation — and orders the AST panel (§8.2). It does **not** model the Case/Isolate/AST-Run structure; the Case Workbench owns the workup state. |
| **Cascade Reporting** | A reporting rule that only displays second-tier antibiotics when first-tier are all R. Common for urines. Phase 1B. |
| **WHONET** | Both a software product (Windows DB tool for AMR surveillance) and a file format (CSV/TXT export from labs to country reference labs). The module's surveillance export targets the file format. |
| **GLASS** | WHO Global Antimicrobial Resistance and Use Surveillance System. National-level program that consumes aggregated WHONET data (including TB). **Not addressed in this bundle** — OpenELIS is single-tenant; aggregation across labs happens centrally outside OE. The centralized GLASS reporting path (WHONET aggregation + a consolidated-FHIR path) is the **final planned piece of the program and is being specified separately** (§1.2). |
| **Hub** | Central repository (managed externally) that supplies updates to the Breakpoint Catalog, Organism Master, Antibiotic Master, and WHONET code tables. OE pulls; never pushes. |
| **Macro** | A typing shortcut: type `.code`, get expanded text. Cross-cutting OE feature with Micro as the first consumer. |
| **Critical Result** | A clinically actionable finding requiring immediate notification to the ordering provider. In Micro: positive blood culture Gram stain (sterile site), CSF positivity, CRE, MRSA from sterile site, VRE, AFB-positive sputum (per lab SOP). |
| **Preliminary Report** | A report released before the workup is complete (typically on positive Gram stain). Updated by amendment when more information is available. |
| **Final Report** | A signed report released after supervisor review. Immutable once released; updates require amendment. |
| **Amendment** | A new version of a released report. Original is preserved; delta is shown to clinical reader. |
| **Significance** | Clinical assessment of whether an isolate represents real infection. Values: SIGNIFICANT, NOT_SIGNIFICANT, PROBABLE_CONTAMINANT, COLONIZER, INDETERMINATE. |
| **First Isolate** | The earliest isolate of a given organism from a given patient within a dedup window (default 7 days). Surveillance concept — only first isolates count in resistance trending. |
| **Phenotype Flag** | A categorical resistance characteristic (MRSA, ESBL, CRE, VRE, MDR, XDR, PDR) derived from AST results by the Expert Rules engine. Carried in WHONET exports as separate columns. |
| **AFB** | Acid-fast bacilli. Microscopy/staining (Ziehl-Neelsen or auramine) result indicating mycobacteria in a specimen; the first-line TB screening test. (M-14) |
| **MGIT** | Mycobacteria Growth Indicator Tube — automated liquid-culture system (e.g., BACTEC MGIT 960) for TB culture and phenotypic drug-susceptibility testing. One of the TB DST methods carrying WHO critical concentrations (M-02 §3.5). |
| **GeneXpert MTB/RIF** | Cartridge-based automated molecular assay (Xpert) that detects *M. tuberculosis* complex DNA and rifampicin-resistance mutations (rpoB) directly from specimen. A **molecular** resistance result (genotypic flag), not a phenotypic breakpoint/critical-concentration call (M-02 §7.4, M-14). |
| **LPA (line probe assay)** | Molecular strip test detecting resistance-conferring mutations for isoniazid, rifampicin, fluoroquinolones, and aminoglycosides (e.g., GenoType MTBDR). A genotypic resistance result reported as a flag, distinct from phenotypic DST (M-14, exported in WHONET TB per M-09 §4.5). |
| **DST (drug-susceptibility testing)** | TB susceptibility testing. **Phenotypic DST** grows the isolate at a WHO **critical concentration** by method (MGIT / Löwenstein-Jensen / agar proportion) and reports R/S; **molecular DST** (Xpert/LPA) reports genotypic resistance. (M-14) |
| **Critical concentration** | The lowest drug concentration that inhibits growth of wild-type (susceptible) *M. tuberculosis*. TB phenotypic DST interprets **R if growth at the critical concentration, S if not** — a binary call with no Intermediate, defined per drug × method and versioned by WHO guidance year (M-02 §3.5, §7.4). |
| **MDR-TB / pre-XDR-TB / XDR-TB** | TB resistance categories. **MDR-TB** = resistant to at least isoniazid and rifampicin. **Pre-XDR-TB** = MDR-TB plus resistance to any fluoroquinolone. **XDR-TB** = pre-XDR-TB plus resistance to at least one additional Group A drug (e.g., bedaquiline or linezolid), per the WHO definition. Derived from DST results in M-14. |
| **Antibiogram (cumulative susceptibility)** | A periodic report summarizing the percentage of isolates of an organism that are susceptible to each antibiotic over a time window, used to guide empiric therapy. Built from first-isolate AST data (M-13). |

---

## 3. Data model overview

This is the canonical sketch. Each spec elaborates its corner.

> **Planned modules M-13 / M-14 (data-model note).** **M-13 Antibiogram** is a reporting module — it reads first-isolate AST data (`micro_ast_run` + `result` + first-isolate dedup, the same surveillance concept used by M-09) and introduces no new core workflow tables; any aggregate/cache tables it needs are owned by the M-13 spec. **M-14 Mycobacteriology / TB** reuses the `micro_case` / `micro_isolate` / `micro_ast_run` shapes with a TB lifecycle and adds TB-specific fields (AFB smear result, DST method ∈ {MGIT, LJ, AGAR_PROPORTION}, and **molecular resistance flags** from Xpert/LPA carried on the isolate). TB phenotypic DST interprets against WHO **critical concentrations** via M-02 (`publisher = WHO_TB`, `interpretation_model = CRITICAL_CONCENTRATION`; see M-02 §3.5, §7.4); the molecular flags are recorded by M-14, not via the breakpoint service. Both modules' tables are detailed in their own specs.

### 3.1 New tables introduced by the M-* bundle

```
sample (existing)
   │
   │ 1:1 post-save hook when the trigger resolver fires (Culture-workflow test
   │ on the order; manual program = MICROBIOLOGY is a derived fallback — see M-03 §2.1a, §8.3)
   ▼
micro_case
   ├── case_id (PK)
   ├── sample_item_id (FK to sample_item — the physical specimen; the Case key)
   ├── workflow_type (enum: BACTERIOLOGY, MYCOBACTERIOLOGY_TB; NULL = needs classification)
   │          UNIQUE (sample_item_id, workflow_type) — one Case per specimen per workflow;
   │          one specimen can hold a bacterial AND a TB Case sharing the SampleItem (M-04 §2A)
   ├── stage (enum: RECEIVED, INOCULATING, INCUBATING, POSITIVE_SIGNAL,
   │          GROWTH_DETECTED, ORGANISM_ID, AST_IN_PROGRESS, READY_REVIEW,
   │          PRELIM_REPORTED, FINAL_REPORTED, NO_GROWTH_FINAL,
   │          REJECTED_AT_ACCESSIONING, CANCELLED_PRE_INOCULATION,
   │          CANCELLED_POST_INOCULATION, CANCELLED_POST_POSITIVE,
   │          LOST_SPECIMEN, LOST_SPECIMEN_POSITIVE, AMENDED)
   ├── method_id (FK to method — the culture protocol, A-REUSE-1; replaces culture_protocol_id)
   ├── assigned_tech_user_id (FK to user — NULLABLE and unused by default; optional
   │          opt-in assignment behind a config flag only. No per-case ownership — §8.1)
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
   ├── source_inoculation_id (FK→self, nullable — null = primary media; set = subculture
   │          of the referenced bottle/plate. Only new field added by the interaction edits.)
   ├── media_type (FK to media catalog)
   ├── lot_id (FK to InventoryLot — M-12 via the Inventory module; writes InventoryUsage on use)
   ├── bottle_id or plate_id
   ├── inoculated_at, inoculated_by
   └── notes
   │
   │ feeds into
   ▼
micro_timeline_event   (reuses the existing OE History/Note infrastructure — §8.2)
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
   ├── ast_panel_id (FK to ast_panel — M-01; the panel is ordered via the reflex engine — §8.2)
   ├── breakpoint_standard_id (FK to breakpoint_standard — M-02)
   ├── breakpoint_version (denormalized for snapshot)
   ├── method (enum: VITEK_2, BD_PHOENIX, SENSITITRE, DISK_DIFFUSION, ETEST, BROTH_MICRODILUTION, MANUAL)
   ├── status (enum: PENDING_SETUP, IN_PROGRESS, READING, COMPLETE, QC_FAILED, RERUN_REQUIRED)
   ├── analyzer_card_id (nullable, instrument-side identifier)
   ├── reagent_lot_id (FK to InventoryLot — M-12 / Inventory module)
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

> **Data-model deltas folded in v2.0.** (1) `micro_case.culture_protocol_id` becomes `micro_case.method_id` (A-REUSE-1: culture protocol = the test's default Method; the standalone `culture_protocol` table is dropped from M-01 — see §3.2). (2) `micro_case.assigned_tech_user_id` is demoted to **nullable and unused by default** (no per-case ownership; §8.1). (3) `micro_case_inoculation.source_inoculation_id` (nullable self-FK) is added to distinguish subcultures from primary media — the only genuinely new field from the interaction-model edits.

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

method (existing OE table — REUSED as the culture-protocol home, A-REUSE-1)
   ├── method_id (PK)
   ├── name, code, description, reference_url, is_active     (existing)
   ├── + culture-params extension (new columns or a method_culture_params 1:1 sibling):
   │     incubation_hours, incubation_temp_celsius,
   │     atmosphere (enum: AEROBIC, ANAEROBIC, MICROAEROPHILIC, CAPNOPHILIC),
   │     subculture_at_hours, max_incubation_days
   └── audit columns
   (Linked to tests via existing test_method, with is_default per test;
    media via method_reagent; incubator via method_instrument; SOP via method_document.
    The standalone culture_protocol table proposed in v1.0 is DROPPED.)
```

> **A-REUSE-1.** The v1.0 `culture_protocol` master is replaced by the existing **`method`** entity plus a small culture-params extension. M-01/M-03/M-04 reference Method (+ culture-params), not `culture_protocol`. The order-time default culture protocol = the test's default Method (`test_method.is_default`).

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
| `micro.case.create` | Create new Cases (triggered by Sample save via the trigger resolver; rarely manual) |
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
| `micro.worklist.view` | View the Worklist |
| `micro.expert.review` | Make Expert Review decisions (Phase 1B) |
| `micro.expert.config` | Configure Expert Rule definitions (Phase 1B) |
| `micro.ref.view` | View AMR Reference Data |
| `micro.ref.manage` | Add/edit/delete organism / antibiotic / panel / protocol (Method) records |
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

| Role | Cases | Isolates | AST | Reports | Worklist | Reference Data | Expert | Macros | Surveillance |
|------|-------|----------|-----|---------|-----------|----------------|--------|--------|--------------|
| Micro Tech | V, E | V, C, E | V, S, E | V, P | V | V | V, R | V | — |
| Micro Supervisor | V, E | V, C, E, R | V, S, E, O | V, P, F, A | V | V | V, R, D | V | V |
| Lab Manager | V, E | V, C, E, R | V, S, E, O | V, P, F, A | V | V, M | V, R, D, C | V, M | V, X, M |
| Medical Tech | V, E | V, C, E | V, S, E | V, P | V | V | V | V | — |
| Surveillance Officer | V | V | V | V | — | V | — | V | V, X, M |
| System Admin | V, E | V, C, E, R | V, S, E, O | V, P, F, A | V | V, M | V, R, D, C | V, M | V, X, M |

Legend: V=View, C=Create, E=Edit, R=Reidentify, S=Setup, O=Override, P=Preliminary release, F=Final release, A=Amend, M=Manage, X=Export, D=Decide on flag.

> **No per-case ownership (§8.1).** The matrix grants action-level capability. There is no "owner" role on a Case; whoever is on shift with the capability works the top of the shared queue. Accountability is captured per-action (`inoculated_by`, `event_by`, AST entered/overridden by, `*_released_by`) plus the audit trail.

---

## 5. State machine — Case stages

Detailed in M-04. Summary diagram for orientation:

```
[Sample created; trigger resolver fires (Culture-workflow test, or manual program=MICROBIOLOGY fallback)]
                │
                ▼
            RECEIVED
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
   INOCULATING       REJECTED_AT_
        │            ACCESSIONING (terminal — reuses existing sample-rejection — §8.2)
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
        │  (reflex: positive → order Organism ID — §8.2)      │
        ▼                                                     │
   ORGANISM_ID                                                │
        │  (reflex: identified → order AST panel — §8.2)      │ late slow
        ▼                                                     │ grower revives
   AST_IN_PROGRESS                                            │ to POSITIVE_SIGNAL
        │  (reflex: phenotype → order confirmation — §8.2)    │
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
   ── on lost specimen pre-positive ────▶ LOST_SPECIMEN (terminal — reuses NCE — §8.2)
   ── on lost specimen post-positive ───▶ LOST_SPECIMEN_POSITIVE (terminal — reuses NCE — §8.2)
```

Every transition is auditable. M-04 §State Transitions enumerates triggers, allowed roles, side effects per transition. The positive→ID→AST→confirmation cascade is driven by the existing reflex/test-rules engine (§8.2); the Case Workbench owns the workup *state* the cascade advances through.

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
| M-07 Worklist | Sprints 7-10 |
| Analyzer integration | Sprints 9-11 |
| Pilot + integration testing | Sprint 11-12 |

### 6.2 Phase 1B (Months 5-8, ships month 7-8)

| Module | Notes |
|--------|-------|
| M-06 Expert Rules Engine | Built-in rules: MRSA inference, D-test, ESBL screen/confirm, cascade, intrinsic resistance. Emits orders through the existing reflex/test-rules action API (§8.2). |
| M-09 WHONET Export | Per `whonet-export-design-review-v1.md` |
| M-10 Hub Subscription | Unified admin: breakpoints + WHONET codes + organism/antibiotic updates |
| Additional analyzer profiles | BD Phoenix, Sensititre, BACTEC, MALDI-TOF |
| FHIR push for micro reports | Reuse `FRS_FHIR_Outbound_Push` infrastructure |
| AST Run QC integration | Run-QC organism results gating release |

### 6.3 Planned modules (post-1B; promoted into scope)

These were previously listed as out of scope and are now **planned modules** of the program:

| Module | Notes |
|--------|-------|
| M-13 Antibiogram | Cumulative susceptibility reports per organism over a time window, built from first-isolate AST data. Reporting module; reuses M-09's first-isolate dedup concept. |
| M-14 Mycobacteriology / TB | TB workflow: AFB smear, culture, species ID, phenotypic DST against WHO critical concentrations (MGIT / LJ / agar proportion) via M-02, and molecular resistance via GeneXpert MTB/RIF and line probe assays. Feeds the WHONET TB export (M-09 §4.5). Reuses the Case/Isolate/AST-Run shapes with a TB lifecycle. |
| M-15 GLASS Surveillance via Consolidated FHIR | The **last** module. Each lab pushes its finalized AMR + TB results as FHIR (DiagnosticReport + per-drug Observations, WHO AMR profiles) to a **consolidated FHIR server**, which aggregates across labs and generates the GLASS submission. Reuses OE's existing FHIR stack (`FhirTransformService`, `FhirPersistanceService`, `FhirConfig`, the EQA submission pattern) + M-09 dedup/validation. Complementary to the M-09 WHONET file path. Multi-tenant aggregation stays outside OE (single-tenancy preserved). |

> **Final planned piece — now specified.** Centralized **GLASS reporting** is designed in **M-15** (`m-15-glass-fhir-surveillance.md`): the WHONET file path (M-09) plus a **consolidated-FHIR** central path. OE only pushes its own results; cross-lab aggregation + GLASS generation stay **outside** OpenELIS, so single-tenancy is preserved (§7, glossary GLASS).

### 6.4 Phase 2 and beyond

- Scheduled WHONET export (auto-monthly)
- Outbreak detection (unusual resistance pattern alerts)
- Fungal mold module (M-16)
- Parasitology module (M-17)
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

> **Now in scope (moved out of this list).** **Mycobacteriology / TB workflow (M-14)** and **Antibiogram generation (M-13)** are no longer out of scope — they are **planned modules** (§1.2, §6.3). TB's longer timeline and molecular/critical-concentration methods are handled in M-14; cumulative susceptibility reporting is M-13.

- **Fungal molds** — different incubation, morphology-based ID. Yeasts piggyback on Case shape; molds don't. Future M-16.
- **Parasitology** — morphology-based, not culture-based. Different result shape entirely. Future M-17.
- **Multiple culture protocols on one Sample** — each micro Case carries a single culture protocol (the test's default Method). A second protocol on the same specimen is a second Case (A-MIX; see M-03 §2A). Promoting protocol to a per-Case-line or per-isolate concept is deferred.
  > **DECISION (was an open item; now resolved).** A micro Case is keyed to **`SampleItem` × `workflow_type`**, not `1:1` to the Sample. So one physical specimen needing both a bacterial and a TB workup is **two Cases that share one `SampleItem`** — no double accessioning, and the shared specimen is intrinsic (same `sample_item_id`) rather than a bolted-on link. This reuses OpenELIS's existing Sample → SampleItem → Analysis grain. Detail in M-04 §2A; shared-specimen UI in M-04 §4.1a + M-07.
- **Cross-lab GLASS *aggregation*** — single-tenancy makes OE unable to aggregate across labs, so the central aggregation + GLASS dataset generation stay **outside** OE (on the NCC / consolidated FHIR server). The **OE side** — transforming and pushing each lab's own results — **is now in scope as M-15** (the final module); only the multi-lab aggregation itself is out of scope (M-15 §4.7).
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
- **Durable per-case ownership / assignment as the default** — the queue is shared and state-driven (§8.1). Optional opt-in assignment is config-gated and off by default; it is not a Phase-1A core feature.

---

## 8. Cross-cutting constraints and principles

See M-NFR for the dedicated non-functional spec. The constraints below every M-* spec must honor, plus the cross-cutting **principles** established in design review (§8.1–§8.3), folded in here.

**Baseline cross-cutting constraints:**

- **Single-tenancy.** Per `project_no_multitenancy`, no multi-site or aggregator features in any spec.
- **Sidenav submenus, not in-page tabs.** Per `feedback_openelis_sidenav_submenus`.
- **Carbon for React.** All UI uses `@carbon/react` components and design tokens. Hand-rolled primitives are not acceptable.
- **Reuse existing OE data elements where possible.** Per `feedback_reuse_existing_data_elements`. New entities are introduced only where the existing model genuinely doesn't fit. (Elaborated as concrete reuse mappings in §8.2.)
- **i18n keys follow `module.surface.element` pattern.** Per crosswalk Q10.
- **Offline degrades gracefully.** Per NFR-01 in M-NFR.
- **Audit immutable.** Per NFR-03.
- **WCAG 2.1 AA.** Per NFR-04.
- **Critical findings plug into the polymorphic critical-notification mechanism.** Per M-11.
- **Versioning rules.** Per crosswalk Q4: reference data versioned; results snapshot version at write; reidentification triggers selective re-evaluation, not auto.

### 8.1 No per-case ownership — a shared, state-driven queue

A Case is *open* for days to weeks while work happens in short, event-driven bursts (positive signal → growth → AST ready → finalize), each landing whenever it lands. In a small, shift-based lab the tech who inoculated is rarely the one on the bench when the case is next actionable. **Per-case ownership is therefore the wrong default model** — whoever is on shift when something is ready runs it.

**Principle.** Drop "owner" as the organizing concept. The worklist is a **single shared board organized by state/urgency, not by person** (see M-07).

- **Worklist organization:** needs-action filters (Positive · Growth to work up · AST ready · Ready to finalize · Overdue read) with a default urgency sort (STAT first, then longest-waiting). No "My cases" lens, no owner column.
- **Accountability is per-action, not per-case.** Who did each step is captured (`inoculated_by`, `event_by`, AST entered/overridden by, `*_released_by`) plus the audit trail — that is what matters for traceability and the report.
- **Transient "working on this" lock (optional, recommended):** a short-lived, auto-released indicator so two techs don't double-enter the same positive simultaneously. This is concurrency safety, **not** assignment.
- **Optional opt-in assignment:** `micro_case.assigned_tech_user_id` stays in the schema but **nullable and unused by default**, behind a config flag, for occasional larger/structured deployments. Not the default lens.
- **Case header** shows **"Last activity by"** + per-step attribution, not a single owner badge.
- **No "Unassigned" problem:** with no owner, nothing falls through — every open case is on the shared board, surfaced by what it needs next.

*Data-model impact:* none beyond demoting `assigned_tech_user_id` to optional/off-by-default (§3.1). Affects M-07 (filters + sort), M-04 (header shows last-activity, not owner), and this spec.

### 8.2 Reuse existing OE elements (workflow + structure)

Concrete reuse mappings established in review. New masters and bespoke mechanisms are replaced by existing OE infrastructure wherever it fits:

- **Culture protocol → Method (A-REUSE-1).** A culture protocol is the existing `method` entity plus a small culture-params extension (incubation hours/temp/atmosphere, subculture-at hours, max incubation days), not a new `culture_protocol` master. Tests link via `test_method` (default = `is_default`); media via `method_reagent`; incubator via `method_instrument`; SOP via `method_document`. The order-time default culture protocol = the test's default Method (see M-03, M-01, §3.2).
- **Reflex / test-rules engine drives the cascade (A-REUSE-2).** The existing rules engine (`Rule {type:reflex, conditionTree, actions}` → `OrderAction`) drives the micro **what-to-order-next** cascade and **orders the AST panel**:
  - positive culture signal → order Organism ID;
  - organism identified → order the AST panel (per-organism default);
  - expert-rule phenotype (ESBL/MRSA) → order confirmation test (pairs with M-06);
  - positive at < N h → trigger subculture (via analyzer params).

  Analyzer parameters (time-to-positivity, morphology flags) are captured as Test Catalog **analyzer parameters** so they can drive reflex conditions — the same mechanism the molecular/analyzer work already uses. **The engine does NOT replace** the Case / Isolate / AST-Run structure or the multi-day workbench: **reflexes drive the *what-to-order-next* cascade; the Case Workbench owns the *workup state*.** M-06's expert rules emit confirmation orders **through the reflex/test-rules action API**, not a parallel mechanism.
- **NCE + sample-rejection reused for specimen-lost (and rejection).** The LOST_SPECIMEN / LOST_SPECIMEN_POSITIVE and REJECTED_AT_ACCESSIONING transitions reuse the existing Non-Conforming-Event (NCE) and sample-rejection infrastructure rather than a micro-only mechanism.
- **Case Timeline reuses the existing History/Note infrastructure.** The timeline is the existing OE History/Note surface; structured section saves auto-write the corresponding timeline events (the section is the system of record, the timeline is the derived activity log). The only manual timeline action is a free-text note.
- **Concurrency reuses optimistic locking.** Stale-state detection and the offline conflict-resolution dialog (NFR-01) use the existing optimistic-locking mechanism, surfaced via `micro.error.staleState`. No new locking scheme.
- **Other reuse (consolidated):** reagent lots **+ consumption/traceability** → existing **Inventory module** (`InventoryItem` / `InventoryLot` / `InventoryUsage`, the last already keyed to `analysis_id`/`test_result_id`) via M-12 — supersedes the old `reagent`/`qc_lot`; the test↔reagent definition (`test_reagent_link`) is owned by Test Catalog v2.5 (OGC-759). Critical notifications → reuse the existing `notifications` alerts dashboard + `TestNotificationService`; M-11 adds only the documented call-back/acknowledgment record + polymorphic target. Organism/AST/confirmation results → standard Test Catalog tests, not new result masters. **Specimen splitting** (TB decontamination → processed aliquot; send-out aliquots) → the existing **sample-management aliquoting workflow** (`CreateAliquot` + `sample_item_aliquot_relationship`, parent→child `SampleItem` + volume tracking), which also provides the parent/child lineage behind the shared-specimen two-Cases model (M-04 §2A, M-14 §4.1). The micro-only `source_inoculation_id` is narrowed to *media-from-media* subculture provenance, distinct from specimen aliquoting.

### 8.3 Inline interactions, not modals (Principle 3)

The primary workflow uses **inline interactions, not modals**. Workflow actions are performed in their own structured, inline sections on the Case Detail surface (Inoculation, Isolates, AST Results, Reports), expanding in place rather than opening blocking dialogs. Modals are reserved for confirmations and short focused entry where an inline surface would be disruptive; they are not the default for routine bench work. Inline expand/collapse manages focus and announces via `aria-live` (NFR-04). This keeps the multi-day workbench scannable and keyboard-navigable, and avoids a stack of dialogs during a workup.

### 8.4 Open cross-spec item — test-designation reconciliation (A-TC)

**Status: open cross-spec item, owners notified.** How a test "becomes" part of the Case workflow needs a single first-class signal. The adopted resolution (recorded fully in M-03 §2.1a / §2.7) is:

- Add a first-class **Culture-workflow designation** per test, carrying a **`workflow_type`** (`BACTERIOLOGY` / `MYCOBACTERIOLOGY_TB`; `MYCOLOGY` reserved) — distinct from the AMR/WHONET surveillance flag, which it may imply. Setting it makes ordering the test **create the matching Microbiology Case profile and appear in the Worklist**, via the **single trigger resolver** — no reliance on the clerk manually picking Program = Microbiology (which survives only as a derived/visible fallback, defaulting to `BACTERIOLOGY`).
- The culture protocol carried by such a test = its default **Method** (A-REUSE-1); add **`valid_organisms`** to the Test Catalog (referenced by M-01/M-03). The **AMR flag** and the **Culture-workflow designation** are separate concerns — a test may be one, both, or neither.
- **Concrete home + escape hatch.** The attribute is specified for the Test Catalog v2.5 Basic Info editor in **`test-catalog-micro-workflow-attribute.md`** (one nullable `test.culture_workflow_type` enum). When a case has **no valid workflow_type** (untyped/mis-typed test), it is created `UNASSIGNED` and the **tech reclassifies it from the Case Workbench** (M-04 *Change workflow*), audited and guarded once results exist.

This requires coordinated changes across **M-00 + M-01 + M-03 + Test Catalog (OGC-746/OGC-748)** and is filed as a Test-Catalog story. Until the Test Catalog lands the attribute, M-03's resolver uses the manual-Program fallback so existing deployments keep working.

---

## 9. v1.1 → v2 (M-*) diff map

Tracking what survives, dies, renames, or splits from the v1.1 trio (AMR Configuration FRS v1.1, Microbiology Case Workbench FRS v1.1, WHONET Integration FRS v1.1).

| v1.1 source | Section | Destination in M-* | Change |
|-------------|---------|---------------------|--------|
| AMR Config v1.1 | §2 Organism Master | M-01 §2 | **Survives.** Mostly verbatim with WHONET code clarifications and intrinsic-resistance pattern. |
| AMR Config v1.1 | §3 Antibiotic Master | M-01 §3 | **Survives.** Verbatim. |
| AMR Config v1.1 | §4 Breakpoint Tables | M-02 entirely | **Splits.** Promoted to own spec with versioning rules. |
| AMR Config v1.1 | §5 AST Panels | M-01 §4 | **Survives.** Adds versioning per panel. |
| AMR Config v1.1 | §6 Expert Rules | M-06 entirely | **Splits.** Phase 1B; own engine spec; emits orders via reflex/test-rules API (§8.2). |
| AMR Config v1.1 | §7 Reporting Rules | M-06 §Cascade and §Selective | **Merges into M-06.** |
| AMR Config v1.1 | §8 Culture Protocols | M-01 §5 → **Method (A-REUSE-1)** | **Survives but reused.** Culture protocol becomes the existing Method + culture-params; standalone `culture_protocol` master dropped. |
| AMR Config v1.1 | §9 Hub Subscription | M-10 entirely | **Splits.** Unified admin in own spec. Phase 1B. |
| AMR Config v1.1 | §10 Macro Library | M-08 entirely | **Splits.** Cross-cutting feature; promoted to own spec. |
| AMR Config v1.1 | §11 Test Catalog Integration | M-01 cross-ref + Test Catalog v2.5 | **Survives.** Reference rather than restated; now also carries the open Culture-workflow attribute (§8.4). |
| AMR Config v1.1 | §12 Permissions | M-00 §4 + per-module RBAC | **Splits.** Master matrix in M-00; per-module specifics in each spec. |
| Workbench v1.1 | §1 Overview | M-00 §1 + narrative | **Replaced.** New narrative + M-00 supersede the old overview. |
| Workbench v1.1 | §2 Dashboard | M-07 (folded into Worklist) | **Folded.** No standalone dashboard; resistance hits + recent activity live on the Worklist (§1.4, M-07). |
| Workbench v1.1 | §3 Pending Cultures Worklist | M-07 (Cultures grain) | **Survives** as a grain of the single shared Worklist; shared state-driven queue (§8.1). |
| Workbench v1.1 | §4 AST Worklist | M-07 (AST grain) | **Survives** as a grain of the single shared Worklist. |
| Workbench v1.1 | §5 Order Entry hook | M-03 entirely | **Splits.** Owned by OE team; trigger now the Culture-workflow attribute via a single resolver (§8.4). |
| Workbench v1.1 | §6 Macros | M-08 | **Merged into M-08.** |
| Workbench v1.1 | §7 Case Detail layout | M-04 §3 | **Survives** with sidenav fixes and inline-interaction principle (§8.3). |
| Workbench v1.1 | §8 Timeline | M-04 §4 | **Survives.** Reuses History/Note infrastructure; auto vs. manual events (§8.2). |
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
- The standalone `culture_protocol` master — replaced by the existing Method (§8.2, A-REUSE-1).
- Durable per-case ownership as the default — replaced by the shared state-driven queue (§8.1).

**New concepts not in v1.1:**

- Polymorphic critical-notification table (M-11).
- Cross-cutting Test → Reagent linkage (M-12).
- Analyzer event channel (M-04 §Analyzer Events; supporting M-05).
- Phenotype flag columns in WHONET export (M-09 §3.5).
- Reidentification versioning (M-04 §5).
- Workflow unhappy paths as explicit state transitions (M-04 §State Machine).
- Versioning rules for reference data and rule sets (M-00 §8, M-02, M-06).
- Quality threshold validation in WHONET export (M-09 §5).
- Cross-cutting review principles: shared state-driven queue (§8.1), explicit OE reuse mappings (§8.2), inline-interaction principle (§8.3), and the Culture-workflow test-designation reconciliation (§8.4).

---

## 10. Acceptance Criteria — M-00 itself

M-00 is a doc spec; its acceptance criteria are about clarity rather than UI/data:

- **AC-01**: Glossary covers every term used in any other M-* spec (including Method-as-culture-protocol, Culture-workflow attribute, reflex/test-rules engine).
- **AC-02**: Data model overview names every new entity introduced by the bundle and indicates which spec owns each (and reflects culture protocol → Method, the demoted `assigned_tech_user_id`, and `source_inoculation_id`).
- **AC-03**: Phase plan lists every module in Phase 1A and Phase 1B with sprint anchors.
- **AC-04**: Out-of-scope statement is exhaustive enough that no Phase 1 stakeholder can be surprised by a missing feature (including multi-protocol-per-sample and default per-case ownership).
- **AC-05**: RBAC matrix covers every action across the bundle; no owner role.
- **AC-06**: v1.1 → v2 diff map covers every section of all three v1.1 FRS documents.
- **AC-07**: Cross-cutting constraints reference NFR-* in M-NFR, and the §8.1–§8.4 principles are stated.
- **AC-08**: All references to other M-* specs use stable identifiers (M-NN §Section).
- **AC-09**: The shared-queue, OE-reuse, inline-interaction, and test-designation principles (§8.1–§8.4) are recorded with their owning/affected modules.

---

## 11. i18n keys (M-00 surface)

M-00 has no UI of its own, but contributes baseline strings for the module-level navigation and shared error / status messages:

| Key | English value | Used in |
|-----|---------------|---------|
| `micro.module.title` | Microbiology | Sidenav top-level |
| `micro.module.subtitle` | Bacterial culture, identification, and susceptibility testing | Module landing card |
| `micro.nav.worklist` | Worklist | Sidenav |
| `micro.nav.caseSearch` | Case Search | Sidenav |
| `micro.case.label` | Microbiology Case | Page header pattern |
| `micro.isolate.label` | Isolate | Generic isolate label |
| `micro.ast.run.label` | AST Run | Generic AST run label |
| `micro.case.lastActivityBy` | Last activity by | Case header (no owner badge — §8.1) |
| `micro.error.permission` | You do not have permission for this action | Cross-cutting error |
| `micro.error.staleState` | This Case has been updated by another user; please refresh | Cross-cutting error (optimistic locking — §8.2) |
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
- **AMR/Micro FRS review edits:** A-OWN, A-REUSE-1/2/3, Principle 3 (inline), A-TC, A-MIX — folded inline (§8.1–§8.4, §3, §7)
- **OpenELIS Test Catalog v2.5 / OGC-748:** `test-catalog-requirements-v2.5.md` (Culture-workflow attribute, AMR flag, default Method)
- **OE Methods admin:** `methods.md` (Method reuse — A-REUSE-1)
- **OE Test-Rules:** `test-rules-mvp-frs.md` (reflex engine — A-REUSE-2)
- **OpenELIS Style Guide:** `openelis-style-guide-v1-foundations.md` and `openelis-style-guide-v2-patterns-inventory.md`
- **QA Pillar narrative (sibling format):** `qa-qc-narrative-v3-for-devs.md`
