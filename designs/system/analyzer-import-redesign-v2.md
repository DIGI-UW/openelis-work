# FRS — Analyzer Results Import (redesign, revisited)

**Status:** Draft for review · **Supersedes:** `analyzer-import.md` (the wireframe-era redesign; all its
QC-first / run-settings / sidebar mechanics are carried forward, restructured to FRS form and made
multi-component-aware).
**Technology:** Java / Spring backend, React + Carbon (`@carbon/react`).
**Jira:** **OGC-288** (Analyzer Results Import Page Redesign — the owning story; this is its revisited
design). Related: epic **OGC-1131** (Multi-Component Results), OGC-1129 (analyzer ingestion), OGC-949 M1
(`test_result_component`), Results Entry v4 (OGC-811), OGC-1136 (analyzer Types & Mapping component column).

---

## Lab Context

### Current State
When an instrument sends a run to OpenELIS, a tech opens the **Analyzer Results Import** page to review the
incoming results and accept them into the system. A run mixes **control samples** (QC) with **patient
samples**; the tech should confirm QC passed before releasing any patient result, record which reagent
lots/cartridges the run used, and watch for abnormal or critical values. Increasingly the runs are
**multiplex molecular** — one patient sample yields several values at once (an overall call plus a Ct/Cq
per target gene / probe / fluorophore channel).

### Pain
Today QC and patient results are intermingled with no gating, reagent capture lives on paper, and there's
no delta-check or interpretation help. And a multiplex run has nowhere to put its per-target values — the
page assumes one value per test, so probe Cts are dropped or forced into separate tests. A tech reviewing
an Xpert MTB/RIF run can accept "MTB DETECTED" but not the five rpoB probe Cts behind it.

### What Changes
The page leads with **QC**: control samples are extracted and evaluated first, and patient acceptance is
blocked when QC fails. Reagent lots are captured once per run (FIFO-preselected). Each patient analysis
shows its result(s); for a **multi-component** test the review shows every component (the call plus each
target's Ct), grouped under the analysis, reusing the same result rendering as Results Entry. Unmapped
targets surface as visible exceptions rather than vanishing. QC still gates the whole run; accept/reject is
per analysis.

---

## Overview & IA
The Analyzer Results Import page is the review-and-accept surface for a single analyzer run: a **QC-first**
panel at top, a **Run Settings** strip (analyzer + reagent lots), the **patient results** review table, and
a **QA/QC sidebar**. It is driven by the analyzer mapping (Analyzer Types & Mapping) and, for multiplex
tests, by the target→component mapping (OGC-1136/1129).

**Navigation & URL:** under **Analyzers** (e.g. `Analyzers → [analyzer] → Import` / results review). Verify
the exact route + SideNav slot against the live app before build.

---

## User Stories
- **As a tech,** I want QC evaluated before I can accept patient results, so a failed run can't release bad values.
- **As a tech,** I want each patient analysis's full result — including every target/component of a multiplex test — visible on the review, so I accept the complete result, not just the call.
- **As a tech,** I want a reported target that isn't mapped to show as a clear exception I can act on, so nothing is silently lost.
- **As a tech,** I want the run's reagent lots captured once and applied to all accepted results, so consumption isn't hand-recorded.
- **As a supervisor,** I want the import review to look and behave like Results Entry (same result widgets, flags, Method/Analyzer split), so the two feel like one product.

---

## Functional Requirements

### A. QC-first workflow (carried forward)
- **FR-A1.** Control samples are **extracted** from the run (by sample-ID pattern, reserved patient ID, control sample-type, or known control lot) and shown in a dedicated **QC panel at the top**, with per-control card: type/level, result, expected range, pass/fail, run time, failure reason.
- **FR-A2.** Overall QC status gates the run: **All pass** → patient results acceptable; **any fail** → patient results marked non-conforming and **accept disabled** (retest/ignore still available; NC banner + link); **no QC** → warning, fall back to last-known QC or require manual verification.
- **FR-A3.** QC failure creates/links a **Non-Conformity** record; a Levey-Jennings link is available. (QC-program evaluation — Westgard/LJ — lives in the QC domain, not here.)
- **FR-A4. QC verdict source.** Pass/fail is taken from the **analyzer's own QC flag when the message provides one** (e.g. GeneXpert SPC/PCC valid/invalid; onboard QC pass/fail). That flag is authoritative for the import gate.
- **FR-A5. Expected-vs-observed (fallback + display).** Each control card shows the control's **observed** result beside its **expected** result. Where the analyzer sends a control value but **no verdict**, pass is derived as **observed == expected for qualitative controls** (Positive → expected DETECTED, Negative → NOT DETECTED, internal control → valid). For a **quantitative** control with no configured target range, show the value (and any analyzer flag) for **tech judgment** — never fabricate a verdict. No Westgard/SD math on this page.

### B. Run Settings (carried forward)
- **FR-B1.** Analyzer is auto-assigned from the import source (read-only: name, online/offline, QC status). Method/Analyzer follow the Results Entry v4 split.
- **FR-B2. Reagent/cartridge lot provenance.** The run's reagent/cartridge lots come from **either the analyzer message** (when it carries the lot — e.g. a GeneXpert cartridge lot — shown read-only, tagged "analyzer-reported") **or a manual selection** by the tech from inventory. **No FIFO auto-selection is assumed** — nothing is pre-picked; the tech chooses when the analyzer doesn't report it. Expiring-soon/expired lots are flagged in the manual picker. The reported/selected lots + the analyzer attach to every accepted result (`ReagentConsumptionEvent`).

### C. Patient results review (multi-component-aware)
- **FR-C1.** The review lists patient **analyses** with columns: **Sample Info (lab number = primary key; a light patient-name confirmation; NC icon)**, Test, Result, Range, QC, Flags. **Full demographics are not shown** — import is accession-keyed and the task is match → QC → accept; demographic/clinical interpretation (age/sex-aware ranges, etc.) belongs to Results Entry / Validation, not here. Result cells reuse the **Results Entry v4 result renderer** (polymorphic by `result_type`) and its **contrast Tags** (icon + Carbon `Tag` + bold, WCAG 2.2 AA), not tint alone.
- **FR-C2. Multi-component (new).** An analysis whose test has **multiple result components** renders each component value **grouped under the analysis**, in `display_order` — the primary/derived result first, the per-target values (e.g. rpoB probe Cts) beneath (reuse the panel parent/child indent). Numeric Ct/Cq is a value; **blank/absent = no amplification / negative**; empty renders blank (never a fabricated 0). A single-component test renders exactly one row, unchanged.
- **FR-C3.** Interpretation suggestions and **delta checks** are shown per **component** where the component carries ranges/history (the derived call keeps its own); delta highlights significant change vs the component's previous value.
- **FR-C4.** Accept / Retest / Ignore operate on the **analysis** (all its components together), consistent with today. Bulk "Accept selected" / "Select normal only" apply per analysis; accept is disabled while the run's QC has failed.

### D. Unmapped targets (new, actionable)
- **FR-D1.** A target the analyzer reports that has **no matching component** (on a test configured for component mapping) appears as a **visible unmapped-result exception** on the review — grouped with its analysis, flagged — and raises the existing unmapped-code Alert. It is **never silently dropped**.
- **FR-D2.** The exception is **actionable**: a "map now" affordance deep-links to the Analyzer Types & Mapping page (OGC-1136) to add the target→component mapping, or the tech can hold/ignore the target. Accepting the analysis does not silently discard unmapped targets.

### E. QA/QC sidebar (carried forward)
- **FR-E1.** Current-run QC status (mini control-value viz), recent QC history (last 5 + link), analyzer info, and reagent status with expiry warnings.

### F. Internal controls vs QC program (boundary)
- **FR-F1.** An assay's **instrument-reported internal control** (GeneXpert SPC/PCC, a qPCR IPC channel) may be modeled as a **result component** and shown per analysis (typically not on the patient report). This is distinct from the **QC-first control-sample extraction** (A1) which handles run-level QC materials. Do not double-count: an internal-control *component* travels with the patient analysis; a *control sample* is a separate QC row. The **QC program** (control materials, Westgard, LJ) is not modeled as components.

### G. Consistency with Results Entry v4
- **FR-G1.** The review reuses Results Entry v4 building blocks: the polymorphic result renderer per component, contrast Tags, Method/Analyzer split, and provenance/prefill indicators — so a value imported here and one entered on Results Entry render identically.

### H. Cross-domain
- **FR-H1.** Where the analyzer's Lab Unit implies ENVIRONMENTAL/VECTOR, the review follows the Results Entry cross-domain treatment (site/trap context instead of patient; regulatory limit instead of reference range). Molecular multiplex is the primary CLINICAL case.

### J. Sample matching (accession-keyed) & exceptions
- **FR-J1.** Import resolves each incoming record to an **accession / lab number** (the analyzer's `Sample` field) → its ordered analysis. **Patient identity is derived from the accession — the analyzer does not send it.**
- **FR-J2.** Records that don't resolve land in a **visible exception queue** — never silently dropped, never auto-created, never auto-released — in three kinds:
  - **Unmatched sample** — lab number unknown / blank / typo. Tech manually maps the record to the correct accession, or holds/rejects. (Well position alone is not a reliable accession.)
  - **Unordered test** — the accession resolves but that test wasn't ordered on it. Hold, or allow add-on per lab policy.
  - **Unmapped code/target** — the analyzer code/target has no mapping to a test/component (FR-D). "Map now" → Analyzer Types & Mapping.
- **FR-J3.** Each exception is actionable inline and blocks only its own record; the rest of the run proceeds. Accepting an analysis never discards its unresolved exceptions.

---

## Bench-experience requirements (G1–G13, from the 2026-07-10 review)

- **G1 — Entry point.** A lab-unit-scoped **Pending Imports inbox** is the entry to this page — its own story, **OGC-1137** (shows only runs from analyzers assigned to the tech's lab unit(s)).
- **G2 — Volume triage.** Default sort **exceptions/QC-issues → critical → abnormal → normal**; filter chips (All · Needs review · Critical · Abnormal · Exceptions · Normal) with live counts; **progress** ("X of N reviewed"); **partial-accept + resume** (the run stays in the inbox with a remaining count until fully dispositioned); **keyboard-first** review (v1).
- **G3 — Duplicate / already-resulted.** On load detect (a) the analysis is already resulted, (b) the run/message was already imported. **Never silently overwrite** — per-row **Keep / Replace / Ignore**. Replace while pending = in place (audit); replace after validated/released = the **correction workflow**. Duplicate run/message = **skip with warning**.
- **G4 — Rerun linkage.** QC-failed results are **retained, never released**, and **superseded** when an accepted retest replaces them. A later run covering the same samples surfaces a **suggested, tech-confirmed** "retest of RUN-x" link; ties to the QC-fail NCE.
- **G5 — Unit mismatch.** Compare incoming unit to the component's configured unit; mismatch → **exception** (no silent accept); **no auto-conversion in v1** (only where a factor is explicitly configured, later).
- **G6 — Criticals.** Reuse the Results Entry critical-ack model: surface incoming criticals; on accept, create the pending-ack **Alerts** task + `CRITICAL_DETECTED` audit; **accept is not blocked**; the row shows "critical — notification pending."
- **G7 — Reagent lots.** Analyzer-reported lot **wins** (read-only). Otherwise **no prefill** — a one-click **"Use last-used lot"** applies the tech's previous selection; else manual. (No FIFO.) Capture is required only when the deployment's reagent-lot gate is on.
- **G8 — Exception resolution.** Unmatched sample → inline **type-ahead accession search**. Unmapped code/target → **"Map now"** to the (persisted) Analyzer Types & Mapping surface, so future runs auto-resolve. **Hold / Ignore-with-reason** always available.
- **G9 — Post-accept.** Confirmation **toast + Undo**; **recall** allowed while pending validation; after validation/release → the **correction workflow**.
- **G10 — View raw.** Read-only **per-result** (record/segment) and **per-run** (message/file) raw view.
- **G11 — Editing.** **Accept-as-is on import** (analyzer fidelity preserved; "analyzer-reported" provenance). Value corrections happen in **Results Entry** (its edit-state machine + audit) — no free editing on the import page in v1.
- **G12 — Concurrency.** Optimistic concurrency + stale-page guard (`STALE_PAGE_CONFLICT_IMPORT`) + a soft **"in review by X"** indicator (from the Pending Imports inbox); **no hard locking**. *The same "in review by X" indicator is also added to Results Entry (OGC-811) and Validation (OGC-817) for consistency.*
- **G13 — QC-fail workflow.** Primary action is **Retest** (run it again until QC passes; links to the failed run per G4). **Reject** marks the results not-released — **NCE is optional** (don't add friction). **Accept despite QC failure** is the documented exception: **results-gated**, and it **requires an NCE**, auto-opened and **pre-populated** with run / analyzer / QC-failure (which control, observed vs expected) / affected samples. No separate supervisor escalation today (the `results` user overrides; it's logged) — the new RBAC will add granularity. Actions: **Retest** · **Reject** (NCE optional) · **Accept despite QC failure (files NCE)**. QC-failed result state = **Rejected — QC** (non-conforming), superseded if a retest is accepted.

## Access (updated per the 2026-07-10 review)

The import review **and** the mapping / exception resolution ("map now") use the existing **`results` permission** — **not** admin, **not** Test Catalog Manager — because mapping an instrument code to a test/component is clinical-catalog knowledge the bench owns, and there's no separate escalation path yet. Sample-matching (binding a record to an accession) is likewise a `results` action. The **new RBAC** will make all of this more granular later.

---

## Data Model (reuse-first)

Carries the existing import models (`QCSample`, `RunQCStatus`, `ImportedResult`, `RunSettings`,
`ReagentLot`) with these multi-component additions:

| Concept | Entity / field | Notes |
|---|---|---|
| Imported analysis | `Analysis` + its `Result` rows | `RESULT` is already one-to-many off `Analysis` |
| **Per-component value** | `RESULT.component_id` → `test_result_component` (OGC-1124) | Where each imported target value lands (nullable = PRIMARY) |
| Component identity / match | `test_result_component.code` (+ optional LOINC, OGC-1128) | The stable match key from the analyzer mapping |
| Analyzer→component mapping | `analyzer_test_map` + component ref (OGC-1129) | Resolves target → (test, component) |
| QC control sample | `QCSample` / control analyses | Run-level QC (distinct from internal-control components) |
| Reagent | `ReagentConsumptionEvent`, `ReagentLot` | Attached on accept; lot source = **analyzer-reported or manual** (no FIFO auto-select) |
| Sample matching | accession lookup (analyzer `Sample` → order/analysis); patient derived from accession | Unresolved → exception queue (unmatched / unordered / unmapped) |

`ImportedResult` gains a `components: [{ componentId, code, label, value, unit, flags, delta, unmapped }]`
array (empty/one for single-component tests). No new patient-result columns on `analysis`/`test`.

---

## Access & Audit
- Runs under the existing analyzer-import identity / results-modify bundle; no new roles.
- Audit: accept → `RESULT_SAVED` per component (keyed to `component_id`); reagent consumption; QC-fail →
  NC event; unmapped-target → the existing unmapped-code Alert/event.

## Localization
Reuse existing import + Results Entry keys; component labels come from the component's own label; "Ct" is a
unit. Add an `label.import.unmappedTarget` string for the exception if not present.

## Dependencies
- OGC-1124 runtime `RESULT.component_id`; OGC-1129 target→component ingestion; OGC-1136 mapping UI + this
  review; OGC-1128 component codes. Manual/RDT control-result persistence (shared with Results Entry) for QC
  on non-analyzer tests.

## Out of Scope
- The QC program / Westgard / Levey-Jennings engine (QC dashboard domain).
- The analyzer connection/transport and parsing (unchanged; connection specs = OGC-1133).
- Merging assays currently modeled as separate tests (deployment decision).

## Open Questions (for this revisit)
1. **Internal-control component vs QC-first control extraction** — confirm the display rule so an IPC/SPC that is *both* an internal-control component and part of QC doesn't appear twice (recommend: QC panel owns run-level control *samples*; per-analysis internal-control *components* show inline, muted).
2. **Delta checks per component** — do we have per-component historical values to delta against at import time, or only per test? (May limit FR-C3 initially.)
3. **Unmapped "map now" flow** — inline mapping vs deep-link to Analyzer Types & Mapping (FR-D2). Deep-link is simpler for v1.
4. Confirm the route + SideNav slot against the live app.
