# Result Delivery: Functional Requirements Specification

**Version:** 0.1 (first draft from the critique)
**Date:** 2026-10-15
**Author:** Casey, Director of Product (drafted with Claude)
**Status:** Draft, for review
**Source:** `result-delivery/result-delivery-critique.md` (revision 2, decisions of 2026-10-15)
**Supersedes, in part:** `designs/notifications/email-notification-integration.md` v1.2 and `designs/notifications/textit-sms-integration.md` v1.2 (OGC-439, OGC-437: their parallel tables, per-result messages and admin layout), `designs/notifications/notification-admin.jsx`, and `designs/reports/lh-delivery-sent-messages.md` v1.1 (OGC-587: its delivery model; its secure link and Sent Messages ideas are carried here)
**Related:** Report Print Queue (OGC-1031), Patient Report and Report Management (OGC-1111), Locations & Organizations, Users and Roles (PR #3443), Test Catalog Alerts (OGC-763 / OGC-949), Admin Redesign register rows A-01, A-04, A-05, Referral-out notification (X-01), FHIR Implementation Guide
**Decisions:** D-220 to D-233 (§15)
**Preview:** `result-delivery-preview.html`
**Checked against:** `DIGI-UW/OpenELIS-Global-2` `develop` at 7472c30 (2026-10-15)

---

## Lab Context

### Current State

When a laboratory finishes testing a sample, someone has to get the result to the person who acts on it. For patient samples that is the clinic, ward or doctor who sent the sample. For environmental samples (water, food, soil) and vector samples (mosquitoes and other disease-carrying insects) it is the client who submitted them, such as a water utility or a district health office. For a small number of dangerous diseases (Ebola, cholera, a new influenza strain), health officials also need to know within hours.

Today most labs print the report and hand it to a driver, or a clerk downloads the PDF and attaches it to an email from a personal mailbox. OpenELIS has three separate places that send automatic messages. Test Notifications emails or texts a short message per test result. Test Catalog Alerts emails a fixed English line when a result matching a rule is typed in. Notification Triggers emails referral events and keeps a list of what it sent. None of them can attach the report. None can address a facility or an environmental client. Only one keeps a record of what was sent.

### Pain

- A clinician who orders a 12-test chemistry panel can get 12 separate emails, none of which says when the order is complete or carries the signed report.
- Most results go to facilities, not to named doctors, and the facility's email address is on file but nothing sends to it. A district hospital lab that sends 200 samples a day still collects paper.
- Alerts are sent when a result is typed in, before a second person has checked it. A typo can reach a health official as a positive Ebola result.
- The default patient message that ships today reads "Malaria testing results have been finalized for Patient: Mary K. Result: Positive". On a shared family phone that is a disclosure the patient never agreed to.
- When a printed result is corrected, nobody knows who received the wrong version, so the correction cannot be sent to them.
- A clerk who emails a report from a personal mailbox leaves no record in OpenELIS of who got which version, which an ISO 15189 assessor will ask for.
- Typing a different facility email at reception silently replaces the facility's address for every later order.

### What Changes

The report the lab already prints becomes the thing it sends. In the Report Print Queue a clerk ticks the reports for a facility and presses **Send**. Each facility gets its reports as protected PDFs, opened with a password the lab gave the facility once by phone. Facilities that have chosen automatic delivery receive each report as soon as results are released, including partial reports, and receive corrected versions automatically. Every send appears in the report's history next to its prints, and in one **Sent Messages** list with Resend.

Alert rules on a test fire only on validated results. They can reach named lists of officials ("Provincial Health Office: Viral haemorrhagic fever"), the facility and the ordering clinician. Patients whose order asked for it get a short notice that their results are ready, with no result in it, unless the clinician also chose to include the result. Email, SMS and WhatsApp are set up once, in one place, and work for all of these.

---

## Overview

Result Delivery sends released results and reports to the people who act on them, by email, SMS and WhatsApp, safely and with a record. It has three products on one shared foundation.

| Product | What is sent | When | Typical recipient |
|---|---|---|---|
| **A. Report delivery** (primary) | The released report PDF for one order and version, protected or masked | A report version is released, or a user presses Send | Facility, ordering clinician, environmental or vector client |
| **B. Priority result alerts** (secondary) | A short message about one result | A result matching an alert rule is validated | Distribution lists of officials, facility, clinician; an instruction to the patient |
| **C. Patient results-ready notice** (tertiary) | "Your results are ready", no result unless explicitly opted in | The order is final | Patient |

The shared foundation is: **channels** (Email, SMS, WhatsApp), **recipients** and their delivery settings, **templates**, a **persistent outbox** with retry, one **Sent Messages** log, and **privacy rules** that hold in every product.

Delivery runs in one of two places (§G): inside OpenELIS (local delivery, the default), or in a central delivery service that reads the consolidated FHIR server. A lab switches its report delivery to central with one setting, so nothing is sent twice.

### Navigation & URL

| Page | SideNav placement | Breadcrumb | URL route |
|---|---|---|---|
| Send (dialog) | Main menu → Reports → Report Print Queue (existing) | `Home / Reports / Report Print Queue` | `/ReportPrintQueue` (existing; Send is an action, not a route) |
| Sent Messages | Main menu → Reports → Sent Messages (after Report Print Queue) | `Home / Reports / Sent Messages` | `/SentMessages` (deep-linkable filters: `?product=`, `?status=`, `?labNo=`) |
| Channels | Admin → Automation → Notifications → Channels | `Home / Admin / Notifications / Channels` | `/MasterListsPage/notificationTriggerConfig/channels` |
| Templates | Admin → Automation → Notifications → Templates (existing tab, now a SideNav child) | `Home / Admin / Notifications / Templates` | `/MasterListsPage/notificationTriggerConfig/templates` |
| Distribution Lists | Admin → Automation → Notifications → Distribution Lists | `Home / Admin / Notifications / Distribution Lists` | `/MasterListsPage/notificationTriggerConfig/lists` |
| Delivery Settings | Admin → Automation → Notifications → Delivery Settings | `Home / Admin / Notifications / Delivery Settings` | `/MasterListsPage/notificationTriggerConfig/delivery` |
| Triggers (existing) | Admin → Automation → Notifications → Triggers | `Home / Admin / Notifications / Triggers` | `/MasterListsPage/notificationTriggerConfig/triggers` |
| Facility delivery settings | Admin → Organization → Locations & Organizations → Organizations (row expansion section) | `Home / Admin / Locations & Organizations / Organizations` | `/MasterListsPage/locations` (existing) |
| Alert rule recipients | Admin → Resources → Test Catalog → Tests → a test → Alerts | existing | existing |
| Patient notice opt-ins | Order entry (clinical), Result reporting block | existing | existing |

Notes:

- **Notifications** replaces the Admin entries **Notification Triggers** (A-05) and **Test Notifications** (A-04) as one SideNav group, following the 2026-10-12 admin audit. The `notificationTriggerConfig/sent` route redirects to `/SentMessages`. `testNotificationConfigMenu` redirects to Templates once Test Notifications retires (FR-H1).
- Sent Messages sits in the main menu under **Reports** (D-064 section order) because clerks who send reports use it daily; it is not an admin page.

---

## User Stories

- As a **reporting clerk**, I want to select today's reports for one facility in the Report Print Queue and send them in one action, so that the facility has them within the hour without a driver.
- As a **lab manager**, I want each facility's reports to go out as a password-protected PDF the facility already knows how to open, so that a mistyped address or a forwarded email does not expose a patient's name.
- As a **district surveillance officer**, I want an SMS and email within minutes of a validated cholera-positive result, so that I can start the response the same day.
- As a **patient**, I want a text saying my results are ready, without the result in it, so that I know to visit the clinic and nobody else reading my phone learns anything.
- As a **quality manager**, I want every send recorded against the report version it carried, so that I can show an assessor who received which version and when.

---

## Functional Requirements

### A. Shared foundation: channels, outbox, log

| ID | Requirement | Notes |
|---|---|---|
| FR-A1 | **Channels page** lists three channels, Email, SMS and WhatsApp, each as a row with Status (Ready, Not set up, Failing), last successful send, and Edit. One connection per channel is active at a time. | Replaces the SMTP, BMP, SMPP and WhatsApp rows of External Connections (A-01). External Connections keeps other endpoint types. |
| FR-A2 | **Email** row expansion: SMTP host, port, security (STARTTLS, SSL/TLS, None), username, password, sender address, sender display name, reply-to address. **Send test email** to a typed address. | Sender address moves from the server file `org.openelisglobal.mail.from` to the database; the property stays as fallback. STARTTLS is no longer forced. |
| FR-A3 | **SMS** row expansion: gateway (TextIt, BMP, SMPP), the gateway's fields (TextIt: API address, token, channel UUID; BMP and SMPP: as today), default country code for numbers (for example +675), **Send test SMS** to a typed number. | TextIt is new (from OGC-437). |
| FR-A4 | **WhatsApp** row expansion: as the existing WhatsApp connection, plus **Send test message**. | |
| FR-A5 | **Secrets are never returned to the browser.** Passwords and tokens show as "Set" with a **Replace** action; saving with the field untouched keeps the stored value. | Fixes `GET /rest/ExternalConnection` returning the decrypted password (also filed as a defect, §I). Delivery passwords (FR-B3) are the deliberate exception. |
| FR-A6 | A test send reports success, or the server's error in plain language ("Authentication failed: check the username and password", "Could not reach smtp.health.gov.pg on port 587"). It is recorded in Sent Messages as product "Test". | |
| FR-A7 | **Persistent outbox.** Every message is recorded with status Queued before any attempt is made. Sending works from that record, so a server restart or a channel outage delays messages and never loses them. | Replaces in-memory `@Async` sends for all three products. |
| FR-A8 | **Retry.** A failed attempt is retried after 1, 5 and 15 minutes, then marked Failed. Each attempt's time and error are kept. A message that fails because the channel is not set up is marked Failed at once with "Email is not set up". | Delays are lab-wide settings (FR-A16). |
| FR-A9 | **Skipped is a status, not a silence.** When a recipient has no address for the channel, has a number that cannot be put in international format, or is inactive, a row is written with status Skipped and the reason. | |
| FR-A10 | **Sent Messages** (`/SentMessages`) lists every message from every product (Report, Alert, Ready notice, Referral and other trigger events, Test), newest first, with: time, product, lab number, recipient (name and masked address, `ja••••@health.gov.pg`), channel, format (for reports), status (Queued, Sent, Failed, Skipped), attempts, sent by (user or "Automatic"). Filters: product, status, channel, date range, lab number, recipient. Server-side paging. | Widens today's Sent Messages (`notification_log`) and OGC-587's tab. |
| FR-A11 | A Sent Messages row expands to show the rendered subject and body, the attempts with errors, the report version and format sent, and links to the order and to the report version in the Report Print Queue. | Rendered content is visible only to users with `delivery:view`. |
| FR-A12 | **Resend** on a Sent, Failed or Skipped row sends the same rendered content again to the same recipient (after the address is corrected, for Skipped) and links the new row to the original. For a report, Resend sends the same archived version, not a newer one. | Reuses `NotificationLogServiceImpl.resend`. |
| FR-A13 | **Templates page** lists every message type with its editors: Report delivery (email subject and body, SMS and WhatsApp text), Priority alert (per recipient kind: officials, facility, clinician, patient instruction), Patient ready notice, and the existing trigger events. Each editor has the merge-field toolbar and a live preview with example values, as the Templates tab has today. | Reuses `NotificationPayloadTemplate`, `EventVariableRegistry`, `DefaultPayloadTemplates`. |
| FR-A14 | **Merge fields are restricted per slot** (FR-D2). The toolbar only offers allowed fields, and save is refused with a named error if a disallowed field was typed in. | |
| FR-A15 | Every template ships with defaults in every shipped language. A message is rendered in the recipient's language when one is set (FR-B2), otherwise the lab's default language. | |
| FR-A16 | **Delivery Settings page** holds lab-wide settings: default report format for recipients with no password (Masked copy, the default); hold before sending a new report version (minutes, default 10); send partial reports automatically (default on); retry delays; lab contact line used in notices (phone, email, opening hours); report delivery location (Local or Central, §G); secure links (on or off, link lifetime in days, only when a public address is configured). | |
| FR-A17 | Sent Messages and the Report Print Queue show times in the laboratory time zone. | |

### B. Recipients and delivery passwords

| ID | Requirement | Notes |
|---|---|---|
| FR-B1 | **Facility delivery section.** In Locations & Organizations, an organization's open row has a **Result delivery** section: report email addresses (one or more), report SMS or WhatsApp number, automatic delivery (Off, On), include partial reports (Lab default, Yes, No), language, and **delivery password** (FR-B3). A ward or department can have its own addresses; when it has none, its facility's are used. | Organization `email` and `phone` exist; the section adds delivery-specific fields. |
| FR-B2 | **Environmental and vector clients.** When the order's requesting organization has Result delivery set, it is used. Otherwise the order's requestor contact email and phone are used for that order, with automatic delivery off and the lab's default format. | `RequesterService.getRequestorEmail()` exists and is unused today. |
| FR-B3 | **Delivery password per facility or client.** The field shows masked, with **Show**, **Copy**, **Generate** and **Change**. Generate fills a 12-character password without look-alike characters (0/O, 1/l/I) grouped in threes for reading aloud (`K7M-PQ4-RTW-9XF`). Change asks for confirmation and warns: "Reports already sent stay locked with the old password." The record shows the date the password was last set. | Decided 2026-10-15: the password can be shown again so it can be given out without changing it. |
| FR-B4 | Every Show and Copy of a delivery password is recorded in the organization's History with user and time. Show hides the password again after 30 seconds or when the row closes. | |
| FR-B5 | The delivery password is also shown (with Show and Copy, same logging) in the Send dialog (FR-C6) for the recipient row, so a clerk on the phone with a facility can read it out. | Decided: Report Print Queue users can show it. |
| FR-B6 | **Ordering clinician.** The provider on the order is a recipient when the provider record has an email or mobile number. Clinicians have no delivery password of their own; a report to a clinician uses the facility's password when the order has a facility, otherwise the masked copy. | Provider email and phone are on the provider's Person. |
| FR-B7 | **Distribution Lists page.** A list has a name, description, members (each a name plus email and/or mobile number), "May receive patient identifiers" (Yes or No, default No), and Active. Lists are used by alert rules (§D). Lists are never deleted; they are deactivated (design-addendum MUST D). | New. |
| FR-B8 | **Order entry no longer rewrites a facility's addresses.** An email or phone typed for the referring site at order entry applies to that order only and shows "Used for this order only". It does not change the organization record. | Fixes `SamplePatientUpdateData.java:711-717`. |
| FR-B9 | Addresses are validated on entry (email format; phone convertible to international format with the default country code). | |

### C. A. Report delivery

| ID | Requirement | Notes |
|---|---|---|
| FR-C1 | **What is sent is a report version.** Delivery always sends a version that the Report Print Queue pipeline has released and archived. Covers patient reports, environmental and vector certificates, and results reports with no standard. | Depends on OGC-1031 FR-6 pipeline and archive (D-141). |
| FR-C2 | **Automatic delivery.** When a new version of an order's report is released and the order's facility or client has automatic delivery on, the version is queued for delivery to it after the hold (FR-A16). If another version is released during the hold, only the newest is sent. | |
| FR-C3 | **Partial reports are sent** when the recipient's setting (or the lab default) allows. Each release of further results is a new version and a new send. Completing a partial report is not an amendment (D-140). | Decided 2026-10-15. |
| FR-C4 | **Amended versions** are queued automatically to every recipient who received any earlier version of that order's report, whatever their automatic setting, with the subject marked "Amended". | ISO 15189 7.4.1.3 amended reports. |
| FR-C5 | **Send from the Report Print Queue.** A row's actions and the batch toolbar offer **Send** beside Print and Download. Send is available for rows with at least one released version. | |
| FR-C6 | **Send dialog** (a Modal: it is a confirmation over a batch, not a record edit). It lists, per order, the resolved recipients: facility (and ward if set), ordering clinician, client. Each recipient row shows channel, address, format (Protected full report or Masked copy), and the password state ("Password set" with Show and Copy, or "No password: masked copy"). The user can untick recipients, change the format for one send, and add an address (email or number) for this send only. A batch groups orders by recipient so one facility gets one email with all its reports attached. | |
| FR-C7 | A typed address is shown back in a confirmation line ("Send 4 reports to dr.kila@gmail.com as masked copies?") before sending. | Decided: anyone with queue access may type an address. |
| FR-C8 | **Full reports are only ever sent protected.** The format choices are Protected full report (requires the recipient's delivery password) and Masked copy. There is no unprotected full report. | Decided 2026-10-15. |
| FR-C9 | **Protected full report** is the archived PDF of the version, encrypted with the recipient's delivery password (standard PDF encryption that common desktop and phone PDF readers open). The send records that it was encrypted and with which password set date, never the password. | |
| FR-C10 | **Masked copy** is the same version rendered with patient identity reduced: name replaced by initials, national ID removed, address and phone removed. Kept: initials, sex, age, date of birth, patient ID, the requester's order number, requester, facility and ward, collection date, all tests, results, flags, comments and signatures. The page shows "Masked copy: patient name and national ID removed. Contact {lab} for the full report." Masking is done in the data given to the template, so no template can print the removed fields. | Decided: patient ID stays. Depends on OGC-1111 changes (§K). |
| FR-C11 | A masked copy is archived with its own SHA-256 and linked to the version it was rendered from. | Extends D-141. |
| FR-C12 | **Every send is an issue event** on the version: the print queue's version history shows sends beside prints ("Sent 14:32 to Port Moresby General Hospital, protected, by J. Kaupa"). | Widens OGC-1031 FR-8 history. |
| FR-C13 | **Email content for reports.** Subject: lab name, state and lab number(s) ("CPHL results: Final, 3 reports"). Body: a short list of the attached reports by lab number and requester's order number, state, and the lab contact line. Attachments named as the print queue names downloads (`{labNo}-v{n}.pdf`; masked copies `{labNo}-v{n}-masked.pdf`). | |
| FR-C14 | **SMS and WhatsApp for reports** carry no attachment. They say that reports are ready, how many, and how to get them: by email if the facility has one, or by secure link when links are on (§F). | |
| FR-C15 | A report with nothing released is never sent. A send for an order whose newest version is older than one already sent to that recipient asks "A newer version was already sent on {date}. Send this older version?" | |

### D. Privacy rules (every product)

| ID | Requirement | Notes |
|---|---|---|
| FR-D1 | **Patient name and national ID never appear in readable form** in any email subject, email body, SMS or WhatsApp text, in any product. | Decided 2026-10-15. |
| FR-D2 | **Allowed merge fields per slot:** report subjects and bodies, SMS and WhatsApp text: lab name, lab number, requester's order number, facility, ward, report state, report count, lab contact line. Alert messages to recipients not marked "May receive patient identifiers": the same plus test name, result and flag, collection date, age and sex. Alert messages to lists marked "May receive patient identifiers": additionally patient name, patient ID, phone and village. Patient ready notice: lab name, lab contact line, and the patient's first name only. Patient result (when the test allows it and the order asks for it, FR-F3, FR-F4): additionally test name, result and the instruction text. Patient alert instruction (FR-E2): the same as patient result when the test allows results to patients, otherwise the instruction text only. | Enforced by FR-A14. |
| FR-D3 | Free-typed addresses (FR-C6) never receive a protected report with a facility's password; they receive the masked copy unless the user picks a recipient from the directory. | A typed address is not a known holder of any password. |

### E. B. Priority result alerts

| ID | Requirement | Notes |
|---|---|---|
| FR-E1 | **Alerts fire on validated results only.** An alert rule's email, SMS and WhatsApp messages are queued when a result matching the rule is finally validated (including results finalized at entry and by vector pool deconvolution). The in-app alert and the critical-result alert stay at result entry, as now. | Decided. Today they fire at entry (`ResultEntryRestController.java:375`). |
| FR-E2 | **Recipients on a rule:** distribution lists (FR-B7), the order's facility, the ordering clinician, the patient, and a fixed address. Any combination. The patient message is an instruction ("You must stay at home and call 1800 200"); it includes the result only when the test's Patient messages setting is "Result by default" (FR-F4). This is the rapid SMS path for programmes such as COVID-19 testing. | Wires `notifyOrderingPhysician` and `notifyReferringFacility`, which exist unwired. |
| FR-E3 | Each recipient kind has its own template (FR-A13). A rule can override the body for that rule. | |
| FR-E4 | An alert to a recipient not allowed patient identifiers carries the lab number and requester's order number, so the receiver can look the patient up through the facility. | FR-D2 |
| FR-E5 | Alert sends appear in Sent Messages as product "Alert" with the rule name. | |
| FR-E6 | **Acknowledgement (optional per rule).** When on, each message carries a link "I have received this alert"; opening it records who acknowledged and when, on the Sent Messages row. | Requires a public path (§F) or the central service (§G). |
| FR-E7 | **Escalation (optional per rule).** When an acknowledgement is not recorded within the rule's time limit (for example 60 minutes), an in-app alert is raised to users who hold `alert:view` in the lab unit: "Not acknowledged: Cholera RDT positive, CPHL-26-004211, Provincial Health Office. Phone them." | Reuses the Alerts page and acknowledgement model (D-042). |
| FR-E8 | Alert messages are human notifications. Case-based reporting to national surveillance systems stays with FHIR exchange. | D-050 |

### F. C. Patient results-ready notice

| ID | Requirement | Notes |
|---|---|---|
| FR-F1 | **Opt-in at order entry.** The existing patient Email and SMS boxes in the order's Result reporting block mean "send the patient a results-ready notice". A ready notice (no result) is sent once, when the order's report is Final, if any test on the order was ticked. A message that includes a result (FR-F3) is sent as soon as that test's result is validated, without waiting for the rest of the order; the ready notice still follows when the order is Final, unless every ticked test already sent its result. | Reuses `AnalysisNotificationConfig` and `OrderResultReporting.jsx`. |
| FR-F2 | **The notice is the same for every order.** It names the lab, says results are ready, and asks the patient to contact their clinician or the lab, with the lab contact line. It never names a test. | So the notice itself never signals what was tested. |
| FR-F3 | **Including the result is a second opt-in,** a box beside each ticked patient box: "Include the result". Its starting state comes from the test (FR-F4). Only users with `order:notify_result` can change it; others see its state read-only. When ticked, the notice adds the test name and result. | Decided 2026-10-15. |
| FR-F4 | **Per-test Patient messages setting** in the Test Catalog, one of: **Ready notice only** ("Include the result" disabled with the tooltip "This lab does not send this test's results to patients by message."; the ready notice is still sent); **Result when the order asks for it** (default; patient boxes start unticked); **Result by default** (the patient SMS box and "Include the result" start ticked whenever the patient has a mobile number, and alert rules on this test may include the result in patient messages). | Replaces a "sensitive test list"; the lab decides per test. "Result by default" serves rapid result SMS for programmes such as COVID-19 testing without anyone ticking boxes per order. |
| FR-F5 | A patient with no email or mobile number gets a Skipped row, and the order shows "Patient notice not sent: no contact" in the print queue row. | |

### G. Secure links and central delivery

| ID | Requirement | Notes |
|---|---|---|
| FR-G1 | **Secure links (local).** When the lab has a public address and links are on, report messages can carry a link instead of, or as well as, an attachment. A link is unique per send, expires after the configured lifetime, and opens the same file the send would have attached (protected or masked). Each opening is logged on the Sent Messages row. An expired link shows a page asking the reader to contact the lab. | Carries S-06b FR-14 to FR-20. |
| FR-G2 | **Central delivery.** When Delivery Settings says Central, OpenELIS does not send reports, alerts or patient notices itself for this lab. It publishes each released report version to the consolidated FHIR server as a DiagnosticReport whose `presentedForm` is the archived PDF with its hash, and the central delivery service sends from there using the same rules, recipients and templates. | Decided 2026-10-15: both paths. |
| FR-G3 | Switching to Central shows "Reports, alerts and patient notices for this lab will be sent by the central service at {address}. This lab will stop sending them." and requires confirmation. Switching back is the same. | One switch, never both. |
| FR-G4 | Recipient settings, distribution lists and templates can be exported and imported as one file, so the central service uses the same set. | |
| FR-G5 | Rules are defined only in terms the FHIR exchange carries: requesting organization and practitioner with their telecom, patient telecom and the order's notice opt-ins, test code, result value and interpretation, report status (partial, final, amended). | So one rule engine can run in either place. |

### H. Retiring the old paths

| ID | Requirement | Notes |
|---|---|---|
| FR-H1 | **Test Notifications retires.** On upgrade, its per-test provider settings become facility or clinician recipients with automatic delivery off (an admin turns them on), its patient settings become ready-notice defaults, and its templates are kept as inactive templates. Its menu entry redirects to Templates. | A-04 |
| FR-H2 | **External Connections** stops listing SMTP, SMS and WhatsApp types for new rows; existing rows are moved into Channels on upgrade. | A-01 |
| FR-H3 | Notification Triggers' Sent Messages tab redirects to `/SentMessages?product=trigger`. | A-05 |

### I. Defects fixed by this feature (also filed separately for an early fix)

| ID | Defect on develop | Fixed by |
|---|---|---|
| RD-X1 | The shipped patient template sends the result and the patient's name in plain text (`TestNotificationServiceImpl.java:80-81`), with a literal "someAddress" link (`:202-205`) | FR-F2, FR-D1, FR-H1 |
| RD-X2 | Test Catalog alert emails and SMS are sent at result entry, before validation (`ResultEntryRestController.java:375`) | FR-E1 |
| RD-X3 | `GET /rest/ExternalConnection` returns the decrypted SMTP password (`ExternalConnectionRestController.java:60-84`) | FR-A5 |
| RD-X4 | Referring-site email typed at order entry overwrites the organization record (`SamplePatientUpdateData.java:711-717`) | FR-B8 |
| RD-X5 | Patient notifications probably fail for environmental samples with no patient (`TestNotificationServiceImpl.java:168-169`) | FR-H1 |

### J. States, errors and accessibility

| ID | Requirement | Notes |
|---|---|---|
| FR-J1 | Every list loads with a skeleton; a load error names what failed with Retry; an empty Sent Messages says "Nothing sent in this period" and an empty Distribution Lists offers Add list. | Admin standard AS-34 |
| FR-J2 | Status is always text plus colour (Queued blue, Sent green, Failed red, Skipped gray), never colour alone. | |
| FR-J3 | Show password, Copy and Send are keyboard reachable, and their accessible names include the record ("Show delivery password, Port Moresby General Hospital"). | WCAG 2.1 AA |
| FR-J4 | The Send dialog states the count before confirming ("Send 7 reports to 3 recipients") and, after sending, a toast reads back the result ("7 reports queued. 1 recipient skipped: no email for 9 Mile Urban Clinic.") with a link to Sent Messages. | |

### K. Changes required in sibling specs

| Spec | Change |
|---|---|
| **OGC-1111 Patient report** | Masking is a mode of the report done in the data (FR-C10), with a masked layout for the page 1 card and the continuation strip and the "Masked copy" line; print the requester's order number on the card (FR-A16) and the strip (FR-A17); "Version n · Issued {date time}" on every report from V1 (FR-A15 moves to V1); partial marker on continuation pages; lab contact in `additionalSiteInfo`. |
| **OGC-1031 Report Print Queue** | Send action on rows and batch (FR-C5); version history shows sends (FR-C12); masked renderings archived (FR-C11); the out-of-scope line "Sending reports electronically" is removed. |
| **Locations & Organizations** | Result delivery section with delivery password (FR-B1 to FR-B5); History records password Show and Copy. |
| **Admin Redesign** | Register: A-04 and A-05 become Automation › Notifications (Triggers, Templates, Channels, Distribution Lists, Delivery Settings); Sent Messages moves to the main menu; A-01 loses the notification channel types. |
| **Test Catalog Alerts (OGC-763)** | Recipients (FR-E2), validation-only firing (FR-E1), acknowledgement and escalation (FR-E6, FR-E7); per-test Patient messages setting (FR-F4). |

---

## Information & Data

Reused as is or widened:

| Information | Source today |
|---|---|
| Report versions, their archived PDFs and hashes, Partial/Final/Amended state, issue history | Report Print Queue pipeline and archive (OGC-1031; `compliance_report_archive` widened, `document_track`) |
| Facility and ward email, phone | `Organization.email`, `.phone` |
| Ordering clinician email and phone | `Provider` → `Person.email`, `.cellPhone`, `.primaryPhone` |
| Environmental and vector requestor contact | `sample_requester` row `requestor_contact` → Person; `RequesterService.getRequestorEmail()` |
| Patient contact | `Patient` → `Person.email`, `.cellPhone` |
| Requester's order number | `Sample.referringId` / order entry `externalOrderNumber` |
| Patient notice opt-ins per test on the order | `AnalysisNotificationConfig` (patient/provider × email/SMS) |
| Alert rules | `TestAlertRule` (trigger type and value, component and sample type scope, notify flags, custom phone and email, role, `acknowledgmentRequired`) |
| Channel connections and encrypted secrets | `ExternalConnection`, `BasicAuthenticationData` (jasypt AES-256 at rest) |
| Templates and merge fields | `NotificationPayloadTemplate`, `EventVariableRegistry`, `DefaultPayloadTemplates` |
| Sent messages, channel attempts, resend chain | `NotificationLog`, `NotificationLogChannel` (widened, below) |
| Recipient resolution for ordering provider | `NotificationRecipientResolver` |
| In-app alerts and acknowledgement | `Alert`, `AlertService` |

New information (all declared in Dependencies):

- **On an organization:** report email addresses, report number, automatic delivery, include partials, language, delivery password (reversible encryption, never hashed), date the password was last set; History entries for password Show and Copy.
- **Distribution list:** name, description, members (name, email, mobile), may receive patient identifiers, active.
- **On a sent message:** product (Report, Alert, Ready notice, Trigger, Test), report version and format sent, masked-copy archive reference, rule, Queued and Skipped statuses with reason, next attempt time, gateway message ID, sent by user, acknowledgement (who, when), link openings.
- **On a test:** Patient messages (Ready notice only, Result when the order asks for it, Result by default).
- **On an order's patient opt-in:** include the result (Yes/No).
- **Lab-wide:** default format, hold minutes, partials default, retry delays, lab contact line, delivery location (Local/Central) and central address, secure links on/off and lifetime, default country code, sender name and address.

Lifecycle of a sent message: Queued → Sent, or Queued → (retry) → Failed, or Skipped. Resend creates a new row linked to the original. Nothing is deleted.

---

## Access

### Who can do what

- **Reporting clerks and anyone with access to the Report Print Queue** can send reports from it, type an address for one send, change the format for one send, and show a recipient's delivery password in the Send dialog. They can open Sent Messages and resend.
- **Users who edit facilities** (Admin today) set facility delivery settings and delivery passwords, and can show and copy them.
- **Administrators** set up channels, templates, distribution lists and delivery settings. Users without access do not see the Notifications SideNav group; the routes redirect to the admin home.
- **Users who edit tests** set alert rules and the per-test Patient messages setting.
- **Users who create orders** tick the patient ready notice. Only users with `order:notify_result` can change "Include the result"; others see it read-only.
- Users without `delivery_password:view` see "Password set" with no Show or Copy.

### Nominated privileges

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| View channels and their status | `notification:view` (existing) | Administration | As today |
| Set up channels, Send test, edit templates, distribution lists and delivery settings | `notification:manage` (existing) | Administration | As today |
| Switch delivery between Local and Central | `system:configure` (existing) | Administration | As today |
| View Sent Messages, including rendered content | **NEW** `delivery:view` | Reports | Roles with `report:run` |
| Resend from Sent Messages | **NEW** `delivery:resend` | Reports | Roles with `report:run` |
| Send reports from the print queue, including to a typed address | **NEW** `report:send` | Reports | Roles with `report:run` |
| Show or copy a delivery password (logged) | **NEW** `delivery_password:view` | Reports | Roles with `organization:manage`, `sample_requester:manage` or `report:run` |
| Edit a facility's delivery settings and password | `organization:manage` (existing) | Test catalog and reference data | As today |
| Edit a provider's delivery addresses | `provider:manage` (existing) | Test catalog and reference data | As today |
| Edit an environmental or vector client's contact | `sample_requester:manage` (existing) | Orders, samples and patients | As today |
| Create and edit alert rules, their recipients and templates | `alert:manage` (existing) | Quality | Roles with `test:configure` |
| See alert escalations | `alert:view` (existing) | Quality | Roles with `result:validate` |
| Set a test's Patient messages setting | `test:configure` (existing) | Test catalog and reference data | As today |
| Tick the patient ready notice at order entry | `order:create`, `order:edit` (existing) | Orders, samples and patients | As today |
| Tick "Include the result" | **NEW** `order:notify_result` | Orders, samples and patients | Roles with `order:create` |

NEW codes: `delivery:view`, `delivery:resend`, `delivery_password:view`, `report:send`, `order:notify_result`. A new `delivery` category maps to the Reports group. Until PR #3443 merges: Reports module access stands in for `report:run` and the four Reports-group codes, Global Administrator for `notification:manage`, `organization:manage` and `alert:manage`, and the order entry module for `order:notify_result`. Every check is made on the server.

---

## Localization

Keys under the `delivery` namespace; existing keys reused where the meaning is identical.

| Key | English fallback | Context |
|---|---|---|
| `sidenav.label.reports.sentMessages` | Sent Messages | Main menu, page title |
| `sidenav.label.admin.notifications` | Notifications | Admin SideNav group |
| `sidenav.label.admin.notifications.channels` | Channels | SideNav, page title |
| `sidenav.label.admin.notifications.templates` | Templates | SideNav, page title |
| `sidenav.label.admin.notifications.lists` | Distribution Lists | SideNav, page title |
| `sidenav.label.admin.notifications.delivery` | Delivery Settings | SideNav, page title |
| `sidenav.label.admin.notifications.triggers` | Triggers | SideNav, page title |
| `delivery.channel.email` | Email | Channel name |
| `delivery.channel.sms` | SMS | Channel name |
| `delivery.channel.whatsapp` | WhatsApp | Channel name |
| `delivery.channel.status.ready` | Ready | Channel status |
| `delivery.channel.status.notSetUp` | Not set up | Channel status |
| `delivery.channel.status.failing` | Failing | Channel status |
| `delivery.channel.sendTest` | Send test | Button |
| `delivery.channel.secretSet` | Set | Masked secret |
| `delivery.channel.replace` | Replace | Button |
| `delivery.channel.security` | Security | SMTP field |
| `delivery.channel.senderAddress` | Sender address | SMTP field |
| `delivery.channel.senderName` | Sender name | SMTP field |
| `delivery.channel.countryCode` | Default country code | SMS field |
| `delivery.channel.gateway` | Gateway | SMS field |
| `delivery.test.success` | Test message sent to {address}. | Toast |
| `delivery.test.error.auth` | Authentication failed: check the username and password. | Error |
| `delivery.test.error.unreachable` | Could not reach {host} on port {port}. | Error |
| `delivery.status.queued` | Queued | Tag |
| `delivery.status.sent` | Sent | Tag |
| `delivery.status.failed` | Failed | Tag |
| `delivery.status.skipped` | Skipped | Tag |
| `delivery.product.report` | Report | Sent Messages product |
| `delivery.product.alert` | Alert | Sent Messages product |
| `delivery.product.notice` | Ready notice | Sent Messages product |
| `delivery.product.trigger` | Notification | Sent Messages product |
| `delivery.product.test` | Test | Sent Messages product |
| `delivery.skip.noAddress` | No {channel} address | Skip reason |
| `delivery.skip.badNumber` | Number {number} cannot be put in international format | Skip reason |
| `delivery.skip.inactive` | Recipient is inactive | Skip reason |
| `delivery.sent.empty` | Nothing sent in this period. | Empty state |
| `delivery.sent.resend` | Resend | Button |
| `delivery.sent.sentBy.auto` | Automatic | Sent by column |
| `delivery.format.protected` | Protected full report | Format |
| `delivery.format.masked` | Masked copy | Format |
| `delivery.format.link` | Secure link | Format |
| `delivery.send.button` | Send | Print queue action |
| `delivery.send.title` | Send reports | Dialog title |
| `delivery.send.summary` | Send {reports} reports to {recipients} recipients | Dialog footer |
| `delivery.send.addAddress` | Add an address for this send | Link |
| `delivery.send.confirmTyped` | Send {count} reports to {address} as masked copies? | Confirmation |
| `delivery.send.olderVersion` | A newer version was already sent on {date}. Send this older version? | Confirmation |
| `delivery.send.done` | {count} reports queued. | Toast |
| `delivery.send.doneSkipped` | {skipped} recipient skipped: {reason} | Toast |
| `delivery.password.label` | Delivery password | Field |
| `delivery.password.set` | Password set {date} | State |
| `delivery.password.none` | No password: masked copy | State |
| `delivery.password.show` | Show | Button |
| `delivery.password.copy` | Copy | Button |
| `delivery.password.generate` | Generate | Button |
| `delivery.password.change` | Change | Button |
| `delivery.password.changeWarning` | Reports already sent stay locked with the old password. | Confirmation |
| `delivery.facility.section` | Result delivery | Organization section |
| `delivery.facility.emails` | Report email addresses | Field |
| `delivery.facility.number` | Report SMS or WhatsApp number | Field |
| `delivery.facility.auto` | Send reports automatically | Toggle |
| `delivery.facility.partials` | Include partial reports | Select |
| `delivery.facility.language` | Language | Select |
| `delivery.order.thisOrderOnly` | Used for this order only | Order entry helper |
| `delivery.masked.banner` | Masked copy: patient name and national ID removed. Contact {lab} for the full report. | Report line |
| `delivery.list.title` | Distribution Lists | Page |
| `delivery.list.add` | Add list | Button |
| `delivery.list.identifiers` | May receive patient identifiers | Toggle |
| `delivery.list.members` | Members | Section |
| `delivery.settings.defaultFormat` | Format for recipients without a password | Setting |
| `delivery.settings.hold` | Wait before sending a new version (minutes) | Setting |
| `delivery.settings.partials` | Send partial reports automatically | Setting |
| `delivery.settings.contact` | Lab contact line | Setting |
| `delivery.settings.location` | Where reports are sent from | Setting |
| `delivery.settings.location.local` | This lab | Option |
| `delivery.settings.location.central` | Central delivery service | Option |
| `delivery.settings.centralConfirm` | Reports, alerts and patient notices for this lab will be sent by the central service at {address}. This lab will stop sending them. | Confirmation |
| `delivery.settings.links` | Secure links | Setting |
| `delivery.settings.linkDays` | Link lifetime (days) | Setting |
| `delivery.notice.include` | Include the result | Order entry checkbox |
| `delivery.notice.blocked` | This lab does not send this test's results to patients by message. | Tooltip |
| `delivery.notice.notSent` | Patient notice not sent: no contact | Print queue row |
| `delivery.test.patientMessages` | Patient messages | Test Catalog field |
| `delivery.test.patientMessages.noticeOnly` | Ready notice only | Option |
| `delivery.test.patientMessages.onRequest` | Result when the order asks for it | Option |
| `delivery.test.patientMessages.byDefault` | Result by default | Option |
| `delivery.alert.ack` | I have received this alert | Link text in message |
| `delivery.alert.escalation` | Not acknowledged: {test} {result}, {labNo}, {recipient}. Phone them. | In-app alert |
| `delivery.template.notice.default` | {lab}: your results are ready. Please contact your clinician or the lab ({contact}). | Default notice (SMS) |
| `delivery.template.report.subject` | {lab} results: {state}, {count} reports | Default email subject |

---

## Acceptance Criteria

1. With Email set up, Send test email to a typed address arrives, and Sent Messages shows a Test row with status Sent.
2. With a wrong SMTP password, Send test shows "Authentication failed: check the username and password" and a Failed Test row.
3. `GET` of any channel or connection returns no password or token; saving the form with the secret untouched keeps it working.
4. Stopping the server while 5 reports are Queued and starting it again sends all 5; none is lost or sent twice.
5. A send to a facility with no report email writes a Skipped row "No email address"; nothing is attempted.
6. For Port Moresby General Hospital with a delivery password and automatic delivery on, validating the first 4 of 12 results produces, after the hold, one email with `{labNo}-v1.pdf` that opens only with that password, and the version history shows "Sent ... protected".
7. Validating two more results within the hold produces one send of v2, not v1 and v2.
8. Changing a printed result produces an Amended version that is queued to every earlier recipient, including one whose automatic delivery is off, with "Amended" in the subject.
9. With the lab default "Masked copy" and no password on 9 Mile Urban Clinic, its emailed report shows initials, sex, age, date of birth, patient ID and the requester's order number, no name and no national ID, and the "Masked copy" line; the masked file has its own SHA-256 in the archive.
10. No email subject, email body, SMS or WhatsApp text produced by any product contains a patient's full name or national ID (checked by a test over every default template and over rendered output).
11. Selecting 7 rows for 3 facilities and pressing Send opens the dialog with 3 recipient groups; confirming sends 3 emails and the toast reads "7 reports queued."
12. Adding a typed address in the Send dialog shows the confirmation line and sends a masked copy, even when a facility recipient on the same send has a password.
13. A user with `report:run` but without `delivery_password:view` sees "Password set" with no Show or Copy; a user with it can Show, and the organization's History records the Show with user and time.
14. Generate produces a 12-character password in three-character groups with none of 0, O, 1, l, I.
15. Changing a delivery password asks for confirmation and records the new set date; reports sent before still open with the old password.
16. Typing a different referring-site email at order entry leaves the organization's email unchanged and shows "Used for this order only".
17. An environmental order whose requesting organization has no delivery settings is sent to the requestor contact's email as a masked copy when a user presses Send.
18. A Test Catalog alert rule for Cholera RDT = Positive with the list "Provincial Health Office: Cholera" sends nothing at result entry and sends when the result is validated; the Sent Messages row shows product Alert and the rule name.
19. An alert to a list not marked "May receive patient identifiers" contains the lab number and requester's order number but no patient name; to a list marked Yes it contains the patient name.
20. With acknowledgement on and a 60-minute limit, an unacknowledged alert raises an in-app alert to validators of that lab unit after 60 minutes; opening the link before then records the acknowledgement and no escalation is raised.
21. An order with the patient SMS box ticked gets one ready notice when the report becomes Final, with no test name and no result.
22. A user without `order:notify_result` sees "Include the result" read-only in its starting state; a user with it can change it, and when ticked the notice includes the test name and result.
23. For a test set to "Ready notice only", "Include the result" is disabled with its tooltip and the ready notice is still sent.
23a. For SARS-CoV-2 RDT set to "Result by default", an order for a patient with a mobile number starts with the patient SMS box and "Include the result" ticked; when the result is validated the patient receives an SMS with the result, and an alert rule "SARS-CoV-2 RDT = Positive" sends the patient its self-isolation instruction with the result.
24. With Delivery Settings on Central, validating a result sends nothing from the lab, and the released version is published to the FHIR server with the PDF and hash in `presentedForm`.
25. A secure link opens the same file the send carried until it expires; after expiry it shows the "contact the lab" page; each opening is listed on the row.
26. Resend on a Failed report row sends the same archived version and links the new row to the original.
27. On upgrade, Test Notifications' configured tests appear as recipients with automatic delivery off, and its menu entry redirects to Templates.
28. `/SentMessages?product=alert&status=failed` loads with those filters applied.
29. With the interface in French, no English text remains on any page of this feature, and default templates render in French.
30. Every status shows text as well as colour, and every Show, Copy and Send control has an accessible name that includes the record.

---

## Dependencies

- **Report Print Queue (OGC-1031):** one print pipeline with a renderer per report type, version records and the archive. Report delivery cannot ship before it.
- **Patient report (OGC-1111):** masked mode in the data, requester's order number, version and issue time on every report, partial marker on continuation pages (§K).
- **Users and Roles / PR #3443:** privilege catalogue for the five NEW codes.
- **Locations & Organizations:** the organization open row that the Result delivery section extends.
- **TextIt gateway** (from OGC-437) for SMS where TextIt is used.
- **FHIR Implementation Guide:** DiagnosticReport with `presentedForm` and hash, and the order's notice opt-ins, for central delivery; the central delivery service itself.
- **A public address** for secure links and acknowledgement links when delivery is local.
- **New data elements** listed under Information & Data.

---

## Out of Scope

- Digests (one email per facility per period). Decided: not in the first release.
- An allowed-domain list for full reports. Decided: no.
- HTML email formatting, CC, read receipts beyond alert acknowledgement.
- Replies and two-way SMS; delivery receipts from gateways.
- A patient portal or patient login.
- Unprotected full reports sent by OpenELIS.
- Case-based surveillance reporting (stays with FHIR exchange).

---

## Open Questions

1. **Hold before sending a new version:** is 10 minutes the right default?
2. **Central delivery service:** who builds and hosts it, and is it part of the consolidated FHIR server work or a separate service?

---

## Decisions (proposed, D-220 to D-233)

| ID | Decision |
|---|---|
| D-220 | Result delivery has three products (report delivery, priority alerts, patient ready notice) on one foundation: channels, recipients, templates, persistent outbox, one Sent Messages log. No product has its own sender or log. |
| D-221 | The unit of report delivery is a released, archived report version, never a per-result message. |
| D-222 | Full reports are sent only as PDFs protected by a delivery password that belongs to the facility or client; recipients without a password get the masked copy. OpenELIS never sends an unprotected full report. |
| D-223 | A delivery password can be shown again (logged) by users who edit the facility and by Report Print Queue users; it is stored with reversible encryption. Connection secrets are never shown again. |
| D-224 | Patient name and national ID never appear in readable form in any message text, enforced by allowed merge fields per template slot. |
| D-225 | The masked copy removes name (initials kept), national ID, address and phone; it keeps patient ID, date of birth, age, sex and the requester's order number; masking is done in the data, not the layout, and the masked file is archived. |
| D-226 | Partial reports are delivered; each further release is a new version, after a short hold that collapses versions released together. |
| D-227 | Amended versions go automatically to every earlier recipient. |
| D-228 | Alerts to people outside the lab fire on validated results only. |
| D-229 | The patient ready notice is identical for every order and names no test. Including the result is a per-order choice whose starting state comes from the test (Ready notice only, Result when the order asks for it, Result by default); changing it needs its own privilege. "Result by default" is the rapid-SMS path for programmes such as COVID-19 testing. |
| D-230 | Sent Messages is a main-menu Reports page, not an admin page; Notifications (Triggers, Templates, Channels, Distribution Lists, Delivery Settings) replaces Test Notifications and Notification Triggers in Admin. |
| D-231 | Order entry never changes a facility's directory addresses. |
| D-232 | Delivery runs locally or in a central service over the consolidated FHIR server, chosen per lab with one switch; rules are written only in terms FHIR carries. |
| D-233 | Every new feature nominates its privileges with default grants stated by held privilege (standing rule, recorded here first). |
