# Report Print Queue: Suggested Slicing Guide (r4)

**FRS:** `report-print-queue-frs.md` v2.2 (r4)
**Preview:** `report-print-queue-preview.html`
**Mockup:** `report-print-queue-mockup.jsx`
**Jira:** one Epic, [OGC-1031](https://uwdigi.atlassian.net/browse/OGC-1031) (re-scoped to r4)
**Total:** 10 slices, about 51 human story points (one slice blocked on S06d)
**Contract:** CPHL PNG (V1 is the Phase II deliverable #4, anchor OGC-431); V2 serves the environmental laboratories

This is a suggestion, not a contract: the developer slices the work. Each slice is one branch
and one pull request a reviewer can read in one sitting, shippable on its own, in dependency
order. Localization and access sit inside each slice. Acceptance criteria are in FRS §12; each
slice lists the ones it closes.

The starting point is the shipped Compliance Report page (`LaporanHasilReport.jsx`,
`ComplianceReportRestController`, the generation log, the PDF archive and the OGC-776 amendment
service). No slice builds a second page. FRS §3 says what to keep, widen and replace.

---

**Why this order.** OGC-1031 is PNG / CPHL Phase II deliverable #4 (anchor OGC-431), and PNG
prints patient reports, not certificates. So V1 generalizes the shipped page and delivers
patient reports end to end; `/LaporanHasil` keeps working unchanged until V2 moves certificates
into the queue and redirects it.

## V1: patient reports in the queue (PNG deliverable; about 24 points, 4 PRs)

| # | Slice (what a user can do after it merges) | FRS | Closes | Pts |
|---|---|---|---|---|
| 1 | **A reporting clerk opens the Report Print Queue and sees every patient report that needs printing, without pressing Search.** `LaporanHasilReport.jsx` generalized into the queue page with a report-type column model (patient type first); route `/ReportPrintQueue`; Reports menu entry after Patient Status Report; server-side filtered, sorted, paged list (not the per-sample loop, FRS §3.3); released = analysis Finalized; columns with the State Tag (Partial n/m or Final) and Critical Tag, and Print status Unprinted / Printed from the existing `document_track` history; To print tile on Carbon tokens; guidance strip with the state and print-status legend; empty/loading/error states. Filters: Lab No lookup with scan and range, State (Partial, Final, as chips), Print status, Time window applying to printed rows only (saved per user), Facility / Ward / Requester typeahead reusing the Add Order endpoints with label chips. Patient row expansion. Rows, tiles and lookups scoped by the user's lab-unit domains; module grant extended to roles that open Patient Status Report today. `reportQueue.*` keys | FR-1.1 to 1.8, FR-2.1, FR-2.2, FR-2.4, FR-3.1 to 3.3, FR-3.5, FR-3.7, FR-3.7a, FR-3.8 to 3.10, FR-4.1 (Partial, Final), FR-4.2, FR-5.1, FR-5.2, FR-9.1, FR-9.2, FR-10, NFR-1, §8, BR-1, BR-2, BR-9 | AC-1, AC-2, AC-15, AC-16, AC-17, AC-18, AC-22 (page strings) | 8 |
| 2 | **Every patient report print is a numbered version, kept exactly as printed, wherever it was printed.** One issue history (versions, per-analysis printed values, change summary, reprints) widened from `document_track` and the certificate generation log; the certificate archive widened to every report type, with SHA-256; reprints return the archived bytes; Version column and version history with Open PDF and fingerprint; Retry archive for Admin; Patient Status Report prints through the same pipeline; `document_track` rows migrated as version 1 "issued before archiving began"; install-date cutoff; home dashboard Unprinted Results tile uses the same definition and links to the queue; archive growth added to the server sizing guidance | FR-2.5, FR-4.3, FR-5.4, FR-5.5, FR-6.1 to 6.3, FR-6.8, FR-8, FR-9.3, NFR-3, FRS §6.2, §6.3, BR-5 to BR-7 | AC-3, AC-6, AC-19, AC-21, AC-23 | 8 |
| 3 | **A clerk can tell a completed report from a corrected one, and send the corrected ones first.** State and print status computed against the last printed version's values: added results make it Final (or still Partial) and Unprinted, a changed or removed printed result makes it Amended (magenta, and it stays Amended) and Unprinted; Amended added to the State filter; Amended to print tile; system-written change summaries; amended patient reports feed OGC-1111's corrected banner and "Version n" | FR-4.1 (Amended), FR-4.4 to 4.6, FR-9.1 (Amended to print), BR-3 | AC-4, AC-5, AC-24 | 5 |
| 4 | **A clerk finds every report for one patient.** Search by patient opens the existing `SearchPatientForm` inline (external and registry search suppressed); targeted-lookup exclusivity shared with Lab No | FR-3.4 | none beyond AC-15 behaviour | 3 |

**Order:** 1 → 2 → 3, with 4 any time after 1. Slice 3 needs the OGC-1111 corrected banner and
version number (OGC-1111 FR-A14, FR-A15, which move into its V1); coordinate the two PRs.

## V2: certificates and exports move in, corrections by hand, batch printing (about 24 points, 5 PRs, plus one blocked at 3)

| # | Slice | FRS | Closes | Pts |
|---|---|---|---|---|
| 5 | **An environmental clerk works certificates in the same queue.** Environmental type rows, Type column and filter for users with several domains, Sampling site / Standard / Compliance status filters (with Not evaluated), the shipped `OrderDetail` as the certificate expansion, provisional compliance Tag, `/Am.N` identity; `compliance_report_generation` and `compliance_report_archive` rows migrated into the issue history; `/LaporanHasil` redirect and Compliance Report menu row merged (D-066); old page-level `laporanHasil.*` keys removed; linking a standard after a Not evaluated print is a new, non-amended version | FR-1.4 (certificate), FR-1.7, FR-2.3, FR-3.6, FR-4.6 (certificates), FR-5.3, FR-6.12, BR-4 | AC-11, AC-20, AC-9 (standard linked later) | 8 |
| 6 | **Certificates print even when something is missing: no standard linked, or results still pending.** Renderer moved out of the controller into a certificate renderer service; no-standard mode printing released results under "Not evaluated against a standard" with no threshold, status or conclusion; partial mode with "Pending" parameters and "Provisional: n of m parameters pending". Can be built in parallel with 5; merge with or right after it | FR-6.10, FR-6.11, D2 | AC-9 (print part), AC-10 | 3 |
| 7 | **A validator reissues a printed report with a stated correction.** Inline Reissue with correction (no modal), required reason, Results / Validation / Admin only (disabled with its reason for others), amended version with the reason as its summary for every report type; retires the OGC-776 modal and its `lhu.amendment.modal.*` keys | FR-7.1 to 7.5 | AC-7, AC-8 | 3 |
| 8 | **A clerk prints a whole ward's or client's batch at once.** Print selected as one combined PDF (each report paged from 1), Download selected as a ZIP with per-order file names, progress indicator, 100-order limit, partial failures reported with `_ERRORS.txt`, each order versioned and archived on its own | FR-6.4 to 6.7, FR-6.9, NFR-2, BR-8 | AC-12, AC-13, AC-14 | 5 |
| 9 | **A user who requested a data export follows it in the same queue and downloads it there.** The export job row (Tag, one action, details) extracted from `ReportingView.jsx` into a shared component (D9); Data export row type showing only the user's own jobs from `/rest/reports/data-export/jobs`; job-state options in the State filter when Type is Data export; Exports ready tile; the shipped 15-second poll while jobs are active; export rows left out of print-only filters and batch selection; Custom Data Export's My Report Queue panel removed (Merge) and its links and ready notification pointed at `/ReportPrintQueue?type=export`. The job runner itself does not change | FR-11.1 to 11.7, FR-1.2, FR-1.4 (export column), FR-3.7 (job states), FR-3.8 (finished exports), FR-9.1 (Exports ready), BR-9 | AC-25 to AC-28 | 5 |
| 10 | **Vector certificates print from the queue.** Vector report type once the S06d renderer exists. **Blocked** on S06d | §2, D1 | none yet | 3 |

**Note for PNG:** slice 8 (batch printing) is V2 here. If CPHL needs ward batches for the Phase II
acceptance, pull slice 8 forward after slice 3; it does not depend on slices 5 to 7. Slice 9
(exports) depends only on slice 1 and can move up the same way.

---

## What happens to the r3 child stories

OGC-1032 to OGC-1043 were sliced against r3 (a new queue table, a search modal, a generation
lifecycle). Suggested disposition, for the developer to confirm:

| r3 story | r4 home |
|---|---|
| OGC-1032 queue entity + auto-populate | Replaced: no queue table; slice 1 queries released orders directly |
| OGC-1033 list endpoint + filters | Slice 1 |
| OGC-1034 page shell + table + status/completeness | Slice 1 |
| OGC-1035 filter toolbar + Clear filters | Slice 1 |
| OGC-1036 search modal (patient + lab number) | Superseded: Lab No in slice 1, inline patient search in slice 4 |
| OGC-1037 print single + batch + tracking | Slices 2 and 8 |
| OGC-1038 partial print + re-queue on amendment | Slice 3 |
| OGC-1039 user preferences | Slice 1 |
| OGC-1040 reportType discriminator | Slices 1 and 5 |
| OGC-1041, 1042, 1043 generation lifecycle, status rendering, ready notification | Already shipped by the Custom Data Export job runner; slice 9 brings those jobs into the queue |

---

## Coverage check

- Every FR in the FRS (FR-1.1 to FR-10.5, NFR-1 to NFR-3, BR-1 to BR-9) is in a slice: yes.
  NFR-3 (server sizing guidance) is a docs task that ships with slice 2.
- Every UI element in the preview and mockup is built by a slice: yes (export rows in slice 9, vector rows in slice 10).
- Every slice is titled around what a user can do: yes.
- Localization ships with the slice that shows the string; key removals ship with the slice that
  removes the code (slices 5 and 7).
- Access: page grant and domain scoping in slice 1; reissue roles in slice 7; export ownership in slice 9.
- Docs: the published manual page `laporan-hasil-report` drifts at slice 5 and is re-captured as
  the Report Print Queue page through the Epic's Feature Doc.
