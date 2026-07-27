# OpenELIS Results Portal — C0 Discovery Brief & Sequencing Decision

**Status:** Discovery (pre-FRS) · **Date:** 2026-07-25 (rev. 2 — access model, visibility policy, IdP, operator decisions added) · **Owner:** Casey Iiams-Hauser
**Scope:** Country-agnostic; per-country readiness checklist included. **Anchoring scenario:** a network of camps for displaced people — an implementer (MoH, NGO, UN agency, or lab network) operates the portal; clinicians commonly work across several camps.
**Plan source:** `qa-gap-closure-and-portal-plan.md` Plan C · Workbench item "Results/Patient Portal (Plan C)"

---

## Decisions recorded (2026-07-25)

1. **C3 ships first.** The first release is a **facility/requester portal**: requesting clinicians and facilities log in, track their orders, and download released reports. Patient access (C1: OTP login; C2: SMS notify) is the second act. Rationale: C3 is the direct competitive counter to SENAITE's client portal; it has no patient-consent burden (facility users are professional users under existing data-sharing agreements); and it exercises the entire architecture (auth, FHIR reads, report rendering) so C1 becomes an authorization-scope change, not a new build.
2. **Separate lightweight app on the central FHIR server.** The portal is *not* an OpenELIS module. It reads Patient / ServiceRequest / DiagnosticReport / Observation from the consolidated FHIR store (OpenHIE SHR pattern OpenELIS already syncs to). This gives national coverage across all connected labs without touching lab instances, and keeps the public-facing PHI surface out of the LIMS.
3. **Country-agnostic C0.** Discovery answers are collected per country/implementer via the checklist in §5; no pilot is presumed.
4. **Implementer-operated, always** (closes OQ-6). DIGI never hosts this. The deliverable is a deployable artifact (Docker Compose + ops runbook + hardening checklist) run by whoever implements — MoH, NGO, UN agency, camp health cluster, or lab network. Every design choice below assumes an operator who is not us and may have thin IT capacity.
5. **Result-visibility policy is configurable and enforced in the data layer** (closes OQ-2) — see §3a.
6. **Access is modeled on Practitioner/PractitionerRole against a FHIR facility registry, with expiry and attestation cycles** (closes OQ-3) — see §3b.
7. **Bundled IdP with optional federation** (closes OQ-4): the portal ships with its own identity provider (e.g. Keycloak) as the always-works fallback; where a national or agency IdP exists, the bundled IdP becomes a broker (OIDC federation). Authentication can be delegated; **authorization (which facilities you see) always stays in the portal's PractitionerRole layer** — authn ≠ authz.
8. **Central FHIR completeness assumed** (closes OQ-5): design proceeds on the basis that the consolidated server carries all connected labs' DiagnosticReports with requester Organization populated. Row 5 of the readiness checklist remains a per-deployment verification, not a design blocker.
9. **MoH is the operator** (refines OQ-6): the Ministry of Health runs the portal — in the camp scenario typically with implementing-partner support, but ownership, hosting, and the attestation duty sit with MoH.
10. **Privacy, retention, and audit posture are deployment-configurable** (closes OQ-7): access-log retention period, report-retention window, patient-consent capture (for C1 later), and session policies are configuration, not code — each MoH sets them to its own data-protection law. Ship with conservative defaults.
11. **Portal before messaging** (closes OQ-8): the web portal is the delivery channel at launch. SMS/WhatsApp notification (C2) is deferred — per-message cost needs an owner and a budget line; when C2 comes, channels and cost caps are configurable and the cost-owner is named in the deployment agreement.

## 1. Why (plain English)

A clinic that sends samples to a lab currently learns the result when a paper report travels back, when someone phones, or when a clinician logs into a system they usually don't have. Delays in that last mile erase the speed of everything upstream — a same-day viral load result that takes a week to reach the requesting clinic is a week-old result. Every commercial LIS ships a portal for this; among open-source peers, SENAITE has a client portal and OpenELIS has none — it comes up in evaluations. The facility portal closes that gap; the patient phase, when governance allows, would be a capability **no open-source LIMS offers at all**.

## 2. Product shape

**C3 — Facility/Requester Portal (first release):**
- Facility user logs in and sees **their facility's orders only**: status (received / in progress / released), and released reports as PDF download.
- Search/filter by patient identifier as known to the requester, date range, test.
- Read-only. No ordering (CPOE is out of scope; e-orders remain OpenELIS/OpenMRS territory).
- Mobile-first, low-bandwidth, i18n from day one.

**C1 — Patient access (second release):** phone + OTP bound to MRN; released results only; per-test visibility policy (sensitive results — HIV, viral load — configurable to "collect at facility" per country policy); patient-friendly display names from the Test Catalog reporting names.

**Track R — Patient self-registration (parallel track, added 2026-07-25):** a patient-facing registration form on the same portal infrastructure. A patient (or helper) enters their own demographics — name, age/DOB, sex, camp/section, phone if any — in their own language, and receives a QR/short code. The record lands as a **candidate Patient** (FHIR Patient tagged unverified): **registry-first** where a client registry (OpenCR) exists, letting its matching engine dedup, with OpenELIS reading via the existing pathway; **direct to OpenELIS's FHIR endpoint** otherwise, entering the flexible-patient-matching flow. Reception confirms the candidate at the first encounter — only then is it orderable. Never auto-trusted into the clinical pool. **v1 is kiosk-first** (clinic-entrance tablet, big type, picture-assisted language pick, five fields); personal-phone pre-registration is v2 of the same form. Queue-buster + transcription-error killer; independent release cadence from C3.

**C2 — Notify (with or after C1):** SMS "your result is ready" on DiagnosticReport finalization via FHIR subscription; collect-at-facility fallback message where portal access isn't consented.

## 3. Architecture sketch

- **App:** standalone lightweight web app (stack TBD in FRS; must run on modest national infrastructure), deployed alongside the central FHIR server, not per-lab.
- **Reads:** FHIR R4 — ServiceRequest (order + requester Organization), DiagnosticReport (status = final gate), Observation, Patient; Organization/Location via mCSD for facility identity.
- **Writes:** none to clinical data. Audit log of every access (who viewed which report when) — this is the portal's own store, and a hard requirement.
- **Auth (C3):** facility user accounts scoped to an Organization. Open question OQ-4 covers where these accounts live (portal-local vs national HIE identity provider vs OpenELIS-provisioned).
- **Trust boundary:** the portal is in the DMZ; the FHIR server is not internet-exposed — portal is the only public reader, with least-privilege scoped queries.

### 3a. Result-visibility policy (decided mechanism)

**Authoring** lives in the Test Catalog: a per-test **Portal visibility** field with three levels — `ALL` (facility portal now, patient portal when C1 ships), `FACILITY_ONLY` (visible to requesting facilities, never to patients — the sensible default), `NONE` (never leaves the lab via the portal; results delivered in person). Which tests carry which level is the implementer's call, changed like any other catalog configuration and audit-logged. This slots naturally into the QC Targets/Test Catalog editor work (OGC-949 family) as one more per-test field.

**Enforcement** happens twice, and never only in the UI:
1. **At FHIR sync**, OpenELIS stamps the DiagnosticReport's `meta.security` with the visibility label — the policy travels with the data, so any future consumer (not just our portal) can honor it.
2. **At the portal query layer**, the portal's FHIR service account filters on those labels server-side; a `NONE`-labeled report is never returned to the portal backend at all, so no portal bug can leak it.

Changing a test's visibility affects future queries immediately (labels re-evaluated at read for the portal path); a re-labeling job handles historical reports when policy changes.

### 3b. Access model: association, provisioning, deprovisioning, review (decided mechanism)

**Association.** A portal user is a FHIR **Practitioner**; their right to see a facility's orders is a **PractitionerRole** linking them to an **Organization** (a camp/clinic) with a validity `period`. A clinician who works across several camps — the norm in the anchoring scenario — simply holds several PractitionerRoles; their view is the union of active ones. Organizations come from the **central FHIR store or a connected FHIR-enabled facility registry (mCSD/GoFR)**; the portal never invents facilities.

**Provisioning (two-step, no self-service):**
1. Each facility has a named **focal point** (e.g. camp lead clinician) who requests access for a user, naming the facility/facilities and role.
2. The **operator admin** approves; the account and PractitionerRole(s) are created with an explicit expiry.

**Lifetimes & review — tuned for high-turnover settings:**
- Default PractitionerRole validity: **90 days**, renewable. Camp staffing rotates fast; short lifetimes beat annual audits.
- **Auto-suspension at expiry** (soft: 30-day grace where the focal point can renew without re-vetting; after grace, full re-provisioning).
- **Quarterly attestation:** the portal emails each focal point a list of their facility's active users — confirm or revoke. Unattested users suspend at the next cycle. This is the review cycle, and it is the operator's duty, built into the product so it actually happens.

**Deprovisioning:** immediate revoke by the focal point or operator admin (ends the PractitionerRole `period`); revoking a person's last role disables the account. Every provisioning event — request, approval, renewal, revocation, attestation — is written to the portal's audit log.

## 4. Discovery status — CLOSED (2026-07-25)

All eight original open questions are resolved into the decisions in §Decisions and mechanisms in §3a/§3b: OQ-1 governance (MoH approves and operates, decision 9); OQ-2 visibility policy (decision 5, §3a); OQ-3 facility identity & lifecycle (decision 6, §3b); OQ-4 IdP (decision 7); OQ-5 FHIR completeness (decision 8 — per-deployment verification only); OQ-6 operations (decisions 4 & 9); OQ-7 privacy configurability (decision 10); OQ-8 channel (decision 11 — portal first, messaging deferred on cost).

What remains is **per-deployment verification**, owned by the readiness checklist in §5 — not further design discovery.

## 5. Per-country readiness checklist (fill one per candidate)

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Approving authority identified & briefed? | | |
| 2 | Existing lab→facility data-sharing agreement covers electronic delivery? | | |
| 3 | Facility registry available (mCSD/GoFR)? Coverage %? | | |
| 4 | Identity provider available for facility users? | | |
| 5 | Central FHIR carries all labs' reports? Requester Organization populated? | | |
| 6 | Sensitive-result policy defined (which tests, what handling)? | | |
| 7 | Hosting owner + cost agreed? | | |
| 8 | ≥3 facilities interviewed; demand confirmed? | | |
| 9 | Data-protection review completed? | | |
| 10 | Language(s) required at launch? | | |

**Pilot selection rule:** first country with rows 1–5 green is the pilot; rows 6–10 close during the pilot FRS.

## 6. Risks

- **Requester linkage data quality (OQ-5)** is the likeliest technical blocker — mitigate by measuring on real central-FHIR data before any FRS work.
- **Scope creep toward ordering:** facilities will ask to *place* orders. Hold the read-only line in C3; e-ordering is an existing OpenMRS/FHIR workflow, not a portal feature.
- **Patient-phase expectations:** announcing a "portal" invites "where's patient access?" — communicate the two-act plan explicitly.
- **Competitive timing:** SENAITE Cloud + their client portal are shipping realities; C3 doesn't need to be perfect, it needs to exist and demo well.

## 7. Next steps

1. **C0 is closed — proceed to design.** Run `/specify` for the C3 Facility Portal FRS + HTML mockup, incorporating §3a (visibility labels), §3b (PractitionerRole access model, provisioning/attestation flows), the bundled-IdP auth model, and the configurable privacy posture.
2. The Test Catalog **Portal visibility** field is a small companion story on the catalog editor (OGC-949 family) — file alongside the portal FRS.
3. The §5 checklist becomes the **deployment gate** per MoH/implementer, not a design input.
4. C1 (patient access) and C2 (messaging, cost-gated) discovery starts only after C3 is in pilot.
5. **Track R (patient self-registration)** is a parallel track sharing the portal infrastructure: candidate-Patient model (never auto-trusted), registry-first with OpenELIS-FHIR fallback, kiosk-first v1. Spec separately from C3 — different user, different screens, same deployment.
