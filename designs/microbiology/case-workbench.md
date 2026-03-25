# OpenELIS Global - Microbiology Case Workbench
## Functional Requirements Specification

**Version:** 1.1  
**Date:** December 2025  
**Module:** Microbiology â†’ Case Workbench  
**Routes:** 
- Dashboard: `/MicrobiologyDashboard`
- Pending Cultures: `/MicrobiologyPendingCultures`
- AST Worklist: `/MicrobiologyASTWorklist`
- Case View: `/MicrobiologyCase/:caseId`

---

## Changelog (v1.1)

| Change | Description |
|--------|-------------|
| **New Routes** | Added Pending Cultures and AST Worklist screens |
| **Order Entry** | Microbiology fields moved to Program Selection step; Priority removed (set elsewhere) |
| **Macro Support** | All free text fields support macro expansion (`.code` â†’ expanded text) |
| **New Modals** | Timeline Event, Isolate, AST Edit, Expert Review, Final Report modals with macro fields |

---

## 1. Overview

### 1.1 Problem Statement

Microbiology and AMR (Antimicrobial Resistance) testing in OpenELIS currently lacks:
- A case-based workflow for tracking multi-day culture processes
- Comprehensive breakpoint management for S/I/R interpretation
- Expert rules for inferred resistance and exceptional phenotypes
- Configurable AST panels by organism and specimen type
- Cascade and selective reporting rules
- WHONET code integration for surveillance
- Timeline tracking for incubation and culture positivity
- Worklist views for pending cultures and AST tests

### 1.2 Solution Summary

Implement a case-based Microbiology Workbench with:
- **Dashboard** showing cases by status with summary metrics
- **Pending Cultures Worklist** tracking incubation and growth stages
- **AST Worklist** managing susceptibility testing queue
- **Case Detail View** with anchored sidebar navigation through workflow stages
- **Culture Timeline** tracking inoculation, incubation, and growth events
- **Isolate Management** for multiple organisms per specimen
- **AST Entry & Interpretation** with automated breakpoint lookup
- **Expert Rules Engine** applying inferred resistance and verification flags
- **Reporting Rules** controlling cascade and selective antibiotic display
- **Preliminary & Final Reports** with amendment capability
- **WHONET Export** integration for surveillance
- **Macro System** for efficient text entry in clinical workflows

### 1.3 Users

| Role | Primary Actions |
|------|-----------------|
| Microbiology Technician | Culture setup, subculture, organism ID, manual AST entry |
| Microbiology Supervisor | Review results, approve interpretations, release reports |
| Lab Manager | Full access, configure panels/rules, generate antibiograms |
| Medical Technologist | Interface with analyzers, verify automated results |

### 1.4 Key Concepts

| Term | Definition |
|------|------------|
| **Case** | Container for entire workup of a specimen - from culture through final report |
| **Isolate** | A distinct organism identified from the specimen (multiple isolates possible per case) |
| **AST** | Antimicrobial Susceptibility Testing - determines S/I/R for each antibiotic |
| **Breakpoint** | Threshold values (MIC or zone diameter) that define S/I/R interpretation |
| **Expert Rule** | Automated logic that modifies or validates AST results |
| **Cascade Reporting** | Only report 2nd/3rd line drugs when 1st line are resistant |
| **WHONET** | WHO software for AMR surveillance - requires standardized codes |
| **Macro** | Text shortcut that expands to full text (e.g., `.gpc` â†’ "Gram positive cocci in clusters") |

---

## 2. Dashboard View

### 2.1 Route
`/MicrobiologyDashboard`

### 2.2 Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Home / Microbiology                                                          â”‚
â”‚ Microbiology Dashboard                                                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚  â”‚ Cases In Progressâ”‚ â”‚ Awaiting Review  â”‚ â”‚ Positive Culturesâ”‚ â”‚ Complete â”‚â”‚
â”‚  â”‚                  â”‚ â”‚                  â”‚ â”‚   (Today)        â”‚ â”‚ (Week)   â”‚â”‚
â”‚  â”‚       12         â”‚ â”‚        4         â”‚ â”‚        3         â”‚ â”‚    28    â”‚â”‚
â”‚  â”‚                  â”‚ â”‚                  â”‚ â”‚                  â”‚ â”‚          â”‚â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ ðŸ” Search by Lab No or Patient Name    Filters: â˜ My Cases  [Status â–¼]â”‚  â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚  â”‚ Request   â”‚ Stage          â”‚ Patient      â”‚ Specimen    â”‚ Organism(s) â”‚  â”‚
â”‚  â”‚ Date      â”‚                â”‚              â”‚ Type        â”‚ Found       â”‚  â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚  â”‚ 2024-12-20â”‚ AST_IN_PROGRESSâ”‚ DOE, John    â”‚ Blood       â”‚ E. coli     â”‚  â”‚
â”‚  â”‚ 2024-12-19â”‚ ORGANISM_ID    â”‚ SMITH, Jane  â”‚ Urine       â”‚ Pending ID  â”‚  â”‚
â”‚  â”‚ 2024-12-19â”‚ INCUBATING     â”‚ JONES, Bob   â”‚ Sputum      â”‚ --          â”‚  â”‚
â”‚  â”‚ 2024-12-18â”‚ READY_REVIEW   â”‚ CHEN, Wei    â”‚ Wound       â”‚ S. aureus,  â”‚  â”‚
â”‚  â”‚           â”‚                â”‚              â”‚             â”‚ P. aeruginosaâ”‚  â”‚
â”‚  â”‚ 2024-12-18â”‚ FINAL_REPORTED â”‚ GARCIA, Ana  â”‚ CSF         â”‚ No growth   â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                                              â”‚
â”‚  Items per page: [25 â–¼]    1-25 of 45 items     [<] 1 [2] [>]               â”‚
â”‚                                                                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 2.3 Summary Cards

| Card | Metric | Color | Click Action |
|------|--------|-------|--------------|
| Cases In Progress | Count of cases not yet finalized | Blue | Filter to in-progress |
| Awaiting Review | Cases ready for supervisor review | Amber | Filter to awaiting review |
| Positive Cultures (Today) | Cases with growth detected today | Red | Filter to today's positives |
| Complete (Week) | Finalized cases this week | Green | Filter to week's completed |

### 2.4 Case List Columns

| Column | Description | Sortable |
|--------|-------------|----------|
| Request Date | When specimen was received | Yes |
| Stage | Current workflow stage (see 2.5) | Yes |
| Patient | Last Name, First Name | Yes |
| Specimen Type | Blood, Urine, Sputum, etc. | Yes |
| Organism(s) Found | Identified organisms or "Pending ID" / "No growth" / "--" | No |
| Technician | Assigned technician | Yes |
| Lab Number | Case identifier | Yes |

### 2.5 Case Stages

| Stage | Code | Description |
|-------|------|-------------|
| Received | `RECEIVED` | Specimen logged, not yet cultured |
| Inoculating | `INOCULATING` | Culture plates being set up |
| Incubating | `INCUBATING` | Cultures in incubator, awaiting growth |
| Growth Detected | `GROWTH_DETECTED` | Positive culture, needs workup |
| Organism ID | `ORGANISM_ID` | Identification in progress |
| AST In Progress | `AST_IN_PROGRESS` | Susceptibility testing underway |
| Ready for Review | `READY_REVIEW` | Results complete, awaiting supervisor |
| Preliminary Reported | `PRELIM_REPORTED` | Preliminary report released |
| Final Reported | `FINAL_REPORTED` | Final report released |
| No Growth | `NO_GROWTH` | Culture negative after incubation period |
| Cancelled | `CANCELLED` | Case cancelled |

### 2.6 Filters

| Filter | Type | Options |
|--------|------|---------|
| Status | Dropdown | All, In Progress (default), Awaiting Review, Completed |
| My Cases | Checkbox | Show only cases assigned to current user |
| Specimen Type | Multi-select | Blood, Urine, Sputum, Wound, CSF, Stool, Other |
| Date Range | Date picker | From / To request date |

### 2.7 Row Click Behavior

Click any row to navigate to Case Detail View: `/MicrobiologyCase/:caseId`

---

## 3. Pending Cultures Worklist (NEW)

### 3.1 Route
`/MicrobiologyPendingCultures`

### 3.2 Purpose
Provides a focused worklist for technicians to track culture incubation, monitor for positive signals, and manage subculture/reading tasks.

### 3.3 Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Microbiology / Pending Cultures                                              â”‚
â”‚ Pending Cultures                                                             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”          â”‚
â”‚  â”‚ Total    â”‚ â”‚Incubatingâ”‚ â”‚ Positive â”‚ â”‚ Growth   â”‚ â”‚ Ready to â”‚          â”‚
â”‚  â”‚ Pending  â”‚ â”‚          â”‚ â”‚ (Action) â”‚ â”‚ Detected â”‚ â”‚ Finalize â”‚          â”‚
â”‚  â”‚    7     â”‚ â”‚    3     â”‚ â”‚    1     â”‚ â”‚    2     â”‚ â”‚    1     â”‚          â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜          â”‚
â”‚                                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ ðŸ” Search   [Stage â–¼] [Specimen â–¼] [Tech â–¼] â˜ My Cases  [Refresh]   â”‚  â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚  â”‚ Lab No    â”‚ Patient    â”‚ Specimen  â”‚ Protocol â”‚ Stage      â”‚ Bottles  â”‚  â”‚
â”‚  â”‚           â”‚            â”‚           â”‚          â”‚            â”‚ /Media   â”‚  â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚  â”‚ BC24-0892 â”‚ MARTINEZ   â”‚ Blood     â”‚ Blood Stdâ”‚ INCUBATING â”‚ FA24012  â”‚  â”‚
â”‚  â”‚ MC-001245 â”‚ Carlos     â”‚ R. Antecubâ”‚          â”‚ Day 2 of 5 â”‚ FN24012  â”‚  â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚  â”‚ BC24-0891 â”‚ JOHNSON    â”‚ Blood     â”‚ Blood Stdâ”‚ âš  POSITIVE â”‚ FA24011+ â”‚  â”‚
â”‚  â”‚ MC-001244 â”‚ Mary       â”‚ L. Antecubâ”‚          â”‚ Aerobic +  â”‚ FN24011  â”‚  â”‚
â”‚  â”‚           â”‚            â”‚           â”‚          â”‚ Subculture â”‚          â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 3.4 Summary Cards

| Card | Metric | Color | Description |
|------|--------|-------|-------------|
| Total Pending | All pending cultures | Blue | Total cultures not finalized |
| Incubating | Blood cultures in progress | Teal | Awaiting positive signal or final read |
| Positive | Action required | Red | Positive signal, needs subculture/gram |
| Growth Detected | Colonies observed | Orange | Growth on plates, needs isolate workup |
| Ready to Finalize | No growth complete | Green | Incubation complete, no growth |

### 3.5 Table Columns

| Column | Description |
|--------|-------------|
| Lab Number | Case lab number + case ID |
| Patient | Name + MRN |
| Specimen | Type + source/site |
| Protocol | Culture protocol applied |
| Stage | Current culture stage with detail (e.g., "Day 2 of 5") |
| Bottles/Media | Bottle IDs or plate IDs |
| Last Read | Timestamp of last reading |
| Due Action | Required action (highlighted for positives) |
| Priority | Routine/Urgent/STAT badge |
| Tech | Assigned technician |

### 3.6 Culture Stages

| Stage | Badge | Description | Due Action |
|-------|-------|-------------|------------|
| INOCULATED | Default | Just plated | Read @ 24h |
| INCUBATING | Info | In incubator | Monitor |
| POSITIVE | Error | Positive signal | Subculture & Gram |
| GROWTH | Warning | Visible colonies | Isolate & ID |
| SUBCULTURE | Teal | Purity plate done | Read purity |
| NO_GROWTH | Success | Final negative | Finalize |

### 3.7 Row Highlighting

- **POSITIVE stage rows**: Red background highlight
- **Other rows**: Hover highlight on gray

### 3.8 Filters

| Filter | Options |
|--------|---------|
| Stage | All, Incubating, Positive, Inoculated, Growth, Subculture, No Growth |
| Specimen | All, Blood, Urine, Sputum, Wound, etc. |
| Technician | All technicians or specific |
| My Cases Only | Checkbox to filter to current user |

---

## 4. AST Worklist (NEW)

### 4.1 Route
`/MicrobiologyASTWorklist`

### 4.2 Purpose
Manages all antimicrobial susceptibility testing - from pending setup through completion and review.

### 4.3 Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Microbiology / AST Worklist                                                  â”‚
â”‚ AST Worklist                                                                 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”          â”‚
â”‚  â”‚ Total    â”‚ â”‚ Pending  â”‚ â”‚ In       â”‚ â”‚ Ready forâ”‚ â”‚ Expert   â”‚          â”‚
â”‚  â”‚ AST Testsâ”‚ â”‚ Setup    â”‚ â”‚ Progress â”‚ â”‚ Review   â”‚ â”‚ Flags    â”‚          â”‚
â”‚  â”‚    7     â”‚ â”‚    1     â”‚ â”‚    3     â”‚ â”‚    3     â”‚ â”‚    4     â”‚          â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜          â”‚
â”‚                                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ ðŸ” Search   [Status â–¼] [Panel â–¼] â˜ Ready Only  [Import] [Refresh]   â”‚  â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚  â”‚ Lab No    â”‚ Patient   â”‚ Organism        â”‚ Panel  â”‚ Status  â”‚ Flags   â”‚  â”‚
â”‚  â”‚ Isolate # â”‚           â”‚                 â”‚        â”‚         â”‚         â”‚  â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚  â”‚ BC24-0885 â”‚ DOE, John â”‚ S. aureus (sau) â”‚ GP-AST â”‚ Completeâ”‚ 2 flags â”‚  â”‚
â”‚  â”‚ Isolate 1 â”‚           â”‚                 â”‚ VITEK 2â”‚         â”‚ D-Test  â”‚  â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚  â”‚ UC24-0455 â”‚ SMITH,Janeâ”‚ E. coli (eco)   â”‚ GN-UR  â”‚ In Prog â”‚ --      â”‚  â”‚
â”‚  â”‚ Isolate 1 â”‚           â”‚                 â”‚ VITEK 2â”‚         â”‚         â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                                              â”‚
â”‚  Quick Actions: [Import from Analyzer] [Print List] [Export WHONET] [QC]   â”‚
â”‚                                                                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 4.4 Summary Cards

| Card | Metric | Color | Description |
|------|--------|-------|-------------|
| Total AST Tests | All AST tests | Blue | Complete count |
| Pending Setup | Awaiting start | Gray | Isolates ready for AST |
| In Progress | Testing active | Teal | Cards/plates running |
| Ready for Review | Complete | Green | Results ready (with flag count) |
| Expert Flags | Require attention | Orange | Total flags across all tests |

### 4.5 Table Columns

| Column | Description |
|--------|-------------|
| Lab Number | Case lab number + Isolate # |
| Patient | Patient name |
| Organism | Name (italic) + WHONET code |
| Panel | Panel code badge + Method |
| Method | VITEK 2, Disk Diffusion, Etest, etc. |
| Status | Pending Setup / In Progress / Reading / Complete |
| Flags | Count + flag types (e.g., D-Test, MRSA, Review) |
| Started | Timestamp when AST started |
| Priority | Routine/Urgent/STAT badge |
| Tech | Assigned technician |
| Actions | Context actions: Setup, Enter, Review, View |

### 4.6 AST Status

| Status | Badge | Description |
|--------|-------|-------------|
| PENDING_SETUP | Default | Ready to start AST |
| IN_PROGRESS | Info | Card/plate running |
| READING | Teal | Manual reading in progress |
| COMPLETE | Success | Results available |
| QC_FAILED | Error | QC out of range |

### 4.7 Row Highlighting

- **Complete with flags**: Yellow background highlight
- **QC Failed**: Red background highlight

### 4.8 Filters

| Filter | Options |
|--------|---------|
| Status | All, Pending Setup, In Progress, Reading, Complete |
| Panel | All, GP-AST, GN-STD, GN-UR, PSEUDO, ENTERO, STREP |
| Ready for Review Only | Checkbox |

### 4.9 Quick Actions

| Action | Description |
|--------|-------------|
| Import from Analyzer | Opens analyzer import dialog |
| Print Pending List | Generates printable worklist |
| Export to WHONET | Export completed tests |
| QC Dashboard | Navigate to QC monitoring |

---

## 5. Order Entry - Microbiology Program

### 5.1 Wizard Integration

When "Microbiology" is selected in the Order Entry wizard's Program Selection step (Step 1), additional Microbiology-specific fields appear within that same step.

### 5.2 Program Selection Step Fields (Microbiology)

**Standard Program Dropdown:**
- Routine Testing
- **Microbiology** â† triggers additional fields
- HIV Program
- TB Program
- EQA/Proficiency Testing

**When Microbiology is selected, display:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Culture Protocol | Dropdown | Yes | Blood Culture Std, Urine Routine, Respiratory Std, Wound Culture, CSF Urgent, Stool Enteric |
| Patient Origin | Dropdown | No | Inpatient, Outpatient, ICU, Emergency, Long-term Care |
| Number of Sets | Number input | No | e.g., 2 for blood culture |
| Clinical History | MacroTextarea | No | Relevant clinical information (supports `.` macros) |
| Antibiotic Exposure | Checkbox | No | "Patient has recent antibiotic exposure (within 2 weeks)" |
| Critical Value Notify | Checkbox | No | "Notify clinician for positive blood culture" |

**Note:** Priority is set at the Order level (Step 3: Add Order), not in the Microbiology-specific fields.

### 5.3 Info Banner

When Microbiology is selected, display info banner:
```
ðŸ¦  This will create a Microbiology Case for culture and susceptibility testing
```

### 5.4 Sample Step (Step 2) - Static

Standard sample fields apply to all programs:
- Sample Type (required)
- Collection Date (required)
- Collection Time
- Sample Source/Site

### 5.5 Order Step (Step 3) - Static

Standard order fields apply to all programs:
- Lab Number (auto-generated)
- Ordering Provider (required)
- Site/Ward
- Requester Phone

---

## 6. Macro System (NEW)

### 6.1 Overview

All free text fields in the Microbiology workflow support macro expansion. Users type a period-prefixed code (e.g., `.gpc`) and the system expands it to full text.

### 6.2 Macro Behavior

**Trigger Methods:**
1. **Auto-expand**: Type `.code` followed by space/tab â†’ auto-expands
2. **Dropdown selection**: Type `.` â†’ shows searchable dropdown of available macros

**Keyboard Navigation:**
- Arrow Up/Down: Navigate dropdown
- Enter/Tab: Select and insert macro
- Escape: Close dropdown

### 6.3 Macro Categories

| Category | Context | Example Codes |
|----------|---------|---------------|
| `clinical` | Clinical history | `.feb`, `.uti`, `.sep`, `.abx`, `.dm`, `.immuno` |
| `gramStain` | Gram stain observations | `.gpc`, `.gnr`, `.wbc`, `.epi`, `.mixed`, `.nobac` |
| `colony` | Colony morphology | `.lact`, `.bhemo`, `.muc`, `.pig`, `.small` |
| `culture` | Culture results | `.nml`, `.ngr`, `.mix`, `.cnt`, `.iso`, `.col5` |
| `organisms` | Organism names | `.ecoli`, `.saur`, `.mrsa`, `.pseudo`, `.kleb` |
| `ast` | AST comments | `.dtneg`, `.dtpos`, `.esblc`, `.mrsac`, `.qcok` |
| `reporting` | Final report | `.final`, `.prelim`, `.contact`, `.ic`, `.corr` |
| `timeline` | Timeline events | `.sub24`, `.gram`, `.vitek`, `.maldi`, `.pos` |

### 6.4 Example Macros

| Code | Expansion |
|------|-----------|
| `.gpc` | Gram positive cocci in clusters. |
| `.gnr` | Gram negative rods. |
| `.nml` | No growth after 5 days of incubation. |
| `.mix` | Mixed flora isolated, suggestive of contamination. Clinical correlation recommended. |
| `.dtneg` | D-test performed, negative. Clindamycin reported as susceptible. |
| `.esblc` | ESBL confirmed by phenotypic testing. All penicillins, cephalosporins, and aztreonam reported as resistant regardless of MIC. |
| `.mrsa` | Methicillin-resistant Staphylococcus aureus (MRSA) |
| `.contact` | Critical value. Physician notified. |

### 6.5 Macro-Enabled Fields

| Location | Field | Category |
|----------|-------|----------|
| Order Entry | Clinical History | `clinical` |
| Timeline Modal | Notes | `timeline` |
| Isolate Modal | Gram Stain Observations | `gramStain` |
| Isolate Modal | Colony Morphology | `colony` |
| Isolate Modal | Preliminary ID Notes | `culture` |
| Isolate Modal | Clinical Notes | `culture` |
| AST Modal | Override Justification | `ast` |
| AST Modal | General AST Comments | `ast` |
| Expert Review Modal | Justification/Notes | `ast` |
| Final Report Modal | Culture Results Summary | `culture` |
| Final Report Modal | Interpretation/Clinical Comments | `reporting` |
| Final Report Modal | Technologist Notes | `reporting` |

### 6.6 UI Indicator

Below macro-enabled fields, display hint:
```
[.] Type period for macros
```

---

## 7. Case Detail View - Layout

### 7.1 Route
`/MicrobiologyCase/:caseId`

### 7.2 Page Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Header (existing OpenELIS header)                                            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Home / Microbiology / Case MC-2024-001234                                    â”‚
â”‚ Microbiology Case - [Lab Number]                                             â”‚
â”‚ Patient: [Last, First] | DOB: [Date] | [M/F] | Status: [STAGE]              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚              â”‚                                                               â”‚
â”‚   Sidebar    â”‚              Main Content Area                                â”‚
â”‚   (260px)    â”‚              (Scrollable)                                     â”‚
â”‚              â”‚                                                               â”‚
â”‚ CASE PROGRESSâ”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚              â”‚  â”‚ Section Content                                          â”‚ â”‚
â”‚ âœ“ Case Info  â”‚  â”‚ (Collapsible sections)                                   â”‚ â”‚
â”‚ âœ“ Culture    â”‚  â”‚                                                          â”‚ â”‚
â”‚ âœ“ Timeline   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚   6 events   â”‚                                                               â”‚
â”‚ âœ“ Isolates   â”‚                                                               â”‚
â”‚   2 found    â”‚                                                               â”‚
â”‚ â— AST Resultsâ”‚                                                               â”‚
â”‚   1/2 done   â”‚                                                               â”‚
â”‚ â— Expert     â”‚                                                               â”‚
â”‚   Review     â”‚                                                               â”‚
â”‚   2 flags    â”‚                                                               â”‚
â”‚ â—‹ Final      â”‚                                                               â”‚
â”‚   Review     â”‚                                                               â”‚
â”‚ â—‹ Reports    â”‚                                                               â”‚
â”‚              â”‚                                                               â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ âš  Unsaved changes    [Discard] [Save Progress] [Release Prelim] [Release Final]â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 7.3 Sidebar Progress Indicators

| Icon | State |
|------|-------|
| âœ“ (green) | Complete |
| â— (orange) | Partial / In Progress |
| â—‹ (gray) | Not Started |

---

## 8. Timeline Section

### 8.1 Add Timeline Event Modal

Triggered by "Add Event" button.

| Field | Type | Options/Notes |
|-------|------|---------------|
| Event Type | Dropdown (required) | Subculture, Plate Reading, Gram Stain, Positive Detection, No Growth, Organism ID, AST Setup, General Note |
| Date | Date picker (required) | |
| Time | Time picker (required) | |
| Related Isolate | Dropdown | N/A - General, Isolate 1 - [organism], etc. |
| Media | Dropdown | BAP, MacConkey, Chocolate, CNA, Thioglycollate (shown for Subculture/Reading) |
| Notes | MacroTextarea | Supports `timeline` category macros |

---

## 9. Isolates Section

### 9.1 Add/Edit Isolate Modal

| Section | Field | Type | Notes |
|---------|-------|------|-------|
| **Preliminary ID** | | | |
| | Gram Stain Observations | MacroTextarea | `gramStain` category |
| | Colony Morphology | MacroTextarea | `colony` category |
| | Preliminary ID Notes | MacroInput | `culture` category |
| **Final ID** | | | |
| | ID Method | Dropdown (required) | Biochemical, VITEK 2, MALDI-TOF MS, Molecular/PCR, Manual ID |
| | ID Confidence % | Number | e.g., 99.5 |
| | Organism | Searchable input (required) | Search organism master |
| | WHONET Code | Text | Auto-populated from organism |
| **Significance** | | | |
| | Significance | Dropdown (required) | Clinically Significant, Not Significant, Probable Contaminant, Colonizer |
| | Clinical Notes | MacroTextarea | `culture` category |
| | Default AST Panel | Dropdown | Auto-selected based on organism |

---

## 10. AST Results Section

### 10.1 Edit AST Results Modal

**Header Fields:**
| Field | Type | Options |
|-------|------|---------|
| AST Panel | Dropdown | GP-AST, GN-STD, GN-UR, etc. |
| Method | Dropdown | VITEK 2, Disk Diffusion, Etest, Broth Microdilution |
| Breakpoint Standard | Dropdown | CLSI 2024 M100, CLSI 2023 M100, EUCAST v14.0 |

**Quick Actions:**
- Import from Analyzer
- Apply Defaults
- Clear All

**Results Table:**
| Column | Description |
|--------|-------------|
| Antibiotic | Drug name |
| MIC (Î¼g/mL) | MIC value input |
| Zone (mm) | Zone diameter input |
| Interp | S/I/R dropdown (color-coded) |
| Override | Checkbox to enable manual override |
| WHONET | WHONET antibiotic code |
| Report | Always/Cascade/Suppress dropdown |

**Override Section (when Override checked):**
```
âš  Manual Override Selected
[Override Justification - MacroTextarea, required, `ast` category]
```

**Footer:**
| Field | Type |
|-------|------|
| General AST Comments | MacroTextarea (`ast` category) |

---

## 11. Expert Review Section

### 11.1 Expert Review Decision Modal

Triggered by "Review & Decide" button on expert flags.

**Flag Display:**
```
âš  D-Test Required
ERY-R + CLI-S pattern detected for S. aureus. D-test recommended to detect inducible clindamycin resistance.
```

**Decision Options (Radio):**
| Option | Description |
|--------|-------------|
| Request D-Test | Adds D-test to pending tests and timeline |
| D-Test Negative - Report CLI as S | D-test performed and was negative |
| D-Test Positive - Report CLI as R | D-test performed and was positive |
| Report CLI as R (Conservative) | Report as resistant without D-test |

**Footer:**
| Field | Type |
|-------|------|
| Justification / Notes | MacroTextarea (required, `ast` category) |
| Reviewed By | Display (current user) |

---

## 12. Final Report Section

### 12.1 Final Report Modal

Triggered by "Release Final" button.

**Checklist:**
- [ ] All isolates identified and verified
- [ ] AST complete for all significant isolates
- [ ] All expert flags reviewed and addressed
- [ ] No pending additional tests
- [ ] Clinical correlation reviewed

**Report Comments:**
| Field | Type | Category |
|-------|------|----------|
| Culture Results Summary | MacroTextarea | `culture` |
| Interpretation / Clinical Comments | MacroTextarea | `reporting` |
| Technologist Notes | MacroTextarea (internal) | `reporting` |
| Reviewed By | Dropdown | Supervisor list |
| Review Date/Time | DateTime picker | |

**Info Banner:**
```
â„¹ Releasing final report will notify ordering provider and lock this case from further edits.
```

---

## 13. Footer Action Bar

### 13.1 Layout

Sticky footer with contextual actions based on case state.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âš  Unsaved changes    [Discard]  [Save Progress] [Release Prelim] [Release Final]â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 13.2 Button States

| Button | Visible When | Enabled When |
|--------|--------------|--------------|
| Discard Changes | Unsaved changes exist | Always |
| Save Progress | Any section modified | Valid data entered |
| Release Preliminary | Isolates identified | At least one AST started |
| Release Final | Preliminary released OR Final ready | All checklist items complete |
| Amend Report | Final already released | Has permission |

---

## 14. Permissions

### 14.1 Permission Matrix

| Action | Technician | Supervisor | Manager |
|--------|------------|------------|---------|
| View dashboard | âœ“ | âœ“ | âœ“ |
| View pending cultures | âœ“ | âœ“ | âœ“ |
| View AST worklist | âœ“ | âœ“ | âœ“ |
| Create case | âœ“ | âœ“ | âœ“ |
| Edit culture setup | âœ“ | âœ“ | âœ“ |
| Add isolates | âœ“ | âœ“ | âœ“ |
| Enter AST results | âœ“ | âœ“ | âœ“ |
| Address expert rules | âœ“ | âœ“ | âœ“ |
| Release preliminary | âœ“ | âœ“ | âœ“ |
| Release final | âœ— | âœ“ | âœ“ |
| Amend report | âœ— | âœ“ | âœ“ |
| Configure panels/rules | âœ— | âœ— | âœ“ |
| Manage macros | âœ— | âœ— | âœ“ |

### 14.2 Permission Codes

| Code | Description |
|------|-------------|
| `micro.case.view` | View microbiology cases |
| `micro.case.create` | Create new cases |
| `micro.case.edit` | Edit case details |
| `micro.worklist.view` | View worklists (pending cultures, AST) |
| `micro.result.enter` | Enter culture/AST results |
| `micro.report.preliminary` | Release preliminary reports |
| `micro.report.final` | Release final reports |
| `micro.report.amend` | Amend finalized reports |
| `micro.config.admin` | Configure panels, rules, breakpoints |
| `micro.macro.admin` | Manage macro library |

---

## 15. Acceptance Criteria

### 15.1 Dashboard
- [ ] **AC-01**: Dashboard displays summary cards with correct counts
- [ ] **AC-02**: Case list shows all cases with correct stage badges
- [ ] **AC-03**: Search filters cases by lab number or patient name
- [ ] **AC-04**: Filter dropdowns filter case list appropriately
- [ ] **AC-05**: "My Cases" checkbox filters to current user's assigned cases
- [ ] **AC-06**: Click on row navigates to Case Detail View

### 15.2 Pending Cultures Worklist (NEW)
- [ ] **AC-07**: Summary cards display correct counts by stage
- [ ] **AC-08**: Positive cultures highlighted with red background
- [ ] **AC-09**: Stage column shows detail (e.g., "Day 2 of 5")
- [ ] **AC-10**: Filters work correctly (Stage, Specimen, Tech, My Cases)
- [ ] **AC-11**: Click on row navigates to Case Detail View

### 15.3 AST Worklist (NEW)
- [ ] **AC-12**: Summary cards display correct counts by status
- [ ] **AC-13**: Rows with flags highlighted with yellow background
- [ ] **AC-14**: Flag count and types displayed correctly
- [ ] **AC-15**: Context actions (Setup, Enter, Review) work appropriately
- [ ] **AC-16**: Quick actions navigate to correct screens

### 15.4 Order Entry - Microbiology
- [ ] **AC-17**: Microbiology fields appear in Program Selection step when selected
- [ ] **AC-18**: Priority is NOT shown in Microbiology fields (set in Order step)
- [ ] **AC-19**: Clinical History field supports macro expansion
- [ ] **AC-20**: Info banner displays when Microbiology selected

### 15.5 Macro System (NEW)
- [ ] **AC-21**: Typing `.` in macro-enabled field shows dropdown
- [ ] **AC-22**: Dropdown filters as user types after period
- [ ] **AC-23**: Arrow keys navigate dropdown, Enter/Tab selects
- [ ] **AC-24**: Selected macro expands correctly in field
- [ ] **AC-25**: Macro hint displays below enabled fields
- [ ] **AC-26**: Category-specific macros appear in appropriate fields

### 15.6 Modals with Macros (NEW)
- [ ] **AC-27**: Add Timeline Event modal opens with correct fields
- [ ] **AC-28**: Add/Edit Isolate modal supports all macro-enabled fields
- [ ] **AC-29**: Edit AST Results modal shows override justification when needed
- [ ] **AC-30**: Expert Review modal displays decision options correctly
- [ ] **AC-31**: Final Report modal shows checklist and macro-enabled fields

### 15.7 Case Detail - Navigation
- [ ] **AC-32**: Sidebar navigation shows all sections with progress indicators
- [ ] **AC-33**: Click on sidebar item scrolls to section
- [ ] **AC-34**: Section states update based on completion

### 15.8 AST Results
- [ ] **AC-35**: AST panel displays antibiotics with result entry fields
- [ ] **AC-36**: Auto-interpretation calculates S/I/R from breakpoints
- [ ] **AC-37**: Manual override requires justification comment
- [ ] **AC-38**: Override justification supports macro expansion

### 15.9 Expert Rules
- [ ] **AC-39**: Flags requiring attention displayed with "Review & Decide" button
- [ ] **AC-40**: Expert Review modal captures decision and justification
- [ ] **AC-41**: Decisions logged in timeline

### 15.10 Final Review & Reports
- [ ] **AC-42**: Final Report modal shows completion checklist
- [ ] **AC-43**: All comment fields support macro expansion
- [ ] **AC-44**: Release Final locks case from further edits

---

## 16. Related Specifications

| Document | Description |
|----------|-------------|
| **AMR Configuration FRS** | Organism/antibiotic masters, breakpoints, panels, expert rules, macro library |
| **WHONET Integration FRS** | Export format, code mappings, hub subscription |
| **Analyzer Interface Spec** | ASTM/HL7 message formats for micro analyzers |
| **Microbiology Report Templates** | Report format configuration |

---

## 17. Future Enhancements (Out of Scope v1)

1. **Antibiogram generator** - Cumulative susceptibility reports by organism
2. **Outbreak detection** - Alert on unusual resistance patterns
3. **Mobile specimen collection** - Barcode scanning for bottle tracking
4. **Image attachment** - Photos of plates, Gram stains
5. **AI-assisted ID** - Suggest organism from colony morphology description
6. **Multi-site data sharing** - Aggregate surveillance across facilities
7. **Custom macro management** - User-defined macros per site
8. **Macro usage analytics** - Track most-used macros for optimization
