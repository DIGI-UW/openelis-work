# Spec Analysis: Result Delivery FRS v0.1

**Date:** 2026-10-15
**Scope:** `result-delivery-frs.md` v0.1, `result-delivery-preview.html`, the three sibling FRSs edited today (Patient Report v2.5, Report Print Queue v2.3, Locations & Organizations v0.4), Admin Redesign FRS, Users and Roles FRS, decision log, spec registry, OpenELIS-Global-2 develop at `7472c30`, privilege catalogue in PR #3443.
**Passes run:** A, B, C, D, E, F, G, H, I, J, L, M, N, O. K skipped (no breakdown yet).

**Status (2026-10-15, later the same day):** resolved in Result Delivery FRS v0.2, with the sibling updates Report Print Queue v2.4, Patient Report v2.6, Locations & Organizations v0.5, Admin Redesign v1.1 and Users and Roles Appendix A. Casey's answers: D-1 versions at issue (as recommended); D-2 central delivery removed from Result Delivery and left to the Results Portal specs; D-3 new `distribution_list:manage` (as recommended); D-4 the ready notice may include the patient's first name. Decision IDs below are the v0.1 numbers; v0.2 moves every Result Delivery decision up by two (for example D-224 here is D-226 in v0.2) because the shared ledger already holds D-220 and D-221.

## Summary

The design holds up: there are no contradictions in the product model, and most code claims check out against develop. The gaps are in four places:

1. **Versions.** Automatic delivery assumes a new version exists when results are released, but the print queue only creates versions when something is printed. Amended is also defined by what was *printed*. Emailed results therefore never become Amended and never trigger a resend.
2. **Undeclared data.** Several new data elements the requirements depend on are not in Information & Data: per-order contacts, template locale and slots, alert rule recipients and escalation, attempt history, a batch email covering several reports, and channel fields.
3. **Localization.** The Localization table covers well under half the strings in the preview. It also references other features' keys and lacks the REUSE/NEW column.
4. **Privileges.** `alert:manage` already means "acknowledge and resolve alerts" in PR #3443. Distribution list upkeep sits in the Administration group, so maintaining a contact list would make someone an administrator.

The Admin Redesign FRS needs a set of edits, listed at the end. Four findings need a product decision from Casey (marked **Decide**). Everything else has a clear fix.

## Findings

Source IDs in brackets are the reviewer pass IDs. Line numbers refer to `result-delivery-frs.md` (RD) unless another file is named. PR = Patient Report FRS v2.5. RPQ = Report Print Queue FRS v2.3. L&O = Locations & Organizations FRS v0.4.

### CRITICAL

| ID | Pass | Location | Issue | Fix |
|---|---|---|---|---|
| F-01 | M | RD Navigation table l.62-67 | Admin breadcrumbs read `Home / Admin / Notifications / ...` and `Home / Admin / Locations & Organizations / ...`. Active GLOBAL D-013 and Admin Redesign AF-11 require "Admin Management", and L&O l.63 already uses it. | Change to `Home / Admin Management / Notifications / <page>` and `Home / Admin Management / Locations & Organizations / Organizations`. |
| F-02 | A, D | Localization table l.296-390 vs preview, all 9 screens | Most visible strings in the preview have no key. Gaps by screen: **Print queue:** Sent column and filter, "Send selected". **Send dialog:** column heads, recipient kinds, "Will be skipped". **Sent Messages:** columns, filters, expansion headings, acknowledgement lines. **Channels:** fields, test sends. **Lists:** "Add member", "Used by rules". **Settings:** section titles and helpers. **Templates:** "Insert field", character counter, "Restore default". **Organization:** delivery tags, select options. **Order entry:** patient message labels. **Alert rule:** columns, recipient kinds. Requirement texts also have no keys or default templates: "Email is not set up", the history line, report email and SMS bodies, expired-link and acknowledgement pages, load error and Retry. [A-01 to A-05] | Add keys for every string, and add the default text of every template slot to the table, as FR-A15 requires. |
| F-03 | D (Constitution VII) | RPQ §9 l.817; L&O l.471; RD Localization | RPQ reuses `delivery.send.button`, and L&O says its keys are "owned by Result Delivery". Constitution VII forbids cross-feature key references. RD's table also has no REUSE/NEW column, and it mints generic words ("Show", "Copy", "Replace", "Email") that `common.*` and `admin.common.secret.*` already cover. [M-14, M-15] | RPQ mints `reportQueue.action.send`. Either L&O mints `label.locations.delivery.*`, or RD declares the Result delivery section as a shared component that carries its own keys. Add a REUSE/NEW column to RD and reuse `common.*` and `admin.common.secret.*`. |
| F-04 | G | FR-B8 l.123; Information & Data l.246-253 | An address typed at order entry applies "to that order only", but nothing stores it. Today `SampleOrderItem.referringSiteEmail/Phone` is a form field that overwrites the Organization (`SamplePatientUpdateData.java:708-716`). [C-01] | Declare per-order referring-site email and phone as new data, or reuse `NotificationConfigOption.additionalContacts` and say so. |
| F-05 | G | FR-A13, FR-A15, FR-E3 | Templates per language, per recipient kind, per product, and a body override per rule are not declared. `NotificationPayloadTemplate` has no locale column, and `TestAlertRule` has no message field. [C-02] | Declare template locale, the new payload types and slots, and the per-rule body override. |
| F-06 | G | FR-E2, FR-E6, FR-E7 | Alert rules get distribution lists, escalation on/off and an escalation time limit, but none is declared. `TestAlertRule` has only the notify flags, custom phone/email and `acknowledgmentRequired`. [C-03] | Add these to New information. |
| F-07 | G | FR-A8, FR-A10, FR-C6, I&D l.250 | Three undeclared changes. **(a)** "Each attempt's time and error" is required, but `NotificationLogChannel` keeps only a count and the last error. **(b)** One batch email carries many report versions, but I&D links one version per message. **(c)** `NotificationChannel` has no SMS value. [C-04] | Declare an attempt history table, a many-to-many link from message to report version, and the SMS channel value. |
| F-08 | G | FR-A2, FR-A3 | SMTP security mode, reply-to, TextIt API address, token and channel UUID are not held by `ExternalConnection`. Its `BEARER` auth type is commented out, and there is no TEXTIT `ProgrammedConnection`. [C-05] | Declare the fields, the new programmed connection and the auth type. |
| F-09 | J | FR-G4 l.184 | Export and import of recipients, lists and templates is a write action with no privilege. It also conflicts with L&O FR-N5 ("the delivery password never imports or exports"), but the central service needs passwords to protect PDFs. [C-10, M-06] | Give it `notification:manage`. How the central service gets passwords is decision **D-2** below. |
| F-10 | M (ledger) | decision-log D-006 vs RD D-233 | D-006 ("no invented per-action permission keys") is still active, and the addendum's "Binary admin" line still makes per-action codes auto-CRITICAL. Every analyze run on RD, RPQ, L&O or Users and Roles will flag this until the ledger changes. The FRS itself is correct. [M-13] | Mark D-006 superseded by D-233 and update the addendum line in the same edit. |

### HIGH

| ID | Pass | Location | Issue | Fix |
|---|---|---|---|---|
| F-11 | M | RD FR-C2 l.131, FR-C4, AC-6/7 vs RPQ FR-4.3 l.405, PR FR-A41 | **Decide (D-1).** RD reacts to "a new version ... released", but RPQ creates a version only "each time a report is printed with content that differs". With no print, automatic delivery has no version event to react to. [M-02] | Recommended: versions are created at *issue*, meaning print, Send or automatic delivery. After the hold, the pipeline creates and archives the version and sends it. Add the FR and AC to RPQ. |
| F-12 | F | RPQ FR-4.4, FR-6.2, BR-3, §6.2; D-140 | Amended means "a result that was **printed** has changed". Two consequences: an emailed result that is later corrected is not Amended, so FR-C4 never resends it; and printing after an automatic send creates a duplicate v2. [M-03] | Replace "printed" with "issued (printed or sent)" throughout RPQ and in D-140. Send events go in the issue history. |
| F-13 | M | RD FR-C5 l.134 vs RPQ FR-6.13, RPQ AC-30 | RD allows Send only "for rows with at least one released version", while RPQ lets Send create the version, and RPQ AC-30 tests exactly that. [M-04] | Align RD FR-C5 with RPQ. |
| F-14 | F | FR-F1 l.171, AC-21 vs D-150 | The ready notice fires when the report is "Final", but under D-150 Amended wins and stays. An order corrected while still partial never becomes Final, so its patient never gets a notice. [M-05] | Trigger on "all counted analyses released (Final, or Amended with every result released)". Use the same wording in FR-G5. |
| F-15 | F | PR FR-A61 l.130, RD FR-C10, D-225 | Masked mode removes name, national ID, address and phone, but the page 1 card also prints the contact-tracing index name and record number (`useContactTracing`). A masked copy would show another person's full name. Billing and ST numbers are not decided. [M-09] | List every card and strip field in FR-A61 and FR-C10. Drop the contact-tracing fields when masked. Add an AC with contact tracing on. |
| F-16 | M | FR-G2, FR-G4 vs PR FR-A61, L&O FR-N5 | **Decide (D-2).** Central delivery publishes only the archived PDF in `presentedForm`, so the central service cannot make a masked copy and has no passwords for protected copies. [M-06] | Option 1: OpenELIS also publishes the masked rendering and hash, and passwords go over a secured FHIR exchange, never the export file. Option 2: Central sends masked copies only. |
| F-17 | M | FR-A16 Delivery Settings, FR-A2 vs Admin Redesign D-199, AS-20, CF-5, App. B | Admin Redesign says every setting lives on one Configuration page, with one editor per value. RD adds a second settings page and moves `mail.from` into Channels, with no coordination recorded. [M-10] | Put lab-wide delivery settings in Configuration's Notifications area (store as `site_information`, see F-35) with a link from Notifications. Alternatively, record a D-199 exception in both FRSs. Configuration shows `mail.from` read-only with a link to Channels. |
| F-18 | J | Privileges l.276 vs Users and Roles UR-F5 | **Decide (D-3).** List membership sits under `notification:manage` (Administration), so a surveillance officer keeping "Provincial Health Office: Cholera" current becomes an administrator. [M-11, C-13] | Recommended: NEW `distribution_list:manage` in Quality, granted by default to roles with `alert:view`. |
| F-19 | J | Privileges l.284; Access l.266 | `alert:manage` already means "Create, acknowledge, and resolve alerts" in PR #3443 (012-003) and stays admin-only (012-004e). Reusing it for rule authoring hands Test Catalog editors acknowledge/resolve on all alerts. Today rule editing is gated by Test Catalog access (`TestAlertRuleRestController`). [C-11] | Use `test:configure` for alert rule authoring, matching today. |
| F-20 | O | FR-B1 l.116, Pain l.27 | The Pain says the facility email "is on file but nothing sends to it", yet FR-B1 adds a separate report email field beside `Organization.email`. Facilities would still get nothing until someone types the address again. [C-19] | On upgrade, seed report email from `Organization.email` (one value, no copy if it stays the same field). |
| F-21 | O | FR-F1, FR-B6 | Order entry already has per-test provider Email/SMS boxes (`OrderResultReporting.jsx`, PROVIDER options on `AnalysisNotificationConfig`). RD never mentions them while making the clinician a default recipient, which leaves two switches for "notify the clinician". [C-20] | Remove the provider boxes. The ordering clinician is a recipient through FR-B6, and existing provider ticks migrate to "include the clinician for this order". |
| F-22 | G | FR-F4, FR-F5, I&D l.236 | Patient SMS reads `Person.cellPhone` and checks for "a mobile number", but the patient form stores only `primaryPhone`. Test Notifications already uses `primaryPhone`, and OpenELIS has no mobile flag. [C-06] | Use `primaryPhone`, falling back to `cellPhone` as `TestAlertEvaluationServiceImpl` does, and drop "mobile". |
| F-23 | Consistency | FR-D1 l.150, D-224 vs FR-D2, AC-19, AC-10 | FR-D1 says the patient name never appears in any message. FR-D2 and AC-19 allow the name to lists marked "May receive patient identifiers", and FR-D2 allows the patient's first name to the patient. [X-01] | Word FR-D1 and D-224 with both exceptions, and fix AC-10. |
| F-24 | Consistency | FR-A16, FR-C8, key `delivery.format.link`; L&O FR-N3 | The "default report format for recipients with no password" can only ever be Masked, since Protected needs a password. "Secure link" is listed as a format, but it is a way of delivering, not a third format. L&O has no tag for automatic delivery of masked copies. [X-02, M-19] | Drop the default-format setting (no password always means masked). Recast secure link as a delivery method. Add an "Automatic, masked" tag in L&O. |
| F-25 | E | Acceptance Criteria l.394-426 | Several FRs have no AC, including privacy and safety controls: FR-A8, A14 (save refused for a disallowed merge field), B6, C14, C15 (never send unreleased), F5, G3, H2 (secret migration), J1. FR-A1, A3, A4, A11, A13, A17, B7, B9, C1, E3, G4, G5, H3 also have none. [E-01] | Add ACs for the first list, and fold the rest into existing ACs. |
| F-26 | B | Preview, all tables and forms | The preview uses raw HTML tables, hand-made expand arrows and checkboxes, custom modal, toasts and notices, and hard-coded hex and px values. It is a preview, but it is the visual source for the JSX mockup. [B-01 to B-04] | In the JSX mockup at handoff, use `DataTable` with expand/select rows and batch actions, `ComposedModal`, Carbon notifications, form components with `invalidText`, and tokens. No change to the preview is needed now. |

### MEDIUM

| ID | Pass | Location | Issue | Fix |
|---|---|---|---|---|
| F-27 | H | Overview l.54, FR-G2 to G4, D-232 | The central service holds every lab's recipients and sends for them, but the FRS never says it is outside OpenELIS. D-232 says "chosen per lab". [M-07] | Add that the central service is not an OpenELIS deployment and has no view inside OpenELIS. The switch is per deployment. |
| F-28 | M | l.54 vs FR-G2, FR-A16; RPQ Sent column | Whether the switch covers only reports or all three products is inconsistent. Nothing says how centrally sent messages reach Sent Messages and the version history, which leaves an ISO 15189 record gap. [M-08, X-08] | One switch for all three products, labelled "Where messages are sent from". The central service reports status back (FHIR Task or Communication), which is written to Sent Messages. |
| F-29 | Consistency | FR-B1, FR-C6, AC-11; L&O FR-D1 | It is unclear whether a ward's addresses replace or add to the facility's. Wards also have no number and no password. [E-05, M-23] | Recommended: ward addresses are added to the facility's. Wards use the facility password and have no SMS number. Reword AC-11 to count emails per address. |
| F-30 | Consistency | FR-C8, FR-C10, AC-17; RPQ FR-6.5 | Environmental and vector certificates have no patient, so masking means nothing, yet AC-17 sends a "masked copy". Certificate attachment names (`LH-{labNo}-Am{n}.pdf`) are not covered. [X-09, M-24] | Add FR-C16: a certificate with no password is sent as issued, and one with a password is protected. Add certificate attachment names. |
| F-31 | Consistency | FR-F2, D-229, key, preview Templates | The notice is "identical for every order", but the preview template uses `{patient_first_name}`. Merge-field names differ between the keys and the preview (`{lab}` vs `{lab_name}`). [X-07] | **Decide (D-4)**, then align FR-F2, D-229, the key and the preview, with one set of merge-field names. |
| F-32 | Consistency | FR-E2, FR-D2, AC-23a | FR-D2 lets results reach patients when the test "allows" it, which also covers "when the order asks", but FR-E2 and the preview use only "Result by default". AC-23a can produce two result SMS for one patient. [X-06] | Make FR-D2 explicit. An alert instruction replaces the include-result message for the same result, and add an AC for that. |
| F-33 | Consistency | FR-F1 vs preview order entry; Overview l.50 | The preview promises a ready notice when the only ticked test already sent its result, which FR-F1 forbids. The Overview "When" for product C omits the at-validation result message. [X-05] | Fix the preview note and the Overview row. |
| F-34 | Consistency | FR-A10, key `delivery.product.trigger`, l.73, FR-H3; preview filters | The referral product has four names ("Referral and other trigger events", "Notification", "Trigger", `?product=trigger`), and the redirect target differs between l.73 and FR-H3. The filters lack "Test" and "Sent". [X-04, M-32] | One label ("Trigger event"), one URL value, and a list of allowed `product=` and `status=` values in FR-A10. |
| F-35 | O | FR-A16, I&D l.253 | Lab-wide delivery settings get no storage. The built mechanism is `SiteInformation` / `ConfigurationProperties`. [C-23] | Declare them as `site_information` entries. |
| F-36 | O | FR-F4, FR-F3 | A new per-test Patient messages field is added while the built per-test store (`TestNotificationConfig`, `NotificationConfigOption`) is retired. [C-24] | Either extend `TestNotificationConfig` with the three-value setting, or state why a new field fits better. |
| F-37 | O | FR-A12 | "Reuses `NotificationLogServiceImpl.resend`", but that method rejects rows with no FAILED channel and has no SMS case and no attachments. [C-21] | Say "widens", and list Sent/Skipped, SMS and attachments. |
| F-38 | O | FR-H2 vs I&D l.240 | "Rows are moved into Channels" implies a new store, but Channels is a UI over the same `external_connection` rows (one per type, enforced). [C-22] | Say so: no data move. |
| F-39 | O | RD-X2 l.200, FR-E1 | Alerts also fire at entry from `LogbookResultsRestController.java:602,609` and from calculated results at `ResultEntryRestController.java:382`, not only `:375`. [C-25] | List every entry point. |
| F-40 | J | Privileges l.290; Users and Roles Appendix A | The `delivery` and `delivery_password` categories are not in Appendix A, so they would fall into Other. [M-12, C-14] | Rename to `delivery:view_password` (one category), and add `delivery` to Reports in Appendix A. Update L&O l.270 and l.308. |
| F-41 | J | Privileges l.275 | Channel credentials are governed today by `extconnection:manage`, not `notification:manage`, so "As today" is wrong. [C-15] | State the move: Channels needs `notification:manage`, with the default "roles with `extconnection:manage`". |
| F-42 | J | Privileges l.285, FR-E7, AC-20 | `alert:view` already goes to Reception, Results, Validation and Reports in #3443, so escalations reach more people than "validators", and they cannot acknowledge. [C-12] | Default "as today". Align AC-20, and say who can clear an escalation. |
| F-43 | F | L&O FR-N2 | Generate and Change of a delivery password need only `delivery_password:view`, so print-queue users could change a facility's password. [M-18] | Generate and Change also need `organization:manage`. Same in RD FR-B3. |
| F-44 | M | FR-A5, FR-B3 vs Admin AS-31 | AS-31 says secrets are never sent to the browser. Delivery passwords are the deliberate exception (D-223), but Admin Redesign does not record it. [M-17] | Record the exception in Admin Redesign AS-31. |
| F-45 | F | RPQ Sent column, FR-F5, §K | The RPQ Sent column has no Skipped state, and FR-F5's "Patient notice not sent: no contact" has no home in RPQ. [M-20] | Add both to RPQ and to RD §K. |
| F-46 | F | FR-A12 vs RPQ FR-8.4 | It is undefined which password re-encrypts a Resend after a password change. [M-21] | Resend re-encrypts the archived version with the current password and records the set date. |
| F-47 | F | FR-A10, Access vs RPQ BR-9 | Print queue rows are scoped to the user's lab units, but Sent Messages, which shows the same reports' content, has no scope rule. [M-22] | Apply the RPQ BR-9 scope to report and alert rows. |
| F-48 | F | PR FR-A14, FR-A40 vs RPQ FR-4.4; RPQ FR-4.6 | The corrected banner still uses `document_track` and "changed after first issued", which differs from RPQ's Amended rule. RPQ FR-4.6 predates PR FR-A15a. [M-25] | Point PR FR-A14 and FR-A40 at the RPQ issue history. Update RPQ FR-4.6. |
| F-49 | M | FR-E6, I&D `acknowledgmentRequired` vs D-155 | The existing `TestAlertRule.acknowledgmentRequired` is tied to Critical Acknowledgment. FR-E6 adds an external receipt acknowledgement, and it is unclear which field is used. [M-26] | A separate field, "Ask recipients to confirm receipt", which never writes `critical_callback`. |
| F-50 | M | spec-registry M-16; RD §K | Microbiology M-16 relies on Test Notification recipients, which RD retires. [M-27] | Add M-16 to §K: it uses Distribution Lists and the outbox. |
| F-51 | M | RD §K | The Navigation Redesign FRS (main menu Appendix A.1) is not in §K, although Sent Messages adds a main-menu entry. [M-28] | Add the row with `sidenav.label.reports.sentMessages`. |
| F-52 | M | FR-A2, FR-A3, FR-H vs Admin App. B | `mail.bcc` and `twilio.from` ship on develop and RD says nothing about them. A kept BCC would copy every report to an unlisted address. [M-29] | Retire BCC. Keep Twilio as an SMS gateway option, or retire it, in FR-A3. |
| F-53 | D | FR-B7, FR-H1, preview Lists and Alert rule | There is no way to deactivate a list member, no Active state on templates, no "show inactive" on rules, and no Status filter required on lists (although the preview has one). [D-01 to D-03, M-30] | Add Deactivate per member, an Active state on templates, and "Show inactive" toggles hidden by default. State the list Status filter in FR-B7. |
| F-54 | E | AC-4 vs FR-A7 | AC-4 says "never sent twice", but email and SMS cannot promise exactly-once after a crash between gateway acceptance and the status write. [E-04] | Say at-least-once in FR-A7 and drop "or sent twice", or name the idempotency key. |
| F-55 | E | Preview vs FR-A1, A6, B3, C15, D3, E3, F3, F5, G1, G4, J1 | Missing states in the preview: Failing channel, test-send error, first Generate, older-version prompt, directory picker in Send, rule body override, read-only include-result, no-contact notice, Import, expired-link and acknowledgement pages, empty and error states. Some preview elements also have no FR: Sent column and filter, Organization Delivery column, Connection column, "Used by rules", order entry "Facility: Automatic". [E-02, E-03] | Add the states to the preview and the untraced elements to FRs (and to §K for OGC-1031). |
| F-56 | I | Preview Print Queue, Lists, Sent Messages | Placeholder expansions: the Amended and Queued rows (exactly the FR-C2/C4 cases) and list rows 2-3 show "{n} members ...". Every non-alert Sent Messages row expands to the same report email, including ready notices and skips. [I-01, I-02] | Fill each with its own content. |
| F-57 | C | Preview Settings, Facility | Switching to Central and changing a password use inline warning text, but these are consequential confirmations where a Modal is sanctioned. [C-01] | Use `Modal danger` with a named primary button. |
| F-58 | B | FR-J2, preview tags | Queued is blue (the catalogue says purple for pending), Amended is magenta, and "No report email" is warm-gray (Intermediate). [B-05] | Queued purple. Reuse OGC-1031's state tags. "No report email" in gray. |
| F-59 | B | Preview `.rowlink` spans | Row actions are `<span onClick>` and cannot be reached by keyboard, against FR-J3. [B-06] | `Link`, ghost `Button` or `OverflowMenu` in the JSX. |
| F-60 | Consistency | FR-C14, FR-E6, FR-A15, header, §K; headings | Cross-references are wrong: links are §G not §F, language is FR-B1 not FR-B2, and "§15" does not exist. §K's "(FR-A16)" means OGC-1111's FR and collides with RD's own. Double-lettered headings ("C. A.") invite these slips. [X-03, M-35] | Fix the references, prefix sibling FR IDs, and rename the headings. |
| F-61 | Consistency | FR-A16, FR-G1, FR-G3, FR-E6 | Links and Central need a public address and a central service address, but neither is a field. The preview alert carries a link while Settings says "no public address". [X-11] | Add both fields to FR-A16 and to the preview. |
| F-62 | Consistency | FR-A16, FR-C10, §K | The lab contact has two sources: the Delivery Settings contact line and OGC-1111 `additionalSiteInfo`. [X-12] | One source: `additionalSiteInfo` (Admin RM-8), read by Delivery. |
| F-63 | Consistency | Preview Templates vs FR-D2, FR-A14 | The shipped report body uses `{report_list}`, which is not an allowed field, so FR-A14 would refuse it. It also says "protected" for masked recipients. [X-13] | Add `report_list` to FR-D2. The protection sentence depends on the format. |
| F-64 | Consistency | Preview Sent Messages vs FR-A7, A9, A10 | One alert to a 3-member list appears as one row, so a single member's failure or skip has no place to show. [X-14] | One outbox row per recipient per channel, grouped per rule firing in the display. |
| F-65 | A | Localization keys | Keys lack the category prefix. `delivery.test.*` means both a test send and the Test Catalog setting. Counts have no plural forms, and "No {channel} address" splices a channel name into a sentence. `delivery.masked.banner` duplicates PR `report.patient.masked.line`. [A-06, A-07, M-16] | Category-prefixed keys, ICU plurals, one key per channel skip reason. Reuse the PR key. |
| F-66 | B | FR-B3, AC-14, L&O FR-N2 | It is not said whether the hyphens in `K7M-PQ4-RTW-9XF` are part of the PDF password. [M-33] | Hyphens are display only; the password is 12 characters. |
| F-67 | N | RD (no Docs Impact section) | Shipped manual pages change: `laporan-hasil-report`, Test Notification Configuration, Notification Triggers, External Connections, Organization Management, the order entry Result reporting block, and Test Catalog alerts. [M-31] | Add a Docs Impact section. |
| F-68 | G | FR-H1, FR-E7 | Test Notification patient settings "become ready-notice defaults", but no target store exists. Escalation "in the lab unit" relies on `Alert`, which has no lab-unit field. [C-07, C-08] | Name the target value, and either declare lab-unit scoping or reuse role notification. |

### LOW

| ID | Location | Issue | Fix |
|---|---|---|---|
| F-69 | I&D l.250 | "Sent by user" and the resend chain already exist (`triggered_by_user_id`, `resent_from_id`). [C-09] | Move them to Reused. |
| F-70 | Privileges l.277-280 | The `report:run` default also covers EQA Coordinator, who would be able to reveal any facility password. [C-17] | Confirm, or exclude. |
| F-71 | FR-A10, FR-H3 | Trigger rows, admin-only today, become visible to all `delivery:view` holders. [C-18] | State the widening. |
| F-72 | Privileges l.281 | `organization:manage` is described in #3443 as "Import and export organization data", which conflicts with L&O's `organization:import`. [C-16] | Ask #3443 to describe it as "Create and edit organizations". |
| F-73 | Navigation l.60-73 | `notificationTriggerConfig` is one route with tabs today, and `/ReportPrintQueue` is not on develop. [C-27] | Mark these as new routes and redirect the tab. |
| F-74 | FR-B2 note, Current State l.22, FR-B3, FR-A7 | Code facts are slightly off. `getRequestorEmail()` is used, just not for notifications. Alerts also send SMS. The encryption mechanism is not named (`EncryptionConverter`). The outbox has a built pattern to follow (`ReportingWorker`). [C-26, C-28 to C-30] | Correct the wording. |
| F-75 | FR-C6 vs D-005 | The Send modal edits as well as confirms. [M-36] | Record the exception (sending cannot be undone). |
| F-76 | FR-C13 | One batch subject carries one state, but a batch can mix Partial, Final and Amended. [M-38] | Lead with Amended if any report is amended, and list the states in the body. |
| F-77 | RPQ header, §10; RD l.9 | RPQ cites OGC-1111 v2.2 and has no RD dependency row. RD's "X-01" collides with Admin Redesign X-01. "Send selected" vs "Send". [M-37] | Update the references and align the label. |
| F-78 | AC-29, AC-20, I&D l.253 | Wording drifts from the FRs: interface vs recipient language, "validators" vs `alert:view`, settings placed on Channels vs lab-wide. [X-16] | Align. |
| F-79 | Preview data | The Amended row has no automatic v3 send. The alert to an identifier-allowed list has no name. The 9 Mile example contradicts AC-9. [X-15] | Correct the sample data. |
| F-80 | Lab Context l.31, l.36 | "ISO 15189", "partial reports" and "Report Print Queue" are not explained for a non-LIMS reader. [L-01] | Add one-line explanations. |
| F-81 | Ledger D-228 | The ledger says "Messages" fire on validation only, which would also block referral triggers. The FRS says "Alerts". [M-34] | Align the ledger. |
| F-82 | FR-A8 key text, preview | Key fallback texts differ from the preview text in a few places. [A-08] | Match them. |
| F-83 | Preview chips, merge fields, FR-F4 tooltip | Custom chips, and a native `title` tooltip on a disabled checkbox. [B-07] | `DismissibleTag`, `Toggletip` in the JSX. |

## Constitution violations (block delivery)

- **F-01:** breadcrumb label contradicts GLOBAL D-013.
- **F-02:** i18n (Principle VII). Most preview strings have no key.
- **F-03:** cross-feature key references (Principle VII, Key Reuse & Hygiene).
- **F-04 to F-08:** undeclared new data (design addendum MUST A).
- **F-09:** a write action with no privilege.
- **F-10:** ledger still carries active D-006, which contradicts the nominated-privileges rule.

## Decisions needed from Casey

| # | Question | Recommendation |
|---|---|---|
| D-1 | When is a report version created? | At issue: print, Send or automatic delivery. Amended means an issued result changed. This changes RPQ FR-4.3/4.4 and D-140. |
| D-2 | How does central delivery handle protected copies? | OpenELIS publishes both renderings. Passwords go over a secured FHIR exchange, never a file. Central reports send status back. |
| D-3 | Who maintains distribution lists? | NEW `distribution_list:manage` in Quality, not Administration. |
| D-4 | May the patient ready notice include the patient's first name? | No. Keep it identical for every order, which is safer on a shared phone. Drop `{patient_first_name}` from the notice (the result message under "Result by default" can keep it). |

## Admin Redesign FRS edits needed

1. **§3.1 and register A-04/A-05:** replace "Test Notifications" and "Notification Triggers" with one group, **Notifications › Channels · Templates · Distribution Lists · Delivery Settings · Triggers**. The governing spec is Result Delivery.
2. **§9.2:** `testNotificationConfig*` becomes Remove after FR-H1 and redirects to Templates. `notificationTriggerConfig/sent` becomes Merge and redirects to `/SentMessages?product=trigger`.
3. **AF-5, L-07, AF-AC-1, §7 type F, Appendix A:** rename the entry to "Notifications" (five children). Sent Messages moves to the main menu under Reports.
4. **A-01:** External Connections loses the SMTP, BMP, SMPP and WhatsApp types. Add a §10 defect for RD-X3 (password returned by GET).
5. **AS-31:** record the delivery-password exception (D-223).
6. **D-199, CF-5, App. B:** place Delivery Settings (see F-17). `mail.from` is owned by Channels. Map `bmp.provider` and `twilio.from` to Channels. Record the `mail.bcc` decision.
7. **N-7, §15.1:** new sub-routes, and the key `sidenav.label.admin.notifications` with its five children.
8. **RM-8:** helper text to put the results phone or email in the additional site information line (the PR FR-A62 target).
9. **§20 Docs Impact:** add Test Notification Configuration, Notification Triggers and External Connections.
10. **§17:** Admin Redesign D-190 to D-202 collide with ledger IDs. Renumber them from D-234.

## Registry upkeep

- **Result Delivery row:** add the main-menu placement and the downstream specs (M-16, Navigation Redesign A.1, Admin Redesign, Users and Roles Appendix A). Add the shared concepts: report states, issue history, masked copy owned by PR FR-A61.
- **Missing rows:** add rows for Admin Redesign and Users and Roles.
- **Other rows:** mark Test Notification as retiring. Update the Test Catalog Alerts, RPQ, PR and L&O rows to match today's changes.
- **admin-ia-inventory:** add `notificationTriggerConfig/*`, `/SentMessages`, `/ReportPrintQueue`, `locations/*` and `externalConnections`.
- **Decision log:**
  - Supersede D-006 with D-233.
  - Amend D-140 ("issued", per D-1), D-228 (wording) and D-232 ("per deployment").
  - New candidates: an AS-31 exception for delivery passwords, a D-005 exception for Send, and "versions are created at issue".
  - Renumber the colliding Admin Redesign and Users and Roles IDs.

## Verified accurate

The Lab Context structure is sound. FR, AC and decision IDs are unique. Routes and breadcrumbs match the preview, and the status set is used the same way everywhere. There is no hard delete. The privilege codes marked existing are all in PR #3443, and the five new codes are well formed with no collisions.

Code claims confirmed at `7472c30`:

- The Test Notifications template contains the result, and the code uses the literal "someAddress".
- Alerts fire at result entry, and the notify flags are never read.
- `sendWithRetry` makes 3 attempts in-thread.
- `AsyncNotificationDispatcher` writes no log.
- `EmailNotificationSender` sends `SimpleMailMessage` only, with STARTTLS always on.
- The connection password is returned by GET.
- Order entry overwrites the Organization.
- `Sample.referringId` holds the requester's order number.
- No outbox and no distribution lists exist today.

## Recommended fix order

1. The four decisions (D-1 to D-4), since F-11, F-12, F-16, F-18 and F-31 depend on them.
2. CRITICAL: F-01 to F-10. Mostly FRS and ledger text, plus the Localization table rebuild.
3. HIGH: F-11 to F-25, applied across RD, RPQ, PR and L&O together. F-26 lands in the JSX mockup at handoff.
4. Admin Redesign edits (separate update, same day if possible).
5. MEDIUM and LOW, folded into v0.2. The preview gets the missing states and real expansions.
