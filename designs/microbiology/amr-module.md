# OpenELIS Global - AMR Configuration
## Functional Requirements Specification

**Version:** 1.1  
**Date:** December 2025  
**Module:** Admin â†’ AMR Configuration  
**Route:** `/admin/amr-configuration`

---

## Changelog (v1.1)

| Change | Description |
|--------|-------------|
| **New Section** | Added Section 10: Macro Library for configurable text expansion |
| **Updated Integration** | Macros integrate with Microbiology Case Workbench text fields |

---

## 1. Overview

### 1.1 Purpose

This specification defines the administrative configuration interfaces for Antimicrobial Resistance (AMR) testing in OpenELIS Global. These configurations power the Microbiology Case Workbench's automated interpretation, expert rules, reporting logic, and text macros.

### 1.2 Configuration Modules

| Module | Purpose |
|--------|---------|
| **Organism Master** | Define organisms with WHONET codes and groupings |
| **Antibiotic Master** | Define antibiotics with WHONET codes, classes, routes |
| **Breakpoint Tables** | S/I/R thresholds by organism/antibiotic/standard |
| **AST Panels** | Configure which antibiotics to test/report per organism+specimen |
| **Expert Rules** | Automated logic for inferred resistance, verification |
| **Reporting Rules** | Cascade, selective, suppression rules |
| **Culture Protocols** | Default media and conditions by specimen type |
| **Hub Subscription** | Download updated configurations from central repository |
| **Macro Library** | Text expansion shortcuts for efficient data entry (NEW) |

### 1.3 Menu Structure

```
Admin
â”œâ”€â”€ AMR Configuration
â”‚   â”œâ”€â”€ Organisms
â”‚   â”œâ”€â”€ Antibiotics
â”‚   â”œâ”€â”€ Breakpoint Tables
â”‚   â”œâ”€â”€ AST Panels
â”‚   â”œâ”€â”€ Expert Rules
â”‚   â”œâ”€â”€ Reporting Rules
â”‚   â”œâ”€â”€ Culture Protocols
â”‚   â”œâ”€â”€ Macro Library      â† NEW
â”‚   â””â”€â”€ Hub Subscription
```

---

## 2. Organism Master

### 2.1 Route
`/admin/amr-configuration/organisms`

### 2.2 Purpose
Maintain the master list of organisms that can be identified in microbiology cases, with WHONET codes for surveillance and groupings for rule application.

### 2.3 List View

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Admin / AMR Configuration / Organisms                                        â”‚
â”‚                                                                              â”‚
â”‚ Organism Master List                                            [+ Add New] â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ ðŸ” Search organisms...    Filter: [All Groups â–¼]  [Active â–¼]                â”‚
â”‚                                                                              â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚ â”‚ Organism Name              â”‚ WHONET â”‚ Group               â”‚ Status â”‚Actâ”‚  â”‚
â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”¤  â”‚
â”‚ â”‚ Escherichia coli           â”‚ eco    â”‚ Enterobacterales    â”‚ Active â”‚ â‹® â”‚  â”‚
â”‚ â”‚ Klebsiella pneumoniae      â”‚ kpn    â”‚ Enterobacterales    â”‚ Active â”‚ â‹® â”‚  â”‚
â”‚ â”‚ Staphylococcus aureus      â”‚ sau    â”‚ Staphylococcus      â”‚ Active â”‚ â‹® â”‚  â”‚
â”‚ â”‚ Staphylococcus epidermidis â”‚ sep    â”‚ Staphylococcus (CoNS)â”‚ Active â”‚ â‹® â”‚  â”‚
â”‚ â”‚ Pseudomonas aeruginosa     â”‚ pae    â”‚ Non-fermenter       â”‚ Active â”‚ â‹® â”‚  â”‚
â”‚ â”‚ Streptococcus pneumoniae   â”‚ spn    â”‚ Streptococcus       â”‚ Active â”‚ â‹® â”‚  â”‚
â”‚ â”‚ Enterococcus faecalis      â”‚ efa    â”‚ Enterococcus        â”‚ Active â”‚ â‹® â”‚  â”‚
â”‚ â”‚ Candida albicans           â”‚ cal    â”‚ Yeast               â”‚ Active â”‚ â‹® â”‚  â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”˜  â”‚
â”‚                                                                              â”‚
â”‚ Items per page: [50 â–¼]    1-50 of 342 items     [<] 1 [2] [3] ... [7] [>]   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 2.4 Organism Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Organism Name | Text | Yes | Scientific name (e.g., "Escherichia coli") |
| Common Name | Text | No | Lay term if applicable |
| WHONET Code | Text (3-4 char) | Yes | Standard WHONET organism code |
| Organism Group | Dropdown | Yes | For rule application (see 2.5) |
| Gram Stain | Dropdown | No | Positive / Negative / Variable / N/A |
| Morphology | Dropdown | No | Cocci / Bacilli / Coccobacilli / Yeast / Other |
| Oxygen Requirement | Dropdown | No | Aerobic / Anaerobic / Facultative |
| Clinical Significance | Dropdown | Yes | Always / Usually / Sometimes / Rarely / Contaminant |
| Default AST Panel | Dropdown | No | Suggested panel when this organism is identified |
| Intrinsic Resistances | Multi-select | No | Antibiotics this organism is always resistant to |
| Status | Toggle | Yes | Active / Inactive |
| Notes | Textarea | No | Clinical or procedural notes |

### 2.5 Organism Groups

Groups allow rules to apply to multiple related organisms:

| Group | Examples | Notes |
|-------|----------|-------|
| Enterobacterales | E. coli, Klebsiella, Enterobacter, Proteus | Gram-negative enteric |
| Staphylococcus | S. aureus | Coagulase-positive |
| Staphylococcus (CoNS) | S. epidermidis, S. saprophyticus | Coagulase-negative |
| Streptococcus | S. pneumoniae, S. pyogenes | Beta/alpha hemolytic |
| Enterococcus | E. faecalis, E. faecium | VRE considerations |
| Non-fermenter | P. aeruginosa, Acinetobacter | Glucose non-fermenters |
| Anaerobe | Bacteroides, Clostridium | Strict anaerobes |
| Yeast | Candida spp. | Fungal |
| Mycobacterium | M. tuberculosis, NTM | AFB |

---

## 3-9. [Sections 3-9 remain unchanged from v1.0]

*(Antibiotic Master, Breakpoint Tables, AST Panels, Expert Rules, Reporting Rules, Culture Protocols, Hub Subscription - no changes)*

---

## 10. Macro Library (NEW)

### 10.1 Route
`/admin/amr-configuration/macros`

### 10.2 Purpose

Manage text expansion macros used throughout the Microbiology Case Workbench. Macros allow technicians to quickly enter standardized text by typing a short code (e.g., `.gpc` expands to "Gram positive cocci in clusters.").

### 10.3 List View

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Admin / AMR Configuration / Macro Library                                    â”‚
â”‚                                                                              â”‚
â”‚ Macro Library                                                   [+ Add New] â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Category: [All â–¼]  Status: [Active â–¼]  ðŸ” Search macros...                  â”‚
â”‚                                                                              â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚ â”‚ Code     â”‚ Expansion                              â”‚ Category  â”‚ Statusâ”‚  â”‚
â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚ â”‚ .gpc     â”‚ Gram positive cocci in clusters.       â”‚ gramStain â”‚ Activeâ”‚  â”‚
â”‚ â”‚ .gnr     â”‚ Gram negative rods.                    â”‚ gramStain â”‚ Activeâ”‚  â”‚
â”‚ â”‚ .nml     â”‚ No growth after 5 days of incubation.  â”‚ culture   â”‚ Activeâ”‚  â”‚
â”‚ â”‚ .mix     â”‚ Mixed flora isolated, suggestive of... â”‚ culture   â”‚ Activeâ”‚  â”‚
â”‚ â”‚ .dtneg   â”‚ D-test performed, negative. Clindamy...â”‚ ast       â”‚ Activeâ”‚  â”‚
â”‚ â”‚ .esblc   â”‚ ESBL confirmed by phenotypic testing...â”‚ ast       â”‚ Activeâ”‚  â”‚
â”‚ â”‚ .final   â”‚ Final report. No further testing ind...â”‚ reporting â”‚ Activeâ”‚  â”‚
â”‚ â”‚ .sub24   â”‚ Subcultured to BAP and MAC at 24 hours.â”‚ timeline  â”‚ Activeâ”‚  â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                                              â”‚
â”‚ Items per page: [50 â–¼]    1-50 of 85 items                                  â”‚
â”‚                                                                              â”‚
â”‚ [Import Defaults] [Export] [Bulk Edit]                                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 10.4 Macro Categories

| Category | Code | Used In | Description |
|----------|------|---------|-------------|
| Clinical | `clinical` | Clinical History fields | Patient history, symptoms, conditions |
| Gram Stain | `gramStain` | Isolate preliminary ID | Gram stain observations |
| Colony | `colony` | Isolate morphology | Colony appearance descriptions |
| Culture | `culture` | Culture results, isolate notes | Culture outcomes and observations |
| Organisms | `organisms` | Organism name fields | Common organism names |
| AST | `ast` | AST comments, override justification | AST-related comments and decisions |
| Reporting | `reporting` | Final report comments | Report conclusions and recommendations |
| Timeline | `timeline` | Timeline event notes | Culture workflow events |

### 10.5 Macro Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| Code | Text | Yes | Must start with `.`, 2-15 chars, alphanumeric, unique | Trigger code (e.g., `.gpc`) |
| Expansion | Textarea | Yes | Max 500 characters | Full text to insert |
| Category | Dropdown | Yes | From category list | Determines where macro appears |
| Description | Text | No | Max 100 characters | Help text shown in dropdown |
| Status | Toggle | Yes | | Active / Inactive |

### 10.6 Add/Edit Macro Modal

```
â”Œâ”€ Add Macro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                                                              â”‚
â”‚  Code: *                              Category: *                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚ .                            â”‚    â”‚ gramStain                     â–¼  â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚  Must start with period (.)           Where this macro will appear           â”‚
â”‚                                                                              â”‚
â”‚  Expansion: *                                                                â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚ Gram positive cocci in clusters.                                       â”‚ â”‚
â”‚  â”‚                                                                         â”‚ â”‚
â”‚  â”‚                                                                         â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚  Text that will be inserted when this macro is selected (max 500 chars)     â”‚
â”‚                                                                              â”‚
â”‚  Description:                                                                â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚ GPC in clusters - typical of Staphylococcus                            â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚  Optional help text shown in macro dropdown                                 â”‚
â”‚                                                                              â”‚
â”‚  Status:  (â€¢) Active  ( ) Inactive                                          â”‚
â”‚                                                                              â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚
â”‚                                                                              â”‚
â”‚  [Cancel]                                                         [Save]    â”‚
â”‚                                                                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 10.7 Code Validation Rules

| Rule | Description |
|------|-------------|
| Prefix | Must start with period (`.`) |
| Length | 2-15 characters total (including period) |
| Characters | Alphanumeric only after period (a-z, 0-9) |
| Case | Lowercase only (auto-converted) |
| Uniqueness | Code must be unique across all categories |
| Reserved | Cannot use reserved words (e.g., `.help`, `.list`) |

### 10.8 Default Macros

The system includes a default set of macros that can be imported. Sites can modify or add to these.

**Gram Stain Category (gramStain):**
| Code | Expansion |
|------|-----------|
| `.gpc` | Gram positive cocci in clusters. |
| `.gpcp` | Gram positive cocci in pairs. |
| `.gpcc` | Gram positive cocci in chains. |
| `.gpr` | Gram positive rods. |
| `.gnr` | Gram negative rods. |
| `.gnc` | Gram negative cocci. |
| `.gnd` | Gram negative diplococci. |
| `.yeast` | Yeast cells present. |
| `.wbc` | White blood cells present. |
| `.wbc+` | Many white blood cells present (>25/hpf). |
| `.epi` | Epithelial cells present. |
| `.epi+` | Many epithelial cells present, suggestive of contamination. |
| `.nobac` | No bacteria seen on Gram stain. |
| `.mixed` | Mixed gram positive and gram negative flora. |

**Colony Category (colony):**
| Code | Expansion |
|------|-----------|
| `.lact` | Lactose-fermenting colonies on MacConkey agar. |
| `.nlact` | Non-lactose-fermenting colonies on MacConkey agar. |
| `.bhemo` | Beta-hemolytic colonies on blood agar. |
| `.ahemo` | Alpha-hemolytic colonies on blood agar. |
| `.nhemo` | Non-hemolytic (gamma) colonies on blood agar. |
| `.muc` | Mucoid colonies observed. |
| `.pig` | Pigmented colonies observed. |
| `.small` | Small colony variants noted. |

**Culture Category (culture):**
| Code | Expansion |
|------|-----------|
| `.nml` | No growth after 5 days of incubation. |
| `.ngr` | No significant growth. |
| `.ng24` | No growth at 24 hours. Incubation continued. |
| `.ng48` | No growth at 48 hours. Incubation continued. |
| `.mix` | Mixed flora isolated, suggestive of contamination. Clinical correlation recommended. |
| `.cnt` | Considered contamination based on clinical context and culture findings. |
| `.iso` | Isolated in pure culture. |
| `.pre` | Preliminary identification. Final identification pending. |
| `.conf` | Identification confirmed by additional testing. |
| `.col3` | Colony count: 10Â³ CFU/mL. |
| `.col4` | Colony count: 10â´ CFU/mL. |
| `.col5` | Colony count: â‰¥10âµ CFU/mL (significant bacteriuria). |

**Organisms Category (organisms):**
| Code | Expansion |
|------|-----------|
| `.ecoli` | Escherichia coli |
| `.kleb` | Klebsiella pneumoniae |
| `.saur` | Staphylococcus aureus |
| `.mrsa` | Methicillin-resistant Staphylococcus aureus (MRSA) |
| `.mssa` | Methicillin-susceptible Staphylococcus aureus (MSSA) |
| `.cons` | Coagulase-negative staphylococci |
| `.pseudo` | Pseudomonas aeruginosa |
| `.efaec` | Enterococcus faecalis |
| `.spneu` | Streptococcus pneumoniae |

**AST Category (ast):**
| Code | Expansion |
|------|-----------|
| `.dtneg` | D-test performed, negative. Clindamycin reported as susceptible. |
| `.dtpos` | D-test positive (inducible clindamycin resistance detected). Clindamycin reported as resistant. |
| `.esblc` | ESBL confirmed by phenotypic testing. All penicillins, cephalosporins, and aztreonam reported as resistant regardless of MIC. |
| `.esblneg` | ESBL screen negative. |
| `.mrsac` | MRSA confirmed. All beta-lactams reported as resistant. |
| `.vrec` | Vancomycin resistance confirmed (VRE). |
| `.cpec` | Carbapenemase production confirmed. Contact infection control. |
| `.cascd` | Cascade reporting applied per laboratory protocol. |
| `.qcok` | QC within acceptable limits. |
| `.retest` | Result confirmed by repeat testing. |
| `.manual` | Manual override applied per supervisor review. |

**Reporting Category (reporting):**
| Code | Expansion |
|------|-----------|
| `.final` | Final report. No further testing indicated. |
| `.prelim` | Preliminary report. Final identification and susceptibility testing in progress. |
| `.amend` | Amended report. Please disregard previous results. |
| `.contact` | Critical value. Physician notified. |
| `.ic` | Infection control notified per protocol. |
| `.repeat` | Repeat culture recommended if clinically indicated. |
| `.corr` | Clinical correlation recommended. |
| `.nfr` | Normal flora recovered. No pathogens isolated. |
| `.cnsig` | Coagulase-negative staphylococci isolated from single blood culture. May represent skin contamination. Clinical correlation required. |
| `.respfl` | Upper respiratory flora isolated. No predominant pathogen identified. |

**Timeline Category (timeline):**
| Code | Expansion |
|------|-----------|
| `.sub24` | Subcultured to BAP and MAC at 24 hours. |
| `.sub48` | Subcultured at 48 hours. |
| `.subbap` | Subcultured to blood agar plate. |
| `.subchoc` | Subcultured to chocolate agar. |
| `.submac` | Subcultured to MacConkey agar. |
| `.gram` | Gram stain performed. |
| `.pos` | Positive signal detected by instrument. |
| `.posaer` | Positive signal detected in aerobic bottle. |
| `.posana` | Positive signal detected in anaerobic bottle. |
| `.read24` | Plates read at 24 hours. |
| `.read48` | Plates read at 48 hours. |
| `.vitek` | VITEK 2 card inoculated for identification and susceptibility testing. |
| `.maldi` | MALDI-TOF identification performed. |

**Clinical Category (clinical):**
| Code | Expansion |
|------|-----------|
| `.feb` | Fever, chills, and malaise. |
| `.uti` | Dysuria, frequency, and urgency consistent with urinary tract infection. |
| `.sep` | Clinical signs of sepsis. Blood cultures ordered. |
| `.pneu` | Productive cough, fever, and abnormal chest findings. |
| `.abx` | Patient currently on antibiotic therapy. |
| `.abx2w` | Patient received antibiotics within the past 2 weeks. |
| `.dm` | History of diabetes mellitus. |
| `.immuno` | Immunocompromised patient. |
| `.cvc` | Central venous catheter in place. |
| `.hosp` | Hospitalized for more than 48 hours. |

### 10.9 Import/Export

**Import Defaults:**
- Restores default macros to system
- Option to merge with existing or replace all
- Preview shows which macros will be added/modified

**Export:**
- Export all macros to CSV/JSON
- Filter by category before export
- Useful for sharing between OpenELIS instances

**Bulk Edit:**
- Select multiple macros
- Change category
- Activate/Deactivate
- Delete

### 10.10 Macro Usage in Workbench

When a macro-enabled field is active:

1. User types `.` (period)
2. Dropdown appears showing available macros for that field's category
3. Dropdown filters as user continues typing
4. User selects with arrow keys + Enter, or clicks
5. Macro expansion replaces the trigger code

**Visual Indicator:**
Below macro-enabled fields, display:
```
[.] Type period for macros
```

---

## 11. Integration with Test Catalog

*(Unchanged from v1.0)*

---

## 12. Permissions

### 12.1 Permission Codes

| Code | Description |
|------|-------------|
| `amr.config.view` | View AMR configuration |
| `amr.organism.manage` | Add/edit/delete organisms |
| `amr.antibiotic.manage` | Add/edit/delete antibiotics |
| `amr.breakpoint.manage` | Manage breakpoint tables |
| `amr.panel.manage` | Configure AST panels |
| `amr.rule.manage` | Configure expert and reporting rules |
| `amr.protocol.manage` | Configure culture protocols |
| `amr.hub.manage` | Manage hub subscription and imports |
| `amr.macro.manage` | Add/edit/delete macros (NEW) |

### 12.2 Role Assignments

| Role | Permissions |
|------|-------------|
| Lab Manager | All AMR config permissions including macros |
| Microbiology Supervisor | View only + macro management |
| Microbiology Technician | View only |
| System Administrator | All permissions |

---

## 13. Acceptance Criteria

### 13.1 Organism Master
- [ ] **AC-01**: List view displays all organisms with search and filter
- [ ] **AC-02**: Add/Edit modal captures all required fields
- [ ] **AC-03**: WHONET code validated for uniqueness and format
- [ ] **AC-04**: Organism groups can be selected from predefined list
- [ ] **AC-05**: Intrinsic resistance antibiotics can be multi-selected
- [ ] **AC-06**: Inactive organisms hidden from selection dropdowns

### 13.2-13.6 [Unchanged from v1.0]

### 13.7 Macro Library (NEW)
- [ ] **AC-31**: List view displays all macros with search and category filter
- [ ] **AC-32**: Add/Edit modal validates code format (starts with `.`, unique)
- [ ] **AC-33**: Code auto-converts to lowercase
- [ ] **AC-34**: Expansion text limited to 500 characters
- [ ] **AC-35**: Import Defaults loads all default macros
- [ ] **AC-36**: Export generates valid CSV/JSON file
- [ ] **AC-37**: Bulk operations work correctly (activate, deactivate, delete)
- [ ] **AC-38**: Macros appear in workbench dropdown when user types `.`
- [ ] **AC-39**: Category filtering shows only relevant macros in each field

---

## 14. Related Specifications

| Document | Description |
|----------|-------------|
| **Microbiology Case Workbench FRS** | Workflow that uses these configurations and macros |
| **WHONET Integration FRS** | Export format and code mapping details |
| **Test Catalog FRS v2** | WHONET code integration in test definitions |
| **Analyzer Interface Spec** | ASTM/HL7 for micro analyzers |

---

## 15. Future Enhancements (Out of Scope v1)

1. **Breakpoint conflict detection** - Alert when local customizations conflict with updates
2. **Rule simulation** - Test rules against historical data before activation
3. **Multi-site config sharing** - Share configurations across OpenELIS instances
4. **AI-assisted rule creation** - Suggest rules based on resistance patterns
5. **EUCAST/CLSI comparison view** - Side-by-side breakpoint differences
6. **User-specific macros** - Personal macro shortcuts per user
7. **Macro usage analytics** - Track most-used macros for optimization
8. **Smart macro suggestions** - AI-suggested macros based on context
