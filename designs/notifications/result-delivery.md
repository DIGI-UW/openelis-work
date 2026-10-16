# Result Delivery: Functional Requirements Specification

**Version:** 0.3 (splits the feature into two releases: WhatsApp through TextIt and the masked copy move to Release 2; applies the feasibility fixes of 2026-10-16. v0.2 resolved the 2026-10-15 analysis, findings F-01 to F-83, and Casey's four decisions of the same day)
**Date:** 2026-10-16
**Author:** Casey, Director of Product (drafted with Claude)
**Status:** Draft, for review
**Source:** `result-delivery/result-delivery-critique.md` (revision 2, decisions of 2026-10-15); `result-delivery/result-delivery-analyze.md` (F-01 to F-83)
**Supersedes, in part:** `designs/notifications/email-notification-integration.md` v1.2 and `designs/notifications/textit-sms-integration.md` v1.2 (OGC-439, OGC-437: their parallel tables, per-result messages and admin layout), `designs/notifications/notification-admin.jsx`, and `designs/reports/lh-delivery-sent-messages.md` v1.1 (OGC-587: its delivery model; its secure link and Sent Messages ideas are carried here)
**Related:** Report Print Queue (OGC-1031), Patient Report and Report Management (OGC-1111), Locations & Organizations, Admin Redesign (Configuration page, Notifications group, register rows A-01, A-04, A-05), Users and Roles (PR #3443), Test Catalog Alerts (OGC-763 / OGC-949), Clinical Order Entry v4 (OGC-1266, Result reporting block), Navigation Redesign (main menu Appendix A.1), Microbiology M-16, Referral-out notification triggers (spec registry row X-01, not Admin Redesign's X-01), Results Portal (`designs/portal/results-portal-c0-discovery-brief.md`, `designs/portal/facility-results-portal.md`: owns central delivery)
**Decisions:** D-222 to D-249 (see Decisions, the last section)
**Preview:** `result-delivery-preview.html`
**Checked against:** `DIGI-UW/OpenELIS-Global-2` `develop` at 7472c30 (2026-10-15)

### Changes in v0.3

- **Two releases** (new Releases section, D-244). Release 1: email and SMS, the outbox, Sent Messages, templates, distribution lists, report delivery with the protected full report only, certificates, priority alerts, patient messages, and secure links where the server has a public address. Release 2: the masked copy (FR-C10, FR-C11; OGC-1111 FR-A61; the print queue's masked archive) and WhatsApp through TextIt's WhatsApp channel with templates approved by Meta (FR-A4, FR-A18). Release 2 items are marked, not removed. The section also states the build order and the interim homes for settings and privileges.
- **Release 1 without a masked copy** (D-245): a patient report goes only to a recipient whose delivery password is known; others are Skipped "No delivery password" (FR-A9, FR-B2, FR-B6, FR-C6 to FR-C8, FR-D3). A typed address gets the protected copy with the order's facility password, or is skipped. Certificates are unchanged.
- **Automatic delivery batches per recipient** (D-246): the hold runs per recipient, and one email carries every report due to that recipient, split at 10 MB or 20 reports (FR-C2, FR-C14).
- **Retries run for 24 hours** (D-247): 1, 5, 15, 30 and 60 minutes, then hourly; new setting `deliveryGiveUpHours`; a channel shows Failing after three failed attempts in a row (FR-A1, FR-A8, FR-A16).
- **What "Sent" and "Delivered" mean** (D-249): email Sent means the lab's mail server accepted the message; TextIt SMS status is polled and recorded as Delivered or Failed (FR-A10, new status Delivered).
- **Public server address stated plainly:** receipt confirmation, escalation and secure links work only when the server can be reached from the internet (Releases, FR-E6, FR-G1).
- **Delivery password scope stated honestly** (D-248, FR-B3, Lab Context); protected PDFs use AES-256 (FR-C9) and the report email says how to open them (FR-C13).
- **New requirements:** priority results waiting for validation are flagged to validators (FR-E10); patient opt-ins at order entry are recorded as consent in the order history (FR-F1); the SHA-256 of the file actually sent is recorded (FR-A11); corrections cannot reach typed addresses (FR-C4); default templates ship in English and French (FR-A15); the Locations & Organizations Delivery filter and readiness count (§K); WhatsApp templates (FR-A18, Release 2).
- Acceptance Criteria AC-60 to AC-72 added; Release 2 ACs marked.

### Changes in v0.2

- **Versions are created at issue** (D-236): print, Send or automatic delivery, whichever comes first for that content. Amended means a result that was *issued* (printed or sent) changed. Automatic delivery now creates the version when the hold ends (FR-C1 to FR-C4).
- **Central delivery is removed** (D-237, supersedes D-234). It belongs to the Results Portal specs. FR-G2 to FR-G5 are marked removed; secure links stay (FR-G1).
- **Lab-wide delivery settings move to Configuration**, Notifications area (`/MasterListsPage/configuration?area=notifications`, D-241). The Delivery Settings page and the "default report format" setting are gone: no password always means a masked copy. The Notifications group has four pages: Channels, Templates, Distribution Lists, Triggers.
- **Privileges finalised:** NEW `distribution_list:manage` in Quality (D-238); `delivery_password:view` renamed `delivery:view_password`; alert rule authoring stays with `test:configure` (D-239); Channels needs `notification:manage`.
- **The ready notice may include the patient's first name** (D-231 amended). Merge fields: `{patient_first_name}`, `{lab_name}`, `{lab_contact}`.
- **New requirements:** certificate delivery (FR-C16), ward addresses added to the facility's (D-240), at-least-once outbox with attempt history, one row per recipient per channel (FR-A7 to FR-A10), one SMS when an alert instruction and a result message meet (FR-F6), "Ask recipients to confirm receipt" kept apart from Critical Acknowledgment (FR-E6), retired order entry provider boxes (FR-H4) and `mail.bcc` (FR-H5).
- **Information & Data** declares every new data element; **Localization** is rebuilt with a REUSE/NEW column and a key for every visible string and default template; **Acceptance Criteria** AC-31 to AC-58 added; **Docs Impact** section added.
- Headings no longer carry double letters; admin breadcrumbs read "Admin Management"; cross-references fixed.
- **Decision IDs move up by two** (D-222 to D-243) because the shared ledger on `main` already holds D-220 and D-221.
- Preview alignment (same day): Send is one label for row and toolbar (`reportQueue.action.send`); a send issues a version only when at least one message is queued (FR-C5, AC-59); Send counts and AC-11 count only queued reports and recipients (FR-J4); certificate report line and protection note keys; patient instruction-only text reads "{lab_name} to {patient_first_name}: ..."; Delivery tags name the password state ("no password"); facility alerts use the Result delivery addresses (FR-E2); sibling keys (`admin.locations.delivery.*`, `admin.configuration.notifications.*`) are REUSE; Open Question 3 on Referral Out.

---

## Lab Context

### Current State

When a laboratory finishes testing a sample, someone has to get the result to the person who acts on it. For patient samples that is the clinic, ward or doctor who sent the sample. For environmental samples (water, food, soil) and vector samples (mosquitoes and other disease-carrying insects) it is the client who submitted them, such as a water utility or a district health office. For a small number of dangerous diseases (Ebola, cholera, a new influenza strain), health officials also need to know within hours.

Today most labs print the report and hand it to a driver, or a clerk downloads the PDF and attaches it to an email from a personal mailbox. OpenELIS has three separate places that send automatic messages. Test Notifications emails or texts a short message per test result. Test Catalog Alerts emails or texts a fixed English line when a result matching a rule is typed in. Notification Triggers emails referral events and keeps a list of what it sent. None of them can attach the report. None can address a facility or an environmental client. Only one keeps a record of what was sent.

Three terms used below: a **partial report** is a report issued before every test on the order has a result; the **Report Print Queue** (OGC-1031) is the OpenELIS page where staff print, reprint and correct released reports, and where each report's versions are kept; **ISO 15189** is the international standard medical laboratories are accredited against, and it requires the lab to know who received each report and each corrected report.

### Pain

- A clinician who orders a 12-test chemistry panel can get 12 separate emails, none of which says when the order is complete or carries the signed report.
- Most results go to facilities, not to named doctors, and the facility's email address is on file but nothing sends to it. A district hospital lab that sends 200 samples a day still collects paper.
- Alerts are sent when a result is typed in, before a second person has checked it. A typo can reach a health official as a positive Ebola result.
- The default patient message that ships today reads "Malaria testing results have been finalized for Patient: Mary K. Result: Positive". On a shared family phone that is a disclosure the patient never agreed to.
- When a printed result is corrected, nobody knows who received the wrong version, so the correction cannot be sent to them.
- A clerk who emails a report from a personal mailbox leaves no record in OpenELIS of who got which version, which an ISO 15189 assessor will ask for.
- Typing a different facility email at reception silently replaces the facility's address for every later order.

### What Changes

The report the lab already prints becomes the thing it sends. In the Report Print Queue a clerk ticks the reports for a facility and presses **Send**. Each facility gets its reports as protected PDFs, opened with a password the lab gave the facility once by phone. In Release 1 a facility with no password receives no patient reports by email until the lab gives it one; in Release 2 it gets a masked copy without the patient's name. Facilities that have chosen automatic delivery receive each report a few minutes after results are released, including partial reports, and receive corrected versions automatically. A report version is created the first time its content is issued, by print or by send, so a printed copy and an emailed copy of the same content are the same version. Every send appears in the report's history next to its prints, and in one **Sent Messages** list with Resend.

Alert rules on a test fire only on validated results. They can reach named lists of officials ("Provincial Health Office: Viral haemorrhagic fever"), the facility and the ordering clinician. Patients whose order asked for it get a short notice that their results are ready, with no result in it, unless the clinician also chose to include the result. Email and SMS (and WhatsApp, in Release 2) are set up once, in one place, and work for all of these.

**What the delivery password protects.** The delivery password is a secret shared by the facility, not by one person. It protects a report that goes to a wrong or old address, and one forwarded casually outside the facility. It does not protect against people inside the facility or the lab, and it is not meant to. It is deliberately easy to give out again (Show, Copy), because a report nobody can open is worse than one protected by a password many people at the facility know. Changing it is for when it has leaked outside the facility (D-248).

**Presumptive results.** OpenELIS sends no unvalidated result to anyone outside the lab (D-230). When a programme's policy asks the lab to tell officials about a presumptive result before validation, lab staff still phone them; OpenELIS helps by flagging the result to validators as a priority (FR-E10).

---

## Overview

Result Delivery sends released results and reports to the people who act on them, by email and SMS (and WhatsApp in Release 2), safely and with a record. It has three products on one shared foundation.

| Product | What is sent | When | Typical recipient |
|---|---|---|---|
| **Report delivery** (product 1, primary) | The report PDF for one order and version, protected (masked in Release 2; certificates protected or as issued) | A report version is issued by automatic delivery after the hold, or a user presses Send | Facility (and ward), ordering clinician, environmental or vector client |
| **Priority result alerts** (product 2, secondary) | A short message about one result | A result matching an alert rule is validated | Distribution lists of officials, facility, clinician; an instruction to the patient |
| **Patient results-ready notice** (product 3, tertiary) | "Your results are ready", no result; or, when the order opted in, a message with one result | The notice: every counted analysis on the order is released. A message that includes a result: that result is validated | Patient |

The shared foundation is: **channels** (Email, SMS; WhatsApp in Release 2), **recipients** and their delivery settings, **templates**, a **persistent outbox** with retry, one **Sent Messages** log, and **privacy rules** that hold in every product.

Result Delivery runs inside OpenELIS and sends from the lab's own server. Central delivery, where a separate application on the central FHIR server serves results to facilities that log into it, is a later phase owned by the Results Portal specs (Out of Scope, D-237).

### Navigation & URL

| Page | SideNav placement | Breadcrumb | URL route |
|---|---|---|---|
| Send (dialog) | Main menu → Reports → Report Print Queue | `Home / Reports / Report Print Queue` | `/ReportPrintQueue` (new route from OGC-1031, not yet on `develop`; Send is an action, not a route) |
| Sent Messages | Main menu → Reports → Sent Messages (after Report Print Queue) | `Home / Reports / Sent Messages` | `/SentMessages` (new). Deep-linkable filters: `?product=report\|alert\|patient_notice\|trigger\|test`, `?status=queued\|sent\|delivered\|failed\|skipped`, `?channel=email\|sms\|whatsapp` (`whatsapp` from Release 2), `?labNo=` |
| Channels | Admin → Automation → Notifications → Channels | `Home / Admin Management / Notifications / Channels` | `/MasterListsPage/notificationTriggerConfig/channels` (new sub-route) |
| Templates | Admin → Automation → Notifications → Templates | `Home / Admin Management / Notifications / Templates` | `/MasterListsPage/notificationTriggerConfig/templates` (new sub-route; a tab today) |
| Distribution Lists | Admin → Automation → Notifications → Distribution Lists | `Home / Admin Management / Notifications / Distribution Lists` | `/MasterListsPage/notificationTriggerConfig/lists` (new sub-route) |
| Triggers (existing) | Admin → Automation → Notifications → Triggers | `Home / Admin Management / Notifications / Triggers` | `/MasterListsPage/notificationTriggerConfig/triggers` (new sub-route; a tab today) |
| Lab-wide delivery settings | Admin → Config → Configuration, **Notifications** area (Admin Redesign) | `Home / Admin Management / Configuration` | `/MasterListsPage/configuration?area=notifications` |
| Facility delivery settings | Admin → Organization → Locations & Organizations → Organizations (open row, Result delivery section) | `Home / Admin Management / Locations & Organizations / Organizations` | `/MasterListsPage/locations` (existing) |
| Alert rule recipients | Admin → Resources → Test Catalog → Tests → a test → Alerts | existing | existing |
| Patient notice opt-ins | Order entry (clinical), Result reporting block | existing | existing |

Notes:

- **Notifications** replaces the Admin entries **Notification Triggers** (A-05) and **Test Notifications** (A-04) as one SideNav group with four pages: **Channels, Templates, Distribution Lists, Triggers** (following the 2026-10-12 admin audit). There is no Delivery Settings page: lab-wide settings live in Configuration, whose Notifications area links to the four pages (D-241).
- `notificationTriggerConfig` is one route with tabs (Triggers, Templates, Sent Messages) on `develop` today. The four sub-routes are new; the old route opens Triggers. The old Sent Messages tab (`notificationTriggerConfig/sent`) redirects to `/SentMessages?product=trigger`. `testNotificationConfigMenu` and `testNotificationConfig` redirect to Templates once Test Notifications retires (FR-H1).
- A user sees only the Notifications pages they can open (Access). A user who holds `distribution_list:manage` alone sees the group with Distribution Lists only.
- Sent Messages sits in the main menu under **Reports** (D-064 section order) because clerks who send reports use it daily; it is not an admin page.

---

## Releases

Result Delivery ships in two releases (D-244). Every requirement and acceptance criterion that belongs only to Release 2 is marked "Release 2"; everything else is Release 1.

| Release | What it contains |
|---|---|
| **Release 1** | Email and SMS channels (SMS through TextIt, and Twilio, BMP or SMPP as today); the persistent outbox, Sent Messages, Templates and Distribution Lists; report delivery with the **protected full report only**; certificates (protected, or as issued when the client has no password); priority result alerts; the patient ready notice and patient result messages; secure links where the server has a public address. |
| **Release 2** | The **masked copy** (FR-C10, FR-C11; OGC-1111 FR-A61 masked mode; the Report Print Queue's masked archive, OGC-1031 FR-8.4), and **WhatsApp through TextIt's WhatsApp channel** (FR-A4, FR-A18). WhatsApp messages started by the lab must use templates approved by Meta, and each one costs money. In Release 2 the WhatsApp templates are registered and approved in TextIt, and OpenELIS sends the template name with the merge values. Free text edited on the Templates page is never sent over WhatsApp. |

**Release 1 without a masked copy** (D-245). A patient report goes only to a recipient whose delivery password is known. A recipient with no password is Skipped with the reason "No delivery password" (FR-A9). Clinicians use the order's facility password, and are skipped the same way when the facility has none. An address typed for one send gets the protected copy with the order's facility password when the facility has one, and is otherwise skipped (FR-D3). Certificates are not affected: protected with a password, as issued without one (FR-C16). In Release 2, recipients without a password get the masked copy instead of being skipped (FR-C8).

**What needs a public server address.** Receipt confirmation (FR-E6), escalation (FR-E7) and secure links (FR-G1) work only when people outside the lab can reach the lab's server over the internet, which means the public server address is set (FR-A16). Most labs have no public address. For them, alerts go without a confirmation link, no escalation runs, and reports go as attachments only. Everything else in Release 1 works without a public address, including TextIt delivery status, which OpenELIS fetches from TextIt (FR-A10).

**Build order.**

1. **Foundation with email:** Channels, the outbox, Sent Messages and Templates, sending by email (section A).
2. **Alerts and patient messages:** priority result alerts (section E) and patient notices (section F). They do not need the Report Print Queue.
3. **Report delivery** (section C): needs the Report Print Queue (OGC-1031) and the patient report redesign's version printing (OGC-1111 FR-A15, FR-A15a, FR-A41).
4. **Release 2:** the masked copy and WhatsApp.

**Interim homes.** Until the Admin Redesign Configuration page ships, the lab-wide delivery settings (FR-A16) are `site_information` entries edited on the existing Site Information page (legacy), so the foundation needs no new settings page. Until PR #3443 merges, the existing stand-ins for the privileges apply (Access).

---

## User Stories

- As a **reporting clerk**, I want to select today's reports for one facility in the Report Print Queue and send them in one action, so that the facility has them within the hour without a driver.
- As a **lab manager**, I want each facility's reports to go out as a password-protected PDF the facility already knows how to open, so that a mistyped address or a forwarded email does not expose a patient's name.
- As a **district surveillance officer**, I want an SMS and email within minutes of a validated cholera-positive result, so that I can start the response the same day.
- As a **patient**, I want a text saying my results are ready, without the result in it, so that I know to visit the clinic and nobody else reading my phone learns anything.
- As a **quality manager**, I want every send recorded against the report version it carried, so that I can show an assessor who was sent which version and when (for email, when the lab's mail server accepted it; for SMS through TextIt, when it was delivered).
- As a **surveillance officer in the lab**, I want to keep "Provincial Health Office: Cholera" up to date myself when a duty officer changes, without being made a system administrator.

---

## Functional Requirements

### A. Shared foundation: channels, outbox, log

| ID | Requirement | Notes |
|---|---|---|
| FR-A1 | **Channels page** lists the channels, Email and SMS (and WhatsApp from Release 2), each as a row with Connection (for example `smtp.health.gov.pg:587, STARTTLS` or `TextIt, channel 4f1c…a2`), Status (Ready, Not set up, Failing), last successful send, and Edit (Set up when not set up). **Failing** means the last three attempts on that channel (sends or tests) failed in a row; the row shows the time and error of the last one. A successful attempt returns the channel to Ready. One connection per channel is active at a time. | The WhatsApp row is Release 2. A new page over the same `external_connection` rows (one row per type, already enforced); no data moves (FR-H2). Replaces the SMTP, BMP, SMPP and WhatsApp rows of External Connections (A-01). External Connections keeps other endpoint types. |
| FR-A2 | **Email** row expansion: SMTP host, port, security (STARTTLS, SSL/TLS, None), username, password, sender address, sender display name, reply-to address. **Send test email** to a typed address. | Sender address moves from the server file `org.openelisglobal.mail.from` to the database; the property stays as fallback, and Configuration shows it read-only with a link to Channels. STARTTLS is no longer forced. `org.openelisglobal.mail.bcc` is retired (FR-H5). |
| FR-A3 | **SMS** row expansion: gateway (TextIt, Twilio, BMP, SMPP) and the gateway's fields. TextIt: API address, token, channel UUID. Twilio: sender number (from `org.openelisglobal.notification.twilio.from` until saved here). BMP and SMPP: as today. **Send test SMS** to a typed number. Numbers typed without a country code use the lab's default SMS country code (FR-A16). | TextIt is new (from OGC-437). Twilio is today a provider of the BMP sender (`org.openelisglobal.notification.bmp.provider`); Channels shows it as its own choice. |
| FR-A4 | **WhatsApp** row expansion: WhatsApp is sent through TextIt's WhatsApp channel, so the row takes the TextIt API address, token and the WhatsApp channel UUID, plus **Send test message** (which uses an approved template, FR-A18). | **Release 2.** Until then the existing WhatsApp connection stays in External Connections (FR-H2) and Result Delivery sends nothing by WhatsApp. |
| FR-A5 | **Secrets are never returned to the browser.** Passwords and tokens show as "Set" with a **Replace** action; saving with the field untouched keeps the stored value. | Admin Redesign AS-31. Fixes `GET /rest/ExternalConnection` returning the decrypted password (also filed as a defect, §I). Delivery passwords (FR-B3) are the deliberate exception (D-225, D-243). |
| FR-A6 | A test send reports success ("Test message sent to {address}."), or the server's error in plain language ("Authentication failed: check the username and password.", "Could not reach smtp.health.gov.pg on port 587."), shown under the address field. It is recorded in Sent Messages as product "Test". | |
| FR-A7 | **Persistent outbox.** Every message is recorded with status Queued before any attempt is made, as **one row per recipient per channel**. Sending works from that record, so a server restart or a channel outage delays messages and never loses them. Delivery is **at least once**: if the server stops after a gateway accepted a message but before its status was written, the message may be sent again after restart. Each attempt records the gateway's message ID, so a repeat can be seen. | Replaces in-memory `@Async` sends (`AsyncNotificationDispatcher`) for all three products. Follows the built background-job pattern of `ReportingWorker`. |
| FR-A8 | **Retry.** A failed attempt is retried after 1, 5, 15, 30 and 60 minutes, then every hour, until 24 hours after the message was queued; only then is it marked Failed. While it is being retried the message stays **Queued** with "Next attempt at {time}", so an outage of a few hours delays messages and fails none. The channel shows Failing after three failed attempts in a row (FR-A1). Every attempt is kept in the message's attempt history (time, result, error). A message that fails because the channel is not set up is marked Failed at once with "Email is not set up" (or "SMS is not set up", "WhatsApp is not set up"). | Delays and the time limit are lab-wide settings (FR-A16: `deliveryRetryMinutes`, `deliveryGiveUpHours`). D-247. |
| FR-A9 | **Skipped is a status, not a silence.** When a recipient has no address for the channel, has a number that cannot be put in international format, or is inactive, or a patient has no email or phone, a row is written with status Skipped and the reason (one reason text per channel: "No email address", "No SMS number", "No WhatsApp number"). In Release 1, a patient report for a recipient with no delivery password (and, for a clinician or a typed address, no facility password) is also Skipped, with the reason "No delivery password. Set one in Locations & Organizations." (D-245). | "No WhatsApp number": Release 2. |
| FR-A10 | **Sent Messages** (`/SentMessages`) lists every message from every product, newest first. **Products:** Report, Alert, Patient notice, Trigger event, Test (`product=report\|alert\|patient_notice\|trigger\|test`). **Statuses:** Queued, Sent, Delivered, Failed, Skipped (`status=queued\|sent\|delivered\|failed\|skipped`). **What Sent means:** for email, Sent means the lab's mail server accepted the message; in Release 1 OpenELIS cannot see bounces or spam folders, and the page says so under the status filter ("Sent means the mail server accepted it. Bounces are not tracked."). For SMS through TextIt, OpenELIS asks TextIt's API for each sent message's status (polling, so no public server address is needed) and records **Delivered** or **Failed** when TextIt reports it; a Failed report from TextIt is written to the attempt history with TextIt's reason. SMS through other gateways stays at Sent. Columns: time, product, lab number, recipient (name and masked address, `ja••••@health.gov.pg`), channel, content (format and version for reports, rule for alerts, "No result" or "Result included" for patient notices, event for trigger events), status with reason, attempts, sent by (user or "Automatic"). The rows of one rule firing or one batch Send are grouped under one expandable row that shows the counts per status; each member row keeps its own status. Filters: product, status, channel, period, and one search over lab number and recipient. Server-side paging. **Scope:** rows tied to an order (reports, alerts, patient notices) follow the print queue's lab-unit scope (OGC-1031 BR-9). Trigger event rows, visible only to administrators today, become visible to every `delivery:view` holder. | Widens today's Sent Messages (`notification_log`) and OGC-587's tab. Delivered and the TextIt status poll: D-249. The `whatsapp` channel value appears from Release 2. |
| FR-A11 | A Sent Messages row expands to show the rendered subject and body, the attempt history with errors, for reports the version(s) and format sent with the attachment name, the archive SHA-256 of the version and, beside it, the SHA-256 of the file actually sent (for a protected copy, the encrypted PDF; for a certificate as issued, the same as the archive hash), for alerts each member's status and receipt confirmation, for secure links each opening, and links to the order and to the report version in the Report Print Queue. | Rendered content is visible only to users with `delivery:view`. |
| FR-A12 | **Resend** on a Sent, Failed or Skipped row sends the same rendered content again to the same recipient (after the address is corrected, for Skipped) and links the new row to the original. For a report, Resend sends the same archived version, not a newer one. A resend of a protected report re-encrypts the archived version with the recipient's current delivery password and records that password's set date. | Widens `NotificationLogServiceImpl.resend`, which today accepts only rows with a Failed channel and has no SMS case and no attachments, to Sent and Skipped rows, SMS and attachments. The link uses the existing `resent_from_id`. |
| FR-A13 | **Templates page** edits every message the feature sends. A **Message type** selector (Report delivery, Priority alert, Patient ready notice, Patient result, and the existing trigger events), a **Recipient** selector for priority alerts (distribution list or fixed address; distribution list that may receive patient identifiers; the order's facility; the ordering clinician; the patient, instruction with result; the patient, instruction only), a **Channel** selector (Email: subject and body; SMS: one text; WhatsApp, from Release 2: the approved template name and the values sent, FR-A18) and a **Language** selector pick the template. Each editor has Insert field (the allowed merge fields, FR-D2), a live preview with example values, a character count for SMS ("{n} of 160 characters, 1 SMS"), Save and Restore default. A line whose merge fields all render empty is left out (for example the receipt-confirmation line when a rule does not ask for it). Templates have an Active state; inactive templates are hidden until **Show inactive** is on. A template that alert rules override shows how many rules do. | Reuses `NotificationPayloadTemplate`, `EventVariableRegistry`, `DefaultPayloadTemplates`, with the new locale, active flag and payload types declared in Information & Data. |
| FR-A14 | **Merge fields are restricted per slot** (FR-D2). Insert field only offers allowed fields, and save is refused with a named error if a disallowed or unknown field was typed in ("{patient_name} cannot be used in this message: it is not safe for this recipient. Remove it to save."). | |
| FR-A15 | Default templates ship in **English and French** (English texts in Localization). A message is rendered in the recipient's language when one is set (FR-B1), otherwise the lab's default language. For any other language, messages use the English default until the lab saves its own text in that language; the Templates page shows "No {language} text yet" for it. Interface keys follow the usual rule: English and French with each slice, other languages through the normal translation workflow. | Keeps the translation load to two languages per template. |
| FR-A16 | **Lab-wide delivery settings** live in the Admin Redesign **Configuration** page, Notifications area (`/MasterListsPage/configuration?area=notifications`), stored as `site_information` entries: wait before sending a new version (minutes, default 10); send partial reports automatically (default on); retry delays (minutes, default 1, 5, 15, 30, 60; after the last delay, every hour); stop retrying after (hours, default 24, block Sending and retries); default SMS country code (for example +675); public server address (empty by default; needed for secure links, receipt-confirmation links and escalation, which are all off while it is empty; most labs leave it empty, Releases); secure links (Off, Link as well as the attachment, Link instead of the attachment; available only when the public server address is set); link lifetime (days, default 30); and **Send a test** to a typed email address or phone number. The area also shows, read-only, the **lab contact** used in messages and masked copies, which is the existing additional site information line (`additionalSiteInfo`, Admin Redesign RM-8, OGC-1111 FR-A62), with a link to its editor; the sender address (`org.openelisglobal.mail.from`) with a link to Channels; and link rows to Channels, Templates, Distribution Lists and Triggers. There is no "default report format" setting: a recipient with no delivery password is skipped in Release 1 and gets the masked copy in Release 2 (FR-C8). | D-241. Editing these settings needs `notification:manage`. Until the Configuration page ships, the same `site_information` entries are edited on the existing Site Information page (Releases, interim homes). |
| FR-A17 | Sent Messages and the Report Print Queue show times in the laboratory time zone. | |
| FR-A18 | **WhatsApp templates.** WhatsApp messages started by the lab must use a template approved by Meta, and each message costs money. Each WhatsApp slot (the same message types and recipient kinds as SMS, FR-A13) is registered and approved in TextIt by the lab; on the Templates page the WhatsApp channel shows the **approved template name** for the slot and the values OpenELIS sends with it, in order, chosen from the slot's allowed merge fields (FR-D2). OpenELIS sends the template name with the merge values, never free text: text edited on the Templates page is never sent over WhatsApp. A slot with no template name sends nothing by WhatsApp and writes a Skipped row "No approved WhatsApp template". The SMS default texts are the suggested wording for the templates registered in TextIt. | **Release 2.** D-244. |

### B. Recipients and delivery passwords

| ID | Requirement | Notes |
|---|---|---|
| FR-B1 | **Facility delivery section.** In Locations & Organizations, an organization's open row has a **Result delivery** section: report email addresses (one or more), report SMS or WhatsApp number, send reports automatically (Off, On), include partial reports (Lab default, Yes, No), language (the language of every message to this organization, FR-A15), and **delivery password** (FR-B3). On upgrade, each organization's report email list is seeded from `Organization.email`; afterwards the general email and the report addresses are separate fields. A **ward or department** can have its own report email addresses: they are **added** to the facility's, so a report for that ward goes to both. Wards use the facility's delivery password and have no SMS number. | D-240. Organization `email` and `phone` exist; the section adds delivery-specific fields. Locations & Organizations FR-N1 holds the fields and mints their keys. |
| FR-B2 | **Environmental and vector clients.** When the order's requesting organization has Result delivery set, it is used. Otherwise the order's requestor contact email and phone are used for that order, with automatic delivery off; with no delivery password, the client receives the certificate as issued (FR-C16); a patient report to such a client is skipped "No delivery password" in Release 1 and sent as a masked copy in Release 2. | `RequesterService.getRequestorEmail()` exists; it is used elsewhere but not by any notification today. |
| FR-B3 | **Delivery password per facility or client.** The field shows masked, with **Show**, **Copy**, **Generate** and **Change**. Show and Copy need `delivery:view_password`; Generate and Change also need `organization:manage`. Generate fills a 12-character password without look-alike characters (0/O, 1/l/I); it is displayed in groups of three for reading aloud (`K7M-PQ4-RTW-9XF`), and the hyphens are display only, not part of the password. An organization with no password shows "No password set. Patient reports are not sent to this organization until a password is set; certificates are sent as issued." (Release 2: "Patient reports to this organization are sent as masked copies; certificates are sent as issued.") and Generate. Change asks for confirmation (a danger Modal, Admin Redesign AS-28) and warns: "Reports already sent stay locked with the old password." The record shows the date the password was last set and by whom. **Scope of the protection:** the password is a secret shared by the facility. It protects reports sent to a wrong or old address and casual forwarding outside the facility; it does not protect against people inside the facility or the lab, and is not meant to. It is deliberately easy to give out again (Show, Copy), because a report nobody can open is worse than one protected by a widely known password; Change is for when it has leaked outside the facility. | Decided 2026-10-15: the password can be shown again so it can be given out without changing it. Stored with reversible encryption through `EncryptionConverter`, never hashed; the exception to Admin Redesign AS-31 (D-225, D-243). Usefulness over secrecy: D-248. |
| FR-B4 | Every Show and Copy of a delivery password is recorded in the organization's History with user and time, never the password. Show hides the password again after 30 seconds or when the row closes. | |
| FR-B5 | The delivery password is also shown (with Show and Copy, same logging) in the Send dialog (FR-C6) for the recipient row, to users with `delivery:view_password`, so a clerk on the phone with a facility can read it out. | Decided: Report Print Queue users can show it. |
| FR-B6 | **Ordering clinician.** The provider on the order is a recipient when the provider record has an email or phone number (`Person.primaryPhone`, falling back to `cellPhone`). The order's Result reporting block has one box per order, **Send reports to the ordering clinician**; when it is ticked, the clinician receives each version of that order's report sent automatically (FR-C2) and is ticked by default in the Send dialog; when it is not ticked, the clinician appears in the Send dialog unticked. Clinicians have no delivery password of their own: a report to a clinician uses the facility's password when the order has a facility with one; otherwise it is skipped "No delivery password" in Release 1 and sent as the masked copy in Release 2. | Provider email and phone are on the provider's Person. Replaces the per-test provider Email and SMS boxes at order entry (FR-H4). |
| FR-B7 | **Distribution Lists page.** A list has a name, description, members (each a name plus email and/or phone number, and Active), "May receive patient identifiers" (Yes or No, default No), and Active. The list table shows Name with description, Members (count), May receive patient identifiers, **Used by rules** (the alert rules that link the list) and Active, with a search and a **Status** filter (Active by default, Inactive, All). An open list has **Add member**, and **Deactivate** per member; inactive members are hidden until "Show inactive members" is on and receive nothing. Lists and members are never deleted; they are deactivated (design-addendum MUST D). Deactivating a list that rules use asks for confirmation naming how many rules use it. Upkeep needs `distribution_list:manage`. | New. D-238. |
| FR-B8 | **Order entry no longer rewrites a facility's addresses.** An email or phone typed for the referring site at order entry applies to that order only and shows "Used for this order only. Change the facility's addresses in Locations & Organizations." It does not change the organization record. It is stored on the order as the additional contacts of its analyses' notification options (`NotificationConfigOption.additionalContacts`). | Fixes `SamplePatientUpdateData.java:711-717`. |
| FR-B9 | Addresses are validated on entry (email format; phone convertible to international format with the default SMS country code). | |
| FR-B10 | The Organizations list shows a **Delivery** column as a Tag with text: "Automatic, protected", "Automatic, no password", "Manual, protected", "Manual, no password", or "No report email" (gray). The second word is the password state, not a format, so the tag is right for every kind of recipient: with no password a patient report is not sent in Release 1 (a masked copy in Release 2) and a certificate goes as issued (FR-C8, FR-C16). "Automatic, no password" uses a warning colour (amber), because patient reports to that organization are not sent until a password is set. Turning on automatic delivery for an organization with no password shows the warning "Patient reports will not be sent until a delivery password is set." The list also has a **Delivery** filter (All, Ready, No report email, No password) and a count above it ("{n} facilities can receive reports by email"), so the lab can see how much of its directory is ready before turning on automatic delivery. | Locations & Organizations FR-N3, FR-N8, FR-N9. |
| FR-B11 | The order's Result reporting block shows, read-only, how the requesting facility receives reports: "{facility} receives reports automatically by email.", "{facility} receives reports when the lab sends them from the print queue." or "{facility} has no report email." | So reception knows whether to tell the patient or clinician to expect a printed report. |

### C. Report delivery (product 1)

| ID | Requirement | Notes |
|---|---|---|
| FR-C1 | **What is sent is a report version, and versions are created at issue.** A report version is created when the report is first issued with that content: printed, sent from the print queue (Send), or sent by automatic delivery, whichever comes first. Re-issuing identical content (reprint, resend) creates no version. Every issue, print or send, is an event in the version's issue history. Delivery always sends a version that the Report Print Queue pipeline has rendered and archived. Covers patient reports, environmental and vector certificates, and results reports with no standard. | D-236. Depends on OGC-1031 FR-4.3, FR-4.4 (as amended by D-236) and the FR-6 pipeline and archive (D-141). |
| FR-C2 | **Automatic delivery, batched per recipient.** When released results change an order's report content and the order's facility or client has automatic delivery on, delivery is queued after the hold (FR-A16). **The hold runs per recipient, not per order:** it starts when the first report becomes due to that recipient, and every report that becomes due to the same recipient during the hold joins it. Results released during the hold join the same version. When the hold ends for a recipient, the pipeline creates and archives each version (or uses the version already created if the same content was printed or sent during the hold), and every report version due to that recipient goes in **one email**, as the Send dialog does (FR-C6). An email is split into several when it would exceed 10 MB of attachments or 20 reports. SMS messages for reports (FR-C14) are one per recipient per hold window. **Amended versions are not held back:** an Amended version (FR-C4) starts its own hold for each of its recipients and goes in its own email, rather than joining a window that is already open. | No duplicate version when a print and an automatic send carry the same content. D-246. |
| FR-C3 | **Partial reports are sent** when the recipient's setting (or the lab default) allows. Each release of further results that is issued is a new version and a new send. Completing a partial report is a new version, not an amendment (D-140 as amended by D-236). | Decided 2026-10-15. |
| FR-C4 | **Amended versions.** A version is Amended when a result that was **issued** (printed or sent) has changed value, flag or unit or been removed, or when the version was made by Reissue with correction. Amended versions are queued automatically to every recipient who received any earlier version of that order's report, whatever their automatic setting, with the subject marked "Amended". **A correction cannot reach an address typed for one send** (FR-C7), because typed addresses are not saved as recipients: the version history of the Amended version lists each such address with "Not reachable: typed for one send", so the lab can contact that person another way. | ISO 15189 7.4.1.3 amended reports. OGC-1031 FR-4.4 (D-236). The history line is the print queue's key (§K). |
| FR-C5 | **Send from the Report Print Queue.** Each row's actions and the batch toolbar both offer **Send**, beside Print and Download, for users with `report:send`. Send is available for rows with at least one released result; when the current content has no version yet, Send creates and archives it through the same pipeline as Print, without opening a PDF. **A send issues a report only when at least one message is queued for it.** If every recipient of a report is skipped (for example the facility has no report email and no other recipient is ticked), no version is created, nothing is archived, and the row's Sent column shows Skipped. The same rule applies to automatic delivery (FR-C2). | OGC-1031 FR-6.13, FR-6.14 and AC-30. The row and toolbar label is the print queue's own key `reportQueue.action.send` ("Send"). |
| FR-C6 | **Send dialog** (a Modal, by recorded exception to D-005: sending cannot be undone, so the confirmation shows recipients and formats before anything is sent; D-242). Recipients are grouped by who receives them, so one facility gets one email with all its reports attached; each group heading names the recipient and lists its reports ("3 reports: CPHL-26-004188 v2, CPHL-26-004191 v1 (partial), CPHL-26-004195 v3 (amended)"). Each recipient row shows a tick box, the recipient (Facility, Ward / Dept, Clinician: {name}, Client: {name}, or Added for this send), the address, the format (in Release 1: Protected full report; for certificates, Protected or Certificate as issued; Masked copy is added in Release 2), and the password state ("Password set" with Show and Copy for `delivery:view_password` holders, "Facility password" for wards, clinicians and typed addresses, "No password: sent as issued" for certificates). A recipient with no address shows "No report email" and the tag **Will be skipped**. **In Release 1 a patient-report recipient with no delivery password** (or a clinician or typed address whose order's facility has none) shows "No delivery password" and the tag **Will be skipped**, and is not counted (FR-J4). The user can untick recipients, add a typed address (email or number) for this send only, or **Choose from the directory** (organizations and providers, by name) to add a known recipient. When the order's facility has no delivery password, the Send dialog says so before sending, under the address field: "This order's facility has no delivery password, so this report cannot be sent to a typed address yet." **Release 2:** the format can be changed to Masked copy for one send, and recipients with no password show "No password: masked copy" (typed addresses: "Typed address: masked copy") instead of being skipped. | |
| FR-C7 | A typed address is shown back in a confirmation line before sending. Release 1: "Send 2 reports to dr.kila@gmail.com, protected with the facility's delivery password? This address is not in the directory and will not be saved." Release 2, when the facility has no password: "Send 2 reports to dr.kila@gmail.com as masked copies? This address is not in the directory and will not be saved." | Decided: anyone with `report:send` may type an address. |
| FR-C8 | **Full reports are only ever sent protected.** There is no setting for this and no unprotected full report. **Release 1:** the only patient report format is Protected full report, which requires the recipient's delivery password (for wards, clinicians and typed addresses, the order's facility password); a recipient with no password is Skipped "No delivery password" (FR-A9, D-245). **Release 2:** the formats are Protected full report and Masked copy, and a recipient with no password gets the masked copy. A secure link (FR-G1) is a way of delivering a format, not a further format. | Decided 2026-10-15; Release 1 rule D-245, Release 2 rule D-224. |
| FR-C9 | **Protected full report** is the archived PDF of the version, encrypted with the recipient's delivery password using AES-256 (PDF 2.0, standard security handler revision 6), which current phone and desktop PDF readers open. The send records that it was encrypted and with which password set date, never the password. | |
| FR-C10 | **Release 2.** **Masked copy** is the same version rendered with patient identity reduced, as OGC-1111 FR-A61 defines (that FR owns the field list). Removed: name (initials kept), national ID, address, phone, the contact-tracing index name and record number, billing number and subject (ST) number. Kept: initials, sex, age, date of birth, patient ID, the requester's order number, requester, facility and ward, collection date, all tests, results, flags, comments and signatures. The page shows the OGC-1111 line `report.patient.masked.line` ("Masked copy: patient name and national ID removed. Contact {lab} for the full report."), where the lab contact is `additionalSiteInfo`. Masking is done in the data given to the template, so no template can print the removed fields. | **Release 2** (D-244). Decided: patient ID stays. D-227. |
| FR-C11 | A masked copy is archived with its own SHA-256 and linked to the version it was rendered from. | **Release 2.** Extends D-141. OGC-1031 FR-8.4. |
| FR-C12 | **Every send is an issue event** on the version: the print queue's version history shows sends beside prints ("Sent 14:32 to Port Moresby General Hospital, protected, by J. Kaupa"; "by Automatic" for automatic sends). | Widens the OGC-1031 issue history (§6.2). |
| FR-C13 | **Email content for reports.** Subject: lab name, state and report count ("CPHL results: Final, 3 reports"). For a batch the state is "Amended" if any report in it is amended, "Final" if all are final, otherwise "Partial and final". Body: the list of attached reports, each with lab number, requester's order number and its own state ("CPHL-26-004191 (your order PMGH-88219): Partial, 4 of 6 results, version 1"); a certificate's line reads "{labNo}: Certificate, version {n}"; a sentence about protection that depends on the format (protected: "The attached PDFs are protected with your delivery password.", followed on its own line by "Open the attachment with a PDF reader app and type the delivery password. Some email previews cannot open protected files."; masked, Release 2: "The attached reports are masked copies: patient names and national ID numbers are removed."; certificate as issued: "The attached certificates are sent as issued."); and the lab contact. Attachment names follow the print queue: patient reports `{labNo}-v{n}.pdf`, masked copies `{labNo}-v{n}-masked.pdf` (Release 2), certificates `LH-{labNo}-v{n}.pdf` and amended certificates `LH-{labNo}-Am{n}.pdf`. | Default texts in Localization. |
| FR-C14 | **SMS and WhatsApp for reports** carry no attachment and no patient data. They say that reports are ready, how many, and how to get them: by email if the facility has a report email, by secure link when links are on (§G), otherwise by contacting the lab. A recipient gets one SMS per hold window, however many reports the window holds (FR-C2). | WhatsApp: Release 2 (FR-A18). |
| FR-C15 | A report with nothing released is never sent. A send for an order whose newest version is older than one already sent to that recipient asks "A newer version was already sent on {date}. Send this older version?" | |
| FR-C16 | **Certificates** (environmental and vector) identify no patient, so masking does not apply. With a client delivery password the certificate is sent protected; without one it is sent as issued. A typed address receives it as issued. Attachment names are `LH-{labNo}-v{n}.pdf` and, for amended versions, `LH-{labNo}-Am{n}.pdf`. | New in v0.2. |

### D. Privacy rules (every product)

| ID | Requirement | Notes |
|---|---|---|
| FR-D1 | **Patient name and national ID never appear in readable form** in any email subject, email body, SMS or WhatsApp text, in any product, with two exceptions: alert messages to distribution lists marked "May receive patient identifiers" may carry the patient's full name (for contact tracing), and messages to the patient may carry the patient's own first name. The national ID never appears in any message. | Decided 2026-10-15; exceptions per D-226 and D-231. |
| FR-D2 | **Allowed merge fields per slot.** **Report** subjects, bodies, SMS and WhatsApp text: `{lab_name}`, `{lab_number}`, `{order_number}`, `{facility}`, `{ward}`, `{report_state}`, `{report_count}`, `{report_list}`, `{protection_note}`, `{secure_link}`, `{report_access}`, `{lab_contact}`. **Alert** to a distribution list not marked "May receive patient identifiers", a fixed address, the facility or the clinician: `{lab_name}`, `{rule_name}`, `{lab_number}`, `{order_number}`, `{facility}`, `{ward}`, `{test_name}`, `{result}`, `{flag}`, `{collection_date}`, `{age}`, `{sex}`, `{ack_link}`, `{lab_contact}`. **Alert** to a list marked "May receive patient identifiers": additionally `{patient_name}`, `{patient_id}`, `{patient_phone}`, `{patient_village}`. **Patient ready notice:** `{patient_first_name}`, `{lab_name}`, `{lab_contact}` only. **Patient result** (when "Include the result" is ticked, FR-F3): additionally `{test_name}` and `{result}`. **Patient alert instruction** (FR-E2): `{patient_first_name}`, `{lab_name}`, `{lab_contact}`, `{instruction}`, and `{test_name}` and `{result}` only when the test's Patient messages setting is **Result by default** or the order ticked "Include the result" for that test (FR-F6); otherwise the "instruction only" template is used. | Enforced by FR-A14. Field tokens are syntax and are not translated. |
| FR-D3 | **Free-typed addresses** (FR-C6). In Release 1 a typed address receives the patient report protected with the order's facility password when the facility has one, so the person the clerk is helping opens it with the password the facility gives them; when the facility has none, the typed address is skipped "No delivery password", and the Send dialog says so before sending (FR-C6). Certificates go to a typed address as issued. In Release 2, a typed address for a facility with no password receives the masked copy. A recipient picked from the directory uses its own delivery settings instead. | D-245. A typed address is not saved, so it never receives later versions (FR-C4). |

### E. Priority result alerts (product 2)

| ID | Requirement | Notes |
|---|---|---|
| FR-E1 | **Alerts fire on validated results only.** An alert rule's email, SMS and WhatsApp messages are queued when a result matching the rule is finally validated (including results finalized at entry and by vector pool deconvolution). The in-app alert and the critical-result alert stay at result entry, as now. Every result-entry path that dispatches alert messages today is removed in favour of validation: entered and modified results (`ResultEntryRestController.java:375`), calculated results (`ResultEntryRestController.java:382`), and both paths in Logbook results (`LogbookResultsRestController.java:602`, `:609`). | Decided. D-230. |
| FR-E2 | **Recipients on a rule:** distribution lists (FR-B7), the order's facility, the ordering clinician, the patient, and a fixed address. Any combination. The patient message is an instruction ("Please stay at home for 7 days and call 1800 200 for advice."); it includes the result only when the test's Patient messages setting is **Result by default** (FR-F4), or when the order ticked "Include the result" for that test, because the instruction then replaces the result message (FR-F6). This is the rapid SMS path for programmes such as COVID-19 testing. **The order's facility** receives the alert at its report email addresses and its report SMS or WhatsApp number from its Result delivery section (FR-B1), never at the organization's general email or phone; a channel for which the facility has no report address is written as Skipped (FR-A9). Authoring rules and their recipients needs `test:configure`, as today. | Wires `notifyOrderingPhysician`, `notifyReferringFacility` and `notifyPatient`, which exist unwired. D-239. |
| FR-E3 | Each recipient kind has its own template (FR-A13). A rule can override the text for one or more of its recipient kinds ("Use different text for this rule"); the override is subject to the same merge-field rules (FR-A14). | |
| FR-E4 | An alert to a recipient not allowed patient identifiers carries the lab number and requester's order number, so the receiver can look the patient up through the facility. | FR-D2 |
| FR-E5 | Alert sends appear in Sent Messages as product "Alert" with the rule name, one row per recipient per channel, grouped under the rule firing (FR-A10). | |
| FR-E6 | **Ask recipients to confirm receipt (optional per rule).** A rule field separate from `acknowledgmentRequired`. When on, each message carries a link "I have received this alert"; opening it shows "Thank you. Your confirmation was recorded." and records who confirmed and when on that member's Sent Messages row. It never writes `critical_callback` and is not Critical Acknowledgment (D-155); `acknowledgmentRequired` keeps its existing meaning. An invalid or already-used link shows a page saying so with the lab contact. **This works only when the lab's server can be reached from the internet** (public server address set, FR-A16). Most labs have no public address: for them the rule editor disables "Ask recipients to confirm receipt" with the helper "Set the public server address in Configuration to ask for confirmation.", alerts go without a confirmation link, and no escalation runs (FR-E7). | Needs the public server address (FR-A16); the field is disabled with a reason while it is empty (Releases). |
| FR-E7 | **Escalation (optional per rule, needs FR-E6).** When no recipient confirms receipt within the rule's escalation time (for example 60 minutes), an in-app alert is raised to every role holding `alert:view`, through the existing role notification (`HeaderNotificationService.notifyRole`): "Receipt not confirmed: Cholera RDT Positive, CPHL-26-004211, Provincial Health Office: Cholera. Phone them." It is acknowledged and resolved on the Alerts page like any other alert, by users with `alert:manage`. | Reuses the Alerts page and acknowledgement model (D-042). No lab-unit field is added to `Alert`. |
| FR-E8 | Alert messages are human notifications. Case-based reporting to national surveillance systems stays with FHIR exchange. | D-050 |
| FR-E9 | Alert rules are turned off, never deleted. The test's rule list hides rules that are off until **Show inactive rules** is on; the rule's Delete action is replaced by **Turn off rule**. | Design-addendum MUST D. Today rules are hard-deleted. |
| FR-E10 | **Priority results waiting for validation.** Messages still go only after validation (FR-E1, D-230). When a result that matches an alert rule with recipients outside the lab (a distribution list, the facility, the clinician, the patient or a fixed address) is **entered**, every holder of `result:validate` for that result's lab unit gets an in-app alert "Priority result waiting for validation: {test} {labNo}", and the result's row is pinned to the top of the validation page with a "Priority alert" Tag (text, not colour alone) until it is validated or rejected. Validating it then sends the rule's messages as usual. A result that stops matching the rule before validation (for example after a correction) loses the pin and the Tag. | Uses the existing in-app alerts (`HeaderNotificationService`) and the validation page (OGC-1364, §K). Labs still phone officials about presumptive results when their policy says so (Lab Context). |

### F. Patient results-ready notice (product 3)

| ID | Requirement | Notes |
|---|---|---|
| FR-F1 | **Opt-in at order entry.** The existing patient Email and SMS boxes in the order's Result reporting block mean "send the patient a results-ready notice". A ready notice (no result) is sent once, when **every counted analysis of the order is released** (the report is Final, or Amended with every result released), if any test on the order was ticked. A message that includes a result (FR-F3) is sent as soon as that test's result is validated, without waiting for the rest of the order; the ready notice still follows when every counted analysis is released, unless every ticked test already sent its result. The block shows a short summary of what the patient will receive. **The tick is the patient's consent:** the patient boxes sit under the label "Patient agreed to receive messages from the lab", and ticking or unticking one records who did it and when in the order history; ticking or unticking "Include the result" (FR-F3) is recorded the same way. There is one checkbox for each, and no separate consent form. | Reuses `AnalysisNotificationConfig` (PATIENT options) and `OrderResultReporting.jsx`. The provider boxes are removed (FR-H4). The consent record reuses the order history (audit trail). |
| FR-F2 | **The notice is the same for every order apart from the patient's first name.** It names the lab, may greet the patient by first name (`{patient_first_name}`), says results are ready, and asks the patient to contact their clinician or the lab, with the lab contact. It never names a test and never carries a result. | D-231 (amended). So the notice itself never signals what was tested. |
| FR-F3 | **Including the result is a second opt-in,** a box beside each ticked patient box: "Include the result". Its starting state comes from the test (FR-F4). Only users with `order:notify_result` can change it; others see its state read-only, with a Toggletip explaining why. When ticked, the patient receives a result message with the test name and result for that test. | Decided 2026-10-15. |
| FR-F4 | **Per-test Patient messages setting** in the Test Catalog, one of: **Ready notice only** ("Include the result" disabled with the Toggletip "This lab does not send this test's results to patients by message."; the ready notice is still sent); **Result when the order asks for it** (default; patient boxes start unticked); **Result by default** (the patient SMS box and "Include the result" start ticked whenever the patient has a phone number, and alert rules on this test may include the result in patient messages). The patient's phone is `Person.primaryPhone`, falling back to `cellPhone`. | Stored on the built per-test store: `TestNotificationConfig`'s patient option gains the three-value setting (Information & Data). Replaces a "sensitive test list"; the lab decides per test. "Result by default" serves rapid result SMS for programmes such as COVID-19 testing without anyone ticking boxes per order. |
| FR-F5 | A patient with no email and no phone number gets a Skipped row ("Patient has no email or phone number"), and the print queue row shows "Patient notice not sent: no contact". Order entry warns at the time the box is ticked: "The patient has no phone number or email. Add one in the patient record to send notices." | The print queue indicator is an OGC-1031 change (§K). |
| FR-F6 | **One message per result.** When an alert rule's patient instruction fires on a result for which the order also asked for a result message, the instruction replaces the result message: the patient receives one SMS (or email), not two. That one message carries the result when the test is "Result by default" or "Include the result" was ticked for that test; otherwise it carries the instruction only. | New in v0.2. |

### G. Secure links

| ID | Requirement | Notes |
|---|---|---|
| FR-G1 | **Secure links.** When the lab has a public server address and secure links are on (FR-A16), report messages carry a link as well as, or instead of, the attachment, as the setting says; SMS and WhatsApp report messages carry the link. A link is a way of delivering, not a format: it opens the same file the send would have attached (protected, a certificate as issued, or in Release 2 masked). A link is unique per send and expires after the configured lifetime. Each opening is logged on the Sent Messages row. An expired or unknown link shows a page asking the reader to contact the lab, with the lab contact. **Secure links work only when the lab's server can be reached from the internet.** Most labs have no public server address; for them the setting stays off (disabled with its reason) and reports go as attachments only. | Carries S-06b FR-14 to FR-20. Releases. |
| FR-G2 | **Removed in v0.2 (moved to Results Portal).** Was: central delivery publishing report versions to the consolidated FHIR server for a central service to send. | D-237. See Out of Scope. |
| FR-G3 | **Removed in v0.2 (moved to Results Portal).** Was: the switch between local and central delivery and its confirmation. | D-237. |
| FR-G4 | **Removed in v0.2 (moved to Results Portal).** Was: export and import of recipient settings, lists and templates for the central service. | D-237. |
| FR-G5 | **Removed in v0.2 (moved to Results Portal).** Was: rules written only in terms the FHIR exchange carries. | D-237. |

### H. Retiring the old paths

| ID | Requirement | Notes |
|---|---|---|
| FR-H1 | **Test Notifications retires.** On upgrade: each test's patient settings migrate to its Patient messages value on `TestNotificationConfig` (FR-F4): a test with patient email or SMS on becomes "Result when the order asks for it", and no test becomes "Result by default" through the upgrade, since that would send results nobody asked for; each test's provider settings become the starting state of "Send reports to the ordering clinician" for orders containing that test (Open Question 2); its templates are kept as inactive templates. Its menu entries (`testNotificationConfigMenu`, `testNotificationConfig`) redirect to Templates. | A-04 |
| FR-H2 | **External Connections** stops listing the SMTP, BMP, SMPP and WhatsApp types for new rows. Channels is a new page over the same `external_connection` rows (one per type, already enforced): nothing moves and row IDs are unchanged. A new `ProgrammedConnection` value `TEXTIT` is added for the TextIt gateway. The WhatsApp type leaves External Connections in Release 2, when Channels gains its WhatsApp row (FR-A4). | A-01 |
| FR-H3 | Notification Triggers' tabs become sub-routes (see the Navigation & URL notes). Its Sent Messages tab (`notificationTriggerConfig/sent`) redirects to `/SentMessages?product=trigger`. | A-05 |
| FR-H4 | **Order entry provider boxes retire.** The per-test provider Email and SMS boxes in the Result reporting block (`OrderResultReporting.jsx`, PROVIDER options on `AnalysisNotificationConfig`) are removed. The ordering clinician receives reports through FR-B6. On upgrade, an order with any provider box ticked gets "Send reports to the ordering clinician" ticked. The patient boxes become the Patient notices block (FR-F1). | One switch for "notify the clinician", not two. |
| FR-H5 | `org.openelisglobal.mail.bcc` is retired: Result Delivery never adds a blind copy, because a blind copy would send every report to an address that no recipient list shows. Configuration marks the property as retired. `org.openelisglobal.notification.twilio.from` stays as the Twilio sender number (FR-A3). | Admin Redesign Appendix B. |

### I. Defects fixed by this feature (also filed separately for an early fix)

| ID | Defect on develop | Fixed by |
|---|---|---|
| RD-X1 | The shipped patient template sends the result and the patient's name in plain text (`TestNotificationServiceImpl.java:80-81`), with a literal "someAddress" link (`:202-205`) | FR-F2, FR-D1, FR-H1 |
| RD-X2 | Test Catalog alert emails and SMS are sent at result entry, before validation, from every entry path: `ResultEntryRestController.java:375` (entered and modified results) and `:382` (calculated results), and `LogbookResultsRestController.java:602` and `:609` | FR-E1 |
| RD-X3 | `GET /rest/ExternalConnection` returns the decrypted SMTP password (`ExternalConnectionRestController.java:60-84`) | FR-A5 |
| RD-X4 | Referring-site email typed at order entry overwrites the organization record (`SamplePatientUpdateData.java:711-717`) | FR-B8 |
| RD-X5 | Patient notifications probably fail for environmental samples with no patient (`TestNotificationServiceImpl.java:168-169`) | FR-H1 |

### J. States, errors and accessibility

| ID | Requirement | Notes |
|---|---|---|
| FR-J1 | Every list loads with a skeleton; a load error names what failed with Retry ("Sent Messages could not be loaded."); an empty Sent Messages says "Nothing sent in this period."; a list emptied by filters says so and offers Clear filters; an empty Distribution Lists explains what a list is for and offers Add list. A failed save keeps the user's changes and says what failed. | Admin standard AS-34 |
| FR-J2 | Status is always text plus colour (Queued purple, Sent green, Delivered green, Failed red, Skipped gray), never colour alone. Report state tags reuse the print queue's (Partial warm-gray, Final teal, Amended magenta). "No report email", "No delivery password" and "Will be skipped" are gray. | OGC-1031 FR-4.1 |
| FR-J3 | Show password, Copy, Send, row expansion and every row action are keyboard reachable, and their accessible names include the record ("Show delivery password, Port Moresby General Hospital"; "Send reports, CPHL-26-004188"). | WCAG 2.1 AA |
| FR-J4 | The Send dialog states the count before confirming and, after sending, a toast reads back the result with a link to Sent Messages. Both count only the reports queued to at least one recipient, and only the recipients that are queued; skipped recipients are named separately. Example (Release 1): 7 selected rows open 4 recipient groups (Port Moresby General Hospital with Ward 4B, which has a delivery password; 9 Mile Urban Clinic, which has a report email but no delivery password; Eda Ranu Water Utility's client contact; and Gerehu General Hospital, which has no report email); the button reads "Send 4 reports to 3 recipients" and the toast "4 reports queued to 3 recipients. 2 recipients skipped: no email for Gerehu General Hospital, no delivery password for 9 Mile Urban Clinic." The reports of Gerehu and 9 Mile are not issued (FR-C5). In Release 2, 9 Mile gets masked copies and the button reads "Send 6 reports to 4 recipients". Counts use plural forms. | |

### K. Changes required in sibling specs

Sibling FR IDs carry their spec's prefix ("OGC-1111 FR-A16") so they do not collide with this FRS's own IDs.

| Spec | Change |
|---|---|
| **OGC-1111 Patient report** | Masked mode (OGC-1111 FR-A61) is needed only from Result Delivery **Release 2**; mark it and its ACs so. Masking is a mode of the report done in the data (OGC-1111 FR-A61, which owns the field list): it also removes the contact-tracing index name and record number, billing number and subject (ST) number, and keeps the masked line `report.patient.masked.line`. Print the requester's order number on the card (OGC-1111 FR-A16) and the strip (OGC-1111 FR-A17); "Version {n} · Issued {date time}" on every report from V1 (OGC-1111 FR-A15a); partial marker on continuation pages; lab contact in `additionalSiteInfo` (OGC-1111 FR-A62). The corrected banner (OGC-1111 FR-A14, FR-A40) points at the print queue's issue history and its "issued" Amended rule, not `document_track`. |
| **OGC-1031 Report Print Queue** | Versions are created at issue: OGC-1031 FR-4.3 and FR-4.4 say "issued (printed or sent)" in place of "printed", and every send is an issue event (D-236); OGC-1031 FR-4.6 follows OGC-1111 FR-A15a. **Send** on rows and on the batch toolbar (both `reportQueue.action.send`, minted by the print queue; OGC-1031 FR-6.13), available for rows with at least one released result; a send or automatic issue whose recipients are all skipped creates no version and the row shows Skipped (OGC-1031 FR-6.13, FR-6.14). Version history shows sends (FR-C12); masked renderings archived (FR-C11, Release 2). In Release 1 the Send dialog's formats are Protected full report and, for certificates, Certificate as issued; recipients with no delivery password are skipped (FR-C6, FR-C8). Automatic delivery batches every report due to one recipient in one email per hold window (FR-C2, OGC-1031 FR-6.14). The Amended version's history lists typed addresses of earlier sends as "Not reachable: typed for one send" (FR-C4, key `reportQueue.history.notReachableTyped`). The **Sent** column and the **Sent** filter gain the **Skipped** state (filter: Sent, Queued, Failed, Skipped, Not sent). The row shows the indicator "Patient notice not sent: no contact" (FR-F5). Certificate attachment names (FR-C16). The out-of-scope line "Sending reports electronically" is removed. Its header cites OGC-1111 v2.5 and its Dependencies list Result Delivery. |
| **Locations & Organizations** | Result delivery section with delivery password (L&O FR-N1 to FR-N5, this FRS FR-B1 to FR-B5); L&O mints its own keys `admin.locations.delivery.*` for the section (no key owned by this FRS). `delivery_password:view` is renamed `delivery:view_password` (L&O FR-N2 and its Nominated privileges row). Generate and Change also need `organization:manage`; the password is 12 characters and its hyphens are display only. Delivery tags name the password state: "Automatic, protected", "Automatic, no password", "Manual, protected", "Manual, no password", "No report email" (L&O FR-N3). Report email is seeded from `Organization.email` on upgrade. Ward report addresses are added to the facility's; wards use the facility password and have no SMS number. History records password Show and Copy. **v0.3:** the "no password" text says patient reports are not sent until a password is set (certificates as issued); turning on automatic delivery with no password shows the warning "Patient reports will not be sent until a delivery password is set."; the "Automatic, no password" Tag is amber; the Organizations list gains a **Delivery** filter (All, Ready, No report email, No password) and the count "{n} facilities can receive reports by email" (L&O FR-N3, FR-N8, FR-N9). |
| **Admin Redesign** | §3.1 and register A-04, A-05: one group **Automation › Notifications** with four pages, **Channels, Templates, Distribution Lists, Triggers**, governed by this FRS; Sent Messages moves to the main menu. §9.2: `testNotificationConfig*` becomes Remove after FR-H1 and redirects to Templates; `notificationTriggerConfig/sent` becomes Merge and redirects to `/SentMessages?product=trigger`. AF-5, L-07, Appendix A, N-7 and §15.1: the entry is "Notifications" with four children, new sub-routes, key `sidenav.label.admin.notifications`. **Configuration, Notifications area** (`?area=notifications`) holds the lab-wide delivery settings of FR-A16 as eight `site_information` entries (Appendix B gains `deliveryGiveUpHours`, "Stop retrying after (hours)", default 24, Setup, block Sending and retries; `deliveryRetryMinutes` defaults to 1, 5, 15, 30, 60; CF-5b and CF-AC-14 count eight settings; Appendix B totals 168 settings, 56 routine) and links to the four pages (D-241); `mail.from` shows read-only with a link to Channels; `bmp.provider` and `twilio.from` map to Channels; `mail.bcc` is marked retired (FR-H5). **AS-31** records the delivery-password exception (D-225, D-243). A-01: External Connections loses the SMTP, BMP and SMPP types (and WhatsApp in Release 2); add RD-X3 to §10 defects. RM-8: helper text to put the results phone or email in the additional site information line. §20 Docs Impact: add Test Notification Configuration, Notification Triggers and External Connections. |
| **Users and Roles** | Appendix A: category `delivery` maps to **Reports**; category `distribution_list` maps to **Quality**. |
| **Test Catalog Alerts (OGC-763)** | Recipients including distribution lists and the patient instruction (FR-E2); validation-only firing from every entry path (FR-E1); "Ask recipients to confirm receipt" and escalation (FR-E6, FR-E7), separate from `acknowledgmentRequired`; per-rule text override (FR-E3); rules turned off, never deleted, with Show inactive (FR-E9); per-test Patient messages setting (FR-F4). Authoring stays with `test:configure`. |
| **Clinical Order Entry v4 (OGC-1266)** | Result reporting block: provider boxes removed and "Send reports to the ordering clinician" added (FR-B6, FR-H4); patient boxes under the label "Patient agreed to receive messages from the lab", with each tick and untick (and "Include the result") recorded in the order history (FR-F1, FR-F3); the facility's delivery line (FR-B11); typed referring-site addresses apply to the order only (FR-B8). |
| **Validation (OGC-1364 multi-level validation)** | A result that matched an alert rule with recipients outside the lab at entry is pinned to the top of the validation page with a "Priority alert" Tag until validated or rejected, and holders of `result:validate` for its lab unit get the in-app alert "Priority result waiting for validation: {test} {labNo}" (FR-E10). |
| **Navigation Redesign** | Main menu Appendix A.1: Reports › **Sent Messages** after Report Print Queue, key `sidenav.label.reports.sentMessages`. |
| **Microbiology (M-16)** | Cluster signals reach officials through Distribution Lists and the outbox, not through Test Notification recipients, which retire (FR-H1). |
| **Decision log and registry** | D-006 superseded by D-235 (and the addendum's "binary admin" line updated); D-140 amended by D-236; D-230 wording aligned; D-234 superseded by D-237. v0.3 adds D-244 to D-249 and the Release 2 note on D-224. Admin Redesign D-190 to D-202 and Users and Roles D-203 to D-206 collide with ledger IDs: not renumbered in this pass, cited as "Admin Redesign D-199" and so on, and listed for registry upkeep. |

---

## Information & Data

Reused as is or widened:

| Information | Source today |
|---|---|
| Report versions, their archived PDFs and hashes, Partial/Final/Amended state, issue history | Report Print Queue pipeline and archive (OGC-1031; `compliance_report_archive` widened, issue history §6.2) |
| Facility email and phone | `Organization.email` (seeds the report email list on upgrade, FR-B1), `.phone` |
| Ordering clinician email and phone | `Provider` → `Person.email`, `.primaryPhone`, falling back to `.cellPhone` |
| Environmental and vector requestor contact | `sample_requester` row `requestor_contact` → Person; `RequesterService.getRequestorEmail()` |
| Patient contact and first name | `Patient` → `Person.email`, `.primaryPhone` falling back to `.cellPhone` (the same two fields `TestAlertEvaluationServiceImpl` reads; it tries `cellPhone` first today and follows this order once alerts use the outbox), `Person.firstName` |
| Requester's order number | `Sample.referringId` / order entry `externalOrderNumber` |
| Patient notice opt-ins per test on the order | `AnalysisNotificationConfig` PATIENT × email/SMS options (PROVIDER options retire, FR-H4) |
| Per-order typed referring-site email and phone (FR-B8) | `NotificationConfigOption.additionalContacts` on the order's analyses' notification options |
| Per-test notification settings | `TestNotificationConfig` with its `NotificationConfigOption` list (patient option widened, below) |
| Alert rules | `TestAlertRule` (trigger type and value, component and sample type scope, `notifySms`, `notifyEmail`, `notifyOrderingPhysician`, `notifyPatient`, `notifyReferringFacility`, custom phone and email, role, `acknowledgmentRequired` which keeps its Critical Acknowledgment meaning, D-155) |
| Channel connections and encrypted secrets | `ExternalConnection` (one row per `ProgrammedConnection` type), `BasicAuthenticationData`, encrypted at rest through `EncryptionConverter` (jasypt AES-256) |
| Sender address and Twilio sender fallback | `org.openelisglobal.mail.from`, `org.openelisglobal.notification.bmp.provider`, `org.openelisglobal.notification.twilio.from` |
| Templates and merge fields | `NotificationPayloadTemplate`, `EventVariableRegistry`, `DefaultPayloadTemplates` (widened, below) |
| Sent messages, channel status, sent by, resend chain | `NotificationLog` (including `triggered_by_user_id` for "sent by" and `resent_from_id` for the resend chain), `NotificationLogChannel` (widened, below) |
| Recipient resolution for ordering provider | `NotificationRecipientResolver` |
| In-app alerts, acknowledgement and escalation to roles | `Alert`, `AlertService`, `HeaderNotificationService.notifyRole` |
| Lab contact used in messages and masked copies | `additionalSiteInfo` site information line (Admin Redesign RM-8, OGC-1111 FR-A62) |
| Storage for lab-wide settings | `site_information` (`SiteInformation`, `ConfigurationProperties`), edited in Configuration |
| Background sending pattern | `ReportingWorker` (data export jobs) |
| Patient consent to messages (who ticked or unticked a patient box or "Include the result", and when) | The order history (audit trail), as for other order changes (FR-F1) |
| Validation page and in-app alerts for priority results waiting for validation | Validation page (OGC-1364), `HeaderNotificationService` (FR-E10) |

New information (all declared in Dependencies):

- **On an organization:** report email addresses (one or more), report number, automatic delivery, include partials (Lab default, Yes, No), language, delivery password (12 characters, reversible encryption through `EncryptionConverter`, never hashed), date and user the password was last set; History entries for password Show, Copy and Change (never the password).
- **On a ward or department:** report email addresses (added to the facility's).
- **On an order:** "Send reports to the ordering clinician" (Yes/No), migrated from the PROVIDER options of its analyses' `AnalysisNotificationConfig` (FR-H4).
- **On an order's patient opt-in:** include the result (Yes/No).
- **On a test (`TestNotificationConfig` patient option):** Patient messages (Ready notice only, Result when the order asks for it, Result by default), migrated from Test Notification patient settings (FR-H1).
- **Distribution list:** name, description, may receive patient identifiers, active; members (name, email, phone, active); link table from alert rule to list.
- **On an alert rule (`TestAlertRule`):** linked distribution lists, patient instruction text, channels including WhatsApp (Release 2), "Ask recipients to confirm receipt" (Yes/No, separate from `acknowledgmentRequired`), escalation (on/off) and escalation minutes, per-recipient-kind text override (subject and body).
- **Templates (`NotificationPayloadTemplate`):** locale (one template per language; defaults shipped in English and French, FR-A15), active flag, for WhatsApp slots the approved TextIt template name and the ordered list of merge fields sent with it (Release 2, FR-A18), and new payload types with their slots: report (email subject and body; SMS and WhatsApp text); priority alert per recipient kind (list or fixed address, list allowed patient identifiers, facility, clinician, patient instruction with result, patient instruction only), each with email subject and body and SMS and WhatsApp text; patient ready notice (email, text); patient result (email, text).
- **On a sent message (`NotificationLog`, widened):** product (Report, Alert, Patient notice, Trigger event, Test), status Queued, Delivered and Skipped with reason (beside Sent and Failed), group (the rule firing, batch Send or automatic hold window it belongs to), rule, next attempt time, retry deadline (queued time plus `deliveryGiveUpHours`), gateway message ID per attempt, the last TextIt status poll and the time TextIt reported it delivered or failed, receipt confirmation (who, when), escalation raised (when), secure link token, expiry and openings, and the password set date used for a protected send.
- **Message to report version:** a many-to-many link, because one batch email carries several report versions; each link records the version, the format sent (protected, certificate as issued, or masked in Release 2), the SHA-256 of the file actually sent (for a protected copy, the encrypted PDF), and the masked-copy archive reference (Release 2).
- **Automatic hold window:** one per recipient (facility, ward, clinician or client), with its start and end and the report versions due in it, so that one email (split at 10 MB of attachments or 20 reports) and at most one report SMS go per window (FR-C2).
- **On a result awaiting validation:** a "priority alert" marker set at entry when the result matches an alert rule with recipients outside the lab, cleared at validation or rejection, or when the result stops matching (FR-E10).
- **Attempt history:** a new table, one row per attempt per channel: time, result, error, gateway message ID (`NotificationLogChannel` keeps only a count and the last error today).
- **`NotificationChannel`:** a new `SMS` value (today only `EMAIL` and `WHATSAPP`).
- **Channels (`ExternalConnection`):** SMTP security mode (STARTTLS, SSL/TLS, None), reply-to address, sender address and display name; TextIt API address, token and channel UUID, using the `BEARER` auth type (commented out in `ExternalConnection.AuthType` today); a new `ProgrammedConnection` value `TEXTIT`; Twilio sender number.
- **Lab-wide (`site_information`, Configuration Notifications area):** proposed names `deliveryHoldMinutes` (10), `deliverySendPartials` (true), `deliveryRetryMinutes` (1,5,15,30,60), `deliveryGiveUpHours` (24), `deliveryDefaultCountryCode` (empty), `publicServerAddress` (empty), `deliverySecureLinks` (off), `deliverySecureLinkDays` (30).
- **Archive:** masked renderings with their own SHA-256, linked to the version (OGC-1031 FR-8.4). Release 2.

Lifecycle of a sent message: Queued → Sent, then for SMS through TextIt → Delivered or → Failed when TextIt reports it; or Queued → (retries for up to 24 hours, still Queued) → Failed; or Skipped. Resend creates a new row linked to the original. Nothing is deleted.

---

## Access

### Who can do what

- **Reporting clerks** (`report:send`) send reports from the Report Print Queue, type an address for one send, change the format for one send (Masked copy, Release 2), and pick a recipient from the directory. With `delivery:view_password` they can also show and copy a recipient's delivery password in the Send dialog.
- **Users with `delivery:view`** open Sent Messages, including rendered content, for the rows in their lab-unit scope (OGC-1031 BR-9). Trigger event rows, visible only to administrators today, become visible to every `delivery:view` holder. **Users with `delivery:resend`** resend.
- **Users who edit facilities** (`organization:manage`) set facility delivery settings. Showing and copying a delivery password needs `delivery:view_password`; generating or changing it needs both `delivery:view_password` and `organization:manage`. Users without `delivery:view_password` see "Password set {date}" with no Show or Copy.
- **Administrators** (`notification:manage`) set up channels, send tests, edit templates and edit the lab-wide delivery settings in Configuration. Channel credentials were governed by `extconnection:manage` before; Channels now needs `notification:manage`.
- **Users who keep distribution lists** (`distribution_list:manage`, in Quality) edit list names, members and deactivation. This does not make them administrators (Users and Roles UR-F5); they see the Notifications group with Distribution Lists only.
- Users without any Notifications privilege do not see the Notifications SideNav group; its routes redirect to the admin home.
- **Users who edit tests** (`test:configure`) author alert rules, their recipients, per-rule text, receipt confirmation and escalation, and the per-test Patient messages setting, as today.
- **Users with `alert:view`** receive escalation alerts in the app; users with `alert:manage` acknowledge and resolve them, like any other alert.
- **Users with `result:validate`** for a lab unit receive "Priority result waiting for validation" alerts for that unit and see the pinned "Priority alert" rows on the validation page (FR-E10), as part of validating; no new privilege.
- **Users who create orders** tick the patient ready notice and "Send reports to the ordering clinician". Only users with `order:notify_result` can change "Include the result"; others see it read-only.

### Nominated privileges

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| View channels and their status | `notification:view` (existing) | Administration | As today |
| Set up channels and Send test | `notification:manage` (existing; Channels now needs it where channel credentials needed `extconnection:manage`) | Administration | Roles holding it today, plus roles with `extconnection:manage` |
| Edit templates and the lab-wide delivery settings (Configuration, Notifications area) | `notification:manage` (existing) | Administration | As today |
| Maintain distribution lists: names, members, deactivation | **NEW** `distribution_list:manage` | Quality | Roles with `notification:manage` (labs then grant it to surveillance or quality staff in the role builder) |
| View Sent Messages, including rendered content and trigger event rows | **NEW** `delivery:view` | Reports | Roles with `report:run` |
| Resend from Sent Messages | **NEW** `delivery:resend` | Reports | Roles with `report:run` |
| Send reports from the print queue, including to a typed address | **NEW** `report:send` | Reports | Roles with `report:run` |
| Show or copy a delivery password (logged) | **NEW** `delivery:view_password` | Reports | Roles with `organization:manage`, `sample_requester:manage` or `report:run` |
| Generate or change a delivery password | `delivery:view_password` and `organization:manage` (existing) | Reports; Test catalog and reference data | As above |
| Edit a facility's delivery settings | `organization:manage` (existing) | Test catalog and reference data | As today |
| Edit a provider's delivery addresses | `provider:manage` (existing) | Test catalog and reference data | As today |
| Edit an environmental or vector client's contact | `sample_requester:manage` (existing) | Orders, samples and patients | As today |
| Create and edit alert rules, their recipients, per-rule text, receipt confirmation and escalation | `test:configure` (existing) | Test catalog and reference data | As today |
| Receive alert escalations in the app | `alert:view` (existing) | Quality | As today |
| Acknowledge and resolve escalation alerts | `alert:manage` (existing) | Quality | As today |
| Receive "Priority result waiting for validation" alerts and see pinned priority rows (FR-E10) | `result:validate` (existing), per lab unit | Results | As today |
| Set a test's Patient messages setting | `test:configure` (existing) | Test catalog and reference data | As today |
| Tick the patient ready notice and "Send reports to the ordering clinician" at order entry | `order:create`, `order:edit` (existing) | Orders, samples and patients | As today |
| Tick "Include the result" | **NEW** `order:notify_result` | Orders, samples and patients | Roles with `order:create` |

NEW codes: `delivery:view`, `delivery:resend`, `delivery:view_password` (renamed from v0.1's `delivery_password:view`), `report:send`, `order:notify_result`, `distribution_list:manage`. Category `delivery` maps to the **Reports** group and category `distribution_list` to **Quality** (Users and Roles Appendix A). `alert:manage` is not used for rule authoring: in PR #3443 it means "Create, acknowledge, and resolve alerts" and stays administrator-only (D-239).

Notes:

- **EQA Coordinator.** The `report:run` default also reaches the EQA Coordinator role, so EQA coordinators can show and copy facility delivery passwords. Accepted: every Show and Copy is logged.
- **Trigger event rows widen.** Sent Messages shows referral and other trigger event rows to every `delivery:view` holder, where today only administrators see them.
- **PR #3443 wording.** #3443 describes `organization:manage` as "Import and export organization data"; this FRS uses it for "Create and edit organizations" and asks #3443 to describe it so.
- Until PR #3443 merges: Reports module access stands in for `report:run` and the four Reports-group codes; Global Administrator for `notification:manage`, `distribution_list:manage` and `organization:manage`; Test Catalog access for `test:configure`; the order entry module for `order:notify_result`; and the Validation role for the lab unit for `result:validate`. Every check is made on the server.
- **Delivery password and who can see it.** Show and Copy are not restricted further: the password is a facility's shared secret, meant to be given out again easily (D-248). Every Show and Copy is still logged.

---

## Localization

New keys are added to `frontend/src/languages/en.json` in English; French is part of each slice's Definition of Done (Admin Redesign AS-36), and other languages follow the normal translation workflow. Before minting, run `npm run i18n:find -- "<text>"` (Constitution VII). **Status:** REUSE an existing key, or NEW. No v0.1 key (`delivery.*`) shipped, so the renames below need no migration.

Rules:

- **Admin pages** (Channels, Templates, Distribution Lists) use `admin.notifications.<page>.*` (Admin Redesign AS-36). Lab-wide settings in Configuration use Configuration's own pattern `admin.configuration.setting.<key>.label` / `.description` and `admin.configuration.block.<id>`; the few controls this feature adds to the Notifications area use `admin.notifications.settings.*`.
- **The Send dialog, Sent Messages, order entry, message texts and public link pages** use `label.delivery.*`, `button.delivery.*`, `message.delivery.*` and `heading.delivery.*`.
- **Test Catalog alert rules** extend that page's own namespace, `label.testCatalog.alerts.*`, and reuse its existing keys where the meaning is the same.
- **Generic words** reuse `common.*` (and `label.yes`, `label.no`, `button.add`, `home.label`, `breadcrums.admin.managment`); **secret fields** reuse `admin.common.secret.set`, `.notSet` and `.replace` (Admin Redesign shared components).
- **Counts** use ICU plural forms. **Skip and failure reasons** have one key per channel; no channel name is spliced into a sentence.
- **The masked-copy line** on the report is OGC-1111's `report.patient.masked.line` (Release 2); this feature mints no key for it.
- **Sibling specs mint their own keys.** The print queue mints `reportQueue.*` (including `reportQueue.action.send`), and Locations & Organizations mints `admin.locations.delivery.*` for its Result delivery section. Both are listed at the end of this section, marked REUSE with their owner, so that the preview and both specs use the same text; this feature mints none of them. The Configuration page's own keys (`admin.configuration.*`, including `admin.configuration.notifications.sendTest` and `.testSent`) are owned by Admin Redesign and marked REUSE.
- **Merge-field tokens** such as `{lab_name}` are template syntax: they are not translated and keep the same names in every language. Placeholders in keys (`{count}`, `{name}`) are ICU arguments.
- **Release 2 keys** (the masked copy and WhatsApp) stay in these tables, marked "Release 2" in the Context column; they are added with the Release 2 slices.
- **Retiring keys:** `notificationtrigger.tabs.sentmessages*` and `notificationtrigger.sentmessages.*` retire when the tab redirects (FR-H3); `notificationtrigger.templates.*` are replaced by `admin.notifications.templates.*`; `testnotification.*` retire with Test Notifications (FR-H1); `label.testCatalog.alerts.delete.*` retire (FR-E9). Triggers keeps its `notificationtrigger.*` keys.

### Navigation and page headers

| Key | English | Context | Status |
|---|---|---|---|
| `home.label` | Home | Breadcrumb | REUSE |
| `breadcrums.admin.managment` | Admin Management | Admin breadcrumb | REUSE |
| `common.reports` | Reports | Main menu breadcrumb | REUSE |
| `sidenav.label.reports.sentMessages` | Sent Messages | Main menu (Reports), breadcrumb, page title | NEW |
| `sidenav.label.admin.notifications` | Notifications | Admin SideNav group, breadcrumb | NEW |
| `sidenav.label.admin.notifications.channels` | Channels | SideNav item, page title, Configuration link row | NEW |
| `sidenav.label.admin.notifications.templates` | Templates | SideNav item, page title, Configuration link row | NEW |
| `sidenav.label.admin.notifications.lists` | Distribution Lists | SideNav item, page title, Configuration link row | NEW |
| `sidenav.label.admin.notifications.triggers` | Triggers | SideNav item, page title, Configuration link row | NEW |
| `label.delivery.sent.subtitle` | Every report, alert, patient notice and trigger event OpenELIS has sent or tried to send, with what was sent and to whom. | Sent Messages page description | NEW |
| `admin.notifications.channels.subtitle` | How OpenELIS sends messages. Set each channel up once; reports, alerts, patient notices and trigger events all use them. | Channels page description | NEW |
| `admin.notifications.templates.subtitle` | The words OpenELIS sends. Each message type offers only the fields that are safe for it: report messages never carry a patient's name or national ID. | Templates page description | NEW |
| `admin.notifications.lists.subtitle` | Named groups of people who receive priority result alerts. Alert rules on a test pick a list, so a change of duty officer is one edit here. | Distribution Lists page description | NEW |

### Shared: products, statuses, channels, formats, reasons

| Key | English | Context | Status |
|---|---|---|---|
| `label.delivery.product.report` | Report | Product (column, filter option) | NEW |
| `label.delivery.product.alert` | Alert | Product | NEW |
| `label.delivery.product.patientNotice` | Patient notice | Product | NEW |
| `label.delivery.product.trigger` | Trigger event | Product | NEW |
| `label.delivery.product.test` | Test | Product | NEW |
| `label.delivery.status.queued` | Queued | Status tag (purple), filter option | NEW |
| `label.delivery.status.sent` | Sent | Status tag (green), filter option | NEW |
| `label.delivery.status.delivered` | Delivered | Status tag (green), filter option (SMS through TextIt, FR-A10) | NEW |
| `common.failed` | Failed | Status tag (red), filter option | REUSE |
| `label.delivery.status.skipped` | Skipped | Status tag (gray), filter option | NEW |
| `common.email` | Email | Channel name | REUSE |
| `label.delivery.channel.sms` | SMS | Channel name | NEW |
| `label.delivery.channel.whatsapp` | WhatsApp | Channel name. Release 2 | NEW |
| `label.delivery.format.protected` | Protected full report | Format | NEW |
| `label.delivery.format.masked` | Masked copy | Format. Release 2 | NEW |
| `label.delivery.format.asIssued` | Certificate as issued | Format (certificates, FR-C16) | NEW |
| `label.delivery.state.final` | Final | Report state in messages (`{report_state}`) | NEW |
| `label.delivery.state.partial` | Partial | Report state in messages | NEW |
| `label.delivery.state.amended` | Amended | Report state in messages | NEW |
| `label.delivery.state.mixed` | Partial and final | Batch state in messages (FR-C13) | NEW |
| `label.delivery.sentBy.automatic` | Automatic | Sent by column, version history | NEW |
| `message.delivery.skip.noEmail` | No email address | Skip reason | NEW |
| `message.delivery.skip.noSms` | No SMS number | Skip reason | NEW |
| `message.delivery.skip.noWhatsapp` | No WhatsApp number | Skip reason. Release 2 | NEW |
| `message.delivery.skip.noWhatsappTemplate` | No approved WhatsApp template | Skip reason (FR-A18). Release 2 | NEW |
| `message.delivery.skip.noPassword` | No delivery password. Set one in Locations & Organizations. | Skip reason (Release 1, FR-A9, D-245) | NEW |
| `message.delivery.skip.badNumber` | {number} cannot be put in international format | Skip reason | NEW |
| `message.delivery.skip.inactive` | Recipient is inactive | Skip reason | NEW |
| `message.delivery.skip.noPatientContact` | Patient has no email or phone number | Skip reason | NEW |
| `message.delivery.fail.emailNotSetUp` | Email is not set up | Failure reason | NEW |
| `message.delivery.fail.smsNotSetUp` | SMS is not set up | Failure reason | NEW |
| `message.delivery.fail.whatsappNotSetUp` | WhatsApp is not set up | Failure reason. Release 2 | NEW |
| `message.delivery.fail.auth` | Authentication failed: check the username and password. | Failure reason, test error | NEW |
| `message.delivery.fail.unreachable` | Could not reach {host} on port {port}. | Failure reason, test error | NEW |
| `message.delivery.fail.rejected` | The server refused the message: {error} | Failure reason (gateway's own text) | NEW |
| `message.delivery.queued.sendsAt` | Sends at {time}, after the hold | Queued reason | NEW |
| `message.delivery.queued.retryAt` | Next attempt at {time} | Queued reason (shown while retrying, up to 24 hours, FR-A8) | NEW |
| `message.delivery.fail.textit` | TextIt reported the message failed: {error} | Failure reason from the TextIt status poll (FR-A10) | NEW |
| `message.delivery.invalid.email` | Enter an email address like name@example.org. | invalidText, every email field | NEW |
| `message.delivery.invalid.phone` | Enter a phone number with its country code, or set the default SMS country code in Configuration. | invalidText, every phone field | NEW |

### Send dialog

| Key | English | Context | Status |
|---|---|---|---|
| `label.delivery.send.modalLabel` | Report Print Queue | Modal label above the title | NEW |
| `heading.delivery.send.title` | Send reports | Modal title | NEW |
| `message.delivery.send.intro` | Each recipient gets one email with all its reports attached. Full reports are always sent password protected. | Modal intro | NEW |
| `label.delivery.send.groupReports` | {count, plural, one {# report} other {# reports}}: {list} | Group heading after the recipient name | NEW |
| `label.delivery.send.groupCertificates` | {count, plural, one {# certificate} other {# certificates}}: {list} | Group heading (environmental and vector clients) | NEW |
| `label.delivery.send.item` | {labNo} v{n} | Report in a group heading | NEW |
| `label.delivery.send.itemPartial` | {labNo} v{n} (partial) | Report in a group heading | NEW |
| `label.delivery.send.itemAmended` | {labNo} v{n} (amended) | Report in a group heading | NEW |
| `label.delivery.send.col.recipient` | Recipient | Column | NEW |
| `label.delivery.send.col.address` | Address | Column | NEW |
| `label.delivery.send.col.format` | Format | Column | NEW |
| `label.delivery.send.col.password` | Password | Column | NEW |
| `label.delivery.recipient.facility` | Facility | Recipient kind | NEW |
| `label.delivery.recipient.ward` | Ward / Dept | Recipient kind | NEW |
| `label.delivery.recipient.clinician` | Clinician: {name} | Recipient kind with name | NEW |
| `label.delivery.recipient.client` | Client: {name} | Recipient kind with name (requestor contact) | NEW |
| `label.delivery.recipient.typed` | Added for this send | Recipient kind | NEW |
| `label.delivery.send.selectRecipient` | Send to {name} | Tick box accessible name | NEW |
| `label.delivery.send.noReportEmail` | No report email | Address cell | NEW |
| `label.delivery.send.willSkip` | Will be skipped | Tag (gray) | NEW |
| `label.delivery.password.facility` | Facility password | Password cell (ward, clinician, typed address in Release 1) | NEW |
| `label.delivery.password.set` | Password set | Password cell, users without `delivery:view_password` | NEW |
| `label.delivery.password.noneSkipped` | No delivery password | Password cell, beside the **Will be skipped** Tag (Release 1, FR-C6) | NEW |
| `label.delivery.password.none` | No password: masked copy | Password cell. Release 2 | NEW |
| `label.delivery.password.noneCertificate` | No password: sent as issued | Password cell (certificates) | NEW |
| `label.delivery.password.typed` | Typed address: masked copy | Password cell. Release 2 | NEW |
| `label.delivery.password.typedCertificate` | Typed address: sent as issued | Password cell (certificates) | NEW |
| `button.delivery.password.show` | Show | Button | NEW |
| `button.delivery.password.hide` | Hide | Button | NEW |
| `button.delivery.password.copy` | Copy | Button | NEW |
| `label.delivery.password.showFor` | Show delivery password, {name} | Accessible name | NEW |
| `label.delivery.password.hideFor` | Hide delivery password, {name} | Accessible name | NEW |
| `label.delivery.password.copyFor` | Copy delivery password, {name} | Accessible name | NEW |
| `message.delivery.password.copied` | Copied. Recorded in History. | Inline confirmation | NEW |
| `label.delivery.send.addAddress` | Add an address for this send | Field label | NEW |
| `label.delivery.send.addAddress.placeholder` | name@example.org or a phone number with country code | Placeholder | NEW |
| `button.add` | Add | Button | REUSE |
| `button.delivery.send.chooseFromDirectory` | Choose from the directory | Button | NEW |
| `label.delivery.send.directorySearch` | Search organizations and providers | Directory picker search | NEW |
| `message.delivery.send.directoryNoMatch` | No organization or provider matches "{text}". | Directory picker empty | NEW |
| `message.delivery.send.confirmTypedProtected` | {count, plural, one {Send # report to {address}, protected with the facility's delivery password?} other {Send # reports to {address}, protected with the facility's delivery password?}} This address is not in the directory and will not be saved. | Confirmation line (Release 1, FR-C7) | NEW |
| `message.delivery.send.typedNoPassword` | This order's facility has no delivery password, so this report cannot be sent to a typed address yet. | Warning under the address field (Release 1, FR-C6) | NEW |
| `message.delivery.send.confirmTyped` | {count, plural, one {Send # report to {address} as a masked copy?} other {Send # reports to {address} as masked copies?}} This address is not in the directory and will not be saved. | Confirmation line. Release 2 | NEW |
| `message.delivery.send.confirmTypedCertificate` | {count, plural, one {Send # certificate to {address}?} other {Send # certificates to {address}?}} This address is not in the directory and will not be saved. | Confirmation line | NEW |
| `message.delivery.send.olderVersion` | A newer version was already sent on {date}. Send this older version? | Confirmation | NEW |
| `button.delivery.send.sendOlder` | Send older version | Confirmation button | NEW |
| `button.delivery.send.confirm` | Send {reports, plural, one {# report} other {# reports}} to {recipients, plural, one {# recipient} other {# recipients}} | Primary button | NEW |
| `common.cancel` | Cancel | Secondary button | REUSE |
| `message.delivery.send.done` | {reports, plural, one {# report queued} other {# reports queued}} to {recipients, plural, one {# recipient} other {# recipients}}. | Success toast | NEW |
| `message.delivery.send.doneSkipped` | {skipped, plural, one {# recipient skipped:} other {# recipients skipped:}} {details} | Toast, second sentence | NEW |
| `message.delivery.send.skipDetail.noEmail` | no email for {name} | Toast detail (joined with the locale's list format) | NEW |
| `message.delivery.send.skipDetail.noSms` | no SMS number for {name} | Toast detail | NEW |
| `message.delivery.send.skipDetail.noWhatsapp` | no WhatsApp number for {name} | Toast detail. Release 2 | NEW |
| `message.delivery.send.skipDetail.noPassword` | no delivery password for {name} | Toast detail (Release 1, FR-J4) | NEW |
| `button.delivery.send.viewSent` | View in Sent Messages | Toast link | NEW |
| `message.delivery.send.failed` | The reports could not be queued. Nothing was sent. Try again. | Error notification | NEW |
| `message.delivery.send.versionFailed` | {labNo} could not be prepared for sending: {error}. The other reports were queued. | Partial failure notification | NEW |

### Sent Messages

| Key | English | Context | Status |
|---|---|---|---|
| `label.delivery.sent.search` | Lab number or recipient | Search placeholder | NEW |
| `label.delivery.sent.filter.product` | Product | Filter label | NEW |
| `label.delivery.sent.filter.product.all` | All products | Filter option | NEW |
| `common.status` | Status | Filter label, column | REUSE |
| `common.allStatuses` | All Statuses | Filter option | REUSE |
| `message.delivery.sent.sentMeaning` | Sent means the mail server accepted it. Bounces are not tracked. | Helper under the status filter (FR-A10) | NEW |
| `label.delivery.sent.filter.channel` | Channel | Filter label | NEW |
| `label.delivery.sent.filter.channel.all` | All channels | Filter option | NEW |
| `label.delivery.sent.filter.period` | Period | Filter label | NEW |
| `label.delivery.sent.filter.period.today` | Today | Filter option | NEW |
| `label.delivery.sent.filter.period.7d` | Last 7 days | Filter option | NEW |
| `label.delivery.sent.filter.period.30d` | Last 30 days | Filter option | NEW |
| `label.delivery.sent.filter.period.custom` | Custom range | Filter option | NEW |
| `button.delivery.sent.clearFilters` | Clear filters | Button | NEW |
| `label.delivery.sent.col.time` | Time | Column | NEW |
| `label.delivery.sent.col.product` | Product | Column | NEW |
| `label.delivery.sent.col.labNo` | Lab No | Column | NEW |
| `label.delivery.sent.col.recipient` | Recipient | Column | NEW |
| `label.delivery.sent.col.channel` | Channel | Column | NEW |
| `label.delivery.sent.col.content` | Content | Column | NEW |
| `label.delivery.sent.col.attempts` | Attempts | Column | NEW |
| `label.delivery.sent.col.sentBy` | Sent by | Column | NEW |
| `common.patient` | Patient | Recipient cell for patient messages | REUSE |
| `label.delivery.sent.content.protected` | Protected, v{n} | Content cell | NEW |
| `label.delivery.sent.content.protectedPartial` | Protected, v{n} partial | Content cell | NEW |
| `label.delivery.sent.content.masked` | Masked, v{n} | Content cell. Release 2 | NEW |
| `label.delivery.sent.content.maskedPartial` | Masked, v{n} partial | Content cell. Release 2 | NEW |
| `label.delivery.sent.content.certificate` | Certificate, v{n} | Content cell | NEW |
| `label.delivery.sent.content.batch` | {count, plural, one {# report} other {# reports}} | Content cell, batch email | NEW |
| `label.delivery.sent.content.rule` | Rule: {rule} | Content cell, alerts | NEW |
| `label.delivery.sent.content.noResult` | No result | Content cell, ready notice | NEW |
| `label.delivery.sent.content.resultIncluded` | Result included ({test}) | Content cell, patient result | NEW |
| `label.delivery.sent.content.instruction` | Instruction ({rule}) | Content cell, patient instruction | NEW |
| `label.delivery.sent.content.test` | Test message | Content cell, test sends | NEW |
| `label.delivery.sent.group.recipients` | {count, plural, one {# recipient} other {# recipients}} | Recipient cell of a grouped row | NEW |
| `label.delivery.sent.group.summary` | Delivered: {delivered}, Sent: {sent}, Failed: {failed}, Skipped: {skipped}, Queued: {queued} | Status cell of a grouped row | NEW |
| `heading.delivery.sent.subject` | Subject | Expansion heading | NEW |
| `heading.delivery.sent.body` | Body | Expansion heading | NEW |
| `heading.delivery.sent.message` | Message | Expansion heading (SMS, WhatsApp) | NEW |
| `heading.delivery.sent.whatSent` | What was sent | Expansion heading | NEW |
| `heading.delivery.sent.wouldHaveSent` | What would have been sent | Expansion heading on a Skipped row | NEW |
| `heading.delivery.sent.attempts` | Attempts | Expansion heading | NEW |
| `heading.delivery.sent.recipients` | Recipients and receipt confirmations | Expansion heading (alerts) | NEW |
| `heading.delivery.sent.linkOpenings` | Link openings | Expansion heading | NEW |
| `label.delivery.sent.attachment` | Attachment | Expansion label | NEW |
| `label.delivery.sent.format` | Format | Expansion label | NEW |
| `label.delivery.sent.version` | Version | Expansion label | NEW |
| `label.delivery.sent.hash` | Archive SHA-256 | Expansion label | NEW |
| `label.delivery.sent.sentFileHash` | Sent file SHA-256 | Expansion label, beside the archive SHA-256 (FR-A11) | NEW |
| `label.delivery.sent.passwordDate` | Password set on | Expansion label | NEW |
| `label.delivery.sent.attempt.sent` | {time} Sent | Attempt line | NEW |
| `label.delivery.sent.attempt.failed` | {time} Failed: {error} | Attempt line | NEW |
| `label.delivery.sent.attempt.final` | {count, plural, one {Marked Failed after # attempt.} other {Marked Failed after # attempts.}} | Attempt line | NEW |
| `label.delivery.sent.attempt.delivered` | {time} Delivered (reported by TextIt) | Attempt line (FR-A10) | NEW |
| `label.delivery.sent.gatewayId` | Gateway message ID: {id} | Attempt line | NEW |
| `label.delivery.sent.confirmed` | Receipt confirmed {time} by {name} | Member line, alerts | NEW |
| `label.delivery.sent.notConfirmed` | Receipt not confirmed | Member line, alerts | NEW |
| `message.delivery.sent.noEscalation` | Receipt confirmed within the rule's {minutes, plural, one {# minute} other {# minutes}} limit. No escalation raised. | Expansion notification | NEW |
| `message.delivery.sent.escalated` | Receipt not confirmed within {minutes, plural, one {# minute} other {# minutes}}. Escalation raised at {time}. | Expansion notification | NEW |
| `label.delivery.sent.linkOpened` | Opened {time} | Link opening line | NEW |
| `message.delivery.sent.noOpenings` | Not opened yet | Link openings, empty | NEW |
| `label.delivery.sent.resentFrom` | Resend of the message sent {time} | Expansion line | NEW |
| `button.delivery.sent.resend` | Resend | Button | NEW |
| `button.delivery.sent.openOrder` | Open order | Button | NEW |
| `button.delivery.sent.openVersion` | Open version in print queue | Button | NEW |
| `message.delivery.sent.resendQueued` | Resend queued. It appears as a new row linked to this one. | Toast | NEW |
| `message.delivery.sent.resendFailed` | Resend could not be queued: {error} | Error notification | NEW |
| `message.delivery.sent.resendNoAddress` | {name} still has no address for this channel. Add it, then resend. | Error notification (Skipped rows) | NEW |
| `label.delivery.sent.expandFor` | Show details, {labNo}, {recipient} | Row expand accessible name | NEW |
| `message.delivery.sent.empty` | Nothing sent in this period. | Empty state | NEW |
| `message.delivery.sent.noMatch` | No messages match these filters. | Empty state after filtering | NEW |
| `message.delivery.sent.loadFailed` | Sent Messages could not be loaded. | Load error | NEW |
| `common.retry` | Retry | Button | REUSE |
| `notificationtrigger.referralout.name` | Referral Out | Content cell, trigger events | REUSE |
| `notificationtrigger.subcontractdispatched.name` | Subcontract Dispatched | Content cell, trigger events | REUSE |

### Channels

| Key | English | Context | Status |
|---|---|---|---|
| `admin.notifications.channels.col.channel` | Channel | Column | NEW |
| `admin.notifications.channels.col.connection` | Connection | Column | NEW |
| `common.status` | Status | Column | REUSE |
| `admin.notifications.channels.col.lastSent` | Last successful send | Column | NEW |
| `admin.notifications.channels.never` | Never | Last successful send, empty | NEW |
| `admin.notifications.channels.status.ready` | Ready | Status tag (green) | NEW |
| `admin.notifications.channels.status.notSetUp` | Not set up | Status tag (gray), Connection cell | NEW |
| `admin.notifications.channels.status.failing` | Failing | Status tag (red), after three failed attempts in a row (FR-A1) | NEW |
| `admin.notifications.channels.failingDetail` | Last attempt failed {time}: {error} | Failing row detail | NEW |
| `admin.notifications.channels.connection.email` | {host}:{port}, {security} | Connection cell | NEW |
| `admin.notifications.channels.connection.textit` | TextIt, channel {uuid} | Connection cell | NEW |
| `admin.notifications.channels.connection.twilio` | Twilio, from {number} | Connection cell | NEW |
| `admin.notifications.channels.connection.bmp` | BMP, {provider} | Connection cell | NEW |
| `admin.notifications.channels.connection.smpp` | SMPP, {host}:{port} | Connection cell | NEW |
| `admin.notifications.channels.connection.whatsapp` | WhatsApp through TextIt, channel {uuid} | Connection cell. Release 2 | NEW |
| `common.edit` | Edit | Row action | REUSE |
| `admin.notifications.channels.setUp` | Set up | Row action (not set up) | NEW |
| `admin.notifications.channels.email.host` | SMTP host | Field | NEW |
| `admin.notifications.channels.email.port` | Port | Field | NEW |
| `admin.notifications.channels.email.security` | Security | Field | NEW |
| `admin.notifications.channels.email.security.starttls` | STARTTLS | Option | NEW |
| `admin.notifications.channels.email.security.ssl` | SSL/TLS | Option | NEW |
| `common.none` | None | Option | REUSE |
| `admin.notifications.channels.email.username` | Username | Field | NEW |
| `admin.notifications.channels.email.password` | Password | Field | NEW |
| `admin.common.secret.set` | Set | Secret field state | REUSE (Admin Redesign) |
| `admin.common.secret.notSet` | Not set | Secret field state | REUSE (Admin Redesign) |
| `admin.common.secret.replace` | Replace | Secret field button | REUSE (Admin Redesign) |
| `admin.notifications.channels.email.replyTo` | Reply-to address | Field | NEW |
| `admin.notifications.channels.email.senderAddress` | Sender address | Field | NEW |
| `admin.notifications.channels.email.senderAddress.helper` | Until this is saved, OpenELIS uses the sender address in the server's properties file ({address}). | Helper | NEW |
| `admin.notifications.channels.email.senderName` | Sender name | Field | NEW |
| `admin.notifications.channels.email.testTo` | Send test email to | Field | NEW |
| `admin.notifications.channels.sms.gateway` | Gateway | Field | NEW |
| `admin.notifications.channels.sms.gateway.textit` | TextIt | Option | NEW |
| `admin.notifications.channels.sms.gateway.twilio` | Twilio | Option | NEW |
| `admin.notifications.channels.sms.gateway.bmp` | BMP | Option | NEW |
| `admin.notifications.channels.sms.gateway.smpp` | SMPP | Option | NEW |
| `admin.notifications.channels.apiAddress` | API address | Field (TextIt, WhatsApp) | NEW |
| `admin.notifications.channels.sms.token` | Token | Field (TextIt) | NEW |
| `admin.notifications.channels.sms.channelUuid` | Channel UUID | Field (TextIt) | NEW |
| `admin.notifications.channels.sms.twilioFrom` | Sender number | Field (Twilio) | NEW |
| `externalconnections.*` | (existing BMP and SMPP field labels) | Fields (BMP, SMPP) | REUSE |
| `admin.notifications.channels.sms.testTo` | Send test SMS to | Field | NEW |
| `admin.notifications.channels.sms.testTo.helper` | Numbers without a country code use the default SMS country code in Configuration ({code}). | Helper | NEW |
| `admin.notifications.channels.whatsapp.token` | Access token | Field (TextIt token for the WhatsApp channel). Release 2 | NEW |
| `admin.notifications.channels.whatsapp.channelUuid` | WhatsApp channel UUID | Field (TextIt's WhatsApp channel, FR-A4). Release 2 | NEW |
| `admin.notifications.channels.whatsapp.testTo` | Send test message to | Field. Release 2 | NEW |
| `common.save` | Save | Button | REUSE |
| `admin.notifications.channels.sendTest` | Send test | Button | NEW |
| `common.cancel` | Cancel | Button | REUSE |
| `admin.notifications.channels.test.sent` | Test message sent to {address}. | Inline success | NEW |
| `admin.notifications.channels.test.noAddress` | Type an address to send the test to. | invalidText | NEW |
| `admin.notifications.channels.invalid.port` | Enter a port number from 1 to 65535. | invalidText | NEW |
| `admin.notifications.channels.saved.email` | Email settings saved. | Toast | NEW |
| `admin.notifications.channels.saved.sms` | SMS settings saved. | Toast | NEW |
| `admin.notifications.channels.saved.whatsapp` | WhatsApp settings saved. | Toast. Release 2 | NEW |
| `admin.notifications.channels.loadFailed` | Channels could not be loaded. | Load error | NEW |

### Templates

| Key | English | Context | Status |
|---|---|---|---|
| `admin.notifications.templates.messageType` | Message type | Selector label | NEW |
| `admin.notifications.templates.type.report` | Report delivery | Option | NEW |
| `admin.notifications.templates.type.alert` | Priority alert | Option | NEW |
| `admin.notifications.templates.type.notice` | Patient ready notice | Option | NEW |
| `admin.notifications.templates.type.result` | Patient result | Option | NEW |
| `notificationtrigger.referralout.name` | Referral Out | Option (trigger event) | REUSE |
| `notificationtrigger.subcontractdispatched.name` | Subcontract Dispatched | Option (trigger event) | REUSE |
| `admin.notifications.templates.recipient` | Recipient | Selector label (priority alert) | NEW |
| `admin.notifications.templates.recipient.list` | Distribution list or fixed address | Option | NEW |
| `admin.notifications.templates.recipient.listIdentifiers` | Distribution list that may receive patient identifiers | Option | NEW |
| `admin.notifications.templates.recipient.facility` | The order's facility | Option | NEW |
| `admin.notifications.templates.recipient.clinician` | The ordering clinician | Option | NEW |
| `admin.notifications.templates.recipient.patientResult` | The patient: instruction with result | Option | NEW |
| `admin.notifications.templates.recipient.patientInstruction` | The patient: instruction only | Option | NEW |
| `admin.notifications.templates.channel` | Channel | Selector label | NEW |
| `common.email` | Email | Option | REUSE |
| `admin.notifications.templates.channel.text` | SMS | Option (FR-A13; WhatsApp is its own option from Release 2) | NEW |
| `admin.notifications.templates.channel.whatsapp` | WhatsApp | Option. Release 2 | NEW |
| `admin.notifications.templates.whatsapp.templateName` | Approved WhatsApp template name | Field (FR-A18). Release 2 | NEW |
| `admin.notifications.templates.whatsapp.values` | Values sent, in order | Field (FR-A18). Release 2 | NEW |
| `admin.notifications.templates.whatsapp.helper` | WhatsApp messages started by the lab must use a template approved by Meta, and each one costs money. Register and approve the template in TextIt, then enter its name here. OpenELIS sends the template name and these values; text edited on this page is never sent over WhatsApp. | Info notification (FR-A18). Release 2 | NEW |
| `admin.notifications.templates.language` | Language | Selector label | NEW |
| `admin.notifications.templates.showInactive` | Show inactive | Toggle | NEW |
| `common.active` | Active | Template state toggle | REUSE |
| `common.inactive` | Inactive | Template state tag | REUSE |
| `admin.notifications.templates.insertField` | Insert field | Toolbar label | NEW |
| `admin.notifications.templates.insertFieldFor` | Insert {field} | Field chip accessible name | NEW |
| `admin.notifications.templates.subject` | Subject | Field | NEW |
| `admin.notifications.templates.body` | Body | Field | NEW |
| `admin.notifications.templates.message` | Message | Field (SMS) | NEW |
| `admin.notifications.templates.preview` | Preview | Panel label | NEW |
| `admin.notifications.templates.previewHelper` | Shown with example values. | Panel helper | NEW |
| `admin.notifications.templates.charCount` | {count} of 160 characters, {parts, plural, one {# SMS} other {# SMS messages}} | Character counter | NEW |
| `admin.notifications.templates.restoreDefault` | Restore default | Button | NEW |
| `admin.notifications.templates.restoreDefault.confirm` | Replace this template with the shipped default? Your changes to it will be lost. | Confirmation (danger Modal) | NEW |
| `admin.notifications.templates.overriddenBy` | {count, plural, one {# alert rule uses its own text instead of this one.} other {# alert rules use their own text instead of this one.}} | Info notification | NEW |
| `admin.notifications.templates.info.patientResult` | The result and test name are included only for tests whose Patient messages setting is "Result by default", or when the order asked for the result. Otherwise the "instruction only" text is used. | Info notification (patient instruction) | NEW |
| `admin.notifications.templates.info.notice` | The notice is the same for every order apart from the first name. It never names a test or a result. | Info notification (ready notice) | NEW |
| `admin.notifications.templates.noTranslation` | No {language} text yet. Messages in {language} use the English text until you save one. | Info notification (languages other than English and French, FR-A15) | NEW |
| `admin.notifications.templates.error.fieldNotAllowed` | {field} cannot be used in this message: it is not safe for this recipient. Remove it to save. | Save error | NEW |
| `admin.notifications.templates.error.unknownField` | {field} is not a merge field. Remove it or pick a field from Insert field. | Save error | NEW |
| `admin.notifications.templates.error.empty` | The message cannot be empty. | Save error | NEW |
| `admin.notifications.templates.saved` | Template saved. | Toast | NEW |
| `admin.notifications.templates.loadFailed` | Templates could not be loaded. | Load error | NEW |

### Default template texts (English; FR-A15)

These are the shipped defaults for each slot, in English and French. `\n` is a line break. A line whose merge fields all render empty is left out (FR-A13). The `.text` templates are SMS texts; in Release 2 they are also the suggested wording for the WhatsApp templates the lab registers in TextIt, and OpenELIS never sends them over WhatsApp as free text (FR-A18).

| Key | English | Context | Status |
|---|---|---|---|
| `message.delivery.template.report.email.subject` | {lab_name} results: {report_state}, {report_count} | Report, email subject | NEW |
| `message.delivery.template.report.email.body` | {lab_name} sends you the following reports:\n\n{report_list}\n\n{protection_note}\n{secure_link}\nQuestions: {lab_contact} | Report, email body | NEW |
| `message.delivery.template.report.text` | {lab_name}: {report_count} ready for {facility}, {report_state}. {report_access} Questions: {lab_contact} | Report, SMS | NEW |
| `message.delivery.template.alert.list.email.subject` | {lab_name} ALERT: {test_name} {result}, {lab_number} | Alert to list or fixed address, email subject | NEW |
| `message.delivery.template.alert.list.email.body` | {lab_name} reports a validated result that matches the alert rule "{rule_name}".\n\nTest: {test_name}\nResult: {result} {flag}\nLab number: {lab_number}\nFacility order number: {order_number}\nFacility: {facility} {ward}\nCollected: {collection_date}\nPatient: {sex}, {age}\n\nTo identify the patient, contact the facility with the lab number and order number.\n{ack_link}\nQuestions: {lab_contact} | Alert to list or fixed address, email body | NEW |
| `message.delivery.template.alert.list.text` | {lab_name} ALERT: {test_name} {result}. Lab no {lab_number}, order {order_number}, {facility}. Collected {collection_date}, {sex} {age}. Questions: {lab_contact}. {ack_link} | Alert to list or fixed address, SMS | NEW |
| `message.delivery.template.alert.listIdentifiers.email.subject` | {lab_name} ALERT: {test_name} {result}, {lab_number} | Alert to list allowed identifiers, email subject | NEW |
| `message.delivery.template.alert.listIdentifiers.email.body` | {lab_name} reports a validated result that matches the alert rule "{rule_name}". This message contains patient identifiers: keep it confidential.\n\nPatient: {patient_name}, ID {patient_id}, {sex}, {age}\nPhone: {patient_phone}\nVillage: {patient_village}\nTest: {test_name}\nResult: {result} {flag}\nLab number: {lab_number}\nFacility: {facility} {ward}, order {order_number}\nCollected: {collection_date}\n\n{ack_link}\nQuestions: {lab_contact} | Alert to list allowed identifiers, email body | NEW |
| `message.delivery.template.alert.listIdentifiers.text` | {lab_name} ALERT: {test_name} {result}. {patient_name}, {sex} {age}, {patient_village}, phone {patient_phone}. Lab no {lab_number}, {facility}. {ack_link} | Alert to list allowed identifiers, SMS | NEW |
| `message.delivery.template.alert.facility.email.subject` | {lab_name} alert for {facility}: {test_name} {result}, {lab_number} | Alert to facility, email subject | NEW |
| `message.delivery.template.alert.facility.email.body` | A result for a patient from {facility} matches an alert rule at {lab_name}.\n\nTest: {test_name}\nResult: {result} {flag}\nLab number: {lab_number}\nYour order number: {order_number}\nWard: {ward}\nCollected: {collection_date}\n\nThe report follows by your usual delivery.\n{ack_link}\nQuestions: {lab_contact} | Alert to facility, email body | NEW |
| `message.delivery.template.alert.facility.text` | {lab_name} ALERT for {facility}: {test_name} {result}. Lab no {lab_number}, your order {order_number}. Questions: {lab_contact}. {ack_link} | Alert to facility, SMS | NEW |
| `message.delivery.template.alert.clinician.email.subject` | {lab_name} alert for your patient: {test_name} {result}, {lab_number} | Alert to clinician, email subject | NEW |
| `message.delivery.template.alert.clinician.email.body` | A result for a patient you ordered tests for matches an alert rule at {lab_name}.\n\nTest: {test_name}\nResult: {result} {flag}\nLab number: {lab_number}\nOrder number: {order_number}\nFacility: {facility} {ward}\nCollected: {collection_date}\n\n{ack_link}\nQuestions: {lab_contact} | Alert to clinician, email body | NEW |
| `message.delivery.template.alert.clinician.text` | {lab_name} ALERT for your patient: {test_name} {result}. Lab no {lab_number}, order {order_number}, {facility}. Questions: {lab_contact}. {ack_link} | Alert to clinician, SMS | NEW |
| `message.delivery.template.alert.patientResult.email.subject` | {lab_name}: your {test_name} result | Patient instruction with result, email subject | NEW |
| `message.delivery.template.alert.patientResult.email.body` | Dear {patient_first_name},\n\nYour {test_name} result from {lab_name} is {result}.\n\n{instruction}\n\nQuestions: {lab_contact} | Patient instruction with result, email body | NEW |
| `message.delivery.template.alert.patientResult.text` | {lab_name}: {patient_first_name}, your {test_name} result is {result}. {instruction} | Patient instruction with result, SMS | NEW |
| `message.delivery.template.alert.patientInstruction.email.subject` | {lab_name}: a message for you | Patient instruction only, email subject | NEW |
| `message.delivery.template.alert.patientInstruction.email.body` | Dear {patient_first_name},\n\n{instruction}\n\nQuestions: {lab_contact} | Patient instruction only, email body | NEW |
| `message.delivery.template.alert.patientInstruction.text` | {lab_name} to {patient_first_name}: {instruction} Questions: {lab_contact} | Patient instruction only, SMS (the instruction starts with a capital letter, as in the instruction-with-result template) | NEW |
| `message.delivery.template.notice.email.subject` | {lab_name}: your results are ready | Ready notice, email subject | NEW |
| `message.delivery.template.notice.email.body` | Dear {patient_first_name},\n\nYour results from {lab_name} are ready. Please contact your clinician or the lab: {lab_contact}.\n\nThis message does not contain any results. | Ready notice, email body | NEW |
| `message.delivery.template.notice.text` | {lab_name}: {patient_first_name}, your results are ready. Please contact your clinician or the lab ({lab_contact}). | Ready notice, SMS | NEW |
| `message.delivery.template.result.email.subject` | {lab_name}: your {test_name} result | Patient result, email subject | NEW |
| `message.delivery.template.result.email.body` | Dear {patient_first_name},\n\nYour {test_name} result from {lab_name} is {result}.\n\nPlease contact your clinician or the lab: {lab_contact}. | Patient result, email body | NEW |
| `message.delivery.template.result.text` | {lab_name}: {patient_first_name}, your {test_name} result is {result}. Please contact your clinician or the lab ({lab_contact}). | Patient result, SMS | NEW |

Rendered merge-field values that are words come from keys too:

| Key | English | Context | Status |
|---|---|---|---|
| `label.delivery.field.reportCount` | {count, plural, one {# report} other {# reports}} | `{report_count}` | NEW |
| `label.delivery.field.certificateCount` | {count, plural, one {# certificate} other {# certificates}} | `{report_count}` for certificates | NEW |
| `label.delivery.field.reportLine.final` | {labNo}{hasOrder, select, yes { (your order {orderNo})} other {}}: Final, version {n} | One line of `{report_list}` | NEW |
| `label.delivery.field.reportLine.partial` | {labNo}{hasOrder, select, yes { (your order {orderNo})} other {}}: Partial, {released} of {total} results, version {n} | One line of `{report_list}` | NEW |
| `label.delivery.field.reportLine.amended` | {labNo}{hasOrder, select, yes { (your order {orderNo})} other {}}: Amended, version {n} | One line of `{report_list}` | NEW |
| `label.delivery.field.protectionNote.protected` | The attached PDFs are protected with your delivery password. If you do not have it, contact the lab. | `{protection_note}` | NEW |
| `label.delivery.field.howToOpen` | Open the attachment with a PDF reader app and type the delivery password. Some email previews cannot open protected files. | Second line of `{protection_note}` for protected reports (FR-C13) | NEW |
| `label.delivery.field.reportLine.certificate` | {labNo}: Certificate, version {n} | One line of `{report_list}` (environmental and vector certificates) | NEW |
| `label.delivery.field.protectionNote.masked` | The attached reports are masked copies: patient names and national ID numbers are removed. Contact the lab for the full reports. | `{protection_note}`. Release 2 | NEW |
| `label.delivery.field.protectionNote.asIssued` | The attached certificates are sent as issued. | `{protection_note}` for certificates sent as issued (FR-C16) | NEW |
| `label.delivery.field.secureLink` | Open online: {link} (until {date}) | `{secure_link}` | NEW |
| `label.delivery.field.reportAccess.email` | Sent to your report email. | `{report_access}` | NEW |
| `label.delivery.field.reportAccess.link` | Open them at {link} until {date}. | `{report_access}` | NEW |
| `label.delivery.field.reportAccess.contact` | Contact the lab to get them. | `{report_access}` | NEW |
| `label.delivery.field.ackLink` | I have received this alert: {link} | `{ack_link}` | NEW |

`{sex}` and `{age}` render with OpenELIS's existing patient sex labels and age display (REUSE).

### In-app alerts, validation page and public link pages

| Key | English | Context | Status |
|---|---|---|---|
| `message.delivery.alert.escalation` | Receipt not confirmed: {test} {result}, {labNo}, {recipient}. Phone them. | In-app alert (FR-E7) | NEW |
| `message.delivery.alert.awaitingValidation` | Priority result waiting for validation: {test} {labNo} | In-app alert to `result:validate` holders (FR-E10) | NEW |
| `label.delivery.validation.priorityTag` | Priority alert | Tag on the pinned validation page row (FR-E10) | NEW |
| `heading.delivery.ack.title` | Confirm receipt | Public page title | NEW |
| `message.delivery.ack.recorded` | Thank you. Your confirmation was recorded. | Public page | NEW |
| `message.delivery.ack.already` | This alert was already confirmed on {date} at {time}. | Public page | NEW |
| `heading.delivery.link.title` | Report from {lab_name} | Public page title | NEW |
| `message.delivery.link.protected` | The PDF opens with your delivery password. | Public page | NEW |
| `button.delivery.link.download` | Download | Public page button | NEW |
| `message.delivery.link.expired` | This link has expired. Contact {lab_name} for the report: {lab_contact}. | Public page | NEW |
| `message.delivery.publicLink.invalid` | This link is not valid. Contact {lab_name}: {lab_contact}. | Public page (secure link or receipt link) | NEW |

### Distribution Lists

| Key | English | Context | Status |
|---|---|---|---|
| `admin.notifications.lists.search` | Search lists | Search placeholder | NEW |
| `common.status` | Status | Filter label | REUSE |
| `common.active` | Active | Filter option, column, toggle | REUSE |
| `common.inactive` | Inactive | Filter option | REUSE |
| `common.all` | All | Filter option | REUSE |
| `admin.notifications.lists.add` | Add list | Primary button | NEW |
| `common.name` | Name | Column, field | REUSE |
| `common.description` | Description | Field | REUSE |
| `admin.notifications.lists.col.members` | Members | Column, section heading | NEW |
| `admin.notifications.lists.identifiers` | May receive patient identifiers | Column, field | NEW |
| `admin.notifications.lists.identifiers.helper` | Yes lets alert messages to this list include the patient's name, ID, phone and village for contact tracing. Use it only for lists of authorised health officials. | Helper | NEW |
| `label.yes` | Yes | Value | REUSE |
| `label.no` | No | Value | REUSE |
| `admin.notifications.lists.col.usedBy` | Used by rules | Column | NEW |
| `admin.notifications.lists.usedBy.none` | Not used by any rule | Column value | NEW |
| `admin.notifications.lists.membersCount` | {count, plural, one {# member} other {# members}} | Collapsed row | NEW |
| `common.email` | Email | Member column, field | REUSE |
| `admin.notifications.lists.member.phone` | Phone | Member column, field | NEW |
| `admin.notifications.lists.addMember` | Add member | Button | NEW |
| `common.deactivate` | Deactivate | Member row action | REUSE |
| `admin.notifications.lists.member.reactivate` | Reactivate | Member row action | NEW |
| `admin.notifications.lists.member.showInactive` | Show inactive members | Toggle | NEW |
| `admin.notifications.lists.member.needAddress` | Enter an email address or a phone number. | invalidText | NEW |
| `admin.notifications.lists.deactivate` | Deactivate list | Button | NEW |
| `admin.notifications.lists.reactivate` | Reactivate list | Button | NEW |
| `admin.notifications.lists.deactivate.inUse` | {count, plural, one {# alert rule uses this list.} other {# alert rules use this list.}} A deactivated list receives no alerts. Deactivate it? | Confirmation (Modal) | NEW |
| `admin.notifications.lists.saved` | List saved. | Toast | NEW |
| `admin.notifications.lists.empty` | No distribution lists yet. Add a list for each group of officials who must hear about priority results. | Empty state | NEW |
| `admin.notifications.lists.noMatch` | No lists match "{text}". | Empty state after search | NEW |
| `admin.notifications.lists.loadFailed` | Distribution lists could not be loaded. | Load error | NEW |

### Configuration, Notifications area

| Key | English | Context | Status |
|---|---|---|---|
| `admin.configuration.area.notifications` | Notifications | Area name | REUSE (Admin Redesign) |
| `admin.configuration.block.automaticSending` | Automatic sending | Block title | NEW |
| `admin.configuration.block.sending` | Sending and retries | Block title | NEW |
| `admin.configuration.block.secureLinks` | Secure links | Block title | NEW |
| `admin.configuration.setting.deliveryHoldMinutes.label` | Wait before sending a new version (minutes) | Setting | NEW |
| `admin.configuration.setting.deliveryHoldMinutes.description` | Results validated together go out as one version. | Setting description | NEW |
| `admin.configuration.setting.deliverySendPartials.label` | Send partial reports automatically | Setting | NEW |
| `admin.configuration.setting.deliverySendPartials.description` | Facilities with automatic delivery get each partial report as results are released. A facility can override this. | Setting description | NEW |
| `admin.configuration.setting.deliveryRetryMinutes.label` | Retry after (minutes) | Setting | NEW |
| `admin.configuration.setting.deliveryRetryMinutes.description` | A failed message is tried again after each of these delays, then every hour, until the time limit below. | Setting description | NEW |
| `admin.configuration.setting.deliveryGiveUpHours.label` | Stop retrying after (hours) | Setting (block Sending and retries) | NEW |
| `admin.configuration.setting.deliveryGiveUpHours.description` | A message that still has not gone this many hours after it was queued is marked Failed. Until then it stays Queued. | Setting description | NEW |
| `admin.configuration.setting.deliveryDefaultCountryCode.label` | Default SMS country code | Setting | NEW |
| `admin.configuration.setting.deliveryDefaultCountryCode.description` | Added to phone numbers typed without a country code, for example +675. | Setting description | NEW |
| `admin.configuration.setting.publicServerAddress.label` | Public server address | Setting | NEW |
| `admin.configuration.setting.publicServerAddress.description` | The address people outside the lab use to reach this server over the internet. Needed for secure links, alert receipt confirmations and escalation. Leave it empty if the server cannot be reached from outside: alerts then go without a confirmation link and reports go as attachments only. | Setting description | NEW |
| `admin.configuration.setting.deliverySecureLinks.label` | Secure links | Setting | NEW |
| `admin.configuration.setting.deliverySecureLinks.description` | Report messages carry a link that opens the same file the email attaches. | Setting description | NEW |
| `admin.configuration.setting.deliverySecureLinks.option.off` | Off | Option | NEW |
| `admin.configuration.setting.deliverySecureLinks.option.both` | Link as well as the attachment | Option | NEW |
| `admin.configuration.setting.deliverySecureLinks.option.linkOnly` | Link instead of the attachment | Option | NEW |
| `admin.configuration.setting.deliverySecureLinks.needsAddress` | Set the public server address to use secure links. | Disabled reason | NEW |
| `admin.configuration.setting.deliverySecureLinkDays.label` | Link lifetime (days) | Setting | NEW |
| `admin.configuration.setting.deliverySecureLinkDays.description` | After this many days a link shows a page asking the reader to contact the lab. | Setting description | NEW |
| `admin.notifications.settings.labContact` | Lab contact used in messages | Read-only row | NEW |
| `admin.notifications.settings.labContact.helper` | From the additional site information line in Report Management. Patient notices and masked copies tell the reader to contact the lab with it. | Helper | NEW |
| `admin.notifications.settings.labContact.edit` | Edit in Report Management | Link | NEW |
| `admin.notifications.settings.labContact.empty` | Not set. Add the lab's results phone or email to the additional site information line. | Warning when empty | NEW |
| `admin.notifications.settings.senderInChannels` | Set in Channels | Link on the sender address row | NEW |
| `admin.notifications.settings.bccRetired` | Retired. OpenELIS no longer sends blind copies, so reports cannot reach an address that no recipient list shows. | Marking on `org.openelisglobal.mail.bcc` | NEW |
| `admin.notifications.settings.noticePreview` | Patient notice preview | Preview label | NEW |
| `admin.configuration.notifications.sendTest` | Send a test | Button | REUSE (owner Admin Redesign) |
| `admin.notifications.settings.sendTest.to` | Send a test message to | Field | NEW |
| `admin.notifications.settings.sendTest.helper` | Type an email address or a phone number. The test uses the matching channel. | Helper | NEW |
| `admin.configuration.notifications.testSent` | Test sent to {0}. Its result shows in Sent Messages. | Inline success | REUSE (owner Admin Redesign) |

### Test Catalog: alert rule

| Key | English | Context | Status |
|---|---|---|---|
| `label.testCatalog.patientMessages` | Patient messages | Test field | NEW |
| `label.testCatalog.patientMessages.helper` | Controls whether messages to patients about this test may include the result. | Helper | NEW |
| `label.testCatalog.patientMessages.noticeOnly` | Ready notice only | Option | NEW |
| `label.testCatalog.patientMessages.onRequest` | Result when the order asks for it | Option | NEW |
| `label.testCatalog.patientMessages.byDefault` | Result by default | Option | NEW |
| `label.testCatalog.alerts.validatedOnly` | Alerts go out only after the result is validated. | Section description | NEW |
| `label.testCatalog.alerts.col.name` | Name | Column | REUSE |
| `label.testCatalog.alerts.col.trigger` | Trigger | Column | REUSE |
| `label.testCatalog.alerts.field.recipients` | Recipients | Column, section heading | REUSE |
| `label.testCatalog.alerts.col.channels` | Channels | Column | REUSE |
| `label.testCatalog.alerts.col.confirmReceipt` | Confirm receipt | Column | NEW |
| `label.testCatalog.alerts.confirmReceipt.within` | {minutes, plural, one {Yes, escalate after # minute} other {Yes, escalate after # minutes}} | Column value | NEW |
| `label.testCatalog.alerts.confirmReceipt.noEscalation` | Yes, no escalation | Column value | NEW |
| `label.no` | No | Column value | REUSE |
| `common.active` | Active | Column, toggle | REUSE |
| `label.testCatalog.alerts.field.trigger` | Alert when result is: | Field | REUSE |
| `label.testCatalog.alerts.field.specificValue` | Specific value | Field | REUSE |
| `label.testCatalog.alerts.trigger.*` | (existing trigger names) | Options | REUSE |
| `label.testCatalog.alerts.recipient.lists` | Distribution lists | Field | NEW |
| `label.testCatalog.alerts.recipient.lists.search` | Search lists | Placeholder | NEW |
| `label.testCatalog.alerts.recipient.lists.identifiersNote` | {list} may receive patient identifiers, so its messages include the patient's name and village. The facility and clinician messages carry the lab number and their own order number instead. | Info notification | NEW |
| `label.testCatalog.alerts.recipient.facility` | Referring Facility | Tick box | REUSE |
| `label.testCatalog.alerts.recipient.physician` | Ordering Physician | Tick box | REUSE |
| `label.testCatalog.alerts.recipient.patient` | Patient | Tick box | REUSE |
| `label.testCatalog.alerts.recipient.customEmail` | Custom email | Field (fixed address) | REUSE |
| `label.testCatalog.alerts.recipient.customPhone` | Custom phone | Field (fixed address) | REUSE |
| `label.testCatalog.alerts.field.instruction` | Instruction to the patient | Field | NEW |
| `label.testCatalog.alerts.field.instruction.helper` | For example: Please stay at home for 7 days and call 1800 200 for advice. The result is added only for tests set to "Result by default" or when the order asked for it. | Helper | NEW |
| `label.testCatalog.alerts.channel.email` | Email | Channel option | REUSE |
| `label.testCatalog.alerts.channel.sms` | SMS | Channel option | REUSE |
| `label.testCatalog.alerts.channel.whatsapp` | WhatsApp | Channel option. Release 2 | NEW |
| `label.testCatalog.alerts.field.confirmReceipt` | Ask recipients to confirm receipt | Toggle | NEW |
| `label.testCatalog.alerts.field.confirmReceipt.helper` | Each message carries a link "I have received this alert". This is separate from critical result acknowledgment. | Helper | NEW |
| `label.testCatalog.alerts.field.confirmReceipt.needsAddress` | Set the public server address in Configuration to ask for confirmation. | Disabled reason | NEW |
| `label.testCatalog.alerts.field.escalate` | If nobody confirms, alert lab staff | Toggle | NEW |
| `label.testCatalog.alerts.field.escalateMinutes` | After (minutes) | Field | NEW |
| `label.testCatalog.alerts.field.escalate.helper` | Users who can view alerts get an in-app alert naming the recipient to phone. | Helper | NEW |
| `label.testCatalog.alerts.field.ackRequired` | Require acknowledgment | Field (critical result acknowledgment, unchanged) | REUSE |
| `label.testCatalog.alerts.field.overrideText` | Use different text for this rule | Toggle | NEW |
| `label.testCatalog.alerts.field.overrideText.helper` | Replaces the Templates text for the recipients you pick, for this rule only. | Helper | NEW |
| `label.testCatalog.alerts.turnOff` | Turn off rule | Button | NEW |
| `label.testCatalog.alerts.turnOn` | Turn on rule | Button | NEW |
| `label.testCatalog.alerts.showInactive` | Show inactive rules | Toggle | NEW |
| `label.testCatalog.alerts.error.noRecipient` | Pick at least one recipient. | invalidText | NEW |
| `label.testCatalog.alerts.error.noChannel` | Pick at least one channel. | invalidText | NEW |
| `common.save` | Save | Button | REUSE |
| `common.cancel` | Cancel | Button | REUSE |

### Order entry: patient notices

| Key | English | Context | Status |
|---|---|---|---|
| `order.result.reporting.heading` | RESULT REPORTING | Block heading (existing block) | REUSE |
| `message.delivery.order.facilityAuto` | {facility} receives reports automatically by email. | Facility line | NEW |
| `message.delivery.order.facilityManual` | {facility} receives reports when the lab sends them from the print queue. | Facility line | NEW |
| `message.delivery.order.facilityNone` | {facility} has no report email. | Facility line | NEW |
| `label.delivery.order.facilityEmail` | Facility email for this order | Field | NEW |
| `label.delivery.order.facilityPhone` | Facility phone for this order | Field | NEW |
| `message.delivery.order.thisOrderOnly` | Used for this order only. Change the facility's addresses in Locations & Organizations. | Helper | NEW |
| `label.delivery.order.includeClinician` | Send reports to the ordering clinician | Tick box | NEW |
| `message.delivery.order.clinicianNoContact` | {name} has no email or phone number on file. | Helper | NEW |
| `common.test` | Test | Column | REUSE |
| `label.delivery.order.patientConsent` | Patient agreed to receive messages from the lab | Label over the patient SMS and email boxes (FR-F1) | NEW |
| `label.delivery.order.history.patientMessages` | Patient messages {ticked, select, yes {ticked} other {unticked}}: {channel}, {test} | Order history entry, with user and time (FR-F1) | NEW |
| `label.delivery.order.history.includeResult` | Include the result {ticked, select, yes {ticked} other {unticked}}: {test} | Order history entry, with user and time (FR-F1, FR-F3) | NEW |
| `label.delivery.order.col.patientMessages` | Patient messages (test setting) | Column | NEW |
| `label.delivery.order.col.patientSms` | Patient SMS | Column | NEW |
| `label.delivery.order.col.patientEmail` | Patient email | Column | NEW |
| `label.delivery.order.col.includeResult` | Include the result | Column | NEW |
| `label.delivery.order.patientMessages.noticeOnly` | Ready notice only | Cell | NEW |
| `label.delivery.order.patientMessages.onRequest` | Result when the order asks for it | Cell | NEW |
| `label.delivery.order.patientMessages.byDefault` | Result by default | Cell | NEW |
| `label.delivery.order.patientSmsFor` | Patient SMS, {test} | Accessible name | NEW |
| `label.delivery.order.patientEmailFor` | Patient email, {test} | Accessible name | NEW |
| `label.delivery.order.includeResultFor` | Include the result, {test} | Accessible name | NEW |
| `label.delivery.order.notAllowed` | Not allowed | Cell beside a disabled box | NEW |
| `message.delivery.order.resultNotAllowed` | This lab does not send this test's results to patients by message. | Toggletip | NEW |
| `message.delivery.order.includeReadOnly` | Only users allowed to send results to patients can change this. | Toggletip (read-only box) | NEW |
| `message.delivery.order.noPatientContact` | The patient has no phone number or email. Add one in the patient record to send notices. | Warning | NEW |
| `message.delivery.order.summary.results` | {count, plural, one {The patient gets # message with a result when that result is validated.} other {The patient gets # messages with results, each when its result is validated.}} | Summary | NEW |
| `message.delivery.order.summary.notice` | The patient gets one "results ready" notice when every result on the order is released. The notice never names a test. | Summary | NEW |
| `message.delivery.order.summary.noNotice` | Every ticked test sends its own result, so no separate ready notice is sent. | Summary | NEW |

### Keys minted by sibling specs (REUSE; listed so the preview matches; owned and minted by the named spec)

Report Print Queue (OGC-1031), on its own page:

| Key | English | Context | Owner and status |
|---|---|---|---|
| `reportQueue.action.send` | Send | Row action and batch toolbar | REUSE (owner OGC-1031) |
| `reportQueue.action.sendFor` | Send reports, {labNo} | Row action accessible name | REUSE (owner OGC-1031) |
| `reportQueue.col.sent` | Sent | Column | OGC-1031, existing in its v2.3 table |
| `reportQueue.sent.value` | Sent v{n} {time} | Sent cell | OGC-1031, existing in its v2.3 table |
| `reportQueue.sent.queued` | Queued: sends {time} | Sent cell | OGC-1031, existing in its v2.3 table |
| `reportQueue.sent.failed` | Failed | Sent cell | OGC-1031, existing in its v2.3 table |
| `reportQueue.sent.skipped` | Skipped | Sent cell | OGC-1031, NEW |
| `reportQueue.sent.none` | Not sent | Sent cell | OGC-1031, existing in its v2.3 table |
| `reportQueue.filter.sent` | Sent | Filter label | OGC-1031, existing in its v2.3 table |
| `common.all` | All | Sent filter option | REUSE (shared) |
| `reportQueue.sent.sentName` | Sent | Sent filter option (the other options reuse the Sent cell keys above) | OGC-1031, NEW |
| `reportQueue.notice.noContact` | Patient notice not sent: no contact | Row indicator | OGC-1031, NEW |
| `reportQueue.history.sent` | Sent {time} to {recipient}, {format}, by {user} | Version history line | OGC-1031, existing in its v2.3 table |
| `reportQueue.history.notReachableTyped` | {address}: Not reachable: typed for one send | Version history line under an Amended send (FR-C4) | OGC-1031, NEW in its v2.5 table |

Locations & Organizations, Result delivery section:

| Key | English | Context | Owner and status |
|---|---|---|---|
| `admin.locations.delivery.section` | Result delivery | Form section | REUSE (owner L&O) |
| `admin.locations.delivery.emails` | Report email addresses | Field | REUSE (owner L&O) |
| `admin.locations.delivery.emails.placeholder` | Add an address | Placeholder | REUSE (owner L&O) |
| `admin.locations.delivery.number` | Report SMS or WhatsApp number | Field | REUSE (owner L&O) |
| `admin.locations.delivery.number.helper` | Used to say reports are ready. Reports are attached only to email. | Helper | REUSE (owner L&O) |
| `admin.locations.delivery.auto` | Send reports automatically | Field | REUSE (owner L&O) |
| `admin.locations.delivery.auto.on` | On: send each version when it is issued | Option | REUSE (owner L&O) |
| `admin.locations.delivery.auto.off` | Off: send from the print queue only | Option | REUSE (owner L&O) |
| `admin.locations.delivery.partials` | Include partial reports | Field | REUSE (owner L&O) |
| `admin.locations.delivery.partials.labDefault` | Lab default ({value, select, yes {Yes} other {No}}) | Option | REUSE (owner L&O) |
| `admin.locations.delivery.partials.yes` | Yes | Option | REUSE (owner L&O) |
| `admin.locations.delivery.partials.no` | No | Option | REUSE (owner L&O) |
| `admin.locations.delivery.language` | Language | Field | REUSE (owner L&O) |
| `admin.locations.delivery.language.helper` | Messages to this organization use this language. | Helper | REUSE (owner L&O) |
| `admin.locations.delivery.password` | Delivery password | Field | REUSE (owner L&O) |
| `admin.locations.delivery.password.show` | Show | Button | REUSE (owner L&O) |
| `admin.locations.delivery.password.hide` | Hide | Button | REUSE (owner L&O) |
| `admin.locations.delivery.password.copy` | Copy | Button | REUSE (owner L&O) |
| `admin.locations.delivery.password.generate` | Generate | Button | REUSE (owner L&O) |
| `admin.locations.delivery.password.change` | Change | Button | REUSE (owner L&O) |
| `admin.locations.delivery.password.showFor` | Show delivery password, {name} | Accessible name | REUSE (owner L&O) |
| `admin.locations.delivery.password.copyFor` | Copy delivery password, {name} | Accessible name | REUSE (owner L&O) |
| `admin.locations.delivery.password.setBy` | Password set {date} by {user}. Give it to the facility by phone or in person. Every Show and Copy is recorded in History. | Helper | REUSE (owner L&O) |
| `admin.locations.delivery.password.setOnly` | Password set {date} | State (no view privilege) | REUSE (owner L&O) |
| `admin.locations.delivery.password.notSet` | No password set. Patient reports are not sent to this organization until a password is set; certificates are sent as issued. | State (Release 1) | REUSE (owner L&O) |
| `admin.locations.delivery.password.notSetMasked` | No password set. Patient reports to this organization are sent as masked copies; certificates are sent as issued. | State. Release 2 | REUSE (owner L&O) |
| `admin.locations.delivery.auto.noPasswordWarning` | Patient reports will not be sent until a delivery password is set. | Warning when automatic delivery is on and no password is set | REUSE (owner L&O) |
| `admin.locations.delivery.password.copied` | Copied. Recorded in History. | Inline confirmation | REUSE (owner L&O) |
| `admin.locations.delivery.password.changeConfirm.title` | Change the delivery password? | Danger Modal title | REUSE (owner L&O) |
| `admin.locations.delivery.password.changeConfirm.body` | Reports already sent stay locked with the old password, so the facility will need both for a while. | Danger Modal body | REUSE (owner L&O) |
| `admin.locations.delivery.password.changeConfirm.button` | Generate new password | Danger Modal button | REUSE (owner L&O) |
| `admin.locations.delivery.column` | Delivery | Organizations list column | REUSE (owner L&O) |
| `admin.locations.delivery.tag.autoProtected` | Automatic, protected | Tag | REUSE (owner L&O) |
| `admin.locations.delivery.tag.autoNoPassword` | Automatic, no password | Tag (amber, a warning) | REUSE (owner L&O) |
| `admin.locations.delivery.tag.manualProtected` | Manual, protected | Tag | REUSE (owner L&O) |
| `admin.locations.delivery.tag.manualNoPassword` | Manual, no password | Tag | REUSE (owner L&O) |
| `admin.locations.delivery.tag.noEmail` | No report email | Tag (gray) | REUSE (owner L&O) |
| `admin.locations.delivery.filter` | Delivery | Organizations list filter label | REUSE (owner L&O) |
| `common.all` | All | Filter option (Delivery filter) | REUSE |
| `admin.locations.delivery.filter.ready` | Ready | Filter option (report email and delivery password set) | REUSE (owner L&O) |
| `admin.locations.delivery.filter.noEmail` | No report email | Filter option | REUSE (owner L&O) |
| `admin.locations.delivery.filter.noPassword` | No password | Filter option (report email, no password) | REUSE (owner L&O) |
| `admin.locations.delivery.readyCount` | {count, plural, one {# facility can receive reports by email} other {# facilities can receive reports by email}} | Count above the Organizations list | REUSE (owner L&O) |
| `admin.locations.delivery.ward.emails` | Report email | Wards / Depts column | REUSE (owner L&O) |
| `admin.locations.delivery.ward.facilityOnly` | Facility addresses only | Wards / Depts cell | REUSE (owner L&O) |
| `admin.locations.delivery.ward.helper` | Reports for this ward go to these addresses and to the facility's. | Helper | REUSE (owner L&O) |
| `admin.locations.delivery.history.passwordShown` | Delivery password shown | History action | REUSE (owner L&O) |
| `admin.locations.delivery.history.passwordCopied` | Delivery password copied | History action | REUSE (owner L&O) |
| `admin.locations.delivery.history.passwordChanged` | Delivery password changed | History action | REUSE (owner L&O) |

---

## Acceptance Criteria

1. Channels lists Email and SMS with Connection, Status and last successful send. With Email set up, Send test email to a typed address arrives, and Sent Messages shows a Test row with status Sent. With SMS set up through TextIt, Send test SMS arrives the same way. With WhatsApp set up through TextIt, Channels lists it and Send test message arrives using an approved template (Release 2).
2. With a wrong SMTP password, Send test shows "Authentication failed: check the username and password." and a Failed Test row; after three failed attempts in a row the Email row shows Failing with the time and error, and the next successful attempt returns it to Ready.
3. `GET` of any channel or connection returns no password or token; saving the form with the secret untouched keeps it working.
4. Stopping the server while 5 reports are Queued and starting it again sends all 5; none is lost, and each Sent row records its gateway message ID.
5. A send to a facility with no report email writes a Skipped row "No email address"; nothing is attempted.
6. For Port Moresby General Hospital with a delivery password and automatic delivery on, validating the first 4 of 12 results creates v1 when the hold ends and sends one email with `{labNo}-v1.pdf` that opens only with that password, and the version history shows "Sent ... protected".
7. Validating two more results within the hold produces one send of one version carrying all six results, not two sends.
8. Changing a result that was issued (printed or sent) produces an Amended version that is queued to every earlier recipient, including one whose automatic delivery is off, with "Amended" in the subject.
9. With no delivery password on 9 Mile Urban Clinic, its emailed report is a masked copy that shows initials, sex, age, date of birth, patient ID and the requester's order number, no name and no national ID, and the "Masked copy" line; the masked file has its own SHA-256 in the archive. (Release 2)
10. No email subject, email body, SMS or WhatsApp text produced by any product contains a patient's national ID, and none contains a patient's full name except alert messages to lists marked "May receive patient identifiers"; messages to the patient contain at most the patient's first name (checked by a test over every default template and over rendered output).
11. Selecting 7 rows for 4 requesters (Port Moresby General Hospital, which has one report email and a delivery password, and whose Ward 4B has its own report email; 9 Mile Urban Clinic, which has a report email and no delivery password; an Eda Ranu Water Utility certificate sent to its requestor contact; and Gerehu General Hospital, which has no report email) opens the dialog with 4 recipient groups, shows 9 Mile Urban Clinic with "No delivery password" and **Will be skipped**, and the button "Send 4 reports to 3 recipients"; confirming sends one email per address (the facility, Ward 4B for its own reports and the client contact), and the toast reads "4 reports queued to 3 recipients. 2 recipients skipped: no email for Gerehu General Hospital, no delivery password for 9 Mile Urban Clinic."
12. Adding a typed address in the Send dialog for an order whose facility has a delivery password shows the confirmation line "Send 2 reports to {address}, protected with the facility's delivery password? ..." and sends the protected copy, which opens with the facility's password. For an order whose facility has no password, the dialog shows "This order's facility has no delivery password, so this report cannot be sent to a typed address yet." before sending, and the typed address is written as Skipped "No delivery password". An address that is neither a valid email nor a phone number that can be put in international format is refused with its message.
13. A user with `report:run` but without `delivery:view_password` sees "Password set" with no Show or Copy; a user with it can Show, and the organization's History records the Show with user and time.
14. Generate produces a 12-character password, displayed in three-character groups, with none of 0, O, 1, l, I; the PDF opens with the 12 characters and no hyphens.
15. Changing a delivery password asks for confirmation and records the new set date; reports sent before still open with the old password.
16. Typing a different referring-site email at order entry leaves the organization's email unchanged, shows "Used for this order only", and the order's report goes to the typed address.
17. An environmental order whose requesting organization has no delivery settings is sent to the requestor contact's email as issued (`LH-{labNo}-v1.pdf`, no masking) when a user presses Send; with a client delivery password set, it is sent protected.
18. A Test Catalog alert rule for Cholera RDT = Positive with the list "Provincial Health Office: Cholera" sends nothing at result entry and sends when the result is validated; the Sent Messages row shows product Alert and the rule name, grouped with one member row per recipient per channel.
19. An alert to a list not marked "May receive patient identifiers" contains the lab number and requester's order number but no patient name; to a list marked Yes it contains the patient name; neither contains the national ID. A rule with its own text for the list uses that text.
20. With "Ask recipients to confirm receipt" on and escalation after 60 minutes, an unconfirmed alert raises an in-app alert to users with `alert:view` in the lab after 60 minutes, which a user with `alert:manage` can acknowledge and resolve; opening the link before then records the confirmation and no escalation is raised. Confirming never writes `critical_callback`.
21. An order with the patient SMS box ticked gets one ready notice when every counted analysis is released, with no test name and no result. An order corrected while still partial (Amended) gets its notice once every result is released.
22. A user without `order:notify_result` sees "Include the result" read-only in its starting state; a user with it can change it, and when ticked the patient receives a message with the test name and result.
23. For a test set to "Ready notice only", "Include the result" is disabled with its Toggletip and the ready notice is still sent.
23a. For SARS-CoV-2 RDT set to "Result by default", an order for a patient with a phone number starts with the patient SMS box and "Include the result" ticked. With an alert rule "SARS-CoV-2 RDT = Positive" whose patient instruction is on, a positive validated result sends the patient one SMS: the self-isolation instruction with the result (FR-F6). A negative result, which matches no rule, sends the result message.
24. Removed in v0.2 (central delivery moved to the Results Portal, D-237).
25. A secure link opens the same file the send carried until it expires; after expiry it shows the "contact the lab" page; each opening is listed on the row.
26. Resend on a Failed report row sends the same archived version and links the new row to the original; the expansion lists every attempt with its time and error.
27. On upgrade, Test Notifications' patient settings appear as each test's Patient messages value ("Result when the order asks for it" where patient messages were on; no test becomes "Result by default"), its templates are kept as inactive templates, and its menu entries redirect to Templates.
28. `/SentMessages?product=alert&status=failed` and `/SentMessages?product=patient_notice` load with those filters applied, with times in the laboratory time zone; `/MasterListsPage/notificationTriggerConfig/sent` redirects to `/SentMessages?product=trigger`.
29. With the interface in French, no English text remains on any page of this feature. A facility whose language is French receives default templates in French, and one set to English receives English, whatever the sender's interface language.
30. Every status shows text as well as colour, and every Show, Copy and Send control has an accessible name that includes the record.
31. With the SMTP server unreachable, a queued report is tried at once, after 1, 5, 15, 30 and 60 minutes, then every hour; between attempts it stays Queued with "Next attempt at {time}", and the Email channel shows Failing after the third failed attempt. If the server comes back within 24 hours of queuing, the report is sent; otherwise it shows Failed 24 hours after it was queued, with every attempt listed with its time and error. With Email not set up, a send is marked Failed at once with "Email is not set up".
32. Typing `{patient_name}` into the report email body and saving is refused with "{patient_name} cannot be used in this message: it is not safe for this recipient. Remove it to save."; Insert field for that slot does not offer it. Each message type has email and SMS editors with a live preview (and, from Release 2, a WhatsApp template name, FR-A18).
33. With "Send reports to the ordering clinician" ticked on an order whose provider has an email, the clinician receives each automatic version protected with the facility's password; when the facility has no password, the clinician's row is Skipped "No delivery password" (in Release 2, the clinician receives a masked copy).
34. A facility with a report number receives an SMS saying how many reports are ready, with no attachment and no patient data; with secure links on, the SMS carries the link.
35. A print queue row with no released result offers no Send. Sending v1 to a recipient who already received v2 asks "A newer version was already sent on {date}. Send this older version?"
36. A patient with no email and no phone number gets a Skipped row "Patient has no email or phone number", and the print queue row shows "Patient notice not sent: no contact".
37. After upgrade, the existing SMTP connection appears in Channels with its settings and the same `external_connection` row ID; External Connections no longer offers SMTP, BMP or SMPP for new rows (nor WhatsApp, from Release 2).
38. Each page shows a skeleton while loading; when the server returns an error, the page names what failed and offers Retry; an empty Sent Messages shows "Nothing sent in this period."; an empty Distribution Lists offers Add list; a list emptied by filters offers Clear filters.
39. With contact tracing, billing number and subject number switched on, a masked copy prints none of the contact-tracing index name, record number, billing number or subject number; the protected full report prints them. (Release 2)
40. A vector certificate for a client with a delivery password is sent protected as `LH-{labNo}-v1.pdf`; for a client without one it is sent as issued with nothing removed; an amended certificate is attached as `LH-{labNo}-Am1.pdf`.
41. A report for Ward 4B, which has its own report email, goes to the ward address and to the facility's addresses, each protected with the facility's password. The ward form has no SMS number field.
42. If the server stops after a gateway accepted a message but before its status was written, the message is sent again after restart and the row shows both attempts with their gateway message IDs, so the repeat can be seen.
43. For a test set to "Result when the order asks for it", with "Include the result" ticked and an alert rule whose patient instruction fires on the same validated result, the patient receives one SMS carrying the instruction and the result; without the tick, the one SMS carries the instruction only.
44. The ready notice for a patient named Mary Kaupa reads "CPHL: Mary, your results are ready. Please contact your clinician or the lab (CPHL results desk, 325 6800)." and contains no surname, no test and no result.
45. An order emailed automatically as v1 and never printed: correcting a result creates v2 marked Amended and queues it to the earlier recipient; printing v2 afterwards creates no v3 and the version history shows both the send and the print against v2.
46. After a facility's delivery password changes, Resend of an earlier protected report sends the same archived version encrypted with the new password, and the row records the new password's set date.
47. A user whose lab units are all Environmental sees no patient report or clinical alert rows in Sent Messages. Trigger event rows are visible to every `delivery:view` holder.
48. A user with `distribution_list:manage` and no Administration privilege can add members, deactivate a member and deactivate a list, sees only Distribution Lists in the Notifications group, and is not treated as an administrator.
49. A role that held `extconnection:manage` before upgrade can open Channels after upgrade.
50. A user with `delivery:view_password` but not `organization:manage` can Show and Copy a delivery password and sees no Generate or Change.
51. A batch Send to one facility with one Final and one Amended report has the subject "CPHL results: Amended, 2 reports" and a body that lists each report with its own state.
52. With `org.openelisglobal.mail.bcc` set in the server file, no message carries a blind copy, and Configuration marks the property as retired.
53. After upgrade, an organization whose email was results@pmgh.health.gov.pg shows it as its first report email; changing the report email later leaves the organization's general email unchanged.
54. An order created before upgrade with a provider Email box ticked shows "Send reports to the ordering clinician" ticked after upgrade; order entry shows no provider Email or SMS boxes.
55. Results entered through Logbook results and calculated results send no alert email, SMS or WhatsApp until they are validated.
56. With the public server address empty, the secure links setting and "Ask recipients to confirm receipt" are disabled with their reasons, and no message carries a link: an alert for a rule that has escalation on goes without a confirmation link, no escalation is raised after the escalation time, and reports go as attachments only.
57. Configuration's Notifications area (`/MasterListsPage/configuration?area=notifications`) shows the hold, partials, retry (1, 5, 15, 30, 60), stop retrying after (24 hours), country code, public server address and secure link settings, the lab contact read-only with a link to its editor, and links to Channels, Templates, Distribution Lists and Triggers; saving a setting needs `notification:manage`.
58. A rule that is turned off sends nothing and is hidden from the test's rule list until "Show inactive rules" is on; no rule can be deleted.
59. Sending an order with no version yet to a facility with no report email, with no other recipient ticked, writes a Skipped row "No email address", creates no version and archives nothing; the print queue row shows "Skipped" in the Sent column and "Not issued" in the Version column. The same happens when automatic delivery finds no recipient with an address.
60. In Release 1, automatic delivery of a patient report to a facility with a report email and no delivery password writes a Skipped row "No delivery password. Set one in Locations & Organizations.", sends nothing and creates no version; a certificate to a client with no password is still sent as issued.
61. With automatic delivery on for Port Moresby General Hospital and a 10-minute hold, validating results on three of its orders within 10 minutes sends one email to each of its report addresses carrying the three report versions; a fourth order validated after that hold ended starts a new hold and goes in a later email. 25 reports due in one hold window go in two emails (20 and 5), and an email whose attachments would pass 10 MB is split. A facility with a report number gets one SMS for the window, however many reports it holds.
62. An Amended version for an order sent earlier is not added to a hold window already open for that recipient: it starts its own hold and goes in its own email with "Amended" in the subject.
63. A report SMS sent through TextIt shows Sent, then Delivered once TextIt reports it (with no public server address set), or Failed with TextIt's reason; an SMS sent through BMP or SMPP stays at Sent. Sent Messages shows "Sent means the mail server accepted it. Bounces are not tracked." under the status filter, and `/SentMessages?status=delivered` lists only Delivered rows.
64. Entering a Cholera RDT Positive result that matches a rule with the list "Provincial Health Office: Cholera" sends no message and gives every holder of `result:validate` for that lab unit the in-app alert "Priority result waiting for validation: Cholera RDT CPHL-26-004211"; the result is pinned to the top of the validation page with a "Priority alert" Tag. Validating it removes the pin and Tag and sends the rule's messages.
65. A protected report opens with the delivery password in a current phone PDF reader app and in a desktop PDF reader; the file is encrypted with AES-256 (PDF 2.0, security handler revision 6), and the report email carries the line "Open the attachment with a PDF reader app and type the delivery password. Some email previews cannot open protected files."
66. Ticking the patient SMS box for a test at order entry, under the label "Patient agreed to receive messages from the lab", records in the order history who ticked it and when; unticking it, and ticking or unticking "Include the result", are recorded the same way.
67. A protected report's Sent Messages row shows both the archive SHA-256 of the version and the SHA-256 of the encrypted file that was sent, and they differ; a certificate sent as issued shows the same value for both.
68. After v1 of an order is sent to the facility and to a typed address, correcting a result queues the Amended v2 to the facility only, and v2's version history lists the typed address with "Not reachable: typed for one send".
69. With WhatsApp set up through TextIt and a WhatsApp template name saved for the patient ready notice, the notice is sent over WhatsApp as that template with the merge values in the saved order; editing the SMS text on the Templates page does not change what is sent over WhatsApp; a slot with no template name writes a Skipped row "No approved WhatsApp template". (Release 2)
70. A facility whose language is Portuguese, for which the lab has saved no text, receives the English default templates, and the Templates page shows "No Portuguese text yet" for that language; a facility set to French receives the shipped French defaults.
71. In Release 1 the Send dialog offers only Protected full report for patient reports (and Protected or Certificate as issued for certificates); no format control offers Masked copy, and no Sent Messages row, attachment name or version history line says "masked".
72. Until the Configuration page ships, the lab-wide delivery settings, including `deliveryGiveUpHours`, are edited on the existing Site Information page, and changing them there changes how messages are held and retried.

---

## Dependencies

- **Report Print Queue (OGC-1031):** one print pipeline with a renderer per report type, version records created at issue (D-236), the issue history and the archive; the Sent column, Sent filter and the patient notice indicator (§K). Report delivery cannot ship before it.
- **Patient report (OGC-1111):** masked mode in the data with its field list (OGC-1111 FR-A61; needed only for Release 2), requester's order number, version and issue time on every report, partial marker on continuation pages, lab contact guidance (OGC-1111 FR-A62) (§K).
- **Admin Redesign:** the Configuration page with its Notifications area (D-241), the Notifications SideNav group, the shared secret field (AS-31, with the delivery-password exception) and the admin page standard. Not blocking: until Configuration ships, the settings are `site_information` entries edited on the existing Site Information page (Releases).
- **Users and Roles / PR #3443:** privilege catalogue for the six NEW codes, and Appendix A mapping `delivery` to Reports and `distribution_list` to Quality.
- **Locations & Organizations:** the organization open row that the Result delivery section extends, and the Delivery column.
- **Test Catalog Alerts (OGC-763):** the rule editor that gains recipients, receipt confirmation, escalation and the Patient messages setting.
- **Clinical Order Entry v4 (OGC-1266):** the Result reporting block.
- **TextIt gateway** (from OGC-437) for SMS where TextIt is used, including its message status API, which OpenELIS polls for Delivered and Failed (FR-A10); the existing BMP (including Twilio) and SMPP senders.
- **Release 2: TextIt's WhatsApp channel** and WhatsApp templates approved by Meta, registered by each lab in TextIt (FR-A4, FR-A18). Each WhatsApp message costs money.
- **Validation page (OGC-1364):** pinning and the "Priority alert" Tag for results waiting for validation (FR-E10).
- **A public server address** for secure links, receipt-confirmation links and escalation. Optional: most labs have none, and Release 1 works without it (Releases).
- **A current PDF library** that writes AES-256 encryption (PDF 2.0, security handler revision 6) (FR-C9).
- **New data elements** listed under Information & Data.
- **Rollout task, not a build task: directory cleanup.** Before turning on automatic delivery, each lab checks report emails and sets delivery passwords for its facilities, using the Locations & Organizations Delivery filter and readiness count (L&O FR-N9), and gives each facility its password by phone or in person. In Release 1 a facility without a password receives no patient reports by email.

---

## Docs Impact

Shipping this changes published manual pages. Each slice's Feature Doc child re-captures the affected pages at Acceptance with the `openelis-user-manual` skill and bumps their `capturedVersion` in `docs-manual/contracts.json`.

| Manual page | Change |
|---|---|
| `laporan-hasil-report` (Report Print Queue) | Send (row and batch toolbar), the Sent column and filter, sends in the version history, the patient notice indicator. |
| Test Notification Configuration | Retired (FR-H1). The page is replaced by a short note pointing to Templates, the test's Patient messages setting and order entry. |
| Notification Triggers | Its tabs become the Notifications pages (Triggers, Templates); Sent Messages moves to Reports in the main menu. |
| External Connections | The SMTP, BMP and SMPP types are removed (WhatsApp in Release 2); they are set up in Channels. |
| Organization Management (Locations & Organizations) | The Result delivery section, delivery password, Delivery column, Delivery filter and readiness count, and what the password protects. |
| Validation | The pinned "Priority alert" rows and the "Priority result waiting for validation" alert (FR-E10). |
| Order entry, Result reporting block | Patient notices, "Include the result", "Send reports to the ordering clinician", the facility's delivery line; provider boxes removed. |
| Test Catalog alerts | Recipients and distribution lists, validation-only firing, receipt confirmation and escalation, Patient messages, turning rules off. |
| New pages | Sent Messages, Channels, Templates, Distribution Lists, and the Configuration Notifications area. |

---

## Out of Scope

- **Central delivery and any results portal.** A later phase owned by the Results Portal specs (`designs/portal/results-portal-c0-discovery-brief.md`, `designs/portal/facility-results-portal.md`): a separate application on the central FHIR server that facilities log into. OpenELIS sends all lab data to the central FHIR store; the portal keeps its own visibility settings. Result Delivery's per-test Patient messages setting governs local messages only. Secure links (FR-G1) remain in scope. (D-237)
- Export and import of recipient settings, distribution lists and templates (it existed only for central delivery).
- Digests (one email per facility per day or other fixed period). Decided: not in the first release. Automatic delivery batches only the reports that fall in one recipient's hold window (FR-C2).
- An allowed-domain list for full reports. Decided: no.
- HTML email formatting, CC, read receipts beyond alert receipt confirmation.
- Replies and two-way SMS; delivery receipts from gateways other than TextIt (TextIt status is polled, FR-A10).
- Reading email bounces from a mailbox, so that Sent Messages could show bounced email. A later improvement; in Release 1, Sent means the mail server accepted the message (FR-A10).
- Sending unvalidated (presumptive) results to anyone outside the lab (D-230). Labs phone officials when their policy says so; FR-E10 flags the result to validators.
- WhatsApp messages with free text (WhatsApp sends only approved templates, FR-A18).
- Exactly-once sending: delivery is at least once (FR-A7).
- A patient portal or patient login.
- Unprotected full reports sent by OpenELIS.
- Case-based surveillance reporting (stays with FHIR exchange).

---

## Open Questions

1. **Hold before sending a new version:** is 10 minutes the right default?
2. **Test Notifications provider settings on upgrade:** FR-H1 makes each test's provider setting the starting state of "Send reports to the ordering clinician" for orders containing that test. Confirm, or drop the per-test setting and start every order unticked.
3. **Referral Out and the patient's name:** Referral Out (trigger event) default template includes the patient's first and last name on develop, but D-226 says no message carries a full name. Are lab-to-lab trigger events exempt from D-226, or should the default template drop the last name?

---

## Decisions (proposed, D-222 to D-249)

Numbering: v0.1 drafted these as D-220 to D-233, but the shared ledger on `main` already holds D-220 and D-221 (`/breakdown` one Epic; API and key reuse), so every Result Delivery decision moves up by two: v0.1's D-220 to D-233 are now D-222 to D-235, and v0.2's new decisions are D-236 to D-243. v0.3's new decisions are D-244 to D-249.

Ledger effects: D-235 supersedes D-006; D-236 amends D-140; D-237 supersedes D-234; the ledger text of D-230 is aligned with the text below. Admin Redesign's own D-190 to D-202 and Users and Roles' D-203 to D-206 collide with ledger IDs; they are cited with their spec name ("Admin Redesign D-199") and left for registry upkeep.

| ID | Decision |
|---|---|
| D-222 | Result delivery has three products (report delivery, priority alerts, patient ready notice) on one foundation: channels, recipients, templates, persistent outbox, one Sent Messages log. No product has its own sender or log. |
| D-223 | The unit of report delivery is an issued, archived report version, never a per-result message. |
| D-224 | Full reports are sent only as PDFs protected by a delivery password that belongs to the facility or client; recipients without a password get the masked copy (Release 2; in Release 1 they are skipped, D-245). OpenELIS never sends an unprotected full report. Certificates, which identify no patient, are protected when the client has a password and otherwise sent as issued (FR-C16). |
| D-225 | A delivery password can be shown again (logged) by users with `delivery:view_password`, and generated or changed by users who also hold `organization:manage`; it is stored with reversible encryption. Connection secrets are never shown again. |
| D-226 | Patient name and national ID never appear in readable form in any message text, enforced by allowed merge fields per template slot. Exceptions: alert messages to lists marked "May receive patient identifiers" may carry the full name, and messages to the patient may carry the first name. The national ID never appears. |
| D-227 | The masked copy removes name (initials kept), national ID, address, phone, the contact-tracing index name and record number, billing number and subject (ST) number; it keeps patient ID, date of birth, age, sex and the requester's order number; masking is done in the data, not the layout, and the masked file is archived. OGC-1111 FR-A61 owns the field list. (Release 2, D-244.) |
| D-228 | Partial reports are delivered; each further release is a new version, after a short hold that collapses versions released together. |
| D-229 | Amended versions go automatically to every earlier recipient. |
| D-230 | Alerts and patient messages fire on validated results only. Referral trigger events are unchanged. |
| D-231 | The patient ready notice is the same for every order apart from the patient's first name, which it may include; it names no test and no result. Including the result is a per-order choice whose starting state comes from the test (Ready notice only, Result when the order asks for it, Result by default); changing it needs its own privilege. "Result by default" is the rapid-SMS path for programmes such as COVID-19 testing. (Amended in v0.2: first name allowed.) |
| D-232 | Sent Messages is a main-menu Reports page, not an admin page; Notifications (Channels, Templates, Distribution Lists, Triggers) replaces Test Notifications and Notification Triggers in Admin. |
| D-233 | Order entry never changes a facility's directory addresses. |
| D-234 | **Superseded by D-237.** Was: delivery runs locally or in a central service over the consolidated FHIR server, chosen per lab with one switch; rules are written only in terms FHIR carries. |
| D-235 | Every new feature nominates its privileges with default grants stated by held privilege (standing rule, recorded here first). Supersedes D-006. |
| D-236 | Report versions are created at issue: printed, sent from the print queue, or sent by automatic delivery, whichever comes first for that content. Re-issuing identical content creates no version. Amended means a result that was issued (printed or sent) changed value, flag or unit or was removed, or the version was made by Reissue with correction; completing a partial report is a new version, not Amended. Every print and send is an event in the version's issue history. Amends D-140. |
| D-237 | Central delivery belongs to the Results Portal (a separate application on the central FHIR server); Result Delivery is local only. OpenELIS sends all lab data to the central FHIR store, and the portal keeps its own visibility settings. Supersedes D-234. |
| D-238 | Distribution list upkeep (names, members, deactivation) has its own privilege, `distribution_list:manage`, in the Quality group, granted by default to roles with `notification:manage`. Templates, channels and lab-wide settings stay under `notification:manage`. |
| D-239 | Alert rule authoring, including recipients, stays with `test:configure`, as today. `alert:manage` keeps its PR #3443 meaning (create, acknowledge and resolve alerts). |
| D-240 | A ward's report addresses are added to its facility's, so both receive the ward's reports. Wards use the facility's delivery password and have no SMS number. |
| D-241 | Lab-wide delivery settings live in the Configuration page, Notifications area, stored as `site_information` entries; there is no separate Delivery Settings page. The lab contact is the existing additional site information line. |
| D-242 | The Send dialog is a Modal, by exception to D-005: sending cannot be undone, so the confirmation shows recipients and formats before anything is sent. |
| D-243 | Delivery passwords are the recorded exception to Admin Redesign AS-31: they can be shown and copied (logged) so the lab can give them out, while connection secrets are never sent to the browser. |
| D-244 | Result Delivery ships in two releases. Release 2 holds the masked copy (with OGC-1111 masked mode and the print queue's masked archive) and WhatsApp, sent through TextIt's WhatsApp channel using templates approved by Meta, by template name with merge values; free text from the Templates page is never sent over WhatsApp. Everything else is Release 1. |
| D-245 | In Release 1, patient reports are sent only to recipients with a delivery password (clinicians and typed addresses use the order's facility password); a recipient without one is Skipped "No delivery password". Certificates are unaffected: protected with a password, as issued without one. |
| D-246 | Automatic delivery batches per recipient per hold window: the hold runs per recipient, every report version due to that recipient in the window goes in one email (split at 10 MB of attachments or 20 reports), and report SMS are one per recipient per window. Amended versions start their own hold. |
| D-247 | Failed messages are retried after 1, 5, 15, 30 and 60 minutes, then hourly, for 24 hours after they were queued (`deliveryGiveUpHours`), staying Queued meanwhile; only then are they marked Failed. A channel shows Failing after three failed attempts in a row. |
| D-248 | The delivery password is a deliberately shareable facility secret: usefulness over secrecy. It protects against wrong or old addresses and casual forwarding outside the facility, not against people inside the facility or the lab, and it stays easy to show and copy again (logged). Changing it is for when it has leaked outside the facility. |
| D-249 | TextIt delivery status is polled from TextIt's API, so no public server address is needed, and recorded as Delivered or Failed; other SMS gateways stay at Sent. For email, Sent means the lab's mail server accepted the message; bounces are not tracked in Release 1. |
