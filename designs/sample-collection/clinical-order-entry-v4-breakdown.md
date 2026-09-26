# Clinical Order Entry v4: Slicing Guide (Two-Phase Implementation Plan)

Date: 2026-09-26. Companion to `clinical-order-entry-v4-frs.md` (v0.8). Reviewer scripts for every slice are in `order-entry-v4-acceptance-tests.md`. Slices are sized as one reviewable PR each (D-026). Each slice lists the FRs it delivers and the QA cases that must flip to PASS. The QA handoff's "must keep working" list is the regression gate for every slice.

> This is the non-binding slicing guide linked from the v4 Epic. Developers slice their own stories; the slices below are suggested PR-sized cuts.

## How the phases are split

**MVP (this week)** fixes what is broken and gets the step structure right, with **no new catalog entities**. That means no container types and no body sites. Everything it needs already exists in the data model, apart from these small additions (FRS Dependencies 9, 16, 25, 29 and 30): the laboratory time zone setting; the order progress status and per-step progress; panel provenance on the save; the receiver on the order; the unused lab number record; the collection-after-receipt confirmation; the release-with-unanswered-items record; the per-aliquot label default; and the three reason lists. It ships on the current screens, rearranged.

**Phase 2** adds the new model and the reworked page:
- container types
- body sites and laterality
- the ordered tests table
- the redesigned samples table and full labels grid
- the rest of the connectivity work
- the legacy features needed to retire `/SamplePatientEntry`
- environmental and vector alignment

## MVP: this week

| # | Slice (one PR each) | Delivers | QA cases to flip | Notes |
|---|---|---|---|---|
| M1 | **Backend fix-now bundle** | FR-B16 (panel provenance in the save, no panel inference), FR-I8 (requested sample type marked fulfilled), FR-K13 (`/rest/test-sample-types`), FR-K3 and FR-K5 (idempotent order save; single storage-skipped), FR-K9 (validate against the laboratory's local date), plus OGC-1171 and OGC-1135 | TC-OEW-03, -04, -05, -07, -09, TC-NET-05 | Pure backend; unblocks everything else |
| M2 | **Clock and time zone** | FR-K8, K8a (laboratory time zone in the distro config, read-only in Site Information), K8b, K10 (warn and confirm when collection is after receipt), K11 | TC-OEW-06, -08, TC-ENV-05 | Server moment; the browser clock is no longer used |
| M3 | **Lab number fixes** | FR-A14: the no-increment path, the shared-list defect, format validation (`validateAccessionNumber`), and a clash message naming the holder. Unused numbers recorded | TC-OEW-13 (message) | Keeps reservation on load |
| M4 | **Collapse Label and Store into Prepare Samples, one save** | Steps become Enter Order, Prepare Samples (the step 2 route, relabelled), and optional Sample check. The Label and Store step's storage and referral move onto Prepare Samples as per-sample actions. Its save becomes one transaction covering samples, storage and referrals (FR-A5 for step 2), including aliquots (FR-D10) and add-on tests (FR-D11). `/order/clinical/label` redirects (D-066), and unknown step routes redirect (FR-A16). What was saved reads back identically (FR-K12) | TC-OEW-09, -11, TC-EO-06, R-FLOW-1 to 3 | **Largest MVP item.** Storage assignment and referral writes join the existing order-save transaction instead of looping |
| M5 | **Footer, required levels, To continue checklist, progress indicator** | FR-A1 to A3 (Discard, Save and exit, Save and next; fake Save Draft removed), FR-A12 (progress indicator with clear done states, labels never truncated), FR-A7 to A11 (save and complete levels, markers announced to screen readers, the checklist, disabled reasons, pinned messages), FR-A6, A13, B13 and D7 (the required levels per step), FR-J1 to J4 (states), FR-K6 | TC-OEW-14, -15, R-UX-1 to 3 | Uses the existing required rules; adds the two levels |
| M6 | **Sample check optional, order status, cancel** | FR-F1, F2 (Off hides the step), F3 (release gating only) and F4 (reason when releasing with items unanswered), FR-A4 (Cancel order with a reason list), F5 (explicit order progress status; completion no longer inferred from the checklist), K15 (confirmation on finish; dashboard stops offering Continue) | TC-OEW-11, TC-ODB-02, TC-ENV-02, TC-VEC-02 | Adds the order status |
| M7 | **Enter Order order and clean-up** | FR-B1 (section order), B3, B11 (order date beside required by; priority up), B12, removal of the dead Print Labels accordion and the no-op print buttons, FR-A15 (new order resets) | TC-OEW-12 must stay PASS | Moves sections around; no new fields |
| M8 | **Search first and provider title** | FR-B5, B6 (create only after a successful search; a failed search is never shown as empty), B7, B8 (restrict settings honoured), B9 (title on inline provider; finish OGC-1223), B10 (remember site and requester) | TC-NET-07 | Touches the shared patient panel (OGC-1197) |
| M9 | **Restore configuration gates** | Section M "restore" rows: `eqaEnabled`, `gpsCoordinatesEnabled`, `useExternalPatientSource`, `enableClientRegistry`, `restrictFreeTextProviderEntry`, `trackPayment`, next visit date and test location code switches, `auto-fill collection date/time` as a visible default (FR-C3) | none (regression) | Prevents sites losing configured behaviour |
| M10 | **Labels from presets (first cut)** | FR-I1 (every active preset, system and custom), FR-I4 (test catalog defaults and combining), FR-I5 (override within the maximum, lock where set), FR-I6, FR-I7, FR-I9, in a simple Labels section (order labels plus one row per sample). No label status is tracked. Requires OGC-1227 (preset editing) and OGC-1219 (migration) | TC-OEW-05 (phantom label) | The full grid, Show all and aliquot rows come in phase 2 |
| M11 | **Numbering and wording** | FR-C4 (`-1`, `-2`; aliquot `-1.1`), FR-C4a (suffix badge), D-083 renames ("Tested elsewhere", "Sample check", "Release for testing", "Ready for testing") | none | i18n key changes plus one formatter used everywhere |
| M12 | **App shell reconnect** | FR-K1, K2 (a failed lookup is never shown as empty; retry) | TC-NET-02, -03 (TC-NET-01 stays in the regression gate) | App-wide; small |

**MVP exit criteria:**
- Every listed QA case passes on develop and on the testing instance.
- The 11 "must keep working" cases still pass.
- No new test catalog screens are required.
- A laboratory can enter an order, prepare its samples with storage and referral, print labels from its own presets, and complete, with each save all-or-nothing.

**MVP risks:**
- **M4 is the critical path.** If it slips, ship M1 to M3 and M5 to M12 on the current four steps. Label and Store remains until M4 lands.
- **M10 depends on OGC-1227 and OGC-1219.** If they are not fixed first, M10 ships with the preset list read-only (defaults only, no editing of presets).

## Phase 2: most of the additions

| # | Slice | Delivers | Depends on |
|---|---|---|---|
| P1 | **Container Types admin and seed** | FR-G1 to G4, Appendix A, container domain | none |
| P2 | **Test expected containers and secondary sample types** | FR-G5, G6, G6b, G7, G8 (Test editor and Sample Type settings) | P1; Test Catalog Completion v2 host |
| P3 | **Ordered tests table and assignment** | FR-B18 to B21, D5, D6, D8, D9 (actual versus proposed, Awaiting sample, deviations) | P2 |
| P4 | **Proposed samples and netting** | FR-B22 to B27, B25 own-container sharing within panel, D1 | P2, P3 |
| P5 | **Test and panel chooser at scale** | FR-B14, B15 (Add by code), catalog-wide paged search (Dependency 13), panel code (Dependency 22) | Panel Management v2.2 for panel code |
| P6 | **Panel integrity** | FR-B16a, B16b, carried to results entry, validation and the report | P3 |
| P7 | **Samples table redesign** | FR-C1 to C11 (visible columns, Fill all, row icons, void, multi-sample toolbar and Refer out, compact density), FR-E1 to E5 | P3 |
| P8 | **Labels grid (full)** | FR-I2, I3 (Show all, Add label type), I5a (aliquots) | M10, P7 |
| P9 | **Body Sites and laterality, capture** | FR-N1 to N4, D4 (admin clean-up of the legacy list, sample type and test settings, capture) | P2 |
| P10 | **Body site downstream** | FR-N5 to N11 (display string, report, label field, FHIR in and out, HL7 v2, WHONET) | P9 |
| P11 | **Summary strip and folding** | FR-B2, B1a | P3, P7 |
| P12 | **Sample check evidence** | FR-F3 (full layout), F3b, checklist item to field mapping (Dependency 27) | P7 |
| P13 | **Edit through the steps and dashboard** | FR-H3 (retire Modify Order, change lab number), H1, H2, H2a (dashboard filters and search), H4 (split orders: referred and in-laboratory tests tracked separately) | M6 |
| P14 | **Legacy features and e-orders** | FR-B17 (electronic orders, OGC-1239), B28 (billing reference and Paid), B29 (result notifications), B30 (contact tracing), B31 (attachments rule), then retire `/SamplePatientEntry` | M5 |
| P15 | **Connectivity, rest** | FR-K4 (restore unsaved work), K7 (reference data cache), K12, K14 | M12 |
| P16 | **Consent and holding time** | FR-D2, D3 | P7 |
| P17 | **Environmental and vector alignment** | Section L and the alignment note: shared components, whole-step save, pool and QC row kinds | P7, P8 |

**Suggested order:**
- **Start first, in parallel:** P1, P5 and P9 (independent).
- **Then:** P2 → P3 → P4 and P7 → P8, P11, P12, P16.
- **After body site capture:** P10, once P9 lands.
- **Independent:** P13 and P14 can run alongside.
- **Last:** P17, once the shared components are stable.

## Tickets

- **One Epic** for v4. MVP and phase 2 become two fix versions or labels.
- **Developers slice stories** from this plan (skill `/breakdown` rule).
- **Existing tickets** fold in per FRS Appendix B:
  - OGC-1066, OGC-1069 and OGC-358 close as superseded.
  - OGC-990 is absorbed by M10.
  - Tickets in flight (OGC-1223, OGC-1143, OGC-808, OGC-1201) finish and are linked. OGC-1223 lands through M8.
