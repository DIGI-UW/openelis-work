# Results Entry v4 — Design Decisions

**Author:** Claude (Fable) takeover session · **Date:** 2026-06-10
**Baseline:** v3 (`upload/results-page-v3-preview.html`, `results-page-v3-frs.md`) — merged PR #142, 2026-06-01
**Scope:** Results Entry expanded panel + row-level behavior. Validation page inherits only the Method/Analyzer column split. Referrals/Sample Shipment untouched.
**Grounded in shipped code:** `OpenELIS-Global-2` @ `develop` — `Analysis.java`, `nonconform/common/InlineNceForm.jsx`, `resultsReferredOut/`.

---

## The eight decisions

### D1 — Edit-state machine: per-row lock
A saved result renders **read-only**. An **Edit** button on the row unlocks *all* editable fields in the expanded panel (value, method, analyzer, reagent, notes) and swaps to **Save**. An un-resulted row is editable on entry, with **Save** appearing once a value is typed. Rationale: per-row is the simpler state machine and protects method/analyzer/reagent on a validated result from silent change — not just the value. (Casey-confirmed.)

States: `EMPTY → (type value) → DIRTY → [Save] → SAVED(read-only) → [Edit] → EDITING → [Save] → SAVED`. Save still carries the e-signature; critical-ack remains a follow-up on the Alerts dashboard, never a Save gate.

### D2 — NCE: pull the real **inline** component, not a modal
**Correction to the handoff brief.** The brief said the inline NCE was "fabricated" and to "pull the real NCE modal." The shipped app has no NCE modal. It has `InlineNceForm.jsx`, whose header reads *"Inline NCE form for embedding in the result entry page… auto-populates context from the result row data,"* posting `analysisId`/`specimenId`/`labOrderNumber` to `/rest/reportnonconformingevent`. So the real surface is inline — which matches Casey's "we only modal destructive actions" rule. v4 pulls the real field set inline. (Casey-confirmed: inline.)

Real field set (authoritative): NCE Number (auto-generated, read-only — `/rest/nce/generate-number`), Reporter Name (session), Date of Event\*, Reporting Unit\* (`TEST_SECTION_ACTIVE`), Category\* (`/rest/nce/categories`), Subcategory (depends on Category), Severity\* (CRITICAL / MAJOR / MINOR cards), Title, Description\*, Immediate Action Taken, Suspected Causes, Proposed Action, Attachments, auto-linked Sample + Result. (\* = required.)

### D3 — Refer-out: separate row action, not an NCE disposition
v3 put "Refer out" as a peer radio inside the NCE Result Disposition. Refer-out is its own feature — `Analysis.referredOut` + the `soSend*` send-out lifecycle + the `resultsReferredOut/` module. v4 removes it from disposition and makes it a distinct **"Refer this test"** row action that hands off to the Referral subsystem. NCE disposition keeps **Cancel / Reject + reason / Retest**. (Casey-confirmed: separate action.)

### D4 — Method + Analyzer: split into two adjacent fields/columns
`Analysis` carries **both** `method` (a `Method` entity — the analyzer *type* / method name, e.g. "Cobas TaqMan", "Manual Microscopy") and `analyzerId` (the specific instrument instance, e.g. "Leonardo"). v3's single "Analyzer Result" column conflated them. v4 shows **Method** and **Analyzer** as two adjacent fields. On analyzer import, Method prefills from the analyzer type and Analyzer prefills with the instance. The Validation page inherits this split (only change there).

### D5 — Combine Method / Analyzer / Reagents / QC into one section
v3 had a "Method & Reagents" section *and* a separate "QA/QC" tab. Casey: "combine the QC/reagent thing… cut down on the number of separate boxes." v4 merges into one inline tile: **"Method, Analyzer, Reagents & QC"** — Method + Analyzer fields, Reagent lots (autofilled, see D6), and the QC pass/fail control block, in one place. This is "what equipment / consumables produced this value," together.

### D6 — Reagent autofill from Workplan / Analyzer Run
When a Workplan assigned reagent lots for the shift, or an Analyzer Run delivered the lot in its payload, the reagent fields **autofill from that source** rather than asking the tech to re-key. A source tag ("From Analyzer Run" / "From Workplan" / "Manual") shows provenance, and a discrepancy warning fires if the autofilled lot doesn't match what's expected. Dependency to verify with engineering: that the Analyzer Run / Workplan payload exposes lot at the analysis level.

### D7 — History: redefine as **this-analysis** history, inline section, paginated
v3's History tab showed patient-longitudinal values + a Westgard delta check — wrong scope (none of that lives on `Analysis`; it belongs on the patient record / QC dashboard). v4 redefines History as *this analysis's* history, all grounded in `Analysis` fields: prior saved values (`revision`), status transitions (`enteredDate → startedDate → completedDate → releasedDate → printedDate`), retests/reflexes (`children`, `triggeredReflex`), corrections (`correctedSincePatientReport`), bound Notes, and `audit_trail` changes. With QC merged into D5, History is the **only** remaining tab — so it becomes a default-collapsed **inline section**, not a tab strip. Paginated with the standard 25/50/100. (Casey-confirmed: inline.)

### D8 — Panel hierarchy + clutter + contrast
**Hierarchy (inverted from v3):** lead the expanded panel with the high-touch fields — **Result value + Method + Analyzer + units/range/flags**, with Edit/Save — then the combined Method/Analyzer/Reagents/QC section, then Notes/Interpretation. Patient context drops from a full banner to a **compact strip**. Lower-use sections (Order Info, Program Info, Storage, Attachments, History) are **default-collapsed**. Smart-default-open targets high-use, not "interesting in some contexts."

**Contrast:** replace custom CSS tints with **leading icon + Carbon `Tag` + bold text** at WCAG 2.2 AA. Critical/invalid = `kind=red` with a filled warning icon; non-normal/abnormal = a high-contrast `warm-gray`/amber tag with a directional arrow and bold value (not a faint yellow wash). The value cell keeps a left accent bar for scannability, but legibility no longer depends on the tint alone.

### D9 — Sticky section layout (browser-local), with per-result auto-open
The expanded panel remembers which reference-zone sections the user expands/collapses, and reapplies that layout on the next result and after reload — "they opened Interpretation last time, surface it this time." Precedence: **remembered user choice > per-result auto-open > collapsed-with-summary.** Per-result auto-open fires when *this* analysis has notable content (e.g. an interpretation rule fired). Stored **browser-local** (per workstation) — no new schema, no server round-trip; a tech can re-tune in seconds and a `Reset layout` control restores defaults. Server-side per-user sync is explicitly deferred (would need a new UI-preference store OpenELIS doesn't have today). (Casey-confirmed: browser-local.)

### D10 — Notes are the full dual-axis composer (parity with Validation)
Notes on Results Entry use the same model as the Validation page: every note carries a **context** (Entry / Modification / Validation — auto-set; "Entry" on a fresh result, "Modification" when editing a saved one) and a **visibility** (🔒 In Lab Only / 📤 Send with Result). External visibility is what flows to the patient/clinician report, and selecting it shows the "this note will appear on the patient report" confirmation. The composer (visibility selector + context tag + text + save/cancel) lives in the work zone, not a buried section.

### D11 — Reagent capture *is* the reagent-usage model (not a stand-in)
The combined section's reagent capture adopts the established reagent-usage design rather than a simplified table: the **v2.1 per-test reagent list** (driven by `reagentCaptureMode` HIDDEN/OPTIONAL/REQUIRED, FIFO lot cards, Quantity Used + Unit, low-stock warning, override-reason) where the Test Catalog → Method → Reagent linkage exists, falling back to the **v1 free-form name/lot ComboBox picker** until that linkage ships. Both write the same `ReagentConsumptionEvent` (`sourceType=RESULT_ENTRY`) and auto-credit on void/downward edit. Analyzer-imported results render the lot **read-only** ("analyzer-reported", capture mode HIDDEN). This refines D5: Method + Analyzer live in the **work zone** (high-touch identity, prefilled from the analyzer), so the combined section is "**Reagents, QC & Controls**" and does not duplicate them. Dependency: Test Catalog→Method→Reagent linkage is not yet built (interim = v1 picker).

### D12 — Per-run control result capture (RDT line + manual QC value)
The combined section captures a control for the reagent/kit/test: for an **RDT**, the control-line outcome (**Valid / Invalid**, with control lot; Invalid blocks reporting and prompts a repeat); for a **manual quantitative** test, a control **value vs expected + Pass/Fail** with control level and lot. The form adapts to test type (parity with the polymorphic result cell). Dependency: confirm where a bench-entered (non-analyzer) control result is stored — OpenELIS has analyzer QC, but manual/RDT control persistence needs verification (possible small new entity or reuse of a QC-result table).

### D12a — QC expected value & uncertainty are tech-entered
OpenELIS has no way to know a manual control's target, so the QC control block does **not** display a hardcoded expected value. The tech enters **Expected value** and **Uncertainty (±)** alongside the measured value and Pass/Fail; these prefill only if a target range is configured for that QC lot. (Same principle applies to measurement uncertainty generally — system can't infer it.)

### D13 — Sample status: partial use + used-up → disposal
A **Sample status** control in the Storage section tracks the `SampleItem`'s **remaining volume**. The tech can **record an amount used this test** (partial consumption — decrements remaining, sample stays available), or **mark it used up** (exhausted). Full exhaustion (remaining hits 0) or an explicit "Mark used up" queues the item into the disposal workflow (disposal records who/when/method). Grounds on `SampleItem` status + storage-module disposal path. Dependencies: confirm `SampleItem` tracks a **remaining-volume** field, and confirm the disposal hand-off.

### D15 — Interpretation entry: rule buckets + macro + free text
The Interpretation section is an editor, not a read-only suggestion. Three entry paths: (1) **rule** — categorical interpretation buckets configured on the test (e.g. Normal 70–99 / Impaired Fasting Glucose 100–125 / Diabetes ≥126), auto-matched to the entered value; picking a bucket applies its text; (2) **macro** — canned phrases inserted into the text; (3) **free text**. Rule text is a non-binding suggestion until applied/edited. Grounds on the test's interpretation rule config + a result interpretation field.

### D14 — Bench extras: dilution, replicates, instrument flags (open-vial deferred)
Also in the combined section: **dilution factor** (reported result = entered value × dilution — quantitative only, since it changes the reported value); **replicate / repeat values** behind a collapsed toggle (Rep 1–3 + mean, for manual/QC duplicate runs); **instrument flags** shown read-only when an analyzer sends them (clot, error codes, out-of-linear-range). **Reagent open-vial / first-use date is deferred** — it's a lot attribute that belongs in reagent/lot management, not per-result bench capture. (Casey-confirmed picks.)

### D16 — Refer-out is an inline form, not just a flag
The "Refer this test" row action opens an inline referral form: **reference laboratory** (required), **reason for referral** (required), and **referral date/time** defaulting to now (editable). No "test to perform" field — the referred test is already known. Saving hands off to the Referrals / Sample Shipment subsystem (which this work does not modify). Refines D3.

### D17 — Interpretation macro insertion is type-to-search
Macros are inserted via a **type-to-search field** (start typing a macro code like `REPEAT`/`HEMOLYZED` or its name; matches filter live; click to insert the phrase into the free text) — not a static dropdown. Complements D15.

### D18 — Aliquoting available in this view (all domains)
The expanded panel includes an **Aliquots** section that reuses the existing aliquot function: list existing aliquots and **create aliquot(s)** (count, type/species, volume/count, storage destination). Child sample items use numbering `LABNO.X` (`LABNO.X-Y` for vector sub-pools / deconvolution) and inherit storage + chain-of-custody. **Vector pool composition (species + count) is tech-entered** (from morphological sorting / field collection) — the system does not infer it, same principle as D12a.

### D20 — Validation bulk release: guarded "Release all clear" + lanes, gated by an Admin feature flag
Replaces the v3 "Save All Results / Save All Normal / Retest All" select-helpers. The validation queue splits into a computed **Clear-to-release** lane (in-range AND QC-pass AND no delta AND not modified-after-save AND not critical AND confidently range-matched AND not nonconforming) and a **Needs-review** lane (everything else). **Fail-safe:** missing/indeterminate clearance inputs (e.g. uncaptured manual QC, range fell back to default) exclude a row from Clear — never assumed clear. QC-fail is analyzer-derived today; manual/RDT QC depends on the control-persistence dependency, and absent that, manual tests resolve to needs-review (a blank signal cell is never "QC confirmed"). A single **"Release all clear (N)"** bulk action operates only on the Clear lane, shows lane counts, and opens a **scannable confirm list** (test · value · range · flag) that the e-signature attests to. Critical/abnormal/flagged results can only be released **per-row** after opening the panel (criticals still require acknowledgment first). **Rejection is recorded as an NCE** — the same real inline NCE form as Results Entry (category/subcategory/severity/description + disposition Reject/Cancel), not a bare reason dropdown. **Retest is "Send for re-testing" with a note** whose required-ness is itself an **Admin → Validation Configuration** flag (exists today); per-row, with bulk retest only via explicit multi-select. The whole bulk-release capability is a separate **feature flag in Admin → Validation Configuration** — off = per-row only (lean on auto-validation for throughput). So Admin → Validation Configuration carries at least two flags surfaced here: *allow bulk release of clear results* and *retest note required*. **Why:** the v3 "Save All Results" could one-click release unreviewed critical/abnormal values; this makes that structurally impossible while preserving throughput. Casey-confirmed 2026-06-10.

### D22 — One consolidated "Results & Validation Configuration" admin page
Retire the flat select-row/Modify **Result Entry Configuration** table *and* the binary "validate all results" toggle; consolidate everything onto **one** page — name confirmed **"Result & Validation Configuration"** (Casey, 2026-06-10). No split between result-entry and validation config. The legacy *Result Entry Configuration* route **redirects** to the consolidated page (old page retired, not a second editor). The page holds: the structured **validation policy** (lab-wide default trigger + 0–5 levels + role bindings + per-lab-unit overrides — absorbs `validate all results`), plus every still-relevant legacy setting rendered as **plain-language toggles grouped by purpose** (Result entry / Modification-rejection-retest / Release & display / Access & PII), plus the two new flags (bulk-release of clear results, retest-note-required). **UX upgrade:** toggles not select-row+Modify; dependent settings indent/disable; inline role select; critical-message text field; live effective-config preview; each control keeps its real config key as a mono tag for traceability. **Labels rewritten** from cryptic keys to human language (e.g. `ResultTechnicianName` → "Require technician name on results"). **Domain-based config *suggestions* dropped** — validation posture is a regulatory decision the lab owns; a new override simply inherits the lab-wide default (domain *badge* kept as fact). Crosswalk of the 13 legacy settings → v4 controls captured for the FRS. Casey-confirmed 2026-06-10.

### D21 — Validation triage view: lean columns + Review signals + filters
The validation table is designed for triage. **Hidden** (moved to the expanded review panel): Method, Analyzer, and the separate Sex/Age and Current-result columns (sex/age fold into the subject line and feed the range; prior value becomes the Delta signal). **Added:** a **"Check before release"** column that renders chips only when a row carries risk — `⚠ NCE open`, `✕ QC fail`, `✎ Modified`, `Ack pending`, `⚠ Nonconforming` — so a clean row is empty and the chips are exactly what put a row in the needs-review lane (the column and lanes reinforce each other). The expanded panel echoes them as a "Why this needs review" line. **Filters:** a chip row filters the queue by signal/flag (All · Needs review · NCE · QC fail · Modified · Delta · Ack pending · Critical · Abnormal) with counts; the Clear lane / "Release all clear" is computed from the whole queue, not the active filter, so bulk release stays meaningful. These are *meaningful* icons (status/provenance), which D19's no-ornamental-icons rule permits. Grounds: NCE (`non_conformity_event` link), QC (analyzer QC / manual control — a Westgard control violation surfaces as QC fail), Modified (`Analysis.correctedSincePatientReport`/revision), Critical-ack (alerts `criticalAckStatus`), Nonconforming (`SampleQaEvent`). **Patient delta-check is deliberately excluded** as a default signal: it's a per-patient longitudinal comparison (catches mislabeling, noisy for analytes that legitimately swing), it's the patient-longitudinal scope D7 places on the patient record not here, and OpenELIS doesn't track patient deltas at this layer today. (Distinct from Westgard, which is control-based and already covered by the QC signal.) If a lab wants delta checks, that's a separate configurable per-analyte feature, not a standing chip. Casey-confirmed 2026-06-10.

### D19 — No decorative leading icons in the context strip
The compact context strip carries no ornamental leading icon (removed the patient avatar circle, the 🚰 site glyph, and the 🦟 trap glyph). Identity/state reads from text + Carbon `Tag`s only — icons are reserved for things that carry real meaning (status, provenance). Extends the contrast/clutter stance in D8.

---

## Cross-domain (Lab Unit drives everything)
`currentDomain` derives from the selected Lab Unit (`CLINICAL` / `ENVIRONMENTAL` / `VECTOR` — never `BOTH`). v4 ships dedicated page states:
- **Water Quality (ENVIRONMENTAL):** no Patient column; **Site Banner** replaces Patient Banner; regulatory-limit `Tag` replaces clinical reference range; env Order Info labels (Sampling Point, Source Type).
- **Vector Surveillance (VECTOR):** **Trap Banner**; pool composition surfaced in Aliquots; species/pool-size context.

## Guardrails honored
No new schema (every field traces to `Analysis`/`Result`/`Method`/NCE/Site_Information). No multitenancy / site filters. No invented admin permissions (binary admin + existing role bundles). Carbon-only. Dual-axis note model preserved. GP47 read-back stays opt-in. Consolidation work (PR #142) is the live baseline.

## Open items flagged for Casey
- **D6 dependency:** confirm Analyzer Run / Workplan exposes reagent lot at analysis granularity (else autofill is Workplan-only at first).
- **D11 dependency:** Test Catalog → Method → Reagent linkage not yet built — interim is the v1 free-form picker.
- **D12 dependency:** confirm persistence for bench-entered (manual/RDT) control results.
- **D13 dependency:** confirm the SampleItem disposal hand-off in the storage module.
- **NCE disposition placement:** v4 keeps Cancel/Reject/Retest inside the NCE form (filing an NCE *is* the rejection workflow). If you'd rather disposition be selectable without filing a full NCE, say so — that's a branch point.
- ~~Sticky-layout storage~~ — **resolved: browser-local (D9).**
