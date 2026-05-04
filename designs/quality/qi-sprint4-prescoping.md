# Sprint 4 Pre-Scoping: Quality Indicators
## Resolving the 16 Open Questions Before Sprint 4 Cold-Starts

**Document Version:** 0.1
**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Scope:** Three QI outline drafts (Rejection Rate, Amendment Rate, Critical Callback Compliance)
**Goal:** Walk through every open question, recommend a default, and identify who needs to confirm before Sprint 4 kickoff so we don't write FRSes around the wrong assumptions.

---

## How to use this doc

For each open question:

- **Q:** the actual question
- **Options:** the realistic alternatives with one-line tradeoffs
- **Recommendation:** the default we should adopt unless someone disagrees
- **Confirm with:** who has to sign off (Casey, eng lead, lab partner, or no-one — just document)

If we resolve all 16 here, Sprint 4 starts with crisp FRSes. If a few stay open, that's fine — at least they're explicit.

---

## Rejection Rate (5 questions)

### RR-Q1. Recompute cadence

**Q:** Live recompute on every sample-status change vs. nightly batch?

**Options:**
- **Live with cached aggregates** — every status change invalidates the right aggregate; user sees today's data. Implementation cost: moderate (aggregate cache + invalidation hooks).
- **Nightly batch** — single scheduled job recomputes all aggregates. Cheap. Lab loses today's view; QA Officer sees "yesterday's rate" all day.

**Recommendation:** **Live with cached aggregates.** A QI dashboard that always shows yesterday's number trains the QA Officer to ignore it. The implementation lift is one-time and the indexes already exist on `sample.status` and `sample.received_date`.

**Confirm with:** Engineering lead — sanity-check that cache invalidation cost is acceptable on the ingest hot path.

---

### RR-Q2. Partial rejection weighting

**Q:** A sample partially rejected (some tests rejected, others valid) — does it count as 0.5 or 1.0 in the numerator?

**Options:**
- **1.0 (every rejection counts as a rejection)** — consistent with NCE counting (NCE Report FRS treats partial rejection as its own NCE event).
- **0.5 (proportional)** — defensible analytically but inconsistent with NCE counting and harder to explain.

**Recommendation:** **1.0.** Match NCE counting. Document explicitly in the FRS so labs whose KPI committees expect proportional weighting can read the rule and understand. Full and partial rejections will already be split out in the Pareto / drill-through, so labs can compute a proportional rate themselves if they want.

**Confirm with:** No-one — just document.

---

### RR-Q3. Multi-tenant rollup

**Q:** Will the QI dashboard need to roll up across multiple sites for ministry-network customers?

**Options:**
- **In-scope for v1** — adds material complexity (site filter, cross-site permission model, data segregation rules).
- **Out of scope for v1, single-site only** — matches the broader QA menu roadmap decision (DEC03).

**Recommendation:** **Out of scope for v1.** This is already locked at the roadmap level (single-site v1). The QI dashboard inherits that scope.

**Confirm with:** No-one — already decided in roadmap DEC03; just inherit.

---

### RR-Q4. Sample type taxonomy

**Q:** Some labs categorize by container (SST, EDTA), others by specimen type (serum, plasma, whole blood). Which field do we use for the threshold table and the heatmap dimension?

**Options:**
- **Container/tube type** (`sample_container_type`) — captures pre-analytical issues like wrong-tube errors, but bundles serum and plasma in odd ways.
- **Specimen type** (`specimen_type`) — captures clinical sample category, which is what IFCC reference rates were defined against. Misses container-specific errors.
- **Both, with specimen-type as the primary dimension and container as a secondary drill-down.**

**Recommendation:** **Both, specimen-type primary.** Default threshold table is keyed on specimen type (matches the IFCC references). Container type appears as a secondary drill-down dimension on the detail page so wrong-tube patterns surface. Avoids a binary choice that makes someone unhappy.

**Confirm with:** Casey + lab partner — confirm both fields are reliably populated in production data.

---

### RR-Q5. Self-induced rejections

**Q:** Should rejections caused by the lab itself (e.g., aliquot exhausted during validation rerun, sample destroyed during analysis) count in the numerator the same as receipt rejections?

**Options:**
- **Count all rejections in the headline rate** — most honest pre-analytical+analytical rejection picture; the Pareto by NCE trigger source makes the breakdown visible without filtering.
- **Exclude self-induced from the headline rate, surface separately** — flatters the rejection rate; harder to explain to inspectors.

**Recommendation:** **Count all in the headline rate.** Trigger source is already a column in `nce_event`. Filter is one click away on the detail page. Don't curate the headline number.

**Confirm with:** No-one — just document.

---

## Amendment Rate (5 questions)

### AR-Q1. Comment-only edits

**Q:** A post-release edit that changes only the interpretive comment text but not the value/unit/flags — does it count as an amendment?

**Options:**
- **Don't count** (default OFF) — keeps the rate aligned with "result data was wrong" definition. Risk: a clinically meaningful interpretation change might slip through uncounted.
- **Count any comment-only change** — over-counts trivial typo fixes.
- **Count comment changes that alter clinical interpretation, ignore whitespace/formatting** — closest to the truth, but requires a definition of "alters interpretation."

**Recommendation:** **Don't count by default; lab-configurable to count.** The FRS defines "interpretation-altering" narrowly: any change to the structured interpretive comment text (excluding whitespace and pure formatting). Labs that want the stricter rule can flip the toggle.

**Confirm with:** Casey — confirm there's an analyst-friendly definition of "interpretive comment" that maps to a single field, not an open free-text field that catches typos.

---

### AR-Q2. Addendum results

**Q:** Adding a previously-not-reported analyte to a released report — count as 1 amendment?

**Options:**
- **Count as 1 amendment** — the released report changed; clinical reader sees a new piece of information.
- **Don't count** — no result was wrong; addenda are additive.
- **Count, but tag as `addendum` so labs can filter.**

**Recommendation:** **Count as 1, tag as `addendum`.** Labs can filter the headline rate, but the canonical number includes addenda — every change to a released report is potentially actionable for the clinician.

**Confirm with:** No-one — just document; the tag means it's reversible later.

---

### AR-Q3. Auto-rerun amendments

**Q:** If an instrument auto-rerun replaces a released value, but the difference is within the delta-check tolerance — does it still count?

**Options:**
- **Count** — the released value was wrong; the patient could have been managed on it.
- **Don't count when within delta tolerance** — auto-reruns within tolerance are essentially noise reduction, not error correction.

**Recommendation:** **Count.** Within-tolerance doesn't mean "the same"; it means "not flagged." If we exclude these, we hide a class of pre-analytical drift that QA needs to see. Easy to filter on "auto-rerun" in the detail view.

**Confirm with:** Casey — confirm the lab-partner expectation (some QA committees will want auto-reruns excluded; if so, expose a config toggle defaulting OFF).

---

### AR-Q4. Time-elapsed cutoff

**Q:** Some labs only count amendments within 24h or 7d as "true amendments" and call later changes "addenda." Should we follow that?

**Options:**
- **Count all post-release changes; track time-elapsed as a column** — simplest definition, full visibility.
- **Cut off the headline rate at 24h or 7d** — flatters the number; harder to defend.

**Recommendation:** **Count all; track time-elapsed.** Time-elapsed is a useful drill-down dimension (e.g., "we have a problem with critical-results released after 5pm — they're amended the next morning at 8am") but shouldn't gate the headline.

**Confirm with:** No-one — just document.

---

### AR-Q5. AP severity weighting

**Q:** Anatomic pathology amendments come in severity tiers (clarification, addendum, diagnostic discrepancy). Should the QI weight by severity?

**Options:**
- **Weight by severity in v1** — most clinically meaningful, but adds a UI dimension and a configuration burden.
- **Track raw rate in v1, severity weighting in v2** — keeps the simple definition consistent across all test categories.

**Recommendation:** **Raw rate in v1; severity weighting deferred to v2.** Aligns with the broader v1-keep-it-simple philosophy. Severity is captured on the underlying NCE so v2 can layer the weighting without a data-model change.

**Confirm with:** No-one (defer is the safe choice); if AP team objects, revisit.

---

## Critical Callback Compliance (6 questions)

### CC-Q1. Schema extension (BLOCKER candidate)

**Q:** Does the existing critical-result callback log capture all four required elements (caller, recipient, read-back confirmation, acknowledgment time)?

**Options:**
- **It already does** — confirm in Sprint 3 inventory; QI builds without migration.
- **It's missing read-back or ack-time fields** — Sprint 4 starts with a small migration; QI build slides one sprint or starts after migration in same sprint.
- **It's substantially incomplete** — bigger discussion; possible Sprint 4 scope cut.

**Recommendation:** **Audit in Sprint 3.** Bake the audit into Sprint 3's existing inventory work (Audit Trail rehome already crawls the callback area). Result of audit determines Sprint 4 scope. Have a fallback plan: if the schema is substantially incomplete, scope Sprint 4 to the migration + a stub QI dashboard, and slide full QI build to Sprint 4.5.

**Confirm with:** Engineering lead. **This is the highest-leverage open question.** Resolve first.

---

### CC-Q2. "Unable to reach" handling

**Q:** A documented callback attempt that failed (three attempts, no contact reached) — compliant or non-compliant?

**Options:**
- **Compliant if attempts were appropriate** — the lab did its job; failure to reach the clinician is a clinician-side problem.
- **Non-compliant** — patient-safety outcome failed regardless of cause; that's the metric.
- **Non-compliant by default; configurable.**

**Recommendation:** **Non-compliant by default; lab-configurable.** TJC NPSG.02.03.01 frames this as a patient-outcome metric. A lab-configurable override exists for environments (e.g., remote outpatient) where the structural reality is different. Surface a separate "Callback Escalation Rate" sub-indicator so labs can see attempts vs. successes without diluting the headline.

**Confirm with:** Casey — confirm with lab partner on TJC interpretation; this is the kind of decision that an inspector might quibble with.

---

### CC-Q3. Out-of-hours target time measurement

**Q:** For an outpatient critical result released at 10pm with a 60-minute target — is the target measured against wall-clock (call by 11pm) or business hours (call by 11am next day)?

**Options:**
- **Wall-clock** — TJC intent: communicate critical results promptly regardless of hour.
- **Business hours** — pragmatic for outpatient labs without overnight staff.

**Recommendation:** **Wall-clock by default; lab-configurable per-test or per-section.** TJC's guidance is unambiguously wall-clock. Labs that genuinely cannot staff overnight callback for a specific test can override with documented justification.

**Confirm with:** Casey — confirm with lab partner on regulatory exposure.

---

### CC-Q4. Auto-page integrations

**Q:** If the lab has an auto-paging system that initiates the call, what does "callback" mean for compliance?

**Options:**
- **Auto-page-initiated counts as callback start; the recipient ack closes the loop.**
- **Only human-initiated calls count; auto-pages are noise.**
- **Auto-page counts, but read-back must still be human round-trip.**

**Recommendation:** **Auto-page counts as callback start; recipient acknowledgment with read-back closes the loop. The auto-page alone does not.** Anything else either over-credits the system or under-credits a real workflow.

**Confirm with:** No-one if no labs use auto-paging; Casey if a partner lab does.

---

### CC-Q5. Critical-value list location

**Q:** Is the lab-configured critical range list inside OpenELIS (per-test reference range) or external?

**Options:**
- **Already in OpenELIS** (`analyte_critical_range` or similar) — QI reads it directly. Likely.
- **External** — QI needs an integration; non-trivial.

**Recommendation:** **Inventory in Sprint 3** alongside CC-Q1. Likely answer: it's already in OpenELIS. If not, this becomes a Sprint 4 dependency similar to CC-Q1.

**Confirm with:** Engineering lead — Sprint 3 inventory.

---

### CC-Q6. Per-test threshold setting vs. overall target

**Q:** Should labs be able to set per-test compliance targets, or just an overall lab target?

**Options:**
- **Per-test targets** — most flexible; matches the reality that critical INR for warfarin patients may have different urgency than critical glucose. Adds config burden.
- **Overall target only** — simpler. Per-test drill-down still shows where compliance is dragging without needing per-test thresholds.
- **Overall target + per-test override** — split the difference.

**Recommendation:** **Overall target only with per-test drill-down for visibility, no per-test threshold setting in v1.** Operational simplicity matters more than fine-grained tuning at this stage. v2 can add per-test thresholds if labs ask.

**Confirm with:** No-one (defer is the safe choice).

---

## Summary table — recommendations by question

| ID | Question | Recommendation | Confirm with |
|---|---|---|---|
| RR-Q1 | Recompute cadence | Live with cached aggregates | Engineering lead |
| RR-Q2 | Partial rejection weighting | 1.0 | (Document) |
| RR-Q3 | Multi-tenant rollup | Out of scope (DEC03) | (Already decided) |
| RR-Q4 | Sample type taxonomy | Specimen-type primary, container secondary | Casey + lab partner |
| RR-Q5 | Self-induced rejections | Count all in headline | (Document) |
| AR-Q1 | Comment-only edits | Don't count by default; configurable | Casey |
| AR-Q2 | Addendum results | Count, tag as `addendum` | (Document) |
| AR-Q3 | Auto-rerun amendments | Count; toggle defaulting OFF | Casey |
| AR-Q4 | Time-elapsed cutoff | Count all; track elapsed time | (Document) |
| AR-Q5 | AP severity weighting | Raw rate v1, severity weighting v2 | (Document) |
| **CC-Q1** | **Callback log schema** | **Audit in Sprint 3** | **Engineering lead — BLOCKER** |
| CC-Q2 | "Unable to reach" handling | Non-compliant default; configurable | Casey |
| CC-Q3 | Out-of-hours target | Wall-clock; configurable | Casey |
| CC-Q4 | Auto-page integrations | Auto-page = start, human ack = close | No-one (or Casey if partner lab) |
| CC-Q5 | Critical-value list location | Sprint 3 inventory | Engineering lead |
| CC-Q6 | Per-test thresholds | Overall target only in v1 | (Defer) |

---

## Pre-Sprint-4 action list

1. **Sprint 3 inventory must answer CC-Q1 and CC-Q5.** Bake into the Audit Trail rehome inventory crawl. Both are blockers for the Critical Callback build.
2. **Casey + lab partner conversation** to confirm RR-Q4 (sample type taxonomy), AR-Q1 (comment-only edits), AR-Q3 (auto-rerun amendments), CC-Q2 (unable-to-reach), CC-Q3 (wall-clock target). One 30-minute meeting can clear all five.
3. **Engineering lead conversation** to confirm RR-Q1 (live aggregate cost), CC-Q1 (schema audit ownership), CC-Q5 (critical-value list location). Same 30-minute slot if available.
4. **Document the rest** in the Sprint 4 FRSes with the recommendations above as defaults. Anyone who wants to override has the chance during FRS review.

---

## Appendix: blocker triage

If only one thing gets answered before Sprint 4 kickoff, it's **CC-Q1**. Everything else has a defensible default. CC-Q1 has three branches with materially different Sprint 4 plans:

- **Schema is complete:** Sprint 4 builds all three QIs as planned.
- **Schema needs minor extension:** Sprint 4 starts with a one-week migration, then builds.
- **Schema is substantially incomplete:** Sprint 4 = migration + stub Critical Callback dashboard; full Critical Callback build slides to Sprint 4.5. Rejection Rate and Amendment Rate ship on time.

---

*End of pre-scoping doc.*
