# OpenELIS EQA V2 ↔ APHL ePT (deforay/ept) — Platform Crosswalk

**Purpose.** The APHL-sponsored ePT platform (https://github.com/deforay/ept, AGPL-3.0) is the most widely deployed open-source PT platform in the LMIC public-health space. It has been in production since 2014 across 10+ countries (Ghana, Myanmar, Senegal, South Africa, Rwanda, Jamaica, Trinidad & Tobago, Guyana, and others). This document crosswalks OpenELIS EQA V2 MVP against ePT's shipped feature set to surface lessons, gaps, and differentiators before V2 freezes.

**Date.** 2026-04-23
**Author.** Casey / design-review pass
**Status.** Informational; feeds decisions into the epic doc and V3 outline. No binding changes to V2 scope unless explicitly cross-referenced here.

---

## 1. ePT in one paragraph

ePT is a **standalone, provider-side PT management system** written in PHP (Zend Framework-era) on MySQL 8+, with a scheduled-job runner (`crunz`). A PT provider deploys one ePT instance per program; participating labs log in to that instance, view open PT surveys, enter results online, and receive scores. Deployment is server-per-program (each country or program typically runs its own instance — nhlmmr.org, mtbept.com, eqapt.com are examples). Built-in scheme modules: HIV Serology, HIV Viral Load, Early Infant Diagnosis (EID), HIV Recency, COVID-19, Tuberculosis, and a "Custom Tests" framework for operator-defined schemes. Sister project InteLIS (same author) is the sample-management counterpart.

**Role in the ecosystem.** ePT is what OpenELIS V2.5 becomes for OpenELIS-running provider labs. The critical distinction is integration: ePT is intentionally decoupled from any LIMS so any lab can participate; OpenELIS V2.5 is intentionally integrated so the same instance that runs a lab's clinical testing also runs its EQA program, eliminating double entry.

---

## 2. Architectural comparison

| Axis | APHL ePT | OpenELIS EQA V2 |
|---|---|---|
| **Deployment model** | Standalone PT-only server; participants hit a separate URL to enter PT results. | Integrated into the LIMS; EQA lives in the same instance as clinical testing. |
| **Primary user** | Provider (PT program operator). Participant is a secondary user of the same instance. | Both — participant-side (V2.2) and provider-side (V2.5) are first-class. |
| **Scheme extensibility** | Scheme-per-module PHP class (`library/Pt/*`); adding a new scheme means code + templates. Related APHL repos (`tbPT`, `HIV-Rapid-PT`) are effectively forks. | Polymorphic `eqa_scheme` with `scheme_type` discriminator (FR-V2.1-06) + per-scheme configuration; adding a scheme is data, not code, for the common cases. Code only needed for novel scoring algorithms. |
| **Data entry path** | Standalone web form per survey, analyte-by-analyte. Or "PT Hub" proxy entry by provider admin on behalf of a participant. | Standard OpenELIS result entry (FR-V2.3-04 adds a per-analyst column). Participants enter EQA results the same way they enter patient results. |
| **Submission to provider** | None — provider IS the system. Participant's entry is already in the provider's DB. | FHIR auto-submit (V2.2 FR-V2.2-05) or manual fallback (FR-V2.2-06) from participant's OpenELIS to provider's OpenELIS (or any FHIR-compatible target). |
| **Sample shipment** | Built-in Shipment entity tied to Survey; tracks courier, tracking #, status. | Plugs into the existing OpenELIS sample-shipment module (FR-V2.1-19, FR-V2.5-13) — no parallel table. |
| **Participant competency** | None visible at the scheme/participant level; no per-analyst competency surface. | First-class: `eqa_analyst_competency_event` (FR-V2.1-22) + Analyst Competency dashboard (FR-V2.3-06) driven by a 9-value event-type enum. |
| **NCE integration** | None — certificate or performance report is the output; follow-up is out-of-system. | Tiered auto-NCE on participant-role unacceptable scores (FR-V2.3-01), including categorical / null-Z path for HIV qualitative / TB smear. |
| **Certificate issuance** | Yes — `CERTIFICATE_WORKFLOW_PLAN.md` indicates formal participation / performance certificate generation. | Not in V2 scope; candidate for V3.5 (ISO 17043 provider compliance). |
| **License** | AGPL-3.0 | MPL-2.0 (OpenELIS Global) — license incompatibility prevents code copying; conceptual lessons only. |
| **Stack** | PHP 8.4 + Zend-style + MySQL 8+ + Apache2 + crunz cron. | Java Spring + PostgreSQL + @carbon/react + Spring scheduler. |
| **Multi-cycle analytics** | Separate APHL repo — `Integrated-EQA-Database` aggregates across ePT instances. | Deferred to V3.1 (Multi-Cycle Analytics). |

---

## 3. What V2 already does better than ePT

These are intentional differentiators of the integrated model — they should be preserved.

**A. Polymorphic `eqa_scheme` eliminates fork-per-scheme.** ePT's ecosystem includes `tbPT` and `HIV-Rapid-PT` as separate repositories because adding a major scheme to ePT means committing new PHP classes + templates + database migrations. V2's `scheme_type` discriminator + conditional validators (BR-004, FR-V2.1-06) handles the same schemes through configuration. Adding a new scheme for, say, malaria microscopy only requires a `scheme_type` value + a scoring rule row, not a fork. Architectural win.

**B. Results enter through the standard pipeline.** V2's FR-V2.3-04 adds a per-analyst column to the standard result-entry page; PT samples are standard Orders (V2.4 FR-V2.4-15, V2.5 FR-V2.5-02). This means an analyst running PT uses the same UI they use for patient samples — no parallel data-entry path. ePT participants switch contexts to a separate web app. Saves training cost, reduces data-entry errors, and makes the analyst's workflow uniform.

**C. Per-analyst competency as a first-class event table.** ePT surfaces "which labs passed" at the scheme level. V2's `eqa_analyst_competency_event` (FR-V2.1-22) with its 9-value event-type enum (`external_missed_deadline`, `in_house_missed_deadline`, `unacceptable_score`, `questionable_score`, `escalated_to_nce`, `dismissed_*`) is a structural answer to ISO 15189 §6.2.3's per-analyst competency requirement — which ePT doesn't attempt to solve because it isn't a LIMS and doesn't know which analyst ran the sample. This is the single biggest thing an integrated LIMS can do for EQA that a standalone platform cannot.

**D. NCE loop closed in-system.** ePT's output is a report. What the lab does with an unacceptable result happens outside ePT. V2's FR-V2.3-01 auto-creates a tracked NCE with `trigger_source = 'eqa_unacceptable'`, with a dedicated URL contract (`?source=eqa`, documented at `docs/eqa/nce-deep-links.md`) linking the NCE register back to the EQA Coverage screen. This closes ISO 15189 §7.7.3 in-system.

**E. Shipment plug-point, not parallel table.** V2.1 FR-V2.1-19's decision to plug EQA shipments into the existing sample-shipment module avoids the ePT pattern where Shipment is a bespoke entity unrelated to the lab's other shipment tracking (referrals out, reference-lab transfers). A lab running EQA + referrals + reference-lab transfers in OpenELIS sees one shipment workbench for all three, not three parallel ones.

---

## 4. Where ePT does things V2 does not — candidate V3 items

**F. Participation / performance certificate generation.** ePT's `CERTIFICATE_WORKFLOW_PLAN.md` indicates auto-generated certificates at cycle close — participation certificates for all enrolled labs, performance certificates with per-analyte scoring summaries. V2 does not emit any artifact at cycle close beyond the data sitting in the database. For provider labs running regional programs (e.g., a national reference lab running HIV serology PT for 80 peripheral labs), certificate generation is an operational expectation and a visible deliverable to participants. **Recommended V3.5 story (ISO 17043 provider compliance):** certificate generation from a templated PDF, keyed on cycle close, with per-lab + per-analyte rendering.

**G. "PT Hub" proxy data entry.** ePT's PT Hub role allows a provider admin to enter results on behalf of a participant lab that can't enter online (no internet, paper-only workflow). V2.5 doesn't have an explicit affordance for this; a provider admin could log in as the participant lab, but that's a security/auditability workaround, not a supported workflow. **Recommended V3 consideration:** a "Record result on behalf of {participant}" action on the V2.5 provider-side intake (FR-V2.5-03), writing with the provider admin as `entered_by` and the participant lab as the data owner. Audit-trail-clean, permission-gated.

**H. Reminder emails / scheduled nudges.** ePT uses `crunz` to send reminder emails to participants approaching submission deadlines. V2 doesn't specify this. OpenELIS already has a notification framework (used for result-delivery emails, referral alerts). **Recommended:** a V3 item or low-effort V2.2 addition — a scheduled job that emails participants whose cycle is `panel_received` + `submission_deadline - now < 3 days` AND no scored results yet.

**I. Reference-range / expected-value lookup sheets for participants.** ePT scheme modules include built-in reference ranges and expected-value ranges per analyte, displayed to participants on entry. V2 leaves analyte reference data to the standard OpenELIS test catalog, which is correct architecturally, but the catalog may not populate all the clinical-decision context a PT participant would expect during entry (e.g., "HIV-1 VL: log10 copies/mL; LOD 40 c/mL"). **Not a V3 story per se — verification task for V2.2 launch:** confirm that the standard result-entry screen, when opened on a PT sample, surfaces the same unit + method context that ePT shows. If it doesn't, patch the test catalog, not EQA code.

**J. Integrated analytics across schemes (per APHL's `Integrated-EQA-Database` repo).** APHL runs a separate project that aggregates across ePT instances for cross-scheme trending. V2 defers this to V3.1 Multi-Cycle Analytics — same idea, in-system rather than cross-instance. No change recommended; confirming alignment.

---

## 5. Decisions NOT to adopt from ePT

Not every feature-by-feature gap is a gap — some are deliberate architectural divergences.

**K. Do not adopt fork-per-scheme.** APHL has separate repos for `tbPT` and `HIV-Rapid-PT`. That's the cost of ePT's scheme-as-code model. Our polymorphic scheme + discriminator model is better and should not be abandoned under pressure to "match ePT's TB module."

**L. Do not build standalone participant login pages.** ePT needs them because it has no LIMS to integrate with. We integrate with the LIMS the lab already uses; there is no separate login. Preserving this is why FR-V2.3-04's per-analyst column goes into the standard result-entry page rather than a parallel EQA-only page.

**M. Do not add a separate Shipment entity.** Even if ePT's Shipment is nicely modeled for PT specifically, the decision in §7.2.12 + FR-V2.1-19 to plug into the existing OpenELIS sample-shipment module is the right call for an integrated LIMS. Preserving unity of shipment tracking across EQA + referrals + reference-lab transfers is worth more than EQA-specific shipment richness.

**N. Do not assume the "participant enters data into the provider's system" model.** This is ePT's core UX and it's right for ePT's standalone deployment. V2's model — participant enters into their own OpenELIS, data flows to provider via FHIR — is the integrated answer and the whole point of building this into a LIMS.

---

## 6. Lessons that shape V2 (no code changes; design confidence)

**O. Scheme catalog validated.** ePT's decade of production use confirms our scheme list is right: HIV serology, HIV viral load, EID, HIV recency, COVID-19, TB, plus custom. V2.1 FR-V2.1-06's `scheme_type` enum should include these as first-class values; any that don't fit the polymorphic model is a bug in the model, not a reason to narrow V2 scope.

**P. Multi-country deployment is real.** ePT is in production in 10+ countries. V2 should not be architected for a single reference deployment; i18n keys must be comprehensive (FR-V2.1-05's i18n family declarations in each story), date formats locale-aware, and the Custom Tests framework must be easy enough that a country-specific scheme can be configured by an admin in a day, not weeks.

**Q. Scheduled jobs as infrastructure.** ePT's crunz-based scheduler runs cycle-state transitions, reminder emails, and report generation. V2's cycle state machine (FR-V2.1-04, FR-V2.1-18) has several auto-transitions — e.g., `delivered → submissions_open` (FR-V2.5-14's auto-advance). Confirm that these are wired through OpenELIS's existing scheduler infrastructure, not ad-hoc database triggers.

**R. Separation of physical-ops and data-ops holds up.** ePT, like V2.5, separates prep / shipment / receipt-monitoring from scoring / participant-results / follow-up. Our IA (Prep Workbench → Shipment Workbench → Receipt Monitor → Performance → Follow-Up as submenu children) matches the mental model labs have after a decade of running ePT.

---

## 7. Potential future integration: ePT ↔ OpenELIS interop

A V3.X or post-V3 consideration: a lab running OpenELIS that participates in an ePT-run program today double-enters results (once in OpenELIS for the patient/panel sample, once in ePT for the PT submission). If ePT exposes a FHIR or REST submission endpoint, V2.2 FR-V2.2-05's auto-submission could target an ePT instance directly.

- **Effort needed:** ePT would need to accept FHIR `DiagnosticReport` or a REST endpoint matching ePT's Survey + Response schema. ePT's maintainer is listed in the README as the contact point.
- **Value:** non-trivial — OpenELIS-running labs in countries with ePT-run national programs (Myanmar, Senegal, South Africa, etc.) stop double-entering.
- **Work items:** (1) discovery spike with ePT maintainer, (2) add `ept` as a known `provider_fhir_endpoint_type` in `eqa_scheme`, (3) adapter shim in V2.2's auto-submission path.
- **Not a V2 story.** Mentioning here so it doesn't get lost.

---

## 8. Action items from this crosswalk

| # | Item | Target | Owner | Status |
|---|---|---|---|---|
| 1 | **Verify V2.2 result-entry screen surfaces the same unit + method context a PT participant expects** (see §4 item I). Spot-check with a seeded HIV VL PT sample. | Pre-V2.2 launch | Dev / QA | ✅ Landed in V2.2 DoD as the unit/method verification item covering all six ePT-validated domains (per crosswalk §7.2.16). |
| 2 | **Add certificate generation to V3.5 outline** (see §4 item F) — scope as "cycle-close PDF certificates per participant, templated, covering participation + performance, ISO 17043 Annex A aligned." | V3.5 story | Casey | ✅ V3.5 scope now includes cycle-close Certificate of Participation generation + `eqa_cycle_certificate` table + `certificates_enabled` scheme flag. Epic-2 AC-E03 updated. |
| 3 | **Add 'PT Hub proxy entry' to V3 backlog** (see §4 item G) — scope as "provider admin enters participant result on their behalf, writing correct `entered_by` + `data_owner`, permission-gated." | V3 backlog | Casey | ✅ Added as new **V3.7 — PT Hub: Provider-Side Proxy Entry for Offline Participants** with full outline (permission, data attribution columns, `data_source` enum, ACs). Epic-2 AC-E04 added. |
| 4 | **Confirm reminder-email hooks** (see §4 item H) — decide if this rides in V2.2 as a low-effort addition or parks in V3. | Next sprint planning | Casey | ✅ Rides in V2.2 as **FR-V2.2-14 — submission-deadline reminder emails** (scheduled aggregated daily digest, configurable lead-time, no-contact Alerts fallback). V2.2 story points 8 → 9. |
| 5 | **Revise: `scheme_type` is the arrangement-type axis, not a test-domain axis.** The ePT catalog maps to the *test-domain* axis, which V2 carries via the standard OpenELIS test catalog, not a second enum. Clarify this in FR-V2.1-06 and prove the six ePT-validated test domains (HIV serology, HIV VL, EID, HIV recency, COVID-19, TB) can be represented in the test catalog without schema changes. | Pre-V2.1 implementation | Dev | ✅ FR-V2.1-06 gained a **Test-domain coverage invariant** paragraph; AC-V2.1-23 + DoD item + `docs/eqa/test-domain-catalog.md` added. Enum values unchanged (`international_pt`, `regional_pt`, `inter_lab_split`, `in_house`) — correctly preserved as the arrangement axis. |
| 6 | **ePT interop discovery** (see §7) — conversation with ePT maintainer about submission endpoint. | V3 or post-V3 | Casey / PM | ✅ Formalized as **V3.8 — ePT FHIR Interop: Discovery + Adapter Shim** with `provider_fhir_endpoint_type` discriminator, adapter Java module (`eqa-adapter-aphl-ept`), and a discovery-spike deliverable (`docs/eqa/ept-fhir-discovery.md`) preceding implementation. Epic-2 AC-E05 added. |

---

## Sources

- [deforay/ept — Online Lab Proficiency Testing Platform (GitHub)](https://github.com/deforay/ept)
- [APHL-Global-Health organization (GitHub)](https://github.com/APHL-Global-Health)
- [APHL-Global-Health/tbPT — TB module](https://github.com/APHL-Global-Health/tbPT)
- [APHL-Global-Health/HIV-Rapid-PT — Kenya HIV serology PT](https://github.com/APHL-Global-Health/HIV-Rapid-PT)
- [APHL-Global-Health/Integrated-EQA-Database — cross-ePT aggregator](https://github.com/APHL-Global-Health/Integrated-EQA-Database)
- [RTCQI ePT tool page](https://rtcqi.org/tools/ept)
- [deforay/intelis — sister sample-management project](https://github.com/deforay/intelis)
