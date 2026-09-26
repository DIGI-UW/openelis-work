# Clinical Order Entry v4: Acceptance Test Scripts

Date: 2026-09-26. Reviewer scripts for every slice in `order-entry-v4-implementation-plan.md`. They are written against FRS v0.8 (`clinical-order-entry-v4-frs.md`).

Each script names:
- **Where** to run it: the testing instance, or the design preview for layout-only checks.
- **Setup** needed first.
- **Steps**, each with its **expected result**.
- The **QA case** it re-runs, where one exists.

A slice passes when every step matches, and the regression gate below still passes.

## How to use these scripts

- **Build review.** Run a slice's script on the testing instance once its PR is deployed. Record the build and image digest in the Jira comment, as the QA harness does.
- **Design review.** Scripts marked **(preview)** can also be walked in `clinical-order-entry-v4-preview.html` to agree on the intended behaviour before build.
- **Timing.** Each step is one action. Keep a stopwatch for the timed steps; slower than stated is a finding.
- **Language.** Run one script per slice a second time with the UI in French. Any English text, raw key or field path on screen is a finding (R-UX-1).

## Standard test data

Set this up once on the testing instance.

| Item | Value |
|---|---|
| Laboratory time zone | `Pacific/Port_Moresby` in the distribution configuration |
| Patient A | Kila Morea, F, DOB 14/03/1988, national ID PNG-8814-2209 |
| Patient B | A second patient sharing Patient A's national ID (to test disambiguation) |
| Facility | Port Moresby General Hospital, ward Medical Ward 3 |
| Provider | Dr Agnes Tau (title Dr) |
| Reference laboratory | PNG Institute of Medical Research (PNGIMR) |
| Tests | Full Blood Count (FBC), HbA1c, Liver Function Panel (5 tests), Creatinine, Coagulation Screen (PT/INR, APTT), Wound Culture, Throat Culture |
| Label presets | At least 8 active presets: Order, Specimen, Freezer, Slide, Block and at least three custom ones (for example "Cryovial label"), plus one inactive custom preset |
| Test label links | FBC links Specimen label, default 2, maximum 4; PT/INR and APTT (the Coagulation Screen members) each link Specimen label, default 1, override **off** |
| Users | A Reception user, a Results user, a Global Administrator |

## Regression gate (run for every slice)

These are the QA handoff's "must keep working" cases. All must still pass.

| # | Check | QA case |
|---|---|---|
| G1 | Save with no patient and no sample type is blocked with a message, and no request is sent | TC-OEW-01 |
| G2 | The saved data matches exactly what was selected, per sample | TC-OEW-02 |
| G3 | Going back to Enter Order keeps patient, facility, sample types and tests | TC-OEW-12 |
| G4 | A duplicate lab number is rejected and the existing order is untouched | TC-OEW-13 |
| G5 | The sample acceptance checklist blocks release until answered, and when an item fails | TC-OEW-10 |
| G6 | Dashboard Open or Continue resumes at the right step | TC-OEW-16 |
| G7 | A saved order reopens with program, samples, tests, facility, and request and received dates correct | TC-EO-05 |
| G8 | A save that fails before reaching the server keeps the form and says it was not saved | TC-NET-04 |
| G9 | A slow save disables the button and sends one request | TC-NET-06 |
| G10 | The environmental workflow runs end to end to completion | TC-ENV-01 |
| G11 | A 5-second outage during page load recovers unnoticed | TC-NET-01 |

---

## MVP (phase 1)

### M1. Backend fix-now bundle

**Setup:** standard data.

| Step | Action | Expected |
|---|---|---|
| 1 | Order Hemoglobin alone (a member of FBC). Save. Reopen. | Hemoglobin is saved as a single test. No FBC panel is attached. (TC-OEW-03) |
| 2 | Order Amylase alone. Save. Reopen. | No panel is attached. (TC-OEW-03) |
| 3 | Order FBC as a panel, and also Hemoglobin on its own. Save. Reopen. | The FBC panel and a separate standalone Hemoglobin are both present, and the panel/standalone split matches what was picked. |
| 4 | Open the sample types offered for Amylase. | Only its real sample types are listed. Histopathology is never offered. (TC-OEW-04) |
| 5 | Request Serum, collect a Serum sample, save. | The requested type shows fulfilled. There is one sample and one label row, with no phantom `-2`. (TC-OEW-05) |
| 6 | With the network throttled, save and drop the response. Press Save again. | The original order is returned. There is no "accession already in use" error, and still exactly one order and one set of samples. (TC-NET-05) |
| 7 | Double-click Save on a step that stores samples. | Exactly one write reaches the server. (TC-OEW-09) |
| 8 | At 09:00 Port Moresby time, enter today's date as the collection date. Save. | It is accepted. (TC-OEW-07) |
| 9 | Use a sample type whose name is over 40 characters. Save. | It saves, with no HTTP 500. (OGC-1171) |
| 10 | Post an order through the API with an ISO-8601 request date. | It is accepted. (OGC-1135) |

### M2. Clock and time zone

**Setup:** set the reviewer's computer clock 20 minutes fast.

| Step | Action | Expected |
|---|---|---|
| 1 | Open Enter Order. | A notice says: "This computer's clock is 20 minutes off. Times are taken from the laboratory server." |
| 2 | Look at the default order date and time. | It is the server's current time in Port Moresby time, not the PC time. |
| 3 | Admin → Site Information. | "Laboratory time zone: Pacific/Port_Moresby", read-only, with "Set by the distribution configuration". |
| 4 | Set collection at 11:00 and received at 10:00. Try Save and next. | A warning on the field. Completing the step needs the "Collection time is after receipt" confirmation, and the saved value is unchanged. (TC-OEW-08) |
| 5 | Enter a date, go Back, then forward. | The date and time are unchanged, never blank. (TC-OEW-06) |
| 6 | Compare date formats on clinical, environmental and vector orders. | All three use the site format. (TC-ENV-05) |

### M3. Lab number

| Step | Action | Expected |
|---|---|---|
| 1 | Open Enter Order twice in two browsers at the same moment. | The two lab numbers differ. |
| 2 | Open Enter Order, then Discard without saving. | The number is recorded as unused (visible in the lab number audit), and it is never issued again. |
| 3 | Scan a pre-printed label in an allowed format. | It is accepted as the lab number. |
| 4 | Type a number in the wrong format. | A format message appears as it is entered (validateAccessionNumber on). |
| 5 | Type a number already in use. Save. | The message names the order that holds it. The other order is untouched. |
| 6 | Restart the server, then open two new orders. | There are no duplicates and no reuse. |

### M4. Label and Store merged into Prepare Samples, one save

**Setup:** an order saved on Enter Order with FBC and Liver Function Panel.

| Step | Action | Expected |
|---|---|---|
| 1 | Look at the progress indicator. | Exactly Enter Order, Prepare Samples and (if on) Sample check. There is no Label step. |
| 2 | Visit `/order/clinical/label?id=<order>`. | It redirects to Prepare Samples for the same order. |
| 3 | Add two samples. Set storage for one, and refer the other to PNGIMR. Save. | One save. On reload, samples, storage and referral are all present. |
| 4 | Repeat step 3 with the network cut mid-save. | Nothing is stored. Everything stays on screen, and a message says nothing was saved. |
| 5 | Force a storage conflict (a position already taken). Save. | Nothing is stored, the storage cell is marked, and the other entries remain. |
| 6 | Finish the order. | The dashboard shows it complete and no longer offers Continue. (TC-OEW-11) |

### M5. Footer, required levels, checklist, progress indicator (preview)

| Step | Action | Expected |
|---|---|---|
| 1 | Open Enter Order. | The footer shows Discard, Save and exit, and Save and next, in that order. There is no Save Draft. |
| 2 | Add a patient and one test only (the site requires a facility). | "Save and next" is disabled with "1 item needed to continue" beside it. "Save and exit" is enabled. |
| 3 | Look above the footer. | "To continue to Prepare Samples" lists "Add the requesting facility". Clicking it focuses the facility field. |
| 4 | Hover or tab to the disabled button. | It says what enables it. |
| 5 | Save and exit. | The dashboard highlights the order. It shows as In progress. |
| 6 | Reopen it and fill the facility. | The checklist disappears and Save and next enables. |
| 7 | Look at the progress indicator after saving each step. | A completed step shows a filled green checkmark with "Done {time}". The current step is blue with "{n} to do". No step name is cut off at 1280 px wide. |
| 8 | Reject a sample after Prepare Samples was done. | Prepare Samples shows the red warning icon and "Sample -2 rejected". |
| 9 | Use a screen reader on a required field. | It is announced as required. (OGC-1240) |
| 10 | Trigger a failed save at the bottom of the page. | The message is pinned beside the footer, not only at the top of the page. |

### M6. Sample check optional and order status

| Step | Action | Expected |
|---|---|---|
| 1 | Set Sample acceptance checklist (clinical) to Off. | The Sample check step disappears from the indicator. The admin helper says Off hides the step. |
| 2 | Complete Prepare Samples. | The order is complete. The confirmation names the lab number, and the dashboard stops offering Continue. |
| 3 | Set it to Optional. Complete Prepare Samples. | Sample check appears, and its primary action is "Release for testing". |
| 4 | Release with one item unanswered. | A reason is required, and the record shows who released it, when and why. |
| 5 | Mark one item No. | Release is disabled. The reason points to Report non-conformity or Request new sample. |
| 6 | Release. | The status is "Ready for testing", and the counter shows every step done. (TC-ODB-02) |
| 7 | Cancel an order from the dashboard. | A reason from the list (or Other with text) is required. The order and its tests show Cancelled, samples are voided, and nothing is deleted. |

### M7. Enter Order layout and clean-up (preview)

| Step | Action | Expected |
|---|---|---|
| 1 | Scan the page top to bottom. | The sections are numbered 1 to 8: Order, Patient, Requester, Request details, Tests, Samples received, Billing and notifications (only if enabled), Attachments. |
| 2 | Find priority. | It sits beside the lab number. |
| 3 | Find order date and required by. | They sit side by side in Request details. |
| 4 | Look for the old Print Labels accordion. | It is gone. |
| 5 | Save and finish, then choose New order. | The page is empty, with a new lab number and no previous patient. |

### M8. Search first and provider title

| Step | Action | Expected |
|---|---|---|
| 1 | Open Enter Order. | There is no Create new patient button before a search. |
| 2 | Search with the network off. | "Search failed. Check the connection and try again." with Retry. Create new patient stays hidden. (TC-NET-07) |
| 3 | Search for a name with no match. | Create new patient appears, and the new-patient form is prefilled from the search. |
| 4 | Search a provider "Nime" with no match (provider restriction off). | "Add new provider" appears, with the Title field first. |
| 5 | Create "Dr Nime Kaupa", then reopen the provider list. | The title "Dr" shows on the provider. |
| 6 | Turn restrictFreeTextProviderEntry on. | "Add new provider" is disabled, with its reason. |
| 7 | Search patients by the shared national ID. | Both patients are shown and can be told apart. |

### M9. Configuration gates

For each setting below, switch it off, check order entry, switch it on, check again.

| Setting | Off | On |
|---|---|---|
| `eqaEnabled` | No EQA checkbox | EQA checkbox and its four fields |
| `gpsCoordinatesEnabled` | No GPS fields | GPS on the sample |
| `useExternalPatientSource`, `enableClientRegistry` | Local search only | External and registry results included |
| `trackPayment` | No payment status | Payment status shown |
| Next visit date, test location code switches | Hidden | Shown |
| `auto-fill collection date/time` | Collection time starts empty | Collection time equals received time, marked "Defaulted, confirm" until confirmed |

### M10. Labels from presets

| Step | Action | Expected |
|---|---|---|
| 1 | Open the Labels section on an order with FBC and Coagulation Screen. | Every active preset is available, including the custom ones. The inactive preset never appears. |
| 2 | Look at the FBC sample row. | Specimen label 2, with "from Full Blood Count" on hover. |
| 3 | Look at the Coagulation sample row. | Specimen label 1 is locked, with "Set by Coagulation Screen in the test catalog". |
| 4 | Change the FBC quantity to 3 (the maximum is 4). | It is accepted and marked Changed. |
| 5 | Try a quantity above the maximum. | It needs the existing label override. |
| 6 | Print row, then Print all. | A label PDF opens (or downloads if pop-ups are blocked, with a notification). No "printed" or "generated" status appears anywhere. |
| 7 | Look for the fixed "2 order labels plus 1 per specimen" text. | It is gone. |

### M11. Numbering and wording

| Step | Action | Expected |
|---|---|---|
| 1 | Add two samples and an aliquot of the first. | They are numbered `-1`, `-2` and `-1.1`. The dot form `.1` appears nowhere. |
| 2 | Look at the samples table. | The lab number is in the heading once. Rows show the suffix badge, with the full number beneath. |
| 3 | Scan an old `.1` label. | It still finds the sample during migration. |
| 4 | Search the UI (English and French) for the old words "upstream", "Acceptance" (as a step) and "Accept". | None remain; the new wording appears where the old did. |
| 5 | Find the last step. | It reads "Sample check", with "Release for testing" and "Ready for testing". |

### M12. App shell reconnect

| Step | Action | Expected |
|---|---|---|
| 1 | Stop the server for 60 seconds while on Enter Order. | A non-blocking "Reconnecting..." shows. It recovers on its own and nothing is lost. There is no dead-end modal. (TC-NET-02) |
| 2 | Fail the test list load once. | The page says it failed and offers Retry. It never stays on "Loading tests..." forever. (TC-NET-03) |

---

## Phase 2

### P1. Container Types (preview)

| Step | Action | Expected |
|---|---|---|
| 1 | Admin → Test Catalog → Container Types. | The seeded list appears, with swatches, domain, the sample types each yields, and usage. |
| 2 | Edit K2EDTA's cap colour to red. | The swatch changes. The container itself is unchanged. |
| 3 | Deactivate a container that is in use. | The warning names the tests using it and gives the sample count. There is no delete action. |
| 4 | Turn on Show deactivated. | The deactivated container is listed. |

### P2. Expected containers and secondary sample types (preview)

| Step | Action | Expected |
|---|---|---|
| 1 | Test editor → Creatinine → Containers. | SST is Preferred. PST is Alternate, "Used as Serum". |
| 2 | Look at the Sample types block. | Primary: Serum. Secondary: "Plasma, via PST, used as Serum". |
| 3 | Try to make PST Preferred. | It is not allowed. |
| 4 | Sample Types → Plasma. | "Primary for n tests" and "Secondary for n tests", with the test names. |
| 5 | Coagulation Screen members. | They are marked "Needs its own container", with the helper "Shares a container only with tests of its own panel". |

### P3. Ordered tests table and assignment (preview)

| Step | Action | Expected |
|---|---|---|
| 1 | Order FBC, HbA1c and Creatinine, with one EDTA sample and one SST. | FBC and HbA1c show solid badge `-1`. Creatinine shows `-2`. |
| 2 | Before confirming proposals, look at the Sample cells. | Outlined "Proposed" badges. |
| 3 | Add a PST sample as well. | Creatinine shows "Choose a sample", with SST and PST listed first. |
| 4 | Put HbA1c on the SST. | Warning: "HbA1c expects an EDTA tube. This is an SST." Choosing Assign and record deviation opens the non-conformity form, prefilled. |
| 5 | Save with a test and no sample. | The save succeeds. The test shows "Awaiting sample", and the banner lists it by name. |
| 6 | Mark a test Tested elsewhere. | The value and performing laboratory appear. No sample is needed. |

### P4. Proposed samples and netting (preview)

| Step | Action | Expected |
|---|---|---|
| 1 | Turn on Samples received, with FBC, HbA1c, Liver Function Panel and Coagulation Screen ordered. | Proposed: 1 EDTA, 1 SST and 1 citrate tube. The PT/INR and APTT tests share the citrate tube. |
| 2 | Hover the Proposed tag. | It shows the reason, for example "Proposed for Full Blood Count, HbA1c". There is no reason line under the row. |
| 3 | Change the SST to a PST, then add Urea. | The edited row is not changed. A notification says what was added. |

### P5. Test and panel chooser at scale

| Step | Action | Expected |
|---|---|---|
| 1 | On a catalog of more than 1,000 tests, search "creat". | Results within 1 second, paged 25 per page. |
| 2 | Filter by lab unit Biochemistry. | Only Biochemistry tests appear. |
| 3 | Type the codes FBC, CREA and LFT into Add by code, each followed by Enter. | All three are added, and focus stays in the field. Panel codes work. |
| 4 | Type an unknown code. | An inline message appears and nothing is added. |
| 5 | Select Liver Function Panel, then remove the panel. | The panel and its only-from-panel tests go, with Undo. |
| 6 | Ten codes typed from a paper form. | Done in under 30 seconds. |

### P6. Panel integrity (preview)

| Step | Action | Expected |
|---|---|---|
| 1 | Remove ALP from Liver Function Panel before saving. | Header "Liver Function Panel, 4 of 5 tests" with Modified. ALP is struck through, with who removed it and when. The chip reads 4/5. |
| 2 | Save, then remove Albumin. | A reason is required. |
| 3 | Open Sample check. | Panels are expanded with every member listed, and the modified one is highlighted. |
| 4 | Open results entry, validation and the patient report. | Each shows "Liver Function Panel, 4 of 5 tests" with the Modified Tag, and ALP listed struck through with who removed it. |

### P7. Samples table (preview)

| Step | Action | Expected |
|---|---|---|
| 1 | Look at a row. | Collected, body site (when relevant) and storage are all visible. None are hidden in an expansion. |
| 2 | Use Fill all on Collected. | Every empty collected cell fills. The collector never defaults to the user unless "Me" is clicked. |
| 3 | Click the row icons. | Printer, SendAlt, WarningAlt and TrashCan are Carbon icons with tooltips. Each is one click. |
| 4 | Remove an unsaved sample. | It is removed immediately, with Undo. |
| 5 | Remove a saved sample. | Void asks for a reason. The row is struck through, and listed under Show voided. |
| 6 | Select two samples and choose Refer out. | One panel lists both. The per-sample tests can be chosen. |
| 7 | Refer only some tests on a tube. | A warning says the tube leaves the laboratory, and offers Aliquot first. |
| 8 | Count Tags on a row with many states. | At most 2, then "+n". |

### P8. Labels grid, full

| Step | Action | Expected |
|---|---|---|
| 1 | Open Labels with ten active presets. | Only the relevant columns show. Add label type lists the rest. |
| 2 | Turn on Show all label types. | All ten show, at zero. |
| 3 | Add an aliquot. | It gets its own row, with the per-aliquot defaults. |
| 4 | Print column Freezer. | A PDF of freezer labels for every sample. |

### P9 and P10. Body site and laterality

| Step | Action | Expected |
|---|---|---|
| 1 | Admin → Body Sites. | Coded sites are listed. The legacy method and timing rows are deactivated. "Left Lower Lobe" is split into site and side. |
| 2 | Sample type Swab set to Required, with allowed sites. | Swab samples need a body site to complete. |
| 3 | Order Throat Culture. | Body site is Throat, locked. |
| 4 | Order Wound Culture, site Wound, lower limb, Left. | The display reads "Swab, wound, left lower leg" in results entry, validation, the micro case, search and the report. |
| 5 | Check FHIR out. | Specimen.collection.bodySite carries the SNOMED CT code and the laterality qualifier. |
| 6 | Send an e-order carrying a body site code. | It matches on code. The order screen shows it for confirmation. |
| 7 | Turn on the WHONET site column and export. | The site and side are exported. |

### P11. Summary strip and folding (preview)

| Step | Action | Expected |
|---|---|---|
| 1 | Complete Patient, then move to Requester. | Patient folds to one line with Edit. |
| 2 | Leave a required field empty in Requester and move on. | Requester does not fold. |
| 3 | Read the summary strip. | Patient with two identifiers, the requester, and counts such as "6 tests: 5 with sample, 1 awaiting, 2 referred". |
| 4 | Click "1 awaiting". | It scrolls to and highlights that test. |

### P12. Sample check evidence (preview)

| Step | Action | Expected |
|---|---|---|
| 1 | Expand sample `-1`. | Each checklist item sits beside its evidence: identity, container against expected, volume, timing, body site and condition. |
| 2 | Read the volume evidence for FBC plus HbA1c. | "Full Blood Count needs at least 2 mL; HbA1c needs at least 1 mL; tests need 3 mL in all; recorded 3 mL". |
| 3 | Look at an item with no recorded data. | "Not recorded. Add it in Prepare Samples." |
| 4 | Look for a label item. | There is none. Labels are not tracked. |

### P13. Edit through the steps and dashboard

| Step | Action | Expected |
|---|---|---|
| 1 | Open the old Modify Order menu URL. | It redirects to the order's Enter Order. |
| 2 | Change lab number, with a reason. | Old and new numbers are confirmed, samples are renumbered, and the user is prompted to print new labels. |
| 3 | Refer 2 of 6 tests on an order and continue the others in the laboratory. | The dashboard row shows the laboratory progress icons and "2 tests referred to PNGIMR, in transit". |
| 4 | Filter "Has referred tests", then "Referral results pending". | The split order appears in both. |
| 5 | Complete the in-laboratory tests. | The order is complete. The referral line stays visible until its results return. |
| 6 | Search the dashboard by the referring laboratory number. | The order is found. |

### P14. Legacy features and electronic orders

| Step | Action | Expected |
|---|---|---|
| 1 | Open an e-order (external orders on). | Everything is prefilled. An order without a specimen opens with Add sample focused. |
| 2 | Open `/SamplePatientEntry?ID=...`. | It redirects to Enter Order with the same order. |
| 3 | Turn billing on. | Billing reference and a Paid toggle per test. The Unpaid dashboard filter works. |
| 4 | Turn result notifications on. | Notify patient and Notify provider appear per test, with channels. |
| 5 | Turn contact tracing on. | The index case fields appear and print on the report. |
| 6 | Remove an attachment on a saved order. | A reason is required. It shows under Show removed. |

### P15 to P17

| Slice | Key checks |
|---|---|
| P15 Connectivity | A page reload restores unsaved entries ("Unsaved entries from 10:42 were restored"). Signing out clears them. Another user on the same browser never sees them. |
| P16 Consent and holding time | With consent on, the consent section is required to complete. Holding time turns warm-gray at 20% remaining, and red when exceeded, with the non-conformity form prefilled. It never blocks. |
| P17 Environmental and vector | Both use the shared samples table (QC child rows, vector pool group row) and the same footer and save rules. G10 still passes. |
