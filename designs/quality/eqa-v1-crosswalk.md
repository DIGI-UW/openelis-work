# EQA V1 ↔ Compilation Crosswalk

**Purpose:** Reconcile the EQA workflow compilation (`eqa-workflow-compilation.md`) against the actual V1 source-of-truth artifacts so the V2 amendment story is scoped against real V1 capability, not guesses.

**Sources reviewed:**
- `upload/eqa-requirements.md` — EQA Module FRS v1.0, dated 2025-11-14, targets OpenELIS Global 3.2.3.0 (~660 lines)
- `upload/eqa-enrollment-addendum.md` — FRS Addendum v3.0, dated 2026-02-13 (~600 lines)
- `upload/eqa-enrollment.jsx` — Mockup implementation (React, lucide-react, hand-styled — **not Carbon**)

**Headline correction to my earlier compilation:** V1 is **substantially more developed** than my initial "probably thin" assumption. The compilation doc's many 🔴 Missing flags are wrong in ~30% of cases. The real V2 amendment scope is smaller and more targeted than I first said.

---

## 1. What V1 already covers (🔴 → ✅ corrections to the compilation)

These items I flagged as Missing are actually present in V1. My V2 amendment tiers need to be rebased accordingly.

| Compilation step | V1 source | Correction |
|---|---|---|
| §1.4 Scheme record with participant ID, provider, submission channel | DM-002 + addendum DM-008 (`eqa_lab_program_enrollment`) | ✅ Present (self-enrollment side) |
| §1.5 Scheme ↔ Test linkage | Addendum DM-010 (`eqa_lab_enrollment_test_map`) with nullable test/panel FKs | ✅ Present |
| §2.2 Deadline-driven alerts | FR-009 + FR-010 + BR-008 (72h/24h/4h tiers) + DM-005 `alert` table | ✅ Present |
| §3.3 EQA specimen flag + routing | DM-001 (`is_eqa_sample`, `eqa_program_id`, etc.) + BR-001 (N/A PHI, prevents edit) | ✅ Present |
| §5.1–5.4 Testing execution via standard path | FR-001 explicit: EQA uses normal sample entry tabs | ✅ Present |
| §7.LAB.1 Submission channels | FR-006: FHIR API, CSV/Excel upload, manual entry, OpenELIS-to-OpenELIS | ✅ Present (more developed than my compilation assumed) |
| §8.2 Per-analyte score capture, z-score, pass/fail | DM-004 (`z_score`, `performance_status`) + BR-006 (Z thresholds 2.0 / 3.0) | ✅ Present |
| §B.PROVIDER (running a provider-side scheme) | FR-004, FR-005, DM-003 (`eqa_distribution`), FR-008 (program management) + addendum §3.3 (full EQA Management tree) | ✅ Present — not deferred to V3 after all |
| §B.OVERSIGHT dashboard | FR-009 Alerts Dashboard + addendum US-016 + summary tiles | ✅ Present (as Alerts, not a dedicated EQA oversight screen) |
| §5.3 Permissions model | BR-010 role matrix (tech / coordinator / supervisor / admin / alerts permission) | ✅ Present |
| §5.6 Audit trail | BR-011 ("audit trails required for all EQA-related actions") | ✅ Present as requirement (implementation detail open) |
| §1.2 Provider directory | Addendum BR-012: provider is a free-text attribute with typeahead, not a directory entity | ✅ Present, but different modeling choice than I proposed — see §3 below |

**Net effect on amendment scope:** Tier 1 of the V2 gap list shrinks significantly. Most of the data model is already in V1.

---

## 2. What V1 still does not cover (real V2 amendment scope)

These are the genuine gaps — compilation flags that remain 🔴 after reading V1.

### 2.1 Structural gaps

**G1. No Cycle/Round entity.**
V1 has Program, Distribution, and Order, but no formal Cycle/Round record with its own state machine. The results-page spec shows "EQA Round 4" as UI text, implying the concept exists, but there is no backing entity. Without it:
- Participant-side orders cannot group into a round.
- There is no single state machine for "Planned → Panel Received → Testing → Reviewed → Submitted → Scored → Closed."
- Multi-cycle trend analysis (compilation §9.1–9.2) is impossible without grouping.
- Priority: **Tier 1** — this is the single most important V2 addition.

**G2. Participant-side results have no link to Distribution.**
`eqa_result` (DM-004) has an FK to `eqa_distribution_id`, but a lab that only participates in an external WHO AFRO program has no Distribution record — that Distribution lives at WHO AFRO. So participant results against external programs have no place to live in V1's schema. The addendum introduces participant-side orders (FR-010) but does not reconcile how those orders' results become `eqa_result` rows.
- Priority: **Tier 1** — blocks participant-side scoring.

**G3. Pre-submission cycle review screen.**
Compilation §6.1–6.3 describes a bundled review of all cycle results before submission, with QA Officer sign-off. V1 FRS does not specify this. BR-007 mentions "late submissions require supervisor approval" but there is no pre-release review workflow.
- Priority: **Tier 1 if we care about accreditation evidence; Tier 2 otherwise.**

### 2.2 Workflow gaps

**G4. Per-analyst (A.IND) competency track is entirely absent.**
V1 treats every EQA sample as lab-level. There is no named-analyst assignment, no blind aliquot distribution, no per-analyst scoring, no competency record integration.
- ISO 15189 §6.2.3 requires personnel competency, typically satisfied via per-analyst PT.
- Priority: **Tier 3** (separate feature; logical after Tier 1+2 lands).

**G5. Panel receipt, cold-chain, integrity check.**
Compilation §3.1 describes a receipt event with temperature check and integrity-check fields. V1 has no receipt event — a sample just gets accessioned.
- Priority: **Tier 2**.

**G6. CAPA for unacceptable results.**
V1 captures `performance_status` (Acceptable/Questionable/Unacceptable) but does not specify corrective action, root cause, verification, or closeout. ISO 15189 §7.7.3 requires corrective action on unacceptable results.
- Priority: **Tier 2** — and the CAPA module should be shared with QC Dashboard.

**G7. IQC ↔ EQA correlation.**
Compilation §5.3 and §10.1 emphasize that EQA investigation must pull the same-run IQC. V1 does not specify this linkage.
- Priority: **Tier 2** (depends on G6 CAPA module).

**G8. Patient impact look-back.**
Compilation §10.5 requires a worklist of patient samples potentially compromised by an unacceptable EQA cycle. V1 is silent. This is a safety-critical gap under ISO 15189 §7.5.
- Priority: **Tier 2** — ship together with G6 CAPA.

**G9. In-house / self-administered scheme (compilation Workflow B.INHOUSE).**
V1 partly supports — a lab can create a program in EQA Management and enroll participants — but BR-004 mandates **minimum 2 participating organizations** for a distribution. This actively blocks using the distribution workflow for single-lab in-house EQA with sealed target values and homogeneity testing.
- Priority: **Tier 3** or a separate "in-house" entity that bypasses BR-004.

**G10. Homogeneity and stability testing of provider-side panels.**
Required by ISO/IEC 17043 for PT providers. V1 EQA Management has no panel-production record.
- Priority: **Tier 3** — only when a deployment seeks ISO 17043 accreditation as a provider.

### 2.3 Reporting gaps

**G11. Multi-cycle trend analysis per analyte, method, analyzer.**
FR-007 "Performance Reporting" is scoped to "individual participant performance analysis" — single cycle, no multi-cycle trending visualization. Depends on G1 (Cycle entity).
- Priority: **Tier 2**.

**G12. Automated performance signals.**
No equivalent to compilation §9.3 (≥2 consecutive unacceptable, drift over N cycles).
- Priority: **Tier 2**.

**G13. Annual summary & accreditation evidence bundle.**
V1 reports are per-distribution/per-participant. Compilation §11.2–11.4 needs an annual roll-up and an exportable ISO 15189 §7.7 audit package.
- Priority: **Tier 2**.

**G14. Scheme coverage matrix.**
Compilation §1.1: view of "what analytes have EQA coverage, what's a gap". V1 has no equivalent — you can list programs, but you cannot easily answer "which measurand in our test catalog has no EQA?"
- Priority: **Tier 2**.

### 2.4 Scope gaps

**G15. Inter-lab comparison / split-sample scheme type (matrix type 3).**
V1 does not formally model split-sample or peer re-testing as a distinct scheme type. Can piggy-back on distribution but lacks split-sample specifics (partial-sample tracking, lab-to-lab comparison reports).
- Priority: **Tier 3**.

---

## 3. V1 risks / contradictions to resolve in V2

**R1. Participant-side vs. provider-side data model is incompletely wired.**
The addendum introduces clean separation between `eqa_lab_program_enrollment` (self-enrollment, participant-side) and `eqa_program_enrollment` (participant-lab enrollment, provider-side), which is good. But `eqa_result` only has `eqa_distribution_id` FK — it doesn't accept a participant-side path. **V2 must decide:** either give `eqa_result` a nullable `eqa_lab_program_enrollment_id` + `cycle_id`, or add a separate `eqa_participant_result` entity.

**R2. BR-004 "minimum 2 participants" blocks in-house EQA.**
If a lab wants to run an in-house scheme for an analyte with no external PT available (a legitimate ISO 15189 §7.7.2 alternative), V1 distribution workflow rejects it. **V2 must relax this rule for in-house schemes or introduce a distinct entity.**

**R3. Provider is modeled as a text attribute, not an entity (addendum BR-012).**
This is a pragmatic choice — fewer admin tables. But it means:
- No way to attach provider-level metadata (accreditation status, contact, country).
- Typeahead relies on string matching; typos produce duplicate "providers" (e.g., "WHO AFRO" vs. "WHO-AFRO").
- Cannot report "all programs from provider X" without string normalization.
- **V2 decision:** keep as text for now, OR promote to `eqa_provider` entity when provider count justifies it. Not urgent.

**R4. Mockup (`eqa-enrollment.jsx`) is not Carbon.**
V1 FRS §6.1 mandates Carbon Design System. The uploaded mockup uses `lucide-react` + hand-rolled inline styles with a custom teal/orange palette. This is a Carbon-fidelity violation per the design constitution's Principle 2. **V2 build must rebuild in `@carbon/react`** — or if the mockup is just exploratory, clarify that the spec's Carbon requirement still holds for implementation.

**R5. "Internal QA - No Results Release" test-catalog flag (from `test-catalog-requirements-v2.1.md` line 43) overlaps with `is_eqa_sample` on Order.**
Two mechanisms prevent EQA results bleeding into patient reports: a per-test flag at catalog level, and a per-sample flag at order level. **V2 should clarify which is authoritative** and whether both are needed (probably yes: the catalog flag is for tests that are always QA/PT by nature, the order flag is for tests that are sometimes patient / sometimes EQA).

**R6. Alerts entity is EQA-shaped but aspires to be lab-wide.**
Addendum BR-017 says Alerts is a standalone, lab-wide module aggregating EQA, STAT, critical results, QC failures, and expiries. DM-005 `alert` table supports this via `alert_type` enum. **V2 design for the QA Dashboard should treat Alerts as an input, not re-implement alerting.**

---

## 4. Where V1 **overreaches** what my compilation credited

These are V1 features that my compilation underweighted or assumed were V2 work. Credit where due:

- **Provider attribution + typeahead (addendum BR-012).** My compilation proposed a Scheme entity with a provider FK. V1's "text with typeahead" is simpler and probably right for now.
- **Two-lane IA (EQA Tests / EQA Management).** Cleanly separates participant and provider workflows in the sidebar. My compilation did not propose an IA; V1's is good. **V2 refines this to a 3-lane IA** (see §7.2.9) — the V1 "EQA Management" lane mixed participant-side oversight with provider-side program management, which confused the mental model.
- **Self-enrollment with test/panel mapping driving Order Entry pre-population.** This is clever — it means the Order Entry clerk doesn't guess which tests belong to which PT program. The addendum's DM-009 and DM-010 tables plus FR-013.5 wire this end-to-end.
- **Alerts as a first-class standalone module with badge count.** Better than my compilation's "wire into existing notifications."
- **FHIR-based result submission (FR-006) already in scope.** I marked this as "stretch."

---

## 5. Revised scope — V2 MVP and V3 Enhancements

The original compilation had 4 tiers. Rebased against what V1 actually covers, the decisions resolved in §7 below, and Casey's direction to spec V2 as a complete lifecycle MVP with V3 as enhancements on top.

### V2 MVP (one epic, five stories) — complete EQA lifecycle at baseline

V2 ships a lab that can participate in external PT, run in-house schemes, and run a provider-side program end-to-end. Every one of the 29 phases from the compilation matrix is covered at least minimally.

**V2.1 Data Model Foundation** (Cycle, Round, polymorphic scheme, participant result, eligible-analyst mapping, panel + blinded sample, participant follow-up).
Covers gaps G1, G2, G9 and risks R1, R2. Adds `eqa_scheme_analyst`, `eqa_scheme.requires_cycle_review`, `eqa_panel`, `eqa_panel_sample`, `eqa_participant_followup`.

**V2.2 Participant Experience** (cycle progress dashboard linked to standard result entry, auto-submit via FHIR on validation-complete, manual-submit fallback, score intake surfacing).
Covers gap G3 (as an optional review step gated by the `requires_cycle_review` flag). Uses validation as the compliance gate — no separate EQA sign-off required. Carbon port of V1 enrollment UI (Q3).

**V2.3 Oversight: Per-Analyst + Lab Performance + NCE Integration**
(NCE trigger tiered by severity, scoped to participant-role rows only; per-analyst capture as optional column on standard result entry; eligible-analyst mapping UI; Lab Performance dashboard with deep-link to NCE register; Analyst Competency view; Follow-Up Queue for this lab's questionable and in-house-flagged scores, with Source column).
Covers gaps G4, G6 (as NCE integration), plus new Lab Performance rollup that was previously deferred.

**V2.4 In-House Blinding Workflow** (new)
Supervisor wizard to create a blinded panel with sealed target values and blind sample codes; distribute as normal OpenELIS orders flagged EQA with the in-house scheme; unblind at deadline; auto-score vs. sealed targets; unacceptable in-house results route to V2.3 Follow-Up Queue.
Converts the V2.1 `scheme_type = 'in_house'` container from a database placeholder into a usable workflow.

**V2.5 Provider-Side Program + Participant Follow-Up** (new)
Panel definition (analytes, sample codes, target values, acceptance ranges — MVP level, not ISO 17043 homogeneity); distribution tracking; score calculation and return to participants; participant performance dashboard per scheme; participant follow-up register (notify, track response, flag for repeat, escalate for persistent non-performance); provider-side performance trending.
Closes the provider-side workflow loop at MVP level.

### V3 Enhancements (second epic, six stories) — on top of MVP

**V3.1 Multi-Cycle Analytics** (G11, G12, G13, G14) — participant-side trending charts per analyte/method/analyzer, automated performance signals (2-consecutive, drift), coverage-gap matrix, annual summary + ISO 15189 §7.7 audit-evidence export bundle.

**V3.2 Panel Receipt + Cold-Chain** (G5) — receipt event with temperature / integrity check fields; rejection + replacement workflow.

**V3.3 IQC ↔ EQA Correlation** (G7) — when an NCE is created with `trigger_source = 'eqa_unacceptable'`, surface the same-run IQC (Westgard) state on the NCE investigation page.

**V3.4 Patient Impact Look-Back** (G8) — worklist of patient samples run in the out-of-control window; attaches to NCE investigation page; supports ISO 15189 §7.5 compliance.

**V3.5 ISO 17043 Provider Compliance** (G10) — panel homogeneity testing, stability testing, full panel-production traceability, provider-side audit evidence bundle for ISO/IEC 17043 accreditation.

**V3.6 Provider-Side Internal NCE Triggers** — NCE auto-creation for provider's own operational failures: panel defect (homogeneity fail), scoring error, deadline miss, and cluster-failure detection (many participants fail same sample/analyte → suspect bad panel, not bad labs).

### Deferred beyond V3

- **Promote Provider from text to entity** (R3) when volume justifies (probably V4 or never).
- **Split-sample / inter-lab comparison specialized reports** (G15) — polish on existing `scheme_type = 'inter_lab_split'` support.

---

## 6. Integration with the QA Dashboard consolidation

The user's original ask included "consolidate certain requested and designed features into a Quality Assurance dashboard." V1's **Alerts module (addendum §3.4)** plus the **NCE register (FRS v3.1)** are the existing best candidates to evolve into that dashboard.

Recommended framing:

- **Alerts today (V1)** — event list, filter, acknowledge.
- **NCE register today** — non-conformity events from Westgard, EQA (post-V2), and 9 other trigger sources, with `nce_capa` + `nce_effectiveness_review` workflow.
- **QA Dashboard tomorrow (post-V2 Tier 2)** — Alerts + NCE roll-ups + widgets: *Upcoming EQA cycles*, *Open NCE-CAPAs by age*, *IQC out-of-control this week*, *Analyst competency expiring*, *Recent unacceptable EQA scores*, *Scheme coverage gaps*.
- **No new CAPA plumbing is needed.** The NCE module's existing `nce_capa` output feeds the QA Dashboard's CAPA widget regardless of whether the NCE originated from EQA (Tier 2 §6 integration), Westgard (trigger #10), or any other trigger. EQA's V2 contribution is the *trigger hook*, not new CAPA tables.

---

## 7. Resolved decisions

### 7.1 Original five open questions

| Q | Decision | Impact on V2 scope |
|---|---|---|
| Q1 — Participant-result data path (R1) | **B — Separate `eqa_participant_result` entity** with draft → reviewed → submitted → scored lifecycle, linked to `eqa_result` once provider returns score | V2.1 data model |
| Q2 — In-house scheme approach (R2, G9) | **C — Polymorphic `eqa_scheme` with `scheme_type` discriminator** (`international_pt \| regional_pt \| inter_lab_split \| in_house`); BR-004 becomes conditional | V2.1 data model |
| Q3 — Mockup authority | **B — Implementation reference, port to Carbon**; `eqa-enrollment.jsx` preserves IA/field-list/flow, engineering rebuilds in `@carbon/react` for V2 | Applies to every V2 story; historical mockup stays as design reference |
| Q4 — CAPA approach | **D — Tiered EQA → NCE integration** (not new CAPA tables). NCE module already provides `nce_capa` + `nce_effectiveness_review`; EQA becomes a trigger source | V2.3 NCE hook |
| Q5 — V2 scope | **B + Epic wrapper** — stories under one parent epic, layered by data model maturity | See §8 below |

### 7.2 Subsequent refinements (rounds 2–5)

| Refinement | Reason | Impact |
|---|---|---|
| **Standard OpenELIS pipeline owns result entry + validation.** EQA samples flow through normal Order → Sample → Analysis → Result with the `is_eqa_sample` flag. V2.2 Cycle pages are *progress dashboards* that link out to standard result entry, not parallel entry surfaces. | Validation already serves as the compliance gate for patient results; requiring a parallel EQA entry UI would duplicate plumbing and treat EQA as a second-class workflow. | V2.2 FR-V2.2-03 rewritten |
| **No separate pre-submission sign-off gate.** Once all cycle results are validated, the cycle auto-advances to `ready_to_submit` and FHIR submission attempts automatically. Manual-submit fallback when FHIR unavailable or fails. A per-scheme `requires_cycle_review` flag (default **off**) can reinstate the review gate for labs with local accreditation policy demands. | Validation audit trail IS the ISO 15189 §7.7.3 evidence. A second gate treats EQA as more important than patient care, which is backwards. | V2.2 FR-V2.2-04/05/06/07 rewritten |
| **Per-analyst capture via optional column on standard result entry.** When sample is EQA and scheme has `per_analyst = true`, the result entry grid gains an "Analyst" column. Selector pulls from `eqa_scheme_analyst` mapping if populated, else from the full user list. Defaults to current user if eligible. No external-to-local user mapping needed — the lab picks from its own OpenELIS user list. | External provider doesn't know local user names, but the lab does. Capture at result entry by whoever runs the test. | V2.3 FR-V2.3-04 rewritten + new FR for eligible-analyst mapping UI on scheme config |
| **NCE trigger scoped to participant-role rows only.** FR-V2.3-01 evaluates only on `eqa_participant_result` rows where the lab enrollment belongs to the current OpenELIS instance. Provider-side rows (where the participating lab is a different lab) do NOT fire a local NCE. | A participant's underperformance is their non-conformity, not the provider's. Provider-side equivalent is "participant follow-up" (V2.5), not an NCE in the provider's register. Provider-side internal NCEs (panel defect, scoring error) are V3.6. | V2.3 FR-V2.3-01 clarified |
| **Lab Performance dashboard pulled into V2.3.** Rollup of `eqa_participant_result` across all cycles for the lab, with coverage-gap indicator. Companion to the Analyst Competency view. | Aggregates to "how is our lab doing on HIV VL across the past 8 WHO AFRO cycles?" at MVP level. Full multi-cycle trending + annual summary stays in V3.1. | V2.3 new FR |
| **In-House Blinding Workflow as V2.4.** Supervisor wizard to create a blinded panel with sealed target values and blind codes; distribute as OpenELIS orders flagged EQA; unblind at deadline; auto-score vs. sealed targets. | Without this, `scheme_type = 'in_house'` from V2.1 is a schema container with no UI to use it. MVP of in-house PT requires it. | New V2.4 story |
| **Provider-Side Program + Participant Follow-Up as V2.5.** Panel definition (analytes, codes, targets, ranges — MVP level, not ISO 17043), distribution tracking, score calculation, participant performance dashboard, follow-up register with notify/track/escalate. | Provider-side workflow needs to close the loop at MVP even if ISO 17043 homogeneity + stability stay in V3.5. | New V2.5 story |
| **One `eqa_panel` table for both in-house and provider use.** Same shape (panel with samples with target values); the attached scheme's `scheme_type` determines which workflow applies. | Simpler schema, shared reporting, no duplication. | V2.1 data model addition |
| **7.2.9 — 3-lane IA replaces V1's 2-lane IA.** V1 had two sidebar lanes: "EQA Tests" (participant daily) and "EQA Management" (everything else). V2 splits into three: **My EQA** (participant workflow — My Enrollments, My Cycles), **EQA Oversight** (participant-side QA officer view — Lab Performance with Coverage/Recent Cycles submenus, Follow-Up Queue, Analyst Competency), and **EQA Program Management** (provider-role only — Schemes & Programs, In-House Blinding, Participant Follow-Up). | Participant-side QA oversight and provider-side program management were mixed under one "EQA Management" header in V1. Review Queue showing this lab's own open NCEs under "Management" reads as if those NCEs belong to the programs we run for others, which is incorrect and confusing. The provider lane is also visibility-gated (only labs with an `eqa.provider` role need to see it). | Sidebar IA across all V2 stories; each story's screens live in their canonical lane. Submenus replace in-page Carbon Tabs throughout (OpenELIS sidenav convention). |
| **7.2.10 — EQA-triggered NCEs not duplicated under Lab Performance; Summary KPIs merged into Coverage.** The earlier Lab Performance IA had an "EQA-Triggered NCEs" submenu that re-rendered NCEs from the main register with an EQA filter (removed — the NCE register is the single source of truth) and a separate "Summary KPIs" submenu (also removed — merged into the top of the Coverage screen). Lab Performance now has **two** submenus (Coverage → Recent Cycles). The Coverage screen is a single accreditation-snapshot view: a KPI tile row at the top (Acceptance rate, On-time submission, Open EQA-triggered NCEs, Schemes without §7.7.2 alternatives) followed by the per-analyte coverage matrix. The "Open EQA-triggered NCEs" tile deep-links into the NCE register with `?source=eqa`. | The NCE register is the single source of truth for NCE state — a second list fork risks drift and doubles the maintenance surface. A KPI tile with a link preserves the at-a-glance read without duplicating data. Merging KPIs into Coverage cuts the sidebar submenu from three items to two and puts the 10-second lab-wide read immediately above the per-analyte drill-down on the same page (one fewer click, one fewer sidebar item). | V2.3 FR-V2.3-07 rewritten to 2-submenu layout with KPI row at top of Coverage; "EQA-Triggered NCEs" and standalone "Summary KPIs" screens removed. |
| **7.2.11 — Review Queue renamed Follow-Up Queue; Source column added.** The screen scope is "this lab's questionable scores needing corrective review" — the **union** of external-provider-returned and in-house-generated items. A new Source column (`External provider` / `In-house` / `Inter-lab split`, derived from `eqa_scheme.scheme_type`) makes the origin obvious. Provider-side scoring of inbound submissions from participant labs is explicitly NOT in this queue — that workflow lives under EQA Program Management → Participant Follow-Up (V2.5). | "Review Queue" was ambiguous: it could read as "queue of things for me to review from external labs participating in my program" (provider-scope) vs "queue of my questionable scores I need to follow up on" (participant-scope). Renaming clarifies scope; the Source column lets QA officers tell external-returned from in-house-flagged items at a glance. | V2.3 FR-V2.3-02 rewritten with scope + Source column; AC-V2.3 / AC-V2.4-09 / V3 references renamed. |
| **7.2.12 — V2.5 expanded to cover prep + ship + receipt + reprovisioning.** Original V2.5 covered panel definition → distribute → score → follow up, which left the physical-operations half of running a PT program (aliquoting, homogeneity QC, courier + tracking + cold chain, receipt confirmation, repeat-test reprovisioning) on paper and Excel. V2.5 now expands to include: explicit provider-side cycle state machine (`planned → prep_in_progress → ready_to_ship → shipped → delivered → submissions_open → submissions_closed → scoring → scored → closed`, see V2.1 FR-V2.1-18); panel source + inventory fields (`source_type`, `lot_number`, `aliquots_produced`/`_reserved`/`_shipped`, `storage_temp`, `expiration_date`, `homogeneity_qc_passed`, see FR-V2.1-17); prep workbench (FR-V2.5-12) with inventory progress + homogeneity QC gate; shipment workbench (FR-V2.5-13) plugging into the **existing OpenELIS sample shipment / tracking module** (NOT a parallel eqa_shipment table — see FR-V2.1-19); receipt confirmation monitoring (FR-V2.5-14); repeat-test reprovisioning from reserve aliquots (FR-V2.5-15); cycle state banner + timeline (FR-V2.5-16). Story points bumped 13 → 21. Homogeneity QC is a supervisor checkbox + notes at MVP; full ISO 17043 homogeneity + stability stays in V3.5. | Without prep + ship, the "run a PT program end-to-end in OpenELIS" promise is only half-true — provider labs still need Excel for logistics. OpenELIS already has a sample shipment / tracking module (currently used for referrals out — see `env-vector-workflows.md` S-14 inter-lab sample transfer), so EQA shipments should plug into it rather than grow a parallel table. Reprovisioning from reserve is the operational reality: when a participant's shipment is damaged or they need a repeat after an unacceptable result, the provider does not re-prep from scratch — they pull from a pre-produced reserve pool. Explicit multi-state lifecycle keeps "where is this cycle" answerable at a glance and auditable for accreditors. | V2.5 FR-V2.5-02 Step 5 now transitions to `prep_in_progress` (not `distributed`); FR-V2.5-12..16 added; V2.1 FR-V2.1-17, -18, -19 added (panel inventory fields + provider cycle state machine + shipment record plug point); AC-V2.5-11..17 added; new R-E04 risk re: shipment module integration; AC-E05 rewritten to require end-to-end prep+ship+reprovision. |
| **7.2.13 — Minimal panel-receipt event pulled into V2.2 MVP; V3.2 narrowed to structured cold-chain + rejection.** The V2.5 shipment workbench (FR-V2.5-14) auto-advances the provider cycle from `delivered → submissions_open` when all participating labs confirm receipt. V2.5 therefore depends on a participant-side receipt event to satisfy that contract — but the earlier plan parked the entire receipt-event story in V3.2, leaving the V2.5 `delivered` state unreachable in MVP. Fix: pull a **minimal** receipt event into V2.2 (FR-V2.2-12 + data-model support FR-V2.1-20: `received_date`, `received_by`, optional `received_temp_c` with no range validation, `integrity_ok` checkbox + conditional notes, optional free-text notes; transactionally updates matching `sample_shipment.actual_delivery_date` + `delivery_status`; transitions cycle `planned → panel_received`; emits best-effort FHIR ShipmentDelivery outbound). V3.2 narrows to **structured** cold-chain only: temperature range validators against `storage_temp` tolerance bands, structured packaging-condition checklist replacing free-text integrity notes, rejection workflow with new `panel_rejected` state + replacement flow tied to V2.5 reprovisioning, and cross-module cold-chain deviation correlation. | A V3-parked dependency that blocks a V2 MVP state is a scope bug — the minimum receipt affordance has to ride along with the thing that needs it. Keeping the V2.2 version minimal (no validators, no rejection state, no range logic) bounds the added scope to one modal + one table + one state transition, while preserving V3.2 as the structured-compliance layer it was meant to be. | V2.2 FR-V2.2-12 + FR-V2.2-13 added; V2.1 FR-V2.1-20 added; AC-V2.2-13 + AC-V2.2-14 added; V2.2 Out-of-scope line amended; V3.2 section rewritten to "Cold-Chain Validators + Rejection Workflow" with receipt event explicitly marked out of V3.2 scope; gap table G5 and phase table P2 updated to split-coverage (V2.2 minimal / V3.2 structured). |
| **7.2.14 — V2.4 expanded: prep tracker + label printing + docs-only handoff fixes; in-cycle supervisor monitor deferred.** Audit of V2.4 after the V2.5 prep/ship expansion surfaced four gaps (A–D). Decision: add A + B + D to V2.4 MVP; defer C to V3.X. **A (Prep/aliquoting tracker):** FR-V2.4-02 now includes prep-details section (source_type, lot_number, aliquots_produced, storage_temp, expiration_date, homogeneity_qc_passed checkbox + notes) reusing V2.1 FR-V2.1-17 columns so in-house panel prep looks identical to the V2.5 provider-side workbench; wizard + service layer gate on `aliquots_produced` ≥ sample × analyst count AND `homogeneity_qc_passed = true`. **B (Blind-code label printing):** new FR-V2.4-13 generates a PDF label sheet (default Avery 5160 equivalent) reusing the V2.5 FR-V2.5-13 PDF pipeline; labels show blind code + cycle ID + analyte short name only — **explicitly never target value or acceptance range** (accidentally-dropped label must not leak truth). Idempotent byte-identical regeneration. **D (docs-only):** FR-V2.4-14 ensures missed-deadline results flow into the V2.3 Analyst Competency view (`event_type = 'in_house_missed_deadline'`) so per-analyst competency is consolidated; FR-V2.4-15 documents the invariant that blinded panel Orders appear in Workplan without filtering (they're already standard Orders — this is a clarification guarding against a future maintainer adding an EQA-exclusion filter). **C skipped (in-cycle supervisor monitor):** an entry-progress view during the blind window invites target-reveal risk — a supervisor with visibility into "who has entered which samples" is one click from target values they authored. Deferred to V3.X pending a dedicated no-target-reveal threat-model pass. Story points 8 → 11 (A: +1, B: +2, D: +0). | Without A, V2.4 ships with an inconsistency — V2.5 providers track aliquots/lot/storage but V2.4 supervisors running in-house PT for their own analysts don't; identical schema eliminates the delta. Without B, blinding integrity collapses to handwritten lookup sheets at the bench. D items are free clarifications that close audit questions. C is a security/integrity concern, not a "not worth it" skip — explicit park with re-open trigger (threat-model pass) is better than silent omission. | V2.4 header story-points bumped to 11; V2.4 summary + user stories + design brief scope-boundary updated; FR-V2.4-02 expanded with prep-details section; FR-V2.4-04 Step 4 surfaces Print-label-sheet button; FR-V2.4-12 i18n key families added; new FR-V2.4-13, FR-V2.4-14, FR-V2.4-15 added; new AC-V2.4-12..17 added; Non-functional section gains label-confidentiality + PDF perf + prep-invariant server-side enforcement; DoD extended; Out-of-scope documents C-deferral rationale. |
| **7.2.15 — V2.1 + V2.3 audit outcomes: state-machine audit table, analyst competency event table, derived participant state, categorical-null-Z NCE path, competency-event writer fan-out, rollup rules authored in-spec.** Audit of V2.1 + V2.3 after the V2.5 / V2.2 / V2.4 expansion surfaced 12 gaps (A–L); A–J applied to V2.1 + V2.3, K folded into V2.3 design brief as a 3-character fix (no in-page Tabs), L deferred to coherence pass. **V2.1 additions:** (A) `eqa_analyst_competency_event` table (FR-V2.1-22) defining a 9-value `event_type` enum — `external_missed_deadline`, `in_house_missed_deadline`, `unacceptable_score`, `questionable_score`, `escalated_to_nce`, `dismissed_equipment`, `dismissed_transcription`, `dismissed_acceptable_on_review`, `dismissed_other` — written by service layer only (direct user POST → 403); gives V2.3 FR-V2.3-06 a stable data source that covers absence-of-result events (missed deadlines) which `eqa_participant_result` alone cannot express. (B) `eqa_cycle_state_transition` immutable audit table (FR-V2.1-21) with `state_machine` + `trigger_type` + `trigger_event` enums and nullable-but-required-for-manual `reason`; read-only API; 405 on PUT/DELETE. (C) Participant-side state derivation table — per-lab participant state is **derived** (not stored) from `eqa_panel_receipt` + `eqa_participant_result.submission_status` via 7 rules; exposed as computed `participant_state` field on a read-only endpoint; avoids a second source of truth that would drift from `eqa_participant_result`. (E) API endpoint surface expanded to cover transitions read, participant-state compute, panel-receipt, sample-shipment, competency-event, label-sheet PDF; added `eqa.provider.ship` permission. (F) 12 new ACs (AC-V2.1-11..22) covering panel inventory invariant, vendor-sourced required fields, provider state-machine 409, auto-advance SLA, participant state derivation (8 seeded cases), shipment plug-point, receipt transactional side-effect + rollback, receipt uniqueness, manual state-transition reason 422, state-transition immutability 405, competency-event write 403 for non-service user, event_type enum 422. **V2.3 additions:** (G) FR-V2.3-06 data source explicit — union of `eqa_participant_result` with non-null `assigned_analyst_id` AND `eqa_analyst_competency_event`, trailing 12 months; competency bands (Competent / Under Review / Not Competent) rewritten with concrete rules using "counts against analyst" column from FR-V2.3-02 mapping table, replacing the V1 "per rules in compilation §9" pointer which was under-specified for V2.3's event-driven data model. `dismissed_equipment`, `dismissed_acceptable_on_review`, and `pending_re_test` excluded from both numerator and denominator. (H) FR-V2.3-02 triage actions emit competency events — Escalate-to-NCE writes `escalated_to_nce` with `nce_id`; each dismissal category maps to a category-specific `dismissed_*` event_type per a new mapping table. (I) FR-V2.3-01 gains categorical / null-Z external unacceptable path — `performance_status = 'unacceptable'` AND `z_score IS NULL` AND scheme is external → same NCE auto-create path as numeric |Z|>3; summary omits Z token, includes reported-vs-target values. Closes the HIV qualitative / TB smear grading / blood film ID hole that had no NCE coverage. (J) `?source=eqa` URL contract enumerated in `docs/eqa/nce-deep-links.md` — shared with V2.2 cycle banner deep-link; NCE register owns respecting the contract, V2.3 owns emitting it; E2E test (AC-V2.3-18) verifies the contract end-to-end. **V2.3 ACs expanded:** AC-V2.3-14 (categorical NCE), AC-V2.3-15 (three-path competency-event writer), AC-V2.3-16 (dismissal-category mapping), AC-V2.3-17 (rollup exclusions seeded scenario), AC-V2.3-18 (`?source=eqa` URL contract E2E), AC-V2.3-19 (Source column filter), AC-V2.3-20 (MultiSelect interaction). **Story points:** V2.1 13 → 21, V2.3 13 → 16. | Audit gaps fell into four classes: (1) missing tables that the V2.2 / V2.3 / V2.4 / V2.5 specs already referenced (competency event writer, state-transition audit) — these were promissory IOUs in V2.1 that had to be redeemed in-spec before stories could be implementation-ready; (2) a data-model choice hidden in prose — "per-lab participant state" needed either a column or a derivation rule, and leaving it unstated would either duplicate `eqa_participant_result` or diverge from it; (3) an unsourced rule reference — "per rules in compilation §9" for competency bands was a pointer to a V1 FRS that predates the event-driven V2 data model, which would have blocked implementation; (4) a real coverage hole — categorical PT (HIV qualitative, TB smear, blood film ID) had no NCE auto-create path under the original |Z|>3 gate, despite being a large share of the target deployment countries' PT portfolios. All four had to be closed before V2.1 and V2.3 could be called implementation-ready. | V2.1 header story-points bumped to 21; V2.3 header story-points bumped to 16; V2.1 labels gain `shipment` `audit`, V2.3 labels gain `audit`; FR-V2.1-21 + FR-V2.1-22 added; participant-side state derivation table added after FR-V2.1-18; FR-V2.1-14 API endpoints + permissions expanded; FR-V2.3-01 gains categorical/null-Z path + service-layer competency-event writes; FR-V2.3-02 gains dismissal-category → event_type mapping table; FR-V2.3-06 rewritten with explicit data source + competency bands; URL contract note added to FR-V2.3-07 region; AC-V2.1-11..22 added; AC-V2.3-14..20 added; both stories' DoD extended with new docs (`docs/eqa/analyst-competency-events.md`, `docs/eqa/state-transition-audit.md`, `docs/eqa/analyst-competency-rules.md`, `docs/eqa/nce-deep-links.md`). |
| **7.2.16 — ePT platform crosswalk: V2 differentiators adopted, V3.5/V3.7/V3.8 added, fork-per-scheme rejected.** After a comparison pass against the APHL ePT / InteLIS / tbPT family of platforms (AGPL-3.0 PHP/MySQL, ~10+ country deployments since 2014; full comparison in `eqa-v2-ept-platform-crosswalk.md`), V2 MVP is revised + V3 is extended. **V2 adjustments (small, low-risk):** (1) FR-V2.1-06 gains a **Test-domain coverage invariant** paragraph clarifying that `scheme_type` is the *arrangement* axis (`international_pt` / `regional_pt` / `inter_lab_split` / `in_house`) and the *test-domain* axis (what analyte the scheme measures) is carried by the standard OpenELIS test catalog, not by a second enum; V2.1 must prove the catalog can represent each of six ePT-validated domains (HIV serology rapid, HIV VL quantitative, EID qualitative, HIV recency categorical, COVID-19 qual/quant, TB microscopy grade + molecular qualitative) without schema changes (new AC-V2.1-23 + new DoD item + `docs/eqa/test-domain-catalog.md`). (2) V2.2 DoD gains a **unit/method context verification** item: QA walks one seeded cycle per ePT-validated domain and confirms standard result entry surfaces the unit a PT provider expects (e.g., `log10 c/mL` for VL; grade `0 / Scanty / 1+ / 2+ / 3+` for TB microscopy), the method / platform context, and the required qualifiers (`<LOD` / `≥LOD` etc.) — any gap is raised as a V2.1 schema/seed defect, not a V2.2 UI workaround. (3) V2.2 gains **FR-V2.2-14 — submission-deadline reminder emails**: scheduled job identifies cycles where panel is in the lab and `submission_deadline - now ≤ 3 days` (threshold configurable, 0 = disable); sends one aggregated daily email per lab via existing SMTP config, using `lab_enrollment.notification_recipients`; no-contact labs write an Alerts entry instead; includes AC-V2.2-15 + DoD item; V2.2 story points 8 → 9. **V3 extensions (new work added):** (4) V3.5 scope expanded with **cycle-close Certificate of Participation generation** — on cycle transition to `closed` AND `scheme.certificates_enabled = true`, generate per-participant ISO 17043-compliant PDF certificates with serial numbers, store in `eqa_cycle_certificate`, expose to participant on Recent Cycles and to provider on Cycle page; supersede/regenerate tracked via `regenerated_count` + watermark. (5) New **V3.7 — PT Hub: Provider-Side Proxy Entry for Offline Participants** — permission-gated (`eqa.provider.proxy_entry`, default off) provider surface for entering results on behalf of paper/phone/SMS/email-submitting labs; separates `entered_by` from `data_owner_org_id` so participant-side dashboards attribute correctly and provider's own competency numbers do not inflate; `data_source` enum extended with `proxy_paper` / `proxy_phone` / `proxy_email` / `proxy_sms` / `proxy_other`. (6) New **V3.8 — ePT FHIR Interop: Discovery + Adapter Shim** — extends V2.2 FR-V2.2-05 auto-submission with a `provider_fhir_endpoint_type` discriminator on `eqa_scheme` (`generic_fhir_r4` / `aphl_ept_fhir` / `aphl_intelis_fhir` / `custom`); ships an `eqa-adapter-aphl-ept` Java module that translates OpenELIS ↔ ePT-shape payloads on submission + scoring; precedes implementation with a discovery-spike doc (`docs/eqa/ept-fhir-discovery.md`) capturing the actual ePT-side FHIR capability matrix. **Explicitly NOT adopted from ePT:** (7) per-scheme forking into separate code paths — V2 keeps a single polymorphic `eqa_scheme` + shared pipeline, which the crosswalk identifies as the strongest V2 differentiator and the pattern we want to preserve. (8) Standalone per-country login pages / separate user DBs — OpenELIS uses one authenticated surface. (9) A dedicated `eqa_shipment` entity — V2.5 plugs into the existing sample shipment module per §7.2.12. (10) Full participant-into-provider-DB consolidation — the provider sees summaries + fields it needs, not a mirror of each participating lab's OpenELIS DB. | The ePT family solves real operational problems (offline participant equity, cycle-close certificates, submission-deadline nudging, domain-specific unit/method fidelity) that the V2 spec was quiet on, and it has 10+ years of ground-truth across 10+ countries behind each of those design choices. Bringing the lessons in during late V2 draft is cheaper than retrofitting after launch; explicitly parking the larger pieces (certificates, proxy entry, FHIR shim) in V3.5/V3.7/V3.8 keeps V2 MVP scope bounded while making the strategic adoptions visible. Just as important: the *anti-patterns* — fork-per-scheme, per-country standalone deployments, parallel entity duplication — are ones V2 is already avoiding by construction, and making that explicit as "not adopted" in the crosswalk prevents future contributors from accidentally reintroducing them. The test-domain coverage invariant in particular surfaces a latent design question (is `scheme_type` domain or arrangement?) that would otherwise have manifested as a bad seed-data PR six months into implementation. | FR-V2.1-06 gains "Test-domain coverage invariant" paragraph; new AC-V2.1-23; new DoD item `docs/eqa/test-domain-catalog.md`; V2.2 story points 8 → 9; new FR-V2.2-14 + AC-V2.2-15 + DoD item; V2.2 DoD gains unit/method verification item; V3.5 scope expanded with cycle-close certificate generation + `eqa_cycle_certificate` table + `certificates_enabled` scheme flag; epic-2 AC-E03 rewritten to include certificates; new V3.7 and V3.8 outlines added; epic-2 AC-E04 + AC-E05 added; Stories↔Compilation phases table gains (cross-cutting) proxy-entry + FHIR-interop rows and P21 updated to "+ V3.5 Certificates"; filing checklist updated V3.1–V3.6 → V3.1–V3.8; full comparison at `eqa-v2-ept-platform-crosswalk.md`. |

---

## 8. Epic + Story structure (V2 MVP + V3 Enhancements)

Derived from Q5 decision + refinements in §7.2. Full specs in `eqa-v2-epic-and-stories.md`.

### Epic 1: EQA V2 — Complete Lifecycle MVP

| Story | Scope | Covers |
|---|---|---|
| **V2.1 Data Model Foundation** | Polymorphic `eqa_scheme`; `eqa_cycle` + `eqa_round`; `eqa_participant_result`; `eqa_scheme_analyst` (per-analyst mapping); `requires_cycle_review` flag; `eqa_panel` + `eqa_panel_sample`; `eqa_participant_followup`. Conditional BR-004. Migrations + API. | G1, G2, G9, R1, R2, R5 |
| **V2.2 Participant Experience** | Carbon-ported enrollment UI; Cycle progress dashboard linked to standard result entry; auto-submit via FHIR on validation-complete; manual-submit fallback; score intake surfacing; optional review gate (off by default). | G3 (optional gate), Q3 |
| **V2.3 Oversight + Per-Analyst + Lab Performance + NCE** | NCE trigger tiered by severity, scoped to participant-role rows; per-analyst column on standard result entry (optional); eligible-analyst mapping UI on scheme config; Lab Performance dashboard (Coverage with KPI tile row at top + Recent Cycles submenus; open-NCE tile deep-links to NCE register); Analyst Competency; Follow-Up Queue (with Source column for external/in-house/split). | G4, G6 (NCE integration), plus lab-level rollup |
| **V2.4 In-House Blinding Workflow** | Blinded-panel wizard (sealed targets, blind codes); prep/aliquoting tracker reusing V2.1 FR-V2.1-17 columns (source_type, lot, aliquots, storage temp, homogeneity QC); blind-code label printing via V2.5 PDF pipeline; distribute as OpenELIS orders; unblind at deadline; auto-score vs. sealed targets; unacceptable results route to V2.3 Follow-Up Queue with `Source = In-house`; missed-deadline results also flow to V2.3 Analyst Competency view; Workplan handoff documented. 11 points. | Makes `scheme_type = 'in_house'` usable end-to-end with consistent prep/label tooling across V2.4 (in-house) and V2.5 (provider-side). |
| **V2.5 Provider-Side Program: Prep, Ship, Score + Participant Follow-Up** | Panel definition at MVP level + source/inventory fields (`source_type`, lot, aliquots produced/reserved/shipped, storage temp, expiration); explicit provider cycle state machine; prep workbench with homogeneity QC gate; shipment workbench plugging into existing OpenELIS sample shipment module (courier/tracking/cold chain, pack list + label print); receipt confirmation monitoring with overdue flagging; repeat-test reprovisioning from reserve aliquots; score calculation + distribution; participant performance dashboard; follow-up register; provider-side trending. 21 points. | Closes B.PROVIDER workflow loop end-to-end — no more Excel for logistics. |

V2.1 is the foundation. V2.2, V2.3, V2.4, V2.5 are parallelizable once V2.1 migrations land (V2.5 depends on V2.1's `eqa_panel` + `eqa_participant_followup` tables; V2.4 depends on V2.1's `eqa_panel` + `scheme_type = 'in_house'`).

### Epic 2: EQA V3 — Analytics, Compliance, and Integration

| Story | Scope | Covers |
|---|---|---|
| **V3.1 Multi-Cycle Analytics** | Trending charts; automated performance signals (2-consecutive, drift); coverage-gap matrix; annual summary + ISO 15189 §7.7 audit-evidence export. | G11, G12, G13, G14 |
| **V3.2 Cold-Chain Validators + Rejection Workflow** | Temperature range validators against `storage_temp` tolerance bands; structured packaging-condition checklist (replaces V2.2 free-text integrity notes); `panel_rejected` state + replacement workflow tied to V2.5 reprovisioning; cross-module cold-chain deviation correlation. Minimal receipt event already in V2.2 MVP per §7.2.13. | G5 (structured half) |
| **V3.3 IQC ↔ EQA Correlation** | Same-run IQC (Westgard) state on the NCE investigation page when `trigger_source = 'eqa_unacceptable'`. | G7 |
| **V3.4 Patient Impact Look-Back** | Worklist of patient samples run in the out-of-control window; attaches to NCE investigation. | G8 |
| **V3.5 ISO 17043 Provider Compliance** | Panel homogeneity + stability testing; full panel-production traceability; provider-side ISO 17043 audit evidence. | G10 |
| **V3.6 Provider-Side Internal NCE Triggers** | NCE auto-creation for panel defect (homogeneity fail), scoring error, deadline miss, cluster-failure pattern (suspect bad panel). | New — provider-side ops |

---

**End of crosswalk.**
