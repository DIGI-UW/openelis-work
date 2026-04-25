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

*Standard result-entry integration point:* this FR is a targeted edit to the existing `ResultEntry` React view (the standard OpenELIS result-entry grid shared across all sample types — not a V2.3-new screen). Column insertion order: **right of the existing analyst-facing result fields (Result value / Unit / Flags / Note) and left of the row-level Actions column.** The column header reads "Analyst (EQA)" with a help Tooltip explaining the conditional render. The column is hidden (not empty) when the conditional predicate is false — i.e., the DOM must not render the column header at all for non-EQA rows, because mixed visibility within one grid would leak the EQA flag to bench techs looking at neighboring patient samples. When a result entry grid is showing a mix of EQA and non-EQA samples, the column renders for all rows but displays a disabled placeholder cell ("—") for the non-EQA rows, so the bench tech sees uniform structure while only EQA rows accept input. No standalone mockup screen is required; reviewers should treat this as a surgical edit alongside the existing grid.

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

*Role-conditional rendering on the "Schemes & Programs" sidebar entry:* the sidebar item `Schemes & Programs` under the **EQA Program Management** lane resolves to a page that composes **two** panels — (a) provider-scheme administration (this FR's DataTable, for schemes where the current lab is the administrator) and (b) participant-side scheme discovery + enrollment (the V1 scheme-catalog surface carried forward). Which panel renders depends on the viewer's permissions:
- User with `eqa.provider.manage` — sees both panels, provider admin on top.
- User with only `eqa.enter` / `eqa.review` (participant-side) — sees only the participant panel; the provider admin panel is hidden and the sidebar hint says "Participant view only."
- User with neither — the sidebar item itself is hidden per the lane's provider-only visibility rule.

A single route renders the role-appropriate subset; the participant-only view is NOT a different URL. This avoids a brittle role-splitter in the router and keeps the sidebar IA stable across deployments.

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

## STORY V3.1 — Multi-Cycle Analytics

**Proposed key:** OGC-EQA-V3.1 (placeholder)
**Type:** Story
**Parent Epic:** EQA V3
**Story points (estimate):** 16
**Labels:** `eqa` `analytics` `reporting` `iso-15189` `global`
**Fix Version:** OpenELIS Global 3.4.0 (tentative)
**Gaps addressed:** G11 (multi-cycle trending), G12 (automated signals), G13 (annual summary), G14 (coverage matrix — upgrade from V2.3 basic view).

### Summary

On top of V2.3 Lab Performance, deliver multi-cycle trend analytics, automated performance signals that feed the Follow-Up Queue, a full scheme coverage matrix (upgrading V2.3's basic coverage view), and an annual summary report for ISO 15189 §7.7 audit evidence.

### User stories

> As a **QA officer**, I want trend charts across cycles for each analyte so I can spot drift or bias that a single-cycle score can't reveal.
>
> As a **QA officer**, I want the system to flag performance signals (two consecutive unacceptables, sustained one-sided deviation) automatically so I don't rely on memory or manual review.
>
> As a **lab director preparing for accreditation**, I want an annual EQA summary per scheme / analyte / analyst that I can hand to an ISO 15189 auditor as evidence.
>
> As a **lab director**, I want a full coverage matrix exportable to CSV so I can see which clinically-reported analytes have external PT, which are on in-house schemes, and which are uncovered.

### Design brief

- **Purpose:** Turn the per-cycle V2.3 dashboard into a multi-cycle story by adding trends, signals, and summary export.
- **Primary user action:** Open an analyte's trend chart, assess drift vs. random variation, and either dismiss, flag for follow-up, or escalate.
- **Layout pattern:** Extension of the V2.3 Lab Performance sidenav submenu — adds two new children under **EQA Oversight → Lab Performance**: **Trends** and **Signals**. The existing **Coverage** submenu child gains an "export" affordance and a column for "Trend" (link to the relevant Trend view). **Annual summary** is an export action, not a new screen.
- **Interaction model:** Analyte-centric. Trend view shows a per-analyte line chart with ±2σ / ±3σ ribbons and scored points overlaid. Signals screen is a table of open signals (drift, bias, consecutive-unacceptable) with row expansion showing the evidence window.
- **Scope boundary:** Does NOT replace V2.3 NCE creation — signals route to the existing Follow-Up Queue, and the QA officer's existing triage paths (escalate / dismiss) are unchanged. Does NOT add per-analyst trend charts in V3.1 (analyst is a filter, not a separate sub-screen). Does NOT add cross-scheme aggregation (each scheme's trend stays separate — avoids comparing incommensurate providers).
- **Carbon components:** `DataTable`, `Tile`, `Tag`, `Select`, `ComboBox`, `DatePicker`, `Accordion`, `Button`, `InlineNotification`. Charting via the existing OpenELIS charting library (the one used by Westgard QC); do NOT introduce a second charting dependency.

### Functional requirements

**FR-V3.1-01 — Trends sub-screen.** Route: `/eqa/oversight/lab-performance/trends`. Filter bar: Analyte (required, Select), Scheme (Select, optional — "All" default), Analyst (Select, optional — "All" default; only populated when the scheme has `per_analyst = true`), Date range (DatePicker, default = trailing 24 months). Below the filter bar, a line+scatter chart rendered with x-axis = cycle distribution date, y-axis = reported value for numeric analytes OR categorical match/mismatch for categorical analytes. Overlaid ribbons: target value line, ±2σ band, ±3σ band (σ from the scheme's acceptance range where available; else from the lab's historical SD per analyte × method). Points colored by `performance_status` (green acceptable / warm-gray questionable / red unacceptable / purple missed-deadline). Hover on a point shows cycle number, value, z-score (if present), and a link to the cycle page. Empty state: "No scored cycles in the filter window — broaden the date range or select a different analyte."

**FR-V3.1-02 — Signals detector (service layer).** A scheduled job (default nightly, configurable per instance) computes signals across every `(lab_enrollment_id, analyte_id)` pair over the trailing 12 months. Signals:
- **Consecutive unacceptable** — 2 or more scored results in a row with `performance_status = 'unacceptable'`.
- **Drift** — N consecutive scored results (N configurable, default 5) all on the same side of target (all above or all below) with a linear trend slope > configurable threshold.
- **Bias** — rolling mean over last N scored results (N configurable, default 8) differs from target by > 1σ where σ is the scheme's acceptance range / 4.
- **Near-miss clustering** — 3+ questionable results within 6 cycles (individually each was handled by V2.3 triage, but the cluster is a new signal).

Each signal is persisted in a new `eqa_performance_signal` table: `id`, `lab_enrollment_id`, `analyte_id`, `signal_type` (enum above), `detection_date`, `window_start_cycle_id`, `window_end_cycle_id`, `evidence_json` (the specific cycles + values that triggered), `status` (open / dismissed / followed-up), `dismissed_reason`, `linked_followup_id` (nullable FK to `eqa_participant_followup` when follow-up was opened).

**FR-V3.1-03 — Signals sub-screen.** Route: `/eqa/oversight/lab-performance/signals`. DataTable of open + recently-closed signals. Columns: Signal type (Tag — consecutive-unacceptable = red, drift = purple, bias = warm-gray, near-miss-cluster = blue), Analyte, Scheme, Detection date, Window (cycles involved), Status, Actions. Row expansion shows the evidence: mini trend chart of just the involved cycles, z-scores, and a "Open in Trends" link. Actions:
- **Create Follow-Up Queue entry** — enqueues a V2.3 Follow-Up Queue item with `Source = Performance signal` (new queue source value — FR-V3.1-06), links back via `linked_followup_id`, signal status → `followed-up`.
- **Dismiss with reason** — required category (`known_instrument_change`, `recent_calibration`, `method_change`, `variance_within_tolerance`, `other`) + free-text. Signal status → `dismissed`.
- **Escalate directly to NCE** — for consecutive-unacceptable of count ≥ 3, creates an NCE via the V2.3 NCE endpoint (payload analogous to FR-V2.3-01 but with `trigger_source = 'eqa_performance_signal'`). New trigger_source value added to NCE module enum — non-breaking.

**FR-V3.1-04 — Thresholds config.** Per-deployment admin page (under Admin → EQA Analytics): drift consecutive-count N, bias window N, near-miss window size, and per-analyte overrides. Writes to new `eqa_signal_config` table. Defaults seeded at install so the job runs out-of-the-box without configuration.

**FR-V3.1-05 — Coverage matrix upgrade.** V2.3 FR-V2.3-07's Coverage screen is extended:
- New **"Trend" column** — renders a 12-cycle sparkline inline for each analyte with scored results, clickable to open Trends view pre-filtered to that analyte.
- New **"Signals" column** — count of open signals for the analyte (Tag, red if ≥ 1).
- Column "Last score date" enhanced: if the last scored cycle is > 1 cycle-frequency old, the cell highlights in warm-gray with a tooltip ("Overdue — expected by YYYY-MM-DD per scheme frequency").
- Existing CSV export is extended to include the new columns; a new **PDF export** button is added producing a formatted report suitable for ISO 15189 §7.7 audit evidence.

**FR-V3.1-06 — V2.3 Follow-Up Queue integration.** V2.3 FR-V2.3-02's Source column enum is extended with `Performance signal` (new value). Source filter also gains this value. Queue rows with this source display the `signal_type` as a secondary chip in the Trigger column. Escalate-to-NCE from a signal-sourced queue item uses `trigger_source = 'eqa_performance_signal'` on the created NCE; dismiss writes a `dismissed_signal` competency event (no analyst attribution — signals are lab-level, not analyst-level).

**FR-V3.1-07 — Annual summary report.** New action on the Coverage screen: "Generate annual summary". Opens a Modal:
- Year selector (default = current year).
- Scheme scope (MultiSelect — "All this lab's schemes" is default).
- Output format (RadioButtonGroup — PDF / CSV / FHIR bundle).
- "Include analyst breakdown" checkbox (default on).

On submit, the system generates a summary document containing: lab identity block, scheme-by-scheme performance rollup (cycles attempted, on-time rate, acceptable rate, unacceptable count, open NCEs at year-end), per-analyte performance (acceptance rate, trend slope, signals detected + resolved), per-analyst performance if the flag is on (reuses V2.3 FR-V2.3-06 competency bands), and §7.7.2 alternative-assessment coverage for uncovered analytes. The PDF is also stored against the lab's record (new `eqa_annual_summary` table: `id`, `lab_id`, `year`, `generated_at`, `generated_by`, `pdf_blob_ref`, `csv_blob_ref`, `fhir_blob_ref`, `supersedes_id` nullable) so regeneration creates a new row rather than overwriting — audit-preserving.

**FR-V3.1-08 — Permissions.** `eqa.analytics.view` (trends + signals + coverage sparkline), `eqa.analytics.dismiss-signal` (dismiss a signal), `eqa.analytics.config` (threshold admin), `eqa.analytics.annual-summary` (generate + view the annual summary). Users with only V2.3 permissions see the V2.3 Coverage screen exactly as before; the new columns and actions degrade gracefully (hidden, not disabled) when `eqa.analytics.view` is absent.

**FR-V3.1-09 — i18n.** `eqa.analytics.trends.*`, `eqa.analytics.signals.*`, `eqa.analytics.annualSummary.*`, `eqa.analytics.config.*`.

**FR-V3.1-10 — Audit trail.** Signal generation, dismissal, follow-up creation, NCE escalation, annual summary generation — all audit-logged.

### Non-functional

- **Trend chart latency.** Chart must render within 1.5s for 24 months of cycle data (typical ceiling ~40 cycles per analyte at quarterly frequency).
- **Signal detector job runtime.** Must complete within 10 minutes for a deployment with 200 lab enrollments × 30 analytes × 24 months of history.
- **Coverage matrix + sparklines.** < 2s first paint for a 500-analyte catalog.
- **Annual summary generation.** PDF generation < 30s for a typical lab-year (10 schemes × 40 analytes × 4 cycles each).

### Acceptance criteria

- **AC-V3.1-01** Trends screen renders a line+scatter chart with ±2σ/±3σ ribbons for a seeded 10-cycle analyte; points colored by performance status.
- **AC-V3.1-02** Signal detector creates a `consecutive_unacceptable` signal when two sequential scored results are unacceptable; does not create one when the sequence is broken by an acceptable result.
- **AC-V3.1-03** Drift signal fires when N=5 consecutive results are all above target with positive slope above threshold; does not fire when slope is below threshold.
- **AC-V3.1-04** Bias signal fires when rolling mean of N=8 results differs from target by > 1σ; resolves (status → `dismissed` with `resolved_on_new_evidence`) automatically when the next scored result pulls the mean back within tolerance.
- **AC-V3.1-05** Creating a Follow-Up Queue entry from a signal inserts a V2.3 queue row with Source = "Performance signal" and the `signal_type` chip; escalating that queue entry to NCE produces an NCE with `trigger_source = 'eqa_performance_signal'`.
- **AC-V3.1-06** Coverage matrix shows sparkline for analytes with ≥ 2 scored cycles; for < 2 cycles shows "—".
- **AC-V3.1-07** Annual summary PDF contains the required sections (identity, scheme-by-scheme, per-analyte, per-analyst if enabled, §7.7.2 coverage); the CSV export contains the same data rows in machine-readable form.
- **AC-V3.1-08** Annual summary regeneration creates a new `eqa_annual_summary` row with `supersedes_id` pointing at the prior row; the prior row's PDF is still retrievable.
- **AC-V3.1-09** User with `eqa.analytics.view` sees trends, signals, and sparklines; user without does not (verified by API + UI).
- **AC-V3.1-10** Axe-core zero critical on Trends + Signals screens.
- **AC-V3.1-11** Localization: all strings resolve in en/fr/es.
- **AC-V3.1-12** No new charting library added — charts use the existing Westgard-QC chart library.

### Definition of Done

- [ ] Signal detector job unit-tested across all four signal types + edge cases (no history, single result, category-change mid-window).
- [ ] Trends + Signals screens implemented + merged.
- [ ] Coverage matrix upgrades (sparkline, signals column, PDF export) wired.
- [ ] Annual summary PDF template reviewed for ISO 15189 §7.7 evidence fit.
- [ ] `eqa_performance_signal`, `eqa_signal_config`, `eqa_annual_summary` migrations reversible.
- [ ] Axe-core clean.
- [ ] i18n keys in en/fr/es.

### Out of scope

- Per-analyst trend charts (V3.1 exposes analyst as a filter but does not add a separate per-analyst Trends sub-screen).
- Cross-scheme analyte aggregation (e.g., "HIV VL trend across WHO + regional PT combined") — kept separate in V3.1 to avoid comparing incommensurate schemes.
- Real-time signal detection — V3.1 ships a nightly job; sub-hourly detection is a V3.X follow-up.
- Predictive analytics or ML-based anomaly detection — the rules-based signals above are the MVP; ML is a separate opportunity.

---

## STORY V3.2 — Cold-Chain Validators + Rejection Workflow

**Gap:** G5 (narrowed — the minimal receipt event ships in V2.2 FR-V2.2-12).
**Story Points:** 13
**Labels:** `eqa` `cold-chain` `panel-receipt` `iso-17043` `rejection-workflow`

### User Stories

- **As a participant QA officer,** I want the system to auto-flag cold-chain excursions at panel receipt so that I don't silently run a compromised panel and produce a scored failure that traces back to transit conditions.
- **As a participant QA officer,** I want to capture packaging condition via a structured checklist (not free text) so that deviation data is comparable across cycles and rollable into trend analytics (V3.1).
- **As a participant lab manager,** I want a one-click rejection path that notifies the provider and requests a replacement so that a damaged panel doesn't burn a cycle slot or force me to test anyway.
- **As a PT provider,** I want to see each lab's shipment deviations and receipt temps in one place so that I can triage reprovisioning (FR-V2.5-15) when cold-chain failures cluster on a single courier lane.
- **As an auditor,** I want the scored report to show any cold-chain deviation from the cycle so that I can read score interpretation with transit conditions in context (ISO 15189 §7.3.4).

### Design Brief

**Purpose:** extend the V2.2 minimal panel-receipt event (single temperature + integrity checkbox + free-text notes) into a validated cold-chain record with a structured packaging checklist, tolerance-band validation, a rejection/replacement workflow, and a provider-side shipment deviation capture. Treat cold-chain as an attribute of score interpretation, not a pass-gate on testing.

**Primary user action:** at receipt, the QA officer fills the enhanced receipt form — temp reading + packaging checklist items — and either **Accept**, **Accept with deviation** (testing proceeds, deviation flag attached to score), or **Reject** (request replacement, freeze cycle).

**Layout pattern:** extends V2.2 Panel Receipt Modal into a two-step mini-wizard (Step 1: temp + packaging; Step 2: disposition + notes). Same modal footprint; an Accordion reveals the shipment-side shipment-deviation panel when the provider's courier data is present.

**Interaction model:** inline tolerance validation on the temperature field (live range check). Structured checklist via Carbon `Checkbox` rows with `Dropdown`s for severity tags. Disposition uses `RadioButton`s — Accept / Accept with deviation / Reject. Rejection confirmation uses a Modal to prevent accidental freezes.

**Scope boundary (this story):**
- Adds cold-chain validator service + `cold_chain_deviation` event table.
- Adds structured packaging checklist (controlled vocab).
- Adds `panel_rejected` cycle state + replacement workflow.
- Adds provider-side `shipped_at_temp` excursion capture (manual + optional CSV import from data-logger).
- Adds deviation flag to scored-report rendering.

**Out of scope (stays in V2.2):** the minimal `eqa_panel_receipt` row (`received_date`, `received_by`, `integrity_ok` boolean, `received_temp_c`, free-text `integrity_notes`) — those ship in FR-V2.2-12 / FR-V2.1-20 as the `delivered` state contract.

**Carbon components:** `Modal`, `RadioButtonGroup`, `Checkbox` (controlled vocab), `Dropdown`, `NumberInput` (temp), `InlineNotification` (out-of-range), `Accordion` (shipment deviation panel), `Tag` (`cold-chain-ok` / `cold-chain-deviation` / `panel-rejected`).

### Functional Requirements

**FR-V3.2-01 — Temperature tolerance bands per panel storage mode.** Add `eqa_scheme.cold_chain_bands` JSONB column (nullable — falls back to platform defaults). Platform default bands: `refrigerated_2_8C` = [2.0, 8.0]°C, `frozen_neg20` = [−30.0, −15.0]°C, `frozen_neg70` = [−80.0, −60.0]°C, `ambient` = [15.0, 30.0]°C, `controlled_room_temp` = [20.0, 25.0]°C. A scheme editor can override with narrower or wider bands and an optional `excursion_minutes_tolerance` value for brief spikes.

**FR-V3.2-02 — Cold-chain validator service.** At `eqa_panel_receipt` insert or update (V2.2 entity), run validator that compares `received_temp_c` against the scheme's applicable band for `panel.storage_temp`. If out-of-range, insert an `eqa_cold_chain_deviation` row and raise an Alert (severity = warning) to the participant QA officer (role `eqa.manage` or `eqa.triage`) and to the provider (role `eqa.provider.manage`).

**FR-V3.2-03 — `eqa_cold_chain_deviation` table.**
```
id (uuid pk)
receipt_id (fk eqa_panel_receipt)
cycle_id (fk eqa_cycle)
deviation_type (enum: temp_out_of_range | packaging_compromised | shipment_excursion | desiccant_exhausted | ice_pack_failed | physical_damage)
severity (enum: minor | major | critical)
observed_value (text — "9.4°C" or "outer box crushed")
expected_value (text — "2.0–8.0°C")
detected_by (enum: validator | manual_checklist | courier_feed)
detected_at (timestamptz)
notes (text)
linked_to_rejection (boolean default false — flips true if deviation drove rejection)
```
One receipt row MAY have multiple deviation rows (e.g., temp excursion + damaged outer packaging). Exposed to scored reports as a list.

**FR-V3.2-04 — Packaging condition checklist (structured).** Replace free-text `integrity_notes` (from V2.2) with a structured checklist captured on receipt. Controlled-vocab items, each mandatory:
- Outer packaging state — `intact | damaged_minor | damaged_major`
- Inner container state — `intact | damaged_minor | damaged_major`
- Ice/cold-pack state (if storage_temp ∈ {refrigerated, frozen}) — `frozen_hard | partially_thawed | fully_thawed | not_applicable`
- Desiccant state (if required by scheme) — `active | exhausted | missing | not_applicable`
- Tamper-evident seal — `intact | broken | not_applicable`
The free-text `integrity_notes` stays as an optional supplement, not a replacement for the checklist.

**FR-V3.2-05 — Checklist → deviation mapping.** If any checklist item is in a non-intact/non-active state, the validator inserts an `eqa_cold_chain_deviation` row with `deviation_type` mapped (damaged_major → `packaging_compromised`, severity `major`; fully_thawed → `ice_pack_failed`, severity `major`; exhausted → `desiccant_exhausted`, severity `minor|major` per scheme config; broken seal → `packaging_compromised`, severity `critical`).

**FR-V3.2-06 — Disposition model.** Add `eqa_panel_receipt.disposition` enum = `accept | accept_with_deviation | rejected`. Default = `accept`. Set by the QA officer explicitly when any deviation is present (form must force a choice). On `rejected`, cycle transitions `panel_received → panel_rejected` (new state — see FR-V3.2-07). On `accept_with_deviation`, cycle proceeds to `testing` but the deviation flag is attached to the scored report (FR-V3.2-10).

**FR-V3.2-07 — `panel_rejected` cycle state + replacement workflow.** Add `panel_rejected` to the participant cycle state machine, reachable only from `panel_received`. Allowed transitions out: `panel_rejected → panel_received` (when a replacement receipt is logged) or `panel_rejected → closed` (terminal — participant opts out of this cycle). A `panel_rejected` cycle is **excluded** from coverage calculations (V2.3 Lab Performance) and from V3.1 trend analytics. A replacement `eqa_panel_receipt` row carries `replaces_receipt_id` FK back to the original receipt, and the original receipt keeps its `disposition=rejected` for audit.

**FR-V3.2-08 — Rejection notification (provider + auto-reprovisioning trigger).** On `disposition = rejected`, emit a FHIR `Communication` resource to the provider (extends V2.5 messaging) and auto-create a V2.5 reprovisioning task (FR-V2.5-15) with `reason = panel_rejected_cold_chain`. The provider's Receipt Monitor (V2.5) row for that participant shows a red `Panel rejected` Tag and a `Ship replacement` action.

**FR-V3.2-09 — Shipment-side deviation capture (provider).** Add `eqa_shipment_deviation` table capturing excursions recorded during transit before the receipt:
```
id (uuid pk)
shipment_id (fk eqa_shipment)
participant_id (fk — if known, else null for pre-split shipments)
deviation_type (same enum as 3.2-03)
start_ts, end_ts (timestamptz)
observed_value, expected_value (text)
source (enum: courier_report | data_logger_csv | provider_manual)
csv_import_file (uuid — ref to uploaded logger file, nullable)
notes (text)
```
Provider can record manually in the Prep / Shipment workbench (V2.5) or upload a CSV from a data-logger. When a receipt arrives for a shipment that has deviations, the validator surfaces both sets on the scored report.

**FR-V3.2-10 — Scored-report deviation flag.** The V2.3 scored-report rendering (Lab Performance + participant-side scored view) MUST show a `Cold-chain deviation` Tag (kind=warning) when the cycle has one or more rows in `eqa_cold_chain_deviation` or `eqa_shipment_deviation`. Hovering or expanding the tag lists the deviations. This does **not** change the score itself — it provides context for interpretation per ISO 15189 §7.3.4 and §7.7.3.

**FR-V3.2-11 — Permissions.** `eqa.receipt.log` (already implicit in V2.2's receipt entry) gates the checklist form. A new `eqa.receipt.reject` permission gates the `Reject` disposition specifically — rejection is an escalation and the lab may want only senior QA officers to trigger it. `eqa.provider.manage` gates shipment deviation entry. `eqa.provider.manage` + `eqa.analytics.view` (V3.1) are both required to see the cross-lab cold-chain dashboard (FR-V3.2-12).

**FR-V3.2-12 — Provider cold-chain dashboard (cross-lab).** Add a provider-only sub-view under V2.5 Provider Cycles called `Cold-Chain Monitor`. Table: one row per shipment-participant combination with columns `Participant` / `Cycle` / `Shipped temp` / `Received temp` / `Deviation severity` / `Disposition` / `Rejected?`. Filters: cycle, scheme, severity, courier lane (from shipment metadata), date range. Supports CSV export for post-incident review.

**FR-V3.2-13 — Configuration UI for tolerance bands.** Add a **Cold-chain bands** Accordion to the V2.1 Scheme editor. Each row: storage mode + low °C + high °C + excursion minutes. Validation: low < high; low ≥ −200; high ≤ 50. Blank leaves the platform default.

**FR-V3.2-14 — i18n namespace.** `eqa.coldchain.*`. Keys MUST cover all checklist labels, disposition radio labels, rejection modal copy, deviation type enum values, scored-report flag text, and Cold-Chain Monitor column headers.

**FR-V3.2-15 — Audit trail.** Every `eqa_panel_receipt.disposition` change, every `eqa_cold_chain_deviation` insert, and every state transition involving `panel_rejected` MUST be written to the existing OpenELIS audit table with `who / when / old_value / new_value / reason`.

### Acceptance Criteria

- **AC-V3.2-01:** Given a panel with `storage_temp='refrigerated_2_8C'`, when a QA officer logs a receipt with `received_temp_c = 9.4`, then the form shows an inline error tag `Out of range (2.0–8.0°C)`, the disposition defaults to `accept_with_deviation`, an `eqa_cold_chain_deviation` row is inserted with `deviation_type='temp_out_of_range'` and `severity='major'`, and an Alert is raised to both the QA officer and the provider.
- **AC-V3.2-02:** Given the same out-of-range receipt, when the QA officer sets `disposition='accept'` without completing the forced deviation choice, then the save is blocked and an `InlineNotification` says `Select Accept with deviation or Reject — temperature is out of range`.
- **AC-V3.2-03:** Given a receipt where outer packaging = `damaged_major` and ice-pack state = `fully_thawed`, then two `eqa_cold_chain_deviation` rows are written (one `packaging_compromised`, one `ice_pack_failed`) and the receipt cannot be saved with `disposition='accept'` — only `accept_with_deviation` or `rejected`.
- **AC-V3.2-04:** Given a QA officer without `eqa.receipt.reject`, when they open the disposition dropdown, then the `Reject` option is present but disabled with tooltip `Requires eqa.receipt.reject`.
- **AC-V3.2-05:** Given a receipt saved with `disposition='rejected'`, then the cycle state transitions to `panel_rejected`, a FHIR `Communication` to the provider is emitted, a V2.5 reprovisioning task is created with `reason='panel_rejected_cold_chain'`, and the Receipt Monitor row shows a red `Panel rejected` Tag with a `Ship replacement` action.
- **AC-V3.2-06:** Given a rejected cycle, when a replacement receipt is logged, then a new `eqa_panel_receipt` row carries `replaces_receipt_id = <original>`, the cycle returns to `panel_received`, the original receipt row is retained with `disposition='rejected'` for audit, and coverage/trend dashboards exclude the rejected receipt.
- **AC-V3.2-07:** Given a shipment has a logger-imported `eqa_shipment_deviation` row and the receipt has no receipt-side deviations, then the scored report still shows the `Cold-chain deviation` Tag (warning kind) with the shipment-side entry on hover.
- **AC-V3.2-08:** Given a provider-admin user with `eqa.provider.manage` + `eqa.analytics.view`, when they open the Cold-Chain Monitor, then they see one row per shipment-participant and can filter by severity; CSV export produces a UTF-8 BOM file with matching column headers.
- **AC-V3.2-09:** Given a scheme editor changes a tolerance band from `[2.0, 8.0]` to `[3.0, 7.0]`, when a new receipt at 7.5°C is logged, then the validator flags `temp_out_of_range` using the narrower band; previously-accepted receipts are not retroactively flagged.
- **AC-V3.2-10:** Given an auditor reviews the audit trail, every `panel_rejected` transition carries a row with `who`, `when`, `reason`, and a JSON pointer to the triggering `eqa_cold_chain_deviation` rows.
- **AC-V3.2-11:** Given all text strings in the Cold-Chain Monitor, rejection modal, checklist, and scored-report tag, every visible string is bound via `t('eqa.coldchain.*')` and present in the Localization table.
- **AC-V3.2-12:** Given a cycle with `disposition='accept_with_deviation'`, when scoring runs, the score is computed normally and stored; the deviation tag appears on the report but does not alter the pass/fail outcome.

### Non-Functional

- Validator check MUST complete in <200ms at receipt save time (p95).
- Cold-Chain Monitor list page MUST render 500 rows in <1.5s (p95).
- Data-logger CSV import MUST support files up to 50,000 rows; processing is async with a progress toast.
- All new strings MUST be in the epic-level Localization table. All new permissions MUST appear in the permission registry.

### Definition of Done

- Migration adds `eqa_cold_chain_deviation`, `eqa_shipment_deviation`, `eqa_scheme.cold_chain_bands`, `eqa_panel_receipt.disposition`, structured checklist columns, and the `panel_rejected` state.
- Validator service unit-tested against edge cases: boundary temps (exactly at low/high), NULL received_temp, scheme override present/absent, excursion_minutes_tolerance applied.
- Rejection → reprovisioning round-trip has an integration test with a fake FHIR server.
- Scored-report renderer shows cold-chain tag when deviations present and suppresses when clean.
- Coverage analytics (V2.3 + V3.1) confirmed to exclude `panel_rejected` cycles in the query.
- Accessibility: disposition radio group, checklist, and Cold-Chain Monitor table all pass axe-core with no criticals; forced-deviation error announced via ARIA live region.

### Out of Scope

- Automatic score invalidation based on deviation (kept manual per ISO 15189 — cold-chain is context, not a scoring input).
- Real-time IoT logger integration (CSV upload only in V3.2; streaming in a later iteration).
- Insurance / reimbursement workflows for rejected panels.

---

## STORY V3.3 — IQC ↔ EQA Correlation

**Gap:** G7.
**Story Points:** 10
**Labels:** `eqa` `iqc` `nce` `investigation` `cross-module` `westgard`

### User Stories

- **As a QA officer triaging an EQA-triggered NCE,** I want to see the same-instrument IQC state around the EQA run so that I can tell an "isolated EQA failure" apart from a "system-wide QC problem" in under a minute instead of hunting across two modules.
- **As a QA officer investigating a Westgard violation,** I want to see any EQA runs that fall inside the same shift window so that I can tell whether the bias showed up in EQA too — that elevates a routine QC investigation into a reportable event per ISO 15189 §7.7.1.
- **As a lab director,** I want a one-line "Same-run IQC: in-control / violation (Westgard 1-3s)" summary surfaced on the scored EQA report so that reviewers reading the cycle outcome get the QC context without a tab-switch.
- **As an auditor,** I want every NCE investigation to show the linked IQC runs and their rule hits so that the investigation record tells a complete analytical story.

### Design Brief

**Purpose:** connect the EQA investigation workflow (NCE → root cause) with the Westgard IQC module so that same-run QC signals surface in one place. This is cross-module scaffolding — V2 already writes NCEs from EQA and QC failures independently; V3.3 correlates them.

**Primary user action:** on an EQA-triggered NCE investigation page, the QA officer scans a new **Same-run IQC** panel that lists IQC runs within the shift window and renders a compact Levey-Jennings snippet. Bidirectional: Westgard-triggered NCEs surface any EQA runs in the window.

**Layout pattern:** extends the existing NCE investigation page with a new Tile block placed above the root-cause free-text area. On the scored-report screen (V2.3), adds a single-line summary chip.

**Interaction model:** the IQC panel is static (read-only) — click-through to the full IQC record opens the existing Westgard view in a new tab. The shift window is editable (default 8h before/after the EQA run) via a small `NumberInput` hidden behind a "Adjust window" ghost button.

**Scope boundary (this story):**
- Query + render same-instrument / same-analyte IQC runs for NCEs triggered by EQA.
- Query + render same-instrument / same-analyte EQA results for NCEs triggered by Westgard.
- Correlation summary chip on the scored EQA report.
- Configurable shift-window default per lab.

**Out of scope:** any change to the Westgard QC rules or chart rendering itself; cross-lab QC comparison (that's V3.1 trend analytics territory).

**Carbon components:** `Tile`, `DataTable` (IQC run list, ≤10 rows), `Tag` (QC state), inline mini-chart (reuse existing Westgard SVG component), `Button kind="ghost"` (adjust window), `InlineNotification kind="info"` (when no IQC runs in window).

### Functional Requirements

**FR-V3.3-01 — NCE investigation page extension.** On the existing NCE investigation page, when the NCE's `trigger_source = 'eqa_unacceptable'` OR `trigger_source = 'eqa_performance_signal'` (V3.1) OR `trigger_source = 'westgard_violation'`, render a new **Same-run IQC / EQA** Tile block. When neither condition holds, the block is not rendered (no whitespace impact).

**FR-V3.3-02 — Same-run IQC query (EQA → IQC direction).** Given an EQA result (`eqa_participant_result`), query the Westgard IQC store for IQC runs where: `instrument_id = EQA.instrument_id` AND `analyte_id = EQA.analyte_id` AND `run_ts BETWEEN (eqa_result.entered_at − shift_window) AND (eqa_result.entered_at + shift_window)`. Default `shift_window = 8h`, configurable per lab via a new `lab_config.eqa_iqc_correlation_window_hours` setting (min 1, max 72).

**FR-V3.3-03 — Same-run EQA query (IQC → EQA direction).** Given a Westgard violation event, query `eqa_participant_result` rows where `instrument_id` and `analyte_id` match and `entered_at` falls in the shift window. If any exist, render them as a list on the Westgard-triggered NCE investigation page.

**FR-V3.3-04 — IQC summary panel (EQA-triggered NCE).** Columns: `Run time` / `QC level` (low/mid/high) / `State` (in-control / warning / violation — Carbon Tag kinds green/warm-gray/red) / `Westgard rule hits` (comma-list, e.g., `1-3s, 2-2s`) / `Action`. Action column shows a `View` IconButton that opens the Westgard QC detail view in a new tab. If no IQC runs in window, render `InlineNotification` with copy `No IQC runs logged for this instrument + analyte within ±{window}h of the EQA run`.

**FR-V3.3-05 — Levey-Jennings snippet.** Below the IQC table, render a compact L-J chart for the nearest three IQC levels in the window. Reuse existing Westgard LJChart component (referenced via lazy import). If the Westgard module is not licensed or disabled in the deployment, render the table only and suppress the chart with copy `L-J chart unavailable (Westgard module not enabled)`.

**FR-V3.3-06 — Shift-window adjuster.** A ghost `Button` labeled `Adjust window` reveals a `NumberInput` to set the hours pre/post. Changes affect the current investigation view only; the lab-config default is unchanged. The applied value is persisted on the NCE as `eqa_nce_iqc_link.window_hours_override` for audit reproducibility.

**FR-V3.3-07 — Link table `eqa_nce_iqc_link`.**
```
id (uuid pk)
nce_id (fk — OpenELIS NCE table)
iqc_run_id (fk — Westgard run)
direction (enum: eqa_to_iqc | iqc_to_eqa)
window_hours_applied (int)
captured_at (timestamptz — when the correlation was computed for this NCE)
```
Purpose: persist the exact correlation set at time of investigation so that later chart/data changes don't rewrite history.

**FR-V3.3-08 — Scored-report correlation chip.** On the V2.3 scored-report view (participant + lab-performance versions), add a single-line chip next to each unacceptable result: `Same-run IQC: in-control` / `Same-run IQC: violation (Westgard 1-3s)` / `Same-run IQC: no runs in window`. The chip links to the corresponding IQC run list.

**FR-V3.3-09 — Permissions.** No new permission keys — reuse `eqa.review` (to view correlation block on EQA-triggered NCE) and the existing Westgard `qc.view` permission (to view correlation block on IQC-triggered NCE). If the viewer lacks the paired permission on the other side, show a redacted row (`{n} IQC runs in window — insufficient permission to view details`).

**FR-V3.3-10 — Configuration UI.** Add a single row to the existing Lab Config page for the shift-window hours (default 8). Visible to users with `lab.config.manage`.

**FR-V3.3-11 — i18n namespace.** `eqa.iqc_correlation.*`. Keys MUST cover panel title, column headers, all state chips, shift-window adjuster labels, empty-state copy, and the scored-report summary chip.

**FR-V3.3-12 — Audit trail.** Every `window_hours_override` change and every `eqa_nce_iqc_link` insert MUST be written to the audit trail.

### Acceptance Criteria

- **AC-V3.3-01:** Given an NCE with `trigger_source='eqa_unacceptable'` linked to an EQA result on instrument X / analyte Y at 14:00, and two IQC runs exist for X/Y at 10:15 (in-control) and 13:40 (Westgard 1-3s violation), when the investigation page loads, the Same-run IQC panel lists both runs, the 13:40 row shows a red Tag `Violation`, and the L-J snippet marks the 1-3s point.
- **AC-V3.3-02:** Given an NCE with `trigger_source='westgard_violation'` on instrument X/analyte Y, when a `eqa_participant_result` row exists within the same shift window, then the same-run EQA panel renders one row with the EQA result state (Acceptable / Unacceptable) and a link to the scored report.
- **AC-V3.3-03:** Given an EQA-triggered NCE with no IQC runs in the default 8h window, when the user clicks `Adjust window` and sets it to 24h, then the panel re-queries, any newly-in-window runs appear, and `eqa_nce_iqc_link.window_hours_applied = 24` is written.
- **AC-V3.3-04:** Given the Westgard module is disabled for this deployment, when an EQA-triggered NCE loads, then the IQC table renders with empty rows and `InlineNotification` "L-J chart unavailable (Westgard module not enabled)" replaces the snippet.
- **AC-V3.3-05:** Given a user with `eqa.review` but without `qc.view`, when they open the Same-run IQC panel, then they see a redacted row `3 IQC runs in window — insufficient permission to view details` instead of per-run details.
- **AC-V3.3-06:** Given a scored EQA report is rendered for a result on instrument X, when same-run IQC exists with a Westgard 2-2s violation, then the correlation chip reads `Same-run IQC: violation (Westgard 2-2s)` and links to the IQC run list.
- **AC-V3.3-07:** Given an NCE investigation saves, then every listed IQC run is persisted as an `eqa_nce_iqc_link` row with `direction` set correctly. Re-opening the NCE later shows the same set even if new IQC runs have been logged in the same window since.
- **AC-V3.3-08:** Given the lab-config shift-window is changed from 8h to 12h, when a new NCE investigation opens, then the default is 12h; existing open investigations retain their persisted `window_hours_applied` value.
- **AC-V3.3-09:** Given all text in the Same-run IQC panel, chip, adjuster, and empty state, every visible string is bound via `t('eqa.iqc_correlation.*')` and present in the Localization table.

### Non-Functional

- IQC query MUST return in <300ms (p95) for a one-week window on a lab with 10 instruments.
- The correlation chip on the scored report MUST NOT add more than 150ms to report render time (p95).
- Link-table inserts are idempotent per `(nce_id, iqc_run_id)` to prevent duplicate rows on view refresh.

### Definition of Done

- Migration adds `eqa_nce_iqc_link` and the `lab_config.eqa_iqc_correlation_window_hours` column.
- Cross-module query path has integration tests for all three trigger sources (`eqa_unacceptable`, `eqa_performance_signal`, `westgard_violation`).
- LJChart import is lazy-loaded and does not inflate the NCE page bundle when the Westgard module is disabled.
- Accessibility: IQC table and chip both pass axe-core; chip carries a descriptive `aria-label`.
- Feature flag: `feature.eqa_iqc_correlation` (default on) allows deployments without Westgard to disable the extension cleanly.

### Out of Scope

- Modifying Westgard rules or chart rendering.
- Cross-lab QC aggregation (that belongs to V3.1 or a future QC roadmap).
- Auto-generating a QC NCE from an EQA NCE or vice versa — the correlation is read-only; QA officers still decide whether a second NCE is warranted.

---

## STORY V3.4 — Patient Impact Look-Back

**Gap:** G8.
**Story Points:** 13
**Labels:** `eqa` `patient-safety` `nce` `iso-15189` `look-back` `clinical-impact`

### User Stories

- **As a QA officer investigating an EQA-triggered NCE,** I want a patient worklist bracketed by the last IQC-passing run before the failure and the first IQC-passing run after it so that I can evaluate exactly which patient results might have been produced during the analytical error window (ISO 15189 §7.5).
- **As a QA officer,** I want to record a per-patient clinical impact assessment (no impact / review advised / clinician notified / result retracted / result reissued) so that the NCE investigation closes with a documented patient-safety action trail.
- **As a lab director,** I want a single export of the impact worklist with assessments so that I can hand it to the medical director for sign-off without assembling it manually from sample records.
- **As an auditor,** I want to see a deterministic record of which patient samples were in the impact window at the time of investigation so that the worklist reviewed matches what was reviewed and can't silently change later.

### Design Brief

**Purpose:** operationalize ISO 15189 §7.5 — "when QC or EQA indicates an error, the laboratory shall identify and evaluate the impact on patient results." Today OpenELIS has no tool for this; QA officers reconstruct it by hand from sample lists. V3.4 generates the worklist, freezes it to the NCE, and captures per-patient assessment.

**Primary user action:** on an NCE investigation, the QA officer opens the **Patient Impact** tab, reviews the auto-generated worklist, records an assessment for each patient, and marks the look-back complete.

**Layout pattern:** new Tab on the existing NCE investigation page (sibling of the Same-run IQC tab from V3.3). Single `DataTable` with inline-row-expanded assessment capture.

**Interaction model:** each row has a disposition Dropdown (enum) + a notes field. Save is per-row (no batch); completion state is tracked on the parent NCE. A summary counter ("4 of 12 reviewed") drives a "Mark look-back complete" button's enabled state.

**Scope boundary (this story):**
- Auto-generate a patient impact worklist from IQC bracket.
- Capture per-patient assessment (disposition + notes + reviewer).
- Mark look-back complete on the NCE.
- Export worklist + assessments as CSV and PDF (for medical director review).

**Out of scope:** result retraction/reissue workflow itself (that's handled by the existing OpenELIS result amendment process — we link to it, don't reimplement); clinician notification (that's outside OpenELIS's messaging scope today); cross-instrument error propagation.

**Carbon components:** `Tabs`, `DataTable`, `TableToolbarSearch`, inline row expansion (per Constitution Principle 3), `Dropdown` (assessment enum), `TextArea` (notes), `Tag` (assessment state), `Button kind="primary"` (Mark complete), `Modal` (confirm completion), `Breadcrumb` (back to NCE).

### Functional Requirements

**FR-V3.4-01 — Trigger eligibility.** A **Patient Impact** tab appears on the NCE investigation page when the NCE's `trigger_source` is one of: `eqa_unacceptable`, `eqa_performance_signal` (V3.1), `westgard_violation` (any rule code), `calibration_failure`, or `instrument_malfunction`. For other NCE sources, the tab is hidden.

**FR-V3.4-02 — Impact window computation.** The worklist's time window is bracketed by:
- **Window start** = timestamp of the most recent IQC run PRIOR to the trigger event where the run state = `in_control` on the same instrument + analyte.
- **Window end** = timestamp of the first IQC run AFTER the trigger event where run state = `in_control` on the same instrument + analyte, OR `now()` if no such run exists yet.
- If no prior IQC pass is found (first EQA cycle on a new instrument, etc.), window start falls back to `trigger_event_ts − 72h` and an `InlineNotification kind="warning"` appears: `No prior IQC pass found; defaulted to 72h before trigger. Confirm the window before submitting.`

**FR-V3.4-03 — Configurable override of window.** The QA officer MAY override start and end timestamps via inline `DatePicker` + time inputs. Overrides are stored on the persisted worklist snapshot (FR-V3.4-05) for auditability.

**FR-V3.4-04 — Worklist query.** Given the resolved window, query all patient samples where: `instrument_id = NCE.instrument_id` AND `analyte_id = NCE.analyte_id` AND `result.reported_at BETWEEN window_start AND window_end`. Columns (min): `Sample ID`, `Patient ID`, `Order date`, `Reported at`, `Result value`, `Result flag`, `Ordering clinician` (if captured), `Assessment` (null until set), `Reviewed by`, `Reviewed at`, `Notes`.

**FR-V3.4-05 — Worklist snapshot (`eqa_impact_worklist`).**
```
id (uuid pk)
nce_id (fk)
generated_at (timestamptz)
window_start (timestamptz)
window_end (timestamptz)
window_source (enum: auto | manual_override | fallback_72h)
sample_count (int)
closed_at (timestamptz, nullable)
closed_by (fk user)
```
Plus `eqa_impact_worklist_item`:
```
id, worklist_id (fk), sample_id (fk), patient_id, result_value, result_flag,
assessment (enum: pending | no_impact | review_advised | clinician_notified | result_retracted | result_reissued),
reviewer_id (fk user, nullable), reviewed_at (timestamptz, nullable), notes (text)
```
On first open of the Patient Impact tab, the worklist snapshot is generated and the item rows are written. Subsequent views read from the snapshot — the query is **not** re-run, so the list is frozen (AC-V3.4-07).

**FR-V3.4-06 — Per-row assessment capture.** Each row is an inline-expansion row per Constitution Principle 3. Expanded view shows: the disposition `Dropdown`, a `TextArea` for notes, a read-only `Reviewed by` field (defaults to current user), a `Save` primary button. Saving writes to `eqa_impact_worklist_item` and collapses the row. A `Tag` in the collapsed row reflects the current assessment state.

**FR-V3.4-07 — Completion gate.** A `Mark look-back complete` primary button is disabled until every item has a non-`pending` assessment. Clicking it opens a confirmation Modal with a summary (`4 no-impact, 3 review-advised, 1 retracted, ...`). On confirm, the worklist `closed_at` + `closed_by` are set and the NCE receives a status update flagging the look-back as complete.

**FR-V3.4-08 — Linkout to result amendment.** Assessment `result_retracted` or `result_reissued` MUST present a link "Amend result in sample record" that opens the existing OpenELIS result-amendment flow for that sample in a new tab. No state is shared; we record that it was linked (boolean on the item row: `amendment_linked_at`).

**FR-V3.4-09 — Exports.** A `Download` OverflowMenu on the worklist provides:
- `Download as CSV` — UTF-8 BOM, one row per item, all columns including assessment + notes.
- `Download as PDF` — letterhead with lab name + NCE ID + window + assessment summary; intended for medical-director review signature.

**FR-V3.4-10 — Permissions.** `eqa.impact.view` gates viewing the Patient Impact tab. `eqa.impact.assess` gates per-row assessment capture. `eqa.impact.close` gates marking look-back complete. All three keys default into the `QA_Officer` + `Lab_Director` roles; no other defaults.

**FR-V3.4-11 — Reopen after close.** A closed look-back is read-only by default. Users with `eqa.impact.reopen` can re-open it; reopening writes an audit row with `reason` captured in a required text field. Re-opened worklists still preserve historical assessment states; changes append a per-item assessment history (child table `eqa_impact_worklist_item_history`).

**FR-V3.4-12 — i18n namespace.** `eqa.impact.*`. Keys MUST cover tab title, empty-state copy, window-source notifications, all assessment enum labels, column headers, completion-modal copy, CSV/PDF export labels, permission tooltips.

**FR-V3.4-13 — Audit trail.** Every assessment save, every window override, every close/reopen, every CSV/PDF export MUST be written to the audit table with `who / when / before / after`.

**FR-V3.4-14 — Patient privacy.** The CSV and PDF exports respect the existing OpenELIS patient-ID redaction setting (`privacy.export_patient_id_redacted`). When enabled, `Patient ID` column renders as `[redacted-{hash}]` and a secondary export `Download with patient identifiers (requires reason)` prompts for a justification string that is audit-logged.

### Acceptance Criteria

- **AC-V3.4-01:** Given an NCE triggered by an unacceptable EQA result on instrument X/analyte Y at 14:00, and IQC pass runs exist at 11:30 (before) and 15:20 (after), when the Patient Impact tab opens, then the worklist lists all patient samples for X/Y with `reported_at ∈ [11:30, 15:20]` and `window_source='auto'`.
- **AC-V3.4-02:** Given no prior IQC pass exists in the last 7 days, when the tab opens, then `window_source='fallback_72h'` is set and the warning `InlineNotification` is shown; the QA officer can override via the DatePicker.
- **AC-V3.4-03:** Given 12 items in a worklist, when 11 are assessed and 1 remains `pending`, then the `Mark look-back complete` button is disabled with tooltip `1 item still pending review`.
- **AC-V3.4-04:** Given all 12 items are assessed, when the user clicks `Mark look-back complete` and confirms, then `eqa_impact_worklist.closed_at` is set, the NCE status shows `Patient look-back complete`, and the worklist becomes read-only except for users with `eqa.impact.reopen`.
- **AC-V3.4-05:** Given a worklist is closed, when a user with `eqa.impact.reopen` opens it, then a `Reopen` ghost button is present; clicking it requires a reason string and writes an audit row. Previous assessment states remain and any changes append to `eqa_impact_worklist_item_history`.
- **AC-V3.4-06:** Given the user selects `result_retracted` for a row, when the row saves, then a `Amend result in sample record` link opens the sample's amendment flow in a new tab and `amendment_linked_at` is set.
- **AC-V3.4-07:** Given a worklist was generated at T0, when new patient samples are reported for X/Y inside the window between T0 and T0+30min, then the worklist **does not** grow — the snapshot at T0 is authoritative. The tab shows an info banner `Snapshot taken {T0}. Regenerate to capture samples reported since.` and a `Regenerate snapshot` ghost button (requires `eqa.impact.assess`, writes audit, and creates a NEW `eqa_impact_worklist` row rather than mutating the old one).
- **AC-V3.4-08:** Given `privacy.export_patient_id_redacted = true`, when CSV is downloaded, then the Patient ID column is `[redacted-{hash}]`; the secondary identified export requires a reason string and is audit-logged.
- **AC-V3.4-09:** Given a user with `eqa.impact.view` but without `eqa.impact.assess`, when they open the tab, then rows are read-only, assessment dropdowns are disabled with tooltip `Requires eqa.impact.assess`, and `Mark look-back complete` is hidden.
- **AC-V3.4-10:** Given the PDF export, when rendered, then the header shows `Lab name / NCE ID / Instrument / Analyte / Window / Generated at`, the body shows one row per item with `Patient ID / Sample / Result / Assessment / Notes / Reviewer`, the footer shows an assessment count summary and a signature block for the Medical Director.
- **AC-V3.4-11:** Given all text strings in the Patient Impact tab, assessment dropdown, completion modal, exports, and banners, every visible string is bound via `t('eqa.impact.*')` and present in the Localization table.
- **AC-V3.4-12:** Given 500 items in the worklist, the tab MUST render the initial 50 in <1s (p95) with pagination for the rest; assessment save MUST complete in <300ms (p95).

### Non-Functional

- Worklist generation query MUST complete in <1.5s for a 7-day window on a lab with 50k samples/month.
- PDF generation MUST complete in <5s for worklists up to 200 rows.
- No patient identifier appears in logs at WARN level or above.

### Definition of Done

- Migration adds `eqa_impact_worklist`, `eqa_impact_worklist_item`, `eqa_impact_worklist_item_history` tables plus the four new permission keys.
- Query correctly joins samples-by-instrument-and-analyte across the patient and EQA schemas; integration-tested with a fixture having multiple instruments reporting the same analyte.
- PDF export has a golden snapshot test for layout stability.
- Accessibility: assessment dropdown + completion modal both pass axe-core; the tab's pagination + row expansion announce correctly.
- Privacy: redacted-export path is covered by a test that scrubs logs.

### Out of Scope

- Automatic clinician notification (messaging); remains a manual, documented step in the note field.
- Automatic result retraction — only linkout to the existing amendment flow.
- Cross-instrument impact propagation (if the same analyte runs on a backup instrument).
- Patient-facing messaging or portal.

---

## STORY V3.5 — ISO 17043 Provider Compliance

**Gap:** G10.
**Story Points:** 21
**Labels:** `eqa` `provider` `iso-17043` `homogeneity` `stability` `accreditation` `certificates`

### User Stories

- **As a PT provider scheme coordinator,** I want to record homogeneity and stability test results for each panel lot so that I can demonstrate ISO 17043 §4.4.1.3 compliance before releasing the panel for distribution.
- **As a PT provider,** I want the panel wizard to block release-for-distribution until homogeneity passes and a stability baseline is recorded so that I can't accidentally ship a panel that hasn't been characterized.
- **As a PT provider,** I want automatic generation of per-participant Certificates of Participation at cycle close so that participating labs receive the audit artifact they need for ISO 15189 assessment without my team manually assembling PDFs.
- **As a participating lab QA officer,** I want to download my Certificate of Participation from the cycle page so that I can file it with my accreditation records.
- **As an accrediting assessor,** I want a per-panel audit-evidence bundle (homogeneity + stability + lot provenance) so that I can verify ISO 17043 compliance in a single export.

### Design Brief

**Purpose:** bring OpenELIS's provider-side PT capability into ISO 17043 §4.4 (homogeneity, stability, lot traceability) and §5.6 (reporting — certificates). This is a provider-only extension; participant-side workflows are unchanged except for visible certificate access on the cycle page.

**Primary user action:** the scheme coordinator works through a panel-production sub-wizard (new steps 2a Homogeneity + 2b Stability, inserted in the V2.5 Panel Wizard) and cannot hit `Release for distribution` until evidence passes. At cycle close, certificates auto-generate; the provider reviews and optionally regenerates.

**Layout pattern:** extends V2.5 Panel Wizard mid-flow with two new steps when **ISO 17043 mode** is enabled for the scheme. Adds a **Cycle certificates** tab to the V2.5 Cycle detail page. Certificate preview uses the existing PDF viewer.

**Interaction model:**
- Panel wizard gains `ISO 17043 mode` toggle on Step 1 (if feature-flagged).
- Homogeneity step: grid of replicate measurements → ANOVA computation → pass/fail Tag → deviation path with required investigation note.
- Stability step: time-point table (T0, T30, T90, etc.) with reference comparison.
- Release gate: `Release for distribution` primary button disabled with explicit reasons in a tooltip until prerequisites are met.
- Certificates tab: table of generated certificates, per-row `Preview` / `Download` / `Regenerate` / `Audit trail`.

**Scope boundary (this story):** homogeneity + stability + lot traceability entities and workflows; ISO 17043 audit-evidence export bundle per panel; automatic per-participant certificate generation at cycle close with regeneration tracking.

**Out of scope:** physical/wet signatures on certificates (digital signature block only — deployments arrange hard-copy workflows locally); bilingual certificate templates (single-locale per scheme in V3.5; multi-locale sits with V3.1 analytics); ANOVA engine selection beyond the single built-in one-way ANOVA (statistical sophistication is V4 territory).

**Carbon components:** `Tabs`, `DataTable` (lot registry, time-point grid, certificates), `InlineNotification` (release gate reasons), `Modal` (regenerate confirm, deviation investigation), `Button kind="primary"` (Release), `Tag` (lot status, homogeneity pass/fail, stability pass/fail), `Accordion` (deviation investigation detail), `NumberInput` (replicate values), `DatePicker` (time-point dates).

### Functional Requirements

**FR-V3.5-01 — Feature flag + scheme toggle.** A deployment-level feature flag `feature.eqa_iso_17043` gates the entire story. When off, no entity migrations are blocked but UI elements and validators remain hidden/disabled. Per-scheme, the V2.1 scheme editor gains `iso_17043_mode` (boolean; default false for existing; default true for newly-created schemes when the flag is on).

**FR-V3.5-02 — `eqa_panel_lot` table.**
```
id (uuid pk)
panel_id (fk eqa_panel)
lot_code (text, unique per provider_org)
source_material (text)
production_batch (text)
manufactured_at (date)
expiry_date (date)
storage_location (text)
storage_temp (enum — reuses V2.1 values)
release_status (enum: prepared | in_homogeneity | homogeneity_pass | in_stability | released | held | rejected)
release_status_reason (text)
released_by (fk user, nullable)
released_at (timestamptz, nullable)
```
A panel MAY have multiple lots over time; only lots with `release_status='released'` can back an `eqa_cycle`.

**FR-V3.5-03 — `eqa_panel_homogeneity_test` table.**
```
id, lot_id (fk), analyte_id (fk), sample_count (int), replicate_count (int),
anova_f (float), anova_p (float), within_bottle_variance (float), between_bottle_variance (float),
pass_threshold_p (float, default 0.05), pass (boolean),
measured_by (fk user), measured_at (timestamptz),
raw_measurements (jsonb — array of {sample_id, replicate_index, value}),
notes (text)
```
ANOVA computation: one-way ANOVA across samples, within-bottle residual = within-group variance, between-bottle = between-group variance; pass when `anova_p ≥ pass_threshold_p` AND between-bottle variance ≤ analyte-specific tolerance (configured per scheme or platform default).

**FR-V3.5-04 — `eqa_panel_stability_test` table.**
```
id, lot_id (fk), analyte_id (fk), timepoint_days (int, 0-based from T0),
measurement_ts (timestamptz), measured_value (float),
reference_value (float), reference_source (text),
deviation_pct (computed), within_tolerance (boolean),
tolerance_pct (float, default 10% or scheme override),
measured_by (fk user), notes (text)
```
A lot requires T0 + at least one later timepoint measurement to transition to `stability_pass`.

**FR-V3.5-05 — Release-for-distribution gate.** The Panel Wizard's `Release for distribution` button is enabled only when: every analyte on the panel has an `eqa_panel_homogeneity_test` row with `pass=true`, AND at least one `eqa_panel_stability_test` at T0 exists for each analyte, AND `lot.release_status NOT IN ('held','rejected')`. When disabled, a tooltip lists the unmet prerequisites verbatim (e.g., `Homogeneity: missing for analyte HIV-1 VL. Stability: T0 measurement missing for HCV-Ab.`).

**FR-V3.5-06 — Homogeneity failure workflow.** When a homogeneity test records `pass=false`, the lot transitions to `held` automatically and a deviation investigation card is generated (reuses the NCE pattern with `trigger_source='panel_homogeneity_failure'`). Only users with `eqa.provider.manage` + `eqa.provider.release_override` can transition a held lot back to `prepared` (requires a reason text) or to `rejected` (terminal).

**FR-V3.5-07 — ISO 17043 audit-evidence export bundle.** Per panel (or per lot), provide a `Download audit evidence bundle` action that produces a ZIP containing: lot metadata JSON, homogeneity result JSON + raw-measurements CSV, all stability timepoint JSONs + reference trace CSV, release audit trail, and a README.md summarizing contents. Bundle generation is async with a progress toast.

**FR-V3.5-08 — `eqa_cycle_certificate` table.**
```
id (uuid pk)
cycle_id (fk eqa_cycle)
participant_org_id (fk organization)
certificate_serial (text, unique)
pdf_blob_ref (uuid — ref to the blob storage)
generated_at (timestamptz)
generated_by (fk user, nullable — system if auto)
regenerated_count (int, default 0)
supersedes_serial (text, nullable)
scheme_snapshot (jsonb — scheme name, accreditation ref, cycle number, dates at time of generation)
performance_snapshot (jsonb — per-analyte results + targets + scores as captured at cycle close)
withdrawn (boolean, default false)
withdrawn_reason (text, nullable)
```
Certificates never hard-delete; regeneration creates a new row with incremented `regenerated_count` and `supersedes_serial` pointing to the prior serial.

**FR-V3.5-09 — Certificate auto-generation on cycle close.** When an `eqa_cycle` transitions to `closed` AND the scheme has `certificates_enabled = true`, the system generates one `eqa_cycle_certificate` per participant organization with `performance_snapshot` captured from final scored results. Generation is async; providers see an info toast `Generating certificates for N participants…` and a completion toast or failure Alert.

**FR-V3.5-10 — Certificate PDF contents (required fields).** The generated PDF MUST include: scheme name + accreditation reference, cycle number + distribution date + submission deadline + close date, participant lab name + accreditation number (from org record) + address, analytes tested, per-analyte performance summary table (result / target / z-score or categorical match / acceptable / unacceptable), issuing provider org + scheme coordinator name + digital signature date + certificate serial, and a footer `Certificate serial: {serial}. This certificate supersedes serial {prior}.` when applicable.

**FR-V3.5-11 — Regeneration rules.** A user with `eqa.provider.manage` MAY regenerate a certificate (correcting a misspelled lab name, for example). Regeneration requires a reason text. The new PDF bears a `Supersedes serial X` watermark at top-right; the prior record's `withdrawn` flag is left false (participants retain their copy for audit continuity) unless the regeneration reason is `withdrawal` (in which case `withdrawn = true` and `withdrawn_reason` is the user's text).

**FR-V3.5-12 — Participant visibility.** On the V2.3 Recent Cycles screen (FR-V2.3-07), a new `Certificate` column appears for cycles whose scheme has certificates enabled. Values: `Download` (link, when available) / `Generating…` / `—` (scheme without certificates). Clicking `Download` fetches the current non-withdrawn certificate for the lab's org.

**FR-V3.5-13 — Provider cycle-certificate tab.** V2.5 Cycle detail page gains a `Certificates` tab showing per-participant rows: `Lab` / `Serial` / `Generated at` / `Regenerated` / `Withdrawn` / Actions (`Preview`, `Download`, `Regenerate`, `Withdraw`). Filters: withdrawn y/n, regenerated y/n. Supports CSV export of the metadata list.

**FR-V3.5-14 — Permissions.** `eqa.provider.panel_lot.manage` (lots, homogeneity, stability entry). `eqa.provider.release_override` (force-release a held lot; narrower, senior). `eqa.provider.certificate.manage` (regenerate / withdraw). `eqa.participant.certificate.view` (participant-side download; auto-granted to any role with `eqa.enter` or `eqa.review` in V3.5).

**FR-V3.5-15 — i18n namespace.** `eqa.iso17043.*`. Keys MUST cover: panel wizard new step titles + inline copy, homogeneity / stability column headers and pass/fail Tag labels, release-gate tooltip copy, certificate tab headers, regeneration modal copy, participant Recent Cycles `Certificate` column values, certificate PDF template placeholders.

**FR-V3.5-16 — Audit trail.** Every lot status transition, every homogeneity/stability row insert/update, every certificate generation / regeneration / withdrawal, every release-override MUST be written to audit with `who / when / before / after / reason`.

### Acceptance Criteria

- **AC-V3.5-01:** Given `feature.eqa_iso_17043=on` and a scheme with `iso_17043_mode=true`, when the scheme coordinator opens the V2.5 Panel Wizard, then Steps 2a (Homogeneity) and 2b (Stability) are inserted between Step 2 and Step 5.
- **AC-V3.5-02:** Given a panel with three analytes, when the coordinator enters homogeneity replicates for two and clicks `Release for distribution`, then the button is disabled and the tooltip reads `Homogeneity: missing for analyte {third analyte}. Stability: T0 measurement missing for {analyte1}, {analyte2}, {third}.`
- **AC-V3.5-03:** Given a homogeneity test is saved with `anova_p=0.02` and `pass_threshold_p=0.05`, then `pass=false`, the lot transitions to `held`, and a deviation investigation card is created with `trigger_source='panel_homogeneity_failure'`.
- **AC-V3.5-04:** Given a held lot, when a user without `eqa.provider.release_override` opens it, then the `Force release` action is hidden; a user with the permission sees the action and must provide a reason text before saving.
- **AC-V3.5-05:** Given a cycle transitions to `closed` with `scheme.certificates_enabled=true` and 25 participants, when the close event completes, then 25 `eqa_cycle_certificate` rows exist with unique serials and the provider sees a toast `Generated 25 certificates.`
- **AC-V3.5-06:** Given certificate generation fails for 2 of 25 participants (missing accreditation number), then 23 succeed, 2 fail rows appear on the Certificates tab with status `Failed: missing accreditation number` and a `Retry` action.
- **AC-V3.5-07:** Given a participant lab opens Recent Cycles (V2.3), when a cycle's scheme has certificates enabled and a non-withdrawn certificate exists, then the `Certificate` column shows `Download`; clicking it downloads the current PDF with the lab's details.
- **AC-V3.5-08:** Given a provider regenerates a certificate with reason `Lab name misspelled`, then a new row is written with `regenerated_count=1`, `supersedes_serial=<prior>`, the PDF bears a `Supersedes serial {prior}` watermark, and the prior row remains `withdrawn=false`.
- **AC-V3.5-09:** Given a provider withdraws a certificate with reason `Incorrect scoring applied`, then `withdrawn=true`, `withdrawn_reason='Incorrect scoring applied'`, and the participant's Recent Cycles column changes to `—`; a new regeneration is required to restore access.
- **AC-V3.5-10:** Given the `Download audit evidence bundle` action, when invoked on a released lot, then the ZIP contains exactly the artifacts listed in FR-V3.5-07 and an INDEX.txt listing them with byte sizes; the async job reports progress via a toast.
- **AC-V3.5-11:** Given all text strings in the new wizard steps, certificates tab, participant cycles column, certificate PDF template, and regeneration modal, every visible string is bound via `t('eqa.iso17043.*')` and present in the Localization table.
- **AC-V3.5-12:** Given a scheme with `iso_17043_mode=false`, when the scheme coordinator opens the Panel Wizard, then the homogeneity and stability steps are hidden and the release gate is unchanged from V2.5 behavior.
- **AC-V3.5-13:** Given all audit-eligible actions, when examined post-hoc, every transition has an audit row with `who`, `when`, `before`, `after`, and `reason` (where user-provided).

### Non-Functional

- Certificate generation for up to 500 participants MUST complete within 10 minutes (async); per-participant PDF generation MUST be ≤3s (p95).
- ANOVA computation for up to 20 samples × 10 replicates MUST complete in <1s.
- Audit evidence ZIP MUST be ≤20MB for a typical lot; generation in <30s.
- Certificate PDFs MUST pass PDF/A-2b compliance for archival.

### Definition of Done

- Migrations add all five new tables plus scheme flag, permission keys, audit trail columns.
- ANOVA service has unit tests covering pass (p≥0.05), fail (p<0.05), degenerate (single sample), missing values.
- Certificate PDF has a golden-snapshot test (fixed inputs → byte-stable output except timestamp).
- End-to-end integration test: wizard → homogeneity pass → stability T0 → release → cycle run → scored → close → certificates generated → participant download.
- Accessibility: wizard step navigation, homogeneity grid (keyboard-navigable), certificates tab, regeneration modal all pass axe-core.
- Feature flag off path has smoke tests confirming no regressions for V2.5 flows.

### Out of Scope

- Physical / wet signatures; deployments manage hard-copy workflows locally.
- Bilingual certificate templates (V3.5 supports one locale per scheme; multi-locale with V3.1 analytics).
- Advanced statistical engines (Levene's test, non-parametric alternatives) — one-way ANOVA only.
- Inter-laboratory comparison certification (covered by the provider's own external accreditation).
- Automatic participant-side certificate notifications via email — visibility is on Recent Cycles only.

---

## STORY V3.6 — Provider-Side Internal NCE Triggers

**Story Points:** 8
**Labels:** `eqa` `provider` `nce` `iso-17043` `provider-ops` `cluster-detection`

### User Stories

- **As a PT provider scheme coordinator,** I want automatic NCEs raised for my own operational failures (panel homogeneity fail, cold-chain breach in my storage, distribution deadline miss) so that my team's CAPA discipline is subject to the same investigation workflow we expect participants to follow.
- **As a PT provider scheme coordinator,** I want a nightly detector that flags cluster failures (≥X% of participants failing the same analyte in a cycle) so that I can investigate a suspect panel lot instead of assuming the participants all drifted.
- **As a quality manager,** I want all provider-side NCEs to flow into the existing NCE register with the correct `trigger_source` so that I have a single investigation funnel and existing CAPA reports include provider-side issues automatically.
- **As an auditor,** I want clear provenance on every provider-side NCE (what triggered it, which panel lot, which cycle, who acknowledged) so that ISO 17043 §4.11 CAPA evidence is defensible.

### Design Brief

**Purpose:** extend the existing NCE register with five new `trigger_source` values specific to provider operations. This is mostly backend + integration; the NCE investigation UI already exists and is reused. V3.6 is compact but operationally important.

**Primary user action:** the scheme coordinator reviews a new NCE in the register, opens the investigation (same UI as V2.3 participant-side investigations), and runs the existing CAPA workflow to closure.

**Layout pattern:** no new screens. Extends the NCE register filters with a `Provider-side` quick filter and a `Trigger source` multi-select that now includes the new values.

**Interaction model:** same as the existing NCE investigation. New: a small `Provider-op` Tag renders on register rows where the trigger is one of the V3.6 sources.

**Scope boundary (this story):** the five new trigger sources, the cluster-failure detector, cluster-detection threshold config, Tag + filter UI updates on the NCE register.

**Out of scope:** reworking the existing NCE investigation UI, CAPA workflow changes, or the NCE closure report template.

**Carbon components:** `Tag` (kind=warm-gray for provider-op), `MultiSelect` (trigger source filter), `NumberInput` (threshold config), `Tabs` (register already has these).

### Functional Requirements

**FR-V3.6-01 — New `nce.trigger_source` enum values.** Add:
- `panel_homogeneity_failure` (raised by V3.5; already listed there — unified here)
- `panel_stability_failure` (stability test outside tolerance)
- `scoring_error` (manual or detected; see FR-V3.6-04)
- `distribution_deadline_miss`
- `cluster_failure_detected`
- `provider_cold_chain_failure`

Each value requires: a human-readable label, a default severity, a default responsible role, and a link template into the originating record.

**FR-V3.6-02 — Automatic NCE creation triggers.**
- **Panel homogeneity fail (V3.5):** already covered by FR-V3.5-06; the V3.6 contribution is enumerating the trigger source.
- **Panel stability fail:** when an `eqa_panel_stability_test` row is saved with `within_tolerance=false`, auto-create an NCE linked to the lot.
- **Distribution deadline miss:** nightly job compares `eqa_round.distribution_date` against `eqa_round.distributed_at`; if distribution_date + 24h passes with `distributed_at IS NULL`, auto-create.
- **Provider cold-chain failure:** when provider-side stored panels exceed tolerance (requires provider-side storage logging — uses same `eqa_shipment_deviation` infrastructure from V3.2, applied to `source='provider_storage'`), auto-create.
- **Scoring error:** manually raised by a scheme coordinator (button on the Cycle page) OR auto-raised when FR-V3.6-04's detector fires.

**FR-V3.6-03 — Cluster failure detector (nightly job).** Run nightly at a provider-configurable time (default 02:00 local). For each `eqa_cycle` in `scored` state whose scoring completed in the last 7 days, compute per-analyte failure rate across participants. When failure rate ≥ threshold (default 40%, per-provider configurable 10–80%), auto-create a `cluster_failure_detected` NCE linked to the panel lot AND to the cycle. Detector idempotency: one NCE per (cycle, analyte); re-runs don't duplicate.

**FR-V3.6-04 — Scoring error detector (bias / z-score inconsistency).** When a cycle closes, compute cohort-level z-score distribution per analyte. If the absolute skew of z-scores exceeds a threshold (default |skew| > 0.8 OR ≥ 30% of participants on one tail), auto-raise `scoring_error`. This is an advisory — the NCE prompts a scheme coordinator to verify target values rather than asserting a definite error.

**FR-V3.6-05 — Threshold configuration UI.** Provider admin page gains a **Provider NCE Detectors** section (under the existing V2.5 Schemes & Programs provider panel) with rows for each detector: enabled toggle, threshold value, schedule time. Validates thresholds against min/max per FR-V3.6-03.

**FR-V3.6-06 — NCE register UI extensions.** The existing NCE register gains:
- A **Provider-side** quick filter chip (shows NCEs where `trigger_source` is one of V3.6's new values).
- An extended **Trigger source** MultiSelect that includes the new values with their labels.
- A `Provider-op` Tag on rows where `trigger_source` is provider-side.

**FR-V3.6-07 — Permissions.** `eqa.provider.nce.manage` grants visibility and investigation of provider-side NCEs. `eqa.provider.nce.detector.config` gates the threshold configuration UI. Reuses `nce_capa.investigate` + `nce_capa.close` for the downstream CAPA workflow.

**FR-V3.6-08 — i18n namespace.** `eqa.provider_nce.*`. Keys MUST cover all new enum labels, detector configuration labels, cluster-failure and scoring-error advisory copy, the `Provider-op` Tag label, and filter chip text.

**FR-V3.6-09 — Audit trail.** Every auto-created NCE MUST record the detector name, input snapshot (inclusive of threshold at time of firing), and the computed values that triggered it. This is preserved even if thresholds change later.

### Acceptance Criteria

- **AC-V3.6-01:** Given a homogeneity test is saved with `pass=false` (V3.5), when the save completes, then a `panel_homogeneity_failure` NCE exists with `linked_lot_id` and appears in the register under the `Provider-side` filter.
- **AC-V3.6-02:** Given `eqa_round.distribution_date = 2026-05-01` and `distributed_at IS NULL`, when the nightly job runs on 2026-05-02, then a `distribution_deadline_miss` NCE is created once; a second run on 2026-05-03 does not duplicate it.
- **AC-V3.6-03:** Given a scored cycle with 20 participants and analyte HIV-1 VL has 9 failures (45%), when the cluster detector runs with threshold 40%, then a `cluster_failure_detected` NCE is created linked to the cycle + panel lot; it includes a computed-value snapshot `{analyte: HIV-1 VL, fail_rate: 0.45, threshold: 0.40, n: 20}`.
- **AC-V3.6-04:** Given the same cycle is already at 45% failure rate and the detector runs again the next night, then no new NCE is created (idempotent per cycle+analyte).
- **AC-V3.6-05:** Given a closed cycle where z-score skew = 0.9, when scoring completes, then a `scoring_error` advisory NCE is created with copy that instructs the coordinator to verify target values before closing CAPA.
- **AC-V3.6-06:** Given an admin with `eqa.provider.nce.detector.config` changes the cluster threshold from 40% to 30%, when a future scored cycle has 35% fail rate, then a `cluster_failure_detected` NCE is created; previously-scored cycles are not retroactively re-evaluated.
- **AC-V3.6-07:** Given a user without `eqa.provider.nce.manage`, when they open the NCE register, then provider-side rows are hidden and the `Provider-side` filter chip is disabled.
- **AC-V3.6-08:** Given the NCE register, when a user filters by `Trigger source` with `cluster_failure_detected` selected, then only those NCEs render; each row shows the `Provider-op` Tag.
- **AC-V3.6-09:** Given all new strings in the register filter, Tag, detector config, and advisory NCE copy, every visible string is bound via `t('eqa.provider_nce.*')` and present in the Localization table.
- **AC-V3.6-10:** Given an auto-created NCE, when audited, the audit entry shows `detector_name`, `threshold_snapshot`, `inputs_snapshot`, `created_at`, `cycle_id?`, `lot_id?`, `round_id?`.

### Non-Functional

- Nightly cluster detector MUST complete in <5 minutes for a provider with up to 50 cycles scored in the last 7 days.
- NCE register page MUST render in <1.5s (p95) with up to 5000 rows, with the new filters applied.
- Detector runs MUST be idempotent; a failed run may be re-attempted without creating duplicates.

### Definition of Done

- Migrations extend the `nce.trigger_source` enum with all six new values.
- Cluster detector + scoring-error detector have unit tests for threshold boundaries and idempotency.
- Detector threshold config page tested for permission gating and min/max validation.
- NCE register UI updates pass accessibility checks with the new filter chip focusable via keyboard.
- Audit trail assertions cover every new auto-creation path.

### Out of Scope

- Reworking the existing NCE investigation UI or closure template.
- Rolling out the cluster detector retroactively to cycles scored before go-live.
- Detectors for participant-side NCE triggers (those stay on the V2.3 detector list).
- Provider-side storage integration (requires a separate storage-tracking subsystem; V3.6 only records storage-cold-chain deviations already captured via V3.2 mechanisms applied to `source='provider_storage'`).

---

## STORY V3.7 — PT Hub: Provider-Side Proxy Entry for Offline Participants

**Context:** ePT platforms (APHL ePT and similar) have always needed a way for provider-side admins (national reference labs, scheme coordinators) to enter results on behalf of participating labs that cannot submit electronically — paper forms, phone / SMS dictation, email PDF scans. The lesson from ePT's deployments across 10+ countries is that this is not a fringe case: for many rural / public-sector participants it is the primary submission channel, and a provider program that cannot accommodate it excludes the labs that need PT oversight most.

**Gap:** Not covered by a V2 gap (G1–G15) because V2.5 assumes the participant is an OpenELIS-using lab; there is no provider-side surface for entering somebody else's results.
**Story Points:** 13
**Labels:** `eqa` `provider` `proxy-entry` `accessibility` `equity` `audit` `pt-hub`

### User Stories

- **As a PT provider proxy-entry operator,** I want to type a participant lab's results into the provider's OpenELIS session so that labs without electronic submission (rural, paper-only, intermittent connectivity) aren't excluded from the scheme.
- **As a PT provider proxy-entry operator,** I want to attach a scan of the original paper submission or an email PDF to each proxy entry so that the audit trail is defensible without hunting through email archives.
- **As a participating lab QA officer,** I want proxy-entered results to appear in my dashboards (Recent Cycles, Lab Performance, Analyst Competency) identically to results I would have entered myself — with a small tag that reveals the source — so that my analytics don't have a gap for the cycles I submitted on paper.
- **As a provider lab director,** I want proxy-entered results to attribute to the participant's organization (not mine) so that the provider's own performance dashboards don't get inflated with 30 other labs' results.
- **As an auditor,** I want to distinguish proxy-entered results from self-entered results without changing how they score so that I can trace data provenance without affecting program outcomes.

### Design Brief

**Purpose:** add a provider-side result-entry surface that writes to the participant's data space — a narrow but crucial capability for PT hub deployments serving labs that don't use OpenELIS (or any electronic LIS). Attribution is dual-layered: `entered_by` identifies the proxy operator for audit; `data_owner_org_id` identifies the participating lab for all downstream filtering.

**Primary user action:** from the provider Cycle detail page, click `Proxy entry` on a participant row to open the per-participant, per-analyte entry form. Operator fills results, selects a `data_source`, optionally uploads a scan, and saves.

**Layout pattern:** inline expansion from the provider Cycle page's participant list (Constitution Principle 3). The expanded row renders the entry form. Grouped with existing Receipt Monitor affordances in the row-level overflow menu (V2.5).

**Interaction model:** form mirrors the standard result-entry UX (same field set, validation, per-analyte cells) but is gated by `eqa.provider.proxy_entry`. `data_source` is a required Dropdown with values `proxy_paper`, `proxy_phone`, `proxy_email`, `proxy_sms`, `proxy_other`. Optional attachment uploader. Save writes dual-attribution columns.

**Scope boundary (this story):** proxy-entry surface, permission key, attribution columns, attachment slot, participant-side visibility of source tag.

**Out of scope:** participant-confirmation round-trip (V3.8 FHIR interop is a better long-run answer); SMS or phone capture tooling on the proxy side (we accept the operator transcribes and types); retroactive re-attribution of V2 results.

**Carbon components:** `Button kind="tertiary"` (Proxy entry action), inline row expansion, `Dropdown` (data source), `TextInput`/`NumberInput` (result fields — reused from standard entry), `FileUploaderItem` (attachment), `InlineNotification` (permission denied), `Tag kind="warm-gray"` (source tag on participant views).

### Functional Requirements

**FR-V3.7-01 — Permission: `eqa.provider.proxy_entry`.** New permission key, distinct from `eqa.provider.manage`. Default: not granted to any role. Must be assigned explicitly. API-layer enforcement returns HTTP 403 on any proxy-entry endpoint when absent; UI-layer enforcement hides the `Proxy entry` action.

**FR-V3.7-02 — Proxy-entry surface.** On the V2.5 provider Cycle detail page, each participant row gains a `Proxy entry` action (visible only to permitted users). Click opens an inline-expanded row containing the entry form. Form is identical in layout to the standard V2.3 participant result entry form per analyte; the only additional fields are `data_source` (required Dropdown) and `proxy_entry_notes` (optional TextArea) + file upload slot.

**FR-V3.7-03 — Attribution columns on `eqa_participant_result`.** Add:
- `entered_by` (fk user, NOT NULL) — the user who typed the result. For proxy entries, this is the provider-side operator. For self-entries, this is the participating-lab user.
- `data_owner_org_id` (fk organization, NOT NULL) — the participating lab's organization. For proxy entries, set to the participant lab's org, NOT the provider's org.
- `data_source` (enum NOT NULL) — values: `self_electronic` (default for self-entered), `proxy_paper`, `proxy_phone`, `proxy_email`, `proxy_sms`, `proxy_other`.
- `proxy_entry_notes` (text, nullable).
- `proxy_attachment_blob_ref` (uuid, nullable).

Constraint: `data_owner_org_id != user_org_of(entered_by)` ⟹ `data_source != 'self_electronic'` (DB-level CHECK). Violating this returns 422 at the API with error message `proxy_entry_requires_data_source`.

**FR-V3.7-04 — Participant-side filtering on `data_owner_org_id`.** All participant-facing queries (V2.3 Recent Cycles, V2.3 Lab Performance coverage + trends, V2.3 Analyst Competency, V3.1 Trends + Signals, V2.3 Follow-Up Queue) MUST filter results by `data_owner_org_id = <viewer's org>`. The V2.5 provider Lab Performance (provider's own org) MUST filter by `data_owner_org_id = <provider's own org>` — so proxy-entered results for other labs are excluded from the provider's self-performance view.

**FR-V3.7-05 — Source tag on participant views.** Result detail views (V2.3 scored-result drill-down, Recent Cycles result rows) show a small Tag (kind=warm-gray) next to the result when `data_source != 'self_electronic'` labeled `Source: Proxy (paper)`, `Proxy (phone)`, etc. Hover reveals who entered (`Entered by {entered_by.name} at {provider_org.name} on {date}`) and the notes + attachment link if present.

**FR-V3.7-06 — Attachment upload.** File types allowed: PDF, JPEG, PNG, HEIC. Max 10MB. Stored in the blob store with a reference on `proxy_attachment_blob_ref`. Participant-side users can download the attachment (no permission gate beyond viewing the result). Audit: uploads are logged with size + content type.

**FR-V3.7-07 — Scoring parity.** Proxy-entered results are scored using the exact same pipeline as self-entered results. There is NO `proxy_mode` flag or modifier in scoring. Downstream: `data_source` exists purely for audit and provenance.

**FR-V3.7-08 — Bulk proxy entry (CSV).** A secondary affordance on the V2.5 Cycle page: `Bulk proxy entry` — upload a CSV with columns `participant_org_id, analyte_id, result_value, data_source, notes`. CSV import runs validation per row, shows a preview with row-level errors, and on confirmation commits all valid rows. Errors like missing `data_source` block the specific row but don't abort the import.

**FR-V3.7-09 — Edit / redo.** A proxy entry can be edited by a user with `eqa.provider.proxy_entry` if the cycle is not in `scored` state. Edit writes an audit row. After `scored`, only the existing result-amendment workflow can change it (same as self-entered results).

**FR-V3.7-10 — Participant notification.** Low-cost: a small banner on the participant's Recent Cycles page appears for cycles where any result was proxy-entered: `{N} result(s) in this cycle were submitted on your behalf by {provider_org.name} via {source_list}.` No email is sent by default (that's V3.8 territory).

**FR-V3.7-11 — Reporting / analytics impact.** V3.1 coverage matrix and trends treat proxy-entered results identically to self-entered — the participating lab's coverage is NOT penalized for submitting on paper. Provider-side reporting (V3.6 cluster detector) also treats proxy + self identically for cluster-failure purposes.

**FR-V3.7-12 — i18n namespace.** `eqa.proxy_entry.*`. Keys MUST cover: action button label, inline form section title, data source enum labels, notes placeholder, attachment uploader text, source tag labels, participant-side banner copy, permission-denied message, bulk import column headers + error strings.

**FR-V3.7-13 — Audit trail.** Every proxy-entry save / edit / CSV-import-commit MUST be written to audit with `entered_by`, `data_owner_org_id`, `data_source`, `notes` (truncated), `attachment_ref?`, and the set of analyte IDs written in the operation.

### Acceptance Criteria

- **AC-V3.7-01:** Given a provider admin with `eqa.provider.proxy_entry`, when they enter a result for participant lab X for analyte HIV-1 Ab, then the result is persisted with `entered_by=<admin>`, `data_owner_org_id=<lab X org>`, `data_source='proxy_paper'`, and appears in lab X's Recent Cycles + Lab Performance with the `Source: Proxy (paper)` Tag.
- **AC-V3.7-02:** Given a provider admin without `eqa.provider.proxy_entry`, when they open the V2.5 Cycle page, then the `Proxy entry` action is not rendered; if they invoke the API endpoint directly, they receive HTTP 403.
- **AC-V3.7-03:** Given the API request omits `data_source` on an entry where `data_owner_org_id != user's org`, then the API returns HTTP 422 with body `{"error": "proxy_entry_requires_data_source"}`.
- **AC-V3.7-04:** Given the provider's own lab (org=provider) appears in the participant roster, when the provider enters a result for itself, then `data_source` defaults to `self_electronic` and no Tag is shown. Provider Lab Performance includes these results; other proxy-entered results are excluded (filter by `data_owner_org_id=<provider org>`).
- **AC-V3.7-05:** Given an attachment upload at 11MB, when the user clicks upload, then the UI rejects it with copy `Attachment must be ≤10MB (received 11MB)` and no partial upload persists.
- **AC-V3.7-06:** Given a proxy-entered result, when lab X's QA officer clicks the source Tag, then a popover shows `Entered by {operator.name} at {provider_org.name} on {date}`, the notes if present, and a download link for the attachment if present.
- **AC-V3.7-07:** Given a CSV with 5 rows, 3 valid + 2 invalid (missing `data_source`), when imported, then the preview shows 3 rows ready + 2 rows flagged with row-level errors; on confirm, 3 rows commit and 0 are committed for the 2 errored rows.
- **AC-V3.7-08:** Given a proxy-entered result exists, when the cycle reaches `scored`, then the proxy operator cannot edit the result via the proxy-entry form (only via the result-amendment workflow); editing attempts show `Cycle is scored — use amendment workflow`.
- **AC-V3.7-09:** Given a participant lab's Recent Cycles page, when any cycle has ≥1 proxy-entered result, then a banner renders: `{N} result(s) in this cycle were submitted on your behalf by {provider_org.name} via Paper, Email.`
- **AC-V3.7-10:** Given V3.1 coverage computation, when a lab has submitted 100% of its results via proxy entry, then its coverage is 100% — not penalized.
- **AC-V3.7-11:** Given all new strings in the proxy entry form, source Tag, participant banner, CSV import preview, permission-denied message, every visible string is bound via `t('eqa.proxy_entry.*')` and present in the Localization table.
- **AC-V3.7-12:** Given all audit-eligible actions (save / edit / bulk import / attachment upload), every action writes an audit row with the columns described in FR-V3.7-13.

### Non-Functional

- Proxy entry save MUST complete in <500ms (p95) including attribution + audit.
- CSV import MUST process up to 5000 rows within 30s (preview) and 60s (commit).
- Attachment storage MUST be encrypted at rest; URL signing for download with 10-minute expiry.
- UI MUST render proxy-entry form in <1s on a 3G network (the target deployment environment for many PT hub participants).

### Definition of Done

- Migrations add `entered_by`, `data_owner_org_id`, `data_source`, `proxy_entry_notes`, `proxy_attachment_blob_ref` columns to `eqa_participant_result` + CHECK constraint + `eqa.provider.proxy_entry` permission.
- API-layer permission enforcement has a contract test that returns 403 for missing permission + 422 for missing `data_source`.
- Participant-side query filters are audited: every query touching `eqa_participant_result` in the participant-facing codebase filters by `data_owner_org_id`.
- CSV import has a fuzz-test with malformed rows; no partial commits on parse errors.
- Accessibility: proxy entry form, source Tag popover, and bulk import preview table pass axe-core.
- Performance: a load test proves 1000 proxy entries / minute can be sustained on a reference deployment.

### Out of Scope

- SMS / phone ingestion tooling on the proxy operator side (operator transcribes and types).
- Participant-confirmation round-trip (sent via V3.8 FHIR mechanisms if needed).
- Proxy entry for schemes requiring blinded codes (blinding is V2.4; proxy entry assumes the operator knows the blind-code mapping if applicable).
- OCR / data-capture from uploaded scans (attachment is audit evidence, not auto-processed).
- Retroactive re-attribution of V2 self-entered results.

---

## STORY V3.8 — ePT FHIR Interop: Discovery + Adapter Shim

**Context:** APHL's ePT + InteLIS + tbPT family of platforms has run in 10+ countries since 2014, with established test-domain forms (HIV serology rapid, HIV VL, EID, HIV recency, COVID-19, TB). OpenELIS will not and should not replace those deployments; but a country that runs ePT as its provider-side PT platform and OpenELIS as its participating labs' LIS should be able to submit results + receive scores without manual CSV uploads. V3.8 is the adapter shim that makes that possible without coupling either side to the other's schema.

**Gap:** Not explicitly in G1–G15. Partially overlaps with the V2.2 FHIR auto-submission path (FR-V2.2-05) — V3.8 is the work that makes that path talk to an actual ePT endpoint rather than a generic FHIR stub.

**Story Points:** 13 (discovery: 3, adapter implementation: 10)
**Labels:** `eqa` `fhir` `interop` `aphl-ept` `intelis` `participant` `global` `adapter-shim`
**Dependencies:** V2.2 (FR-V2.2-05 auto-submission path), V3.5 (if ePT-returned certificates are to be stored in `eqa_cycle_certificate`).

### User Stories

- **As a participating lab QA officer in a country that runs ePT,** I want OpenELIS to submit my EQA results directly to ePT so that I don't have to export a CSV and upload it to ePT's portal separately.
- **As a participating lab QA officer,** I want ePT-returned scores to land in my OpenELIS Lab Performance view without a second manual import so that analytics (V3.1 trends, Follow-Up Queue) work on the authoritative scored data.
- **As an OpenELIS deployment engineer,** I want the ePT integration to be an optional Java module so that deployments without ePT aren't forced to carry the adapter (or its dependencies) in their build.
- **As a program stakeholder,** I want a documented discovery artifact that names which ePT version the shim was verified against so that when ePT versions change, we have a defensible baseline for regression testing.
- **As a security officer,** I want ePT endpoint credentials stored in the secret store and never exposed in read APIs so that a scheme-config leak can't leak credentials.

### Design Brief

**Purpose:** connect OpenELIS V2.2's auto-submission path to real ePT / InteLIS FHIR endpoints via an adapter module. Two-phase work: (phase 1) discovery — verify what ePT actually implements; (phase 2) implementation — an adapter module that translates bidirectionally. V3.8 is scoped to a single adapter (APHL ePT + InteLIS are related enough to share one). Other adapters (proprietary or country-specific ePT variants) are future stories.

**Primary user action:** none new for end users — the feature is invisible. The QA officer submits EQA results via V2.2 as usual. The provider scheme admin picks `aphl_ept_fhir` as the endpoint type and provides an endpoint URL + credentials.

**Layout pattern:** no new screens. Extends the V2.1 scheme editor with the endpoint type Dropdown and credential-capture fields. Extends the V2.2 submission status view to show adapter-specific error messages when submission fails.

**Interaction model:** endpoint type Dropdown on the scheme editor; conditional fields (URL, credential selection, country-deployment ID) appear based on selected type. Credentials entered in a separate `PasswordInput` + a `Saved credentials` picker for deployments using the secret store directly.

**Scope boundary (this story):** discovery artifact + APHL ePT / InteLIS adapter module + endpoint type discriminator + configuration UI + bidirectional scoring parse.

**Out of scope:** bidirectional enrollment sync (participants self-enrolling in ePT from OpenELIS — separate story); certificate pull-back from ePT (V3.5-V3.8 integration is a follow-up); InteLIS-side modifications; adapters for non-APHL ePT platforms.

**Carbon components:** `Dropdown` (endpoint type), `TextInput` (URL, country deployment ID), `PasswordInput`, `InlineNotification` (adapter errors), `Button kind="secondary"` (Test connection).

### Functional Requirements

**FR-V3.8-01 — Discovery artifact.** Before implementation, produce `docs/eqa/ept-fhir-discovery.md` with:
- ePT version(s) examined (exact release tags or commit SHAs).
- Resource matrix: for each FHIR resource candidate (`Bundle`, `DiagnosticReport`, `Observation`, `Specimen`, `Device`, `CapabilityStatement`), document `supported Y/N`, `profile URL`, and a sample wire payload if available.
- Scoring-return channel: FHIR inbound / CSV export / API polling; for each, the URL/path pattern and authentication method.
- Known gaps or custom extensions ePT uses that don't fit generic FHIR.
- Date-stamped; named reviewer (typically the APHL liaison); listed limitations.

**FR-V3.8-02 — Endpoint-type discriminator on `eqa_scheme`.** Add `provider_fhir_endpoint_type` enum with values `generic_fhir_r4` (default, unchanged V2.2 behavior), `aphl_ept_fhir`, `aphl_intelis_fhir`, `custom` (non-functional placeholder for future adapters). The V2.2 auto-submission path (FR-V2.2-05) MUST dispatch on this discriminator: `generic_fhir_r4` → current stub; `aphl_ept_fhir` OR `aphl_intelis_fhir` → APHL adapter module; `custom` → raises `adapter_not_implemented` error.

**FR-V3.8-03 — Adapter module `eqa-adapter-aphl-ept`.** Java module (Maven artifact) loaded conditionally at build time via a profile. When not loaded, the enum values `aphl_ept_fhir` / `aphl_intelis_fhir` are still present in the DB enum but attempts to use them fail with a clear `adapter_module_not_available` error (not a 500). The module exposes a `EqaSubmissionAdapter` interface:
```java
interface EqaSubmissionAdapter {
  AdapterSubmitResult submit(EqaSubmissionContext ctx);
  AdapterScoreResult parseScores(byte[] response, EqaSubmissionContext ctx);
  ConnectionTestResult testConnection(EqaEndpointConfig cfg);
  String adapterName();
  String adapterVersion();
}
```

**FR-V3.8-04 — Submission translation.** The adapter translates OpenELIS's `eqa_participant_result` + scheme + panel + lab identifiers into the ePT-expected shape identified in the discovery artifact. Translation rules live in the adapter module and MUST be codified in a JSON schema or equivalent mapping document co-located with the adapter source. The translation is deterministic: same inputs ⇒ byte-identical outputs (aside from timestamps).

**FR-V3.8-05 — Scoring-return translation.** When ePT returns scored results (channel per discovery), the adapter parses and writes `eqa_participant_result.submission_status='scored'`, `z_score`, `performance_status`, and `scored_at` fields. Fields absent in the ePT response stay null (do not invent values). A scoring-return correlation is keyed on ePT's participant-result identifier (returned at submission time in the submission result); the adapter persists this correlation ID on submission so the scored-return path can look it up.

**FR-V3.8-06 — Scheme-level credential storage.** Extend `eqa_scheme` with `endpoint_url` (text), `endpoint_credential_ref` (uuid — pointer into existing OpenELIS secret store), `country_deployment_id` (text), `endpoint_last_tested_at` (timestamptz, nullable), `endpoint_last_test_result` (enum: ok | auth_failure | unreachable | adapter_not_available | unknown). NEVER return `endpoint_credential_ref` raw — the scheme read API resolves it to a redacted indicator (`Set` / `Not set`). Credential updates require `eqa.provider.manage` AND a reason text.

**FR-V3.8-07 — Configuration UI.** V2.1 scheme editor gains a **Provider Endpoint** Accordion with:
- `Endpoint type` Dropdown (enum values from FR-V3.8-02).
- When `aphl_ept_fhir` / `aphl_intelis_fhir`: conditional fields for URL, `Country deployment ID`, credential picker (select-from-secret-store with `Add new secret` link to the admin credential store).
- `Test connection` button → calls `adapter.testConnection(cfg)` and displays result inline.

**FR-V3.8-08 — Adapter-specific error surfacing.** When submission fails, the V2.2 submission status view (FR-V2.2-06) MUST show the adapter name in the error message (e.g., `Submission failed via APHL ePT adapter v1.2 — HTTP 401: invalid credentials. Check endpoint credentials.`) rather than a generic FHIR error. Alerts referencing these failures link back to the scheme endpoint config page.

**FR-V3.8-09 — Version compatibility declaration.** Each adapter build declares a compatible ePT version range (`min_ept_version`, `max_ept_version`, `tested_ept_version`). At `testConnection`, the adapter queries ePT's version endpoint (if available per discovery) and warns if the remote version is outside the compatible range: `Adapter v{X} was tested against ePT v{Y}. Remote ePT reports v{Z} — submission may fail in unexpected ways.`

**FR-V3.8-10 — Retry + idempotency.** The auto-submission path already retries (V2.2). The adapter MUST be idempotent — resubmitting the same `eqa_submission_attempt` produces either the same ePT-side result identifier (if ePT supports idempotency keys) or a detected duplicate that doesn't double-score. If ePT cannot guarantee idempotency, the adapter surfaces this in its capability matrix and the retry policy accommodates (single retry on network error only; no retry on 2xx or 4xx).

**FR-V3.8-11 — Permissions.** Configuration of endpoint URL + credentials requires `eqa.provider.manage` + `eqa.provider.endpoint.config` (new, narrower). Test-connection invocation requires the same. Changes to `endpoint_credential_ref` are audit-logged.

**FR-V3.8-12 — i18n namespace.** `eqa.ept_interop.*`. Keys MUST cover all Dropdown enum labels, conditional field labels (URL / credential picker / country deployment ID), test-connection states, adapter-specific error prefixes, and the adapter-not-available message.

**FR-V3.8-13 — Audit trail.** Every endpoint-type change, URL change, credential change, test-connection invocation (with result), submission attempt (with adapter name + version), and scoring-return parse MUST be audit-logged.

### Acceptance Criteria

- **AC-V3.8-01 (Discovery):** The discovery artifact `docs/eqa/ept-fhir-discovery.md` exists, is dated, names the ePT version examined, includes the resource matrix with ≥5 resources, and is reviewed + signed off by the APHL liaison (or a named equivalent).
- **AC-V3.8-02 (Adapter module):** When the `eqa-adapter-aphl-ept` Maven module is included in the build, configuring a scheme with `provider_fhir_endpoint_type='aphl_ept_fhir'` + valid URL + credential and calling `Test connection` returns `ok` against an ePT-compliant stub.
- **AC-V3.8-03 (Module-not-available path):** When the adapter module is NOT included in the build, configuring the same scheme and saving produces an UI error `APHL ePT adapter is not available in this deployment. Ask your deployment administrator to enable the eqa-adapter-aphl-ept module.` No 500 error reaches the user.
- **AC-V3.8-04 (Submission routing):** Given a scheme with `aphl_ept_fhir`, when a V2.2 auto-submission fires, then the adapter is invoked (verifiable via adapter-named log line) and the outgoing payload matches the adapter's mapping document byte-for-byte.
- **AC-V3.8-05 (Adapter error surfacing):** Given an ePT endpoint returns HTTP 401, when the submission fails, then the V2.2 submission status shows `Submission failed via APHL ePT adapter v{X} — HTTP 401: invalid credentials` and the Alerts entry links to the scheme's endpoint config page.
- **AC-V3.8-06 (Scoring return):** Given a valid ePT-returned scored payload, when the adapter parses it, then `eqa_participant_result` rows are updated with `submission_status='scored'` + `z_score` + `performance_status`, and downstream V2.3 Lab Performance + V3.1 trends render the scored data identically to generic-FHIR submissions.
- **AC-V3.8-07 (Credential confidentiality):** Given a scheme is read via the scheme API, when `endpoint_credential_ref` is present, then the API response redacts the raw credential and shows only `Set`; attempting to fetch the raw credential via the public API returns HTTP 403.
- **AC-V3.8-08 (Version compatibility):** Given an adapter v1.2 compatible with ePT v2.0–v2.4, when `Test connection` runs against ePT v2.5, then a warning appears `Adapter v1.2 was tested against ePT v2.4. Remote ePT reports v2.5 — submission may fail in unexpected ways.` The button still allows proceeding (after confirmation).
- **AC-V3.8-09 (Idempotency):** Given a submission is re-attempted after a network error, then the ePT side logs only one scored result for that submission and `eqa_submission_attempt.attempt_count` increments.
- **AC-V3.8-10 (Permissions):** Given a user without `eqa.provider.endpoint.config`, when they open the scheme editor, then the Provider Endpoint Accordion is rendered read-only with an info note and no Test-connection button; API calls to change endpoint config return HTTP 403.
- **AC-V3.8-11 (i18n + strings):** Every visible string in the Provider Endpoint Accordion, test-connection states, adapter error prefixes, and adapter-not-available message is bound via `t('eqa.ept_interop.*')` and present in the Localization table.
- **AC-V3.8-12 (Audit):** Every endpoint-type change, URL change, credential change, test-connection invocation, submission attempt, and scoring-return parse is represented by an audit row with `who / when / before / after / adapter_name / adapter_version`.

### Non-Functional

- Adapter module build size MUST NOT exceed 2MB (unshaded). Dependencies on HAPI FHIR should reuse what V2.2 already pulls in.
- Submission path latency MUST NOT regress vs. V2.2's generic FHIR stub by more than 200ms (p95) for equivalent payloads.
- Scoring-return parsing MUST handle ePT payloads up to 1MB in <500ms.
- Credentials MUST never appear in logs (enforced via log-scrubber). A spot-check audit must verify this.
- The adapter MUST tolerate ePT endpoint unreachable for up to 5 minutes without data loss (V2.2 retry policy handles further backoff).

### Definition of Done

- Discovery artifact exists, is dated, signed off, and committed alongside this story in the repo.
- Adapter module has unit tests covering: submission payload byte-stability, scoring-return parsing for all ePT response shapes documented in discovery, `testConnection` for all four result states, idempotency, version-compatibility warning trigger.
- Integration test uses an ePT-compliant test double (either a published APHL stub or a hand-rolled one matching discovery) to exercise submit → score-return round-trip.
- Configuration UI passes axe-core accessibility on the endpoint config form, test-connection button, and adapter-error surfacing.
- Deployment build flags are documented: `-Peqa-ept-adapter` (include), `-P!eqa-ept-adapter` (exclude); omission defaults to exclude.
- Secret-store integration is verified end-to-end: credential add / use / rotate works without exposing raw values.

### Out of Scope

- Bidirectional enrollment sync (participants self-enrolling in ePT from OpenELIS).
- Certificate pull-back from ePT into `eqa_cycle_certificate`.
- InteLIS-side modifications (OpenELIS is the talking side; InteLIS is the listening side).
- Adapters for non-APHL ePT platforms (Thermo, Bio-Rad, proprietary national PT systems).
- Automatic adapter version upgrades (deployment-triggered only).

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

## Appendix A — Consolidated i18n Key Registry

This appendix consolidates the per-story i18n namespace declarations (FR-V2.2-10, FR-V2.3-11, FR-V2.4-12, FR-V2.5-11, FR-V3.1-09, FR-V3.2-14, FR-V3.3-11, FR-V3.4-12, FR-V3.5-15, FR-V3.6-08, FR-V3.7-12, FR-V3.8-12) into a single registry for localizers and implementers. Keys are derived from `eqa-v2-preview.html` (authoritative for current UI surface) and the functional requirements.

### Conventions

- **Pattern:** `[category].[feature].[identifier]` — e.g. `eqa.participant.myCycles`, `eqa.iso17043.homogeneity.title`, `error.eqa.panel.aliquotsInvariant`.
- **Usage:** Every visible string in JSX uses `t(key, fallback)`. The fallback is the authoritative English copy; the key is stable across translations.
- **File layout:** `src/main/resources/locales/{en,fr,es,pt}/eqa.json`, partitioned by top-level namespace segment (`eqa.participant.*` lives in `eqa.json` under a `participant` object).
- **CI guard:** A key is "shipped" only when it appears in every supported locale file. Missing-key coverage is enforced by a build-time check (`scripts/verify-i18n.js`). English fallback may not be empty.
- **Supported locales at Epic 1 launch:** `en` (required), `fr` (required — Madagascar, DRC, Côte d'Ivoire deployments). `es` and `pt` are best-effort, added as country partners engage.
- **Error keys:** All server-returned validation errors use the `error.eqa.*` prefix; the UI surfaces them via the same `t(key, fallback)` helper. The fallback on the client is the generic English message; the server may override with its localized resolution.

### Namespace index

| Story | Namespaces |
|---|---|
| V2.1 | `error.eqa.panel.*` (validation errors only — no visible UI) |
| V2.2 | `eqa.participant.*`, `eqa.cycle.*`, `eqa.receipt.*`, `eqa.enroll.*`, `eqa.review.*` |
| V2.3 | `eqa.oversight.*`, `eqa.analyst.*`, `eqa.performance.*`, `eqa.queue.*` |
| V2.4 | `eqa.inhouse.*`, `eqa.inhouse.prep.*`, `eqa.inhouse.labels.*`, `eqa.blinding.*` |
| V2.5 | `eqa.provider.*`, `eqa.provider.prep.*`, `eqa.provider.ship.*`, `eqa.provider.receipt.*`, `eqa.followup.*` |
| V3.1 | `eqa.analytics.trends.*`, `eqa.analytics.signals.*`, `eqa.analytics.thresholds.*`, `eqa.analytics.annual.*`, `eqa.analytics.config.*` |
| V3.2 | `eqa.coldchain.*`, `eqa.coldchain.monitor.*`, `eqa.coldchain.receipt.*` |
| V3.3 | `eqa.iqc_correlation.*` |
| V3.4 | `eqa.impact.*` |
| V3.5 | `eqa.iso17043.*`, `eqa.iso17043.homogeneity.*`, `eqa.iso17043.stability.*`, `eqa.iso17043.certificates.*` |
| V3.6 | `eqa.provider_nce.*`, `eqa.provider_nce.detectors.*` |
| V3.7 | `eqa.proxy_entry.*`, `eqa.proxy_entry.bulk.*` |
| V3.8 | `eqa.ept_interop.*` |
| Cross-cutting | `eqa.col.*` (column headers), `eqa.btn.*` (shared buttons), `eqa.kpi.*` (KPI tiles), `eqa.common.*` (shared words like View), `eqa.search`, `eqa.progress.*` |

### Key registry (English authoritative; `fr` / `es` / `pt` marked TBD until translation)

Notation: `key` · English fallback. FR column = French fallback (TBD = not yet translated). Rows are grouped by namespace; repeated namespaces group together.

#### Cross-cutting (`eqa.btn.*`, `eqa.col.*`, `eqa.kpi.*`, `eqa.common.*`, misc)

| Key | English | FR |
|---|---|---|
| `eqa.btn.back` | Back to My Cycles | TBD |
| `eqa.btn.openReview` | Open pre-submission summary | TBD |
| `eqa.btn.printPanel` | Print panel worksheet | TBD |
| `eqa.btn.receivePanel` | Receive panel | TBD |
| `eqa.btn.exportPdf` | Export cycle summary (PDF) | TBD |
| `eqa.btn.submitFhir` | Submit via FHIR → | TBD |
| `eqa.btn.escalateNce` | Escalate to NCE | TBD |
| `eqa.btn.dismiss` | Dismiss with reason | TBD |
| `eqa.btn.viewCycle` | View cycle | TBD |
| `eqa.btn.launchBlinding` | Launch blinding wizard | TBD |
| `eqa.col.scheme` | Scheme | TBD |
| `eqa.col.type` | Type | TBD |
| `eqa.col.cycle` | Cycle | TBD |
| `eqa.col.status` | Status | TBD |
| `eqa.col.deadline` | Deadline | TBD |
| `eqa.col.progress` | Progress | TBD |
| `eqa.kpi.active` | Active cycles | TBD |
| `eqa.kpi.readyToSubmit` | Ready to submit | TBD |
| `eqa.kpi.awaiting` | Awaiting scores | TBD |
| `eqa.kpi.openNce` | Open EQA-linked NCE | TBD |
| `eqa.common.view` | View → | TBD |
| `eqa.search` | Scheme, provider, cycle… | TBD |
| `eqa.progress.title` | Sample progress | TBD |
| `eqa.labNo.tooltip` | Open results entry for this lab number | TBD |

#### V2.2 — Participant experience (`eqa.participant.*`, `eqa.cycle.*`, `eqa.receipt.*`, `eqa.enroll.*`, `eqa.review.*`)

| Key | English | FR |
|---|---|---|
| `eqa.participant.myCycles` | My EQA Cycles | TBD |
| `eqa.participant.myCyclesSubtitle` | Cycles your lab is participating in. Result entry and validation happen in the standard OpenELIS result pipeline — this page tracks progress and routes you there. | TBD |
| `eqa.participant.infoTitle` | EQA results flow through standard validation. | TBD |
| `eqa.participant.infoBody` | Click a Lab No to open standard result entry for that sample, with the EQA flag and per-analyst column set. Once validation-complete, the cycle auto-advances to Submitted (or to Ready-to-submit if the scheme requires cycle-level review). | TBD |
| `eqa.cycle.plannedCopy` | Panel has not yet been received at this lab. Confirm receipt when the shipment arrives to advance the cycle to Testing. | TBD |
| `eqa.review.title` | Pre-submission summary | TBD |
| `eqa.review.subtitle` | Read-only summary of all validated results before FHIR submission. No additional sign-off is required — validation in the standard pipeline is the authoritative gate. This scheme has the optional cycle-review flag turned on. | TBD |
| `eqa.review.ready` | All results validated. | TBD |
| `eqa.review.scheme` | Scheme | TBD |
| `eqa.review.cycle` | Cycle | TBD |
| `eqa.review.provider` | Provider | TBD |
| `eqa.review.deadline` | Deadline | TBD |
| `eqa.review.status` | Status | TBD |
| `eqa.review.resultsBySample` | Results summary | TBD |
| `eqa.review.auditFootnote` | All results linked to their standard-pipeline validation audit record. No additional approval captured here — validation is the authoritative action. | TBD |
| `eqa.receipt.title` | Confirm panel receipt | TBD |
| `eqa.receipt.sub` | Minimal receipt event — records who received the panel and when. Temperature + integrity fields are optional at MVP; structured cold-chain validation arrives in V3.2. | TBD |
| `eqa.receipt.receivedDate` | Received date | TBD |
| `eqa.receipt.receivedBy` | Received by | TBD |
| `eqa.receipt.temp` | Received temp (°C) | TBD |
| `eqa.receipt.integrity` | Package integrity | TBD |
| `eqa.receipt.integrityNotes` | Integrity notes | TBD |
| `eqa.receipt.notes` | General notes | TBD |
| `eqa.receipt.sideEffect` | Confirming receipt transactionally updates the linked sample_shipment to delivered and transitions the cycle planned → panel_received. A best-effort FHIR ShipmentDelivery notification is sent; failure is logged but does not block the receipt. | TBD |
| `eqa.receipt.confirm` | Confirm receipt | TBD |
| `eqa.enroll.title` | My EQA Enrollments | TBD |
| `eqa.enroll.subtitle` | Carbon port of the V1 enrollment UI (scope of V2.2). Enroll this lab in new schemes, map per-analyst eligibility where applicable, and attach accreditation alternative-assessment notes for §7.7.2 coverage gaps. | TBD |
| `eqa.enroll.previewBanner.title` | Preview placeholder | TBD |
| `eqa.enroll.previewBanner.body` | V1 enrollment UI has already been ported to Carbon (per FR-V2.2-01). This preview stub reserves the IA slot only — the real screen lives in the shipped app. | TBD |

#### V2.3 — Oversight (`eqa.oversight.*`, `eqa.analyst.*`, `eqa.queue.*`, `eqa.labperf.*`)

| Key | English | FR |
|---|---|---|
| `eqa.oversight.followUpQueue` | Follow-Up Queue | TBD |
| `eqa.oversight.queueSubtitle` | This lab's questionable EQA scores awaiting corrective review. Includes questionable returns from external providers and flags from our own in-house schemes. Provider-side scoring of inbound participant submissions lives in EQA Program Management → Participant Follow-Up, not here. | TBD |
| `eqa.oversight.autoBanner` | Auto-NCE policy active. | TBD |
| `eqa.queue.triage` | Triage this item | TBD |
| `eqa.analyst.title` | Per-Analyst Competency Track | TBD |
| `eqa.analyst.subtitle` | ISO 15189 §6.2.3 personnel competency evidence, derived from PT samples assigned to named analysts in the trailing 12 months. Mapping is captured on the per-analyst column of standard result entry. | TBD |
| `eqa.labperf.openNceRegister` | Open NCE register filtered to EQA-sourced events | TBD |

#### V2.4 — In-house blinding (`eqa.blinding.*`, `eqa.inhouse.*`)

| Key | English | FR |
|---|---|---|
| `eqa.blinding.title` | In-House Blinding & Cross-Bench Schemes | TBD |
| `eqa.blinding.subtitle` | Define in-house PT panels with blinded target values. Labels and identities are visible to analysts; target values are encrypted at rest until unblinding. | TBD |
| `eqa.blinding.wizardTitle` | In-house blinding wizard | TBD |
| `eqa.blinding.wizardSub` | Define the cycle, the blinded sample set, analyst assignment, and seal target values. | TBD |
| `eqa.inhouse.prep.title` | Prep & aliquoting details | TBD |
| `eqa.inhouse.prep.subtitle` | Reuses V2.1 panel inventory columns (FR-V2.1-17) so in-house and provider-side prep look identical. Wizard will gate on aliquots ≥ (samples × analysts) AND homogeneity QC passed. | TBD |
| `eqa.inhouse.prep.sourceType` | Source type | TBD |
| `eqa.inhouse.prep.lotNumber` | Lot number | TBD |
| `eqa.inhouse.prep.aliquotsProduced` | Aliquots produced | TBD |
| `eqa.inhouse.prep.storageTemp` | Storage temp | TBD |
| `eqa.inhouse.prep.expiration` | Expiration date | TBD |
| `eqa.inhouse.prep.homogeneityQc` | Homogeneity QC | TBD |
| `eqa.inhouse.prep.qcNotes` | Homogeneity QC notes | TBD |
| `eqa.inhouse.labels.title` | Blind-code labels | TBD |
| `eqa.inhouse.labels.copy` | 12 labels · Avery 5160 (30/sheet, 2.625″ × 1″) | TBD |
| `eqa.inhouse.labels.security` | Labels show blind code + cycle ID + analyte short name only. Target values and acceptance ranges are never printed — a dropped label must not leak truth. | TBD |
| `eqa.inhouse.labels.print` | Print labels | TBD |
| `eqa.inhouse.labels.printBtn` | Print label sheet (PDF) | TBD |
| `eqa.inhouse.labels.tooltip` | Generate PDF label sheet (blind codes only — no target values) | TBD |

#### V2.5 — Provider-side (`eqa.provider.*`, `eqa.followup.*`)

| Key | English | FR |
|---|---|---|
| `eqa.provider.title` | EQA Schemes & Programs (Provider) | TBD |
| `eqa.provider.subtitle` | Schemes where this lab distributes panels to external participants. V2 MVP covers panel definition, distribution, scoring, and participant performance. ISO/IEC 17043 provider compliance is V3. | TBD |
| `eqa.provider.cycleActions` | Scheme cycle actions (V2 MVP) | TBD |
| `eqa.provider.prep.title` | Prep workbench | TBD |
| `eqa.provider.prep.sub` | Panel production + inventory tracking for cycles you run. Homogeneity QC must pass before a cycle can advance to ready-to-ship. Aliquot count must cover (participants × samples) plus the reserve pool for repeat-test reprovisioning. | TBD |
| `eqa.provider.prep.bannerTitle` | Wizard gate: | TBD |
| `eqa.provider.prep.banner` | Cycle state cannot advance past prep_in_progress until homogeneity_qc_passed = true AND aliquots_produced ≥ samples × participants + reserve. | TBD |
| `eqa.provider.ship.title` | Shipment workbench — EA HIV VL 2026-Q3 | TBD |
| `eqa.provider.ship.sub` | Plugs into the existing OpenELIS sample_shipment / tracking module — no parallel eqa_shipment table. Generates courier pack lists, tracking entries, and printable shipping labels; cold-chain validators land in V3.2. | TBD |
| `eqa.provider.ship.kpiPending` | Not yet shipped | TBD |
| `eqa.provider.ship.kpiInTransit` | In transit | TBD |
| `eqa.provider.ship.kpiDelivered` | Delivered | TBD |
| `eqa.provider.ship.kpiException` | Exceptions | TBD |
| `eqa.provider.ship.noteV3` | Structured cold-chain validators + panel rejection workflow land in V3.2 (see crosswalk §7.2.13). Cold-chain column here reflects participant-reported free-text receipt notes only. | TBD |
| `eqa.provider.receipt.title` | Receipt monitor — EA HIV VL 2026-Q3 | TBD |
| `eqa.provider.receipt.sub` | Tracks participant-lab panel receipt confirmations (V2.2 FR-V2.2-12). Auto-advances the provider cycle from delivered → submissions_open when all participants have confirmed. | TBD |
| `eqa.provider.receipt.confirmed` | Confirmed receipts | TBD |
| `eqa.provider.receipt.overdue` | Overdue | TBD |
| `eqa.provider.receipt.integrityAlerts` | Integrity alerts | TBD |
| `eqa.provider.receipt.noteFhir` | Receipts arrive via participant-side V2.2 receipt modal + best-effort FHIR ShipmentDelivery inbound. Inbound FHIR failures fall back to manual entry on this screen. | TBD |
| `eqa.followup.title` | Participant Follow-Up Register | TBD |
| `eqa.followup.subtitle` | Unacceptable and repeat-questionable participant scores, with six triage actions. Persistent failure rule: 2 of last 3 unacceptable auto-escalates to "Flagged for repeat." Provider-role unacceptables route here — they do not open NCEs in this lab. | TBD |
| `eqa.followup.triage` | Triage actions (six options) | TBD |
| `eqa.followup.shipRepeat` | Ship repeat panel | TBD |
| `eqa.followup.shipRepeat.tooltip` | Ship a repeat panel from the cycle's reserve aliquots (FR-V2.5-15). Only enabled once flagged for repeat and reserves are available. | TBD |

#### V3.1 — Analytics (`eqa.analytics.*`)

| Key | English | FR |
|---|---|---|
| `eqa.analytics.trends.title` | Performance Trends | TBD |
| `eqa.analytics.trends.subtitle` | Multi-cycle z-score trend per analyte. Trend classifications (stable / drift-up / drift-down / oscillating) are computed from the last 6 cycles; drill into an analyte to see the full history. | TBD |
| `eqa.analytics.signals.title` | Performance Signals | TBD |
| `eqa.analytics.signals.subtitle` | Auto-detected performance problems (trend drift, edge warnings, repeated unacceptable, coverage gaps). Thresholds are configurable — review and acknowledge signals; unacknowledged critical signals age onto the Follow-Up Queue as NCEs. | TBD |
| `eqa.analytics.thresholds.title` | Signal Thresholds | TBD |
| `eqa.analytics.thresholds.subtitle` | Per-signal threshold configuration. Defaults are sensible for most labs; tune if your cycle cadence or analyte mix warrants narrower or wider bands. Requires eqa.analytics.config. | TBD |
| `eqa.analytics.annual.title` | Annual EQA Summary | TBD |
| `eqa.analytics.annual.subtitle` | Accreditation-ready yearly rollup of cycles, pass rates, CAPAs, and coverage. Generates a date-stamped PDF for ISO 15189 assessor review. | TBD |

#### V3.2 — Cold chain (`eqa.coldchain.*`)

| Key | English | FR |
|---|---|---|
| `eqa.coldchain.monitor.title` | Cold-Chain Monitor | TBD |
| `eqa.coldchain.monitor.subtitle` | Cross-lab shipment temperature + disposition tracker. Red rows indicate rejected panels — a reprovisioning task (V2.5) is auto-created on rejection. | TBD |
| `eqa.coldchain.receipt.title` | Panel receipt — with cold-chain validation | TBD |
| `eqa.coldchain.receipt.subtitle` | Enhanced two-step receipt. Step 1: temperature + packaging checklist. Step 2: disposition. Cold-chain deviations do not block testing but attach to the scored report for interpretation (ISO 15189 §7.3.4). | TBD |

#### V3.3 — IQC correlation (`eqa.iqc_correlation.*`)

| Key | English | FR |
|---|---|---|
| `eqa.iqc_correlation.title` | NCE-2026-0184 — HIV-1 VL Unacceptable | TBD |
| `eqa.iqc_correlation.subtitle` | EQA-triggered NCE investigation. Same-run IQC context shown below helps distinguish an isolated EQA error from a system-wide QC problem. | TBD |

#### V3.4 — Patient impact (`eqa.impact.*`)

| Key | English | FR |
|---|---|---|
| `eqa.impact.title` | Patient Impact Look-Back | TBD |
| `eqa.impact.subtitle` | ISO 15189 §7.5 — patient samples reported on the same instrument/analyte between the last IQC-passing run before the EQA error and the first IQC-passing run after. Record a disposition per sample. | TBD |

#### V3.5 — ISO 17043 provider compliance (`eqa.iso17043.*`)

| Key | English | FR |
|---|---|---|
| `eqa.iso17043.homogeneity.title` | Homogeneity Testing | TBD |
| `eqa.iso17043.homogeneity.subtitle` | ISO 17043 §4.4.1.3 — per-analyte homogeneity across samples + replicates. ANOVA computes within-bottle vs between-bottle variance; pass when p ≥ 0.05 and between-bottle variance is within tolerance. | TBD |
| `eqa.iso17043.stability.title` | Stability Testing | TBD |
| `eqa.iso17043.stability.subtitle` | Per-analyte stability across time points vs. a reference value. Tolerance band is ±10% unless overridden per scheme. | TBD |
| `eqa.iso17043.certificates.title` | Cycle Certificates | TBD |
| `eqa.iso17043.certificates.subtitle` | Per-participant ISO 17043 Certificate of Participation. Auto-generated at cycle close; regenerations produce a new serial with a "supersedes" watermark. | TBD |

#### V3.6 — Provider-side NCE triggers (`eqa.provider_nce.*`)

| Key | English | FR |
|---|---|---|
| `eqa.provider_nce.title` | NCE Register | TBD |
| `eqa.provider_nce.subtitle` | Unified NCE register across participant-side and provider-side triggers. Use the Provider-side quick filter to isolate the provider's own operational failures. | TBD |
| `eqa.provider_nce.detectors.title` | Provider NCE Detectors | TBD |
| `eqa.provider_nce.detectors.subtitle` | Thresholds for auto-raised provider-side NCEs. Changes apply to the next nightly run; previously-scored cycles are not re-evaluated. | TBD |

#### V3.7 — Proxy entry (`eqa.proxy_entry.*`)

| Key | English | FR |
|---|---|---|
| `eqa.proxy_entry.title` | Proxy Entry — HIV VL 2026-04 | TBD |
| `eqa.proxy_entry.subtitle` | Enter results on behalf of participating labs that submit via paper, phone, SMS, or email. Results attribute to the participating lab (not the provider), with a visible source tag on all downstream views. | TBD |
| `eqa.proxy_entry.bulk.title` | Bulk Proxy Import | TBD |
| `eqa.proxy_entry.bulk.subtitle` | Upload a CSV to batch-enter proxy results. Columns: participant_org_id, analyte_id, result_value, data_source, notes. Row-level validation runs before commit. | TBD |

#### V3.8 — ePT FHIR interop (`eqa.ept_interop.*`)

| Key | English | FR |
|---|---|---|
| `eqa.ept_interop.title` | Provider Endpoint (FHIR) | TBD |
| `eqa.ept_interop.subtitle` | Configure the FHIR submission endpoint for this scheme. APHL ePT / InteLIS deployments route through the adapter module; credentials are stored in the secret store and never returned by the read API. | TBD |

#### Error keys (`error.eqa.*`)

Server-returned; the client surfaces these via `t()` with a generic English fallback. Specific values:

| Key | English | FR |
|---|---|---|
| `error.eqa.panel.aliquotsInvariant` | Panel aliquot count cannot be less than (reserved + shipped). | TBD |
| `error.eqa.panel.vendorRequiredFields` | Vendor-sourced panels require lot number, storage temp, and expiration date. | TBD |
| `error.eqa.cycle.invalidTransition` | This cycle cannot move to the requested state. | TBD |
| `error.eqa.cycle.homogeneityQcRequired` | Homogeneity QC must pass before this cycle can advance to ready-to-ship. | TBD |
| `error.eqa.cycle.aliquotsInsufficient` | Produced aliquots do not yet cover (participants × samples) + reserves. | TBD |
| `error.eqa.competencyEvent.manualPostForbidden` | Competency events are written by the service layer only. | TBD |
| `error.eqa.stateTransition.immutable` | State transition audit records cannot be modified. | TBD |
| `error.eqa.proxyEntry.permissionDenied` | Proxy entry requires the `eqa.provider.proxy_entry` permission. | TBD |
| `error.eqa.impact.worklistFrozen` | Once an impact worklist is frozen at T0, regenerate a new worklist rather than editing this one. | TBD |
| `error.eqa.certificate.regenerationRequiresReason` | Certificate regeneration requires a short justification (captured on the supersedes watermark). | TBD |

### Coverage verification (addresses F-08 from `eqa-v2-critique.md`)

- **Method.** `t('[key]', '[fallback]')` occurrences in `eqa-v2-preview.html` were inventoried and grouped by namespace; every key is represented in this appendix. Keys not yet used in the preview but declared in FR Localization statements (e.g. `eqa.shipment.*`, `eqa.prep.*` family members beyond those surfaced in the mockup) are implicit — implementers expand them when porting the FR to code.
- **Gap note.** `eqa.shipment.*` (FR-V2.5-11) is declared but not yet exercised in the preview — the V2.5 Shipment workbench uses `eqa.provider.ship.*` instead. Accept either namespace; prefer `eqa.provider.ship.*` going forward since it keeps the provider-role scope clear. Mark `eqa.shipment.*` as deprecated-before-ship.
- **French translation.** All `FR` cells are marked `TBD`. Ahead of any French-country deployment (next candidates: Madagascar, DRC, Côte d'Ivoire), a localization sprint fills `fr` for every key above. CI-enforced keys means a French deployment cannot ship with gaps.

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
