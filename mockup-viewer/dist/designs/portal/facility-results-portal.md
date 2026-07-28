# Facility Results Portal (C3) — Functional Requirements Specification

**Status:** Draft for review · **Date:** 2026-07-25
**Technology:** Standalone lightweight web app (mobile-first), Carbon-derived styling; reads the central FHIR R4 store; bundled IdP (Keycloak) with optional OIDC federation. **Not an OpenELIS module.**
**Companion artifacts:** `facility-results-portal-preview.html` (interactive mockup); `results-portal-c0-discovery-brief.md` (decisions 1–11, §3a visibility, §3b access model — normative for this FRS)
**Related:** Track R (patient self-registration — separate FRS, same deployment); Test Catalog Portal-visibility field (companion story, OGC-949 family)

---

## Lab Context

### Current State
A clinical officer in a camp clinic sends samples to the lab and then waits. The result comes back when a paper report travels with the next vehicle, when someone at the lab answers the phone, or when the clinician physically walks over. Clinicians covering several camps carry the question "is it back yet?" between sites in a notebook. The lab, meanwhile, fields constant status calls that interrupt bench work.

### Pain
A same-day viral load or hemoglobin result that takes three days to reach the requesting clinician is a three-day-old result — the patient may have left, deteriorated, or been treated blind. Status phone calls consume lab staff time without moving a single result. And when reports travel on paper between camps, they get lost, and critical values arrive with no more urgency than normal ones.

### What Changes
The clinician opens the portal on their phone between patients and sees, in ten seconds, every result released for their facilities since they last looked — critical values pinned to the top. They can search with whatever identifier is on the requisition slip, see a plain three-step status for pending orders (so "not ready" is an answer, not a mystery), read released results on-screen, and download the PDF for the patient file. The status calls to the lab stop.

## Overview

Read-only results-delivery portal for requesting facilities, running against the central FHIR store. All access is scoped by PractitionerRole (C0 brief §3b); all result visibility honors the Test Catalog portal-visibility labels (C0 brief §3a). One primary action: *find my patient's result and read it*. Deliberately absent: ordering, acknowledgment workflows, patient editing, analytics.

**Navigation (portal-internal):** Home ("New results") · Search · My facilities (switcher) · Admin (operator/focal-point only). Mobile-first single column; ≥1024px widens lists into tables. Deep-linkable: `/orders/{id}`, `/reports/{id}`.

## User Stories

- **As a camp clinician,** I want to see what results came back for my facility since I last looked, with critical values first, so my most common visit takes ten seconds.
- **As a camp clinician,** I want to search with whatever is on the requisition slip — lab number, camp ID, name and rough age — so a messy identifier never dead-ends me.
- **As a camp clinician,** I want a plain status for a pending order (received / testing / ready), so I stop phoning the lab.
- **As a clinician covering three camps,** I want a one-tap facility switcher with the current camp always visible, so I never read results against the wrong site.
- **As a facility focal point,** I want to request access for new staff and revoke leavers, and confirm my facility's user list quarterly, so access stays clean despite turnover.
- **As the operator admin (MoH),** I want to approve access requests and see the audit trail, so accountability is real.

## Functional Requirements

### A. Sessions & shared devices
- **FR-A1.** Sign-in via the bundled IdP; where a national/agency IdP is federated, that login is used. First sign-in on a device offers an optional **4-digit quick-PIN** for that device.
- **FR-A2.** Sessions idle-expire in 10 minutes (configurable). Re-entry within 8 hours needs only the quick-PIN; beyond that, full sign-in. Switch-user is always one tap from the PIN screen (shared tablets).
- **FR-A3.** No PHI is cached on the device beyond the active session.

### B. Home — "New results"
- **FR-B1.** Home lists DiagnosticReports **released since the user's last visit** for the selected facility, newest first, each row: patient (name + identifier), test(s), released time, flag chips.
- **FR-B2.** Reports containing a **critical/abnormal-flagged** Observation pin to the top with a red flag chip; normal results follow.
- **FR-B3.** A per-facility **badge count** of unseen releases shows in the facility switcher.
- **FR-B4.** "Since you last looked" is per user + facility (portal-local `last_seen` timestamp); an explicit date-range view covers the last 30 days.
- **FR-B5.** Empty state: "No new results for [facility] since [date]" with a link to Search.

### C. Search — forgiving by design
- **FR-C1.** One search box. Accepts and auto-detects: lab/accession number, camp/programme identifier, patient name (partial, any order), name + approximate age ("Amina 30"). **No format validation, ever** — a query either finds candidates or offers guidance, never "invalid input."
- **FR-C2.** Results list candidate patients/orders within the user's facility scope, showing enough to disambiguate (name, sex, age, identifier, camp section) without exposing other facilities' data.
- **FR-C3.** Zero-hit guidance suggests: check another of my facilities (if multi-facility), try fewer characters, or contact the lab — with the lab's phone number displayed.
- **FR-C4.** Search queries are included in the access audit log (FR-F).

### D. Order status & result view
- **FR-D1.** Each order renders a **three-step timeline**: *Received at lab → Testing → Result ready*, mapped from ServiceRequest/DiagnosticReport status. Rejected/cancelled samples show as a distinct fourth state with the lab-provided reason ("Recollect — sample hemolyzed").
- **FR-D2.** A ready result renders as **readable HTML**: per-Observation value, unit, reference range, and flag (normal / abnormal / critical) using high-contrast chips — legible on a 5-inch screen. Multi-component tests render one line per component.
- **FR-D3.** **PDF download** of the released report for the patient file; the PDF is the lab's report rendering, fetched on demand (never pre-cached).
- **FR-D4.** Only DiagnosticReports with status **final** (and portal-visible labels `ALL`/`FACILITY_ONLY` per C0 §3a) appear anywhere. `NONE`-labeled reports are server-side filtered and leave no trace in the UI.
- **FR-D5.** Preliminary/corrected reports: a corrected report supersedes visibly ("Corrected — replaces report of [date]").

### E. Facility context
- **FR-E1.** The current facility name is **always visible in the header**. Users with one facility never see a switcher.
- **FR-E2.** Multi-facility users switch via a one-tap menu listing their active facilities with unseen-count badges; switching reloads Home in the new context. The scope is the union of active PractitionerRoles, but **views are always single-facility** — no merged cross-facility lists (wrong-context reading is a patient-safety issue).

### F. Audit
- **FR-F1.** Every report view, PDF download, and search is logged: user, facility context, patient/report, timestamp. Log retention is deployment-configurable (C0 decision 10).
- **FR-F2.** Operator admin can filter/export the audit log (CSV).

### G. Admin & access lifecycle (thin, per C0 §3b)
- **FR-G1.** Focal point: request access (user + facility + role), revoke, and answer the **quarterly attestation** (confirm/revoke each listed user).
- **FR-G2.** Operator admin: approve/deny requests, set PractitionerRole expiry (default 90 days), suspend users; see attestation status per facility.
- **FR-G3.** Expiry and attestation behavior per C0 §3b (auto-suspend, 30-day grace, renewal without re-vetting inside grace).

### H. Cross-cutting
- **FR-H1.** i18n from day one; portal ships its own message catalog (reuse OpenELIS translation strings where terms match — result flags, test names come from the lab data itself).
- **FR-H2.** Low bandwidth: every page usable at 2G; payloads per screen ≤ 50 KB excluding PDF; no heavy client framework requirements in the spec (implementation's choice, budget is normative).
- **FR-H3.** WCAG 2.1 AA; outdoor-legibility contrast for flag chips.

## Data model (portal-local; clinical data stays in FHIR)

| Store | Contents |
|---|---|
| Accounts/roles | via bundled IdP + PractitionerRole resources (central FHIR) |
| `user_facility_last_seen` | user, facility (Organization ref), timestamp — drives FR-B |
| `access_request` / `attestation_cycle` | provisioning workflow state (FR-G) |
| `audit_event` | FR-F rows; retention configurable |

No clinical writes. No clinical copies at rest beyond transient render cache.

## Access

Roles: **Facility user** (FR-A–E), **Facility focal point** (adds FR-G1), **Operator admin** (adds FR-G2, FR-F2). A user without portal access sees only the sign-in screen; a facility user never sees Admin.

## Acceptance criteria

- [ ] Home shows since-last-visit releases for the selected facility, criticals pinned; per-facility unseen badges.
- [ ] Search accepts lab number / camp ID / partial name / name+age with no format rejection; scope-limited; zero-hit guidance with lab phone.
- [ ] Order timeline (Received / Testing / Ready + rejected state w/ reason); results render as HTML with ranges + flags; PDF download works.
- [ ] `NONE`-labeled reports never reach the portal backend (server-side filter verified by test).
- [ ] Facility always visible; one-tap switch; no merged cross-facility views.
- [ ] Quick-PIN re-auth, 10-min idle timeout, one-tap switch-user.
- [ ] Provisioning, expiry (90-day default), grace, and quarterly attestation flows work per C0 §3b; all access audited and exportable.
- [ ] Usable at 2G within payload budget; WCAG 2.1 AA.

## Dependencies

Central FHIR store with requester Organization populated (C0 decision 8 — verified per deployment); Test Catalog Portal-visibility field + sync labeling (companion story); facility registry (mCSD) or Organization list in central FHIR; bundled IdP container.

## Out of scope

Ordering/CPOE; acknowledgment workflows; patient demographic editing; analytics/dashboards; patient access (C1); notifications (C2); self-registration (Track R — separate FRS).
