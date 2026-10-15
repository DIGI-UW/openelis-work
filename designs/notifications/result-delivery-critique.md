# Result Delivery by Email, SMS and WhatsApp: Critique and Integrated Approach

**Date:** 2026-10-15
**Checked against:** `DIGI-UW/OpenELIS-Global-2` `develop` at 7472c30; gallery `designs/notifications/*`, `designs/reports/lh-delivery-sent-messages.md`; project FRS for Report Print Queue (OGC-1031), Patient Report and Report Management (OGC-1111), Admin Redesign and the 2026-10-12 admin audit.
**Supersedes:** the OGC-439 / OGC-437 rescope draft of the same date (it fixed the tickets but kept their framing, which this critique questions).
**Revision 2 (2026-10-15):** Casey's decisions on §7 recorded; report protection resolved to a proposal (§4); patient report touchpoints added (§5.7); central delivery path added (§5.6).

---

## 1. Bottom line

The current approach is organised around **channels and engines** ("an email ticket", "an SMS ticket", "alert rules", "test notifications", "notification triggers"). Users think in terms of a **job**: get a released result to the person who must act on it, safely, and be able to prove it was sent.

Measured against that job, nothing built or designed covers the main use case end to end:

- **The thing labs send is the report, not a per-test message.** No path can attach a report. No design sends one, except the environmental certificate link in OGC-587.
- **The usual recipient is a facility or a client, not an individual clinician.** No path can address a facility. Environmental and vector clients are not reachable either, although their email is captured at order entry.
- **The trigger is wrong.** One engine fires at result entry, before validation. Another fires per analysis and misses three ways results get finalized.
- **Privacy is not designed.** The shipped default patient message contains the result in plain text.

**Recommendation:** reframe the work as one **Result Delivery** area with three distinct products on one shared foundation:

| | Product | Unit sent | Event | Typical recipient |
|---|---|---|---|---|
| **A** | **Report delivery** (primary) | The released report (PDF), one per order and version | Report version released | Facility, ordering clinician, environmental/vector client |
| **B** | **Priority result alerts** (secondary) | A short message about one result | Result matching a rule is validated | Health officials (distribution lists), facility, clinician, sometimes the patient (an instruction such as self-quarantine) |
| **C** | **Patient "results ready" notice** (tertiary) | A content-free notice: your results are ready, contact your clinician or the lab | Order is final | Patient |

All three share: channels (Email, SMS, WhatsApp), a contact directory with delivery preferences, templates, a persistent outbox, one Sent Messages log, and privacy controls.

---

## 2. What exists today

### 2.1 Built on develop

| Engine | Fires on | Sends | Recipients | Logged | Problems |
|---|---|---|---|---|---|
| **Test Notifications** (`TestNotificationServiceImpl`) | Per analysis at final validation (`ResultValidationServiceImpl.java:96-101`) | Text message per result | Patient, provider; per-order opt-in checkboxes at order entry (`OrderResultReporting.jsx`) | No | Default template puts the result in the message (`TestNotificationServiceImpl.java:80-81`); link is a literal `"someAddress"` with no portal behind it (`:202-205`); likely fails for environmental samples (no patient, `:168-169`) |
| **Test Catalog Alerts** (`TestAlertEvaluationServiceImpl`, OGC-763/949) | Result **entry** (`ResultEntryRestController.java:375`) | Hard-coded English text | Patient, a fixed address, a role (in app) | No | Unvalidated results leave the lab. Ordering provider and referring facility flags exist but are not wired (`:284-285`) |
| **Notification Triggers** (`NotificationTriggerDispatcher`) | Referral and resample events | Templated message | Ordering provider, submitting user, chain-of-custody contact | Yes (`notification_log`, Sent Messages, Resend) | Retries by sleeping on the sending thread (`:174-176`). Not used for results |
| **EQA follow-up** | EQA deadlines | Email | `Organization.email`, else the first contact | No | The **only** code that emails an organisation |
| **FHIR push** | Entry and validation | FHIR resources | Configured subscriber | Data Export Status | Data exchange, not human notification |

**Shared plumbing:**

- `EmailNotificationSender` sends plain text only (`SimpleMailMessage`). There are no attachments anywhere in the codebase.
- SMS goes through BMP or SMPP; WhatsApp goes through a separate sender.
- All sends are in-memory `@Async` threads. As far as the code shows, a server restart loses anything not yet sent.
- The SMTP password is encrypted at rest (jasypt AES-256, `BasicAuthenticationData.java:20-22`). This corrects the admin audit, which could not confirm it. However, the default key is `dev` (`SecurityConfig.java:133-134`), and `GET /rest/ExternalConnection` returns the password decrypted.

### 2.2 Designed but not built

| Design | Status | What it assumes |
|---|---|---|
| OGC-437 / OGC-439 (March) | To be assigned | Per-test rules, new parallel tables, per-result messages, no attachments, no facility |
| **OGC-587 S-06b LH Delivery** | Selected for Development | Emails or WhatsApps environmental/vector clients a **secure download link** to the signed certificate; adds a global **Sent Messages** tab; **hard-depends on OGC-437/439** |
| X-01 Referral-out notification | Built in part | Shares the S-06b log |
| **OGC-1031 Report Print Queue** | Ready | One pipeline for every report type, with versions, Partial/Final/Amended, and an immutable PDF archive with SHA-256. **Explicitly excludes** sending reports electronically (§11) |
| OGC-1111 Patient report redesign | Specced | The report layout that would be emailed |
| Admin audit item #2 | Recommendation | One Notifications area: Channels, Rules, Templates, Sent Messages |

**Net:** six places configure some part of outbound messaging, and three designs depend on tickets whose framing no longer fits.

---

## 3. Critique against the use cases

### 3.1 Primary: the lab sends results to ordering clinicians and facilities

**1. The wrong unit is being sent.**

- Both engines send **one message per result per rule**. A clinician who orders a 12-test chemistry panel gets 12 emails, and nothing tells them when the order is complete.
- What clinicians file, and what the lab is accountable for under ISO 15189, is the **report**.
- The Report Print Queue already models everything delivery needs: one row per order, Partial/Final/Amended state, versions, and an archived PDF with a hash.
- Email should send *that archived version*, so the copy sent is provably the copy on record. A send is then simply another **issue event** in the version history, next to a print.

**2. The wrong recipients are modelled.**

- In national programmes most results go to a **facility** (a clinic, a ward, a district hospital lab focal point), not to a named clinician whose email nobody captured.
- `Organization.email` exists and is written at order entry (`SamplePatientUpdateData.java:713-717`), but no result path reads it. `NotificationRecipientType` has no facility value.
- For environmental and vector work the recipient is the **client**. Their email is captured as the requestor contact (`RequesterService.getRequestorEmail()`), and no notifier uses it. S-06b re-specifies this resolution separately.
- Recipients need to be **a directory with preferences**, not addresses typed into rules.

**3. The wrong trigger.**

- Alerts fire at entry, so unvalidated results leave the lab.
- Test Notifications fires per analysis at validation. It misses results finalized at entry ("clear at entry", `ResultUtil.java:658`), vector pool deconvolution, and pathology.
- The right event for reports is **"a report version was released"**, which the print queue pipeline defines once for every report type.

**4. No way to attach the report.**

- The sender is plain text only.
- There is no service that returns a PDF for one order: patient reports are rendered only inside controllers and need a servlet context. The one exception is the compliance archive.
- OGC-1031 already plans to move rendering into "one print pipeline with a renderer per report type". Email delivery should be a consumer of that pipeline, which makes OGC-1031 a hard dependency.

**5. Amendments are not handled.**

- When a printed result is corrected, everyone who received the earlier version must get the amended one, marked as such.
- Today nothing records who received what, so nothing can be re-sent to them.
- Tying sends to report versions gives this for free: "Amended v3: re-send to the 2 recipients of v1 and v2".

**6. There is no manual send.**

- Labs routinely need "email this report to Dr X now", or "the facility lost it, send it again".
- The obvious place is the Report Print Queue: a Send action on a row and on a batch, next to Print and Download, with the resolved recipients shown and editable.

**7. Volume is not considered.**

- OGC-1031 sizes for 50,000 orders a month.
- Per-report emails to a busy facility make a crowded inbox, and sending partials (decided) multiplies them. A **digest** option is deferred: the first release sends one email per report version. A short **hold** before sending (proposed default 10 minutes, configurable) lets results validated together go out as one version instead of several.
- Sending must use a persistent outbox, so a restart or an SMTP outage delays mail rather than losing it.

### 3.2 Secondary: timely results for diseases of high interest

Examples: Ebola-positive results to health officials, COVID-positive patients told to self-quarantine.

**1. The rule model in Test Catalog Alerts is right; its plumbing is not.**

- Conditions per test (specific value, abnormal, critical) fit the need.
- Missing: firing at validation, facility and distribution-list recipients, templates, logging, and translated text.

**2. Officials should be distribution lists, not typed addresses.**

- "Provincial Health Office: VHF" should be one named list reused by every rule that needs it.
- When the officer changes, the admin updates one place.

**3. There are two audiences with opposite content rules.**

- Officials need identifiers (name, phone, village) to trace contacts, so the channel and recipients must be trusted.
- The patient needs an instruction ("you must self-isolate; call this number"), not a PDF.
- One rule may need both, with different templates.

**4. Alerts fire on validated results only (decided).**

- A result is not a result until it is validated, and a typo sent to a health official is worse than a short delay.
- Today's entry-time firing is a defect to remove, not an option to keep. Speed comes from the lab validating priority tests first, which the alert rule can help with by flagging the result on the validation screen.

**5. "Sent" is not "received".**

- ISO 15189 expects a record of who was told about a critical result, and when.
- The log is that record. For high-consequence rules, an optional **acknowledgement link** ("I have received this") plus an **escalation** (unacknowledged after N minutes, so a lab user is prompted to phone) closes the loop.
- `TestAlertRule.acknowledgmentRequired` already exists but is unused for external recipients.

**6. Email is not surveillance reporting.**

- Case-based reporting to DHIS2 or a national FHIR server is data exchange (OGC-435, FHIR push).
- Alerts are the *human* fast path. The two should coexist, and alerts should not be treated as a substitute.

### 3.3 Tertiary: patients

**1. "Results ready" with no content is the right default.**

- A notice that results are ready, with an instruction to contact the ordering clinician or the lab, avoids almost every disclosure problem: shared phones, HIV or pregnancy results arriving without counselling, minors, and phones read by others.
- It still saves trips and calls.

**2. Today's default does the opposite.**

- The shipped template sends "[testName] testing results have been finalized for Patient: [first name] [last initial]. Result: [result]" to the patient.
- That is a live disclosure risk wherever it is enabled, and it should be fixed independently of this redesign.

**3. Consent and contact exist only per order.**

- Order entry has per-test patient Email/SMS checkboxes (`OrderResultReporting.jsx`). That is a workable consent capture: the notice is sent only when the box was ticked at order.
- There is no stored preference for contact method or language on the patient.

**4. Result content to patients is a second, explicit opt-in (decided).**

- The default is the ready notice with no result. Order entry gets a second choice beside each patient Email/SMS box: "include the result".
- Proposed: tests on a lab-defined **sensitive test list** (HIV, pregnancy and others) cannot take the second opt-in, and results never appear in an email subject or SMS preview line.

**5. No patient portal exists.**

- The `client_results_view` password table is written but never read.
- Any "view your result" link is a separate, later product (S-06b's download link is the closest pattern) and should not be implied by V1 templates.

---

## 4. Privacy: suppressing PHI on emailed reports

Email is not a secure channel: messages are stored on third-party servers, forwarded, and sent to mistyped addresses. Four ways to send a report, each with a trade-off:

| Option | What the recipient gets | Protects against | Costs |
|---|---|---|---|
| **Full report attached** | The archived PDF | Nothing beyond transport TLS | Highest risk if mis-addressed or forwarded |
| **Masked copy attached** | The same version rendered with identifiers suppressed | A mis-addressed or forwarded email exposing identity | Recipient must match the report to their patient without the name (§4.2 keeps initials, age, sex and the requester's order number for this) |
| **Password-protected PDF** | Full report, opened with a password agreed per facility or client and sent once by another channel | Mis-addressing and casual forwarding | Password management; some mail clients and phones handle it poorly |
| **Secure link** (S-06b) | A time-limited download link; nothing sensitive in the email | Everything at rest in mailboxes; the link can be revoked | Needs a publicly reachable server (S-06b Part 2 covers the case without one); patients and clinicians on poor connectivity may fail to download |

### 4.1 The constraint (decided)

Recipients mostly want the full PDF. But OpenELIS must **never send a patient's name or national ID in readable form** by email, SMS or WhatsApp. The recipient often has no lab number, sometimes only what they wrote on the request (age, sex, their own reference).

### 4.2 Two formats, chosen per recipient (decided)

The difficulty with password-protected PDFs is choosing a password from patient data, because almost no patient data is required. **The password should belong to the recipient, not the patient.**

**1. Protected full report** (preferred whenever a password is set)

- The facility or client has one delivery password, set once in the directory and given to them out of band (by phone, on paper at a site visit, or by the program).
- Every report to that recipient is the full archived PDF, encrypted with their password.
- No patient data is needed to derive the password. The facility opens every report the same way. Changing a leaked password is one edit.
- **The password can be shown again in the UI (decided).** Many people at a facility need it, and new staff arrive, so the lab must be able to give it out again without changing it. That means:
  - The password is stored with reversible encryption (like the SMTP password, which is already encrypted at rest), not as a one-way hash.
  - On the facility or client record in Locations & Organizations it shows masked, with a **Show** action and a **Copy** action. Available to users who can edit that record **and** to Report Print Queue users, who are often the ones a facility phones (decided). Queue users see it from the Send dialog and the row's recipient details.
  - Every Show and Copy is logged with the user and time, in the record's history.
  - **Generate** fills in a strong, easy-to-read password (no look-alike characters such as 0/O and 1/l), which matters when it is read out over the phone.
  - Changing it asks for confirmation. Reports already sent stay locked with the old password, so the facility needs both for a while, and the record shows the date of the last change.
- This differs on purpose from connection secrets (SMTP, TextIt token), which are never shown again: a delivery password exists to be shared with the recipient.

**2. Matchable masked copy** (used when the recipient has no password)

- **Removed:** patient name (replaced by initials), national ID, address, phone.
- **Kept, so the recipient can match the report to their patient:** initials, sex, age and date of birth, patient ID, the **requester's order number** (`externalOrderNumber` at order entry, today not printed on the report), requester, facility and ward, collection date, tests, results, flags and interpretation.
- **Marked:** "Masked copy: patient name and national ID removed. Contact {lab} for the full report."

**3. Full report unprotected: not offered.** A user who truly needs to send one can download the PDF and email it themselves, as they can today. OpenELIS does not do it on their behalf.

**Defaults and lists**

- Lab-wide default for recipients with no password: masked copy.
- No allowed-domain list (decided).

### 4.3 Rules that hold in every format

- **Email subjects, email bodies, SMS and WhatsApp text never carry patient name or national ID.** They carry lab number, the requester's order number, facility, and state (Partial, Final, Amended). Each template slot allows only those merge fields; it is not left to the admin.
- **What was sent is archived.** A masked copy is archived with its own hash, linked to the version it was rendered from. A protected report is the archived version encrypted, with the encryption recorded on the send.
- **Free-typed addresses** are allowed on manual send to anyone with access to the queue (decided: they can already download and email the PDF). The address is shown back before sending, and every send is logged with the user.
- **Order entry must stop overwriting the facility's email.** Today, typing a different referring-site email on any order silently replaces the email on the Organization record (`SamplePatientUpdateData.java:711-717`). Once reports go to that address automatically, one typo at reception sends every later report for that facility to a stranger. Directory addresses should change only in Locations & Organizations; an address typed at order entry should apply to that order only, or be queued for an admin to confirm.

---

## 5. Proposed integrated model

```
            ┌──────────────── Shared foundation ────────────────┐
            │ Channels: Email · SMS (BMP, SMPP, TextIt) · WhatsApp│
            │ Contact directory + delivery preferences            │
            │ Templates (per product × recipient × channel)       │
            │ Persistent outbox + retry · Sent Messages log       │
            │ Privacy: masked rendering, sensitive tests, domains │
            └───────────────────────────────────────────────────┘
                 ▲                     ▲                    ▲
   A. Report delivery       B. Priority result alerts   C. Patient "ready" notice
   event: version released  event: rule match on       event: order final
   (Report Print Queue      validation                  (per-order opt-in from
   pipeline, all report                                 order entry)
   types)                   Test Catalog › Alerts       no result content
   auto by recipient pref   distribution lists, ack
   + manual Send in queue
```

### 5.1 Shared foundation

**Channels**

- One page per channel: connection, sender identity, "Send test", masked secrets.
- This is the admin audit's Channels proposal, and absorbs the SMTP and SMS rows of External Connections.

**Contact directory and delivery preferences.** Recipients are:

- facilities and wards (Locations & Organizations, which already holds email and phone);
- providers;
- environmental and vector clients (the requestor contact);
- sampling sites;
- **distribution lists** (new: named groups of addresses and numbers).

Each recipient carries:

- channels;
- report format (protected full report when a delivery password is set, otherwise masked copy; secure link where a public path exists);
- language;
- active.

**Templates**

- One template set per product, recipient type and channel, with the merge-field toolbar and preview the Notification Triggers templates page already has.
- Every template is translated, and the allowed merge fields are restricted per slot (see §4).

**Outbox and log**

- Every message is recorded before it is attempted, sent from a persistent queue with retry and backoff, and visible in **one Sent Messages log**, with filters by product, order, recipient and status, plus Resend.
- This is OGC-587's Sent Messages, widened to everything.
- For report delivery, each send also appears in the order's version history in the print queue.

### 5.2 A. Report delivery (primary)

**Automatic delivery**

- When a report version is released, each recipient on the order whose preferences say "automatic" gets it in their format and timing.
- **Partial versions:** sent (decided). There is no need to wait for the whole order; each release of new results is a new version, after the short hold in §3.1.
- **Amended versions:** always sent to every earlier recipient, marked Amended.
- **No digests** in the first release (decided).

**Manual delivery** from the Report Print Queue:

- **Send** on a row or a batch.
- The dialog shows the resolved recipients (facility, clinician, client) with their default format, lets a permitted user add or remove recipients and change the format (for example masked copy), and confirms.
- The send is recorded as an issue event on that version.

**Coverage and replacements**

- Covers patient reports, environmental and vector certificates, and the "not evaluated against a standard" results report.
- S-06b's secure download link becomes one of the formats, not a separate system.

### 5.3 B. Priority result alerts (secondary)

- Rules stay in Test Catalog › Alerts, with the conditions they have today.
- **Recipients:** distribution lists, the order's facility, the ordering clinician, and the patient (instruction template only).
- **Timing:** on validation only (decided).
- **Content:** a short message with identifiers allowed only to directory recipients marked "trusted for identifiers". There is no attachment by default.
- **Optional acknowledgement** link and escalation for high-consequence rules, in phase 3 (decided).
- **In-app alerts** to lab users stay as they are.

### 5.4 C. Patient "results ready" notice (tertiary)

- **Content:** the lab name, lab number, and "your results are ready; contact your clinician or the lab", with a phone number and opening hours from Configuration.
- **When sent:** when the order is Final and the patient's SMS or Email box was ticked at order entry. Proposed: a notice is sent if any test on the order was ticked.
- **Result content:** only when the second "include the result" box was also ticked (decided). Proposed: never for tests on the sensitive test list.
- **Replaces** the patient half of Test Notifications.

### 5.5 What retires

- **Test Notifications.** Its provider half becomes report delivery and its patient half becomes the ready notice. Existing configuration should be migrated, not dropped.
- **SMTP and SMS rows in External Connections**, which move to Channels.
- **Separate email and SMS ticket framing**, which becomes channel work inside the foundation.

### 5.6 Two delivery paths: local and central (decided: both)

**Most labs will not have a publicly reachable server; some will.** Secure links are the best practice and will be used when available, so the design needs both paths.

**Local delivery (default)**

- OpenELIS evaluates the delivery rules and sends attachments itself.
- Where the lab server has a public address, it can also issue secure links (S-06b Part 1).

**Central delivery**

- A delivery service runs against the central FHIR store or consolidated server. That server holds each lab's DiagnosticReport, with the archived PDF as its `presentedForm`, plus the requester and facility contacts. The service evaluates the same rules, sends from one well-run mail and SMS setup, and serves secure links from a public address.
- A lab that delivers centrally **turns its own report delivery rules off**, and they are turned on in the central service. This is one switch per lab, so a report is never sent twice.

**What this means for the design now**

- **Write rules in terms FHIR carries:** requesting organization and practitioner with their telecom, the patient's contact and consent, the test code, the result value and interpretation, and report status (partial, final, amended).
- **Keep the contact directory exportable,** so the central service can use the same recipients and preferences.
- **Push the PDF the lab archived with the DiagnosticReport,** so central delivery sends the same bytes the lab would have sent. The archive hash travels with it.
- **Recommended starting point:** one codebase for the rules, run in either place, rather than two implementations.

### 5.7 The patient report redesign (OGC-1111) has to take delivery into account

Delivery sends the patient report, so several report requirements change or move earlier:

1. **Masking is a mode of the report, done in the data.** The masked copy must be produced by giving the template initials instead of the name and no national ID, not by hiding fields in the layout. Custom templates from the server folder (V2) then cannot leak them. The masked state needs its own layout for the patient line on the page 1 card (FR-A16) and on the continuation strip (FR-A17), plus the "Masked copy" line.
2. **Print the requester's order number.** `externalOrderNumber` is captured at order entry but is not in FR-A16 or FR-A17. It helps every recipient match the report, and it is essential on a masked copy.
3. **Version and issue time on every version, in V1.** With partials emailed, a clinician may hold v1 (partial), v2 (partial) and v3 (final). FR-A15 shows "Version n" only on corrected reports and in V2. Proposed: "Version n · Issued {date time}" in the footer of every report from V1, so the reader always knows which copy is newest.
4. **Partial reports must read as partial on every page.** The partial title (FR-A11) is on page 1 only. Proposed: also on the continuation header, because an emailed report is often read on a phone, one page at a time.
5. **Archived bytes are the record.** The print queue already archives what was printed (OGC-1031). Emailed, masked and protected copies are recorded against the same version, so the issue history shows prints and sends together.
6. **Lab contact line.** Masked copies and patient notices tell the reader to contact the lab. The header's additional information line (`additionalSiteInfo`) should hold a phone number or email, and Report Management should say so.
7. **Environmental and vector certificates** follow the same pipeline. They have no patient identity, so masking does not apply, but protection and version-on-every-copy do.

---

## 6. What happens to the tickets

| Ticket | Proposed fate |
|---|---|
| **New epic: Result Delivery** | Parent for everything below; links the admin audit item #2 |
| OGC-439, OGC-437 | Rewritten as **foundation** stories: Channels (Email incl. attachments and security mode; SMS with TextIt; WhatsApp), persistent outbox, unified Sent Messages, contact directory and preferences. The per-test rule content moves to the alerts story |
| OGC-587 S-06b | Folded into **Report delivery**. Its environmental/vector client resolution, download link and Sent Messages tab become parts of the foundation and of A. Keep its source requirement (Bogor: email or WhatsApp link, flag failed delivery) as acceptance criteria |
| OGC-1031 Report Print Queue | Unchanged in scope, but its print pipeline is the dependency for A. Add a follow-up story "Send from the queue" |
| OGC-763 Test Catalog Alerts | Gains a story for B (validation timing, facility, distribution lists, templates, log, acknowledgement) |
| X-01 Referral-out | Stays on Notification Triggers; shares the outbox and log |
| New: Patient results-ready notice | C |
| New, small, do now | Change the shipped Test Notifications default template so it no longer includes the result; stop Test Catalog alert emails and SMS from firing before validation; stop `GET /rest/ExternalConnection` returning the password |

### Proposed phasing

1. **Foundation and manual Send.** Channels, outbox, log, contacts and delivery passwords on facilities and clients, masked and protected rendering, and **Send** in the print queue. A person checks every send, which keeps wrong-recipient risk low while the directory fills up. It needs OGC-1031's pipeline and the OGC-1111 report changes in §5.7.
2. **Automatic report delivery.** Recipient preferences, partials with the hold, amended re-send. Environmental/vector client delivery (S-06b) lands here. Reports only, no digests.
3. **Alerts and patient notices.** Distribution lists, validation-only firing, acknowledgement and escalation; the ready notice with the second opt-in for results; Test Notifications retires.
4. **Links and central delivery.** Secure links from labs with a public address, and the central delivery service on the consolidated FHIR server (§5.6), with the per-lab switch.

---

## 7. Decisions

### 7.1 Decided (2026-10-15)

| # | Question | Decision |
|---|---|---|
| 1 | Report format | Recipients mostly want the full PDF; patient name and national ID are never sent in readable form. A delivery password per facility or client protects full reports, and staff can show it again in the UI to give it out without changing it (§4.2). A matchable masked copy is used when no password is set |
| 2 | Partial reports | Send them; no need to wait for the whole order |
| 3 | Digests | Not in the first release; reports only |
| 4 | Alert timing | Validated results only |
| 5 | Patient content | Ready notice with no result is the default; including the result is a second opt-in at order entry |
| 6 | Who may send and type an address | Anyone with access to the queue |
| 7 | Allowed-domain list | No |
| 8 | Links | Usually no public server, sometimes yes: support both a local path and a central delivery service on the consolidated FHIR server, with a per-lab switch (§5.6) |
| 9 | Acknowledgement and escalation | Phase 3 |
| 10 | Who can show the delivery password | Users who can edit the facility or client record, and Report Print Queue users |
| 11 | Access | Every new feature nominates its privileges and default role grants for the future role builder (§8) |

### 7.2 Still open

1. **Masked copy contents:** should patient ID stay on it? It is often the facility's own file number, which helps matching.
2. **Sensitive test list:** may tests on it ever take the "include the result" opt-in for patients, or the patient ready notice at all?
3. **Hold before sending partials:** is 10 minutes the right default?
4. **OGC-1111 changes in §5.7:** accept version and issue time on every report in V1, the requester's order number on the card and strip, and the partial marker on continuation pages?

---

## 8. Access: nominated privileges

Every feature here nominates its privileges now, so the role builder (Users and Roles FRS, PR #3443) can offer them. Codes follow the #3443 `category:action` pattern. Groups are the display groups in Users and Roles Appendix A. Existing codes are reused where they already mean the right thing. New codes are marked **NEW**.

**Default grants say which privilege a role must already have**, not which shipped role names get the new one, because labs rename and copy roles. On upgrade, a role receives the new privilege if it already holds the privilege named. Nothing here is placed in the Administration group unless it is truly administrative, because UR-F5 treats any privilege in that group as administrator power.

### 8.1 Foundation

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| View channels (Email, SMS, WhatsApp) and their status | `notification:view` (existing) | Administration | As today |
| Set up a channel: connection, sender, security mode, Send test; edit templates, lab-wide delivery defaults (default format, hold time), distribution lists | `notification:manage` (existing) | Administration | As today (Global Administrator) |
| Turn central delivery on or off for this lab (§5.6) | `system:configure` (existing) | Administration | As today |
| View Sent Messages (all products, with rendered content) | **NEW** `delivery:view` | Reports | Roles with `report:run` |
| Resend a message from Sent Messages | **NEW** `delivery:resend` | Reports | Roles with `report:run` |

### 8.2 Recipients and delivery passwords

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| Edit a facility's delivery contacts and preferences; set, generate or change its delivery password | `organization:manage` (existing) | Test catalog and reference data | As today |
| The same for a provider | `provider:manage` (existing) | Test catalog and reference data | As today |
| The same for an environmental or vector client | `sample_requester:manage` (existing) | Orders, samples and patients | As today |
| Show or copy a delivery password (logged every time) | **NEW** `delivery_password:view` | Reports | Roles with `organization:manage`, `sample_requester:manage` or `report:run` |

### 8.3 A. Report delivery

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| Send a report from the Report Print Queue, a row or a batch, including to a typed address | **NEW** `report:send` | Reports | Roles with `report:run` (decided: anyone with access to the queue). Kept separate so a lab can later allow printing but not sending |
| Change the format on a manual send (protected full report or masked copy) | Part of `report:send` | Reports | |

### 8.4 B. Priority result alerts

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| Create and edit alert rules on a test, including their recipients and templates | `alert:manage` (existing) | Quality | Roles with `test:configure` that do not already have it |
| Pick a distribution list on a rule | Part of `alert:manage`; editing the lists is `notification:manage` | | |
| See alert escalations ("not acknowledged after N minutes", phase 3) | `alert:view` (existing) | Quality | Roles with `result:validate` |

### 8.5 C. Patient results-ready notice

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| Tick the patient Email or SMS ready notice at order entry | `order:create`, `order:edit` (existing) | Orders, samples and patients | As today |
| Tick "include the result" (the second opt-in) | **NEW** `order:notify_result` | Orders, samples and patients | Roles with `order:create`. Kept separate because it is a disclosure decision a lab may want to restrict to clinicians or counsellors |
| Maintain the sensitive test list | `test:configure` (existing) | Test catalog and reference data | As today |

### 8.6 Notes for the role builder

- **Five new codes:** `delivery:view`, `delivery:resend`, `delivery_password:view`, `report:send` and `order:notify_result`. Each needs a translated label (N-UR-6) and a home in Appendix A. A new `delivery` category maps to **Reports**.
- **Every grant above is checked on the server**, not only by hiding buttons.
- **Until #3443 merges,** the same checks map to today's roles: Reports module access stands in for `report:run`, and Global Administrator for `notification:manage`.
