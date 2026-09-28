# M-18 Environmental Microbiology: Slicing Guide

**FRS:** `m-18-environmental-microbiology-frs.md` v0.5
**Preview:** `m-18-environmental-microbiology-preview.html`
**Mockup:** `m-18-environmental-microbiology-mockup.jsx`
**Analysis:** `m-18-environmental-microbiology-analyze.md`
**Depends on:** `amr-micro-v2-amendments.md` (draft 3): A-02 case routing and lab unit keying, A-03 Case information
**Pipeline:** Claude Code, one reviewable PR per slice. This guide is a suggestion; the developer slices.

## Handoff ticket

**Type:** Epic. Several screens (Results, Validation, environmental order entry, Case, Worklist, WHONET export) and one new code list.
**Title:** Environmental Microbiology: cultures for swabs, water and food with a site instead of a patient
**Summary:** Environmental culture samples get their own lab unit and use the same Microbiology Case as patient cultures, with a sampling site as the subject. Culture tests are worked only in the Case, and environmental isolates stay out of patient surveillance outputs.
**Linked program epic:** OGC-527 (Environmental and Vector Testing), "is part of"; related OGC-782 (micro module).
**Labels (suggested):** `microbiology`, `environmental`, `png`, `global`

## Slices

| # | Slice (what a user can do) | FRs | Depends on | Size |
|---|---|---|---|---|
| 1 | A technician never sees culture tests on Results or Validation; a line points to the Microbiology worklist | FR-B1 to FR-B4 | none (applies to clinical cultures today) | Small PR |
| 2 | A catalog manager sets up an Environmental Microbiology lab unit and its culture tests; purposes for environmental Cases exist | FR-A1 to FR-A5, FR-C5 (code list) | none | Small PR |
| 3 | Reception opens environmental Cases from Program = Microbiology with a lab unit per sample; a technician works the Case with the site as the subject and sets Purpose and Replicates once for the order | FR-C1 to FR-C9, FR-D1 to FR-D7 | v2 A-02 (routing, lab unit keying) and A-03 (Case information); slice 2 | Medium PR |
| 4 | A technician who works both benches sees patient and site rows on one Worklist, filters by lab unit, and finds Cases by site | FR-E1 to FR-E3 | slice 3 | Small PR |
| 5 | A supervisor exports WHONET with or without environmental isolates; antibiogram and GLASS never include them | FR-F1 to FR-F4 | slice 3 | Small PR |
| 6 | Cluster detection counts environmental Cases in the environmental stream, except outbreak-investigation samples | FR-G1 to FR-G3 | slice 3; M-16 detection built | Small PR, later |

Localization and access are inside each slice (FRS Localization and Access sections).

## Coverage check

- Every FR in the FRS is in a slice: yes (A, B, C, D, E, F, G).
- Every screen in the preview is built by a slice: Results and Validation (1), order entry (3), Case (3), Worklist (4), Lab Units (2), WHONET export (5).
- Every slice is titled by what a user can do: yes.
- No slice needs a later slice: yes; slice 3 waits on Microbiology v2, declared above.
