# OpenELIS Global - WHONET Integration
## Functional Requirements Specification

**Version:** 1.1  
**Date:** December 2025  
**Module:** Microbiology â†’ WHONET Integration  
**Routes:** 
- Export: `/reports/whonet-export`
- Code Mapping: `/admin/amr-configuration/whonet-mapping`

---

## Changelog (v1.1)

| Change | Description |
|--------|-------------|
| **Updated References** | References to Microbiology Case Workbench and AMR Configuration FRS updated to v1.1 |
| **New Worklist Integration** | Export can be triggered from AST Worklist quick actions |

---

## 1. Overview

### 1.1 What is WHONET?

WHONET is a free Windows-based database software developed by the WHO Collaborating Centre for Surveillance of Antimicrobial Resistance. It's used for:

- **Local analysis** of laboratory AST data
- **Surveillance** of antimicrobial resistance patterns
- **Reporting** to national and international systems (GLASS)
- **Antibiogram generation** and trend analysis

### 1.2 Integration Purpose

OpenELIS Global will support WHONET through:

1. **Standardized Coding** - Map organisms and antibiotics to WHONET codes
2. **Data Export** - Generate WHONET-compatible data files
3. **Optional Workflow** - WHONET export is optional, not required for routine lab operations
4. **Hub Subscription** - Download updated WHONET code tables from central repository

### 1.3 Data Flow

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                         WHONET DATA FLOW                                     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                                                   â”‚
â”‚  â”‚     OpenELIS         â”‚                                                   â”‚
â”‚  â”‚     Global           â”‚                                                   â”‚
â”‚  â”‚                      â”‚                                                   â”‚
â”‚  â”‚ â€¢ Micro Dashboard    â”‚                                                   â”‚
â”‚  â”‚ â€¢ Pending Cultures   â”‚ â† NEW                                             â”‚
â”‚  â”‚ â€¢ AST Worklist       â”‚ â† NEW (Quick Action: Export WHONET)               â”‚
â”‚  â”‚ â€¢ Case Workbench     â”‚                                                   â”‚
â”‚  â”‚ â€¢ WHONET codes       â”‚                                                   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                                                   â”‚
â”‚             â”‚                                                                â”‚
â”‚             â”‚ Export (CSV/TXT)                                              â”‚
â”‚             â–¼                                                                â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                â”‚
â”‚  â”‚   WHONET     â”‚â”€â”€â”€â”€>â”‚   National   â”‚â”€â”€â”€â”€>â”‚    WHO       â”‚                â”‚
â”‚  â”‚   Software   â”‚     â”‚   Reference  â”‚     â”‚    GLASS     â”‚                â”‚
â”‚  â”‚              â”‚     â”‚   Lab        â”‚     â”‚              â”‚                â”‚
â”‚  â”‚ â€¢ Analysis   â”‚     â”‚              â”‚     â”‚ â€¢ Global     â”‚                â”‚
â”‚  â”‚ â€¢ Antibiogramâ”‚     â”‚ â€¢ Aggregate  â”‚     â”‚   AMR data   â”‚                â”‚
â”‚  â”‚ â€¢ Trends     â”‚     â”‚ â€¢ Validate   â”‚     â”‚ â€¢ Reports    â”‚                â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                â”‚
â”‚                                                                              â”‚
â”‚  Alternative: Direct GLASS submission (future enhancement)                  â”‚
â”‚                                                                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 1.4 Key Concepts

| Term | Definition |
|------|------------|
| **WHONET Code** | Standardized 3-4 character code for organisms and antibiotics |
| **WHONET Export** | Data file in WHONET-compatible format (CSV or TXT) |
| **GLASS** | Global Antimicrobial Resistance Surveillance System (WHO) |
| **Specimen Type Code** | WHONET code for specimen/sample type |
| **Origin Code** | WHONET code for patient location (inpatient, outpatient, etc.) |

---

## 2. WHONET Code Management

### 2.1 Route
`/admin/amr-configuration/whonet-mapping`

### 2.2 Code Types

| Code Type | Length | Examples | Source |
|-----------|--------|----------|--------|
| Organism | 3-5 char | eco (E. coli), sau (S. aureus), kpn (Klebsiella) | WHONET organism list |
| Antibiotic | 3 char | AMP (Ampicillin), CIP (Ciprofloxacin), VAN (Vancomycin) | WHONET antibiotic list |
| Specimen | 2-4 char | bl (blood), ur (urine), sp (sputum) | WHONET specimen list |
| Origin | 2-3 char | inp (inpatient), out (outpatient), icu (ICU) | WHONET origin list |

### 2.3 Organism Code Mapping

Organisms in the Organism Master (see AMR Configuration FRS v1.1) have a WHONET code field. This section shows unmapped organisms and allows bulk mapping.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Admin / AMR Configuration / WHONET Mapping                                   â”‚
â”‚                                                                              â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ [Organisms] [Antibiotics] [Specimens] [Origins]                         â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                                                              â”‚
â”‚ Organism â†’ WHONET Code Mapping                                  [Import Hub]â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                              â”‚
â”‚ Filter: [All â–¼]  â˜ Show unmapped only                                       â”‚
â”‚                                                                              â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚ â”‚ OpenELIS Organism        â”‚ WHONET Code â”‚ WHONET Name         â”‚ Status â”‚  â”‚
â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚ â”‚ Escherichia coli         â”‚ eco         â”‚ Escherichia coli    â”‚ âœ“      â”‚  â”‚
â”‚ â”‚ Klebsiella pneumoniae    â”‚ kpn         â”‚ Klebsiella pneumoniaeâ”‚ âœ“     â”‚  â”‚
â”‚ â”‚ Staphylococcus aureus    â”‚ sau         â”‚ Staphylococcus aureusâ”‚ âœ“     â”‚  â”‚
â”‚ â”‚ Pseudomonas aeruginosa   â”‚ pae         â”‚ Pseudomonas aeruginosaâ”‚ âœ“    â”‚  â”‚
â”‚ â”‚ Enterococcus faecalis    â”‚ efa         â”‚ Enterococcus faecalisâ”‚ âœ“     â”‚  â”‚
â”‚ â”‚ Candida albicans         â”‚ cal         â”‚ Candida albicans    â”‚ âœ“      â”‚  â”‚
â”‚ â”‚ Acinetobacter baumannii  â”‚ aba         â”‚ Acinetobacter baumanniiâ”‚ âœ“   â”‚  â”‚
â”‚ â”‚ Local Organism XYZ       â”‚ --          â”‚ --                  â”‚ âš  Map  â”‚  â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                                              â”‚
â”‚ âš  1 organism(s) not mapped to WHONET codes. These will be excluded from    â”‚
â”‚    WHONET exports unless mapped.                                            â”‚
â”‚                                                                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 3. Export Generation

### 3.1 Access Points

WHONET export can be accessed from:

1. **Reports Menu**: `/reports/whonet-export`
2. **AST Worklist Quick Actions**: "Export to WHONET" button (NEW)
3. **Individual Case**: Export single case from case detail view

### 3.2 Export Generator Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Reports / WHONET Export                                                      â”‚
â”‚                                                                              â”‚
â”‚ WHONET Export Generator                                                      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                              â”‚
â”‚  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•    â”‚
â”‚  DATE RANGE                                                                  â”‚
â”‚  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•    â”‚
â”‚                                                                              â”‚
â”‚  Start Date: *                        End Date: *                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”‚
â”‚  â”‚ 2024-12-01             ðŸ“…   â”‚    â”‚ 2024-12-31             ðŸ“…   â”‚       â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â”‚
â”‚                                                                              â”‚
â”‚  Quick Select: [This Month] [Last Month] [This Quarter] [Custom]            â”‚
â”‚                                                                              â”‚
â”‚  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•    â”‚
â”‚  FILTERS                                                                     â”‚
â”‚  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•    â”‚
â”‚                                                                              â”‚
â”‚  Specimen Types:                      Organisms:                             â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”‚
â”‚  â”‚ â˜‘ Blood                      â”‚    â”‚ â˜‘ All Organisms              â”‚       â”‚
â”‚  â”‚ â˜‘ Urine                      â”‚    â”‚ â˜ Select specific...         â”‚       â”‚
â”‚  â”‚ â˜‘ Respiratory                â”‚    â”‚                              â”‚       â”‚
â”‚  â”‚ â˜‘ Wound                      â”‚    â”‚                              â”‚       â”‚
â”‚  â”‚ â˜‘ CSF                        â”‚    â”‚                              â”‚       â”‚
â”‚  â”‚ â˜ Stool                      â”‚    â”‚                              â”‚       â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â”‚
â”‚                                                                              â”‚
â”‚  Origin:                                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚ â˜‘ Inpatient  â˜‘ Outpatient  â˜‘ ICU  â˜ Emergency  â˜ Long-term Care   â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                                                              â”‚
â”‚  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•    â”‚
â”‚  OPTIONS                                                                     â”‚
â”‚  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•    â”‚
â”‚                                                                              â”‚
â”‚  Format: (â€¢) WHONET CSV  ( ) WHONET TXT  ( ) Custom delimited               â”‚
â”‚                                                                              â”‚
â”‚  â˜‘ Include intermediate (I) results                                        â”‚
â”‚  â˜ Include non-significant isolates                                        â”‚
â”‚  â˜‘ Deduplicate (one isolate per patient/organism/7 days)                   â”‚
â”‚                                                                              â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚                                                                              â”‚
â”‚  [Preview]                                                      [Generate]  â”‚
â”‚                                                                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 4-7. [Sections 4-7 remain unchanged from v1.0]

*(Export Format, Preview, Scheduled Export, Permissions - no changes)*

---

## 8. Acceptance Criteria

### 8.1 Code Mapping
- [ ] **AC-01**: All four code types (organism, antibiotic, specimen, origin) can be mapped
- [ ] **AC-02**: Search finds matching WHONET codes by name or code
- [ ] **AC-03**: Unmapped items clearly indicated with warning
- [ ] **AC-04**: Import from Hub downloads and applies code updates
- [ ] **AC-05**: Local codes preserved after hub import

### 8.2 Export Generation
- [ ] **AC-06**: Date range filter correctly limits exported records
- [ ] **AC-07**: Specimen/organism/origin filters work correctly
- [ ] **AC-08**: Preview shows accurate record count and sample data
- [ ] **AC-09**: CSV format valid and WHONET-compatible
- [ ] **AC-10**: Unmapped data excluded with clear warning
- [ ] **AC-11**: Export accessible from AST Worklist quick actions (NEW)

### 8.3 Scheduled Export
- [ ] **AC-12**: Scheduled exports run at configured time
- [ ] **AC-13**: Email delivery works correctly
- [ ] **AC-14**: SFTP upload works correctly (if configured)
- [ ] **AC-15**: Export history tracks all scheduled runs

### 8.4 Integration
- [ ] **AC-16**: WHONET codes auto-populate when organism selected
- [ ] **AC-17**: Single case can be exported to WHONET format
- [ ] **AC-18**: Missing mapping warnings displayed appropriately

---

## 9. Related Specifications

| Document | Description |
|----------|-------------|
| **Microbiology Case Workbench FRS v1.1** | Main workflow that generates exportable data; includes new worklists |
| **AMR Configuration FRS v1.1** | Organism/antibiotic masters with WHONET codes; includes macro library |
| **Hub Subscription** | Central repository for code updates |

---

## 10. Future Enhancements (Out of Scope v1)

1. **Direct GLASS submission** - API integration with WHO GLASS system
2. **WHONET file import** - Import data from other labs in WHONET format
3. **Antibiogram auto-generation** - Generate cumulative reports from export data
4. **Multi-format export** - Support other surveillance formats (EARS-Net, etc.)
5. **Real-time surveillance alerts** - Notify on unusual resistance patterns
6. **Data quality dashboard** - Track export completeness and data quality metrics
