# Analyzer Setup From a Real Result: Functional Requirements Specification

| Field | Value |
|-------|-------|
| **Status** | Draft v0.1 for review |
| **Module** | Analyzers (Analyzers list inline setup, Analyzer Types, Field Mappings, Undelivered results) |
| **Author** | Casey Iiams-Hauser (QA findings from testing.openelis-global.org, 27 to 28 Oct 2026) |
| **Date** | 2026-10-28 |
| **Extends** | `analyzer-profile-mapping.md` (Analyzer Types & Mapping, 17 Jun 2026), Epic OGC-1054, built as OGC-1055 to OGC-1058 |
| **Front end** | Carbon React |
| **Companion artifacts** | `analyzer-setup-from-traffic-preview.html` (clickable preview), `analyzer-setup-from-traffic-mockup.jsx` (handoff mockup), QA session notes `qa-session-2026-10-27-analyzers-testing.md` |
| **Jira** | One Story under OGC-1054, assigned to Piotr |

> This FRS is version-agnostic. It does not replace the June FRS; it changes the order of the setup flow, closes the gaps between that FRS and what shipped in OGC-1055 to 1058, and lists the defects QA found. Where it changes a June requirement it says so by ID.
>
> **No matching engine.** Nothing here guesses. Every match is on an exact key OpenELIS already holds (LOINC, test code, value text, sender string), and everything else is shown as evidence for a person to decide. Fuzzy matching (for example "NA with mmol/L is probably Sodium") is a Catalyst feature for later and is out of scope.

---

## Lab Context

### Current State

A lab connects an instrument (a chemistry analyzer such as the Sysmex BX-3010, a blood culture system such as the BD EpiCenter, a GeneXpert) so results travel over the network instead of being typed in from a printout. Today the administrator, usually a senior lab technician or the lab's IT person, does it in OpenELIS in this order: pick or build an **Analyzer Type** (the reusable description of a kind of instrument: its test codes, result values and control rules), confirm how each instrument code matches a test in the lab's catalog, and only then type the network details in and turn the analyzer on. The instrument itself is the last thing involved.

### Pain

In QA on 27 and 28 October, building one new Analyzer Type took about 20 minutes of trial and error with access to the source code, and a lab administrator could not have finished it. The form asks for things nobody at the bench knows: setting keys, record layout, "evidence confidence", raw values such as `E1381_95` and `MEDIUM_HIGH`. Every missing item is reported as the same sentence, "Save the profile settings before publishing". Copying an existing type silently carried another vendor's hidden record layout, so every chemistry result was read as text and held. The test picker lists the whole 210-test catalog, so "NA" finds Synaptophysin and DNA PCR before Sodium, and Glucose and Glycémie look identical. Worst of all, the instrument cannot help: results sent while the analyzer is still being set up are rejected as coming from an unknown sender, and Connect stays locked until every mapping question is answered, so the administrator has to answer questions about codes before seeing a single real one.

### What Changes

The administrator connects first. They pick the instrument (or say it isn't listed, giving just a name, maker and protocol), and OpenELIS shows exactly what to type into the instrument: the server address, the port for that protocol, and the sender name. They run one sample or a control on the instrument and send it. OpenELIS holds that message as a setup capture, not as a patient result, and shows it back in plain terms: "GLU, 132 mg/dL, read as a number; NA, 141 mmol/L, not in this type yet". Each line is ticked against the type. For a code that isn't mapped, the test picker shows the received value, unit and sample type beside the search, searches only the analyzer's own lab units first, and for a shared LOINC lists only the few tests that carry it. Mistakes are caught as they are typed, in plain words. When a result later arrives with a new code, the fix starts from the result itself and can be saved to the Analyzer Type so the next analyzer of that kind never asks again.

---

## Overview

This feature reorders analyzer setup around a real message from the instrument: **Instrument → Connect → Send a test result → Verify**. It delivers the June FRS's push-a-result and live reconciliation requirements (FR-B7, FR-B8, AC-21, AC-23), which did not ship, and makes the "not listed" path the three-field form that FR-B3 always described. It replaces guesswork with evidence: a parsed-message preview shows how each field was read; the test picker shows what arrived and narrows by facts the catalog already holds. It adds plain-language, inline validation to type authoring, one-click fixes from the places where problems show up (Undelivered results, held results, Alerts), and catalog readiness lookups. It also carries the defects QA found in the shipped analyzer setup and import screens, so one ticket covers improvements, spec gaps and bugs.

### Navigation & URL

No new pages. Every change lands on an existing analyzer route (D-069 Analyzers group: Analyzers, Analyzer Types, Import Issues):

| Surface | SideNav | Breadcrumb | Route |
|---|---|---|---|
| Add or continue setup (inline in the list, June FR-B1) | Analyzers → Analyzers | Home / Analyzers | `/analyzers` (setup expands inline on the row; a saved setup reopens from the row's "Continue setup") |
| Analyzer Types, "Instrument not listed", "Start from a similar instrument" | Analyzers → Analyzer Types | Home / Analyzers / Analyzer Types | `/analyzers/types`, `/analyzers/types/{typeId}` |
| Field mappings and held codes | (from the analyzer row) | Home / Analyzers / Field Mappings / {analyzer} | `/analyzers/{id}/mappings` |
| Undelivered results and delivery issues | Analyzers → Import Issues | Home / Analyzers / Import Issues | `/analyzers/errors` (verify the live label and route before build; QA saw the page titled "Undelivered results") |
| Unknown-code alert | Alerts | Home / Alerts | `/Alerts` |

---

## User Stories

- As a **lab administrator**, I want to connect the analyzer first and send one real result, so that I set it up against what the instrument actually sends instead of guessing.
- As a **lab administrator** whose instrument isn't listed, I want to give only its name, maker and protocol, so that I am never asked for setting keys, record layouts or regular expressions.
- As a **lab administrator** mapping a code, I want to see the value, unit and sample type that arrived next to a short list of the right tests, so that I don't pick Glycémie when I meant Glucose.
- As a **lab administrator**, I want a new code that turns up after go-live to be fixed once for the Analyzer Type, so that the next analyzer of that kind maps it automatically.
- As a **lab technician** reviewing imported results, I want results that are numbers to stay exactly as the instrument sent them and corrected resends to be acceptable, so that what I accept is what the analyzer measured.

---

## Functional Requirements

Each requirement is tagged with the QA finding it closes (P, R, B, X, L, H, D: see the defect register at the end) or the June FRS item it delivers.

### A. Connect first, then send a test result (delivers June FR-B7, FR-B8; closes L1, L2, R4, R10, B9, H3)

**FR-A1 Setup order.** Inline setup is four stacked sections that reveal in order: **Instrument → Connect → Send a test result → Verify**. Completed sections collapse to a one-line summary with Edit (June FR-B1). This replaces the shipped order Instrument → Assays → Verify → Connect.

**FR-A2 Connect is never locked by mapping.** Connect is available as soon as the instrument and lab units are chosen. Unresolved or ambiguous test matches never disable Connect or Save (closes L2: today the page says "You can confirm and connect" while Connect is disabled).

**FR-A3 Show exactly what to type into the instrument.** Connect shows, as copyable values: the server address, the **host-published** port for the type's protocol and framing, and the sender name the analyzer must send. The port shown is the one reachable from outside the server (from the deployment's published port settings), never the Bridge's internal listener port (closes R4: setup showed internal 12011 while only 12000 was published). If the protocol's port is not published on this server, Connect says so in plain words and names who fixes it ("Ask your server administrator to open port 2575 for HL7"), instead of letting the instrument time out (H3).

**FR-A4 One connection status, not two.** "Test connection" and the readiness panel use one rule and one message. The panel never says "ready to activate" while a required connection value is empty or the connection test reports incomplete settings (closes B9, R10). Host and Instrument system name have help text that names this instrument, not other senders.

**FR-A5 Waiting for a test result.** After Connect, the "Send a test result" section shows a waiting state ("Run a control or one patient sample on the analyzer and send it. We'll show what arrives here.") and refreshes on its own. It shows the last time anything was received from this sender. A **Skip for now** link moves to Verify without a capture (a profile-matched analyzer can still be verified the June way).

**FR-A6 Setup capture, not results.** While an analyzer is in setup, messages from its sender are accepted by the Bridge as a **setup capture**: acknowledged to the instrument, shown in Verify, and **not** delivered as patient or QC results. They are never shown as `UNREGISTERED_SOURCE` on Undelivered results (closes L1). A capture is kept until setup finishes or the administrator discards it. When the analyzer is activated, captured messages are not replayed as results unless the administrator chooses "Also import these results" (default off).

**FR-A7 Several messages.** Each new message adds to the capture list (newest first, timestamp, accession, record count). The administrator can capture more than one (for example a control and a patient) before verifying.

### B. Verify against what arrived (delivers June FR-B8, AC-21, AC-23; closes B1, B5, L4)

**FR-B1 Reconcile each received item.** Verify lists every test code and value in the capture against the type, with one status per row:
- **Seen and mapped:** code is in the type and mapped to a catalog test; the row shows "verified against a real result".
- **Seen, new value:** code mapped, value not in the result map (qualitative tests); the row offers the test's own result options.
- **Seen, not in this type:** code not in the type; the row offers the test picker (section E).
- **Not seen yet:** in the type but not in this message; neutral, not an error.
Nothing in the capture is dropped.

**FR-B2 Parsed-message preview.** Each captured message has a **How we read it** view: one line per result, in plain terms, showing which field gave the code, the value, the unit, the flag and the specimen ID, and whether the value was read **as a number** or **as text**. Example: "CREA: value 1.17, read as a number, unit mg/dL, flag none". A numeric test whose value was read as text is marked with a warning ("This test expects a number; we read text '1.17'. The record layout may be wrong.") so a layout carried over from another instrument is caught in seconds (closes B1). The raw message is available behind "Show raw message" for IT.

**FR-B3 Nothing silently disappears.** A result record that cannot be read (for example flag `>` with no number) appears in the preview as "could not read a value" with the raw record, and is held with a reason when it arrives after go-live, never dropped (closes B5 drop path).

**FR-B4 Build a new type from the capture.** On the "Instrument not listed" path the type starts empty; Verify fills its test rows from the capture (code, unit, value type) and the administrator maps each (June AC-23).

**FR-B5 Confirm is per row or all, and is the sign-off.** Confirm records the human sign-off (June FR-B4, audit `ANALYZER_MAPPING_VERIFIED`, now including which rows were verified against a real result).

### C. "Instrument not listed" is three fields (delivers June FR-B3, FR-A5, AC-4, AC-19; closes P1, P3, P4, P5, P9, R19 part, B4)

**FR-C1 Three fields.** The not-listed form asks only: **Name**, **Manufacturer and model**, **Protocol** (ASTM, HL7, flat file). Protocol is asked first among the technical choices because it is fixed after the first save (closes P9).

**FR-C2 Protocol starter.** Choosing a protocol applies a shipped **protocol starter**: the standard connection fields with their help text, the default framing, the default record layout and standard control rules (ASTM action code `Q` in order field 12; prefixes QC- and CTRL-). Labs never author connection fields, setting keys, translation keys or visibility rules (closes P3, R10).

**FR-C3 Fill only exact facts from the capture.** When a capture exists, the listener that received it sets the framing, and the message header sets the sender name and the manufacturer/model text if present. Nothing else is inferred.

**FR-C4 Advanced, for IT.** Everything else (framing override, record layout parts, identifier pattern, decimal separator, character set) sits in a collapsed **Advanced, for IT** area with plain labels and the starter's values shown (June AC-19). Required items inside it are marked required.

**FR-C5 Plain words and safe defaults.** Each remaining choice is a plain-language option that says what it changes, with the safe default selected. No raw enum values appear (VALIDATED, MEDIUM_HIGH, HEMATOLOGY, LIS01_A, E1381_95, ANALYZER_INITIATED, TWO_WAY, PER_MESSAGE, BY_SPECIMEN) (closes P5). Example: "How the analyzer frames messages: LIS01-A, used by most analyzers (port 12000 on this server). Choose E1381 only if the analyzer's manual says so (port 12011)."

**FR-C6 Remove Evidence confidence.** "Evidence confidence" and any other authoring-trust field are removed from the lab-facing form (June FR-A5).

**FR-C7 Two-way only when it works.** Until the Bridge answers host queries (dependency DEP-3), "Two-way" and "Sends orders to the analyzer" are not offered; data flow shows "Results only". Once host query exists, two-way follows June FR-F2 (offered when the type supports it, verified by a probe, degrades to one-way) (closes B4; supersedes R19).

**FR-C7a LOINC is optional for a type test.** A type test without a LOINC can be saved and published; it simply cannot auto-match (June FR-C1). The form must not mark LOINC optional while publish requires it (closes P1).

### D. "Start from a similar instrument" replaces Duplicate (closes B1, B6, P3)

**FR-D1 Show what is inherited.** Starting from an existing type lists what will be copied, in plain words, each with **Keep** or **Clear**: connection fields and help; record layout (with a one-line description, for example "Reads the result call from the first part of the value and the number from the second part, as GeneXpert does"); control rules; tests and result values. Record layout defaults to **Clear** (use the protocol starter) unless the source has the same manufacturer.

**FR-D2 Clearing removes everything it owns.** Clearing or deleting tests and result values also removes their hidden translations and value codes, so publish never fails on values the user can't see (closes B6).

**FR-D3 Lineage.** The new type records "Started from {type} revision {n}" (June FR-H3 lineage).

### E. Picking the right test, by evidence (closes L3, L4, R8, R9, B7, B8)

**FR-E1 Evidence beside the picker.** When mapping a code that arrived in a message, the picker panel shows what arrived: code, value(s), unit, reference range, flag and sample type, and how many times it was seen.

**FR-E2 Scoped search by default.** The picker (Carbon `ComboBox`, June FR-D2) searches **active** tests in the **analyzer's lab units** by default, with a "Search all tests" toggle. It matches at word starts on name, code and LOINC, and lists exact code matches first, then word-start matches, alphabetically. No scoring.

**FR-E3 Each candidate shows its facts.** Every option shows name, code, LOINC, sample type, lab unit, unit of measure and active state, so Glucose (Serum) and Glycémie (Plasma) can be told apart (closes L3).

**FR-E4 Shared LOINC lists only its tests.** When a type LOINC matches several catalog tests, the row says "{n} tests in your catalog carry LOINC {code}" and the picker opens on just those tests, with their facts (closes L3). It never opens the whole catalog alphabetically.

**FR-E5 Honest "not found".** "No test in this lab's catalog" is said only when no active test matches by LOINC **or** by exact name/code. When tests exist without the LOINC, the row says "No test carries LOINC {code}; search by name" and opens the scoped picker (closes R8, B7).

**FR-E6 Unit mismatch is shown, not blocked.** If the received or type unit differs from the catalog test's unit, or the catalog test has none, the row shows "Analyzer sends mg/dL; this test has no unit" as a warning. Mapping still saves (closes B8).

**FR-E7 Exact value matches pre-fill.** For qualitative tests, a received or type value whose text equals a result option of the catalog test (ignoring case and surrounding spaces) is pre-filled for confirmation. Options are listed in the test's own order, not alphabetically. The administrator can also add expected values the analyzer hasn't sent yet (closes R9, R11 part).

### F. Check while typing (closes P1, P2, P4, P6, X1, X3, X4, X5, X6, X7, X8, X10)

**FR-F1 Inline, plain-language validation.** Every authoring error is shown next to its field as it is entered, in plain words, and the publish summary lists each remaining problem as a link to its field. No raw schema text (for example `$.connectionFields: must have at least 1 items`) and no catch-all "Save the profile settings before publishing" (closes P1, P4).

**FR-F2 Rules checked inline:**
- Required fields are marked (asterisk and "required" text), including ones required only for a protocol.
- Analyzer test codes must be unique within a type; the duplicate row is flagged at entry (closes X3).
- Test codes cannot contain the protocol's delimiters (ASTM `|`, `^`, `&`, `\`; HL7 `|`, `^`, `~`, `\`, `&`) (closes X1).
- LOINC must have the `nnnnn-n` format and a valid check digit (closes X4 for the type form).
- Name length is limited (proposed 120 characters) with a counter; long names wrap in tables (closes X8).
- An empty control rule value shows "Enter the prefix" rather than just disabling Save (closes X6).

**FR-F3 Publish works after reopening.** Reopening a saved draft with no changes allows Publish without a throwaway edit (closes P2).

**FR-F4 Leaving with unsaved changes.** Escape, closing, navigating away and reloading with unsaved changes ask "Leave without saving?" (closes P6, X5). Stale banners such as "Profile draft created" clear after the next action (P8).

**FR-F5 One draft per type, findable.** "Update shared" reopens the existing open draft for that type instead of creating another, and says so ("You have a draft from {date}; continue it or discard it"). Analyzer Types shows draft state on the type's row. A draft that can no longer be published (a newer revision exists) says why and offers to start a new draft from the newer revision, carrying the edits where they still apply (closes X2, X10).

**FR-F6 Conflict offers Reload.** The "The draft changed since it was opened" message has a **Reload saved draft** button and keeps the user's unsent changes visible for copying (closes X7).

**FR-F7 Control recognition is the same everywhere.** Create, Start from similar and Edit all offer the same control rule conditions: specimen ID starts with, order field 12 equals, order field 12 contains (closes X6, P7, R3 authoring gap).

### G. Fix where the problem shows (delivers June FR-G2, FR-G3, AC-15; closes L5, L6, L7, R11, B10, H1)

**FR-G1 Set up from an unknown sender.** On Undelivered results, a row rejected for an unknown sender offers **Set up an analyzer from this result**, which opens inline setup with the capture attached and the sender filled in. If the sender belongs to an analyzer still in setup, the row says "This analyzer is still in setup" and links to it (closes L7 wording, L1).

**FR-G2 Map this code from a held row.** A result held for an unknown code or value has **Map this code**, which opens the analyzer's mapping at that code with the evidence (FR-E1) shown.

**FR-G3 One step to apply.** Saving a mapping from a held code applies it and retries the held results in one action, with a review of what will change; Confirm is not a separate, distant step. The top Apply button explains when it is disabled (closes R11).

**FR-G4 Learn once for the type.** When a learned code or value is resolved, the save offers **Also add to the analyzer type {name}** (default on when the type is site-created; when shipped or shared, follow June FR-H save scope and say how many analyzers it affects). The next analyzer of that type maps it automatically (June FR-G3; closes L6).

**FR-G5 Alerts entry.** An unknown code or value from an **active** analyzer posts an entry to Alerts with the analyzer, code, first and last seen and held count, linking to Map this code (June FR-G2, AC-15; closes L5). The Analyzers list Needs attention count includes undelivered results for that analyzer (closes R14, D3).

**FR-G6 Confirm removal; refresh the list.** "Remove from review" asks for confirmation with the count and reason, and the list refreshes after removal (closes B10). Retry on Undelivered results confirms the outcome ("Delivered to {analyzer}" or the new reason) (closes L7).

**FR-G7 Unregistered HL7 sender is not an internal error.** The Bridge answers an HL7 message from an unregistered sender with an application reject whose text says the sender isn't set up in OpenELIS, not "207 Application internal error" (closes H1).

### H. Catalog readiness from lookups (closes B7, X4, X9)

**FR-H1 Readiness summary.** Analyzer Types and the setup Verify step show, for the analyzer's lab units: how many active tests have a LOINC, and which type tests have no catalog test with that LOINC. This is a count and a list, not a match.

**FR-H2 Shared LOINC list.** A lookup lists LOINCs carried by more than one active test ("Glucose (Serum) and Glycémie (Plasma) share 2345-7; choose which one analyzers use"), with links to the tests in Test Catalog.

**FR-H3 Catalog guards.** The Test Catalog terminology editor rejects a malformed LOINC or bad check digit with a message, refuses a second SAME_AS LOINC on one test, and returns a message (not an empty 422) for an empty code. Unit of measure creation refuses case-only duplicates of an existing unit (`mg/dl` vs `mg/dL`) (closes X4, X9).

### I. Defects in result import found during the same pass

These are in the shipped import path. They block the "send a test result" flow from producing trustworthy results, so they ship with this ticket.

**FR-I1 No silent rounding.** A numeric result is stored and shown as received, up to the catalog test's significant digits only when the received value has no more precision than that; otherwise it is stored as received and flagged "more decimals than this test reports" for the tech to accept. The pre-filled result box shows the received value (closes B2: Creatinine 1.17 saved as 1).

**FR-I2 Corrected resend can be accepted.** A resend for the same accession and test after a held result replaces the held row (or offers Keep or Replace, per Import v2), and is never staged read-only with no message (closes B3).

**FR-I3 Off-scale results.** Values such as `>1000` or a `>` flag with no number are kept as a result with the instrument's off-scale flag for the tech to handle, never dropped or held as an unknown text value (closes B5).

**FR-I4 Mixed sample types.** Accepting a new-sample accession whose tests use different sample types asks the tech to choose a sample type per test group (or splits into one sample per type) and never fails silently (closes R1).

**FR-I5 Instrument demographics shown.** When results create a sample with no matching order, the patient ID, name, date of birth and sex sent by the instrument are shown on the row and offered for patient matching; the row warns when results will go to the placeholder UNKNOWN patient (closes R2).

**FR-I6 QC by action code Q.** The default and starter control rules recognise ASTM action code `Q` (order field 12) as a control for every ASTM type, so a control is never offered as a patient sample (closes R3).

**FR-I7 QC lot missing is visible.** When a recognised control has no active control lot, the review page says "No active control lot for {test}; create one in QC Lot Management" with a link, not only a server log line (closes B11).

**FR-I8 Review page clarity.** Test name shows the OpenELIS test with the instrument code beneath (R5); held rows show their accession and sort with their sample (R6); "View bundle" is formatted, not one escaped line (R7); the value and "Instrument reported" label are separated (B12); empty states show one message and a sensible page size (D4).

---

## Information & Data

All data below exists today unless listed in Dependencies.

| Information | Where it lives today | Used for |
|---|---|---|
| Analyzer Type (profile) with tests, result values, control rules, connection fields, record layout parts | Bridge profile store (`site.*` types, revisions, drafts) | Starter, Start from similar, inline validation, learn once for the type |
| Analyzer: name, lab units (`test_unit_ids`), type and revision, sender, status (SETUP, ACTIVE) | OpenELIS analyzer + Bridge connection | Scoped search, setup capture, Connect |
| Analyzer test map and value map | `analyzer_test_map`, analyzer result map | Reconcile, Map this code |
| Held results (`unknown_analyzer_test`, `test_mapping_not_ready`) and Undelivered results (`UNREGISTERED_SOURCE`) | Bridge outbox and OpenELIS staging | Map this code, Set up from this result |
| Test catalog: name, code, LOINC (terminology SAME_AS), sample type, lab unit, unit of measure, result options and order, significant digits, active state | Test catalog | Evidence-based picker, shared-LOINC list, readiness |
| Published ports per protocol | Deployment settings (compose `.env`: `BRIDGE_ASTM_PORT`, `BRIDGE_ASTM_E1381_PORT`, `BRIDGE_HL7_MLLP_PORT`) | Connect shows the outside port |
| Alerts | Alerts page | Unknown-code entry |

**States.** Analyzer: SETUP → ACTIVE → INACTIVE (Deactivate/Reactivate, no delete). Setup capture: received → shown → discarded or kept with setup history. Type draft: open → published, or open → stale (newer revision exists) → restarted.

**Uniqueness.** Analyzer test code unique within a type revision. One open draft per type per user.

---

## Access

**Who can use it, in user terms.** Setting up analyzers, editing Analyzer Types, mapping codes and handling undelivered results are administrator actions, as today (June FRS: Admin role). Lab technicians with Results rights for the analyzer's lab units review imported results as today (D-043, D-044). The `Analyser Import` role is the Bridge's sign-in identity and gains nothing here (D-044). A user without the administrator capability does not see Add Analyzer, Continue setup, Map this code, Set up from this result or Also add to the analyzer type; the Alerts entry is visible to them but its Map action is hidden.

**Nominated privileges.** Codes follow the PR #3443 catalogue format; reuse the analyzer codes there if they exist under these meanings, otherwise these are NEW. Until #3443 merges, today's Admin check stands in for each.

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| Set up an analyzer, connect it, capture and verify a test result, activate | `analyzer:configure` | Administration | Roles that hold today's analyzer admin capability (as today) |
| Create, start from similar, edit and publish Analyzer Types (including Also add to the type) | `analyzer_type:manage` | Administration | Roles that already hold `analyzer:configure` |
| Map a held code or value, apply and retry held results | `analyzer:map` | Results | Roles that already hold `analyzer:configure` |
| Set up from, retry or dismiss an undelivered result | `analyzer:configure` | Administration | As above |
| Review, accept and reject imported results | existing per-lab-unit Results rights (`result:enter`) | Results | As today |

NEW (if absent from #3443): `analyzer:configure`, `analyzer_type:manage`, `analyzer:map`. `analyzer:map` is split out because a lab may let a senior bench tech map a new cartridge code without giving full analyzer administration.

**Audit.** Reuse the June events; add `ANALYZER_SETUP_CAPTURE_RECEIVED` and `ANALYZER_SETUP_CAPTURE_DISCARDED`, and record `verifiedAgainstCapture` on `ANALYZER_MAPPING_VERIFIED`.

---

## Localization

All strings use i18n keys. Search before minting (`npm run i18n:find`); generic words reuse `common.*` (Save, Cancel, Edit, Reload, Required). Proposed NEW keys are namespaced under the existing `label.analyzer.*` families from the June FRS:

| Key | English fallback | Context |
|---|---|---|
| `label.analyzer.setup.sendTest` | Send a test result | Setup section 3 title |
| `label.analyzer.setup.waiting` | Run a control or one patient sample on the analyzer and send it. We'll show what arrives here. | Waiting state |
| `label.analyzer.setup.lastReceived` | Last received from this sender: {time} | Waiting state |
| `label.analyzer.setup.skip` | Skip for now | Waiting state |
| `label.analyzer.setup.alsoImport` | Also import these results | Activate option |
| `label.analyzer.connect.typeIntoAnalyzer` | Type these into the analyzer | Connect panel heading |
| `label.analyzer.connect.serverAddress` | Server address | Connect |
| `label.analyzer.connect.port` | Port for {protocol} | Connect |
| `label.analyzer.connect.portClosed` | Port {port} isn't open on this server. Ask your server administrator to open it. | Connect warning |
| `label.analyzer.connect.resultsOnly` | Results only | Data flow, while host query is absent |
| `label.analyzer.verify.seenMapped` | Verified against a real result | Reconcile status |
| `label.analyzer.verify.seenNewValue` | New value | Reconcile status |
| `label.analyzer.verify.notInType` | Not in this type yet | Reconcile status |
| `label.analyzer.verify.notSeen` | Not seen yet | Reconcile status |
| `label.analyzer.preview.title` | How we read it | Parsed preview |
| `label.analyzer.preview.asNumber` | read as a number | Parsed preview |
| `label.analyzer.preview.asText` | read as text | Parsed preview |
| `label.analyzer.preview.expectsNumber` | This test expects a number; we read text "{value}". The record layout may be wrong. | Parsed preview warning |
| `label.analyzer.preview.unreadable` | Could not read a value | Parsed preview |
| `label.analyzer.preview.raw` | Show raw message | Parsed preview |
| `label.analyzer.type.notListed` | My instrument isn't listed | Instrument step |
| `label.analyzer.type.advanced` | Advanced, for IT | Collapsed area |
| `label.analyzer.type.startSimilar` | Start from a similar instrument | Types page |
| `label.analyzer.type.inherit.keep` | Keep | Start from similar |
| `label.analyzer.type.inherit.clear` | Clear | Start from similar |
| `label.analyzer.picker.received` | Received: {value} {unit}, range {range}, sample {sampleType} | Evidence panel |
| `label.analyzer.picker.searchAll` | Search all tests | Picker toggle |
| `label.analyzer.picker.sharedLoinc` | {count} tests in your catalog carry LOINC {code} | Picker header |
| `label.analyzer.picker.noLoinc` | No test carries LOINC {code}; search by name | Row message |
| `label.analyzer.picker.unitMismatch` | Analyzer sends {unit}; this test uses {testUnit} | Row warning |
| `label.analyzer.validate.duplicateCode` | Another test in this type already uses code {code} | Inline error |
| `label.analyzer.validate.delimiter` | Codes can't contain {chars}; the analyzer uses them to separate fields | Inline error |
| `label.analyzer.validate.loinc` | Enter a LOINC like 2345-7; the last digit is a check digit | Inline error |
| `label.analyzer.validate.prefixEmpty` | Enter the prefix | Inline error |
| `label.analyzer.draft.existing` | You have a draft from {date}. Continue it or discard it. | Update shared |
| `label.analyzer.draft.reload` | Reload saved draft | Conflict notice |
| `label.analyzer.fix.setupFromResult` | Set up an analyzer from this result | Undelivered row |
| `label.analyzer.fix.stillInSetup` | This analyzer is still in setup | Undelivered row |
| `label.analyzer.fix.mapCode` | Map this code | Held row |
| `label.analyzer.fix.alsoAddToType` | Also add to the analyzer type {name} | Save option |
| `label.analyzer.alert.unknownCode` | {analyzer} sent code {code} that isn't mapped ({count} held) | Alerts entry |
| `label.analyzer.review.confirmRemove` | Remove {count} results from review? They won't be imported. | Confirm dialog |
| `label.analyzer.readiness.loincCoverage` | {count} of {total} active tests in {labUnits} have a LOINC | Readiness |
| `label.analyzer.readiness.sharedLoinc` | {tests} share LOINC {code}; choose which one analyzers use | Readiness |

---

## Acceptance Criteria

- [ ] **AC-1** Adding an analyzer shows Instrument → Connect → Send a test result → Verify; Connect is enabled with unresolved matches present.
- [ ] **AC-2** Connect shows the outside port for the protocol (12000 for LIS01-A on testing, 12011 for E1381, 2575 for HL7) and warns when the port isn't published.
- [ ] **AC-3** A message sent by an analyzer in setup appears in its Send a test result section within 10 seconds, is acknowledged to the instrument, and does **not** appear on Undelivered results or as a result.
- [ ] **AC-4** Verify marks each received code as verified, new value, not in this type, or not seen yet; nothing in the capture is dropped.
- [ ] **AC-5** Sending CREA 1.17 through a type with GeneXpert's record layout shows "read as text" with the layout warning in How we read it.
- [ ] **AC-6** "My instrument isn't listed" asks only name, manufacturer and model, and protocol; publishing it needs nothing else; Advanced is collapsed; no raw enum values and no Evidence confidence appear.
- [ ] **AC-7** Two-way is not offered while the Bridge answers every host query with no information.
- [ ] **AC-8** Start from a similar instrument lists what is inherited with Keep or Clear; clearing result values then publishing raises no hidden-value errors.
- [ ] **AC-9** Mapping code NA (141 mmol/L, Serum) on a Biochemistry analyzer lists Sodium in the first page of the default scoped search, with sample type, lab unit and unit visible on each option.
- [ ] **AC-10** A LOINC shared by Glucose and Glycémie opens a picker with only those two, each with sample type and lab unit.
- [ ] **AC-11** Duplicate codes, delimiter characters, a bad LOINC check digit and an empty control prefix each show a plain-language message beside the field before Save.
- [ ] **AC-12** A reopened, unchanged draft can be published; leaving with unsaved changes asks first; a second Update shared reopens the existing draft; the conflict notice has Reload.
- [ ] **AC-13** An unknown-sender row on Undelivered results offers Set up an analyzer from this result and opens setup with the capture attached.
- [ ] **AC-14** Resolving a held code with "Also add to the analyzer type" on means a second analyzer of that type maps the code without asking.
- [ ] **AC-15** An unknown code from an active analyzer creates an Alerts entry that links to Map this code; Needs attention counts it.
- [ ] **AC-16** Creatinine 1.17 is stored and shown as 1.17 (or flagged for the tech), never silently as 1.
- [ ] **AC-17** A corrected resend after a held result can be accepted.
- [ ] **AC-18** `>1000` and a `>` flag with no number arrive as off-scale results for review, not dropped or held as unknown text.
- [ ] **AC-19** An ASTM order record with action code Q is treated as a control on every ASTM type, including ones made with the not-listed form.
- [ ] **AC-20** The HL7 reject for an unregistered sender says the sender isn't set up.
- [ ] **AC-21** All new strings use localization keys; every action checks the nominated privilege (or today's Admin check) on the server.

---

## Dependencies

- **DEP-1 Bridge setup capture (NEW).** The Bridge accepts and acknowledges messages from a sender registered to an analyzer in SETUP, stores them as a setup capture, and exposes them (raw and parsed) to OpenELIS. Today such traffic is rejected as `UNREGISTERED_SOURCE`.
- **DEP-2 Parsed-message preview from the Bridge (NEW).** An endpoint that runs the type's own parser over a captured message and returns per-record code, value, value-read-as, unit, flag, specimen ID and the field each came from. Reuses `ASTMResultParser` and the HL7 parser; no new parsing logic.
- **DEP-3 Host query (not built).** `AstmHostQuery` answers every query with no information. Two-way is hidden until it exists (FR-C7). Building host query is out of scope here.
- **DEP-4 Protocol starters (NEW shipped data).** One starter per protocol and framing (ASTM LIS01-A, ASTM E1381, HL7 MLLP, flat file) with connection fields, help text and default control rules, shipped with the Bridge types.
- **DEP-5 Published port settings.** OpenELIS needs the outside ports per protocol. Proposed: the `.env` values from the openelis-docker port change (`BRIDGE_ASTM_PORT`, `BRIDGE_ASTM_E1381_PORT`, `BRIDGE_HL7_MLLP_PORT`) passed to the webapp. Draft change exists locally (not pushed); distro template needs the current Bridge service.
- **DEP-6 Alerts entry type.** Uses the existing Alerts page; the analyzer unknown-code alert type may need adding (June FR-G2).
- **DEP-7 Import v2 and Runs.** FR-I2 follows Import v2 Keep/Replace (OGC-288) and the run model (OGC-1200, D-052, D-059); do not build a separate resend rule.

---

## Out of Scope

- Fuzzy or scored matching of codes to tests (abbreviation, unit or range inference). Deferred to Catalyst.
- Building host query and two-way order download (DEP-3).
- Instrument auto-recognition from a message (June FRS out of scope; the header only fills exact text fields).
- Creating catalog tests inline during mapping (June FRS; link to Test Catalog).
- AMR isolate model for microbiology results (results land on the order's sample until it exists).
- Opening cloud firewall or security-group ports (an infrastructure step; the UI only reports it).

---

## Defect and gap register (from QA, 27 to 28 Oct 2026)

Severity as found. "Gap" means the June FRS asked for it and it did not ship.

| ID | Sev | Type | Summary | Closed by |
|---|---|---|---|---|
| L1 | High | Gap (FR-B7/B8, AC-21/23) | Traffic for an analyzer in setup rejected as unknown sender; no push-a-result | FR-A5, A6, B1, G1 |
| L2 | High | Bug | Connect locked until ambiguous matches resolved, despite "You can confirm and connect" | FR-A2 |
| B1 | High | Bug | Duplicate carries GeneXpert's hidden record layout; chemistry values read as text and held | FR-B2, D1 |
| B2 | High | Bug | Numeric results silently rounded (1.17 to 1) | FR-I1 |
| B3 | High | Bug | Corrected resend staged read-only; Save stores nothing, no message | FR-I2 |
| B4 | High | Gap (FR-F2, AC-10) | Host query not implemented; Two-way offered anyway | FR-C7 |
| B5 | High | Bug | Off-scale results dropped or held | FR-B3, I3 |
| B6 | High | Bug | Deleted values leave hidden translations; publish fails on raw paths | FR-D2 |
| P1 | High | Bug | Missing required items all reported as "Save the profile settings before publishing"; LOINC shown optional but required | FR-C7a, F1 |
| P2 | High | Bug | Reopened draft cannot publish without a throwaway edit | FR-F3 |
| P3 | High | Gap (AC-19) | Connection fields authored by hand | FR-C2 |
| X1 | High | Bug | Codes with ASTM delimiters publish and can never match | FR-F2 |
| X2 | High | Bug | Abandoned update drafts, edits lost silently | FR-F5 |
| R1 | High | Bug | Mixed sample types accession fails silently | FR-I4 |
| R2 | High | Bug | Instrument demographics discarded; UNKNOWN patient without warning | FR-I5 |
| R3 | High | Bug | QC by action code Q not recognised on Create path | FR-F7, I6 |
| R4 | High | Bug | Connect shows internal listener port | FR-A3 |
| L3 | Medium | Gap (FR-C1) | Ambiguous LOINC opens whole catalog; no sample type or lab unit | FR-E3, E4 |
| L4 | Medium | Gap (FR-G3) | Learned codes show no evidence; search ranks noise first | FR-E1, E2 |
| L5 | Medium | Gap (FR-G2, AC-15) | No Alerts entry for unknown codes | FR-G5 |
| L6 | Medium | Gap (FR-G3) | Resolving updates the analyzer only, not the type | FR-G4 |
| P4 | Medium | Bug | Raw schema error text | FR-F1 |
| P5 | Medium | Gap (FR-A5) | Raw enum values; Evidence confidence shown | FR-C5, C6 |
| P6, X5 | Medium | Bug | No unsaved-changes warning on Escape or reload | FR-F4 |
| P7, X6 | Medium | Bug | Create offers only "Specimen ID starts with"; empty prefix just disables Save | FR-F2, F7 |
| X3 | Medium | Bug | Duplicate codes caught only at publish with raw path | FR-F2 |
| X4 | Medium | Bug | Catalog accepts any LOINC; empty code returns bare 422 | FR-F2, H3 |
| X7 | Medium | Bug | Draft conflict has no Reload | FR-F6 |
| R5 to R7 | Medium | Bug | Test name shows instrument code; held row has no accession; bundle unformatted | FR-I8 |
| R8, B7 | Medium | Bug | "No test in this lab's catalog" when tests exist without LOINC | FR-E5, H1 |
| R9 | Medium | Bug | Identical value names not matched; options alphabetical | FR-E7 |
| R10, B9 | Medium | Bug | "Ready to activate" with empty fields; two contradicting statuses | FR-A4 |
| R11 | Medium | Bug | Four steps to fix a held result; no way to add expected values | FR-E7, G3 |
| B8 | Medium | Gap | No unit check | FR-E6 |
| B10 | Medium | Bug | Remove from review has no confirmation; list doesn't refresh | FR-G6 |
| B11 | Medium | Bug | Missing QC lot only in server log | FR-I7 |
| H1 | Medium | Bug | HL7 unregistered sender gets "internal error" | FR-G7 |
| L7 | Low | Bug | Undelivered wording; "microbiology" heading; Retry silent | FR-G1, G6 |
| P8, P9 | Low | Bug | Stale banner; protocol asked mid-form | FR-F4, C1 |
| X8 | Low | Bug | No name length limit; table stretches | FR-F2 |
| X9 | Low | Bug | Unit case duplicates | FR-H3 |
| X10 | Low | Bug | Update shared doesn't mention open draft | FR-F5 |
| R12 to R14, B12, D3, D4 | Low | Bug | Read-only default map looks editable; stale banner counts; menu collapse; label run-on; Needs attention 0; empty state | FR-G5, I8 |
| H3 | Note | Gap | Closed cloud port looks like an instrument timeout | FR-A3 |
