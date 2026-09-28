# Spec Analysis: M-18 Environmental Microbiology (FRS v0.5)

**Date:** 2026-09-29. **Artifacts checked:** `m-18-environmental-microbiology-frs.md` v0.5, `m-18-environmental-microbiology-preview.html`, against `amr-micro-v2-amendments.md` (draft 3), the decision log (to D-123) and the spec registry.

## Summary

M-18 is consistent with Microbiology v2 after the v0.4 alignment and the v0.5 review fixes. One critical finding: the preview still showed the v0.3 order entry section (derived culture protocol, purpose and replicates at order entry). It has been rebuilt on the v2 layout. The other findings were wording and key gaps, all fixed in v0.5.

## Findings

| ID | Pass | Location | Issue | Severity | Fix | Status |
|---|---|---|---|---|---|---|
| F-01 | I, E (preview coverage) | Preview, order entry and Case screens | Preview showed the v0.3 order entry section and the pre-v2 Case layout | CRITICAL | Preview rebuilt on v2: Lab unit per sample at order entry; Case information with Purpose and Replicates and the "Applies to all" helper; v2 sections | Fixed |
| F-02 | J (access), M | Access section | "Results role works environmental Cases ... on Results" contradicted FR-B1 / D-121 | HIGH | Reworded: Cases are worked in the workbench; non-culture environmental tests stay on Results | Fixed |
| F-03 | M (decisions) | Proposed decisions D-095 to D-098 | Numbers already used by Environmental and Vector Order Entry v4 | HIGH | Recorded as D-120 to D-123; D-094 marked superseded by D-120 | Fixed |
| F-04 | A (i18n) | FR-C5a | "Applies to all {count} Cases on this order" had no key | MEDIUM | `micro.case.purpose.appliesToOrder` added | Fixed |
| F-05 | L (Lab Context) | Current State | WHONET and GLASS not expanded on first use | MEDIUM | Expanded inline | Fixed |
| F-06 | F (harmonization) | Localization | `order.env.micro.summary` still said "for culture and susceptibility testing"; `order.micro.sets.env` still placed at order entry | MEDIUM | Summary shortened; Replicates key now placed in Case information | Fixed |
| F-07 | M (crosscheck) | FR-C9 vs D-101 | Site always a sampling site vs D-101 (site or location) | MEDIUM | FR-C9 marked interim, D-101 as the target once Locations & Organizations lands | Fixed |
| F-08 | M (crosscheck) | Clinical OE v4 Dependency 33, env v4 item 22, EV-M2 | Still cited D-094; EV-M2 purpose showed on culture samples (X-08) | MEDIUM | Both FRSs updated; env v4 EV-M2a added | Fixed |
| F-09 | E | Acceptance criteria | Numbering gaps (AC-M18-04, AC-M18-08 absent) | LOW | Left as is to keep existing references stable | Accepted |

## Passes with no findings

- **G (invented data):** every field traces to develop (`micro_case_order_detail`, `MicroCulturePurpose`, `envSamplingSiteId`, `MicroWhonetExportSelection`) or to data v2 declares.
- **H (multitenancy):** the Lab unit filter is a lab unit filter within one deployment, not a site or tenant selector.
- **B, C (Carbon, interaction):** inline sections and row expansion only; no modals.
- **N (docs impact):** no published manual page for the micro module yet; the Feature Doc is created at Acceptance.

## Constitution violations

None open.

## Downstream re-review (not blocking)

- Results Entry v4 FR-M1 and Validation v4 FR-I1: exclude Case-linked tests (D-121).
- M-16 §5.4: environmental samples do reference a sampling site (FR-G3).
- Test catalog data model reference: `test_section.domain` exists on develop (X-04).
