# OpenELIS Global Redesign Project - Context Document

This document captures the project context, learnings, and instructions for continuity when setting up a new Claude Project.

---

## Project Overview

This project focuses on redesigning core functionality within **OpenELIS Global**, a laboratory information management system. The goal is to modernize and consolidate fragmented interfaces for test catalog management and sample type configuration to improve usability for lab administrators and managers.

### Key Objectives
- Maintain data integrity while creating unified experiences
- Replace multiple-page workflows with comprehensive single-interface solutions
- Support complex laboratory workflows (age/sex-specific reference ranges, neonatal precision)
- WHONET integration for antimicrobial resistance surveillance
- Localization hardening to prevent system errors

---

## Design Resources

### Figma Template
Generic OpenELIS UI for design context mockups:
https://www.figma.com/design/15B8LmoBhZ5WgtYDI9MCHm/OpenELIS-Global-Template

### Technology Stack
- **Frontend**: React with Carbon Design System (Carbon for React)
- **Project Management**: Atlassian Jira (OGC project board)
- **Integration**: WHONET for antimicrobial resistance surveillance

---

## Key Learnings & Principles

### Existing System Pain Points
- Poor navigation requiring multiple page visits for simple edits
- Missing critical functionality (e.g., reagent linking)
- Confusing reference range displays
- Fragmented workflows scattered across multiple pages

### Design Principles
1. **Consolidate fragmented workflows** into unified interfaces
2. **Maintain integration** with existing pages where appropriate (like Master Lists for reflex tests) rather than duplicating functionality
3. **Localization hardening** is critical to prevent system failures
4. **Support complex laboratory requirements** including:
   - Temperature-controlled storage conditions
   - Precise age-based reference ranges (neonatal-level precision)
   - WHONET organism/antibiotic mappings

---

## Development Approach & Patterns

### Process
1. Identify pain points in current systems
2. Create comprehensive React mockups with iterative refinement
3. Develop detailed technical specifications (FRS documents)
4. Create organized Jira tickets for implementation

### Design Patterns
- **Dashboard-style interfaces** with vertical tab navigation
- **Search and filtering capabilities** throughout
- **Bulk actions** for efficiency
- **Drag-and-drop functionality** with numeric input alternatives
- **11-tab test editor interface** consolidating previously scattered functionality
- **Bidirectional associations** (e.g., sample types ↔ tests)
- **Functional coverage validation** with clickable gap identification

---

## Project Files Inventory

### Functional Requirements Specifications (FRS)
| File | Description |
|------|-------------|
| `test-catalog-requirements-v2.md` | Comprehensive test catalog management (103K) |
| `results-page-requirements.md` | Results entry interface (88K) |
| `organizations-management-requirements.md` | Organization/client management (62K) |
| `validation-page-requirements.md` | Result validation workflow (58K) |
| `microbiology-case-workbench-frs-v1_1.md` | Microbiology case management (57K) |
| `analyzer-import-requirements.md` | Analyzer data import (38K) |
| `system-audit-trail-requirements.md` | Audit trail functionality (37K) |
| `amr-configuration-frs-v1_1.md` | AMR configuration (34K) |
| `lab-units-requirements.md` | Lab units management (32K) |
| `whonet-integration-frs-v1_1.md` | WHONET integration (31K) |
| `data-dictionary-requirements.md` | Data dictionary management (28K) |
| `methods-requirements.md` | Test methods management (24K) |
| `result-options-requirements.md` | Result options/dictionaries (20K) |
| `panel-requirements.md` | Test panel management (12K) |
| `range-requirements-updated.md` | Reference ranges (10K) |
| `OpenELIS_PathologyCaseView_Redesign_FRS.md` | Pathology case view (67K) |
| `whonet-integration-frs.md` | WHONET integration original (83K) |

### React Mockups (Carbon Design System)
| File | Description |
|------|-------------|
| `test-catalog-mockups-v3.jsx` | Test catalog interface v3 (199K) |
| `amr-module-complete.jsx` | Complete AMR module (144K) |
| `validation-page-mockup.jsx` | Validation interface (108K) |
| `results-page-mockup.jsx` | Results entry interface (100K) |
| `lab-units-mockup.jsx` | Lab units management (94K) |
| `test-catalog-mockups.jsx` | Test catalog interface v1 (77K) |
| `methods-mockup.jsx` | Methods management (74K) |
| `result-options-mockup.jsx` | Result options interface (70K) |
| `data-dictionary-mockup.jsx` | Data dictionary interface (65K) |
| `panel-mockup.jsx` | Panel management (59K) |
| `system-audit-trail-mockup.jsx` | Audit trail interface (47K) |
| `organizations-management-mockup.jsx` | Organizations interface (44K) |
| `analyzer-import-mockup.jsx` | Analyzer import interface (41K) |
| `range-editor-v2.jsx` | Reference range editor (40K) |

---

## Claude Project Instructions (Suggested)

Use the following as custom instructions for your new Claude Project:

```
Ask clarifying questions to get more details. This project involves writing software specifications for OpenELIS Global, a laboratory information management system used in clinical laboratories to manage lab data and processes.

Technical context:
- OpenELIS Global uses Carbon for React frontend
- Jira project board: OGC
- When getting Figma design files, use get_design_context

Figma template for mockups:
https://www.figma.com/design/15B8LmoBhZ5WgtYDI9MCHm/OpenELIS-Global-Template

When creating Jira issues, create a single issue with no subtasks.
```

---

## Memory Edits to Add

After setting up the project, consider adding these memory edits:

1. "When creating Jira issues, create a single issue with no subtasks."
2. "User is working on OpenELIS Global redesign project for laboratory information management"
3. "Use Carbon Design System for React mockups"

---

## Quick Start for New Project

1. Create new Claude Project in Team account
2. Upload all `.md` and `.jsx` files from this package
3. Add custom instructions (see above)
4. Add relevant memory edits
5. Continue development work!

---

*Generated: January 8, 2026*
