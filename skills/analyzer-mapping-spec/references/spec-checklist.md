# Integration Spec Checklist — "unit tests for the spec"

> Run before handing a spec/companion guide to a developer or marking the tracker
> "Spec Complete." Validates that the spec is **complete, grounded, and unambiguous** — it is
> NOT a test of the running integration. A spec that fails an item isn't ready, regardless of
> how polished it reads. Mirrors the openelis-design `/checklist` discipline for protocol specs.

## How to use
Walk the relevant protocol section + the shared section. Every box should be checkable as
**yes** or explicitly **N/A with a reason**. Unchecked boxes are gaps to close, not to wave
through.

---

## Grounding & sourcing
- [ ] Every field position / segment number traces to a **named source** (vendor LIS manual + version, or a captured real message) — none are guessed.
- [ ] Confidence rating is set and **justified** (HIGH = vendor docs; MEDIUM-HIGH = unverified UI/menu paths; VALIDATED = confirmed in production). No HIGH without a cited manual.
- [ ] Anything reused from `references/mapping-library.md` kept its source/confidence (no ILLUSTRATIVE fragment asserted as fact).
- [ ] Protocol was **verified, not assumed** (e.g. Mindray = HL7, not ASTM).

## Completeness — record/segment coverage
- [ ] **ASTM:** every record type the instrument actually emits is documented (H, P, O, R, L as used).
- [ ] **HL7:** every segment used is documented (MSH, PID, OBR, OBX, NTE as used); MLLP framing + ACK behavior stated.
- [ ] **CSV:** delimiter, **encoding**, line endings, header row, and file-discovery (path, naming, poll interval, post-import action) all specified.
- [ ] Each test code has: analyzer code, test name, result type, unit, transform, and the OpenELIS target (or `TBD` flagged).
- [ ] **QC identification rules** present, using **OR logic**, with concrete field/value/prefix triggers.
- [ ] **Abnormal flag mapping** table present (or N/A for purely qualitative).
- [ ] **Result aggregation mode** stated: `BY_SPECIMEN` (with window) or `PER_MESSAGE`.

## Qualitative & transforms
- [ ] Every qualitative analyzer value has a value-map target, and targets are result options that can actually exist on the matched catalog test.
- [ ] Unmapped-value behavior is stated (flag for review = default; never silently dropped).
- [ ] Unit scale/locale issues handled (e.g. ratio→percent `SCALE`; French-locale decimal/delimiter/encoding).

## Connectivity
- [ ] TCP **port** and **connection role** (SERVER/CLIENT) stated.
- [ ] Data flow stated: results-only (one-way) vs two-way, consistent with the Analyzer Types & Mapping FRS.

## Evidence
- [ ] A **sample message** (ASTM/HL7) or **sample file** (CSV) is included.
- [ ] The spec shows that sample **parsing correctly** — each R/OBX/row resolves to a known test code and the QC classification is right. (A sample that isn't traced through is half-evidence.)

## Dual-mode (if applicable)
- [ ] Each mode (real-time + batch) has its own section and its own Jira story.
- [ ] Data differences between modes are documented (e.g. QC flags present in real-time, absent in CSV).

## Harmonization & portfolio (defer to openelis-design)
- [ ] No UI/implementation direction crept in — the spec describes the **mapping/behavior**, not how to build the adapter.
- [ ] Crosschecked against the decision-log (no contradictions) and the integration is **registered** in the spec-registry (Step 3.5).
- [ ] Any reliance on not-yet-built OpenELIS capability (pending/unmapped queue, Alerts ack model) is declared as a dependency, not assumed.

## Deliverables & tracker
- [ ] Spec version header set (`v1.0` first issue; bump on revision).
- [ ] Companion setup guide produced (instrument-side config concrete; OpenELIS-side defers to the FRS).
- [ ] Jira story created with the **deployment-correct** parent epic, labels, and assignee (routing table) — IDs discovered, not hardcoded.
- [ ] Tracker row added/updated on the **deployment's** tracker page, preserving existing rows.
