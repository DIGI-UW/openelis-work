# Patient Report & Report Management: Suggested Slicing Guide (v2.3)

**FRS:** `patient-report-and-report-management-frs.md` v2.3
**Previews:** `patient-report-preview.html` (the PDF: Letter / A4, PDF / photocopy, EN / FR, V1 / V2), `report-management-preview.html` (the admin page, V1 / V2)
**Mockup:** `report-management-mockup.jsx` (Carbon, Report Management page, V1 and V2)
**Jira:** one Epic, **OGC-1111**. OGC-932 is linked as the PNG V1 deliverable (slices 1 to 4).

This is a suggestion, not a contract; the developer slices the work. Each slice is one branch and one pull request a reviewer can read in one sitting, shippable on its own, in dependency order. Localization and access sit inside each slice. Acceptance criteria are in FRS §15; each slice lists the ones it closes.

---

## V1 (about 47 human story points, two sprints; 7 PRs)

| # | Slice (what a user can do after it merges) | FRS | Closes | Pts |
|---|---|---|---|---|
| 1 | **A clinician gets the redesigned one-page patient report on Letter.** `patient_letter.jrxml` with its own header (square logo slots, accreditation marks and note resolved per order), three-column card, column header per page, section titles, result rows with monochrome abnormal and critical treatment, the per-test Completed column, `flagCode` / `referralPending` / `confirmationSample` flags with translated letters and arrows, legend in the footer, note line, pending status, sign-off flowing after the last result with validators and release times from `result_signature`, "End of report", page x of y per order, compact continuation header and strip. DejaVu font extension. `PatientCILNSPClinical_vreduit` renders the new template; `patient.jrxml` removed. EN and FR keys. | FR-A1, A3 to A13, A16, A17, A19 to A24, A27, A30, A31, A36 to A39, A58 | AC-2 to AC-7, AC-11, AC-13, AC-15, AC-16, AC-36 | 13 |
| 2 | **A4 labs get an A4 report.** `patient_a4.jrxml` (A.10 widths); the paper-size setting (default LETTER, presettable in the deployment configuration); the report picks Letter or A4. | FR-A1, A2, FR-B2 (setting) | AC-1 | 3 |
| 3 | **A clinician sees how each result was produced.** `methodName`, `performingLabName`; Method column with "Performed by" for referred results; referral text removed from the note; multi-component block as a sub-list with per-component flags. Both templates. | FR-A25, A26, A29 | AC-8, AC-9 | 5 |
| 4 | **An assessor finds the ISO items on the report.** Callback line from `critical_callback` with the earlier-attempt count; † marker and legend line from a per-row `inAccreditedScope`; corrected banner derived from data with the replaced report's date (from `document_track`) and the change note, surviving reprints. Both templates. | FR-A14, A28, A33, A40 | AC-10, AC-12, AC-14 | 8 |
| 4b | **Every lab reads the report in its own language.** Report engine resolves labels from the UI translation catalogue with deployment overrides (fallback: override, locale, base language, English); reuse the 13.1.1 keys; add the 13.1.3 keys to the English catalogue; ship the 13.1.2 fixes; populator-built text from the same catalogue; localized catalogue names. Both templates. Can merge before or after slice 1 (slice 1 then swaps its keys). | FR-A5, A53 to A57 | AC-33 to AC-35 | 5 |
| 5 | **An administrator sets the paper size in Report Management.** Page at `/MasterListsPage/reportManagement`; Admin sidebar entry replacing Printed Reports; redirect from the old route; Print defaults tile; report list from `reportconfiguration.Report` with search and Show not configurable; audit entries. Admin role only. | FR-B1 to B5, B20 | AC-17, AC-18, AC-20 to AC-23 | 8 |
| 6 | **An administrator manages the report's logos, signature and header lines in one place.** Patient Status Report row: Header and branding (square previews, `FileUploader`, remove), Header lines (title, given name, surname, additional info; lab name read-only), Accreditation line, Signatures placeholder, Save / Cancel. Printed Report Configuration page removed (D-066 Remove). | FR-B7 to B11 | AC-19 | 5 |

**Order.** 1 → 2 → (3, 4) for the report; 5 → 6 for the admin page, which can start alongside slice 1 (stub the setting until slice 2 merges). Slices 1 to 4b are the PNG / CPHL deliverable on OGC-932.

**Before slice 1:** confirm which of the three lab-director property keys holds title, given name and surname (FRS Open Question 1). **Coordinate with:** OGC-302 (fills the sign-off's right cell; update its FRS per §14.1); OGC-720 (satisfied by slice 1's header marks; close or re-point); OGC-1266 order entry v4 (body site, panel modification data, sample-number formatter print automatically once present).

---

## V2 (about 38 human story points, two sprints; 6 PRs, one blocked)

| # | Slice | FRS | Closes | Pts |
|---|---|---|---|---|
| 7 | **The report engine uses the template chosen for the Patient Status Report.** Template choice per report; engine resolves the patient report from it; discovery of single and Letter / A4-pair custom templates in the configuration folder; validation with reasons. | FR-B6, B12, B13 | AC-27, AC-31 | 8 |
| 8 | **An administrator switches, previews and reverts the template.** Selector, Preview with the sample-order fixture, activate after preview, revert modal, history, upgrade notice with Preview shipped template. | FR-B14 to B19 | AC-28 to AC-30, AC-32 | 8 |
| 9 | **Corrected reports carry a version number.** Store the issue version at generation; reprints without content changes keep it. | FR-A15, A41 | AC-24 | 5 |
| 10 | **The report lists which tests fall within each accreditation.** Per-body test list; coverage block on the last page. | FR-A35 | AC-25 | 5 |
| 11 | **Assessors see every callback attempt.** Earlier-attempts appendix when a critical had more than one attempt. | FR-A34 | AC-26 | 3 |
| 12 | **Specimen-quality values print.** HIL after the method. **Blocked** on the HIL specimen-quality work. | FR-A32 | none | 2 |

Further reports become configurable one at a time after slice 7, each a small PR that moves that report onto the registry.

---

## Coverage check

- Every FRS requirement (FR-A1 to FR-A41, FR-A53 to FR-A58, FR-B1 to FR-B20) is in a slice, except FR-A18 and the D-080 part of FR-A27, which print automatically once order entry v4 supplies the data (no slice needed; verified in slice 1's fixture when that data exists): yes.
- Every UI element in both previews is built by a slice; V2-tagged elements by slices 8 to 12: yes.
- Every slice is titled around what a user can do: yes.
- Localization ships with the slice that shows the string; the Admin-role gate ships with slice 5.
- Microbiology results (FR-A42 to FR-A52, N13 to N15, AC-M1 to AC-M7, release column M, added in FRS v2.2) are not sliced here: they ship with Microbiology v2 (OGC-1383) and are sliced with it, on top of the V1 templates.
