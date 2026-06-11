# Handoff Brief — Results Entry v4 Redesign Pass

**Author of brief:** Claude Sonnet (current session)
**Recipient:** A heavier model with extended thinking, in a fresh session
**Subject:** Critique and redesign the Results Entry v3 expanded panel + adjacent surfaces, in response to Casey's product feedback (2026-06-10)
**Status:** Self-contained — do not require additional clarification before starting
**Estimated effort:** Half-day of focused thinking + drafting

---

## 1. What you're walking into

OpenELIS Global is an open-source LIMS used in clinical, environmental, and vector-surveillance labs. The Results Entry page is where bench technicians enter test values for pending samples; the Validation page is where supervisors review and release. Both pages just shipped a v3 redesign (PR #142 on `DIGI-UW/openelis-work` — merged 2026-06-01).

The v3 redesign consolidated 6 legacy routes into one `/Results` page with an inline-first expanded panel, polymorphic result cell (numeric / dictionary / multi-checkbox), Storage Location section, NCE-driven Result Disposition, cross-domain support (CLINICAL / ENVIRONMENTAL / VECTOR via Lab Unit), e-signature on Save, opt-in CLSI GP47 form, dual-axis note model.

**Casey Iiams-Hauser** (product lead, `caseyi@uw.edu`) has now reviewed the live mockup and provided substantive feedback. The feedback is sharp and identifies real workflow problems. **Your job is to address it in a v4 design pass on Results Entry primarily — Validation page changes only where directly implicated.**

This is one of the highest-use parts of the application. Getting the panel hierarchy, color contrast, and edit-state machine right matters; getting NCE / Refer-out / Workplan / Reagent Run integration right matters more. Do not rush.

---

## 2. Casey's feedback — verbatim

> When we expand the results, the most important and high use stuff moves to the bottom, this will not be expected and make the user search very hard to find things, the red (critical/invalid) or the yellow (non-normal) color flagging is a little hard to see, and the view is very cluttered. Maybe we can compress some of these. I'd also like to see mockups for the Env and Vector examples for both.
>
> For the history tab, what is the point of this? We don't really look at patient results over time and I'm not sure if the delta part for westgard rules is valid here. I was thinking maybe the history of the test, like previous saved values, any retests ordered, etc. We need to make sure our standard pagination is there for these, so we don't load too many results at once. Rather than "analyzer result" this is actually showing method, and the optional analyzer which performed the result. If the result was imported from an analyzer, this should be prefilled, normally we call the method the analyzer type name if it's from that analyzer, then the specific analyzer dropdown should be WHICH of them (Sometimes with fun names like 4 Cobas taqman being called, Leonardo, Donatello, Michalangelo, and Raphael, etc). Is should display the method and analyzer. In fact, let's rething what we show on each level to make sure it's as useful as possible for the users. If we have setup the workplan and the reagent run features, the reagent info should be added from the analyzer run or the workplan setup, we should check and make sure those match. We also need to pull the real NCE modal to implement here, and make sure to add the rejection workflows. One of those mocked up is to refer out, which is a different feature, so we need to decide how those interact and layer.
>
> What can we do to make the user's life easier, and put the high touch things easy to see.
>
> When there is a result entered and saved, we should not be able to change the result until we click the edit button, at which point it should shift to a save button to save the changes. Same with a save button for if we input values to a non-resulted test.
>
> [Follow-up:] Oh, and maybe we should combine the QC/reagent thing, since there will be both, and maybe we can cut down on the number of separate boxes.

---

## 3. Priority breakdown (Sonnet's read; verify with your own judgement)

### P0 — Workflow / data correctness

1. **"Analyzer Result" column mislabeled.** The current single column actually represents two things: **Method** (e.g. "Cobas TaqMan", "Manual Microscopy", "Point-of-Care") and the specific **Analyzer instance** (e.g. "Leonardo" — one of four Cobas TaqMan machines named after the Ninja Turtles). When a result is imported from an analyzer, Method should prefill from the analyzer type, and Analyzer should prefill with the specific instance. Both should display side-by-side, not be conflated.
2. **Edit-state machine.** Saved results should be **read-only by default**. Show an **Edit** button next to the value; clicking it makes the field editable and swaps the button to **Save**. Same pattern for un-resulted tests: the value field is editable and a **Save** button appears only once a value is entered. This eliminates the current state where typing in a saved row can accidentally overwrite a validated value.
3. **Pull the real NCE modal.** The current inline NCE form is fabricated. OpenELIS has an actual NCE modal in the live app (mgdev.openelis-global.org → any module that surfaces a non-conformity). Identify its real surface, audit its fields against the spec, and pull it in rather than maintaining a parallel inline form.
4. **NCE vs Refer-out layering decision.** The current Result Disposition radio offers Cancel / Reject + reason / Retest / Refer-out as if they're peers, but Refer-out is its own feature (Referrals module — already has its own page, Sample Shipment, and reference-lab-results flow). Decide: does Refer-out remain a Disposition option that *opens* the Referral subsystem, or does it move out of Result Disposition entirely and live as a separate "Refer this test" action button? Document the decision and the data flow either way.
5. **Reagent autofill from Workplan / Analyzer Run.** When the lab has set up a Workplan (per-shift batch of tests with reagent lots assigned) or when a result arrives via an Analyzer Run (analyzer sends reagent lot in the HL7/ASTM payload), the reagent fields on Results Entry should **autofill from those sources** rather than asking the tech to re-enter. Cross-check that the data flowing in matches what the tech would manually enter; surface a discrepancy warning if not.
6. **History tab redefinition.** Today the History tab implies patient-longitudinal + Westgard delta. **Wrong scope.** Redefine as **this analysis's history**: prior saved values, retest orders, validation actions, audit changes. Patient-longitudinal belongs on the patient record; Westgard rules belong on the QC dashboard. Pagination required.

### P1 — Usability / hierarchy

7. **Panel hierarchy inverted.** The v3 design put the action bar at top (good) but pushed the highest-use sections (the result value itself, method, notes) below the read-only Patient Banner + Modification History banner + Critical banner stack. Rethink: the **value + method + analyzer + notes** are the most-touched fields and should be at the top of the expanded panel, with Patient context as a compact strip rather than a full banner. Smart-default-open should target *high-use* sections, not "interesting in some contexts" sections.
8. **Color contrast.** Red (critical / invalid) and yellow (abnormal) flags are not legible enough. Check against Carbon dark mode tokens and WCAG 2.2 AA contrast. Consider switching from background tint to a leading icon + bolder text + Carbon `Tag` with `kind=red`/`magenta`/`warm-gray` semantic types instead of custom CSS colors.
9. **Combine QC + Reagent into one section.** Casey's follow-up: both will be present, both relate to "what equipment / consumables produced this value." Consolidate the current Method & Reagents + QA/QC tab into a single inline section. Look for other compression opportunities — Method/Analyzer/Reagent/QC could plausibly live in one tile rather than four boxes.
10. **Pagination on History tab + anywhere lists are rendered.** Use Carbon `Pagination` with the standard 25/50/100 sizing the rest of the app uses.
11. **General clutter reduction.** Audit every section in the expanded panel. Default-collapsed for low-use; default-open for high-use. Compress visually (denser typography, less generous padding, fewer dividers).

### P1.5 — Deliverable additions

12. **Env + Vector page-state mockups.** Today the Results Entry mockup has one Environmental row (Water Quality E. coli) and one Vector row (mosquito pool Pf PCR) embedded among clinical rows. Casey wants **dedicated mockup states** showing what the page looks like when the tech has selected a Water Quality lab unit (no Patient column at all, Site Banner replacing Patient Banner, regulatory-limit Tag, env-specific Order Info labels) and a Vector Surveillance lab unit (Trap Banner, pool composition surfaced in Aliquots).
13. **Same env + vector states for the Admin Validation Configuration page** (just shipped on `chore/ogc-343-v3-refresh`). The page is already cross-domain-aware in design; produce dedicated screenshots/states demonstrating the env and vector configurations the SILNAS Phase 1 Indonesia deployment will use (Water Quality auto-release, Vector Pool abnormal-only).

---

## 4. Deliverables expected

In one bundle:

1. **An updated Results Entry v4 FRS section** — focused delta. Do NOT rewrite the full FRS; produce a v4 delta document that explains:
   - What changed and why (mapped 1:1 to the feedback items above)
   - New panel hierarchy (with reasoning)
   - NCE / Refer-out / Workplan / Reagent autofill data flow diagrams
   - Edit-state machine state diagram
   - Updated History tab spec (this-analysis-only)
   - Method + Analyzer column split spec
   - Combined QC + Reagent section spec
   - Color contrast remediation
2. **An updated Carbon mockup** (single `.jsx` file) — replaces `designs/results-validation/results-page.jsx`. Must show:
   - The new panel hierarchy with a saved-and-expanded row, an un-resulted row, and an editing-a-saved-row state
   - The real NCE modal pulled in (or a faithful stub of it pending engineering audit)
   - The combined QC + Reagent section
   - Method + Analyzer as two adjacent fields, autofilled from a mock analyzer-import case
   - The History tab populated with this-analysis history + pagination
   - Improved color contrast on critical / abnormal flags
3. **Env + Vector page-state mockups** — either as additional pages in the same mockup file (toggleable via the Lab Unit selector in the demo, which already exists) or as separate dedicated mockup files. Show what the page looks like when Water Quality / Vector Surveillance is the selected lab unit.
4. **HTML preview** matching the JSX, using the existing CDN-Carbon pattern in the repo.
5. **Env + Vector states for the Admin Validation Configuration mockup** — either added to the existing mockup or as additional files.
6. **A short delta document** (1–2 pages) walking the reader through what changed from v3 to v4 and the key design decisions made. This is what Casey will read first; treat it as the executive summary.

All artifacts go in a new feature branch `design/results-entry-v4` off `main`. Open a PR with a clear description tying each commit to a feedback item.

---

## 5. Out-of-scope guardrails

- **Do not touch the multi-level validation pipeline.** It's preserved in v3 and the admin config FRS is on `chore/ogc-343-v3-refresh`. Pretend it's done.
- **Do not redesign the Admin Validation Configuration page itself.** Only add env/vector page-state demos for it.
- **Do not redesign the Validation Page** beyond changes that are direct consequences of Results Entry changes (e.g. if the Method/Analyzer column splits on Results Entry, it must also split on Validation; nothing else changes).
- **Do not touch the Referrals / Sample Shipment / reference-lab-results pages.** Those are separate features (OGC-796 + OGC-797–810).
- **Do not propose new schema elements** unless reuse is impossible. Ground every UI element in real OpenELIS data entities. See "Constraints" below.
- **Do not invent new admin permissions.** OpenELIS admin is binary.
- **Do not introduce Tailwind.** Carbon React only.
- **Do not propose multi-tenancy / per-site filtering.** OpenELIS is single-tenant per deployment.
- **Do not break the consolidation work.** PR #142 merged 2026-06-01 — its content is the live v3 baseline.

---

## 6. Ground-truth resources to consult before designing

You will need to do real audit work, not just iterate on the existing mockup. Specifically:

### The shipped app (most authoritative source — `feedback_openelis_ground_truth` memory rule)
- **mgdev.openelis-global.org** — live OpenELIS instance. Log in (Chrome-saved creds; if not available, use demo.openelis-global.org credentials per `reference_openelis_demo_instance` memory).
- Walk the Results Entry flow end to end with a real lab number. Note: the real expanded row, the real NCE modal (find it from the rejection workflow on Results Entry — it's currently config-gated), the real Method/Analyzer column behavior, the real Reagent capture, the real History view.
- Walk the Workplan flow — how reagent lots get assigned to tests.
- Walk the Analyzer Integration flow — how an analyzer-imported result lands with method + analyzer prefilled (look for any imported result in the recent days).

### The repo (`DIGI-UW/openelis-global-ui` and `DIGI-UW/openelis-global`)
- Front-end: `frontend/src/components/resultPage/` — the React+Carbon implementation of the current Results Entry
- Front-end: the existing NCE modal component (search for `NonConformityModal` or `NCEForm`)
- Back-end: `ResultsRestController`, `WorkplanController`, `ReagentLotController`, `AnalyzerResultsService`
- The existing `Analysis` JPA entity — what columns exist today
- The `audit_trail` table and `@Audited` annotations on validation-relevant entities

### The current v3 artifacts (in `DIGI-UW/openelis-work` on `main`)
- `designs/results-validation/results-page.md` — current v3 FRS
- `designs/results-validation/results-page.jsx` — current Carbon mockup (~2400 lines)
- `designs/results-validation/results-page.html` — CDN-Carbon preview
- `designs/results-validation/validation-page.md` + `.jsx` + `.html`
- `designs/results-validation/admin-validation-configuration.md` + `.jsx` + `.html` (on branch `chore/ogc-343-v3-refresh`)

### Jira tickets (uwdigi.atlassian.net)
- **OGC-517** — Results Entry design (historical anchor)
- **OGC-811** — Results Entry v3 Epic (current consolidated scope)
- **OGC-817** — Validation Page v3 Epic
- **OGC-579** — Multi-level workbench impl story (covers cross-domain rendering scope)
- **OGC-343** — Admin Validation Config (just refreshed)
- **OGC-527** — Vector — Environmental & Vector Testing Module (SILNAS Phase 1 Indonesia parent)
- **OGC-313 – OGC-316** — NCE module (find the real NCE modal here)

---

## 7. Constraints (memory rules — applies)

These are durable rules from prior conversations. Follow them.

- **Schema reuse first.** Ground every UI element in real OpenELIS schema entities. If new schema is required, justify why existing entities (`Analysis`, `Result`, `Audit`, `Site_Information`) cannot be extended.
- **Ground truth is the shipped app + repo, not Figma.** Style guides and patterns derive from `mgdev.openelis-global.org` + the React+Carbon UI repo.
- **Carbon-only mockups.** No Tailwind utility classes. Use `@carbon/react` and `@carbon/icons-react`. Note: `ShieldCheck` doesn't exist in `@carbon/icons-react` — use `Security` if you need that icon.
- **Cross-domain via Lab Unit, not per-result branching.** Lab Unit carries a `domain` attribute (`CLINICAL` / `ENVIRONMENTAL` / `VECTOR` — never `BOTH`). `currentDomain` is derived from the selected Lab Unit.
- **Binary Admin permissions.** Do not invent fine-grained admin sub-permissions.
- **Dual-axis note model.** `visibility` (internal/external) × `context` (entry/modification/validation). Independent axes; external visibility is what flows to the patient report.
- **PII visibility precedence.** Site-wide `showPatientName` overrides role-based `PATIENT_DATA_ON_RESULTS_BY_ROLE`.
- **Save never blocked on critical-ack.** Critical acknowledgment is a follow-up task on the Alerts dashboard, not a Save gate.
- **GP47 read-back is opt-in only** (`criticalNotification.requireReadBack` flag, default OFF for all deployments). Not an ISO 15189 requirement.
- **Inline-first expanded panel pattern preserved.** Action bar at top, sections below, only QA/QC + History as tabs (this last one will change per feedback item #9 — QC merges into the Method/Reagent/Analyzer combined section, so History becomes the *only* tab).
- **No emoji checkmarks in funder-facing materials** (not relevant here; mockups can use whatever Carbon ships).
- **i18n key namespacing.** `label.foo` / `label.foo.env` / `label.foo.vector` with clinical fallback.

---

## 8. Suggested execution sequence

You don't have to follow this, but it's the order Sonnet would attempt:

1. **Audit pass (1 hour).** Walk mgdev.openelis-global.org Results Entry + NCE flow + Workplan + Analyzer Run. Read the front-end source for the current Results Entry implementation and the real NCE modal. Read the v3 mockup. Take notes on every divergence between the v3 mockup and what the app actually does today.
2. **Decision document (30 min).** Write a 1-page decisions doc covering: NCE vs Refer-out layering, Method+Analyzer column split semantics, edit-state machine transitions, panel hierarchy ordering, what's combined into the Method/Reagent/Analyzer/QC section. Land the decisions before you draft code; it's faster.
3. **FRS delta (1 hour).** Produce the focused v4 delta FRS document, not a full FRS rewrite.
4. **Mockup pass (1.5–2 hours).** Update the Carbon mockup. Lead with the new panel hierarchy + edit-state machine + Method/Analyzer split. Then layer in the combined section + NCE modal pull + History tab redefinition + color contrast remediation.
5. **Env + Vector page states (45 min).** Add dedicated states.
6. **HTML preview (30 min).** Match the JSX.
7. **Admin Validation Config env/vector states (30 min).** Smaller addition.
8. **Delta summary (15 min).** The 1–2 page executive summary Casey reads first.
9. **Commit + push** on `design/results-entry-v4`. Open PR.

---

## 9. What success looks like

Casey opens the PR and reads the delta summary first. He should walk away convinced that:
- Each of his feedback items got addressed with a specific design decision and a visible change in the mockup
- The high-use fields are now visibly at the top of the expanded panel
- The edit-state machine is obvious from the mockup without needing to read the FRS
- The Method + Analyzer columns are correctly split and the autofill story is clear
- The real NCE modal is integrated and the Refer-out layering is decided (not punted)
- Env and Vector are first-class, not just inline demo rows
- The view is visibly less cluttered than v3
- Color contrast is fixed

If any of those bullets requires reading the FRS to find, the delta summary failed.

---

## 10. Open questions you may need to ask Casey before finishing

Resolve via best judgement; flag explicitly in the delta summary if any of these need ratification:

- **Edit button per-row or per-cell?** Per-row keeps the UI simpler but locks the entire row's fields together; per-cell (just the value) is finer-grained but visually noisier.
- **NCE modal — pull as a true modal or inline drawer?** The live app uses a modal; the v3 design used inline form. Casey said "pull the real NCE modal" — likely modal, but worth confirming.
- **History tab as a tab vs. inline section?** Casey said History becomes "this analysis's history" which is more focused. Tab is fine, but if it's the only tab left after QC merges into Method/Reagent, consider whether it should become an inline section instead and the tabbed surface goes away entirely.
- **Refer-out — Disposition option that triggers Referral, OR separate action button?** Sonnet recommends: separate action button on the row, NOT a Disposition option (cleaner mental model). Confirm with Casey.

---

End of brief.
