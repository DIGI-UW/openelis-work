# Patient Self-Registration (Track R) — Functional Requirements Specification

**Status:** Draft for review · **Date:** 2026-07-25
**Technology:** Same portal infrastructure as C3 (standalone app on central FHIR), separate entry point; **kiosk-first** (clinic-entrance tablet in kiosk mode); personal-phone pre-registration is v2 of the same form.
**Companion artifacts:** `patient-self-registration-preview.html` (interactive kiosk mockup); `results-portal-c0-discovery-brief.md` Track R (candidate model, registry-first — normative)
**Related:** Facility Results Portal C3 (separate FRS, same deployment); OpenELIS-side candidate-confirmation (small companion story — see Dependencies)

---

## Lab Context

### Current State
Every patient at a camp clinic starts at a reception desk where a clerk hand-writes or types their name, age, sex, and camp section — spelling a name they've just heard, estimating an age through a translator, while a queue grows behind. The same person registered last month may get a second record because the clerk spells the name differently. Lab orders inherit whatever the clerk captured.

### Pain
Reception is the queue bottleneck: a two-minute registration times two hundred patients is most of a morning. Transcription is the biggest source of demographic errors, and demographic errors are the biggest source of duplicate records — which later means results that can't be found, and repeat tests for want of a match. In displaced-population settings there is often no stable identifier at all, so the spelling of a name *is* the identifier.

### What Changes
A patient (or an accompanying helper) registers themselves at a tablet by the clinic entrance while they queue: pick a language, answer five questions in big type, review, done — the screen shows a short code and QR. At the desk, reception scans the code, sees the patient's own answers, confirms in seconds, and the record becomes real. The patient typed their own name once; every future visit matches against it. Reception's job shrinks from data entry to confirmation.

## Overview

A patient-facing registration form that creates **candidate** patient records — never trusted records. Candidates flow **registry-first** (POST to the client registry, e.g. OpenCR, whose matching engine handles dedup; OpenELIS reads via the existing pathway) or, where no registry exists, **directly to OpenELIS's FHIR endpoint** into the flexible-patient-matching flow. A candidate becomes a real, orderable patient only when reception confirms it at an encounter. One design, two wirings — chosen per deployment by configuration.

**Navigation:** the kiosk is a single looping flow: *Welcome/language → Form (5 steps) → Review → Code*. No navigation chrome, no exit without reset. v2 (personal phone) reuses the same flow at a public URL.

## User Stories

- **As a patient waiting in the queue,** I want to register myself in my own language with big, simple questions, so I don't need to spell my name to a stranger through a window.
- **As a helper accompanying a patient** (family member, community health worker), I want to fill the form on their behalf, so literacy or eyesight is never a barrier.
- **As a reception clerk,** I want to scan the patient's code and see their self-entered details for a yes/no confirmation, so registration takes seconds and the queue moves.
- **As the lab/records officer,** I want self-registrations to stay quarantined as candidates until confirmed, so the patient pool never fills with unverified or duplicate records.

## Functional Requirements

### A. Kiosk shell
- **FR-A1.** Kiosk mode: full-screen, single app, no browser chrome; returns to the Welcome screen after submission or **60 seconds idle** (privacy on a shared screen — all entered data cleared).
- **FR-A2.** Welcome screen: language selection as large tappable tiles (language name in its own script + flag/pictogram); configurable language set per deployment.
- **FR-A3.** A persistent **"Start over"** control clears everything at any step. A **helper toggle** ("I am filling this for someone else") captures no helper identity — it only adjusts phrasing.
- **FR-A4.** Works offline-tolerant: submissions queue on the device (encrypted, auto-purged on send) when connectivity drops and send when it returns; the patient still gets their code immediately.

### B. The form — five questions, big type
- **FR-B1.** Fields, one screen each, in order: **Name** (single free-text field — no forced given/family split; script per selected language), **Sex**, **Date of birth or age** ("I know the birth date" / "I only know the age" — age-only stores an estimated DOB flagged `estimated`), **Where do you stay** (camp + section picker from configured Location list, large tiles), **Phone** (optional, explicit "no phone" tile).
- **FR-B2.** Every screen: one question, large touch targets, no keyboard until needed, forward/back. **No format validation dead-ends** — only "this doesn't look finished" nudges that can be overridden.
- **FR-B3.** Review screen reads the answers back in the selected language, each row tappable to edit.
- **FR-B4.** No clinical questions, ever. Registration is demographics only.

### C. Candidate creation & the code
- **FR-C1.** Submission creates a FHIR **Patient tagged `candidate/unverified`** with `meta.source` = kiosk/site id, routed per deployment config: **(a) registry-first** — POST to the client registry (OpenCR), which owns matching/dedup; or **(b) OpenELIS-direct** — POST to the OpenELIS FHIR endpoint, entering flexible patient matching.
- **FR-C2.** The patient receives a **short code** (6 characters, unambiguous alphabet — no 0/O/1/I) and QR, shown full-screen with "Show this at the desk" in their language; optionally printed if the kiosk has a receipt printer (configurable).
- **FR-C3.** The kiosk **never shows possible matches to the patient** — dedup is invisible and server-side (showing "is this you?" candidates would leak other patients' data on a public screen).
- **FR-C4.** Candidates **expire unclaimed after 30 days** (configurable): expired candidates are marked inactive, never merged, never orderable.
- **FR-C5.** Device retains nothing after submission beyond the offline queue (FR-A4); no candidate list is viewable from the kiosk.

### D. Reception confirmation (contract with OpenELIS — companion story)
- **FR-D1.** At the desk, entering/scanning the code in OpenELIS patient search brings up the candidate with its self-entered demographics and any registry match suggestions, for **confirm / edit-and-confirm / reject**.
- **FR-D2.** Confirmation clears the `candidate` tag (or merges into the matched existing patient per the registry's decision), records who confirmed and when, and makes the patient orderable. Rejection marks the candidate inactive with a reason.
- **FR-D3.** This OpenELIS-side surface is a **small companion story on the existing patient search/entry screens** — the kiosk FRS defines the contract (code → candidate lookup → confirm), not that UI's design.

### E. Cross-cutting
- **FR-E1.** i18n as a first-class feature: the form must render fully in every configured language including RTL scripts; pictograms accompany key questions.
- **FR-E2.** WCAG 2.1 AA plus kiosk ergonomics: minimum 18px body text, high contrast, touch targets ≥ 48px.
- **FR-E3.** Every candidate creation, expiry, confirmation, and rejection is audit-logged (portal audit store; confirmation also audited OpenELIS-side).
- **FR-E4.** Rate limiting per device (configurable, default 1 submission / 30 seconds) to absorb accidental double-taps and casual misuse; no CAPTCHA (literacy barrier).

## Data model

| Store | Contents |
|---|---|
| Central FHIR / registry | candidate Patient resources (tag `unverified`, `meta.source` = kiosk id, DOB-estimated flag) |
| `short_code` | code ↔ candidate Patient reference, issued-at, claimed-at/expired-at |
| Kiosk device | offline submission queue only (encrypted, purge-on-send) |
| `audit_event` | shared portal audit store (creation/expiry/claim events) |

## Access

The kiosk itself is unauthenticated by design (a registered device, not a user). Device enrollment (which kiosk belongs to which site) is Operator-admin configuration in the portal admin. Reception confirmation happens inside OpenELIS under existing Reception role permissions — no new roles.

## Acceptance criteria

- [ ] Full kiosk loop: language tiles → 5 single-question screens → review → code+QR → auto-reset; 60s idle reset clears all data.
- [ ] Age-only entry stores estimated DOB with flag; single name field; camp/section from configured Locations; "no phone" tile.
- [ ] Candidate Patient created with unverified tag via registry-first or OpenELIS-direct per deployment config; kiosk never displays match candidates.
- [ ] Short code excludes ambiguous characters; QR renders; optional receipt print behind config.
- [ ] Offline queue: submissions survive connectivity loss; patient gets code immediately; queue purges on send.
- [ ] Unclaimed candidates expire at 30 days (configurable) to inactive.
- [ ] Confirmation contract: code lookup returns candidate + self-entered demographics; confirm/edit/reject semantics per FR-D2.
- [ ] Full i18n incl. RTL; WCAG 2.1 AA; ≥48px targets; rate limiting active.

## Dependencies

Central FHIR store (and client registry where present) reachable from the kiosk network; **OpenELIS companion story**: candidate lookup + confirm/reject on patient search (small — file when this FRS is approved); Location/camp-section configuration; portal admin device enrollment (C3 FR-G surface).

## Out of scope

Personal-phone pre-registration (v2 — same form, public URL, throttling revisited); patient result access (C1); appointment/queue management; ID-card or biometric capture; helper identity capture; clinical intake questions.
