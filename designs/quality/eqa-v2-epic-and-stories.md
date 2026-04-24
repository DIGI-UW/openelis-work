# EQA V2 MVP + V3 Enhancements — Epic & Stories

**Status:** Draft, Jira-ready. Pending Casey approval before filing to OGC.

**Parent context:**
- Compilation: `eqa-workflow-compilation.md`
- Crosswalk: `eqa-v1-crosswalk.md` (§5 MVP/V3 structure, §7 Resolved Decisions + Refinements, §8 Story structure)
- V1 FRS: `upload/eqa-requirements.md` + `upload/eqa-enrollment-addendum.md`
- Preview: `eqa-v2-preview.html` (Carbon-ported V2 MVP screens)
- NCE integration target: `upload/processed/nce-report.md` (NCE FRS v3.1, existing `nce_capa` + `nce_effectiveness_review`)

**Decisions encoded (from crosswalk §7.1 + §7.2 refinements):**
- Q1: separate `eqa_participant_result` entity
- Q2: polymorphic `eqa_scheme` with `scheme_type` discriminator
- Q3: Carbon-port of existing `eqa-enrollment.jsx` IA
- Q4: tiered EQA → NCE integration, **participant-role only** (provider-side is a different workflow)
- Q5: Epic wrapper over stories
- Refinement: standard OpenELIS pipeline owns result entry + validation; Cycle pages are progress dashboards that link out to standard result entry
- Refinement: no separate sign-off gate; auto-submit on validation-complete; manual-submit fallback; optional gate via `requires_cycle_review` flag (off by default)
- Refinement: per-analyst capture via optional column on standard result entry + eligible-analyst mapping on scheme config
- Refinement: Lab Performance dashboard pulled into V2.3
- Refinement: V2.4 In-House Blinding Workflow added
- Refinement: V2.5 Provider-Side Program + Participant Follow-Up added
- Refinement: one `eqa_panel` table shared by in-house and provider use

---

## EPIC 1 — EQA V2: Complete Lifecycle MVP

**Proposed key:** OGC-EQA-V2-EPIC (placeholder — Casey to confirm on filing)
**Type:** Epic
**Fix Version:** OpenELIS Global 3.3.0
**Labels:** `eqa` `iso-15189` `iso-17043` `global` `quality-assurance` `mvp`

### Epic summary

Deliver a complete-lifecycle EQA MVP for OpenELIS Global: one that handles **participating** in external PT, running **in-house** self-administered PT, AND running a **provider** program for other labs — all at a baseline level sufficient to operate ISO 15189 compliant EQA without paper/Excel side-systems. V3 (second epic) adds analytics, full ISO 17043 compliance, and cross-module integrations on top of this MVP.

V2 covers all 29 phases from the EQA workflow compilation at a baseline level. It does NOT include multi-cycle trending, coverage gap analysis, annual summaries, cold-chain receipt, IQC correlation, patient-impact look-back, ISO 17043 panel homogeneity/stability, or provider-side internal NCE triggers — those are deliberately deferred to V3.

### Business value

- **ISO 15189 §7.7.3 compliance** — prompt corrective action on unacceptable EQA scores via NCE integration, with traceable root cause and effectiveness review.
- **ISO 15189 §6.2.3 compliance** — per-analyst competency evidence via V2.3.
- **ISO 15189 §7.7.2 flexibility** — in-house schemes supported when no external PT is available (V2.4 makes this usable, not just schema-complete).
- **ISO/IEC 17043 baseline** — provider-side operations supported at MVP level (V2.5); full 17043 compliance accreditation-ready in V3.5.
- **Single-system replacement** — labs currently tracking PT in Excel or paper move entirely to OpenELIS, including provider-mode labs that run regional schemes.

### Scope

**In scope (V2.1–V2.5):**
- Cycle / Round entity + state machine
- `eqa_participant_result` lifecycle
- Polymorphic `eqa_scheme` with conditional BR-004
- Eligible-analyst mapping + per-analyst column at result entry
- Carbon-port of V1 enrollment UI
- Cycle progress dashboard (standard-pipeline-driven)
- Auto-submission via FHIR + manual fallback + score intake
- EQA → NCE tiered integration (participant-role only)
- Lab Performance dashboard + Analyst Competency view
- Follow-Up Queue for this lab's questionable / in-house-flagged scores (corrective-review triage)
- In-house blinding wizard with sealed targets + unblinding
- Provider-side panel definition (MVP level, not ISO 17043)
- Participant performance dashboard + follow-up register

**Out of scope (deferred to V3):**
- Multi-cycle trending, automated signals, coverage matrix, annual summary (V3.1)
- Structured cold-chain validators + rejection workflow (V3.2) — minimal receipt event IS in V2.2 MVP (FR-V2.2-12)
- IQC ↔ EQA same-run correlation (V3.3)
- Patient-impact look-back worklist (V3.4)
- ISO 17043 panel homogeneity / stability / full production traceability (V3.5)
- Provider-side internal NCE triggers (V3.6)

### Acceptance criteria (epic-level)

- **AC-E01** All five child stories (V2.1, V2.2, V2.3, V2.4, V2.5) are merged and deployed.
- **AC-E02** A participant lab completes one full external PT cycle end-to-end entirely within OpenELIS (enroll → receive panel → enter results in standard result entry → auto-submit via FHIR on validation-complete → receive scores → review in Lab Performance).
- **AC-E03** An unacceptable EQA score (|Z|>3) on a participant-role result automatically creates an NCE in the local NCE register. A provider-role result does NOT create a local NCE.
- **AC-E04** A supervisor creates an in-house blinded panel with sealed targets, distributes samples to analysts blind, unblinds at deadline, and views auto-generated scores.
- **AC-E05** A provider-side lab runs one full cycle end-to-end entirely within OpenELIS: defines a panel with source_type + inventory fields, preps aliquots + passes homogeneity QC, ships to 3+ enrolled participating labs (courier + tracking + cold chain recorded via the existing sample shipment module), confirms receipt (via participant-side receipt events), receives their results, calculates and returns scores, opens follow-up items for participants scoring unacceptable, and reprovisions a repeat shipment from reserve aliquots for at least one follow-up.
- **AC-E06** Per-analyst competency: a supervisor views Analyst Competency dashboard showing at least three named analysts with Competent / Under Review / Not Competent status based on trailing 12 months of PT.
- **AC-E07** Lab Performance: a QA officer views a dashboard of all EQA activity for their lab — **Coverage** (landing, with a KPI tile row at the top and the per-analyte coverage matrix below) and **Recent Cycles**. Open EQA-triggered NCEs are surfaced as a KPI tile on Coverage that deep-links to the main NCE register (`?source=eqa`); they are not re-rendered as a dedicated subscreen.
- **AC-E08** All V2 UI is built in `@carbon/react`. No lucide-react or custom utility classes.
- **AC-E09** All V2 UI strings use `t(key, fallback)` and appear in the FRS Localization table.
- **AC-E10** Database migrations are reversible; rollback procedures documented.

### Child stories

1. **V2.1 — Data Model Foundation**
2. **V2.2 — Participant Experience**
3. **V2.3 — Oversight: Per-Analyst + Lab Performance + NCE**
4. **V2.4 — In-House Blinding Workflow**
5. **V2.5 — Provider-Side Program: Prep, Ship, Score + Participant Follow-Up**

### Dependencies

- **Hard:** NCE module (FRS v3.1) merged before V2.3.
- **Hard:** V2.1 migrations land before V2.2, V2.3, V2.4, V2.5 develop UI.
- **Soft:** V2.2 depends on V1 enrollment UI remaining functional during Carbon port.

### Risks

- **R-E01:** Five-story MVP is ambitious for a single release — V2.5 in particular grew to 21 points once prep + ship + receipt monitoring + reprovisioning landed in scope. Mitigation: stories are independently mergeable once V2.1 lands; release can ship V2.1+V2.2+V2.3 first if V2.4/V2.5 slip. Within V2.5, the scoring/distribution/follow-up slice (original scope, FR-V2.5-01..11) is separately mergeable from the prep/ship slice (FR-V2.5-12..16) if needed.
- **R-E02:** In-house blinding workflow competes with the supervisor's existing habit of managing PT in Excel. Mitigation: wizard must be faster than Excel; user testing with at least one deployment before GA.
- **R-E03:** Provider-side MVP panel definition may be insufficient for deployments already accredited to ISO 17043. Mitigation: V3.5 is the proper home for 17043; V2.5 labeled as "baseline, not 17043-complete" — `homogeneity_qc_passed` is an MVP supervisor checkbox, NOT a structured ISO 17043 homogeneity/stability protocol.
- **R-E04:** V2.5 shipment workbench depends on plugging into the existing OpenELIS sample shipment module. Mitigation: dev discovery spike at the start of V2.5 (before UI build) to confirm integration surface; if the existing module is materially insufficient, escalate to scope discussion rather than forking.

---

## STORY V2.1 — EQA Data Model Foundation

**Proposed key:** OGC-EQA-V2.1 (placeholder)
**Type:** Story
**Parent Epic:** EQA V2
**Story points (estimate):** 21 (bumped from 13 after audit — grew from 16 → 22 FRs with state machine, shipment integration spike, and 3 new tables: panel inventory extension, cycle state-transition audit, analyst competency event)
**Labels:** `eqa` `data-model` `migration` `global` `iso-15189` `shipment` `audit`
**Fix Version:** OpenELIS Global 3.3.0

### Summary

Server-side-only foundation: all new entities, columns, enums, constraints, and API endpoints to support V2.2–V2.5. No end-user UI.

### User stories

> As an **OpenELIS engineer**, I want a Cycle/Round entity so that participant orders can be grouped and scored as a unit.
>
> As an **OpenELIS engineer**, I want a separate `eqa_participant_result` entity so that participants have a clean lifecycle independent of the provider's scoring table.
>
> As a **lab running an in-house scheme**, I want the system to permit a scheme with no external provider so that ISO 15189 §7.7.2 alternatives are supported.
>
> As an **OpenELIS engineer**, I want one shared `eqa_panel` table for both in-house and provider use so that panel reporting is unified.

### Functional requirements

**FR-V2.1-01 — Cycle entity.** `eqa_cycle` (`id`, `scheme_id`, `cycle_number`, `cycle_name`, `planned_start_date`, `planned_end_date`, `actual_start_date`, `actual_end_date`, `status`, `created_at`, `created_by`, `updated_at`, `updated_by`). Unique on `(scheme_id, cycle_number)`. Status enum: `planned`, `panel_received`, `testing`, `ready_to_submit`, `submitted`, `scored`, `closed`. **Note:** `ready_to_submit` replaces the earlier `reviewed` state (validation-complete, not signoff-complete — see V2.2 FR-V2.2-05).

**FR-V2.1-02 — Round entity.** `eqa_round` (`id`, `cycle_id`, `round_number`, `distribution_date`, `submission_deadline`, `sample_count`, `status`). Unique on `(cycle_id, round_number)`.

**FR-V2.1-03 — Link existing distribution + order to cycle.** Add nullable `cycle_id` + `round_id` FKs to `eqa_distribution` + `eqa_order`. V1 rows remain NULL.

**FR-V2.1-04 — Cycle state machine.** Permitted transitions: `planned → panel_received → testing → ready_to_submit → submitted → scored → closed`. Invalid transitions: HTTP 409. Auto-transitions triggered on system events (last validated result, FHIR success, score intake). Manual transitions require `eqa.manage`.

**FR-V2.1-05 — Participant result entity.** `eqa_participant_result` (`id`, `cycle_id`, `round_id`, `lab_enrollment_id`, `analyte_id`, `analysis_id` (FK → standard `analysis` row), `result_value`, `result_unit`, `assigned_analyst_id` (nullable), `entered_by`, `entered_at`, `submission_status`, `submitted_at`, `submission_channel`, `manual_submission_reference`, `eqa_result_id` (nullable), `score_received_at`). Unique on `(round_id, lab_enrollment_id, analyte_id)`.

**FR-V2.1-06 — Polymorphic scheme type.** `eqa_scheme.scheme_type` enum: `international_pt`, `regional_pt`, `inter_lab_split`, `in_house`. V1 rows default to `international_pt`. BR-004 becomes conditional: provider required when `scheme_type IN ('international_pt','regional_pt','inter_lab_split')`; nullable for `in_house`.

**Test-domain coverage invariant.** `scheme_type` is the **arrangement-type** axis (who runs the scheme and who participates). The **test-domain** axis (what analyte/method a scheme measures) is carried by the scheme's associated tests/analytes in the standard OpenELIS test catalog — not by a second enum. V2.1 migrations and seed data MUST ensure the test catalog can represent each of the six ePT-validated scheme domains without schema changes: **HIV serology (rapid)**, **HIV viral load (quantitative)**, **early infant diagnosis (qualitative)**, **HIV recency (categorical)**, **COVID-19 (qualitative/quantitative)**, and **tuberculosis (microscopy grade + culture/Xpert qualitative)**. If any of these cannot be configured as a scheme using only test-catalog entries + an `eqa_scheme` row, it is a schema bug to fix in V2.1, not a justification for forking per domain (see ePT crosswalk §3 item A for why fork-per-scheme is the pattern we explicitly avoid).

**FR-V2.1-07 — Test-flag / sample-flag consistency (R5).** Startup validation: if Order `is_eqa_sample = true` but Test catalog flag inconsistent, warn or block per rule in V2.1 `consistency-check.md`.

**FR-V2.1-08 — Per-analyst: eligible-analyst mapping.** New table `eqa_scheme_analyst` (`id`, `scheme_id`, `user_id` FK → `systemuser`, `added_at`, `added_by`). Purpose: opt-in list of lab users who may be recorded as analyst for per-analyst PT samples. If empty for a given scheme, any user may be recorded.

**FR-V2.1-09 — Optional review gate flag.** `eqa_scheme.requires_cycle_review` boolean, default `false`. When true, V2.2 cycle auto-advance halts at `ready_to_submit` until a QA officer explicitly confirms; when false, auto-submission proceeds without human click-through.

**FR-V2.1-10 — Per-analyst scheme flag.** `eqa_scheme.per_analyst` boolean, default `false`. When true, V2.2/V2.3 enforce `assigned_analyst_id` at result entry.

**FR-V2.1-11 — Shared panel entity.** `eqa_panel` (`id`, `scheme_id`, `cycle_id` nullable, `panel_name`, `panel_type` derived from `scheme_type`, `prepared_by`, `prepared_at`, `unblind_date` nullable, `status`). Panel status enum: `preparing`, `sealed`, `distributed`, `unblinded`, `scored`, `closed`. For in-house, `unblind_date` is required and `status` transitions through `sealed → distributed → unblinded`. For provider-side (external schemes), `unblind_date` is NULL and the panel goes `sealed → distributed → scored`.

**FR-V2.1-12 — Panel sample entity.** `eqa_panel_sample` (`id`, `panel_id`, `sample_code` (e.g., "SAMPLE-A01"), `blind_code` nullable (for in-house obfuscation), `analyte_id`, `target_value` (sealed — encrypted-at-rest for in-house until unblinding), `target_unit`, `acceptance_range_low`, `acceptance_range_high`, `source_reference` nullable).

**FR-V2.1-13 — Participant follow-up entity.** `eqa_participant_followup` (`id`, `scheme_id`, `cycle_id`, `participant_org_id` (FK → `organization`), `participant_result_summary_json`, `followup_status` enum: `notified`, `response_received`, `under_investigation`, `resolved`, `escalated`, `removed_from_program`, `notified_at`, `response_received_at`, `assigned_to`, `resolution_notes`, `persistent_failure_flag`). Unique on `(cycle_id, participant_org_id)`.

**FR-V2.1-14 — API endpoints.**
- `GET/POST /api/eqa/cycle` + `PATCH /api/eqa/cycle/{id}/transition`
- `GET /api/eqa/cycle/{id}/transitions` — read-only transition audit (FR-V2.1-21)
- `GET /api/eqa/cycle/{id}/participant-state?lab_enrollment_id=...` — returns computed `participant_state` per FR-V2.1-18 derivation table
- `GET/POST /api/eqa/round`
- `GET/POST/PATCH /api/eqa/participant-result`
- `GET/POST/PATCH /api/eqa/panel` + `POST /api/eqa/panel/{id}/unblind`
- `GET/POST /api/eqa/panel-sample`
- `GET/POST /api/eqa/scheme-analyst`
- `GET/POST/PATCH /api/eqa/participant-followup`
- `GET/POST /api/eqa/panel-receipt` (FR-V2.1-20) — service-layer also updates matching `sample_shipment` row transactionally
- `GET/POST/PATCH /api/sample-shipment` — existing OpenELIS endpoint; V2.5 writes use this directly (FR-V2.1-19 plug point)
- `POST /api/eqa/analyst-competency-event` — internal write only (service code, not end-user) (FR-V2.1-22)
- `GET /api/eqa/analyst-competency-event?analyst_id=...&scheme_id=...&since=...` — V2.3 Analyst Competency read path
- `POST /api/eqa/panel/{id}/label-sheet` (FR-V2.4-13) — generates PDF label sheet; returns PDF binary

All permissions per existing BR-010 + new `eqa.manage`, `eqa.enter`, `eqa.review`, `eqa.triage`, `eqa.inhouse`, `eqa.provider`, `eqa.provider.ship`, `eqa.signoff` (latter only when `requires_cycle_review = true`).

**FR-V2.1-15 — Audit trail.** All writes captured by existing OpenELIS audit framework (`audit_log` table).

**FR-V2.1-16 — Sealed target-value storage.** For in-house panels (`scheme.scheme_type = 'in_house'`), `eqa_panel_sample.target_value` MUST be encrypted at rest using the existing OpenELIS encryption provider until the parent panel's status = `unblinded`. Read-only enforcement: attempting to read `target_value` before unblind returns a cryptic identifier, not the plaintext.

**FR-V2.1-17 — Panel source + inventory fields (supports V2.5 prep + ship).** Extend `eqa_panel` with:
- `source_type` enum: `in_house_aliquoted` | `vendor_sourced` | `mixed`. NULL permitted for `scheme_type = 'in_house'` (V2.4 blinded in-house panels use a separate flow).
- `lot_number` (provider-assigned for in-house aliquoting; vendor-supplied for vendor-sourced).
- `vendor_name`, `vendor_lot`, `vendor_certificate_ref` (nullable; required when `source_type IN ('vendor_sourced','mixed')`).
- `aliquots_produced` int, `aliquots_reserved` int (held back for repeat testing / FR-V2.5-15), `aliquots_shipped` int. Invariant: `aliquots_produced ≥ aliquots_reserved + aliquots_shipped`.
- `storage_temp` enum: `ambient` | `refrigerated_2_8C` | `frozen_-20C` | `ultra_frozen_-80C` | `dry_ice`.
- `expiration_date` (required when `source_type = 'vendor_sourced'`; optional for in-house).
- `homogeneity_qc_passed` boolean default `false`. Gate: cycle cannot transition from `prep_in_progress` → `ready_to_ship` until `true`. MVP version is a supervisor checkbox + free-text notes; V3.5 replaces this with structured ISO 17043 homogeneity + stability testing.

**FR-V2.1-18 — Provider cycle state machine (replaces FR-V2.1-04 for provider-side cycles).** When `scheme.scheme_type IN ('international_pt', 'regional_pt', 'inter_lab_split')` and the current lab is the provider (administrator), `eqa_cycle.status` uses the extended state machine: `planned → prep_in_progress → ready_to_ship → shipped → delivered → submissions_open → submissions_closed → scoring → scored → closed`. Transitions:
- `planned → prep_in_progress`: auto on panel-wizard confirm (V2.5 FR-V2.5-02 Step 5).
- `prep_in_progress → ready_to_ship`: requires `eqa_panel.homogeneity_qc_passed = true` + `aliquots_produced ≥ participant_count + reserved_count`.
- `ready_to_ship → shipped`: when at least one shipment record has `shipped_date` populated; moves to `shipped` on first ship, not on "all shipped".
- `shipped → delivered`: when every expected shipment has `actual_delivery_date` (from participant-side receipt event per V2.2) OR provider manually confirms.
- `delivered → submissions_open`: auto-transition; participants can submit from the `shipped` state onward in practice, but provider-side view awaits delivered confirmation.
- `submissions_open → submissions_closed`: auto at `submission_deadline`, OR all expected submissions received, whichever first.
- `submissions_closed → scoring → scored → closed`: scoring per FR-V2.5-03/04; closed is final.
  
Participant-side view continues to use the existing V2.1 FR-V2.1-04 states (`panel_received → testing → ready_to_submit → submitted → scored → closed`) which overlay the provider cycle state for that participant's distribution.

**Per-lab participant state is derived, not stored.** `eqa_cycle.status` is a single column describing provider-side state. For a cycle with N participating labs, each lab's view of the cycle is computed as follows (no physical per-lab state column — avoids a second source of truth to keep in sync with results):

| Physical evidence | Derived participant-side state |
|---|---|
| No `eqa_panel_receipt` row for `(cycle_id, lab_enrollment_id)` | `planned` (from this lab's view, even if provider cycle is `shipped`/`delivered`) |
| `eqa_panel_receipt` row exists AND no `eqa_participant_result` rows | `panel_received` |
| Any `eqa_participant_result` row with `submission_status` IN (`draft`, `validated_partial`) | `testing` |
| All analytes validated; none submitted | `ready_to_submit` |
| Any `submission_status = 'submitted'` | `submitted` (until provider scores) |
| Any `submission_status = 'scored'` | `scored` |
| Provider cycle state = `closed` | `closed` |

This derivation runs at query time in the V2.2 My Cycles list and the cycle detail view. Service layer exposes it as a computed field `participant_state` on the participant cycle DTO — not persisted, no migration needed.

**FR-V2.1-19 — Shipment record (supports V2.5 FR-V2.5-15).** Per-shipment record covering prep + logistics. **Plug point:** Re-use OpenELIS's existing sample shipment / tracking module (used today for referrals — Vector referral + deconvolution path per `env-vector-workflows.md`) rather than a parallel `eqa_shipment` table. Dev discovery needed to confirm exact integration surface, but the expected approach is: each per-participant distribution references a `sample_shipment` row with fields `courier`, `tracking_number`, `shipped_at_temp`, `shipped_date`, `expected_delivery_date`, `actual_delivery_date`, `delivery_status`, `pack_list_pdf_ref`, `shipping_label_pdf_ref`, `repeat_of_shipment_id` nullable (for FR-V2.5-15 reprovisioning). If an EQA-specific overlay is needed (e.g., for temperature excursion flags), it lives in a thin `eqa_shipment_overlay` table FK'd to `sample_shipment`, not a clone.

**FR-V2.1-20 — `eqa_panel_receipt` table (supports V2.2 FR-V2.2-12 + V2.5 FR-V2.5-14).** New table capturing participant-side confirmation that the panel arrived. Columns:

- `id` (PK)
- `cycle_id` (FK → `eqa_cycle`, NOT NULL)
- `lab_enrollment_id` (FK → `lab_enrollment`, NOT NULL) — the participating lab
- `shipment_id` (FK → `sample_shipment`, NULLABLE) — populated when a matching shipment row exists; null for panels received without a tracked shipment (walk-in pickup, legacy imports)
- `received_date` (DATE, NOT NULL)
- `received_by` (FK → `user`, NOT NULL)
- `received_temp_c` (DECIMAL, NULLABLE) — unvalidated in V2.2; V3.2 adds range validators vs. panel `storage_temp`
- `integrity_ok` (BOOLEAN, NOT NULL, DEFAULT `true`)
- `integrity_notes` (TEXT, NULLABLE) — required at application layer when `integrity_ok = false`
- `notes` (TEXT, NULLABLE)
- Standard audit columns: `created_at`, `created_by`, `updated_at`, `updated_by`, `version`.

Uniqueness constraint: `(cycle_id, lab_enrollment_id)` — one receipt per cycle per participating lab. API trigger: on insert, service-layer also updates the matching `sample_shipment.actual_delivery_date` and `delivery_status = delivered` when `shipment_id` is set (transactional; see AC-V2.2-13). Rejection workflow (`panel_rejected` state + auto-reprovision trigger) parked in V3.2.

**FR-V2.1-21 — `eqa_cycle_state_transition` audit table.** Cycle state changes (both participant and provider state machines per FR-V2.1-04 / FR-V2.1-18) are captured in a dedicated audit table rather than inferred from the generic `audit_log`. Generic `audit_log` tracks column writes but loses the *why* — an ISO 15189 §7.7 accreditor reviewing a cycle's timeline needs to distinguish a manual QA-officer override from an automatic timer-expiry transition, and that distinction isn't recoverable from column-level diffs. Columns:

- `id` (PK)
- `cycle_id` (FK → `eqa_cycle`, NOT NULL)
- `prior_state` (TEXT — the state enum value before transition; TEXT rather than ENUM because provider and participant state machines use different enums and this table records both)
- `new_state` (TEXT)
- `state_machine` enum: `participant` | `provider` — disambiguates which machine is transitioning (relevant for multi-lab cycles where both can progress on different timelines)
- `trigger_type` enum: `auto` | `manual` — auto = system event; manual = user action
- `trigger_event` enum: `last_validated_result` | `fhir_submit_success` | `fhir_submit_failure_retry` | `score_intake` | `deadline_timer` | `all_shipments_delivered` | `all_submissions_received` | `panel_seal` | `panel_unblind` | `homogeneity_qc_passed` | `manual_override` | `scheduled_job`
- `triggered_by` (FK → `systemuser`, NULLABLE — populated when `trigger_type = manual`, NULL for auto)
- `reason` (TEXT, NULLABLE — required when `trigger_type = manual` AND transition is off the happy path, e.g., manual unblind before scheduled date)
- `occurred_at` (TIMESTAMP, NOT NULL)

Index on `(cycle_id, occurred_at)` for timeline queries used by the V2.5 FR-V2.5-16 cycle-timeline Accordion. Read-only API: `GET /api/eqa/cycle/{id}/transitions`. No update or delete endpoints — audit records are immutable.

**FR-V2.1-22 — `eqa_analyst_competency_event` table.** The V2.3 Analyst Competency dashboard (FR-V2.3-06) needs a stable data source that's richer than `eqa_participant_result` alone. A result with `submission_status = 'missed_deadline'` has NULL `result_value` and NULL `z_score` — it isn't really a "result," it's an absence-of-result event. V2.4 FR-V2.4-14 and V2.3 Follow-Up Queue triage (per fix H below) also need to emit non-result events (escalate-to-NCE, dismiss-with-reason). Columns:

- `id` (PK)
- `analyst_id` (FK → `systemuser`, NOT NULL)
- `event_type` enum — see allowed values below
- `event_date` (DATE, NOT NULL)
- `scheme_id` (FK → `eqa_scheme`, NOT NULL)
- `cycle_id` (FK → `eqa_cycle`, NULLABLE — null for cross-cycle events; populated for per-cycle events)
- `participant_result_id` (FK → `eqa_participant_result`, NULLABLE — populated when event derives from a specific result)
- `analyte_id` (FK → `analyte`, NULLABLE)
- `nce_id` (FK → `nce`, NULLABLE — populated for `escalated_to_nce` events)
- `dismissal_category` (TEXT, NULLABLE — mirrors FR-V2.3-02 dismissal category enum for `dismissed_*` events)
- `notes` (TEXT, NULLABLE)
- Standard audit columns: `created_at`, `created_by`.

**`event_type` enum values** (defined here as the single source of truth; other FRs reference these strings):
- `external_missed_deadline` — external-provider PT cycle where this analyst was assigned and the cycle deadline passed without a validated result from this analyst
- `in_house_missed_deadline` — V2.4 FR-V2.4-06 late-entry path; written by the in-house unblind job
- `unacceptable_score` — written when `eqa_participant_result.performance_status = 'unacceptable'` is set AND `assigned_analyst_id` is populated
- `questionable_score` — written when `performance_status = 'questionable'`
- `escalated_to_nce` — written by V2.3 FR-V2.3-02 "Escalate to NCE" action; references the created `nce_id`
- `dismissed_equipment` — written by V2.3 FR-V2.3-02 dismiss with `known_equipment_issue` or `pending_re_test` (NOT counted against analyst competency in dashboard rollup)
- `dismissed_transcription` — written by V2.3 FR-V2.3-02 dismiss with `transcription_error` (IS counted against analyst competency — transcription is within analyst scope)
- `dismissed_acceptable_on_review` — written by V2.3 FR-V2.3-02 dismiss with `acceptable_on_review` (NOT counted)
- `dismissed_other` — written by V2.3 FR-V2.3-02 dismiss with `other` (counted — ambiguous, requires supervisor review)

Index on `(analyst_id, event_date)` for the per-analyst timeline. API: `POST /api/eqa/analyst-competency-event` (internal only — only service code writes this, no direct user create), `GET /api/eqa/analyst-competency-event?analyst_id=...`.

### Non-functional

- **Migration reversibility.** Each migration paired with a rollback script; tested on empty DB + V1-loaded DB.
- **Performance.** Index `eqa_participant_result (cycle_id, lab_enrollment_id, submission_status)`, `eqa_participant_followup (scheme_id, participant_org_id)`, `eqa_panel (scheme_id, cycle_id, status)`.
- **Data integrity.** FKs `ON DELETE RESTRICT` for cycle/panel FKs.

### Acceptance criteria

- **AC-V2.1-01** Migrations succeed on V1-loaded DB; no existing EQA data corrupted.
- **AC-V2.1-02** Rollback restores V1 schema exactly.
- **AC-V2.1-03** Creating `in_house` scheme without provider returns 201.
- **AC-V2.1-04** Creating `international_pt` scheme without provider returns 422 (i18n key `error.eqa.providerRequired`).
- **AC-V2.1-05** Cycle transition `planned → testing` (skipping `panel_received`) returns 409.
- **AC-V2.1-06** Participant result in `draft` can be updated; `submitted` cannot (409).
- **AC-V2.1-07** `eqa_panel_sample.target_value` cannot be read via any API when parent panel is `sealed` or `distributed`; only `unblinded` or later.
- **AC-V2.1-08** `eqa_scheme_analyst` add + remove works; empty list does not block result entry.
- **AC-V2.1-09** `eqa_participant_followup` uniqueness on `(cycle_id, participant_org_id)` enforced (duplicate insert returns 409).
- **AC-V2.1-10** All audit-log entries for new tables include user, timestamp, action, changed fields.
- **AC-V2.1-11** Panel inventory invariant (FR-V2.1-17): a `PATCH /api/eqa/panel/{id}` attempting to set `aliquots_produced` < (`aliquots_reserved` + `aliquots_shipped`) returns 422 with i18n key `error.eqa.panel.aliquotsInvariant`.
- **AC-V2.1-12** Vendor-sourced panel (FR-V2.1-17): creating a panel with `source_type = 'vendor_sourced'` and NULL `vendor_name` / NULL `vendor_lot` returns 422.
- **AC-V2.1-13** Provider state machine (FR-V2.1-18): transitioning `prep_in_progress → ready_to_ship` with `homogeneity_qc_passed = false` returns 409 (same for `aliquots_produced < participant_count + reserved_count`).
- **AC-V2.1-14** Provider state machine auto-transitions: seeded cycle with all shipments having `actual_delivery_date` populated auto-advances provider state to `delivered` within 30s.
- **AC-V2.1-15** Participant state derivation (FR-V2.1-18 per-lab table): `GET /api/eqa/cycle/{id}/participant-state?lab_enrollment_id=X` returns `planned` when no receipt row exists, `panel_received` when receipt exists but no results, `testing` when any result is `draft`, matching the derivation table exactly (8 seeded cases).
- **AC-V2.1-16** Shipment plug point (FR-V2.1-19): V2.5 shipment writes go to `sample_shipment` (not a new `eqa_shipment` table); an EQA shipment appears in the existing sample-shipment module's list view alongside referrals.
- **AC-V2.1-17** Receipt side-effect (FR-V2.1-20): inserting `eqa_panel_receipt` with a populated `shipment_id` transactionally sets `sample_shipment.actual_delivery_date = received_date` and `delivery_status = 'delivered'` in a single transaction (verified by rollback test — if receipt insert fails, shipment row is unchanged).
- **AC-V2.1-18** Receipt uniqueness (FR-V2.1-20): second `POST /api/eqa/panel-receipt` for the same `(cycle_id, lab_enrollment_id)` returns 409.
- **AC-V2.1-19** State-transition audit (FR-V2.1-21): manual provider-state transition `delivered → submissions_open` records a row with `trigger_type = 'manual'`, `triggered_by = user_id`, `trigger_event = 'manual_override'`, and non-null `reason` (reason required at API layer — 422 if absent).
- **AC-V2.1-20** State-transition immutability (FR-V2.1-21): `PUT /api/eqa/cycle/{id}/transitions/{tid}` and `DELETE` return 405.
- **AC-V2.1-21** Analyst competency event write (FR-V2.1-22): direct `POST /api/eqa/analyst-competency-event` from a non-service user returns 403 (write-only-internal); service-code write from V2.4 unblind job persists correctly and appears in `GET` query.
- **AC-V2.1-22** Event type enum (FR-V2.1-22): attempting to write an `event_type` value not in the defined enum (e.g., `event_type = 'unknown'`) returns 422.
- **AC-V2.1-23** Test-domain coverage (FR-V2.1-06 invariant): V2.1 seed data includes one runnable scheme scenario per ePT-validated test domain — HIV serology (rapid), HIV viral load (quantitative log10 c/mL), early infant diagnosis (qualitative), HIV recency (categorical), COVID-19 (qualitative + quantitative), TB microscopy (semi-quantitative grade) + TB molecular (qualitative Xpert/culture) — each configurable using only standard test-catalog entries + one `eqa_scheme` row, with no domain-specific schema branches. Attempting to configure any of the six without schema changes is verified in an integration test.

### Definition of Done

- [ ] Migrations + rollback tested; peer-reviewed.
- [ ] APIs implemented + unit tests + integration tests (≥ 80% branch coverage).
- [ ] Swagger/OpenAPI updated.
- [ ] `docs/eqa/cycle-state-machine.md` + `docs/eqa/panel-state-machine.md` published (covers BOTH participant and provider state machines per FR-V2.1-18 + the per-lab derivation table).
- [ ] `docs/eqa/analyst-competency-events.md` published (event_type enum + which events count against competency — per FR-V2.1-22).
- [ ] `docs/eqa/state-transition-audit.md` published (FR-V2.1-21 audit table contract + accreditor-facing timeline example).
- [ ] `docs/eqa/test-domain-catalog.md` published: documents the six ePT-validated test domains (HIV serology, HIV VL, EID, HIV recency, COVID-19, TB) with seed-data scheme examples proving each can be represented without schema changes (per AC-V2.1-23 / FR-V2.1-06 invariant).
- [ ] `docs/migrations/eqa-v2.md` published.
- [ ] i18n keys added to en.json.
- [ ] No end-user UI changes (server-side only).
- [ ] Merged to `3.3.0` release branch.

---

## STORY V2.2 — Participant Experience

**Proposed key:** OGC-EQA-V2.2 (placeholder)
**Type:** Story
**Parent Epic:** EQA V2
**Story points (estimate):** 9
**Labels:** `eqa` `carbon` `i18n` `fhir` `global` `iso-15189` `participant`
**Fix Version:** OpenELIS Global 3.3.0
**Depends on:** V2.1

### Summary

Participant-side UI for a lab enrolled in one or more EQA schemes (external PT OR in-house). Carbon-port of V1 enrollment; new Cycle progress dashboard that links out to **standard OpenELIS result entry**; auto-submit via FHIR when the cycle is validation-complete; manual-submit fallback; score intake surfacing. No parallel result entry surface — validation-gate is inherited from standard pipeline.

### Background — read this if EQA is new to you

This section is a plain-language primer for anyone picking up V2.2 work without clinical-laboratory domain knowledge. If you already know what EQA is, skip to User stories.

**What EQA is.** Every lab result a clinician reads turns into a decision: treat, don't treat, change the drug, run more tests. Those decisions are only as good as the result is trustworthy. **External Quality Assessment (EQA)** — also commonly called **Proficiency Testing (PT)** — is the routine practice of sending the same blind samples through a lab's bench that a trusted outside party already knows the answer to, and comparing. If the lab's answer matches, the bench is in control. If it doesn't, you've caught a problem before it reached a patient. EQA is a hard requirement for ISO 15189 accreditation (§7.7) and, for many tests in many countries, a regulatory requirement.

**How EQA is organized.** A lab typically participates in several EQA programs at once, one per analyte family: HIV viral load, CD4 count, TB drug resistance, malaria microscopy, HbA1c, basic chemistry, etc. Each program is run by an **external provider** — WHO AFRO, CDC, a national reference lab, a commercial PT provider — on a fixed schedule (monthly, quarterly, semi-annual). Each scheduled delivery of blind samples is called a **cycle**. A lab might run 30+ cycles in a year across all the programs it's enrolled in.

**What an enrollment is.** An enrollment is the long-lived subscription relationship between this lab and one external PT program. It says, in effect: *"We participate in WHO AFRO's HIV Viral Load program; our subscriber ID with them is `AFRO-HIV-2024-117`; the Virology bench runs these samples; these analysts are eligible to enter results; we expect cycles quarterly."* Enrollments are durable — a lab might stay enrolled in a WHO program for a decade. Cycles come and go *inside* an enrollment.

The My Enrollments screen is where the QA officer manages this enrollment catalog: view the current subscriptions, add a new one when the lab signs up with a new provider or brings a new bench online, edit when a subscriber ID changes or an analyte is added/removed, and end an enrollment when the lab drops a program.

**Why the lab cares (the real-world stakes).**
- **Accreditation.** An ISO 15189-accredited lab must have EQA coverage for every analyte it reports clinically. An unenrolled analyte is a finding on the auditor's report — sometimes a blocking one. §7.7.2 allows an "alternative assessment" where no external scheme exists, but the lab still has to *prove* they're doing something.
- **Regulation.** For high-stakes public-health tests (HIV diagnosis, TB drug resistance, malaria species ID), the national reference lab's PT is usually mandatory; dropping out can cost the lab its license to perform the test.
- **Clinical safety.** A bench that's in control on PT is a bench whose patient results the clinicians can trust. A bench that starts drifting on PT is one the lab director wants to know about before a patient is misdiagnosed.

An enrollment that's missing, lapsed, or mis-configured translates directly into accreditation risk, regulatory risk, and ultimately patient-safety risk. This screen is quiet but load-bearing.

#### Walkthrough — Maria adds a new HbA1c enrollment

Maria is the QA officer at Kisumu District Reference Lab. It's Monday morning. She has coffee. She opens OpenELIS.

1. **Routine check.** The sidebar shows a "My EQA" badge with 5 active cycles, one of them late. She'll get to those in a minute. First, though, she remembers the lab stood up a new HbA1c bench last week as part of a diabetes-care expansion. She needs to get that bench under PT coverage before the next accreditation audit.

2. **Opens My Enrollments.** Under **My EQA → My Enrollments** she sees the lab's current 7 enrollments in a DataTable: WHO AFRO HIV VL, NHRL Kenya TB GeneXpert, NTRL Malaria Microscopy, NMCP Malaria RDT, in-house CD4 cross-bench, in-house PBS microscopy, and a basic-chemistry scheme from CDC. Each row shows the scheme name, provider, scheme type badge (`International PT` / `Regional PT` / `In-house` / `Split-sample`), bench/section, subscriber ID, cycle frequency, and status (`Active` / `Suspended` / `Withdrawn`). HbA1c is conspicuously missing.

3. **Clicks "Add enrollment."** A form opens. The first field is a scheme picker — she selects **CDC HbA1c PT** from the catalog. The catalog itself is populated upstream by the EQA admin via Schemes & Programs; analytes and default cycle frequency for each scheme are pre-configured, so Maria doesn't have to re-enter them.

4. **Fills in lab-specific fields.**
   - **Subscriber ID:** `CDC-HBA1C-KDRL-2026-044` — the ID CDC assigned when Maria's lab signed the agreement last week.
   - **Section / bench:** Chemistry / HbA1c bench (newly created last week).
   - **Eligible analysts:** `M. Odhiambo`, `L. Wekesa` — the two techs trained on the new Bio-Rad D-100. When cycle samples arrive, only these two can be recorded as the analyst on result entry.
   - **Cycle frequency:** Quarterly (pre-filled from scheme config; she doesn't change it).
   - **Status:** Active.

5. **Saves.** The new enrollment appears in the list. Status `Active`. Next expected cycle: Q3 2026, approximately August.

6. **That's it.** When CDC ships their August panel, OpenELIS will auto-create a cycle against this enrollment; it'll appear in **My Cycles** for the bench techs to run, and the samples will flow through standard result entry with the EQA flag and the per-analyst column. Come December's accreditation audit, Maria can point to this enrollment row as documented PT coverage for HbA1c, starting April 2026.

Total time: under two minutes. What she has accomplished, in compliance terms, is adding a documented link between her new HbA1c bench and an external PT provider, such that the next auditor who asks "what proves you're in control on HbA1c?" has an answer. That's what this screen is for.

**Note on implementation status:** Mozzy has already built the My Enrollments screen in `@carbon/react`, preserving the field set and lifecycle of the V1 `eqa-enrollment.jsx` reference. This story captures the surrounding spec, domain context, and acceptance criteria — it exists so QA testers, reviewers, and downstream developers on V2.2 Cycles / V2.3 Coverage / V2.5 Provider-side work have the same mental model of what enrollments are and what they're for.

### User stories

> As a **QA officer**, I want to see all my lab's EQA enrollments in one place so I can verify at a glance which schemes we're subscribed to and tell whether every clinically-reported analyte has PT coverage.
>
> As a **QA officer**, I want to add a new enrollment when my lab signs up for an external PT program so that future cycles arrive into OpenELIS automatically without manual per-cycle setup.
>
> As a **QA officer**, I want to edit an existing enrollment (update subscriber ID after a provider reissues credentials, reassign the bench/section when a new instrument comes online, add or remove analytes, change the eligible-analyst list) without re-creating the subscription from scratch.
>
> As a **QA officer**, I want to end an enrollment (set status to Withdrawn with an effective date and reason) when my lab stops participating in a program — so it doesn't show up in coverage calculations or quietly generate phantom future cycles.
>
> As a **lab director**, I want enrollments linked to the lab's sections/benches so I can see which parts of my operation are PT-covered and which aren't — a coverage gap that an auditor will find eventually.
>
> As a **bench tech**, I want the enrollment's eligible-analyst list to pre-populate the per-analyst column on standard result entry when a PT cycle's samples come through — so I don't have to remember who's cleared to sign off on PT for this bench.
>
> As a **lab technician**, I want to see my active PT cycles in one list so I know what's due and where to click to enter results.
>
> As a **bench tech**, I want EQA samples to appear in my normal result entry queue so I don't need a separate workflow for PT.
>
> As a **QA officer**, I want the cycle to submit automatically once all results are validated so I don't have to click through a ceremonial sign-off; and I want to optionally enable a review gate for schemes where my accreditation body requires it.
>
> As a **QA officer**, I want to see scores come back from the provider with performance status so I can close the loop.

### Design brief (per Constitution Principle 7)

- **Purpose:** Give the participating lab a single-system view of all PT activity, driven by the standard OpenELIS pipeline.
- **Primary user action:** Open a cycle, see what's left to enter, click into standard result entry.
- **Layout pattern:** Three-lane sidebar — **My EQA** (participant daily workflow), **EQA Oversight** (participant-side QA view), **EQA Program Management** (provider-role only). Submenus, not in-page Carbon Tabs, for multi-view screens. Lab Performance has two submenu children in fixed order: Coverage → Recent Cycles. Summary-level KPIs render as a tile row at the top of the **Coverage** screen (one merged accreditation-snapshot view), not as a separate subscreen. EQA-triggered NCEs are not a separate screen — they live in the main NCE register and are reached via the KPI tile on Coverage (deep-link with `?source=eqa` filter). See crosswalk §7.2.9.
- **Interaction model:** Cycle list with inline expansion showing analyte-level progress (✓ / ○ / ⏳). Links out to standard result entry with sample pre-selected.
- **Scope boundary:** Does NOT reinvent result entry. Does NOT gate on sign-off by default. Does NOT cover oversight dashboards (V2.3), in-house panel creation (V2.4), or provider-side work (V2.5).
- **Carbon components:** `SideNav`, `DataTable`, `Tile`, `Tag`, `Button`, `InlineNotification`, `Breadcrumb`.

### Functional requirements

**FR-V2.2-01 — Carbon port of My EQA lane + enrollment screens.** Rebuild `eqa-enrollment.jsx` (My Enrollments, Enroll in New Scheme) in `@carbon/react` under the **My EQA** sidebar lane. Preserve the V1 field set and the Active / Suspended / Withdrawn lifecycle. No lucide-react. The sidebar itself moves to the refined 3-lane IA (My EQA / EQA Oversight / EQA Program Management) — see crosswalk §7.2.9.

*Implementation status: already built in `@carbon/react` by Mozzy against the V1 reference. The following spec exists so QA and downstream developers have a shared model.*

**My Enrollments list (`/eqa/participant/enrollments`).** Carbon DataTable. One row per `lab_enrollment`. Columns: Scheme (scheme name + provider + `scheme_type` Tag), Section/Bench, Subscriber ID, Cycle frequency, Eligible analyst count (link to detail), Status Tag (`Active` / `Suspended` / `Withdrawn`), Actions (Edit, Suspend/Resume, Withdraw). Empty state ("No enrollments yet — click Enroll to add one") with primary button.

**Enroll in New Scheme (modal or `/eqa/participant/enrollments/new`).** Two steps:
1. **Scheme picker.** ComboBox sourced from `eqa_scheme` table, filtered to schemes the lab isn't already enrolled in; shows name, provider, `scheme_type`, default frequency, covered analytes (read-only preview).
2. **Lab-specific fields.** Subscriber ID (text, required, no format validation — provider IDs vary), Section/bench (Select, pulled from OpenELIS sections/benches), Eligible analysts (MultiSelect from `systemuser`, optional — empty list means any user), Cycle frequency (Select, defaults from scheme config, editable only if scheme allows override), Start date (defaults today), Notes (TextArea, optional).

**Edit enrollment.** All lab-specific fields editable. Scheme and provider not editable — if the lab moves to a new provider for the same analyte, that's a Withdraw + new Enroll, not an in-place edit (preserves audit trail + keeps historical cycles correctly attributed).

**Lifecycle transitions:**
- `Active → Suspended` (reason + effective date required; no new cycles auto-generate while suspended; historical cycles remain attributed to the enrollment).
- `Suspended → Active` (resume; new cycles resume auto-generating).
- `Active / Suspended → Withdrawn` (reason + effective date required; terminal state for this enrollment; historical cycles remain for audit).
- All transitions audit-logged with user, timestamp, prior state, reason.

**Coverage feedback.** List view shows a summary tile above the table: *"X sections covered · Y analytes covered · Z clinically-reported analytes with no coverage"* where Z is computed against the lab's test catalog. Clicking Z deep-links to the Lab Performance Coverage screen (V2.3) filtered to uncovered analytes. If V2.3 isn't deployed yet, Z is shown as a static count without the link.

**FR-V2.2-02 — My Cycles list.** `/eqa/participant/cycles`. DataTable with scheme name (+ `scheme_type` badge), cycle number, status Tag, deadline, progress bar (X of Y validated), NCE badge (if V2.3 opened one), Actions.

**Filter bar (required, default = Active):** the table must have a filter bar that scopes the list by cycle state so it remains usable as cycle history accumulates. Four status buckets mapping to `eqa_cycle.status`:

- **Active** (default) — `planned`, `panel_received`, `testing`, `ready_to_submit`. Hint text: "Work in flight — upcoming, testing, or ready to submit."
- **Awaiting scores** — `submitted`. Hint: "Submitted to provider; waiting for scoring."
- **Completed** — `scored`, `closed`. Hint: "Scored or closed."
- **All** — everything. Hint: "Every cycle this lab has ever touched."

The bucket dropdown label must include the count per bucket (e.g., "Active (7)"). Additional filters:

- **Scheme type** — `international_pt` / `regional_pt` / `inter_lab_split` / `in_house` / All.
- **Search** — free-text match on scheme name, provider, and cycle number.
- **Clear filters** link appears when any filter is off its default.
- **Result count** ("Showing N of M cycles") in the filter bar.

Lab-wide KPI tiles (Active cycles / Ready to submit / Awaiting scores / Open EQA-linked NCE) sit **above** the filter bar and do **not** respond to table filters — they describe the whole-lab state so they don't shift around when the user narrows the view.

Empty state: when filters match zero rows, show a centered "No cycles match these filters" row with an inline Clear-filters action.

**FR-V2.2-03 — Cycle progress dashboard (inline row expansion).** Expanding a cycle row shows a nested progress view: one row per expected analyte per sample. Columns: Sample code, Analyte, **Entry status** (Not entered / Draft / Validated — derived from linked `analysis` row in the standard pipeline), **Assigned analyst** (only when scheme `per_analyst = true`), Link-out button "Enter in Results →" that deep-links to the standard result entry page with the sample pre-selected and the correct section/bench pre-filtered. **No nested entry form — this is a progress view.**

**FR-V2.2-04 — Cycle auto-advance on validation-complete.** When the last expected analyte in a cycle transitions to Validated in the standard pipeline, the cycle's status transitions: `testing → ready_to_submit` automatically. System emits a domain event for the submission flow (FR-V2.2-05).

**FR-V2.2-05 — Auto-submission via FHIR.** On `ready_to_submit`:
- If the scheme's provider has a configured FHIR endpoint AND `requires_cycle_review = false`: system attempts POST of DiagnosticReport bundle within a configurable window (default 1 hour — gives a window for last-moment manual correction). Success → transition cycle to `submitted`, participant results to `submitted`, `submission_channel = 'fhir'`. Failure → cycle stays at `ready_to_submit`; create an Alerts entry (existing Alerts module, BR-017 addendum) with kind `eqa_submission_failed`; retry on exponential backoff up to 5 attempts.
- If `requires_cycle_review = true`: auto-submission is gated on explicit QA officer confirmation (see FR-V2.2-07).

**FR-V2.2-06 — Manual-submit fallback.** On the cycle page at `ready_to_submit`, if (a) the scheme has no FHIR endpoint, OR (b) FHIR has failed 5 times, OR (c) the QA officer chooses manual at any point: the "Mark as submitted manually" action becomes available. Requires non-empty `manual_submission_reference`. Offers a "Generate export bundle" action that produces a PDF + CSV for the lab to upload/email to the provider's portal.

**FR-V2.2-07 — Optional cycle-review gate (off by default).** When `eqa_scheme.requires_cycle_review = true`, the cycle page shows a dedicated "Review & Submit" panel at `ready_to_submit`. QA officer sees a read-only summary of all validated results (grouped by sample) and clicks "Submit to provider" to trigger FR-V2.2-05's FHIR attempt. No password re-auth, no signoff ceremony — this is a single acknowledgement click because validation has already captured the reviewer's identity in the standard audit trail. Only shown when the flag is on.

**FR-V2.2-08 — Score intake.** When the provider returns scores (FHIR inbound, CSV import, or manual entry by QA officer), each matching `eqa_participant_result` receives `eqa_result_id`, `submission_status = 'scored'`, `score_received_at`; cycle transitions `submitted → scored`. The cycle page surfaces z-score + performance status (from V1 DM-004 `z_score`, `performance_status`) per analyte.

**FR-V2.2-09 — Empty/loading/error states.** Standard Carbon skeletons; empty state with link to enroll; InlineNotification for errors.

**FR-V2.2-10 — i18n.** `eqa.participant.*` and `eqa.cycle.*` namespaces. All strings via `t()`.

**FR-V2.2-11 — Accessibility.** WCAG 2.1 AA. axe-core scan zero critical.

**FR-V2.2-12 — Panel receipt event (minimal MVP).** On the cycle page, when `eqa_cycle.status = 'planned'` and the participant knows a panel shipment is en route (provider has recorded a shipment via V2.5 FR-V2.5-13; for non-FHIR providers, the lab QA officer knows from out-of-band comms), render a "Confirm panel received" action. Clicking opens a Modal with:
- **Received date** (DatePicker, default today, required).
- **Received by** (Select — populated from `systemuser`, defaults to current user, required).
- **Shipment reference** (optional; auto-filled from the inbound provider-side shipment record if matched via FHIR `ShipmentNotification` event, otherwise free-text).
- **Temperature on arrival** (optional NumberInput — no validation range in MVP; V3.2 adds the expected-range validator).
- **Integrity OK?** (Checkbox, default true; uncheck reveals a required free-text "Integrity notes" field).
- **Notes** (optional).

On save: transition `eqa_cycle.status` `planned → panel_received`; write `eqa_panel_receipt` row (per V2.1 FR-V2.1-20); if an inbound `sample_shipment` record is matched, set its `actual_delivery_date` (satisfies V2.5 FR-V2.5-14 `delivered` state contract); emit FHIR `ShipmentDelivery` outbound event for the provider to receive. Idempotent: if a receipt event already exists for this cycle, the action is "Edit receipt" instead of "Confirm received." MVP scope explicitly excludes the rejection / `panel_rejected` workflow and the structured cold-chain validators — both live in V3.2.

**FR-V2.2-13 — FHIR ShipmentDelivery outbound.** When a panel receipt is confirmed via FR-V2.2-12 AND the cycle's scheme has a configured provider FHIR endpoint, emit an outbound FHIR event (shape TBD in dev discovery — expected: `Communication` or `Task` update referencing the provider's original shipment record). Failure is non-fatal (logged + retried via same exponential backoff as FR-V2.2-05); provider-side can still manually confirm delivery via V2.5 FR-V2.5-14.

**FR-V2.2-14 — Submission-deadline reminder emails.** A scheduled job (default: daily at lab-local 08:00; cron configurable per instance) identifies every `eqa_cycle` where ALL of the following hold: (a) status is `panel_received` OR `testing` OR `ready_to_submit` (i.e., panel is in the lab but nothing has been submitted yet — `scored` and later are excluded; `planned` is excluded because the panel hasn't been confirmed received); (b) `submission_deadline - now <= 3 days` (threshold configurable via `eqa.participant.reminder.leadTimeDays`, default 3; set to 0 to disable); (c) no email has already been sent to this lab for this cycle within the last 24h (dedup window configurable). For each qualifying cycle, the job emails the lab's QA officer contact list (derived from `lab_enrollment.notification_recipients` — falls back to the lab's default QA contact if unset) a single aggregated digest per lab per day: one email listing all imminent-deadline cycles with scheme name, cycle number, deadline, and a deep-link to the cycle page. Email body uses the `eqa.participant.reminder.*` i18n namespace. If the lab has no configured email contacts, the job writes an Alerts-module entry (existing Alerts BR-017 addendum) with kind `eqa_submission_reminder_no_contact` and skips the send. Emails are sent via the existing OpenELIS SMTP configuration; send failures are logged + retried on next scheduled run (no exponential backoff loop — the next day's run is the retry). Explicit non-goals for MVP: no per-user preference for frequency/opt-out (lives on the `lab_enrollment.notification_recipients` list — removed means unsubscribed); no SMS; no push notifications; no escalation to lab director on continued silence (V3 candidate).

### Non-functional

- **Cycle list performance.** < 800 ms for 50 cycles.
- **Deep-link latency.** "Enter in Results →" navigates to standard result entry in < 500 ms (existing page SLA).

### Acceptance criteria

- **AC-V2.2-E01** My Enrollments list renders all of this lab's `lab_enrollment` rows, grouped by status (Active first).
- **AC-V2.2-E02** Enrolling in a new scheme creates a `lab_enrollment` row; the scheme picker excludes schemes the lab is already enrolled in (verified via seed data with duplicate attempt).
- **AC-V2.2-E03** Editing lab-specific fields (subscriber ID, section, eligible analysts, frequency where overridable, notes) persists on save; scheme and provider fields are disabled in edit mode.
- **AC-V2.2-E04** Lifecycle transitions (Active ↔ Suspended, Active/Suspended → Withdrawn) require reason + effective date; audit log captures user, timestamp, prior state, reason.
- **AC-V2.2-E05** Suspended enrollments do not generate new cycles on the next scheduler tick; historical cycles remain linked.
- **AC-V2.2-E06** Coverage summary tile above the table reports counts of sections covered / analytes covered / uncovered clinically-reported analytes; uncovered count deep-links to Lab Performance Coverage filtered view when V2.3 is deployed.
- **AC-V2.2-01** My Cycles list shows all cycles for enrolled schemes.
- **AC-V2.2-02** Expanding a cycle row shows per-analyte progress (no nested entry form).
- **AC-V2.2-03** Clicking "Enter in Results →" navigates to standard result entry with sample pre-selected.
- **AC-V2.2-04** When the last analyte is validated, cycle auto-transitions to `ready_to_submit`.
- **AC-V2.2-05** With `requires_cycle_review = false` and valid FHIR endpoint, cycle auto-submits within configured window → transitions to `submitted`.
- **AC-V2.2-06** FHIR failure creates an Alert and leaves cycle at `ready_to_submit`; retry fires on backoff.
- **AC-V2.2-07** Manual-submit without `manual_submission_reference` returns 422.
- **AC-V2.2-08** With `requires_cycle_review = true`, cycle sits at `ready_to_submit` awaiting QA officer click; no password re-auth required.
- **AC-V2.2-09** Score intake transitions cycle to `scored` and surfaces z-score within 5s of score arrival.
- **AC-V2.2-10** All strings localized (verified in es.json, fr.json).
- **AC-V2.2-11** axe-core zero critical violations.
- **AC-V2.2-12** No lucide-react imports (grep check).
- **AC-V2.2-13** Panel receipt modal (FR-V2.2-12): on save, inserts `eqa_panel_receipt` row, transitions cycle `planned → panel_received`, and — when a matching `sample_shipment` row exists — sets that row's `actual_delivery_date = received_date` and `delivery_status = delivered`. Unchecking `integrity_ok` makes `integrity_notes` required. Modal is idempotent (re-opening a cycle already at `panel_received` loads the existing row in read-only mode with an "Amend" affordance gated on `eqa.participant.receipt.amend` — post-MVP).
- **AC-V2.2-14** FHIR ShipmentDelivery outbound (FR-V2.2-13): on successful receipt save, queues an outbound FHIR event (shape TBD in dev discovery — expected `Communication` or `Task` status update referencing the `sample_shipment`). Failure is non-fatal: Alert logged, receipt row still persists, cycle state still advances.
- **AC-V2.2-15** Reminder emails (FR-V2.2-14): seeded test — a cycle in `panel_received` with `submission_deadline = now + 2 days` and a lab with 2 QA contacts produces exactly one aggregated email listing the cycle, addressed to both contacts, within one scheduled-job cycle. A `scored` cycle does not produce an email. A lab with no contacts produces no email and writes an `eqa_submission_reminder_no_contact` Alert. The lead-time threshold is read from `eqa.participant.reminder.leadTimeDays` (set to 0 disables the job — verified). Running the job twice in the same day sends only one email per lab (24h dedup). Email body contains the deep-link to the cycle page and resolves correctly under `es.json` + `fr.json` i18n.

### Definition of Done

- [ ] Mockup (`eqa-v2-participant-mockup.jsx`) matches approved preview.
- [ ] FHIR submission tested against stub endpoint (success + failure + backoff).
- [ ] Manual-submit export bundle generated correctly.
- [ ] i18n keys in en/fr/es.
- [ ] E2E: full cycle enrollment → validated → auto-submit → score intake (happy path).
- [ ] **Unit/method context verified on standard result entry for each of the six ePT-validated test domains (per V2.1 FR-V2.1-06 invariant).** QA walks one seeded cycle per domain (HIV serology rapid, HIV VL quantitative, EID qualitative, HIV recency categorical, COVID-19 qualitative + quantitative, TB microscopy semi-quantitative + TB molecular qualitative) and confirms that on the standard result-entry page the bench tech sees: (a) the unit a PT provider expects (e.g., `log10 copies/mL` for HIV VL, not `copies/mL`; grade `0 / Scanty / 1+ / 2+ / 3+` for TB microscopy, not a free-text number); (b) the method / platform context needed for scoring (e.g., platform + LOD for VL; IA+WB+VL algorithm for recency); (c) any required qualifiers (e.g., `<LOD` / `≥LOD` for EID/VL rather than a typed numeric). Any domain where the catalog cannot express the expected unit/method without a free-text workaround is raised as a V2.1 schema/seed defect before V2.2 ships, not as a V2.2 UI workaround. Scenarios and expected surface are documented under `docs/eqa/test-domain-catalog.md` (shared with V2.1).
- [ ] Submission-deadline reminder scheduled job (FR-V2.2-14): unit-tested for filter predicate, 24h dedup, lead-time config (including 0 = disable), and the no-contact Alerts fallback. Email template renders in en/fr/es with deep-link resolving to the cycle page behind auth.
- [ ] axe-core clean.
- [ ] Merged.

### Out of scope

- Oversight dashboards (V2.3).
- NCE creation on unacceptable scores (V2.3).
- Per-analyst capture UI — this story surfaces the `assigned_analyst_id` column if present, but the data-entry UX for per-analyst is in V2.3.
- In-house panel creation (V2.4).
- Provider-side work (V2.5).
- Structured cold-chain validators + panel rejection workflow (V3.2). **Note:** The minimal receipt event (FR-V2.2-12) IS in this story's scope; V3.2 adds range validators, `panel_rejected` state, and cross-module cold-chain deviation tracking.

---

## STORY V2.3 — Oversight: Per-Analyst + Lab Performance + NCE Integration

**Proposed key:** OGC-EQA-V2.3 (placeholder)
**Type:** Story
**Parent Epic:** EQA V2
**Story points (estimate):** 16 (bumped from 13 after audit — categorical-null-Z external path +1, competency-event writer fan-out across 3 paths + dismissal mapping +1, rollup rules authored in-spec instead of deferred +1, expanded ACs +0)
**Labels:** `eqa` `nce` `iso-15189` `global` `quality-assurance` `oversight` `audit`
**Fix Version:** OpenELIS Global 3.3.0
**Depends on:** V2.1 + NCE module; soft dependency on V2.2

### Summary

Close the ISO 15189 §7.7.3 loop by wiring unacceptable EQA scores into the NCE module as a trigger source (**participant-role only** — a participant's failure is not the provider's NCE). Provide a QA officer Follow-Up Queue for this lab's questionable scores and in-house flags (union of external-returned and in-house-generated; provider-side scoring of inbound participant submissions is V2.5 scope). Add the per-analyst competency track (§6.2.3) and a Lab Performance rollup dashboard.

### User stories

> As a **QA officer**, when an EQA score comes back unacceptable, I want the system to automatically open an NCE in my lab's register so corrective action isn't missed.
>
> As a **QA officer**, for borderline external scores or in-house flags, I want a Follow-Up Queue so I can triage whether each warrants a formal NCE — with the source clearly labeled so I know which program it came from.
>
> As a **lab supervisor**, I want per-analyst competency evidence for ISO 15189 §6.2.3.
>
> As a **QA officer**, I want a Lab Performance dashboard that shows a KPI snapshot, coverage (which analytes have EQA), and recent performance by scheme — with the EQA-triggered NCE count clickable through to the main NCE register — so I can see the whole EQA picture at a glance without a forked NCE list to reconcile.

### Design brief

- **Purpose:** Make unacceptable EQA actionable, track per-analyst + lab-level competency, surface the EQA portfolio.
- **Primary user action:** Triage a queue item, or review an analyst's / the lab's performance.
- **Layout pattern:** Workbench (queue) + dashboard (lab + analyst).
- **Interaction model:** Queue with row expansion for triage; Lab Performance and Analyst Competency rendered as sidenav submenu entries under EQA Oversight (not in-page tabs).
- **Scope boundary:** Does NOT create new CAPA tables — reuses `nce_capa`. Does NOT look back at patient samples (V3.4). Does NOT include multi-cycle trending (V3.1).
- **Carbon components:** `DataTable`, `Tile`, `Tag`, `Button`, `Select`, `MultiSelect`, `ComboBox`, `InlineNotification`, `Accordion`. **No in-page `Tabs`** — Lab Performance sub-screens render as sidenav submenu children per §7.2.9 / §7.2.10 IA convention. Accordion is used within a single sub-screen to group per-analyte history in the Analyst Competency detail view.

### Functional requirements

**FR-V2.3-01 — Tiered NCE creation (participant-role only).** When `eqa_participant_result.submission_status` transitions to `scored` AND `lab_enrollment_id` resolves to the current OpenELIS instance's lab (i.e., this is a participant-role row, not a remote participant in a scheme we run):
- **Numeric external unacceptable (`|Z| > 3` AND `performance_status = 'unacceptable'`)** → auto-invoke NCE create with payload:
  ```
  trigger_source = 'eqa_unacceptable'
  trigger_ref_id = eqa_participant_result.id
  summary = "Unacceptable EQA score: {analyte} Z={z_score} in {scheme} cycle {cycle_number}"
  assigned_to = {lab's QA officer per role config}
  details_json = { test_id, analyte_id, cycle_id, round_id, z_score, target_value, reported_value, assigned_analyst_id }
  ```
- **Categorical or null-Z external unacceptable** (`performance_status = 'unacceptable'` AND `z_score IS NULL` AND scheme is external) → same NCE auto-create path as numeric unacceptable. Categorical PT (HIV qualitative, TB smear grading, blood film ID) has no Z by construction; an external provider labelling a result unacceptable warrants the same NCE as a numeric |Z|>3. Summary reads "Unacceptable EQA score: {analyte} ({reported} vs target {target}) in {scheme} cycle {cycle_number}" — no Z token.
- `2 < |Z| ≤ 3` OR `performance_status = 'questionable'` → enqueue to **Follow-Up Queue**.
- `|Z| ≤ 2` → no action.
- In-house scheme failures (`performance_status = 'unacceptable'` on a scheme with `scheme_type = 'in_house'`, Z-score absent by construction — V2.4 FR-V2.4-07) → always enqueue to **Follow-Up Queue** (exploratory, requires triage not auto-NCE).
- **Provider-role rows** (where `lab_enrollment_id.organization_id ≠ current_lab_org`) → no local NCE; instead, open / update an `eqa_participant_followup` row (handled by V2.5).

On every NCE auto-creation AND on every Follow-Up Queue enqueue with `performance_status = 'unacceptable'` or `'questionable'`, the service layer also writes an `eqa_analyst_competency_event` row (per FR-V2.1-22) with `event_type = 'unacceptable_score'` or `'questionable_score'` respectively, when `assigned_analyst_id` is populated. No event emitted for provider-role rows.

**FR-V2.3-02 — Follow-Up Queue.** `/eqa/oversight/follow-up-queue`. Scope: questionable-range scores (2 < |Z| ≤ 3) and in-house flagged results that this lab owes a corrective review on — the **union** of external-provider-returned and in-house-generated items. Provider-side scoring of inbound submissions from participant labs is NOT in scope here — that lives in V2.5 EQA Program Management → Participant Follow-Up.

Columns: Cycle, Analyte, Z-score, Reason tag, Enqueued-at, **Source** (`External provider` / `In-house` / `Inter-lab split`, derived from `eqa_scheme.scheme_type`). Filterable by Source and by scheme.

DataTable triage actions (row expansion):
- **Escalate to NCE** — calls NCE create endpoint (same payload as FR-V2.3-01); removes from queue. Also writes `eqa_analyst_competency_event` with `event_type = 'escalated_to_nce'`, `nce_id` populated, when `assigned_analyst_id` is set on the underlying result.
- **Dismiss with reason** — closes with dismissal reason (free text + required category enum: `known_equipment_issue`, `transcription_error`, `pending_re_test`, `acceptable_on_review`, `other`). Audit-logged.

**Dismissal category → competency event mapping** (writes `eqa_analyst_competency_event` with category-specific `event_type`, when `assigned_analyst_id` is set):

| Dismissal category | Competency event_type | Counts against analyst in V2.3 FR-V2.3-06 rollup? |
|---|---|---|
| `known_equipment_issue` | `dismissed_equipment` | No — equipment fault, not analyst |
| `pending_re_test` | `dismissed_equipment` | No — deferred pending re-test |
| `transcription_error` | `dismissed_transcription` | Yes — transcription is within analyst scope |
| `acceptable_on_review` | `dismissed_acceptable_on_review` | No — was a false positive on triage |
| `other` | `dismissed_other` | Yes — ambiguous, requires supervisor review |

The "counts against" distinction drives which events roll up into the Competent / Under Review / Not Competent assertion in FR-V2.3-06. See FR-V2.1-22 for the enum definition.

**FR-V2.3-03 — NCE surfacing on cycle page.** V2.2 cycle page shows InlineNotification (kind warning) banner when any result triggered an NCE; adds NCE column to participant result table with red Tag linking to NCE investigation page.

**FR-V2.3-04 — Per-analyst capture (column on standard result entry).** When the Order is EQA-flagged AND the scheme has `per_analyst = true`:
- The standard result entry grid gains an **optional** "Analyst" column, Carbon `Select` or `ComboBox`.
- Selector pulls from `eqa_scheme_analyst` mapping if populated (constrained list); otherwise from full `systemuser` list.
- Defaults to the current user if they're on the eligible list (or unconstrained).
- On save, `assigned_analyst_id` is written to the `analysis` row AND mirrored to `eqa_participant_result.assigned_analyst_id` via the analysis-link FK.
- For non-EQA samples OR schemes with `per_analyst = false`: column hidden; no behavior change.

**FR-V2.3-05 — Eligible-analyst mapping UI.** On the EQA Scheme configuration page (under **EQA Program Management → Schemes & Programs** in the refined 3-lane IA; this is the existing V1 scheme config surface, relocated): add an "Eligible analysts" multi-select section. Carbon `MultiSelect` pulling from `systemuser` (filtered to users with lab-tech / reviewer roles by default; unfilter-able). Saving writes to `eqa_scheme_analyst`. Optional — empty list means "any user may be recorded as analyst."

**FR-V2.3-06 — Analyst Competency dashboard.** `/eqa/oversight/analyst-track`. List practitioners assigned to PT in trailing 12 months. Per-analyst detail shows: total samples (12 mo + current year), current performance status by analyte (most recent scored result), historical results Accordion grouped by analyte, and a competency assertion (Competent / Under Review / Not Competent).

**Data source.** The dashboard queries a union of two tables over the trailing 12 months, keyed on `analyst_id`:
1. `eqa_participant_result` rows where `assigned_analyst_id IS NOT NULL` and `submission_status IN ('scored', 'missed_deadline')`.
2. `eqa_analyst_competency_event` rows (per FR-V2.1-22) — including external and in-house missed-deadline events, unacceptable / questionable scores, NCE escalations, and dismissals.

Rows where the same underlying result appears in both (e.g., a scored unacceptable result also writes an `unacceptable_score` event) are de-duplicated on `(scheme_id, cycle_id, participant_result_id)`; the event is the canonical row.

**Competency rules (replaces the V1 compilation §9 pointer — which was under-specified for V2.3's event-driven data model).** For each `(analyst_id, scheme_id)` pair, compute over the trailing 12 months:

- `evaluable_n` = count of rows whose `event_type` (or derived result performance) counts against the analyst. Counted: `unacceptable_score`, `questionable_score`, `external_missed_deadline`, `in_house_missed_deadline`, `dismissed_transcription`, `dismissed_other`, and scored `acceptable` results.
- `failure_n` = count of rows in the "counts against" set whose outcome is non-acceptable: `unacceptable_score`, `questionable_score`, `external_missed_deadline`, `in_house_missed_deadline`, `dismissed_transcription`, `dismissed_other`, and `escalated_to_nce`.
- `dismissed_equipment`, `dismissed_acceptable_on_review`, and `pending_re_test` events are **excluded from both the numerator and denominator** (not the analyst's fault / superseded on review).

Competency bands (per analyte × analyst):

| Condition | Assertion |
|---|---|
| `evaluable_n ≥ 4` AND `failure_n = 0` AND most recent scored result is `acceptable` | **Competent** |
| `evaluable_n ≥ 4` AND `failure_n ≤ 1` AND no `escalated_to_nce` in trailing 12 months | **Competent** |
| Any `escalated_to_nce` in trailing 12 months AND NCE still `open` | **Not Competent** |
| `failure_n ≥ 2` OR 2+ consecutive `questionable_score` events | **Under Review** |
| `evaluable_n < 4` | **Under Review** (insufficient evidence — not "Competent" by default) |
| Otherwise | **Competent** |

The rollup respects the "counts against analyst" column from the FR-V2.3-02 dismissal-category mapping table. Rationale and edge cases are captured in `docs/eqa/analyst-competency-rules.md` (added by DoD).

**FR-V2.3-07 — Lab Performance dashboard (new).** Rendered as two sidebar submenu children under **EQA Oversight → Lab Performance** (not in-page Carbon Tabs), in the order: Coverage → Recent Cycles. The **Coverage** screen is the merged accreditation-snapshot view: lab-wide summary KPIs appear as a tile row at the top, followed by the coverage matrix. Routes:
- **`/eqa/oversight/lab-performance/coverage` — Coverage** (default / landing view). Top section: four KPI tiles — (1) Acceptance rate (cycles this year with acceptable scores over total cycles), (2) On-time submission rate (cycles submitted before provider deadline over total cycles), (3) Open EQA-triggered NCEs (clickable deep-link tile into the main NCE register with `?source=eqa` preset filter — does **not** render a local list), (4) Schemes without §7.7.2 alternatives (count of non-covered analytes missing an in-house fallback). Bottom section: matrix of test catalog analytes × EQA coverage. Rows: analyte. Columns: "Enrolled in external PT" (Y/N + scheme), "Running in-house" (Y/N + scheme), "Last PT score" (z or N/A), "Last score date", "Performance status". Analytes with no EQA coverage highlighted in `warm-gray`. Exportable to CSV. A footnote clarifies that the top KPI row is a lab-wide rollup across all schemes; the matrix below drills into per-analyte coverage.
- **`/eqa/oversight/lab-performance/recent` — Recent Cycles.** Last 10 cycles across all schemes, sorted by status + date. Quick link to cycle page.

There is deliberately **no** "Summary KPIs" subscreen (merged into Coverage — one less click, one fewer sidebar item) and **no** "EQA-Triggered NCEs" subscreen — the NCE register is the single source of truth for NCE state. Cycles that triggered an NCE surface the NCE via the V2.2 cycle-page banner (FR-V2.3-03) and via the KPI tile deep-link on the Coverage screen.

**URL contract for the EQA → NCE deep-link.** The `?source=eqa` query parameter is a cross-module contract: the NCE register filter set MUST accept it and pre-filter to `trigger_source = 'eqa_unacceptable'`. This is shared with other planned deep-links (e.g., the V2.2 cycle banner NCE link) so the contract is enumerated in one place: `docs/eqa/nce-deep-links.md` (added by DoD). The NCE register team owns respecting the contract; this story owns emitting it. A broken contract (NCE register returning unfiltered) surfaces as an E2E test failure in AC-V2.3-17.

**FR-V2.3-08 — Idempotent NCE creation.** NCE create idempotent on `(trigger_source, trigger_ref_id)`.

**FR-V2.3-09 — Audit trail.** Queue enqueue / escalate / dismiss, NCE create, per-analyst assignment, eligible-analyst mapping — all audit-logged.

**FR-V2.3-10 — Permissions.** New: `eqa.review` (queue access), `eqa.triage` (escalate/dismiss), `eqa.analyst-track.view`, `eqa.lab-performance.view`, `eqa.scheme.manage-analysts`.

**FR-V2.3-11 — i18n.** `eqa.oversight.*`, `eqa.analyst.*`, `eqa.performance.*`.

### Non-functional

- **Latency.** NCE auto-creation within 3s of score intake; failure logged, score intake still succeeds, retry within 5 min.
- **Coverage matrix.** Scales to test catalogs of 500+ analytes without pagination stutter (virtualized scroll if needed).

### Acceptance criteria

- **AC-V2.3-01** `|Z|>3` on participant-role result → exactly one NCE with `trigger_source = 'eqa_unacceptable'`.
- **AC-V2.3-02** Questionable → queue entry, no NCE.
- **AC-V2.3-03** In-house unacceptable → queue entry, no NCE auto-creation.
- **AC-V2.3-04** Escalation creates NCE and removes from queue.
- **AC-V2.3-05** Dismiss without reason → 422.
- **AC-V2.3-06** Duplicate score intake does not create duplicate NCE (idempotency).
- **AC-V2.3-07** Provider-role unacceptable result does NOT create a local NCE (verified in E2E with a provider-side scheme).
- **AC-V2.3-08** Scheme with `per_analyst = true` shows Analyst column at standard result entry; empty column on save → 422.
- **AC-V2.3-09** Eligible-analyst mapping UI: add/remove users, empty list permits any user.
- **AC-V2.3-10** Analyst Competency page shows correct counts for seeded scenario.
- **AC-V2.3-11** Lab Performance coverage tab correctly highlights uncovered analytes.
- **AC-V2.3-12** Lab Performance CSV export matches table.
- **AC-V2.3-13** User without `eqa.triage` sees queue but buttons disabled.
- **AC-V2.3-14** Categorical / null-Z external unacceptable result (seeded HIV qualitative + TB smear scenarios) → auto-creates NCE with `trigger_source = 'eqa_unacceptable'`; NCE summary omits Z token and includes reported-vs-target values.
- **AC-V2.3-15** Service-layer competency-event writes on three paths — (a) NCE auto-create from unacceptable → event with `event_type = 'unacceptable_score'`; (b) queue enqueue from questionable → event with `event_type = 'questionable_score'`; (c) Follow-Up Queue "Escalate to NCE" action → event with `event_type = 'escalated_to_nce'` and `nce_id` populated. All three require `assigned_analyst_id` set on the source row; if NULL, no event is written.
- **AC-V2.3-16** Dismiss-with-reason writes competency event with the category-specific `event_type` per FR-V2.3-02 mapping table (verify all 5 categories map correctly to their `dismissed_*` event_type).
- **AC-V2.3-17** Analyst Competency dashboard rollup correctly excludes `dismissed_equipment`, `dismissed_acceptable_on_review`, and `pending_re_test` events from both numerator and denominator per FR-V2.3-06 rules (seeded scenario: analyst with 1 unacceptable + 3 dismissed_equipment + 2 acceptable returns Under Review, not Not Competent).
- **AC-V2.3-18** Lab Performance Coverage "Open EQA-triggered NCEs" tile deep-link navigates to NCE register with `?source=eqa` query parameter applied and register filter state reflects `trigger_source = 'eqa_unacceptable'` preset (E2E verifies URL contract end-to-end).
- **AC-V2.3-19** Follow-Up Queue Source column filter narrows rows correctly per source value; filtering on `External provider` excludes in-house rows and vice versa.
- **AC-V2.3-20** Eligible-analyst `MultiSelect` interaction: type-ahead narrows list, selection persists on save, empty list permits any user on save (covers FR-V2.3-05 end-to-end including Carbon MultiSelect interactions).

### Definition of Done

- [ ] NCE integration tested E2E against NCE v3.1.
- [ ] Per-analyst column tested in standard result entry (existing page modification).
- [ ] Coverage matrix validated against a seeded test catalog.
- [ ] Axe-core clean.
- [ ] Unit tests: tier decision logic, idempotency, role-based trigger scoping, competency-event writer (all 3 source paths + analyst-id NULL skip), dismissal-category → event_type mapping.
- [ ] E2E: unacceptable score → auto NCE; questionable → queue → escalate → NCE; categorical unacceptable → auto NCE.
- [ ] E2E: `?source=eqa` deep-link URL contract (AC-V2.3-18).
- [ ] Docs: `docs/eqa/analyst-competency-rules.md` (bands + data source), `docs/eqa/nce-deep-links.md` (URL contract — shared with V2.2 cycle banner).
- [ ] i18n keys added.
- [ ] Merged.

### Out of scope

- Patient-impact look-back (V3.4).
- Multi-cycle trend charts (V3.1).
- IQC ↔ EQA correlation (V3.3).
- Provider-side internal NCE triggers (V3.6).

---

## STORY V2.4 — In-House Blinding Workflow

**Proposed key:** OGC-EQA-V2.4 (placeholder)
**Type:** Story
**Parent Epic:** EQA V2
**Story points (estimate):** 11 (bumped from 8 after V2.4 audit — prep tracker +1, label printing +2, docs-only fixes +0)
**Labels:** `eqa` `in-house` `iso-15189` `global` `supervisor` `prep` `labels`
**Fix Version:** OpenELIS Global 3.3.0
**Depends on:** V2.1 (hard — reuses FR-V2.1-17 panel inventory columns)

### Summary

Give a supervisor a wizard to create an in-house blinded PT panel: pull from existing specimen pools or define ad-hoc samples, assign blind codes, **track prep/aliquoting (lot number, storage temp, aliquots produced, homogeneity-QC notes) reusing the V2.1 FR-V2.1-17 columns used by V2.5**, seal target values (encrypted at rest), **print blind-code labels to affix to physical tubes**, distribute to analysts by creating standard OpenELIS orders flagged EQA + in-house, let analysts run them blind through the standard pipeline, and unblind at the announced deadline to auto-score. Unacceptable in-house results route to V2.3's Follow-Up Queue. Missed-deadline results additionally flow to the V2.3 Analyst Competency view (see FR-V2.4-14 below).

### User stories

> As a **lab supervisor**, I want a wizard to create an in-house PT panel with sealed target values so my analysts can't see the truth values until after the deadline.
>
> As a **lab supervisor**, I want to record prep details on the panel (lot number, storage temp, aliquots produced, homogeneity QC notes) so I have ISO 15189 §7.7.2 evidence that the panel was prepared consistently — and so the prep record looks the same as the V2.5 provider-side workbench uses.
>
> As a **lab supervisor**, I want to print labels with the blind codes onto adhesive tube labels so my analysts can find the physical tubes at the bench without referring to a handwritten code sheet that could leak targets.
>
> As a **lab supervisor**, I want the panel to be distributed as normal OpenELIS orders flagged as EQA so analysts run them in their usual workflow without knowing which orders are PT.
>
> As a **lab supervisor**, at the unblinding deadline I want the system to auto-score every result against the sealed target and route unacceptable results for review — and I want any analyst who missed the deadline to show up in the V2.3 Analyst Competency view so training needs are visible in the same place as external-PT misses.

### Design brief

- **Purpose:** Enable ISO 15189 §7.7.2 alternative (in-house PT) when no external provider exists.
- **Primary user action:** Create a blinded panel (wizard) and later unblind it.
- **Layout pattern:** Wizard for creation; cycle page for monitoring; unblind action on cycle page.
- **Interaction model:** 4-step wizard (define scheme + cycle, choose samples + prep details, assign analysts/schedule, confirm & seal + print labels); post-wizard, panel is sealed and visible on My Cycles with "Sealed" badge; at unblind deadline, supervisor clicks "Unblind & score" or system auto-unblinds.
- **Scope boundary:** Does NOT do structured ISO 17043 homogeneity / stability testing (V3.5 territory) — homogeneity QC is a supervisor checkbox + free-text notes only, identical to V2.5's MVP. Does NOT support provider-side distribution to external labs (that's V2.5). Does NOT do in-cycle supervisor monitoring during the blind window (parked in V3.X to avoid target-reveal risk — see V2.4 §Out-of-scope note). Target values are captured simply (single numeric or categorical) without lot-level batch traceability beyond the `lot_number` field.
- **Carbon components:** `Modal` with `ProgressIndicator` (the 4-step wizard IS a modal — acceptable per Constitution Principle 3 since it's a multi-section form of >5 sections), `DataTable`, `NumberInput`, `TextInput`, `Select`, `MultiSelect`, `DatePicker`, `Tag`, `InlineNotification`, `Button` with PDF-download affordance for label sheets.

### Functional requirements

**FR-V2.4-01 — In-House Blinding wizard, Step 1: scheme + cycle.** On `/eqa/management/in-house` → "Create blinded panel" button → wizard modal.
- Step 1 form: Scheme selector (restricted to `scheme_type = 'in_house'`; "Create new scheme" link if none). Cycle number auto-suggested (`prior + 1`). Cycle name, planned start date, **unblind date** (= submission_deadline equivalent for in-house). `requires_cycle_review` defaults to false for in-house.

**FR-V2.4-02 — Step 2: panel samples + prep details.** Two entry modes:
- **Mode A: split existing pool.** Pick a previously-tested patient sample or QC pool; system creates N aliquots with new blind codes.
- **Mode B: ad-hoc samples.** Manually enter N sample rows: sample_code (auto-generated like `INHOUSE-{cycle}-{nn}`), blind_code (auto-generated obfuscated string), analyte, target_value, target_unit, acceptance range (low/high — defaults to ±2 SD of the target if historical data exists, else user-entered).
- Both modes write `eqa_panel` + `eqa_panel_sample` rows; target_value stored encrypted-at-rest per V2.1 FR-V2.1-16.
- **Prep details section** (reuses V2.1 FR-V2.1-17 columns on the `eqa_panel` row — same schema the provider-side V2.5 prep workbench writes): `source_type` (enum — defaults to `in_house_aliquoted` for Mode A, `mixed` selectable for Mode B when the supervisor is making panels from a blend of pool + spiked), `lot_number` (TextInput — free-text, e.g. `IH-HIV-VL-2026Q1-L01`), `aliquots_produced` (NumberInput, defaults to N from the sample count but supervisor can record overage — e.g. produced 32 for a 28-analyst cycle, keeping 4 as reserve for repeats), `storage_temp` (Select — same enum as FR-V2.1-17: `ambient` / `refrigerated_2_8C` / `frozen_-20C` / `ultra_frozen_-80C` / `dry_ice`), `expiration_date` (DatePicker, nullable), `homogeneity_qc_passed` (Checkbox — supervisor checks after visual/replicate inspection; MVP is honor-system evidence, V3.5 adds structured ANOVA), `homogeneity_qc_notes` (TextArea, required when `homogeneity_qc_passed` is unchecked and the supervisor proceeds anyway — captures the "why we shipped despite QC concerns" justification).
- Wizard cannot proceed to Step 3 unless `aliquots_produced` ≥ (count of samples assigned × analyst count) AND `homogeneity_qc_passed = true`. Same gate V2.5 FR-V2.5-12 applies.

**FR-V2.4-03 — Step 3: analyst assignment.** Supervisor assigns which analysts will run which samples. Default: round-robin from the scheme's eligible-analyst list (from `eqa_scheme_analyst`). Manual override per sample. Result: pre-populates `assigned_analyst_id` on the Order created in step 4.

**FR-V2.4-04 — Step 4: confirm & seal.** Summary view showing sample count, prep details (lot, storage temp, aliquot reserve), assigned analysts, unblind date. Supervisor clicks "Seal panel & distribute" → system:
1. Creates `eqa_panel.status = 'sealed'`.
2. For each panel sample, creates a standard OpenELIS Order with `is_eqa_sample = true`, `eqa_program_id`, `cycle_id`, `round_id`, `assigned_analyst_id`, using the blind_code as the display Sample ID (the standard sample_code remains internal).
3. Emits an Alert (optional, configurable per-lab) to each assigned analyst with their sample count.
4. Transitions panel to `distributed`.
5. Surfaces a **"Print label sheet"** button (per FR-V2.4-13 below) so the supervisor can print physical tube labels before distribution.

**FR-V2.4-05 — Analyst runs samples blind.** Analysts see orders in their standard result-entry queue labeled only with blind codes. Target values are not visible anywhere in the UI for orders belonging to `scheme_type = 'in_house'` panels in `sealed` or `distributed` state. Results go through standard entry + validation.

**FR-V2.4-06 — Unblinding.** At the `unblind_date`:
- **Automatic path:** a scheduled job transitions the panel to `unblinded`, decrypts target values, runs scoring for every participant result.
- **Manual path:** supervisor can click "Unblind now" on the cycle page (permission: `eqa.inhouse.unblind`) to unblind early.
- **Late-entry path:** if not all analysts have validated results by `unblind_date`, the job still unblinds but marks missing results as `missed_deadline`; late results are still scored but flagged.

**FR-V2.4-07 — In-house scoring.** For each `eqa_participant_result` linked to the panel:
- Compute delta: `reported - target`.
- If `acceptance_range` defined: `performance_status = 'acceptable'` when delta within range; `unacceptable` otherwise.
- Where numeric target + lab historical SD: compute a z-score-equivalent. Where categorical (e.g., "Positive"): exact match = acceptable, mismatch = unacceptable.
- Write `eqa_participant_result.submission_status = 'scored'`, `performance_status`, (optional) `z_score`.
- Cycle transitions `distributed → unblinded → scored → closed`.

**FR-V2.4-08 — Routing to V2.3.** Unacceptable in-house results: since in-house has no external z-score and is inherently exploratory, route to **V2.3 Follow-Up Queue** (not auto-NCE) per FR-V2.3-01 in-house rule. Queue row is tagged `Source = In-house`. Supervisor triages: escalate to NCE or dismiss with reason.

**FR-V2.4-09 — Post-unblind view.** On the cycle page (V2.2), once unblinded, show:
- Each sample's target_value + range (now visible).
- Each analyst's reported value, delta, performance status.
- Aggregate summary per analyte.

**FR-V2.4-10 — Audit trail.** Panel creation, seal, unblind (auto or manual), score generation — all audit-logged. Unblinding records `unblind_method` (`scheduled`, `manual`) and `unblinded_by`.

**FR-V2.4-11 — Permissions.** `eqa.inhouse.create` (wizard), `eqa.inhouse.unblind` (manual unblind), `eqa.inhouse.view` (see panels + results).

**FR-V2.4-12 — i18n.** `eqa.inhouse.*`, `eqa.inhouse.prep.*`, `eqa.inhouse.labels.*`.

**FR-V2.4-13 — Blind-code label printing.** "Print label sheet" button on the cycle page (visible post-seal, any time before unblind) and on Step 4 of the wizard. Clicking generates a PDF label sheet sized for common adhesive label stock (default: 30-per-sheet Avery 5160 equivalent — 2.625" × 1" — configurable per-lab in a future admin option; MVP ships with the default only). Each label shows:
- Blind code (large, scannable if the lab later wires barcode printing — barcode itself is out of scope for V2.4, plain text only).
- Cycle identifier (e.g., `IH-HIV-VL-2026Q1`) in small text.
- Analyte short name.
- **Nothing else** — no target value, no acceptance range, no analyst name. An accidentally-dropped label must not leak the truth value.
- **Plug point:** reuse the PDF generation pipeline established in V2.5 FR-V2.5-13 (pack-list / shipping-label PDFs) — same library, same layout engine, same output directory convention. This plug-point dependency is one of the two reasons V2.4 now depends on V2.1's FR-V2.1-17 schema (prep tracker) and soft-depends on V2.5's PDF pipeline primitives (label generator).
- Button is idempotent: re-generating the sheet produces the same PDF (labels don't need re-randomization after seal).
- Permission: `eqa.inhouse.create` OR `eqa.inhouse.view` — any supervisor who can see the panel can reprint the sheet if physical labels are damaged.
- Audit log: each print event records `user`, `timestamp`, `panel_id`, `label_count`.

**FR-V2.4-14 — Missed-deadline → Analyst Competency linkage.** When FR-V2.4-06's late-entry path marks a result `missed_deadline`, a row is inserted into the V2.3 Analyst Competency view's data source with `event_type = 'in_house_missed_deadline'`, `analyst_id`, `scheme_id`, `cycle_id`, `event_date = unblind_date`. The Analyst Competency view (V2.3 FR-V2.3-06) already renders events per analyst; this FR just ensures in-house missed deadlines show up alongside external-PT misses, so a supervisor reviewing per-analyst competency has one consolidated view per ISO 15189 §6.2.3. No new UI — data feed only.

**FR-V2.4-15 — Handoff to Workplan.** When FR-V2.4-04 step 2 creates standard OpenELIS Orders for the blinded panel, those orders appear in the normal Workplan module like any other orders — they are NOT filtered out. The Workplan row displays the blind code as the Sample ID (identical to how it appears in the analyst's result-entry queue), with no visual distinction from patient samples. This is a **spec clarification, not new code**: the blinded orders are already standard Orders (FR-V2.4-04 step 2), which means Workplan already picks them up via its standard query. This FR documents the invariant so a future Workplan maintainer doesn't add an "exclude EQA samples" filter that would break analyst workflow. Reference: see `env-vector-workflows.md` for Workplan query conventions.

### Non-functional

- **Security.** Target values MUST NOT appear in any API response, log, or UI element while panel is `sealed` or `distributed` and viewer lacks `eqa.inhouse.unblind` permission. Encryption-at-rest per V2.1 FR-V2.1-16. **Printed labels (FR-V2.4-13) are bound by the same rule** — target value and acceptance range must not appear on the label PDF; review must be performed at the design level before first ship.
- **Scheduled unblind reliability.** Scheduled job has idempotency guard; running twice does not corrupt data.
- **Label PDF performance.** Sheet generation must complete in <1s for panel sizes up to 100 labels (i.e., a large in-house cycle with ~30 samples × 3 replicates).
- **Prep invariant enforcement.** `aliquots_produced` ≥ (sample count × analyst count) AND `homogeneity_qc_passed = true` enforced at the service layer, not just the wizard UI. API smoke test verifies bypass attempt returns 409.

### Acceptance criteria

- **AC-V2.4-01** Wizard creates panel end-to-end; Step 4 seals and creates standard Orders with blind codes.
- **AC-V2.4-02** Analyst sees their assigned orders in standard result entry labeled by blind code.
- **AC-V2.4-03** Target values NOT visible anywhere in the UI or API response for a `sealed` panel (verified by API smoke test with a non-supervisor user).
- **AC-V2.4-04** At `unblind_date`, scheduled job unblinds and scores all results.
- **AC-V2.4-05** Manual unblind via "Unblind now" works only for `eqa.inhouse.unblind` users.
- **AC-V2.4-06** Late results (entered after unblind) are scored and flagged `missed_deadline`.
- **AC-V2.4-07** Numeric scoring produces correct acceptance decision for target 100 / range 95–105 / reported 92 → unacceptable; reported 102 → acceptable.
- **AC-V2.4-08** Categorical scoring: target "Positive", reported "Positive" → acceptable; reported "Negative" → unacceptable.
- **AC-V2.4-09** Unacceptable in-house result creates Follow-Up Queue entry with `Source = In-house` (not auto-NCE).
- **AC-V2.4-10** Post-unblind view shows targets + deltas.
- **AC-V2.4-11** Running scheduled unblind job twice doesn't double-score.
- **AC-V2.4-12** Prep tracker (FR-V2.4-02): wizard cannot proceed to Step 3 unless `aliquots_produced` ≥ sample count × analyst count AND `homogeneity_qc_passed = true`. Unchecking `homogeneity_qc_passed` makes `homogeneity_qc_notes` required before continuing.
- **AC-V2.4-13** Prep tracker server-side enforcement (Non-functional): direct API call to create a `distributed` panel with `homogeneity_qc_passed = false` AND empty notes returns 409; with notes present, returns 201.
- **AC-V2.4-14** Label printing (FR-V2.4-13): "Print label sheet" button produces a PDF containing blind codes for every `eqa_panel_sample` in the panel. Grep of the PDF text layer MUST NOT return any sample's `target_value` or acceptance-range numbers (verified by PDF content extraction in integration test).
- **AC-V2.4-15** Label printing idempotency: generating the label sheet twice in succession produces byte-identical PDFs (no re-randomization).
- **AC-V2.4-16** Missed-deadline linkage (FR-V2.4-14): a late-entered in-house result appears in the V2.3 Analyst Competency view for the owning analyst, tagged `event_type = 'in_house_missed_deadline'`. Verified by E2E: seed analyst → create panel assigning them → let unblind job run without entry → query Analyst Competency API by analyst → row present.
- **AC-V2.4-17** Workplan handoff (FR-V2.4-15): blinded panel Orders appear in the standard Workplan list for the assigned analyst, sample ID column showing the blind code (not the internal sample_code). Verified by seed data + Workplan list query.

### Definition of Done

- [ ] Wizard implemented + tested across all 4 steps, including prep-details section (FR-V2.4-02).
- [ ] Encryption-at-rest verified (target values inaccessible when sealed).
- [ ] Scheduled unblind job tested with mock time advancement.
- [ ] Scoring logic unit-tested across numeric, categorical, edge cases.
- [ ] Integration test: wizard → analyst runs → unblind → Follow-Up Queue.
- [ ] Label PDF generator wired to V2.5 FR-V2.5-13 PDF pipeline; content-extraction test proves no target values on label.
- [ ] Missed-deadline linkage (FR-V2.4-14) verified by E2E: late-entered result appears in V2.3 Analyst Competency view.
- [ ] Workplan handoff (FR-V2.4-15) documented in `docs/workplan/eqa-interaction.md` so a future Workplan maintainer doesn't add an EQA exclusion filter.
- [ ] i18n added (in-house prep + label key families).
- [ ] Merged.

### Out of scope

- Structured ISO 17043 homogeneity / stability testing of in-house panel (V3.5) — MVP is supervisor checkbox + notes only.
- Pool management / lot-level traceability beyond the `lot_number` field (V3.5 or separate feature).
- Provider-side external distribution (V2.5).
- **In-cycle supervisor monitoring during the blind window** — parked in V3.X. A "which analysts have entered which samples" view during the blind window invites target-reveal risk (a supervisor with visibility into entry progress is one click from target values they authored). Deferred until a dedicated threat-model pass establishes a "no-target-reveal" contract for the monitoring surface. Post-unblind view (FR-V2.4-09) is unaffected — by then, targets are already revealed.
- Barcode / QR on labels (V3.X — depends on lab-specific barcode printer driver availability).

---

## STORY V2.5 — Provider-Side Program + Participant Follow-Up

**Proposed key:** OGC-EQA-V2.5 (placeholder)
**Type:** Story
**Parent Epic:** EQA V2
**Story points (estimate):** 21
**Labels:** `eqa` `provider` `iso-17043` `global` `program-management` `shipment`
**Fix Version:** OpenELIS Global 3.3.0
**Depends on:** V2.1 (hard)

### Summary

Give a lab running a PT program for other labs (provider mode) the full cycle-operation workflow to: define a panel (analytes, sample codes, target values, acceptance ranges — **not** ISO 17043 homogeneity/stability); **prep physical aliquots or repackage vendor-sourced panels, track inventory and QC-gate the batch before shipping; ship to each enrolled participant with courier + tracking + cold-chain details via the existing OpenELIS sample shipment module; monitor per-participant receipt confirmation;** receive participant results; calculate and return scores; dashboard participant performance per scheme; track follow-up for participants scoring unacceptable or persistently under-performing (including **reprovisioning repeat samples from reserve aliquots**).

### Real-world narrative — Provider coordinator running a cycle

*The goal of this narrative is to give a developer who has never run a PT program a concrete sense of the end-to-end work this story enables. Terminology and roles map 1:1 to the functional requirements below.*

Meet **Dr. Adebayo**, PT coordinator at the **National HIV Reference Laboratory, Lagos** — a WHO-AFRO-accredited provider running a quarterly HIV viral load PT program for 28 district and regional labs across Nigeria.

It's the first week of Q2. Dr. Adebayo opens OpenELIS and navigates to **EQA Program Management → Schemes & Programs**. She selects "HIV VL — AFRO-Nigeria 2026" and clicks **Create new cycle + panel**.

**Step 1 — Cycle metadata.** She sets cycle number 2 of 2026, names it "2026-Q2", sets the distribution date to next Monday and the submission deadline four weeks later.

**Step 2 — Panel samples.** Her lab preps an in-house plasma pool at four contrived viral load concentrations (2.0, 3.5, 4.8, 6.0 log copies/mL). She enters four sample rows with target values and acceptance ranges (±0.3 log). **She selects `source_type = in_house_aliquoted`** and enters `lot_number = HIV-VL-2026Q2-LOT01`.

**Step 3 — Participants.** 28 labs are enrolled; she keeps all selected. She enters `aliquots_reserved = 10` (safety margin for repeats and any that spill in transit).

**Step 4 — Distribution method.** Some labs have FHIR endpoints (auto-distribute), others get paper/CSV. She picks "Mixed — auto where available."

**Step 5 — Confirm & begin prep.** Cycle transitions to **`prep_in_progress`**.

**Prep workbench.** Later that week, her tech aliquots the pool: `aliquots_produced = 150` (28 participants × 4 samples + 10 reserve × 4 samples ≈ 150). Storage at -80°C. Homogeneity QC: spot-check 5 aliquots on the in-house assay, confirm all within ±0.2 log of target. She ticks **Homogeneity QC passed** with notes. Cycle transitions to **`ready_to_ship`**.

**Shipment workbench.** One row per participant. She picks courier (DHL for international, regional courier for Nigerian labs), enters tracking numbers, shipped-at-temp (-80°C with dry ice). She prints pack lists (4 samples per participant, handling instructions) and shipping labels. "Mark all shipped" → cycle transitions to **`shipped`**.

**Receipt monitoring.** Over the next 3 days, most participants confirm receipt via their OpenELIS instance (FHIR receipt event flows back automatically — see V2.2). Two labs haven't confirmed by day 5. The dashboard flags them overdue. She calls them: one received but forgot to confirm in the system, the other says the courier left the package in the sun and the dry ice is gone. She flags a replacement shipment → **FR-V2.5-15 reprovisioning** pulls 4 fresh aliquots from reserve, creates a new shipment record linked to the original.

Once all 28 participants confirm delivery, cycle transitions to **`delivered` → `submissions_open`**. Participants run their samples and submit over the next 4 weeks.

At deadline, cycle auto-transitions to **`submissions_closed`**. Scoring runs (FR-V2.5-03), she reviews, and clicks **Distribute scores** (FR-V2.5-04) → cycle goes to **`scored`**. Three labs had unacceptable results — FR-V2.5-07 auto-creates follow-up records. She works the Follow-Up register (FR-V2.5-06): one lab reports a reagent lot issue, gets a repeat; one needs escalation to WHO AFRO; one resolves with a documented corrective action.

Cycle closes. Dr. Adebayo exports the performance report, archives lot HIV-VL-2026Q2-LOT01, and starts planning Q3.

*The point: without explicit prep, ship, and receipt-tracking states, the first half of this narrative lives on Excel and WhatsApp. V2.5 pulls it into OpenELIS so the whole cycle is auditable.*

### User stories

> As a **PT provider coordinator**, I want to define a panel for an upcoming cycle — what analytes, what samples, what target values — so I can distribute to my enrolled participants.
>
> As a **PT provider coordinator**, I want to record whether a panel is aliquoted in-house or sourced from a vendor (or mixed) and track lot number, aliquots produced, storage temperature, and expiration, so my inventory matches the physical reality.
>
> As a **PT provider coordinator**, I want to QC-check my panel for homogeneity before it ships, so I don't send out a bad batch.
>
> As a **PT provider coordinator**, I want to see my cycle move through explicit states (planned → prep → ready-to-ship → shipped → delivered → submissions open → scored → closed) on the cycle page, so I always know where I am and nothing slips through the cracks.
>
> As a **PT provider coordinator**, I want to record one shipment per participant with courier, tracking number, shipped-at temp, and printable pack list + shipping label — using the existing OpenELIS sample shipment tooling, not a parallel spreadsheet — so logistics stay inside the LIMS.
>
> As a **PT provider coordinator**, I want to see which participants have confirmed receipt and which are overdue (flagged past expected delivery), so I can chase the ones that haven't arrived.
>
> As a **PT provider coordinator**, I want to see how each participating lab is performing across cycles so I can identify persistent non-performance.
>
> As a **PT provider coordinator**, when a participant gets an unacceptable score and I flag for repeat testing, I want to pull from my reserve aliquots and create a linked repeat shipment, so I don't have to re-prep from scratch.
>
> As a **PT provider coordinator**, when a participant gets an unacceptable score, I want to open a follow-up record so I can track whether they responded, re-tested, or need escalation to the accreditation body.

### Design brief

- **Purpose:** Enable provider-mode deployments to operate a PT program end-to-end — panel definition, physical prep, shipping logistics, scoring, and follow-up — without external tooling at MVP level.
- **Primary user action:** Run a cycle through its full lifecycle (plan → prep → ship → score → close); flag, follow up, and reprovision when things go wrong.
- **Layout pattern:** Wizard for panel definition + cycle creation; **per-cycle workbench surfaces for Prep and Shipment** (sidebar children of the active cycle); dashboard for participant performance; register for follow-up. No in-page Carbon Tabs — multi-view screens use sidenav submenus (OpenELIS convention).
- **Interaction model:** Cycle state banner at the top of every provider cycle page (breadcrumb + current state Tag + "What's next" hint). Prep workbench is a DataTable over the cycle's panel with inventory fields + homogeneity QC gate. Shipment workbench is a DataTable (one row per participant) plugging into the existing OpenELIS sample shipment module — the EQA-specific fields (expected delivery, repeat-of linkage) overlay the shared shipment record. Follow-up register retains DataTable + row expansion.
- **Scope boundary:** Does NOT include ISO 17043 homogeneity/stability (V3.5 — MVP's `homogeneity_qc_passed` is a supervisor checkbox + notes, not a structured protocol). Does NOT create local NCEs from participant failures (see V2.3 FR-V2.3-01 scoping rule). Does NOT reinvent sample shipment — plugs into the existing OpenELIS shipment module (referral/transfer infrastructure) and overlays EQA-specific fields only. DOES create `eqa_participant_followup` records and drives cycle through an explicit state machine (V2.1 FR-V2.1-18).
- **Carbon components:** `Modal` with `ProgressIndicator` (wizard), `DataTable`, `Tile`, `Tag` (cycle state), `Button` (bulk actions), `Accordion` (per-participant drill-in), `Select`, `DatePicker`, `NumberInput`, `Checkbox` (homogeneity QC gate), `InlineNotification` (overdue-receipt warnings), `Breadcrumb`.

### Functional requirements

**FR-V2.5-01 — Provider scheme list.** `/eqa/management/provider/schemes`. DataTable of schemes managed by this lab (i.e., where current lab is the administrator, not a participant). Columns: Scheme name, scheme_type, Active cycles, Enrolled participants, Last distribution, Actions.

**FR-V2.5-02 — Panel definition + cycle creation wizard.** From scheme detail → "Create new cycle + panel". Wizard (Modal, acceptable for 5+ sections):
- Step 1: cycle details (number, name, distribution date, submission deadline).
- Step 2: panel samples + source. Source block: `source_type` (in-house aliquoted / vendor-sourced / mixed); if vendor or mixed, `vendor_name`, `vendor_lot`, `vendor_certificate_ref`; `lot_number`; `storage_temp`; `expiration_date`. Samples table: sample_code (e.g., "WHO-HIV-01"), analyte, target_value, target_unit, acceptance range low / high. Bulk-entry or row-by-row. No blind codes (external participants aren't blinded — they just run the samples).
- Step 3: participant selection — list of enrolled participants (from V1 `eqa_program_enrollment`), select which to include. Default = all active. Reserve count: `aliquots_reserved` defaults to `max(10% of participant_count, 5)` and is editable.
- Step 4: distribution method — FHIR bundle to each participant's endpoint, or CSV export for manual delivery, or mixed (per-participant preference from enrollment).
- Step 5: confirm & begin prep → creates `eqa_panel`, `eqa_panel_sample` rows (with `source_type`, lot, inventory fields, storage temp, expiration per FR-V2.1-17); **transitions cycle to `prep_in_progress`** (no longer to `distributed` — distribution is now gated on the prep workbench + shipment workbench completing). Emits placeholder per-participant distribution records awaiting shipment.

**FR-V2.5-12 — Prep workbench.** `/eqa/management/provider/cycles/{id}/prep` (sidebar child of an active cycle in `prep_in_progress` state). Visible only while cycle is in `prep_in_progress` or for audit reference afterward. Shows:
- **Panel inventory section:** source_type, lot_number, storage_temp, expiration_date (editable while in prep). For vendor_sourced, vendor_name + vendor_lot + certificate reference. For in_house_aliquoted, a progress widget: `aliquots_produced` (NumberInput, editable) vs. `aliquots_needed = participant_count × samples_per_participant + aliquots_reserved`. Visual: green when produced ≥ needed, amber when close, red when short.
- **Homogeneity QC gate:** Checkbox `homogeneity_qc_passed` + free-text `homogeneity_qc_notes` (required when checkbox true). MVP rule: a supervisor (permission `eqa.provider.manage`) ticks this when satisfied the batch is ready. V3.5 replaces with a structured ISO 17043 protocol.
- **Ready-to-ship action:** "Mark panel ready to ship" button — enabled only when `aliquots_produced ≥ aliquots_needed` AND `homogeneity_qc_passed = true`. Clicking transitions cycle to `ready_to_ship`.
- **Audit sub-section:** shows prep actions (aliquot count changes, QC sign-off) as an inline audit log.

**FR-V2.5-13 — Shipment workbench (plugs into existing OpenELIS sample shipment module).** `/eqa/management/provider/cycles/{id}/shipments`. Visible while cycle is in `ready_to_ship`, `shipped`, or `delivered`. **Integration note:** this screen reuses the existing OpenELIS sample shipment / tracking module (currently used for referrals out — per `env-vector-workflows.md` S-14 inter-lab sample transfer). Dev discovery is needed to confirm exact API surface; the expected shape is that each EQA per-participant distribution references a `sample_shipment` record, and the EQA UI adds a thin overlay for EQA-specific fields. Do not fork or clone the shipment module.
- **DataTable:** one row per expected participant shipment. Columns: Participant (lab name + country), Address, Samples (count + sample codes), Courier (Select — populated from existing OpenELIS courier config), Tracking number (TextInput), Shipped-at temp (Select — matches `storage_temp` by default, editable), Shipped date (DatePicker), Expected delivery date (DatePicker — default: shipped_date + scheme's `default_transit_days`), Actions (Print pack list, Print shipping label, Mark shipped).
- **Pack list PDF:** lists sample codes + handling instructions + cycle + scheme + participant info. Printable.
- **Shipping label PDF:** courier-agnostic label template with participant address + cold-chain sticker cues; printable.
- **Bulk actions:** "Mark all shipped (today)" — sets `shipped_date = today` for all rows with tracking_number populated and currently in `printed` status.
- **Cycle state transition:** when the first row moves to `shipped`, cycle moves from `ready_to_ship → shipped`.

**FR-V2.5-14 — Receipt confirmation monitoring.** Same `/eqa/management/provider/cycles/{id}/shipments` surface, extended or a sibling sidebar child "Receipt status." Once cycle is in `shipped` state:
- Per-row: Expected delivery date, Actual delivery date (populated by participant-side receipt event per V2.2 FR-V2.2-12; manual fallback for non-FHIR participants), Delivery status (`in_transit` / `delivered` / `overdue` / `damaged`), Temperature-on-arrival (if reported by participant), Notes.
- **Overdue rule:** shipment is `overdue` when `now > expected_delivery_date + 2 business days` AND `actual_delivery_date IS NULL`.
- **Temperature excursion flag:** if participant reports received-temp outside expected (`shipped_at_temp ± 1 step`), row flagged with an `InlineNotification`-style warning; provider can clear with notes or flag for reprovisioning (→ FR-V2.5-15).
- **Cycle state transition:** when every expected shipment has `actual_delivery_date` populated (confirmed or provider-manually), cycle moves from `shipped → delivered`. Then auto-advances `delivered → submissions_open`.

**FR-V2.5-15 — Repeat-test reprovisioning.** Triggered from FR-V2.5-06 follow-up register "Flag for repeat testing" action OR from FR-V2.5-14 damaged/excursion flag:
- Modal: shows current reserve count (`eqa_panel.aliquots_reserved`); provider enters number of aliquots to pull + reason code (participant repeat / courier damage / temperature excursion / other).
- On confirm: decrements `aliquots_reserved`, increments `aliquots_shipped`, creates a new `sample_shipment` record with `repeat_of_shipment_id` pointing to the original shipment, and a new per-participant distribution record linked to the follow-up entry (if source is follow-up) or to the original shipment (if source is damage).
- New shipment row appears on the Shipment workbench (FR-V2.5-13) in `ready_to_ship` sub-status; same print + track workflow.
- If `aliquots_reserved = 0`: modal shows a hard warning; provider can override (records a "no reserve available — panel depleted" note) or cancel.

**FR-V2.5-16 — Cycle state banner + timeline.** On every provider cycle page (wizard-created cycles and all their submenu children: Prep, Shipments, Receipt, Performance, Follow-Up): render a persistent header showing breadcrumb, current `eqa_cycle.status` as a colored Tag, and a "next action" hint (e.g., in `prep_in_progress`: "Complete prep + homogeneity QC to enable shipping"; in `shipped`: "Awaiting N of 28 receipt confirmations"). Below the header, a collapsed Accordion "Cycle timeline" shows each state transition with timestamp + actor (drawn from V2.1 FR-V2.1-21 `eqa_cycle_state_transition` audit table). No in-page Tabs — use sidebar children.

**FR-V2.5-03 — Participant result intake (as provider).** Mirror of V2.2 FR-V2.2-08 but on provider side. When a participant submits (FHIR, CSV, manual), their results land in `eqa_result` (provider-side) with `eqa_distribution_id`. Scoring runs: for each result, compute z-score against panel target + group statistics (per BR-006 thresholds). Populate `performance_status`.

**FR-V2.5-04 — Score distribution to participants.** Once all expected participants have submitted (or the cycle closes post-deadline), provider clicks "Distribute scores" which:
- Sends each participant their results via FHIR (if endpoint configured) or packages a PDF / CSV performance report.
- Triggers score-intake at each participant lab (populating their `eqa_participant_result.eqa_result_id` link).
- Transitions provider-side cycle to `scored`.

**FR-V2.5-05 — Participant performance dashboard.** `/eqa/management/provider/performance`. Per-scheme view with:
- **Participant table:** lab name, country/region, enrollment status, rolling pass rate (last 4 cycles), most recent performance status, open follow-ups.
- **Drill-in per participant:** cycle history, z-score per analyte per cycle (table), persistent-failure flag.

**FR-V2.5-06 — Follow-up register.** `/eqa/management/provider/followup`. DataTable of `eqa_participant_followup` rows. Columns: Participant, Scheme, Cycle, Reason (unacceptable / persistent / escalation), Status, Last action, Assigned to. Row expansion for triage actions:
- **Notify participant** — sends templated notification (email / FHIR CommunicationRequest); status → `notified`.
- **Record response** — free-text notes; status → `response_received`.
- **Flag for repeat testing** — provider agrees to send a replacement sample; invokes FR-V2.5-15 reprovisioning (modal to pull from reserve aliquots, creates linked shipment); status → `under_investigation`.
- **Escalate** — status → `escalated`, assigned to senior coordinator; optional external notification (accreditation body).
- **Resolve** — status → `resolved`, with resolution note.
- **Remove from program** — status → `removed_from_program`; updates participant enrollment to `withdrawn`.

**FR-V2.5-07 — Auto-open follow-up on unacceptable.** When provider-side scoring completes, for each participating lab's result where `performance_status = 'unacceptable'`:
- If no open follow-up exists for `(scheme_id, cycle_id, participant_org_id)`: create `eqa_participant_followup` with `status = 'notified'` (assuming FR-V2.5-04 score distribution triggers notification), `reason = 'unacceptable_result'`, `assigned_to = scheme coordinator`.
- If an open follow-up exists for the same scheme + participant on a prior cycle: flag `persistent_failure_flag = true`.
- **Persistent-failure rule:** 2 unacceptable results within the last 3 cycles for the same participant + analyte → auto-escalate (status → `escalated`, notification to senior coordinator).

**FR-V2.5-08 — Persistent non-performance monitoring.** Provider performance dashboard shows a "Persistent non-performance" tile listing participants who meet the FR-V2.5-07 persistence rule but haven't been auto-escalated (i.e., where the coordinator hasn't acted). Tile auto-updates nightly.

**FR-V2.5-09 — Audit trail.** Panel creation, distribution, score calculation, follow-up creation + status changes — all audit-logged.

**FR-V2.5-10 — Permissions.** `eqa.provider.manage` (scheme + panel creation, prep workbench incl. homogeneity QC sign-off, reprovisioning), `eqa.provider.ship` (record shipments, print labels, mark shipped), `eqa.provider.distribute` (distribute scores), `eqa.provider.followup` (manage follow-ups), `eqa.provider.view` (read-only, including receipt status monitoring).

**FR-V2.5-11 — i18n.** `eqa.provider.*`, `eqa.followup.*`, `eqa.shipment.*`, `eqa.prep.*`.

### Non-functional

- **Scale.** Target: 50 participants per scheme × 20 schemes per deployment without pagination stutter. Persistent-failure query runs nightly as a batch job.
- **Notification delivery.** FHIR + email both supported; fallback to manual (CSV export) if neither configured.
- **Shipment module integration.** Dev discovery spike required early in V2.5 to confirm the existing OpenELIS sample shipment module API surface. If the existing module cannot cover EQA's fields, the spike should produce an overlay proposal — NOT a clone. A clone is explicitly out of scope.
- **State machine atomicity.** Cycle state transitions are atomic; concurrent attempts (e.g., two coordinators click "Mark all shipped" simultaneously) are serialized and produce one final state, not a corrupted partial transition.
- **PDF generation.** Pack list + shipping label PDFs render in < 2s for a 50-participant batch on commodity hardware. Generated PDFs are stored referenced by `pack_list_pdf_ref` / `shipping_label_pdf_ref` for audit reproducibility.
- **Audit completeness.** Every state transition AND every reprovisioning action must be recoverable from the audit log — the Cycle timeline Accordion (FR-V2.5-16) is the primary verification surface.

### Acceptance criteria

- **AC-V2.5-01** Panel definition wizard creates `eqa_panel` + `eqa_panel_sample` rows with `source_type`, `lot_number`, inventory + storage fields populated; cycle transitions to `prep_in_progress`; placeholder per-participant distribution records created awaiting shipment.
- **AC-V2.5-02** Participant submission via FHIR lands in `eqa_result` with correct z-score.
- **AC-V2.5-03** Score distribution pushes results to each participant (FHIR outbound OR CSV export); cycle transitions `scoring → scored`.
- **AC-V2.5-04** Participant performance dashboard shows correct pass rates for seeded scenario.
- **AC-V2.5-05** Unacceptable participant result auto-creates `eqa_participant_followup`.
- **AC-V2.5-06** Second unacceptable in last 3 cycles auto-sets `persistent_failure_flag` and transitions follow-up to `escalated`.
- **AC-V2.5-07** Follow-up register triage actions (notify/record-response/repeat/escalate/resolve/remove) all update status correctly; "Flag for repeat testing" opens the reprovisioning modal (FR-V2.5-15).
- **AC-V2.5-08** "Remove from program" withdraws the enrollment (updates V1 `eqa_program_enrollment.status`).
- **AC-V2.5-09** Follow-up CSV export matches displayed data.
- **AC-V2.5-10** Provider-role unacceptable result does NOT create a local NCE (per V2.3 FR-V2.3-01 scoping — verified in E2E).
- **AC-V2.5-11** Prep workbench "Mark panel ready to ship" button is disabled until `aliquots_produced ≥ aliquots_needed` AND `homogeneity_qc_passed = true`; clicking transitions cycle to `ready_to_ship`.
- **AC-V2.5-12** Shipment workbench creates per-participant shipment records via the existing OpenELIS sample shipment module (not a parallel table); pack list + shipping label PDFs print correctly; first `shipped_date` populated transitions cycle to `shipped`.
- **AC-V2.5-13** When all expected shipments have `actual_delivery_date` populated (via participant receipt event or manual confirm), cycle transitions `shipped → delivered → submissions_open` automatically.
- **AC-V2.5-14** Overdue-receipt rule fires when `now > expected_delivery_date + 2 business days` with no `actual_delivery_date` — row tagged `overdue`, dashboard shows warning.
- **AC-V2.5-15** FR-V2.5-15 reprovisioning decrements `aliquots_reserved`, creates shipment with `repeat_of_shipment_id`, and appears on the shipment workbench in `ready_to_ship` sub-status. If reserve = 0, provider gets a warning modal with override + reason-note option.
- **AC-V2.5-16** Cycle state banner always shows correct `eqa_cycle.status` Tag + "next action" hint on every provider cycle submenu page; Cycle timeline Accordion lists every state transition with timestamp + actor from the audit log.
- **AC-V2.5-17** Invalid state transitions (e.g., `prep_in_progress → shipped` skipping `ready_to_ship`) return HTTP 409 with a clear error message.

### Definition of Done

- [ ] Wizard implemented (includes source_type + inventory capture per Step 2).
- [ ] V2.1 FR-V2.1-17, -18, -19 migrations merged and tested.
- [ ] Prep workbench: inventory progress widget + homogeneity QC gate working; ready-to-ship button correctly gated.
- [ ] Shipment workbench: confirmed integration with existing OpenELIS sample shipment module (via dev discovery spike); pack list + shipping label PDFs print; mark-shipped bulk action transitions cycle state.
- [ ] Receipt monitoring: overdue flagging tested with mock time advancement; temperature excursion flag tested with seeded receipt event.
- [ ] Reprovisioning: end-to-end from follow-up flag → reserve decrement → new linked shipment → shipped → re-scored.
- [ ] Cycle state banner + timeline Accordion present on every provider cycle submenu page.
- [ ] Full provider-side state machine (FR-V2.1-18) tested with seeded 5-participant scenario — invalid transitions blocked (409).
- [ ] Scoring + distribution pipeline tested with seeded 5-participant scenario.
- [ ] Follow-up register all 6 triage actions tested.
- [ ] Persistent-failure rule validated across seeded cycles.
- [ ] FHIR outbound (score distribution) tested against stub participant endpoints.
- [ ] i18n added (`eqa.provider.*`, `eqa.followup.*`, `eqa.shipment.*`, `eqa.prep.*`).
- [ ] Merged.

### Out of scope

- ISO 17043 homogeneity / stability / panel production traceability (V3.5).
- Provider-side internal NCE triggers for provider's own ops failures (V3.6).
- Full accreditation-evidence export bundle (V3.1).

---

## EPIC 2 — EQA V3: Analytics, Compliance, and Integration Enhancements

**Proposed key:** OGC-EQA-V3-EPIC (placeholder)
**Type:** Epic
**Fix Version:** OpenELIS Global 3.4.0 (tentative)
**Labels:** `eqa` `iso-15189` `iso-17043` `global` `analytics` `quality-assurance` `enhancement`

### Epic summary

On top of V2 MVP, V3 delivers analytics (trending, coverage, annual summaries), cross-module integrations (IQC correlation, patient-impact look-back), provider-side ISO 17043 compliance (homogeneity, stability, full panel-production traceability, cycle-close certificates), provider-side internal NCE triggers for operational failures, provider-side proxy entry for offline participants (V3.7), and ePT-family FHIR interop (V3.8). Each story is independently valuable; deployments can adopt V3 items selectively based on accreditation priorities.

### Acceptance criteria (epic-level)

- **AC-E01** V2 MVP is in production and operational at ≥ 1 deployment before V3 work begins.
- **AC-E02** Each V3 child story is independently releasable.
- **AC-E03** V3.5 delivers ISO/IEC 17043 accreditation-ready panel traceability suitable for a provider-mode deployment seeking accreditation, including per-participant Certificates of Participation issued on cycle close.
- **AC-E04** V3.7 allows a provider admin with explicit permission to enter results on behalf of offline participants, with all participant-side dashboards (Lab Performance, Analyst Competency, Recent Cycles) attributing the result to the participating lab as `data_owner_org_id`, not to the provider lab.
- **AC-E05** V3.8 delivers an OpenELIS↔APHL-ePT interop shim: a V2.2 FHIR auto-submission from an OpenELIS-using participant to a scheme configured with `provider_fhir_endpoint_type = 'aphl_ept_fhir'` is accepted by an ePT-compliant endpoint and a subsequent scoring response round-trips into `eqa_participant_result.z_score` + `performance_status`.

### Child stories (outlines)

Full acceptance criteria and FRs for each will be written when the story is pulled into a sprint. Outlines here scope the work.

---

### V3.1 — Multi-Cycle Analytics

**Gaps:** G11, G12, G13, G14.
**Scope:**
- Multi-cycle trend charts per analyte / method / analyzer; line + scatter with ±2σ / ±3σ ribbons.
- Automated performance signals: 2-consecutive-unacceptable rule, drift detection (≥ N cycles of one-sided deviation), bias detection (mean ≠ target over window).
- Signals trigger either a Follow-Up Queue entry (V2.3) or an alert; configurable thresholds per deployment.
- Scheme coverage matrix (G14): exportable test-catalog × EQA-coverage view — which analytes have external PT, which in-house, which uncovered.
- Annual summary report: per-scheme, per-analyte, per-analyst rollup for ISO 15189 §7.7 audit evidence. Exportable as PDF + CSV + FHIR bundle.
- Extends V2.3 Lab Performance dashboard with trend charts and signals tab.

**Labels:** `eqa` `analytics` `reporting` `iso-15189`

---

### V3.2 — Cold-Chain Validators + Rejection Workflow

**Gap:** G5 (narrowed — the minimal receipt event is in V2.2 MVP per FR-V2.2-12).
**Scope:**
- **Temperature range validator:** compare `eqa_panel_receipt.received_temp_c` against the panel's `storage_temp` enum and per-scheme tolerance bands (e.g., `refrigerated_2_8C` → 2°C ≤ temp ≤ 8°C). Out-of-range logs a `cold_chain_deviation` event and raises an Alert to the participant QA officer + provider.
- **Packaging condition checklist** (structured replacement for the free-text `integrity_notes` field): ice-pack state, outer packaging damage, inner container damage, desiccant state, each as a controlled vocabulary.
- **Rejection workflow:** when `integrity_ok = false` AND severity = reject (vs. accept-with-notes), cycle transitions `panel_received → panel_rejected` (new state added in V3.2 migration). Provider notified via FHIR. On replacement arrival, a new `eqa_panel_receipt` row is created with `replaces_receipt_id` FK; cycle returns to `panel_received`. Ties into V2.5 reprovisioning (FR-V2.5-15) as an auto-trigger.
- **Cold-chain deviation record** linked to score interpretation: does not block testing, but the deviation flag appears on the scored report so the provider can weigh-against an unacceptable result.
- **Shipment-side deviation capture:** provider can record `shipped_at_temp` excursions during transit (courier-reported or data-logger feed) that then correlate with participant-side receipt temps.

**Explicitly out of scope (stays in V2.2):** the receipt event itself (`received_date`, `received_by`, `integrity_ok` checkbox, free-text notes) and the `eqa_panel_receipt` table — those ship in V2.2 FR-V2.2-12 / V2.1 FR-V2.1-20 to unblock V2.5 FR-V2.5-14's `delivered` state contract.

**Labels:** `eqa` `cold-chain` `panel-receipt` `iso-17043`

---

### V3.3 — IQC ↔ EQA Correlation

**Gap:** G7.
**Scope:**
- When an NCE is created with `trigger_source = 'eqa_unacceptable'` (V2.3 FR-V2.3-01), the NCE investigation page shows a new **"Same-run IQC"** section.
- Queries the Westgard QC module for all IQC runs on the same instrument + analyte + within the shift window around the EQA run.
- Shows: QC state (in-control / violation), Westgard rule hits, recent Levey-Jennings chart snippet.
- Bidirectional: NCEs from Westgard Trigger #10 also show related EQA results if any in the window.
- Helps root-cause analysis distinguish "isolated EQA failure" from "system-wide QC problem."

**Labels:** `eqa` `iqc` `nce` `investigation` `cross-module`

---

### V3.4 — Patient Impact Look-Back

**Gap:** G8.
**Scope:**
- NCE investigation page (when `trigger_source = 'eqa_unacceptable'` — or more broadly, any QC-related NCE) gains a **"Patient impact worklist"** tab.
- Queries all patient samples run on the same instrument + analyte + within the impact window (configurable — default = last IQC-passing run to first IQC-passing run after the unacceptable result).
- Worklist columns: patient sample ID, order date, result, clinician, clinical impact assessment (field for QA officer).
- Supports ISO 15189 §7.5 "when QC or EQA indicates an error, the laboratory shall identify and evaluate the impact on patient results."
- Triggers on the NCE investigation page, not a standalone screen.

**Labels:** `eqa` `patient-safety` `nce` `iso-15189` `look-back`

---

### V3.5 — ISO 17043 Provider Compliance

**Gap:** G10.
**Scope (new entities + workflows):**
- `eqa_panel_homogeneity_test` — panel homogeneity test records (which samples, which replicates, ANOVA result, within-bottle vs. between-bottle variance, pass/fail).
- `eqa_panel_stability_test` — stability tests at defined time points (e.g., T0, T30, T90 days) against a reference.
- `eqa_panel_lot` — lot-level traceability (source material, production batch, expiry, storage location).
- Panel production workflow: prepare → homogeneity test → stability testing → release-for-distribution (blocked until homogeneity pass + stability evidence).
- Deviation / investigation sub-workflow: homogeneity failure → hold → investigate → reject or release with caveat.
- ISO 17043 audit-evidence export bundle per panel.
- **Cycle-close certificate generation.** On cycle transition to `closed` AND when the scheme has `certificates_enabled = true` (new flag), generate a per-participant ISO 17043-compliant Certificate of Participation (PDF) — one per `lab_enrollment` — with: scheme name + accreditation reference, cycle number + distribution / submission dates, participant lab name + accreditation number, analytes tested, performance summary per analyte (result value, target, z-score / categorical match, acceptable / unacceptable), issuing provider signature block (provider-org + scheme coordinator + digital signature date), and certificate serial number. Certificates are stored against the cycle (`eqa_cycle_certificate` with `certificate_serial`, `participant_org_id`, `pdf_blob_ref`, `generated_at`, `regenerated_count`) and exposed to the participant on their Recent Cycles screen (V2.3 FR-V2.3-07) and to the provider on the Cycle page. Regeneration is permitted but increments `regenerated_count` and appends a "supersedes serial X" watermark. Out of scope of V3.5: physical signatures (PDF is accepted as the issuing artifact — hard-copy delivery handled by deployment); bilingual certificate templates (single-locale per scheme in V3.5; multi-locale is V3.1 analytics scope).
- **Upgrades V2.5:** panel definition wizard gains an optional "ISO 17043 mode" when enabled per-deployment that inserts homogeneity + stability steps between Step 2 and Step 5; scheme-config wizard gains a `certificates_enabled` toggle (default off for V2.5-seeded schemes; default on for newly-created provider schemes in deployments that enable V3.5).

**Labels:** `eqa` `provider` `iso-17043` `homogeneity` `stability` `accreditation`

---

### V3.6 — Provider-Side Internal NCE Triggers

**Scope:** New NCE trigger sources for the provider's own operational failures:
- **Panel defect** — triggered by homogeneity fail (V3.5).
- **Scoring error** — triggered manually or by detection of inconsistent z-scores across a participant cohort.
- **Distribution deadline miss** — triggered when an `eqa_round.distribution_date` passes without the panel being distributed.
- **Cluster-failure detection** — nightly job detects when ≥ X% of participants in a cycle fail the same analyte → suspect bad panel; opens NCE for panel review.
- **Storage / cold-chain failure on provider side** — if a stored panel exceeds its temperature range.
- All feed into the existing NCE register with appropriate `trigger_source` values; reuse `nce_capa` workflow.

**Labels:** `eqa` `provider` `nce` `iso-17043` `provider-ops`

---

### V3.7 — PT Hub: Provider-Side Proxy Entry for Offline Participants

**Context:** ePT platforms (APHL ePT and similar) have always needed a way for provider-side admins (national reference labs, scheme coordinators) to enter results on behalf of participating labs that cannot submit electronically — paper forms, phone / SMS dictation, email PDF scans. The lesson from ePT's deployments across 10+ countries is that this is not a fringe case: for many rural / public-sector participants it is the primary submission channel, and a provider program that cannot accommodate it excludes the labs that need PT oversight most.

**Gap:** Not covered by a V2 gap (G1–G15) because V2.5 assumes the participant is an OpenELIS-using lab; there is no provider-side surface for entering somebody else's results.

**Scope (new entities + surfaces):**
- **Proxy-entry permission** — new role permission `eqa.provider.proxy_entry` (separate from `eqa.provider.manage`; default off; granted explicitly).
- **Proxy-entry surface** — on the provider Cycle page (V2.5), a "Proxy entry" action visible to users with `eqa.provider.proxy_entry` that opens a result-entry form per participant per analyte. Mirrors the standard result entry UX but authored in the provider lab's session.
- **Data attribution rules on `eqa_participant_result`.** Two distinct columns:
  - `entered_by` — set to the provider admin user who typed the result.
  - `data_owner_org_id` — set to the participating lab's organization ID (NOT the provider lab). This is what all participant-side views (Lab Performance, Analyst Competency, Recent Cycles) filter by. A participating lab sees its own proxy-entered results in its dashboards exactly as if it had entered them itself; the provider's own Lab Performance does not inflate with other labs' numbers.
  - `data_source` enum extended with `proxy_paper`, `proxy_phone`, `proxy_email`, `proxy_sms`, `proxy_other` (required when `entered_by_org != data_owner_org`).
  - Optional `proxy_entry_notes` (free text: "received via email from M. Kamau 2026-05-14 PDF attached").
- **Optional attachment.** File upload slot (image/PDF) to attach the original paper / scan for audit.
- **Visibility parity.** Proxy-entered results participate in scoring identically to electronic submissions. There is no `proxy_mode` flag that changes scoring rules — only attribution.
- **No round-trip to the participant by default.** Notifying the participant that proxy entry occurred is out of scope; V3.8 FHIR interop (below) is a better long-run answer than bolting a participant-confirmation flow onto V3.7.

**ACs (outline):**
- A provider admin with `eqa.provider.proxy_entry` enters a result for participant lab X; the lab X QA officer sees the result in Recent Cycles + z-score in Lab Performance identically to a self-entered result, with a small "source: proxy (paper)" tag for audit visibility.
- A provider admin without the permission does not see the Proxy-entry action (not just hidden — 403 on the API if they guess the URL).
- `data_owner_org_id != entered_by_org` requires a non-null `data_source` (422 otherwise).
- Provider Lab Performance does not include proxy-entered results in the provider's own analyst competency view (filter by `data_owner_org_id = provider_org`).

**Labels:** `eqa` `provider` `proxy-entry` `accessibility` `equity` `audit`

---

### V3.8 — ePT FHIR Interop: Discovery + Adapter Shim

**Context:** APHL's ePT + InteLIS + tbPT family of platforms has run in 10+ countries since 2014, with established test-domain forms (HIV serology rapid, HIV VL, EID, HIV recency, COVID-19, TB). OpenELIS will not and should not replace those deployments; but a country that runs ePT as its provider-side PT platform and OpenELIS as its participating labs' LIS should be able to submit results + receive scores without manual CSV uploads. V3.8 is the adapter shim that makes that possible without coupling either side to the other's schema.

**Gap:** Not explicitly in G1–G15. Partially overlaps with the V2.2 FHIR auto-submission path (FR-V2.2-05) — V3.8 is the work that makes that path talk to an actual ePT endpoint rather than a generic FHIR stub.

**Scope:**
- **Discovery spike (pre-implementation).** Verify (a) which FHIR resources + profiles APHL ePT / InteLIS actually implement today on the receiving side (DiagnosticReport? Observation-per-analyte? a custom bundle?); (b) what the scoring-return channel looks like (inbound FHIR vs. CSV export vs. API polling); (c) whether there is a published ePT-side `CapabilityStatement` or whether the integration has to be reverse-engineered from the PHP source. Deliverable: `docs/eqa/ept-fhir-discovery.md` with a resource-by-resource capability matrix + identified gaps.
- **`provider_fhir_endpoint_type` on `eqa_scheme`** — discriminator: `generic_fhir_r4` (the V2.2 default), `aphl_ept_fhir`, `aphl_intelis_fhir`, `custom`. The V2.2 auto-submission path (FR-V2.2-05) dispatches on this discriminator: generic stays on the stub; the two APHL-family values route through the adapter shim.
- **Adapter shim** (`eqa-adapter-aphl-ept`). Translates OpenELIS's `eqa_participant_result` + cycle + panel context into the shape ePT expects on submission, and translates scoring responses back into the `submission_status = 'scored'` + `z_score` + `performance_status` fields. Adapter lives in its own Java module so it can be loaded/excluded at build time.
- **Configuration UI.** Admin surface for entering an ePT endpoint URL, auth credential, and country-deployment identifier per scheme (not global). Credentials stored in the existing OpenELIS secret store; never exposed in the scheme read API.
- **Non-scope for V3.8:** bidirectional enrollment sync (let participants self-enroll in ePT from OpenELIS); certificate pull-back from ePT; InteLIS-side modifications. All of those are follow-ups.

**ACs (outline):**
- With `provider_fhir_endpoint_type = 'aphl_ept_fhir'` and a valid endpoint, a V2.2 auto-submission produces a bundle accepted by an ePT-compliant stub; on failure, the Alerts entry identifies the adapter (not a generic FHIR error).
- Scoring responses arriving from ePT are parsed by the adapter and write `eqa_participant_result.z_score` + `performance_status` identically to the generic path.
- The discovery-spike document exists, is dated, and names the ePT version it was validated against.

**Dependencies:** V2.2 (FR-V2.2-05 auto-submission path), V3.5 if ePT-returned certificates are to be stored in `eqa_cycle_certificate`.

**Labels:** `eqa` `fhir` `interop` `aphl-ept` `intelis` `participant` `global`

---

## Mappings

### Stories ↔ Crosswalk gaps

| Gap | Story |
|---|---|
| G1 — Cycle/Round entity | V2.1 |
| G2 — Participant-side result path | V2.1 |
| G3 — Pre-submission review (optional, via flag) | V2.2 |
| G4 — Per-analyst track | V2.3 |
| G5 — Panel receipt + cold-chain | V2.2 (minimal receipt event) + **V3.2** (structured cold-chain + rejection) |
| G6 — CAPA for unacceptable (as NCE integration) | V2.3 |
| G7 — IQC ↔ EQA correlation | **V3.3** |
| G8 — Patient-impact look-back | **V3.4** |
| G9 — In-house scheme | V2.1 (schema) + V2.4 (workflow) |
| G10 — ISO 17043 provider homogeneity/stability | **V3.5** |
| G11 — Multi-cycle trending | **V3.1** |
| G12 — Automated performance signals | **V3.1** |
| G13 — Annual summary + accreditation export | **V3.1** |
| G14 — Scheme coverage matrix | **V3.1** (also partially exposed in V2.3 Lab Performance Coverage tab) |
| G15 — Split-sample reports | Deferred |
| R1 — Participant-side data path | V2.1 |
| R2 — BR-004 blocks in-house | V2.1 |
| R3 — Provider as text, not entity | Deferred |
| R4 — Carbon fidelity on enrollment UI | V2.2 |
| R5 — Test-flag vs. sample-flag | V2.1 |
| R6 — Alerts as aspirational lab-wide module | V2.2 (uses existing Alerts for submission failures); V3.1 extends |

### Stories ↔ Compilation phases (29 phases)

| Phase | Coverage |
|---|---|
| P1 Scheme discovery + enrollment | V1 + V2.2 (Carbon port) |
| P2 Panel receipt + cold-chain | V2.2 minimal event / **V3.2** structured |
| P3 Testing execution | V1 std result entry |
| P4 Validation | V1 std reviewer |
| P5 Submission | V2.2 |
| P6 Score intake + performance status | V2.2 |
| P7 Investigation of unacceptable | V2.3 (NCE) |
| P8 Corrective action | NCE module (reused) |
| P9 Multi-cycle trending | **V3.1** |
| P10 Coverage gap analysis | V2.3 (basic) + **V3.1** (full) |
| P11 Annual summary | **V3.1** |
| P12 Portfolio dashboard | V2.3 (Lab Performance) |
| P13 Analyst assignment | V2.3 |
| P14 Analyst competency aggregate | V2.3 |
| P15 Scheme/program setup | V1 |
| P16 Participant enrollment (provider) | V1 |
| P17 Panel formulation + manufacture | V2.5 (MVP) + **V3.5** (ISO 17043) |
| P18 Homogeneity + stability | **V3.5** |
| P19 Panel distribution | V2.5 |
| P20 Score calculation | V2.5 |
| P21 Performance report to participants | V2.5 + **V3.5** (Certificates of Participation on cycle close) |
| P22 Participant follow-up | V2.5 |
| P23 Provider-side internal NCE triggers | **V3.6** |
| P24 Program review / improvement | **V3.1** + **V3.5** |
| (Cross-cutting) Offline-participant proxy entry | **V3.7** |
| (Cross-cutting) ePT-family FHIR interop | **V3.8** (extends V2.2 FR-V2.2-05 auto-submission) |
| P25 In-house scheme definition | V2.1 |
| P26 Blinded sample preparation | V2.4 |
| P27 Blinded distribution | V2.4 |
| P28 Unblinding | V2.4 |
| P29 In-house scoring vs. sealed target | V2.4 |

**V2 MVP covers 22 of 29 phases fully + 2 partially (P10, P17). V3 completes the remaining 7.**

---

## Filing checklist (for Casey)

When ready to file:
1. Confirm OGC epic key for Epic 1; file as Epic.
2. File V2.1–V2.5 as children with `depends-on` links per story §Depends on.
3. Link NCE module Jira story as dependency on V2.3.
4. Confirm labels: defaults above are suggestions.
5. File Epic 2 (V3) as a separate Epic with V3.1–V3.8 outlines (V3.7 = PT Hub proxy entry, V3.8 = ePT FHIR interop) — flesh out each story when pulled into a sprint.
6. Attach `eqa-v2-preview.html` to Epic 1.

**End of stories draft.**
